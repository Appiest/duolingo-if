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
      <Show when={shown} delay={0.2} className="absolute inset-x-0 top-[420px] flex items-end justify-center gap-10">
        <img src={assetPath("/characters/book.png")} alt="" width={190} height={190} className="mb-4" />
        <img src={assetPath("/characters/pawnzy-standing.png")} alt="" width={480} height={480} />
        <img src={assetPath("/characters/duo.png")} alt="" width={380} height={380} />
        <img src={assetPath("/characters/apple.png")} alt="" width={140} height={140} className="mb-5" />
      </Show>
    </>
  );
}
