"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Draft } from "@/deck/scriptDraft";

export type SaveState = "saved" | "saving" | "failed" | "conflict";

export type Undo = { label: string; draft: Draft };

const SAVE_DELAY_MS = 600;

async function save(draft: Draft, base: Draft): Promise<SaveState> {
  try {
    const response = await fetch("/api/script", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft, base }) });
    if (response.status === 409) return "conflict";
    return response.ok ? "saved" : "failed";
  } catch {
    return "failed";
  }
}

function same(a: Draft, b: Draft) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDraft(initial: Draft, editable: boolean) {
  const [draft, setDraft] = useState(initial);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [undo, setUndo] = useState<Undo | null>(null);
  const latest = useRef(initial);
  const onDisk = useRef(initial);
  const pending = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const attempt = useRef(0);

  // The dev server re-renders this page with fresh props whenever the script
  // files change on disk, so take those changes in unless an edit is mid-save.
  useEffect(() => {
    if (pending.current || same(initial, onDisk.current)) return;
    onDisk.current = initial;
    latest.current = initial;
    setDraft(initial);
    setUndo(null);
  }, [initial]);

  const saveLatest = useCallback(async () => {
    const thisAttempt = ++attempt.current;
    const saving = latest.current;
    const result = await save(saving, onDisk.current);
    if (result === "saved") onDisk.current = saving;
    if (thisAttempt !== attempt.current) return;
    pending.current = result !== "saved";
    setSaveState(result);
  }, []);

  const change = useCallback(
    (edit: (draft: Draft) => Draft, undoLabel?: string) => {
      if (!editable) return;
      setUndo(undoLabel ? { label: undoLabel, draft: latest.current } : null);
      latest.current = edit(latest.current);
      pending.current = true;
      setDraft(latest.current);
      setSaveState("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(saveLatest, SAVE_DELAY_MS);
    },
    [editable, saveLatest],
  );

  const retry = useCallback(() => {
    setSaveState("saving");
    void saveLatest();
  }, [saveLatest]);

  return { draft, change, saveState, retry, undo };
}
