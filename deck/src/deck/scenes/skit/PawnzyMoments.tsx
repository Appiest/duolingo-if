"use client";

import { LinkBreak, LockKey, UsersThree, type Icon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { assetPath } from "../../assetPath";
import { sceneMove } from "../../motion";
import { Show } from "../../parts/Show";

const PAWNZY_SIZE = 620;
const PAWNZY_TOP = 250;

// Flies in from off the left edge, leaning into the swoop, and lands.
export function Swoop({ shown }: { shown: boolean }) {
  return (
    <>
      {[0, 1, 2].map((streak) => (
        <motion.span
          key={streak}
          className="pointer-events-none absolute h-3 rounded-full bg-line"
          style={{ left: 40, top: 470 + streak * 90, width: 420, transformOrigin: "100% 50%" }}
          initial={false}
          animate={shown ? { scaleX: [0, 1, 0], opacity: [0, 1, 0] } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.8, delay: shown ? 0.1 + streak * 0.06 : 0 }}
        />
      ))}
      <motion.img
        src={assetPath("/characters/pawnzy-standing-shocked.png")}
        alt=""
        className="pointer-events-none absolute"
        style={{ left: 260, top: PAWNZY_TOP, width: PAWNZY_SIZE, height: PAWNZY_SIZE }}
        initial={false}
        animate={shown ? { x: 0, rotate: 0, opacity: 1 } : { x: -900, rotate: -28, opacity: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
      />
    </>
  );
}

const OLD_SCAMS = [
  "Your package is on hold. Confirm your address: usps-help.co",
  "Unpaid toll: pay $6.99 today to avoid a fee",
  "Your bank account is locked. Verify now",
  "You won a $500 gift card! Claim it here",
];
const SENT_LEFT = 1000;
const SENT_WIDTH = 760;
const STRIKE_DELAY = 2.6;

// Texts Pawnzy sent back when he was a scammer: blue, because he sent them.
// Once he's said why he quit, they grey out and get crossed off.
export function Backstory({ shown }: { shown: boolean }) {
  return (
    <>
      <Show when={shown} className="absolute" style={{ left: 200, top: PAWNZY_TOP }}>
        <img src={assetPath("/characters/pawnzy-standing-sad.png")} alt="" width={PAWNZY_SIZE} height={PAWNZY_SIZE} />
      </Show>
      {OLD_SCAMS.map((text, index) => (
        <SentText key={text} text={text} shown={shown} top={220 + index * 170} delay={0.3 + index * 0.25} />
      ))}
    </>
  );
}

function SentText({ text, shown, top, delay }: { text: string; shown: boolean; top: number; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute flex justify-end"
      style={{ left: SENT_LEFT, top, width: SENT_WIDTH }}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ ...sceneMove, delay: shown ? delay : 0 }}
    >
      <motion.p
        className="relative rounded-[30px] rounded-br-[10px] px-7 py-5 text-[32px] leading-snug font-semibold"
        initial={false}
        animate={shown ? { backgroundColor: ["#1677c9", "#1677c9", "#d9dbde"], color: ["#ffffff", "#ffffff", "#6f6f6f"] } : { backgroundColor: "#1677c9", color: "#ffffff" }}
        transition={{ duration: 0.6, times: [0, 0.01, 1], delay: shown ? STRIKE_DELAY + delay * 0.4 : 0 }}
      >
        {text}
        <motion.span
          className="absolute top-1/2 right-5 left-5 h-1.5 rounded-full bg-red"
          style={{ transformOrigin: "0% 50%" }}
          initial={false}
          animate={{ scaleX: shown ? 1 : 0 }}
          transition={{ duration: 0.4, delay: shown ? STRIKE_DELAY + 0.3 + delay * 0.4 : 0 }}
        />
      </motion.p>
    </motion.div>
  );
}

const RULES: { icon: Icon; text: string }[] = [
  { icon: LinkBreak, text: "Don’t tap the link" },
  { icon: LockKey, text: "Never share your password" },
  { icon: UsersThree, text: "Show a grown-up" },
];

export function StaySafe({ shown }: { shown: boolean }) {
  return (
    <>
      <Show when={shown} className="absolute" style={{ left: 160, top: PAWNZY_TOP }}>
        <img src={assetPath("/characters/pawnzy-standing-celebrate.png")} alt="" width={PAWNZY_SIZE} height={PAWNZY_SIZE} />
      </Show>
      {RULES.map(({ icon: RuleIcon, text }, index) => (
        <Show key={text} when={shown} delay={0.4 + index * 0.35} className="absolute flex items-center gap-8" style={{ left: 880, top: 300 + index * 190 }}>
          <RuleIcon size={110} weight="bold" className="text-green-text" />
          <p className="text-[64px] leading-none font-black text-ink">{text}</p>
        </Show>
      ))}
    </>
  );
}
