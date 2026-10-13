"use client";

import { CaretLeft, CaretRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const { send, failed } = useSender(room);
  useWakeLock();
  return (
    <main className="flex h-dvh touch-manipulation flex-col gap-4 bg-stage p-4 select-none">
      <LinkStatus link={failed ? "failed" : link} />
      <RemoteButton label="Previous slide" onPress={() => send("previous")} className="h-28 bg-stage-sunken text-ink">
        <CaretLeft size={40} weight="bold" />
        Back
      </RemoteButton>
      <RemoteButton label="Next slide" onPress={() => send("next")} className="flex-1 bg-green text-white shadow-[0_6px_0_var(--color-green-edge)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-green-edge)]">
        Next
        <CaretRight size={64} weight="bold" />
      </RemoteButton>
    </main>
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
  const send = (command: RemoteCommand) => {
    navigator.vibrate?.(TAP_BUZZ_MS);
    queue.current = queue.current
      .then(() => sendRemote(room, "deck", command))
      .then(() => setFailed(false))
      .catch(() => setFailed(true));
  };
  return { send, failed };
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
  connecting: { text: "Looking for the deck…", className: "bg-stage-sunken text-ink-muted", icon: <span className="size-3 animate-pulse rounded-full bg-blue" /> },
  paired: { text: "Connected to the deck", className: "bg-green-wash text-green-text", icon: <CheckCircle size={24} weight="fill" /> },
  failed: { text: "That tap didn’t send. Check your signal and tap again.", className: "bg-red-wash text-red-text", icon: <WarningCircle size={24} weight="fill" className="shrink-0" /> },
};

function LinkStatus({ link }: { link: Link }) {
  const status = STATUS[link];
  return (
    <p role="status" className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-2 text-lg font-extrabold ${status.className}`}>
      {status.icon}
      {status.text}
    </p>
  );
}

type RemoteButtonProps = { label: string; onPress: () => void; className: string; children: ReactNode };

function RemoteButton({ label, onPress, className, children }: RemoteButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className={`flex items-center justify-center gap-3 rounded-[28px] text-4xl font-black transition-[scale,translate,box-shadow] duration-100 active:scale-[0.96] ${className}`}
    >
      {children}
    </button>
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
