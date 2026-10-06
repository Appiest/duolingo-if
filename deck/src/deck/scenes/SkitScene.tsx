import { assetPath } from "../assetPath";
import { Show } from "../parts/Show";
import type { Beat } from "../script";

// Stays up during the skit, so it holds still and keeps to the title.
export function SkitScene({ beat }: { beat: Beat }) {
  const shown = beat === "skitStage";
  return (
    <>
      <Show when={shown} className="absolute inset-x-0 top-[170px] text-center">
        <h2 className="text-[200px] leading-none font-black text-ink">Real or Scam?</h2>
      </Show>
      <Show when={shown} delay={0.2} className="absolute inset-x-0 top-[470px] flex items-end justify-center gap-16">
        <img src={assetPath("/characters/pawnzy-idle.svg")} alt="" width={420} height={420} className="translate-y-[34px]" />
        <img src={assetPath("/characters/duo.png")} alt="" width={360} height={360} />
      </Show>
    </>
  );
}
