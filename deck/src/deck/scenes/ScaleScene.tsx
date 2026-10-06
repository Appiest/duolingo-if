"use client";

import { motion } from "motion/react";
import { grid } from "../geometry";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const STREAM = [
  { sender: "USPS", text: "Package on hold: usps-help.co" },
  { sender: "E-ZPass", text: "Unpaid toll: pay $6.99 today" },
  { sender: "Bank Alert", text: "Your account is locked" },
  { sender: "Game Team", text: "You won 10,000 free coins!" },
  { sender: "Job Offer", text: "Earn $500 a day from home" },
  { sender: "Netflix", text: "Payment failed. Update now" },
];
const STREAM_GRID = { left: 860, top: 250, columnWidth: 440, columnGap: 40, rowGap: 210, offset: 100 };

const LOSSES = [
  { year: 2020, millions: 86 },
  { year: 2021, millions: 131 },
  { year: 2022, millions: 326 },
  { year: 2023, millions: 372 },
  { year: 2024, millions: 470 },
];
const CHART = { baseline: 880, tallest: 460, barWidth: 220 };
const CHART_GAP = (grid.width - LOSSES.length * CHART.barWidth) / (LOSSES.length - 1);

export function ScaleScene({ beat }: { beat: Beat }) {
  return (
    <>
      <Show when={beat === "topContact"} className="absolute w-[620px]" style={{ left: grid.left, top: 330 }}>
        <p className="text-[300px] leading-none font-black text-red">#1</p>
        <p className="mt-6 text-lede font-extrabold text-ink">way scammers reach people</p>
      </Show>
      <Stream shown={beat === "topContact"} />

      <Show when={beat === "weekly"} className="absolute flex items-center gap-16" style={{ left: grid.left, top: 380 }}>
        <p className="text-[300px] leading-none font-black text-red tabular-nums">61%</p>
        <p className="w-[760px] text-[64px] leading-[1.15] font-extrabold text-ink">of adults get a scam text every week</p>
      </Show>

      <Headline when={beat === "losses"}>Money lost to text scams</Headline>
      <LossChart shown={beat === "losses"} />
    </>
  );
}

function Stream({ shown }: { shown: boolean }) {
  return (
    <>
      {STREAM.map((message, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        return (
          <motion.div
            key={message.sender}
            className="pointer-events-none absolute"
            style={{
              left: STREAM_GRID.left + column * (STREAM_GRID.columnWidth + STREAM_GRID.columnGap),
              top: STREAM_GRID.top + row * STREAM_GRID.rowGap + column * STREAM_GRID.offset,
              width: STREAM_GRID.columnWidth,
            }}
            initial={false}
            animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.8 }}
            transition={{ ...sceneMove, delay: shown ? 0.15 + index * 0.1 : 0 }}
            aria-hidden={!shown}
          >
            <p className="mb-2 pl-5 text-[26px] font-extrabold text-ink-muted">{message.sender}</p>
            <p className="rounded-[30px] rounded-bl-[10px] bg-sms-in px-7 py-5 text-[32px] leading-snug font-semibold text-black">{message.text}</p>
          </motion.div>
        );
      })}
    </>
  );
}

function LossChart({ shown }: { shown: boolean }) {
  const most = Math.max(...LOSSES.map((point) => point.millions));
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden={!shown}>
      {LOSSES.map((point, index) => {
        const height = (point.millions / most) * CHART.tallest;
        const left = grid.left + index * (CHART.barWidth + CHART_GAP);
        const latest = index === LOSSES.length - 1;
        return (
          <div key={point.year}>
            <motion.div
              className={`absolute rounded-t-[24px] ${latest ? "bg-red" : "bg-[#c9ccd1]"}`}
              style={{ left, width: CHART.barWidth, top: CHART.baseline - height, height, transformOrigin: "50% 100%" }}
              initial={false}
              animate={{ scaleY: shown ? 1 : 0 }}
              transition={{ ...sceneMove, delay: shown ? 0.2 + index * 0.12 : 0 }}
            />
            <Show when={shown} delay={0.5 + index * 0.12} rise={12} className="absolute text-center" style={{ left, width: CHART.barWidth, top: CHART.baseline - height - 80 }}>
              <p className={`text-[52px] leading-none font-black tabular-nums ${latest ? "text-red-text" : "text-ink"}`}>${point.millions}M</p>
            </Show>
            <Show when={shown} rise={0} className="absolute text-center" style={{ left, width: CHART.barWidth, top: CHART.baseline + 22 }}>
              <p className="text-caption leading-none font-extrabold text-ink-muted tabular-nums">{point.year}</p>
            </Show>
          </div>
        );
      })}
    </div>
  );
}
