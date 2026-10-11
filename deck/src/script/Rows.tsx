"use client";

import { ArrowCounterClockwise, Plus, Scissors, Trash } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Cue } from "@/deck/cues";
import { editCue, propose, reviseProposal, splitLine, withdraw, type AddProposal, type Row, type SplitProposal } from "@/deck/scriptDraft";
import type { Beat } from "@/deck/script";
import type { Position } from "@/deck/timeline";
import { LineEditor } from "./LineEditor";
import { useScript } from "./ScriptContext";
import { SlideNeeded, Thumbnail } from "./Thumbnail";

type RowOf<Kind extends Row["kind"]> = Extract<Row, { kind: Kind }>;

function placeName(position: Position) {
  return `Slide ${position.slide + 1}, beat ${position.beat + 1}`;
}

function RowFrame({ visual, proposed, children }: { visual: ReactNode; proposed?: boolean; children: ReactNode }) {
  const surface = proposed ? "bg-draft-wash" : "";
  return (
    <li className={`group grid gap-4 rounded-2xl p-3 sm:grid-cols-[240px_1fr] sm:gap-6 ${surface}`}>
      {visual}
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </li>
  );
}

export function Actions({ children, className = "-ml-2.5" }: { children: ReactNode; className?: string }) {
  const { editable } = useScript();
  if (!editable) return null;
  return (
    <div className={`${className} flex flex-wrap gap-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100`}>
      {children}
    </div>
  );
}

type ActionProps = { icon: ReactNode; onClick: () => void; label: string; iconOnly?: boolean };

// Icon-only actions keep their name for hover and screen readers.
export function Action({ icon, onClick, label, iconOnly = false }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={iconOnly ? label : undefined}
      className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm sm:px-3 font-bold text-ink-muted hover:bg-stage-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-blue/60 focus-visible:outline-none"
    >
      {icon}
      <span className={iconOnly ? "sr-only" : "max-sm:sr-only"}>{label}</span>
    </button>
  );
}

function useProposals(beat: Beat, cue: Cue) {
  const { create } = useScript();
  return {
    split: (cursor: number) =>
      create((draft, id) => {
        const [first, second] = splitLine(draft.cues[beat].line, cursor);
        return propose(draft, { id, kind: "split", beat, parts: [{ ...cue, line: first }, { ...cue, line: second }] });
      }),
    addBelow: () => create((draft, id) => propose(draft, { id, kind: "add", after: beat, cue: { speaker: cue.speaker, line: "" } })),
    remove: () => create((draft, id) => propose(draft, { id, kind: "remove", beat })),
  };
}

export function BeatRow({ row }: { row: RowOf<"beat"> }) {
  const { change } = useScript();
  const { split, addBelow, remove } = useProposals(row.beat, row.cue);
  return (
    <RowFrame visual={<Thumbnail beat={row.beat} position={row.position} />}>
      <LineEditor cue={row.cue} label={`${placeName(row.position)} line`} onChange={(edit) => change((draft) => editCue(draft, row.beat, edit))} onSplit={split} />
      <Actions>
        <Action icon={<Scissors size={16} weight="bold" />} onClick={() => split(0)} label="Split line" />
        <Action icon={<Plus size={16} weight="bold" />} onClick={addBelow} label="Add line below" />
        <Action icon={<Trash size={16} weight="bold" />} onClick={remove} label="Remove line" />
      </Actions>
    </RowFrame>
  );
}

export function SplitRow({ row }: { row: RowOf<"split"> }) {
  const { change, freshId } = useScript();
  const revisePart = (index: 0 | 1, edit: Partial<Cue>) => {
    const parts: SplitProposal["parts"] = [...row.proposal.parts];
    parts[index] = { ...parts[index], ...edit };
    change((draft) => reviseProposal(draft, { ...row.proposal, parts }));
  };
  return (
    <RowFrame proposed visual={<SlideNeeded />}>
      <LineEditor cue={row.proposal.parts[0]} label={`${placeName(row.position)}, first half`} onChange={(edit) => revisePart(0, edit)} />
      <div className="flex items-center gap-2 text-draft" aria-hidden>
        <Scissors size={18} weight="bold" />
        <span className="h-0 flex-1 border-t-2 border-dashed border-draft-hatch" />
      </div>
      <LineEditor
        cue={row.proposal.parts[1]}
        label={`${placeName(row.position)}, second half`}
        onChange={(edit) => revisePart(1, edit)}
        autoFocus={freshId === row.proposal.id}
      />
      <Actions>
        <Action icon={<ArrowCounterClockwise size={16} weight="bold" />} onClick={() => change((draft) => withdraw(draft, row.proposal.id))} label="Undo split" />
      </Actions>
    </RowFrame>
  );
}

export function RemovedRow({ row }: { row: RowOf<"remove"> }) {
  const { change, editable } = useScript();
  return (
    <RowFrame proposed visual={<Thumbnail beat={row.beat} position={row.position} faded />}>
      <p className="pt-8 text-xl leading-relaxed font-semibold text-ink-faint line-through decoration-2">
        <span className="sr-only">Proposed for removal: </span>
        {row.cue.line}
      </p>
      {editable && (
        <div className="-ml-2.5">
          <Action icon={<ArrowCounterClockwise size={16} weight="bold" />} onClick={() => change((draft) => withdraw(draft, row.proposal.id))} label="Keep line" />
        </div>
      )}
    </RowFrame>
  );
}

export function AddedRow({ row }: { row: RowOf<"add"> }) {
  const { change, freshId } = useScript();
  const revise = (edit: Partial<Cue>) => change((draft) => reviseProposal(draft, { ...row.proposal, cue: { ...row.proposal.cue, ...edit } } satisfies AddProposal));
  return (
    <RowFrame proposed visual={<SlideNeeded />}>
      <LineEditor cue={row.proposal.cue} label="New line" onChange={revise} autoFocus={freshId === row.proposal.id} />
      <Actions>
        <Action icon={<Trash size={16} weight="bold" />} onClick={() => change((draft) => withdraw(draft, row.proposal.id))} label="Discard new line" />
      </Actions>
    </RowFrame>
  );
}
