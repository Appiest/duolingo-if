"use client";

import { CheckCircle } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { useMemo } from "react";
import { canvas } from "../geometry";
import { Show } from "../parts/Show";
import { remoteAvailable, remoteUrl } from "./channel";

const QR_SIZE = 520;
const CARD = { width: 1380, height: 720 };

function qrModules(url: string) {
  const { size, data } = QRCode.create(url, { errorCorrectionLevel: "M" }).modules;
  let path = "";
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (data[row * size + column]) path += `M${column} ${row}h1v1h-1z`;
    }
  }
  return { size, path };
}

// Shown over the slide with P. It closes by itself a moment after the phone
// connects, so the audience never has to see it.
export function PairingCard({ room, shown, phoneConnected }: { room: string | null; shown: boolean; phoneConnected: boolean }) {
  const qr = useMemo(() => (room ? qrModules(remoteUrl(room)) : null), [room]);
  return (
    <Show
      when={shown && qr !== null}
      className="absolute z-50 flex items-center gap-20 rounded-[56px] bg-white p-20 shadow-[0_2px_4px_rgb(0_0_0/0.06),0_40px_100px_-20px_rgb(0_0_0/0.3)]"
      style={{ left: (canvas.w - CARD.width) / 2, top: (canvas.h - CARD.height) / 2, width: CARD.width, height: CARD.height }}
    >
      <div className="flex-1">
        <h2 className="text-title font-black text-ink">Use your phone as a clicker</h2>
        <p className="mt-6 text-body font-bold text-ink-muted">Scan this with your phone’s camera. Tap the big button on your phone to go to the next slide.</p>
        <ConnectionState phoneConnected={phoneConnected} />
      </div>
      {qr && (
        <svg viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`} width={QR_SIZE} height={QR_SIZE} role="img" aria-label="QR code for the phone remote" shapeRendering="crispEdges" className="shrink-0">
          <path d={qr.path} fill="#1c1d20" />
        </svg>
      )}
    </Show>
  );
}

function ConnectionState({ phoneConnected }: { phoneConnected: boolean }) {
  if (!remoteAvailable) {
    return <p className="mt-12 text-lede font-extrabold text-red-text">This copy of the deck was built without the clicker key.</p>;
  }
  if (phoneConnected) {
    return (
      <p className="mt-12 flex items-center gap-4 text-lede font-black text-green-text">
        <CheckCircle size={56} weight="fill" />
        Phone connected
      </p>
    );
  }
  return (
    <p className="mt-12 flex items-center gap-5 text-lede font-extrabold text-ink-muted">
      <span className="relative flex size-6">
        <span className="absolute inset-0 animate-ping rounded-full bg-blue opacity-60 motion-reduce:hidden" />
        <span className="relative size-6 rounded-full bg-blue" />
      </span>
      Waiting for your phone
    </p>
  );
}
