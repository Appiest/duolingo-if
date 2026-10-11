"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { KeyboardEvent, ReactNode } from "react";
import type { Cue } from "@/deck/cues";
import { estimateSeconds } from "@/deck/scriptDraft";
import { speakerColor, useScript } from "./ScriptContext";

type LineEditorProps = {
  cue: Cue;
  label: string;
  onChange: (change: Partial<Cue>) => void;
  onSplit?: (cursor: number) => void;
  autoFocus?: boolean;
  actions?: ReactNode;
};

export function LineEditor({ cue, label, onChange, onSplit, autoFocus, actions }: LineEditorProps) {
  const { editable } = useScript();

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSplit?.(event.currentTarget.selectionStart);
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <SpeakerPicker speaker={cue.speaker} onPick={(speaker) => onChange({ speaker })} />
        {actions}
        <span className="ml-auto text-sm font-bold text-ink-faint tabular-nums" title="Estimated at 150 words a minute">
          {Math.round(estimateSeconds(cue.line))}s
        </span>
      </div>
      <textarea
        aria-label={label}
        value={cue.line}
        readOnly={!editable}
        autoFocus={autoFocus}
        rows={1}
        placeholder="Write the new line"
        onChange={(event) => onChange({ line: event.target.value.replace(/\n/g, " ") })}
        onKeyDown={onKeyDown}
        aria-keyshortcuts={onSplit ? "Enter" : undefined}
        className="field-sizing-content -mx-2 mt-1 block w-[calc(100%+1rem)] resize-none rounded-lg bg-transparent px-2 py-1 text-xl leading-relaxed font-semibold text-ink outline-none placeholder:text-ink-faint hover:bg-stage-sunken/60 focus:bg-stage-sunken focus-visible:ring-2 focus-visible:ring-blue/60"
        style={{ textWrap: "pretty" }}
      />
    </div>
  );
}

function SpeakerPicker({ speaker, onPick }: { speaker: string; onPick: (speaker: string) => void }) {
  const { speakers, editable } = useScript();
  const color = speakerColor(speakers, speaker);
  return (
    <label className="relative inline-flex shrink-0 items-center gap-2 rounded-full py-1 pr-7 pl-2.5 whitespace-nowrap text-sm font-extrabold hover:bg-stage-sunken has-focus-visible:ring-2 has-focus-visible:ring-blue/60" style={{ color }}>
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="sr-only">Speaker</span>
      {speaker}
      <select value={speaker} disabled={!editable} onChange={(event) => onPick(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default">
        {speakers.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      {editable && <CaretDown size={14} weight="bold" className="absolute right-2.5" aria-hidden />}
    </label>
  );
}
