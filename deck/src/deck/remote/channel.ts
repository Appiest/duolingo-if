// The phone remote and the deck talk through ntfy.sh, a free public message
// relay, so they work on any network: venue Wi-Fi, a hotspot, or the phone on
// cellular. Each deck gets its own random room name, and the phone learns it
// from the pairing QR code.
const RELAY = "https://ntfy.sh";
const TOPIC_PREFIX = "pawnzy-deck";

export type RemoteCommand = "next" | "previous" | "hello" | "paired";

// Which end of the pair listens to a message: the deck takes commands, and the
// phone hears back that the deck saw it.
type Listener = "deck" | "phone";

function topic(room: string, listener: Listener) {
  return `${TOPIC_PREFIX}-${room}-${listener}`;
}

export async function sendRemote(room: string, listener: Listener, command: RemoteCommand) {
  const response = await fetch(`${RELAY}/${topic(room, listener)}`, { method: "POST", body: command });
  if (!response.ok) throw new Error(`The relay answered ${response.status}`);
}

type RelayEvent = { id: string; event: string; message?: string };

const commands = new Set<string>(["next", "previous", "hello", "paired"]);

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
