import type { Cue } from "./cues";
import skitData from "./skit.json";

export type SkitLine = Cue & { id: string };

// Plays in front of the first slide. Edited from the /script page.
export const skit: SkitLine[] = skitData;
