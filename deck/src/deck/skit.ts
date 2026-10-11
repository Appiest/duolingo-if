import type { Cue } from "./cues";
import skitData from "./skit.json";

export const skitVisuals = ["backdrop", "message", "login", "swoop", "backstory", "flags", "safe"] as const;
export type SkitVisual = (typeof skitVisuals)[number];

export const skitVisualNames: Record<SkitVisual, string> = {
  backdrop: "Title card",
  message: "The Robux text arrives",
  login: "Fake login page",
  swoop: "Pawnzy swoops in",
  backstory: "Pawnzy’s old scam texts",
  flags: "Red flags in the text",
  safe: "How to stay safe",
};

// A line with a visual changes what's behind the skit from that line on.
export type SkitLine = Cue & { id: string; visual?: SkitVisual };
export type SkitSegment = { visual: SkitVisual; first: number; last: number };

// Plays in front of the first slide. Edited from the /script page.
export const skit = skitData as SkitLine[];

export function skitSegments(lines: readonly SkitLine[]): SkitSegment[] {
  const segments: SkitSegment[] = [];
  lines.forEach((line, index) => {
    const current = segments.at(-1);
    if (current && (!line.visual || line.visual === current.visual)) current.last = index;
    else segments.push({ visual: line.visual ?? "backdrop", first: index, last: index });
  });
  return segments.length ? segments : [{ visual: "backdrop", first: 0, last: 0 }];
}

export function visualAtLine(lines: readonly SkitLine[], index: number): SkitVisual {
  return skitSegments(lines).find((segment) => index >= segment.first && index <= segment.last)?.visual ?? "backdrop";
}
