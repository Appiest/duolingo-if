"use client";

import { CaretLeft, CaretRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { listenForRemote, sendRemote, type RemoteCommand } from "./channel";

type Link = "connecting" | "paired" | "failed";

const HELLO_RETRY_MS = 4000;
const TAP_BUZZ_MS = 12;

const ROOM_NAME = /^[a-z0-9]{6,32}$/;

export function RemoteControl({ room }: { room: string | null }) {
  if (!room || !ROOM_NAME.test(room)) return <MissingRoom />;
  return <Clicker room={room} />;
}

function Clicker({ room }: { room: string }) {
  const link = usePairing(room);
  const { send, failed, lastSent } = useSender(room);
  const gesture = useTapOrSwipe({ onTap: () => send("next"), onSwipeBack: () => send("previous") });
  useWakeLock();
  return (
    <main className="h-dvh touch-none bg-rehearsal select-none">
      <button type="button" aria-label="Next slide" {...gesture} className="flex size-full flex-col p-4 text-white">
        <LinkStatus link={failed ? "failed" : link} />
        <span className="relative flex flex-1 flex-col items-center justify-center gap-4">
          <SentPulse sent={lastSent} />
          <CaretRight size={140} weight="bold" className="text-green" />
          <span className="text-3xl font-black">Tap anywhere for next</span>
        </span>
        <span className="flex items-center justify-center gap-2 pb-4 text-lg font-bold text-ink-faint">
          <CaretLeft size={22} weight="bold" />
          Swipe right to go back
        </span>
      </button>
      <button type="button" onClick={() => send("previous")} className="sr-only">
        Previous slide
      </button>
    </main>
  );
}

const SWIPE_DISTANCE = 60;

// The whole screen is one button, so it works without looking: a tap goes
// forward and a swipe to the right goes back. Keyboard and screen reader
// presses arrive as a click with no pointer, and count as a tap.
function useTapOrSwipe({ onTap, onSwipeBack }: { onTap: () => void; onSwipeBack: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      if (!start.current) return;
      const moveX = event.clientX - start.current.x;
      const moveY = event.clientY - start.current.y;
      start.current = null;
      if (moveX > SWIPE_DISTANCE && Math.abs(moveX) > Math.abs(moveY)) onSwipeBack();
      else onTap();
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) onTap();
    },
  };
}

type Sent = { command: RemoteCommand; count: number } | null;

// A ring that flashes from the middle on every tap or swipe, so a glance
// confirms the phone took it.
function SentPulse({ sent }: { sent: Sent }) {
  if (!sent) return null;
  const back = sent.command === "previous";
  return (
    <span key={sent.count} className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      <span className={`size-72 animate-[remote-pulse_450ms_ease-out_forwards] rounded-full ${back ? "bg-ink-faint" : "bg-green"}`} />
    </span>
  );
}

// Says hello until the deck answers, so the phone can be scanned before or
// after the deck is opened.
function usePairing(room: string): Link {
  const [link, setLink] = useState<Link>("connecting");
  useEffect(() => {
    let paired = false;
    const hello = () => {
      if (!paired) void sendRemote(room, "deck", "hello").catch(() => setLink("failed"));
    };
    const stop = listenForRemote(
      room,
      "phone",
      (command) => {
        if (command !== "paired") return;
        paired = true;
        setLink("paired");
      },
      hello,
    );
    const retry = window.setInterval(hello, HELLO_RETRY_MS);
    return () => {
      stop();
      window.clearInterval(retry);
    };
  }, [room]);
  return link;
}

// Sends taps one at a time, in order, so two quick taps never arrive swapped.
function useSender(room: string) {
  const queue = useRef(Promise.resolve());
  const [failed, setFailed] = useState(false);
  const [lastSent, setLastSent] = useState<Sent>(null);
  const send = (command: RemoteCommand) => {
    navigator.vibrate?.(TAP_BUZZ_MS);
    setLastSent((previous) => ({ command, count: (previous?.count ?? 0) + 1 }));
    queue.current = queue.current
      .then(() => sendRemote(room, "deck", command))
      .then(() => setFailed(false))
      .catch(() => setFailed(true));
  };
  return { send, failed, lastSent };
}

// Keeps the phone screen on for the whole talk.
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      void navigator.wakeLock?.request("screen").then((sentinel) => (lock = sentinel)).catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, []);
}

const STATUS: Record<Link, { text: string; className: string; icon: ReactNode }> = {
  connecting: { text: "Looking for the deck…", className: "bg-white/10 text-white", icon: <span className="size-3 animate-pulse rounded-full bg-blue" /> },
  paired: { text: "Connected to the deck", className: "bg-green-wash text-green-text", icon: <CheckCircle size={24} weight="fill" /> },
  failed: { text: "That tap didn’t send. Check your signal and tap again.", className: "bg-red-wash text-red-text", icon: <WarningCircle size={24} weight="fill" className="shrink-0" /> },
};

function LinkStatus({ link }: { link: Link }) {
  const status = STATUS[link];
  return (
    <span role="status" className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2 text-lg font-extrabold ${status.className}`}>
      {status.icon}
      {status.text}
    </span>
  );
}

function MissingRoom() {
  return (
    <main className="flex h-dvh flex-col justify-center gap-4 bg-stage p-6">
      <h1 className="text-3xl font-black text-ink">Scan the code on the deck</h1>
      <p className="text-lg font-bold text-ink-muted">Press P on the presenting laptop to show it. The code links this phone to that deck.</p>
    </main>
  );
}
