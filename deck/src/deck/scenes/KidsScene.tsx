"use client";

import { DeviceMobile } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { grid } from "../geometry";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

const PHONE_ROWS = [
  { ages: "Ages 8–10", percent: 29, top: 360 },
  { ages: "Ages 11–12", percent: 57, top: 640 },
];
const PHONE = { size: 112, gap: 18, labelWidth: 400 };

const LOSS_BARS = [
  { ages: "Ages 19 and under", percent: 51, top: 380, color: "bg-red", text: "text-red-text" },
  { ages: "Ages 80 and over", percent: 21, top: 660, color: "bg-[#c9ccd1]", text: "text-ink-muted" },
];
const BAR = { left: 640, full: 1160, height: 120 };

export function KidsScene({ beat }: { beat: Beat }) {
  const phones = beat === "phones";
  const losses = beat === "youngLosses";
  return (
    <>
      <Headline when={phones}>Kids with a smartphone</Headline>
      {PHONE_ROWS.map((row, index) => (
        <PhoneRow key={row.ages} {...row} shown={phones} delay={0.2 + index * 0.9} />
      ))}

      <Headline when={losses}>Fraud reports that lost money</Headline>
      {LOSS_BARS.map((bar, index) => (
        <LossBar key={bar.ages} {...bar} shown={losses} delay={0.2 + index * 0.4} />
      ))}
    </>
  );
}

function PhoneRow({ ages, percent, top, shown, delay }: { ages: string; percent: number; top: number; shown: boolean; delay: number }) {
  const lit = Math.round(percent / 10);
  const phonesLeft = grid.right - 10 * PHONE.size - 9 * PHONE.gap;
  return (
    <>
      <Show when={shown} delay={delay} className="absolute" style={{ left: grid.left, top, width: PHONE.labelWidth }}>
        <p className="text-[120px] leading-none font-black text-ink tabular-nums">{percent}%</p>
        <p className="mt-3 text-body font-extrabold text-ink-muted">{ages}</p>
      </Show>
      <div className="pointer-events-none absolute flex" style={{ left: phonesLeft, top: top + 10, gap: PHONE.gap }} aria-hidden={!shown}>
        {Array.from({ length: 10 }, (_, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
            transition={{ ...sceneMove, delay: shown ? delay + 0.15 + index * 0.06 : 0 }}
          >
            <DeviceMobile size={PHONE.size} weight={index < lit ? "fill" : "regular"} className={index < lit ? "text-green" : "text-[#d3d6da]"} />
          </motion.div>
        ))}
      </div>
    </>
  );
}

type LossBarProps = { ages: string; percent: number; top: number; color: string; text: string; shown: boolean; delay: number };

function LossBar({ ages, percent, top, color, text, shown, delay }: LossBarProps) {
  const width = (percent / 100) * BAR.full;
  return (
    <>
      <Show when={shown} delay={delay} className="absolute flex items-center" style={{ left: grid.left, top, height: BAR.height, width: BAR.left - grid.left - 40 }}>
        <p className="text-lede leading-tight font-extrabold text-ink">{ages}</p>
      </Show>
      <motion.div
        className={`pointer-events-none absolute rounded-r-[24px] ${color}`}
        style={{ left: BAR.left, top, width, height: BAR.height, transformOrigin: "0% 50%" }}
        initial={false}
        animate={{ scaleX: shown ? 1 : 0 }}
        transition={{ ...sceneMove, delay: shown ? delay + 0.1 : 0 }}
      />
      <Show when={shown} delay={delay + 0.4} rise={0} className="absolute" style={{ left: BAR.left + width + 32, top: top + 10 }}>
        <p className={`text-[96px] leading-none font-black tabular-nums ${text}`}>{percent}%</p>
      </Show>
    </>
  );
}
