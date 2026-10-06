import { assetPath } from "../assetPath";
import { grid } from "../geometry";
import { Show } from "../parts/Show";
import { lessonUrl, qrPath, qrSize } from "../qr";
import type { Beat } from "../script";

const QR = { size: 600, padding: 56 };
const QR_LEFT = grid.right - QR.size - 2 * QR.padding;

export function PlayScene({ beat }: { beat: Beat }) {
  const shown = beat === "play";
  return (
    <>
      <Show when={shown} className="absolute w-[900px]" style={{ left: grid.left, top: 180 }}>
        <h2 className="text-[120px] leading-[0.95] font-black text-ink">Play Pawnzy’s lesson</h2>
        <p className="mt-8 text-body font-extrabold text-blue-text">{lessonUrl.replace("https://", "")}</p>
      </Show>
      <Show when={shown} delay={0.25} className="absolute flex items-end gap-4" style={{ left: grid.left, top: 560 }}>
        <img src={assetPath("/characters/pawnzy-celebrate.svg")} alt="" width={320} height={320} className="translate-y-[26px]" />
        <img src={assetPath("/characters/duo.png")} alt="" width={260} height={260} />
      </Show>
      <Show
        when={shown}
        delay={0.15}
        className="absolute rounded-[48px] bg-white shadow-[0_2px_4px_rgb(0_0_0/0.06),0_24px_60px_-12px_rgb(0_0_0/0.18)]"
        style={{ left: QR_LEFT, top: (1080 - QR.size - 2 * QR.padding) / 2, padding: QR.padding }}
      >
        <svg viewBox={`-2 -2 ${qrSize + 4} ${qrSize + 4}`} width={QR.size} height={QR.size} role="img" aria-label={`QR code for ${lessonUrl}`} shapeRendering="crispEdges">
          <path d={qrPath} fill="#1c1d20" />
        </svg>
      </Show>
    </>
  );
}
