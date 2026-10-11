import type { Cue } from "./cues";
import { skitSlide, slides, type Beat, type SlideId } from "./script";
import type { SkitLine } from "./skit";
import type { Position } from "./timeline";

export type SplitProposal = { id: string; kind: "split"; beat: Beat; parts: [Cue, Cue] };
export type AddProposal = { id: string; kind: "add"; after: Beat; cue: Cue };
export type RemoveProposal = { id: string; kind: "remove"; beat: Beat };
export type Proposal = SplitProposal | AddProposal | RemoveProposal;

export type Draft = { cues: Record<Beat, Cue>; proposals: Proposal[]; skit: SkitLine[] };

export type Row =
  | { kind: "beat"; beat: Beat; cue: Cue; position: Position }
  | { kind: "split"; beat: Beat; proposal: SplitProposal; position: Position }
  | { kind: "remove"; beat: Beat; cue: Cue; proposal: RemoveProposal; position: Position }
  | { kind: "add"; proposal: AddProposal }
  | { kind: "skit"; line: SkitLine; index: number };

export type SlideRows = { id: SlideId; number: number; rows: Row[] };

const WORDS_PER_SECOND = 150 / 60;

function proposalFor(proposals: Proposal[], beat: Beat): SplitProposal | RemoveProposal | undefined {
  return proposals.find((proposal): proposal is SplitProposal | RemoveProposal => proposal.kind !== "add" && proposal.beat === beat);
}

function beatRow(draft: Draft, beat: Beat, position: Position): Row {
  const proposal = proposalFor(draft.proposals, beat);
  if (proposal?.kind === "split") return { kind: "split", beat, proposal, position };
  if (proposal?.kind === "remove") return { kind: "remove", beat, cue: draft.cues[beat], proposal, position };
  return { kind: "beat", beat, cue: draft.cues[beat], position };
}

function addedAfter(proposals: Proposal[], beat: Beat): Row[] {
  return proposals
    .filter((proposal): proposal is AddProposal => proposal.kind === "add" && proposal.after === beat)
    .map((proposal) => ({ kind: "add", proposal }));
}

function slideRows(draft: Draft, slideIndex: number): Row[] {
  if (slideIndex === skitSlide && draft.skit.length > 0) return draft.skit.map((line, index) => ({ kind: "skit", line, index }));
  const beats: readonly Beat[] = slides[slideIndex].beats;
  return beats.flatMap((beat, beatIndex) => [beatRow(draft, beat, { slide: slideIndex, beat: beatIndex }), ...addedAfter(draft.proposals, beat)]);
}

export function sequence(draft: Draft): SlideRows[] {
  return slides.map((slide, slideIndex) => ({ id: slide.id, number: slideIndex + 1, rows: slideRows(draft, slideIndex) }));
}

// The skit plays before the timed talk, so it never counts toward it.
export function spokenCues(row: Row): Cue[] {
  if (row.kind === "split") return row.proposal.parts;
  if (row.kind === "remove" || row.kind === "skit") return [];
  if (row.kind === "add") return [row.proposal.cue];
  return [row.cue];
}

export function estimateSeconds(line: string): number {
  const words = line.trim().split(/\s+/).filter(Boolean).length;
  return words / WORDS_PER_SECOND;
}

export function totalSeconds(draft: Draft): number {
  return sequence(draft)
    .flatMap((slide) => slide.rows.flatMap(spokenCues))
    .reduce((sum, cue) => sum + estimateSeconds(cue.line), 0);
}

export function skitSeconds(draft: Draft): number {
  return draft.skit.reduce((sum, line) => sum + estimateSeconds(line.line), 0);
}

export function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function nearestBreak(line: string, pattern: RegExp): number | undefined {
  const middle = line.length / 2;
  const breaks = [...line.matchAll(pattern)].map((match) => match.index + match[0].length);
  return breaks.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0];
}

// Splits where the cursor sits, or at the sentence (then the space) nearest
// the middle when the cursor is at either end.
export function splitLine(line: string, cursor: number): [string, string] {
  const inside = cursor > 0 && cursor < line.trimEnd().length;
  const at = inside ? cursor : (nearestBreak(line, /[.?!:;]\s+/g) ?? nearestBreak(line, /\s+/g) ?? line.length);
  return [line.slice(0, at).trim(), line.slice(at).trim()];
}

export function speakersIn(draft: Draft): string[] {
  const presenters = [...Object.values(draft.cues), ...draft.proposals.flatMap(proposalCues)].map((cue) => cue.speaker);
  const characters = draft.skit.map((line) => line.speaker).sort();
  return [...new Set([...presenters, ...characters])];
}

function proposalCues(proposal: Proposal): Cue[] {
  if (proposal.kind === "split") return proposal.parts;
  if (proposal.kind === "add") return [proposal.cue];
  return [];
}

function renameIn<T extends Cue>(cue: T, from: string, to: string): T {
  return cue.speaker === from ? { ...cue, speaker: to } : cue;
}

function renameInProposal(proposal: Proposal, from: string, to: string): Proposal {
  if (proposal.kind === "split") return { ...proposal, parts: [renameIn(proposal.parts[0], from, to), renameIn(proposal.parts[1], from, to)] };
  if (proposal.kind === "add") return { ...proposal, cue: renameIn(proposal.cue, from, to) };
  return proposal;
}

export function renameSpeaker(draft: Draft, from: string, to: string): Draft {
  const cues = Object.fromEntries(Object.entries(draft.cues).map(([beat, cue]) => [beat, renameIn(cue, from, to)])) as Record<Beat, Cue>;
  return {
    cues,
    proposals: draft.proposals.map((proposal) => renameInProposal(proposal, from, to)),
    skit: draft.skit.map((line) => renameIn(line, from, to)),
  };
}

export function editCue(draft: Draft, beat: Beat, change: Partial<Cue>): Draft {
  return { ...draft, cues: { ...draft.cues, [beat]: { ...draft.cues[beat], ...change } } };
}

export function propose(draft: Draft, proposal: Proposal): Draft {
  return { ...draft, proposals: [...draft.proposals, proposal] };
}

export function withdraw(draft: Draft, id: string): Draft {
  return { ...draft, proposals: draft.proposals.filter((proposal) => proposal.id !== id) };
}

export function reviseProposal(draft: Draft, revised: Proposal): Draft {
  return { ...draft, proposals: draft.proposals.map((proposal) => (proposal.id === revised.id ? revised : proposal)) };
}

// Skit lines change no slides, so edits to them apply straight away.
export function editSkitLine(draft: Draft, id: string, change: Partial<SkitLine>): Draft {
  return { ...draft, skit: draft.skit.map((line) => (line.id === id ? { ...line, ...change } : line)) };
}

function insertSkitLines(draft: Draft, id: string, replacement: (line: SkitLine) => SkitLine[]): Draft {
  return { ...draft, skit: draft.skit.flatMap((line) => (line.id === id ? replacement(line) : [line])) };
}

export function splitSkitLine(draft: Draft, id: string, cursor: number, newId: string): Draft {
  return insertSkitLines(draft, id, (line) => {
    const [first, second] = splitLine(line.line, cursor);
    return [{ ...line, line: first }, { id: newId, speaker: line.speaker, line: second }];
  });
}

export function addSkitLine(draft: Draft, afterId: string, newId: string, speaker: string): Draft {
  return insertSkitLines(draft, afterId, (line) => [line, { id: newId, speaker, line: "" }]);
}

export function removeSkitLine(draft: Draft, id: string): Draft {
  return insertSkitLines(draft, id, () => []);
}
