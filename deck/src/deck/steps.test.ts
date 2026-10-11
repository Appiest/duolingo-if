import { describe, expect, it } from "vitest";
import { skitSlide, slides } from "./script";
import { skit, skitSegments, type SkitLine } from "./skit";
import { beatAt, fit, outlineFor, promptAt, skitVisualAt } from "./steps";
import { advance } from "./timeline";

const lines: SkitLine[] = [
  { id: "a", speaker: "Kid", line: "one", visual: "backdrop" },
  { id: "b", speaker: "Kid", line: "two" },
  { id: "c", speaker: "Kid", line: "three", visual: "message" },
  { id: "d", speaker: "Pawnzy", line: "four", visual: "message" },
  { id: "e", speaker: "Pawnzy", line: "five", visual: "flags" },
];

describe("skit stepping", () => {
  it("gives the skit slide one click per line while notes show, one per visual when hidden", () => {
    expect(outlineFor(true, lines)[skitSlide]).toBe(5);
    expect(outlineFor(false, lines)[skitSlide]).toBe(3);
  });

  it("keeps a visual up until a line starts a different one", () => {
    expect(skitSegments(lines).map((segment) => [segment.visual, segment.first, segment.last])).toEqual([
      ["backdrop", 0, 1],
      ["message", 2, 3],
      ["flags", 4, 4],
    ]);
    expect(skitVisualAt({ slide: skitSlide, beat: 3 }, true, lines)).toBe("message");
    expect(skitVisualAt({ slide: skitSlide, beat: 2 }, false, lines)).toBe("flags");
  });

  it("moves to slide 2 after the last skit visual when notes are hidden", () => {
    expect(advance({ slide: skitSlide, beat: 2 }, outlineFor(false, lines))).toEqual({ slide: skitSlide + 1, beat: 0 });
  });

  it("keeps showing the skit slide on every skit line", () => {
    expect(beatAt({ slide: skitSlide, beat: skit.length - 1 })).toBe(slides[skitSlide].beats[0]);
  });

  it("prompts the current skit line and pulls back when notes hide", () => {
    expect(promptAt({ slide: skitSlide, beat: 2 }, true).cue).toBe(skit[2]);
    expect(fit({ slide: skitSlide, beat: 30 }, outlineFor(false))).toEqual({ slide: skitSlide, beat: outlineFor(false)[skitSlide] - 1 });
  });

  it("falls back to a single beat when the skit is empty", () => {
    expect(outlineFor(true, [])[skitSlide]).toBe(1);
  });
});
