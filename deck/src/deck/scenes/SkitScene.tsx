"use client";

import { assetPath } from "../assetPath";
import { Show } from "../parts/Show";
import type { Beat } from "../script";
import type { SkitVisual } from "../skit";
import { Backstory, StaySafe, Swoop } from "./skit/PawnzyMoments";
import { Phone } from "./skit/Phone";
import { RedFlags } from "./skit/RedFlags";

// Plays behind the live skit. Each visual comes up on the skit line that
// starts it, so the slide never moves faster than the actors.
export function SkitScene({ beat, visual }: { beat: Beat; visual: SkitVisual }) {
  const shownVisual = beat === "skitStage" ? visual : undefined;
  return (
    <>
      <Backdrop shown={shownVisual === "backdrop"} />
      <Phone visual={shownVisual ?? "backdrop"} />
      <Swoop shown={shownVisual === "swoop"} />
      <Backstory shown={shownVisual === "backstory"} />
      <RedFlags shown={shownVisual === "flags"} />
      <StaySafe shown={shownVisual === "safe"} />
    </>
  );
}

const TEAM = ["Brendan Giang", "Cara Austring", "Anne Pham", "Alexis Limary", "Jerry Wu"];

function Backdrop({ shown }: { shown: boolean }) {
  return (
    <>
      <Show when={shown} className="absolute inset-x-0 top-[170px] text-center">
        <h2 className="text-[200px] leading-none font-black text-ink">Real or Scam?</h2>
      </Show>
      <Show when={shown} delay={0.2} className="absolute inset-x-0 top-[420px] flex items-end justify-center gap-10">
        <img src={assetPath("/characters/book.png")} alt="" width={190} height={190} className="mb-4" />
        <img src={assetPath("/characters/pawnzy-standing.png")} alt="" width={480} height={480} />
        <img src={assetPath("/characters/duo.png")} alt="" width={380} height={380} />
        <img src={assetPath("/characters/apple.png")} alt="" width={140} height={140} className="mb-5" />
      </Show>
      <Show when={shown} delay={0.4} className="absolute inset-x-0 top-[940px]">
        <ul className="flex justify-center gap-16 text-body font-extrabold text-ink-muted">
          {TEAM.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </Show>
    </>
  );
}
