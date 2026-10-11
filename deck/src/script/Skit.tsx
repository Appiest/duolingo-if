"use client";

import { ArrowCounterClockwise, Plus, Scissors, Trash } from "@phosphor-icons/react";
import { addSkitLine, editSkitLine, formatDuration, removeSkitLine, splitSkitLine, type Draft, type Row } from "@/deck/scriptDraft";
import type { SkitLine } from "@/deck/skit";
import { skitSlide, slides } from "@/deck/script";
import { LineEditor } from "./LineEditor";
import { Action, Actions } from "./Rows";
import { useScript } from "./ScriptContext";
import { Thumbnail } from "./Thumbnail";
import type { Undo } from "./useDraft";

type SkitRow = Extract<Row, { kind: "skit" }>;

export function SkitLines({ rows, seconds }: { rows: SkitRow[]; seconds: number }) {
  return (
    <div className="mt-3 grid gap-4 p-3 sm:grid-cols-[240px_1fr] sm:gap-6">
      <div className="sm:sticky sm:top-36 sm:self-start">
        <Thumbnail beat={slides[skitSlide].beats[0]} position={{ slide: skitSlide, beat: 0 }} />
        <p className="mt-3 text-sm font-bold text-ink-muted tabular-nums" title="Estimated at 150 words a minute">
          Skit runs about {formatDuration(seconds)}
        </p>
      </div>
      <ol className="flex flex-col gap-1">
        {rows.map((row) => (
          <SkitLineRow key={row.line.id} line={row.line} number={row.index + 1} />
        ))}
      </ol>
    </div>
  );
}

function SkitLineRow({ line, number }: { line: SkitLine; number: number }) {
  const { change, create, freshId } = useScript();
  const split = (cursor: number) => create((draft, id) => splitSkitLine(draft, line.id, cursor, id));
  return (
    <li className="group -mx-3 rounded-2xl px-3 py-1.5 hover:bg-stage-sunken/40">
      <LineEditor
        cue={line}
        label={`Skit line ${number}`}
        onChange={(edit) => change((draft) => editSkitLine(draft, line.id, edit))}
        onSplit={split}
        autoFocus={freshId === line.id}
        actions={
          <Actions className="">
            <Action icon={<Scissors size={16} weight="bold" />} onClick={() => split(0)}>
              Split
            </Action>
            <Action icon={<Plus size={16} weight="bold" />} onClick={() => create((draft, id) => addSkitLine(draft, line.id, id, otherSpeaker(draft, line)))}>
              Add below
            </Action>
            <Action icon={<Trash size={16} weight="bold" />} onClick={() => change((draft) => removeSkitLine(draft, line.id), `Removed skit line ${number}`)}>
              Remove
            </Action>
          </Actions>
        }
      />
    </li>
  );
}

// A new line usually answers the one above it, so it goes to the other speaker.
function otherSpeaker(draft: Draft, line: SkitLine): string {
  return draft.skit.find((other) => other.speaker !== line.speaker)?.speaker ?? line.speaker;
}

export function UndoToast({ undo }: { undo: Undo | null }) {
  const { change } = useScript();
  if (!undo) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-rehearsal py-2 pr-2 pl-5 text-sm font-bold text-white shadow-[0_12px_32px_-8px_rgb(0_0_0/0.4)]">
      {undo.label}
      <button
        type="button"
        onClick={() => change(() => undo.draft)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 font-extrabold hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <ArrowCounterClockwise size={16} weight="bold" aria-hidden />
        Undo
      </button>
    </div>
  );
}
