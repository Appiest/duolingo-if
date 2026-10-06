import type { Transition } from "motion/react";
import type { Beat } from "./script";

// Presenters click ahead of a move as often as not, so moves are springs that
// retarget smoothly from wherever they are. Bounce stays at a tiny overshoot.
export const sceneMove: Transition = { type: "spring", duration: 1.1, bounce: 0.12 };

export const quickFade: Transition = { duration: 0.5, ease: [0.2, 0, 0, 1] };

export function pick<T>(states: Partial<Record<Beat, T>>, beat: Beat, fallback: T): T {
  return states[beat] ?? fallback;
}
