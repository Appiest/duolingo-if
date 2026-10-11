import { describe, expect, it } from "vitest";
import { skitSlide, slides } from "./script";
import { skit } from "./skit";
import { beatAt, fit, outlineFor, promptAt } from "./steps";
import { advance } from "./timeline";

describe("skit stepping", () => {
  it("gives the skit slide one click per line while notes show", () => {
    expect(outlineFor(true)[skitSlide]).toBe(skit.length);
    expect(outlineFor(false)[skitSlide]).toBe(1);
  });

  it("moves to slide 2 in one click when notes are hidden", () => {
    expect(advance({ slide: skitSlide, beat: 0 }, outlineFor(false))).toEqual({ slide: skitSlide + 1, beat: 0 });
  });

  it("keeps showing the skit backdrop on every skit line", () => {
    expect(beatAt({ slide: skitSlide, beat: skit.length - 1 })).toBe(slides[skitSlide].beats[0]);
  });

  it("prompts the current skit line and pulls back to the slide when notes hide", () => {
    expect(promptAt({ slide: skitSlide, beat: 2 }, true).cue).toBe(skit[2]);
    expect(fit({ slide: skitSlide, beat: 5 }, outlineFor(false))).toEqual({ slide: skitSlide, beat: 0 });
  });

  it("falls back to a single beat when the skit is empty", () => {
    expect(outlineFor(true, 0)[skitSlide]).toBe(1);
  });
});
