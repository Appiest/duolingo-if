"use client";

import { useEffect } from "react";

type Commands = {
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  notes: () => void;
};

const keyActions: Record<string, keyof Commands | "fullscreen"> = {
  ArrowRight: "next",
  ArrowDown: "next",
  PageDown: "next",
  " ": "next",
  Enter: "next",
  ArrowLeft: "previous",
  ArrowUp: "previous",
  PageUp: "previous",
  Backspace: "previous",
  Home: "first",
  End: "last",
  f: "fullscreen",
  F: "fullscreen",
  n: "notes",
  N: "notes",
};

export function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen();
}

export function useDeckControls(commands: Commands) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const action = keyActions[event.key];
      if (!action) return;
      event.preventDefault();
      if (action === "fullscreen") toggleFullscreen();
      else commands[action]();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commands]);
}
