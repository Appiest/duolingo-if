"use client";

import { Fire } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { assetPath } from "../assetPath";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { SourceNote } from "../parts/SourceNote";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const P_CHIPS = [
  { tag: "pretend", name: "Pretend", meaning: "says it’s someone you trust" },
  { tag: "problem", name: "Problem", meaning: "says something is wrong" },
  { tag: "pressure", name: "Pressure", meaning: "rushes you" },
  { tag: "pay", name: "Pay", meaning: "asks for money a weird way" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function LessonScene({ beat }: { beat: Beat }) {
  return (
    <>
      <Headline when={beat === "pawnzyLesson"}>Pawnzy’s lesson teaches kids before they need it.</Headline>
      <Show when={beat === "pawnzyLesson"} delay={0.1} className="absolute left-[150px] top-[360px]">
        <img src={assetPath("/characters/pawnzy-happy.svg")} alt="" width={460} height={460} />
      </Show>

      <Headline when={beat === "fourPs"}>The same red flags the FTC tells parents to teach.</Headline>
      <div className="pointer-events-none absolute left-[120px] right-[120px] top-[790px] grid grid-cols-4 gap-8">
        {P_CHIPS.map((chip, index) => (
          <Show key={chip.tag} when={beat === "fourPs"} delay={0.2 + index * 0.12}>
            <div className="rounded-card px-8 py-6" style={{ backgroundColor: `var(--color-p-${chip.tag}-wash)` }}>
              <p className="text-[52px] leading-none font-black" style={{ color: `var(--color-p-${chip.tag})` }}>{chip.name}</p>
              <p className="mt-3 text-caption font-bold text-ink">{chip.meaning}</p>
            </div>
          </Show>
        ))}
      </div>
      <SourceNote when={beat === "fourPs"} keys={["ftcParents"]} />

      <Headline when={beat === "fades"}>One lesson fades. A daily habit keeps coming back.</Headline>
      <FadeChart shown={beat === "fades"} />
      <StreakWeek shown={beat === "fades"} />
      <SourceNote when={beat === "fades"} keys={["soupsStudy"]} note="The streak shows our approach, not study data." />
    </>
  );
}

const FADE = { width: 760, height: 360, left: 120, top: 360 };
const FADE_POINTS = [
  { label: "Before", x: 80, lift: 0 },
  { label: "Right after", x: 380, lift: 14 },
  { label: "4 weeks later", x: 680, lift: 0 },
];

function FadeChart({ shown }: { shown: boolean }) {
  const y = (lift: number) => 290 - lift * 14;
  const path = FADE_POINTS.map((point, index) => `${index ? "L" : "M"}${point.x} ${y(point.lift)}`).join(" ");
  return (
    <Show when={shown} delay={0.1} className="absolute" style={{ left: FADE.left, top: FADE.top, width: FADE.width }}>
      <p className="text-body font-extrabold text-ink">Kids’ phishing test scores after one lesson</p>
      <svg viewBox={`0 0 ${FADE.width} ${FADE.height}`} width={FADE.width} height={FADE.height} className="mt-6 overflow-visible">
        <line x1={40} x2={720} y1={290} y2={290} stroke="var(--color-line)" strokeWidth={4} strokeDasharray="10 12" />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: shown ? 1 : 0 }}
          transition={{ duration: 1.4, ease: [0.2, 0, 0, 1], delay: shown ? 0.4 : 0 }}
        />
        {FADE_POINTS.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={y(point.lift)} r={14} fill="var(--color-blue)" />
            <text x={point.x} y={338} textAnchor="middle" className="fill-ink-muted text-[26px] font-extrabold">{point.label}</text>
          </g>
        ))}
        <text x={380} y={y(14) - 36} textAnchor="middle" className="fill-blue-text text-[44px] font-black">+14%</text>
        <text x={680} y={376} textAnchor="middle" className="fill-ink text-[28px] font-black">back to the start</text>
      </svg>
    </Show>
  );
}

function StreakWeek({ shown }: { shown: boolean }) {
  return (
    <Show when={shown} delay={0.9} className="absolute left-[1000px] top-[360px] w-[800px]">
      <p className="text-body font-extrabold text-ink">Duolingo brings kids back every day</p>
      <div className="mt-10 flex gap-4">
        {DAYS.map((day, index) => (
          <motion.div
            key={day}
            className="flex w-[96px] flex-col items-center gap-3"
            initial={false}
            animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            transition={{ ...sceneMove, delay: shown ? 1.2 + index * 0.12 : 0 }}
          >
            <span className="grid size-[96px] place-items-center rounded-full bg-[#fff0d9]">
              <Fire size={60} weight="fill" className="text-[#ff9600]" />
            </span>
            <span className="text-caption font-extrabold text-ink-muted">{day}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-10 text-lede font-black text-[#c56a00]">7-day streak</p>
    </Show>
  );
}
