"use client";

import { PencilSimpleLine } from "@phosphor-icons/react";
import Link from "next/link";
import { memo } from "react";
import { canvas } from "@/deck/geometry";
import { Scene } from "@/deck/Scene";
import type { Beat } from "@/deck/script";
import { toSearch, type Position } from "@/deck/timeline";

const WIDTH = 240;
const SCALE = WIDTH / canvas.w;
const frame = "relative block shrink-0 overflow-hidden rounded-xl";
const frameSize = { width: WIDTH, height: canvas.h * SCALE };

type ThumbnailProps = { beat: Beat; position: Position; faded?: boolean };

function samePlace(before: ThumbnailProps, after: ThumbnailProps) {
  return before.beat === after.beat && before.faded === after.faded && before.position.slide === after.position.slide && before.position.beat === after.position.beat;
}

// Each one renders a whole slide, so typing a line must not redraw them all.
export const Thumbnail = memo(function Thumbnail({ beat, position, faded }: ThumbnailProps) {
  return (
    <Link
      href={`/${toSearch(position)}`}
      target="_blank"
      aria-label={`Open slide ${position.slide + 1}, beat ${position.beat + 1} in the deck`}
      className={`${frame} bg-stage shadow-[0_1px_2px_rgb(0_0_0/0.08),0_6px_16px_-6px_rgb(0_0_0/0.16)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_2px_4px_rgb(0_0_0/0.1),0_12px_28px_-8px_rgb(0_0_0/0.22)] focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none`}
      style={frameSize}
    >
      <div className={faded ? "opacity-35 grayscale" : undefined} style={{ width: canvas.w, height: canvas.h, transform: `scale(${SCALE})`, transformOrigin: "0 0" }} aria-hidden>
        <Scene beat={beat} />
      </div>
    </Link>
  );
}, samePlace);

export function SlideNeeded() {
  return (
    <div className={`${frame} hatch grid place-items-center bg-draft-wash text-draft`} style={frameSize}>
      <span className="flex flex-col items-center gap-1 text-sm font-extrabold">
        <PencilSimpleLine size={28} weight="duotone" aria-hidden />
        New slide needed
      </span>
    </div>
  );
}
