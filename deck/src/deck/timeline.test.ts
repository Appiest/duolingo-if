import { describe, expect, it } from "vitest";
import { advance, last, parsePosition, retreat, start, toSearch } from "./timeline";

const outline = [3, 1, 2];

describe("advance", () => {
  it("steps through beats before moving to the next slide", () => {
    expect(advance({ slide: 0, beat: 0 }, outline)).toEqual({ slide: 0, beat: 1 });
    expect(advance({ slide: 0, beat: 2 }, outline)).toEqual({ slide: 1, beat: 0 });
  });

  it("stays on the final beat of the final slide", () => {
    expect(advance(last(outline), outline)).toEqual({ slide: 2, beat: 1 });
  });
});

describe("retreat", () => {
  it("lands on the previous slide's final beat so its end state matches", () => {
    expect(retreat({ slide: 1, beat: 0 }, outline)).toEqual({ slide: 0, beat: 2 });
  });

  it("stays on the first beat of the first slide", () => {
    expect(retreat(start, outline)).toEqual(start);
  });
});

describe("URL round trip", () => {
  it("uses one-based numbers and omits the first beat", () => {
    expect(toSearch({ slide: 0, beat: 0 })).toBe("?slide=1");
    expect(toSearch({ slide: 2, beat: 1 })).toBe("?slide=3&beat=2");
  });

  it("parses what it serialises", () => {
    const params = new URLSearchParams(toSearch({ slide: 2, beat: 1 }));
    expect(parsePosition(params.get("slide"), params.get("beat"), outline)).toEqual({
      slide: 2,
      beat: 1,
    });
  });

  it("clamps missing, garbage and out-of-range values", () => {
    expect(parsePosition(undefined, undefined, outline)).toEqual(start);
    expect(parsePosition("banana", "-4", outline)).toEqual(start);
    expect(parsePosition("99", "99", outline)).toEqual({ slide: 2, beat: 1 });
  });
});
