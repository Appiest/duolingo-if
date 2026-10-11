import cueData from "./cues.json";
import type { Beat } from "./script";

export type Cue = { speaker: string; line: string };

// Edited from the /script page, which saves straight into cues.json.
export const cues: Record<Beat, Cue> = cueData;
