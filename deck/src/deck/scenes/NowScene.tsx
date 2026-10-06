"use client";

import { DeviceMobile, Flag } from "@phosphor-icons/react";
import { grid } from "../geometry";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import type { Beat } from "../script";

const GRADES = [1, 2, 3, 4, 5, 6];
const STRIP = { top: 600, gap: 24, height: 150 };
const COLUMN = (grid.width - 5 * STRIP.gap) / 6;

function columnLeft(grade: number) {
  return grid.left + (grade - 1) * (COLUMN + STRIP.gap);
}

function gradeFill(grade: number) {
  if (grade === 6) return "bg-red text-white";
  if (grade >= 3) return "bg-green text-white";
  return "bg-stage-sunken text-ink-muted";
}

export function NowScene({ beat }: { beat: Beat }) {
  const gap = beat === "gradeGap";
  return (
    <>
      <Headline when={beat === "aiTypos"}>AI fixes the typos</Headline>

      <Headline when={gap}>Phones come first</Headline>
      {GRADES.map((grade, index) => (
        <Show key={grade} when={gap} delay={index * 0.06} rise={12} className="absolute" style={{ left: columnLeft(grade), top: STRIP.top, width: COLUMN }}>
          <div className={`flex items-center justify-center rounded-[28px] ${gradeFill(grade)}`} style={{ height: STRIP.height }}>
            <p className="text-[48px] font-black">Grade {grade}</p>
          </div>
        </Show>
      ))}
      {[3, 4, 5].map((grade, index) => (
        <Show key={grade} when={gap} delay={0.5 + index * 0.12} className="absolute flex justify-center" style={{ left: columnLeft(grade), top: STRIP.top - 190, width: COLUMN }}>
          <DeviceMobile size={150} weight="fill" className="text-green" />
        </Show>
      ))}
      <Show when={gap} delay={1} className="absolute flex flex-col items-center" style={{ left: columnLeft(6), top: STRIP.top - 250, width: COLUMN }}>
        <Flag size={130} weight="fill" className="text-red" />
        <p className="mt-2 text-center text-body leading-tight font-black text-red-text">First scam lesson</p>
      </Show>
    </>
  );
}
