"use client";

import { MotionConfig } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import type { SlideId } from "@/deck/script";
import { sequence, skitSeconds, speakersIn, totalSeconds, type Draft, type Row, type SlideRows } from "@/deck/scriptDraft";
import { AddedRow, BeatRow, RemovedRow, SplitRow } from "./Rows";
import { ScriptContext } from "./ScriptContext";
import { ScriptHeader } from "./ScriptHeader";
import { SkitLines, UndoToast } from "./Skit";
import { useDraft } from "./useDraft";

type ScriptEditorProps = { initial: Draft; editable: boolean; titles: Record<SlideId, string> };

export function ScriptEditor({ initial, editable, titles }: ScriptEditorProps) {
  const { draft, change, saveState, retry, undo } = useDraft(initial, editable);
  const [freshId, setFreshId] = useState<string | null>(null);

  const create = useCallback(
    (edit: (draft: Draft, id: string) => Draft) => {
      const id = crypto.randomUUID().slice(0, 8);
      setFreshId(id);
      change((current) => edit(current, id));
    },
    [change],
  );

  const speakers = useMemo(() => speakersIn(draft), [draft]);
  const tools = useMemo(() => ({ editable, speakers, freshId, change, create }), [editable, speakers, freshId, change, create]);

  return (
    <ScriptContext value={tools}>
      <MotionConfig reducedMotion="always">
        <ScriptHeader seconds={totalSeconds(draft)} pending={draft.proposals.length} saveState={saveState} onRetry={retry} />
        <main className="mx-auto max-w-[1040px] px-1 pb-32 sm:px-5">
          {sequence(draft).map((slide) => (
            <SlideSection key={slide.id} slide={slide} title={titles[slide.id]} skitSeconds={skitSeconds(draft)} />
          ))}
        </main>
        <UndoToast undo={undo} />
      </MotionConfig>
    </ScriptContext>
  );
}

function isSkitRow(row: Row): row is Extract<Row, { kind: "skit" }> {
  return row.kind === "skit";
}

function SlideSection({ slide, title, skitSeconds }: { slide: SlideRows; title: string; skitSeconds: number }) {
  const skitRows = slide.rows.filter(isSkitRow);
  return (
    <section className="mt-10">
      <h2 className="px-3 text-2xl font-black text-ink" style={{ textWrap: "balance" }}>
        Slide {slide.number}: <span className="font-extrabold text-ink-muted">{title}</span>
      </h2>
      {skitRows.length > 0 ? (
        <SkitLines rows={skitRows} seconds={skitSeconds} />
      ) : (
        <ol className="mt-3 flex flex-col gap-1">
          {slide.rows.map((row) => (
            <RowView key={rowKey(row)} row={row} />
          ))}
        </ol>
      )}
    </section>
  );
}

function rowKey(row: Row): string {
  if (row.kind === "skit") return row.line.id;
  return row.kind === "add" ? row.proposal.id : `${row.kind}-${row.beat}`;
}

function RowView({ row }: { row: Row }) {
  switch (row.kind) {
    case "beat":
      return <BeatRow row={row} />;
    case "split":
      return <SplitRow row={row} />;
    case "remove":
      return <RemovedRow row={row} />;
    case "add":
      return <AddedRow row={row} />;
    case "skit":
      return null;
  }
}
