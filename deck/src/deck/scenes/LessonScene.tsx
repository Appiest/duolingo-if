"use client";

import { Fire } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { assetPath } from "../assetPath";
import { grid } from "../geometry";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const P_CHIPS = ["pretend", "problem", "pressure", "pay"] as const;
const P_NAMES = { pretend: "Pretend", problem: "Problem", pressure: "Pressure", pay: "Pay" };
const DAYS = 7;
const PANEL = { top: grid.titleTop, width: 780 };
const STREAK_LEFT = grid.right - PANEL.width;

export function LessonScene({ beat }: { beat: Beat }) {
  const fourPs = beat === "fourPs";
  return (
    <>
      <Headline when={beat === "pawnzyLesson"}>Pawnzy’s lesson</Headline>
      <Show when={beat === "pawnzyLesson"} delay={0.1} className="absolute" style={{ left: grid.left, top: 360 }}>
        <img src={assetPath("/characters/pawnzy-standing.png")} alt="" width={480} height={480} />
      </Show>

      <Headline when={fourPs}>The FTC’s 4 red flags</Headline>
      <div className="pointer-events-none absolute grid grid-cols-4 gap-6" style={{ left: grid.left, top: 800, width: grid.width }}>
        {P_CHIPS.map((tag, index) => (
          <Show key={tag} when={fourPs} delay={0.2 + index * 0.12}>
            <p
              className="rounded-card py-6 text-center text-[56px] leading-none font-black"
              style={{ backgroundColor: `var(--color-p-${tag}-wash)`, color: `var(--color-p-${tag})` }}
            >
              {P_NAMES[tag]}
            </p>
          </Show>
        ))}
      </div>

      <FadeChart shown={beat === "fades"} />
      <StreakWeek shown={beat === "fades"} />
    </>
  );
}

const FADE_POINTS = [
  { label: "Before", x: 60, lift: 0 },
  { label: "After", x: 390, lift: 14 },
  { label: "4 weeks", x: 720, lift: 0 },
];

function FadeChart({ shown }: { shown: boolean }) {
  const y = (lift: number) => 360 - lift * 18;
  const path = FADE_POINTS.map((point, index) => `${index ? "L" : "M"}${point.x} ${y(point.lift)}`).join(" ");
  return (
    <Show when={shown} delay={0.1} className="absolute" style={{ left: grid.left, top: PANEL.top, width: PANEL.width }}>
      <p className="text-headline font-black text-ink">One lesson</p>
      <svg viewBox={`0 0 ${PANEL.width} 440`} width={PANEL.width} height={440} className="mt-24 overflow-visible">
        <line x1={0} x2={PANEL.width} y1={y(0)} y2={y(0)} stroke="var(--color-line)" strokeWidth={4} strokeDasharray="10 12" />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: shown ? 1 : 0 }}
          transition={{ duration: 1.4, ease: [0.2, 0, 0, 1], delay: shown ? 0.4 : 0 }}
        />
        {FADE_POINTS.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={y(point.lift)} r={16} fill="var(--color-blue)" />
            <text x={point.x} y={y(0) + 64} textAnchor="middle" className="fill-ink-muted text-[30px] font-extrabold">{point.label}</text>
          </g>
        ))}
        <text x={390} y={y(14) - 40} textAnchor="middle" className="fill-blue-text text-[56px] font-black">+14%</text>
      </svg>
    </Show>
  );
}

function StreakWeek({ shown }: { shown: boolean }) {
  return (
    <Show when={shown} delay={0.9} className="absolute" style={{ left: STREAK_LEFT, top: PANEL.top, width: PANEL.width }}>
      <p className="text-headline font-black text-ink">Every day</p>
      <div className="mt-[300px] flex justify-between">
        {Array.from({ length: DAYS }, (_, index) => (
          <motion.span
            key={index}
            className="grid size-[104px] place-items-center rounded-full bg-[#fff0d9]"
            initial={false}
            animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            transition={{ ...sceneMove, delay: shown ? 1.2 + index * 0.12 : 0 }}
          >
            <Fire size={64} weight="fill" className="text-[#ff9600]" />
          </motion.span>
        ))}
      </div>
    </Show>
  );
}
