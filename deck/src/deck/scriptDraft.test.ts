import { describe, expect, it } from "vitest";
import { cues } from "./cues";
import { slides } from "./script";
import { skit } from "./skit";
import { addSkitLine, formatDuration, propose, removeSkitLine, renameSpeaker, sequence, splitLine, splitSkitLine, totalSeconds, type Draft } from "./scriptDraft";

const draft: Draft = { cues, proposals: [], skit };

describe("cues.json", () => {
  it("has exactly one cue per beat", () => {
    const beats = slides.flatMap((slide) => slide.beats).sort();
    expect(Object.keys(cues).sort()).toEqual(beats);
  });
});

describe("splitLine", () => {
  it("splits at the cursor", () => {
    expect(splitLine("Pay now. Or else.", 8)).toEqual(["Pay now.", "Or else."]);
  });

  it("falls back to the sentence break nearest the middle", () => {
    expect(splitLine("One two. Three four five. Six.", 0)).toEqual(["One two.", "Three four five. Six."]);
  });

  it("falls back to a space when there is one sentence", () => {
    expect(splitLine("one two three four", 18)).toEqual(["one two", "three four"]);
  });
});

describe("sequence", () => {
  it("shows a split in place of its beat and an added line after its anchor", () => {
    const withChanges = propose(
      propose(draft, { id: "s", kind: "split", beat: "weekly", parts: [{ speaker: "Speaker B", line: "a" }, { speaker: "Speaker B", line: "b" }] }),
      { id: "a", kind: "add", after: "weekly", cue: { speaker: "Speaker C", line: "c" } },
    );
    const scale = sequence(withChanges).find((slide) => slide.id === "scale")!;
    expect(scale.rows.map((row) => row.kind)).toEqual(["beat", "split", "add", "beat"]);
  });

  it("drops removed lines from the running time", () => {
    const removed = propose(draft, { id: "r", kind: "remove", beat: "losses" });
    expect(totalSeconds(removed)).toBeLessThan(totalSeconds(draft));
  });
});

describe("renameSpeaker", () => {
  it("renames every line a speaker has, including proposed ones", () => {
    const withAdd = propose(draft, { id: "a", kind: "add", after: "play", cue: { speaker: "Speaker A", line: "x" } });
    const renamed = renameSpeaker(withAdd, "Speaker A", "Brendan");
    expect(renamed.cues.skitText.speaker).toBe("Brendan");
    expect(renamed.proposals[0]).toMatchObject({ cue: { speaker: "Brendan" } });
  });
});

it("formats durations as minutes and seconds", () => {
  expect(formatDuration(112.4)).toBe("1:52");
  expect(formatDuration(9)).toBe("0:09");
});

describe("skit lines", () => {
  const first = skit[0];

  it("fill the skit slide and stay out of the talk's running time", () => {
    expect(sequence(draft)[0].rows).toHaveLength(skit.length);
    expect(totalSeconds({ ...draft, skit: [] })).toBeGreaterThan(totalSeconds(draft));
  });

  it("split, add and remove in place", () => {
    const split = splitSkitLine(draft, first.id, 0, "new");
    expect(split.skit[1]).toMatchObject({ id: "new", speaker: first.speaker });
    expect(split.skit).toHaveLength(skit.length + 1);
    expect(addSkitLine(draft, first.id, "added", "Duo").skit[1]).toEqual({ id: "added", speaker: "Duo", line: "" });
    expect(removeSkitLine(draft, first.id).skit[0]).toBe(skit[1]);
  });
});
