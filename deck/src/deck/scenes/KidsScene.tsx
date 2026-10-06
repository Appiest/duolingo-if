"use client";

import { DeviceMobile } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { SourceNote } from "../parts/SourceNote";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const ROWS = [
  { ages: "Ages 8–10", percent: 29, top: 330 },
  { ages: "Ages 11–12", percent: 57, top: 600 },
];

export function KidsScene({ beat }: { beat: Beat }) {
  const phones = beat === "phones";
  const losses = beat === "youngLosses";
  return (
    <>
      <Headline when={phones}>Kids get their own phones in elementary school.</Headline>
      {ROWS.map((row, rowIndex) => (
        <PhoneRow key={row.ages} {...row} shown={phones} delay={0.2 + rowIndex * 0.9} />
      ))}
      <SourceNote when={phones} keys={["pewKidsPhones"]} note="Share of kids with their own smartphone, by age." />

      <Headline when={losses}>Young people are the most likely to lose money to fraud.</Headline>
      <Show when={losses} delay={0.15} className="absolute left-[120px] top-[400px] w-[900px]">
        <p className="text-[300px] leading-none font-black text-red tabular-nums">51%</p>
        <p className="mt-6 text-lede font-extrabold text-ink" style={{ textWrap: "balance" }}>
          of fraud reports from people 19 and under involved losing money
        </p>
      </Show>
      <Show when={losses} delay={0.5} className="absolute left-[1140px] top-[520px] w-[660px]">
        <p className="text-[160px] leading-none font-black text-ink-faint tabular-nums">21%</p>
        <p className="mt-6 text-body font-bold text-ink-muted">for people 80 and over</p>
      </Show>
      <SourceNote when={losses} keys={["ftcAgeLosses"]} note="2024 fraud reports that included the person’s age." />
    </>
  );
}

function PhoneRow({ ages, percent, top, shown, delay }: { ages: string; percent: number; top: number; shown: boolean; delay: number }) {
  const lit = Math.round(percent / 10);
  return (
    <div className="pointer-events-none absolute left-[120px] flex items-center gap-12" style={{ top }} aria-hidden={!shown}>
      <Show when={shown} delay={delay} className="w-[360px]">
        <p className="text-[120px] leading-none font-black text-ink tabular-nums">{percent}%</p>
        <p className="mt-2 text-body font-extrabold text-ink-muted">{ages}</p>
      </Show>
      <div className="flex gap-6">
        {Array.from({ length: 10 }, (_, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ ...sceneMove, delay: shown ? delay + 0.15 + index * 0.06 : 0 }}
          >
            <DeviceMobile size={112} weight={index < lit ? "fill" : "regular"} className={index < lit ? "text-green" : "text-[#d3d6da]"} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
