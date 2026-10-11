import type { Prompt } from "./steps";

export function Rehearsal({ prompt, shown }: { prompt: Prompt; shown: boolean }) {
  if (!shown) return null;
  return (
    <div data-rehearsal className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex items-end justify-between gap-6 print:hidden" aria-hidden>
      <p className="max-w-2xl rounded-xl bg-rehearsal/85 px-4 py-2.5 text-base font-semibold text-white" style={{ textWrap: "pretty" }}>
        <span className="font-black text-green">{prompt.cue.speaker}</span> {prompt.cue.line}
      </p>
      <p className="shrink-0 rounded-lg bg-rehearsal/60 px-2.5 py-1.5 text-sm font-bold text-white/80 tabular-nums">{prompt.place}</p>
    </div>
  );
}
