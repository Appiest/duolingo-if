"use client";

import { ScamBubble } from "./parts/ScamBubble";
import { DrawingScene } from "./scenes/DrawingScene";
import { EndingScene } from "./scenes/EndingScene";
import { KidsScene } from "./scenes/KidsScene";
import { LessonScene } from "./scenes/LessonScene";
import { NowScene } from "./scenes/NowScene";
import { PlayScene } from "./scenes/PlayScene";
import { RealScene } from "./scenes/RealScene";
import { ScaleScene } from "./scenes/ScaleScene";
import { SkitScene } from "./scenes/SkitScene";
import type { Beat } from "./script";
import type { SkitVisual } from "./skit";

export function Scene({ beat, skitVisual = "backdrop" }: { beat: Beat; skitVisual?: SkitVisual }) {
  return (
    <>
      <SkitScene beat={beat} visual={skitVisual} />
      <RealScene beat={beat} />
      <ScaleScene beat={beat} />
      <KidsScene beat={beat} />
      <NowScene beat={beat} />
      <LessonScene beat={beat} />
      <DrawingScene beat={beat} />
      <EndingScene beat={beat} />
      <PlayScene beat={beat} />
      <ScamBubble beat={beat} />
    </>
  );
}
