"use client";

import { Headline } from "../parts/Headline";
import type { Beat } from "../script";

export function NowScene({ beat }: { beat: Beat }) {
  return <Headline when={beat === "aiTypos"}>AI fixes the typos</Headline>;
}
