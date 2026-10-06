"use client";

import { ScamBubble } from "./parts/ScamBubble";
import { KidsScene } from "./scenes/KidsScene";
import { LessonScene } from "./scenes/LessonScene";
import { NowScene } from "./scenes/NowScene";
import { PlayScene } from "./scenes/PlayScene";
import { RealScene } from "./scenes/RealScene";
import { ScaleScene } from "./scenes/ScaleScene";
import { SkitScene } from "./scenes/SkitScene";
import type { Beat } from "./script";

export function Scene({ beat }: { beat: Beat }) {
  return (
    <>
      <SkitScene beat={beat} />
      <RealScene beat={beat} />
      <ScaleScene beat={beat} />
      <KidsScene beat={beat} />
      <NowScene beat={beat} />
      <LessonScene beat={beat} />
      <PlayScene beat={beat} />
      <ScamBubble beat={beat} />
    </>
  );
}
