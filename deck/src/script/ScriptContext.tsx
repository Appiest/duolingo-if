"use client";

import { createContext, useContext } from "react";
import type { Draft } from "@/deck/scriptDraft";

type ScriptTools = {
  editable: boolean;
  speakers: string[];
  freshId: string | null;
  change: (edit: (draft: Draft) => Draft, undoLabel?: string) => void;
  create: (edit: (draft: Draft, id: string) => Draft) => void;
};

export const ScriptContext = createContext<ScriptTools | null>(null);

export function useScript(): ScriptTools {
  const tools = useContext(ScriptContext);
  if (!tools) throw new Error("useScript needs a ScriptContext provider");
  return tools;
}

const SPEAKER_COLORS = 7;

export function speakerColor(speakers: string[], speaker: string): string {
  const index = Math.max(speakers.indexOf(speaker), 0) % SPEAKER_COLORS;
  return `var(--color-speaker-${index + 1})`;
}
