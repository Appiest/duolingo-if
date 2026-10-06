export const slides = [
  { id: "skit", beats: ["skitStage"] },
  { id: "real", beats: ["skitText", "fbiWarning"] },
  { id: "scale", beats: ["topContact", "weekly", "losses"] },
  { id: "kids", beats: ["phones", "youngLosses"] },
  { id: "now", beats: ["aiTypos", "gradeGap"] },
  { id: "lesson", beats: ["pawnzyLesson", "fourPs", "fades"] },
  { id: "play", beats: ["play"] },
] as const;

export type SlideId = (typeof slides)[number]["id"];
export type Beat = (typeof slides)[number]["beats"][number];

export const outline = slides.map((slide) => slide.beats.length);

const beatOrder: readonly Beat[] = slides.flatMap((slide) => slide.beats);

export function isAtOrAfter(beat: Beat, milestone: Beat): boolean {
  return beatOrder.indexOf(beat) >= beatOrder.indexOf(milestone);
}

export function slideOf(beat: Beat): SlideId {
  return slides.find((slide) => (slide.beats as readonly Beat[]).includes(beat))!.id;
}
