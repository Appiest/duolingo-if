"use client";

import { ArrowClockwise, CheckCircle, CircleNotch, PencilSimpleLine, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { formatDuration, renameSpeaker } from "@/deck/scriptDraft";
import { speakerColor, useScript } from "./ScriptContext";
import type { SaveState } from "./useDraft";

const TARGET_SECONDS = 120;

type ScriptHeaderProps = { seconds: number; pending: number; saveState: SaveState; onRetry: () => void };

export function ScriptHeader({ seconds, pending, saveState, onRetry }: ScriptHeaderProps) {
  const { editable } = useScript();
  return (
    <header className="z-10 sm:sticky sm:top-0 bg-stage/90 shadow-[0_1px_0_var(--color-line)] backdrop-blur">
      <div className="mx-auto flex max-w-[1040px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-8">
        <h1 className="text-3xl font-black text-ink">Script</h1>
        <RunningTime seconds={seconds} />
        <div className="ml-auto flex items-center gap-4">
          {editable ? <SaveStatus state={saveState} onRetry={onRetry} /> : <p className="text-sm font-bold text-ink-muted">Read-only. Run the deck locally to edit.</p>}
          <Link href="/" className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-white hover:bg-black focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none">
            Open deck
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1040px] flex-wrap items-center gap-2 px-4 pb-3 sm:px-8">
        <SpeakerRoster />
        {pending > 0 && <PendingNote count={pending} />}
      </div>
    </header>
  );
}

function RunningTime({ seconds }: { seconds: number }) {
  const over = seconds - TARGET_SECONDS;
  const fill = Math.min(seconds / TARGET_SECONDS, 1) * 100;
  return (
    <div className="flex items-center gap-3" title="Estimated at 150 words a minute">
      <p className="text-lg font-black text-ink tabular-nums">
        {formatDuration(seconds)}
        <span className="ml-1.5 text-sm font-bold text-ink-muted">of {formatDuration(TARGET_SECONDS)}</span>
      </p>
      <div
        role="meter"
        aria-label="Estimated speaking time"
        aria-valuemin={0}
        aria-valuemax={TARGET_SECONDS}
        aria-valuenow={Math.round(seconds)}
        aria-valuetext={`${formatDuration(seconds)} of ${formatDuration(TARGET_SECONDS)}`}
        className="h-2 w-28 overflow-hidden rounded-full bg-stage-sunken"
      >
        <div className={`h-full rounded-full ${over > 0 ? "bg-red" : "bg-green"}`} style={{ width: `${fill}%` }} />
      </div>
      {over > 0 && <p className="text-sm font-extrabold text-red-text tabular-nums">{formatDuration(over)} over</p>}
    </div>
  );
}

const saveViews = {
  saved: { icon: <CheckCircle size={18} weight="fill" className="text-green" />, text: "Saved" },
  saving: { icon: <CircleNotch size={18} weight="bold" className="animate-spin text-ink-faint motion-reduce:animate-none" />, text: "Saving" },
  failed: { icon: <WarningCircle size={18} weight="fill" className="text-red" />, text: "Couldn’t save. Is npm run dev still running?" },
  conflict: { icon: <WarningCircle size={18} weight="fill" className="text-red" />, text: "The script changed outside this tab, so your last edit didn’t save." },
};

const saveRecovery: Partial<Record<SaveState, { label: string; act: (retry: () => void) => void }>> = {
  failed: { label: "Try again", act: (retry) => retry() },
  conflict: { label: "Load the latest", act: () => window.location.reload() },
};

function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const view = saveViews[state];
  const recovery = saveRecovery[state];
  return (
    <p className="flex items-center gap-1.5 text-sm font-bold text-ink-muted" role="status">
      {view.icon}
      {view.text}
      {recovery && (
        <button type="button" onClick={() => recovery.act(onRetry)} className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 font-extrabold text-blue-text hover:bg-stage-sunken">
          <ArrowClockwise size={14} weight="bold" aria-hidden />
          {recovery.label}
        </button>
      )}
    </p>
  );
}

function SpeakerRoster() {
  const { speakers } = useScript();
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Speakers">
      {speakers.map((speaker) => (
        <li key={speaker}>
          <SpeakerName speaker={speaker} />
        </li>
      ))}
    </ul>
  );
}

function SpeakerName({ speaker }: { speaker: string }) {
  const { speakers, editable, change } = useScript();
  const [name, setName] = useState(speaker);
  const color = speakerColor(speakers, speaker);

  const commit = () => {
    const next = name.trim();
    if (!next || next === speaker || speakers.includes(next)) return setName(speaker);
    change((draft) => renameSpeaker(draft, speaker, next));
  };

  return (
    <label className="flex h-9 items-center gap-2 rounded-full bg-stage-sunken pr-3 pl-3 text-sm font-extrabold focus-within:ring-2 focus-within:ring-blue/60" style={{ color }}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <input
        aria-label={`Rename ${speaker}`}
        value={name}
        readOnly={!editable}
        onChange={(event) => setName(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className="field-sizing-content min-w-[4ch] bg-transparent outline-none"
      />
      {editable && <PencilSimpleLine size={14} weight="bold" className="opacity-60" aria-hidden />}
    </label>
  );
}

function PendingNote({ count }: { count: number }) {
  return (
    <p className="ml-auto flex items-center gap-2 rounded-full bg-draft-wash py-2 pr-4 pl-3 text-sm font-bold text-draft">
      <PencilSimpleLine size={16} weight="bold" aria-hidden />
      {`${count} proposed ${count === 1 ? "change needs" : "changes need"} new slides. Ask Claude to apply ${count === 1 ? "it" : "them"}.`}
    </p>
  );
}
