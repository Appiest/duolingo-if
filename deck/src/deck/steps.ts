import { cues, type Cue } from "./cues";
import { skitSlide, slides, type Beat } from "./script";
import { skit } from "./skit";
import type { Outline, Position } from "./timeline";

// With the rehearsal strip showing, the skit slide takes one click per skit
// line so the strip can prompt each one. With it hidden, the skit is one click.
export function outlineFor(notes: boolean, skitLines = skit.length): Outline {
  return slides.map((slide, index) => (notes && index === skitSlide && skitLines > 0 ? skitLines : slide.beats.length));
}

export function fit(position: Position, outline: Outline): Position {
  return { slide: position.slide, beat: Math.min(position.beat, outline[position.slide] - 1) };
}

export function beatAt(position: Position): Beat {
  const beats: readonly Beat[] = slides[position.slide].beats;
  return beats[Math.min(position.beat, beats.length - 1)];
}

export type Prompt = { cue: Cue; place: string };

export function promptAt(position: Position, notes: boolean): Prompt {
  if (notes && position.slide === skitSlide && skit.length > 0) {
    return { cue: skit[position.beat], place: `Slide ${position.slide + 1}, skit line ${position.beat + 1} of ${skit.length}` };
  }
  return { cue: cues[beatAt(position)], place: `Slide ${position.slide + 1}, beat ${position.beat + 1}` };
}
