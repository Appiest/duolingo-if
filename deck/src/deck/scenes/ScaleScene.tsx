"use client";

import { motion } from "motion/react";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { SourceNote } from "../parts/SourceNote";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const STREAM = [
  { sender: "USPS", text: "Your package is on hold. Confirm your address: usps-help.co", x: 120, y: 340 },
  { sender: "Bank Alert", text: "Did you try a $892 purchase? Reply YES or NO", x: 700, y: 380 },
  { sender: "E-ZPass", text: "Unpaid toll of $6.99. Pay today to avoid fees", x: 1280, y: 330 },
  { sender: "Unknown", text: "Hi! Is this Emma? We met at the park last week", x: 220, y: 570 },
  { sender: "Job Offer", text: "Earn $500 a day liking videos. Text me to start!", x: 800, y: 600 },
  { sender: "Game Team", text: "You won 10,000 free coins! Claim in 10 minutes", x: 1360, y: 560 },
  { sender: "Amazon", text: "Your account is locked. Verify now: amzn-secure.net", x: 120, y: 790 },
  { sender: "Netflix", text: "Payment failed. Update now to keep watching", x: 700, y: 820 },
  { sender: "Prize Desk", text: "Congrats! You won a $1,000 gift card", x: 1280, y: 790 },
];

const LOSSES = [
  { year: 2020, millions: 86 },
  { year: 2021, millions: 131 },
  { year: 2022, millions: 326 },
  { year: 2023, millions: 372 },
  { year: 2024, millions: 470 },
];

const CHART = { left: 315, baseline: 900, barWidth: 170, gap: 110, tallest: 500 };

export function ScaleScene({ beat }: { beat: Beat }) {
  return (
    <>
      <Headline when={beat === "topContact"}>Text is the #1 way scammers reach people.</Headline>
      <Stream shown={beat === "topContact"} />
      <SourceNote when={beat === "topContact"} keys={["ftcTopContact"]} />

      <Show when={beat === "weekly"} className="absolute left-[120px] top-[250px] flex items-center gap-16">
        <p className="text-[360px] leading-none font-black text-red tabular-nums">61%</p>
        <p className="w-[820px] text-[64px] leading-[1.15] font-extrabold text-ink" style={{ textWrap: "balance" }}>
          of U.S. adults get a scam text at least once a week
        </p>
      </Show>
      <SourceNote when={beat === "weekly"} keys={["pewWeekly"]} />

      <Headline when={beat === "losses"}>Text scam losses grew more than 5× in four years.</Headline>
      <LossChart shown={beat === "losses"} />
      <SourceNote
        when={beat === "losses"}
        keys={["ftcTextLosses"]}
        note="Reported losses only. The FTC says most fraud is never reported."
      />
    </>
  );
}

function Stream({ shown }: { shown: boolean }) {
  return (
    <>
      {STREAM.map((message, index) => (
        <motion.div
          key={message.sender}
          className="pointer-events-none absolute w-[500px]"
          style={{ left: message.x, top: message.y }}
          initial={false}
          animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.8 }}
          transition={{ ...sceneMove, delay: shown ? 0.15 + index * 0.09 : 0 }}
          aria-hidden={!shown}
        >
          <p className="mb-1 pl-4 text-[24px] font-extrabold text-ink-muted">{message.sender}</p>
          <p className="rounded-[28px] rounded-bl-[10px] bg-sms-in px-6 py-4 text-[28px] leading-snug font-semibold text-black">
            {message.text}
          </p>
        </motion.div>
      ))}
    </>
  );
}

function LossChart({ shown }: { shown: boolean }) {
  const most = Math.max(...LOSSES.map((point) => point.millions));
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden={!shown}>
      {LOSSES.map((point, index) => {
        const height = (point.millions / most) * CHART.tallest;
        const left = CHART.left + index * (CHART.barWidth + CHART.gap);
        const latest = index === LOSSES.length - 1;
        return (
          <div key={point.year}>
            <motion.div
              className={`absolute rounded-t-[20px] ${latest ? "bg-red" : "bg-[#c9ccd1]"}`}
              style={{ left, width: CHART.barWidth, top: CHART.baseline - height, height, transformOrigin: "50% 100%" }}
              initial={false}
              animate={{ scaleY: shown ? 1 : 0 }}
              transition={{ ...sceneMove, delay: shown ? 0.2 + index * 0.12 : 0 }}
            />
            <Show when={shown} delay={0.5 + index * 0.12} rise={12} className="absolute text-center" style={{ left, width: CHART.barWidth, top: CHART.baseline - height - 76 }}>
              <p className={`text-[48px] font-black tabular-nums ${latest ? "text-red-text" : "text-ink"}`}>${point.millions}M</p>
            </Show>
            <Show when={shown} rise={0} className="absolute text-center" style={{ left, width: CHART.barWidth, top: CHART.baseline + 18 }}>
              <p className="text-caption font-extrabold text-ink-muted tabular-nums">{point.year}</p>
            </Show>
          </div>
        );
      })}
      <Show when={shown} rise={0} className="absolute" style={{ left: CHART.left, top: CHART.baseline, width: 5 * CHART.barWidth + 4 * CHART.gap, height: 4 }}>
        <div className="h-1 w-full rounded bg-line" />
      </Show>
    </div>
  );
}
