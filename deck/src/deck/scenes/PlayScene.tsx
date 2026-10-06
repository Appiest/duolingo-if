import { assetPath } from "../assetPath";
import { Show } from "../parts/Show";
import { lessonUrl, qrPath, qrSize } from "../qr";
import type { Beat } from "../script";

export function PlayScene({ beat }: { beat: Beat }) {
  const shown = beat === "play";
  return (
    <>
      <Show when={shown} className="absolute left-[120px] top-[140px] w-[920px]">
        <h2 className="text-[132px] leading-[0.95] font-black text-ink" style={{ textWrap: "balance" }}>Play Pawnzy’s lesson</h2>
        <p className="mt-10 text-lede font-bold text-ink-muted">Scan the code, then try to beat the boss question.</p>
        <p className="mt-6 text-body font-extrabold text-blue-text">{lessonUrl.replace("https://", "")}</p>
      </Show>
      <Show when={shown} delay={0.25} className="absolute left-[100px] top-[690px] flex items-end gap-2">
        <img src={assetPath("/characters/pawnzy-celebrate.svg")} alt="" width={300} height={300} />
        <img src={assetPath("/characters/duo.png")} alt="" width={240} height={240} />
      </Show>
      <Show when={shown} delay={0.15} className="absolute left-[1140px] top-[200px] rounded-[48px] bg-white p-14 shadow-[0_2px_4px_rgb(0_0_0/0.06),0_24px_60px_-12px_rgb(0_0_0/0.18)]">
        <svg viewBox={`-2 -2 ${qrSize + 4} ${qrSize + 4}`} width={560} height={560} role="img" aria-label={`QR code for ${lessonUrl}`} shapeRendering="crispEdges">
          <path d={qrPath} fill="#1c1d20" />
        </svg>
      </Show>
    </>
  );
}
