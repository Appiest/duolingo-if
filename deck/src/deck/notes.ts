"use client";

// Whether the rehearsal strip is on screen. It lives outside React because the
// server cannot know what this presenter chose last time: the server snapshot
// is always "shown", and the client reads the stored preference on its first
// snapshot instead of setting state from an effect.
const storageKey = "pawnzy-deck:notes";

let current: boolean | null = null;
const listeners = new Set<() => void>();

// Storage throws in a private window or with site data blocked, and the deck
// has to open either way.
function readStored(): boolean {
  try {
    return window.localStorage.getItem(storageKey) !== "hidden";
  } catch {
    return true;
  }
}

function write(shown: boolean) {
  try {
    window.localStorage.setItem(storageKey, shown ? "shown" : "hidden");
  } catch {
    // A presenter who cannot persist the choice can still toggle it.
  }
}

export function subscribeToNotes(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function notesShown(): boolean {
  if (current === null) current = readStored();
  return current;
}

export function notesShownOnServer(): boolean {
  return true;
}

export function toggleNotes() {
  current = !notesShown();
  write(current);
  for (const listener of listeners) listener();
}
