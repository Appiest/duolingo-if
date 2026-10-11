"use client";

import { ArrowCounterClockwise, MonitorPlay, Plus, Scissors, Trash } from "@phosphor-icons/react";
import { addSkitLine, editSkitLine, formatDuration, removeSkitLine, splitSkitLine, type Draft, type Row } from "@/deck/scriptDraft";
import { skitSegments, skitVisualNames, skitVisuals, type SkitLine, type SkitSegment, type SkitVisual } from "@/deck/skit";
import { skitSlide, slides } from "@/deck/script";
import { LineEditor } from "./LineEditor";
import { Action, Actions } from "./Rows";
import { useScript } from "./ScriptContext";
import { Thumbnail } from "./Thumbnail";
import type { Undo } from "./useDraft";

type SkitRow = Extract<Row, { kind: "skit" }>;

// Lines are grouped under the visual that's up behind them, so each group
// sits beside a thumbnail of that visual.
export function SkitLines({ rows, seconds }: { rows: SkitRow[]; seconds: number }) {
  const segments = skitSegments(rows.map((row) => row.line));
  return (
    <div className="mt-3 flex flex-col gap-6">
      <p className="px-3 text-sm font-bold text-ink-muted tabular-nums" title="Estimated at 150 words a minute">
        Skit runs about {formatDuration(seconds)}
      </p>
      {segments.map((segment) => (
        <SkitSegmentGroup key={rows[segment.first].line.id} segment={segment} rows={rows.slice(segment.first, segment.last + 1)} />
      ))}
    </div>
  );
}

function SkitSegmentGroup({ segment, rows }: { segment: SkitSegment; rows: SkitRow[] }) {
  return (
    <div className="grid gap-4 px-3 sm:grid-cols-[240px_1fr] sm:gap-6">
      <div className="sm:sticky sm:top-36 sm:self-start">
        <Thumbnail beat={slides[skitSlide].beats[0]} position={{ slide: skitSlide, beat: segment.first }} skitVisual={segment.visual} />
        <p className="mt-2 text-sm font-bold text-ink-muted">{skitVisualNames[segment.visual]}</p>
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
            <Action icon={<Scissors size={16} weight="bold" />} onClick={() => split(0)} label="Split line" iconOnly />
            <Action icon={<Plus size={16} weight="bold" />} onClick={() => create((draft, id) => addSkitLine(draft, line.id, id, otherSpeaker(draft, line)))} label="Add line below" iconOnly />
            <Action icon={<Trash size={16} weight="bold" />} onClick={() => change((draft) => removeSkitLine(draft, line.id), `Removed skit line ${number}`)} label="Remove line" iconOnly />
            <VisualPicker line={line} first={number === 1} />
          </Actions>
        }
      />
    </li>
  );
}

const KEEP = "";

// Picks the visual that comes up behind the skit on this line.
function VisualPicker({ line, first }: { line: SkitLine; first: boolean }) {
  const { change } = useScript();
  const choose = (value: string) => change((draft) => editSkitLine(draft, line.id, { visual: value === KEEP ? undefined : (value as SkitVisual) }));
  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-muted hover:bg-stage-sunken has-focus-visible:ring-2 has-focus-visible:ring-blue/60">
      <MonitorPlay size={16} weight="bold" aria-hidden />
      <span className="max-sm:sr-only">Slide from here</span>
      <select aria-label="Slide from here" value={line.visual ?? KEEP} onChange={(event) => choose(event.target.value)} className="bg-transparent font-bold text-ink outline-none">
        {!first && <option value={KEEP}>Same as above</option>}
        {skitVisuals.map((visual) => (
          <option key={visual} value={visual}>
            {skitVisualNames[visual]}
          </option>
        ))}
      </select>
    </label>
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
