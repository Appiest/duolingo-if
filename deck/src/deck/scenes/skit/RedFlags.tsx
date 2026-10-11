"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { sceneMove } from "../../motion";
import { Show } from "../../parts/Show";
import { ROBUX_PARTS, ROBUX_SENDER, type Flag } from "./robuxText";

// The FTC's second red flag is "a problem or a prize", so the prize takes the
// Problem color; the fake link gets the scam red.
const FLAGS: Record<Flag, { label: string; color: string; wash: string }> = {
  pretend: { label: "Pretend", color: "var(--color-p-pretend)", wash: "var(--color-p-pretend-wash)" },
  prize: { label: "Prize", color: "var(--color-p-problem)", wash: "var(--color-p-problem-wash)" },
  pressure: { label: "Pressure", color: "var(--color-p-pressure)", wash: "var(--color-p-pressure-wash)" },
  link: { label: "Fake link", color: "var(--color-red-text)", wash: "var(--color-red-wash)" },
};
const FLAG_START = 0.6;
const FLAG_STEP = 0.45;

export function RedFlags({ shown }: { shown: boolean }) {
  return (
    <Show when={shown} className="absolute" style={{ left: 260, top: 290, width: 1400 }}>
      <p className="mb-6 flex items-center gap-5 pl-4 text-[44px] font-extrabold text-ink">
        <span className="grid size-20 place-items-center rounded-full bg-[#8e8e93] text-[40px] text-white">R</span>
        {ROBUX_SENDER}
        <FlagLabel flag="pretend" shown={shown} delay={FLAG_START} />
      </p>
      <p className="rounded-[56px] rounded-bl-[16px] bg-sms-in px-14 py-11 text-[60px] leading-[1.5] font-semibold text-black">
        {ROBUX_PARTS.map((part, index) => (
          <span key={part.flag}>
            {index > 0 && " "}
            <Marked flag={part.flag} shown={shown} delay={FLAG_START + (index + 1) * FLAG_STEP}>
              {part.text}
            </Marked>
            <FlagLabel flag={part.flag} shown={shown} delay={FLAG_START + (index + 1) * FLAG_STEP} />
          </span>
        ))}
      </p>
    </Show>
  );
}

function Marked({ flag, shown, delay, children }: { flag: Flag; shown: boolean; delay: number; children: ReactNode }) {
  const link = flag === "link";
  return (
    <motion.span
      className={link ? "text-sms-link underline decoration-[3px] underline-offset-8" : undefined}
      style={{ borderRadius: 12, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", padding: "2px 0" }}
      initial={false}
      animate={{ backgroundColor: shown ? FLAGS[flag].wash : "rgba(0,0,0,0)" }}
      transition={{ duration: 0.4, delay: shown ? delay : 0 }}
    >
      {children}
    </motion.span>
  );
}

function FlagLabel({ flag, shown, delay }: { flag: Flag; shown: boolean; delay: number }) {
  return (
    <motion.span
      className="inline-block overflow-hidden rounded-[14px] align-middle text-[34px] leading-[54px] font-extrabold whitespace-nowrap text-white"
      style={{ backgroundColor: FLAGS[flag].color }}
      initial={false}
      animate={shown ? { opacity: 1, scale: 1, maxWidth: 320, marginInline: 10, paddingInline: 16 } : { opacity: 0, scale: 0.6, maxWidth: 0, marginInline: 0, paddingInline: 0 }}
      transition={{ ...sceneMove, delay: shown ? delay : 0 }}
    >
      {FLAGS[flag].label}
    </motion.span>
  );
}
