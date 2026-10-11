import { cues, type Cue } from "./cues";
import { skitSlide, slides, type Beat } from "./script";
import { skit, skitSegments, visualAtLine, type SkitLine, type SkitVisual } from "./skit";
import type { Outline, Position } from "./timeline";

// With the rehearsal strip showing, the skit slide takes one click per skit
// line so the strip can prompt each one. With it hidden, it takes one click
// per skit visual.
export function outlineFor(notes: boolean, lines: readonly SkitLine[] = skit): Outline {
  const skitSteps = notes ? lines.length : skitSegments(lines).length;
  return slides.map((slide, index) => (index === skitSlide ? Math.max(skitSteps, 1) : slide.beats.length));
}

export function fit(position: Position, outline: Outline): Position {
  return { slide: position.slide, beat: Math.min(position.beat, outline[position.slide] - 1) };
}

export function beatAt(position: Position): Beat {
  const beats: readonly Beat[] = slides[position.slide].beats;
  return beats[Math.min(position.beat, beats.length - 1)];
}

export function skitVisualAt(position: Position, notes: boolean, lines: readonly SkitLine[] = skit): SkitVisual {
  if (position.slide !== skitSlide) return "backdrop";
  if (notes) return visualAtLine(lines, position.beat);
  return skitSegments(lines)[position.beat]?.visual ?? "backdrop";
}

export type Prompt = { cue: Cue; place: string };

export function promptAt(position: Position, notes: boolean): Prompt {
  if (notes && position.slide === skitSlide && skit.length > 0) {
    return { cue: skit[position.beat], place: `Slide ${position.slide + 1}, skit line ${position.beat + 1} of ${skit.length}` };
  }
  return { cue: cues[beatAt(position)], place: `Slide ${position.slide + 1}, beat ${position.beat + 1}` };
}
