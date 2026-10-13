// The phone remote and the deck talk through ntfy.sh, a free public message
// relay, so they work on any network: venue Wi-Fi, a hotspot, or the phone on
// cellular. Each deck gets its own random room name, and the phone learns it
// from the pairing QR code.
const RELAY = "https://ntfy.sh";
const TOPIC_PREFIX = "pawnzy-deck";

// The phone sends next, previous and hello. The deck sends ready when it starts
// listening and paired in answer to a hello.
export type RemoteCommand = "next" | "previous" | "hello" | "ready" | "paired";

// Which end of the pair listens to a message: the deck takes commands, and the
// phone hears back that the deck saw it.
type Listener = "deck" | "phone";

function topic(room: string, listener: Listener) {
  return `${TOPIC_PREFIX}-${room}-${listener}`;
}

const RETRY_DELAYS_MS = [300, 1000];

export class RelayRefused extends Error {
  constructor(readonly status: number) {
    super(`The relay answered ${status}`);
  }
}

async function post(url: string, command: RemoteCommand) {
  const response = await fetch(url, { method: "POST", body: command });
  if (!response.ok) throw new RelayRefused(response.status);
}

// A phone moving between Wi-Fi and cellular drops the odd request, so a send
// that never reached the relay is tried three times. A refusal is not retried:
// the relay limits requests per network, and retrying would use up more.
export async function sendRemote(room: string, listener: Listener, command: RemoteCommand) {
  const url = `${RELAY}/${topic(room, listener)}`;
  for (const delay of RETRY_DELAYS_MS) {
    try {
      return await post(url, command);
    } catch (error) {
      if (error instanceof RelayRefused) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }
  await post(url, command);
}

// What to tell the presenter when a send fails for good.
export function sendFailureReason(error: unknown): string {
  if (error instanceof RelayRefused && error.status === 429) return "Too many taps for the free relay. Wait a minute, then tap again.";
  if (error instanceof RelayRefused) return `The relay refused the tap (error ${error.status}). Tap again.`;
  return "This network blocked the tap. Switch the phone to cellular or another Wi-Fi.";
}

type RelayEvent = { id: string; event: string; message?: string };

const commands = new Set<string>(["next", "previous", "hello", "ready", "paired"]);

function isCommand(message: string | undefined): message is RemoteCommand {
  return message !== undefined && commands.has(message);
}

// Listens until the returned function is called. A reconnect can replay a
// message, so each message id is acted on once.
export function listenForRemote(room: string, listener: Listener, onCommand: (command: RemoteCommand) => void, onOpen?: () => void) {
  const source = new EventSource(`${RELAY}/${topic(room, listener)}/sse`);
  const seen = new Set<string>();
  source.onopen = () => onOpen?.();
  source.onmessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as RelayEvent;
    if (data.event !== "message" || seen.has(data.id) || !isCommand(data.message)) return;
    seen.add(data.id);
    onCommand(data.message);
  };
  return () => source.close();
}

const roomKey = "pawnzy-deck:remote-room";

function newRoom() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

// The same room survives a reload, so a paired phone keeps working.
export function deckRoom(): string {
  try {
    const stored = window.localStorage.getItem(roomKey);
    if (stored) return stored;
    const room = newRoom();
    window.localStorage.setItem(roomKey, room);
    return room;
  } catch {
    return newRoom();
  }
}

const REMOTE_PAGE = "https://appiest.github.io/duolingo-if/present/remote/";

export function remoteUrl(room: string) {
  return `${REMOTE_PAGE}?room=${room}`;
}
