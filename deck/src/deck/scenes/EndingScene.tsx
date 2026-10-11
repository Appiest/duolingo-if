"use client";

import { motion } from "motion/react";
import { assetPath } from "../assetPath";
import { canvas, grid } from "../geometry";
import { sceneMove } from "../motion";
import { Show } from "../parts/Show";
import type { Beat } from "../script";

// The scam texts from the talk, each one crossed off around Pawnzy and Duo.
const BEATEN_SCAMS = [
  { text: "You won 10,000 free Robux!", side: { left: grid.left }, top: 420 },
  { text: "Unpaid toll: pay $4.15 today", side: { left: grid.left + 40 }, top: 680 },
  { text: "Your package is on hold", side: { right: canvas.w - grid.right }, top: 440 },
  { text: "You won a $500 gift card!", side: { right: canvas.w - grid.right + 40 }, top: 700 },
];
const STRIKE_START = 0.9;
const STRIKE_STEP = 0.3;
const CHEER_DELAY = STRIKE_START + BEATEN_SCAMS.length * STRIKE_STEP;

export function EndingScene({ beat }: { beat: Beat }) {
  const shown = beat === "ending";
  return (
    <>
      <Show when={shown} className="absolute text-center" style={{ left: grid.left, top: 130, width: grid.width }}>
        <h2 className="text-headline font-black text-balance text-ink">Let’s keep kids safe from text scams</h2>
      </Show>
      {BEATEN_SCAMS.map((scam, index) => (
        <BeatenScam key={scam.text} {...scam} shown={shown} delay={0.3 + index * 0.12} strikeDelay={STRIKE_START + index * STRIKE_STEP} />
      ))}
      <Cheering src="/characters/pawnzy-standing-celebrate.png" size={480} left={590} top={440} shown={shown} delay={0.15} />
      <Cheering src="/characters/duo.png" size={330} left={1010} top={590} shown={shown} delay={0.25} />
    </>
  );
}

type CheeringProps = { src: string; size: number; left: number; top: number; shown: boolean; delay: number };

// Rises in with the slide, then hops once every scam is crossed off.
function Cheering({ src, size, left, top, shown, delay }: CheeringProps) {
  return (
    <Show when={shown} delay={delay} className="absolute" style={{ left, top }}>
      <motion.img
        src={assetPath(src)}
        alt=""
        width={size}
        height={size}
        initial={false}
        animate={shown ? { y: [0, -60, 0, -24, 0] } : { y: 0 }}
        transition={{ duration: 0.9, times: [0, 0.3, 0.6, 0.8, 1], delay: shown ? CHEER_DELAY + delay : 0 }}
      />
    </Show>
  );
}

type BeatenScamProps = { text: string; side: { left?: number; right?: number }; top: number; shown: boolean; delay: number; strikeDelay: number };

function BeatenScam({ text, side, top, shown, delay, strikeDelay }: BeatenScamProps) {
  return (
    <Show when={shown} delay={delay} className="absolute" style={{ ...side, top }}>
      <motion.p
        className="relative rounded-[30px] rounded-bl-[10px] bg-sms-in px-7 py-5 text-[32px] leading-snug font-semibold whitespace-nowrap"
        initial={false}
        animate={{ opacity: shown ? [1, 1, 0.45] : 1, color: shown ? ["#000000", "#000000", "#6f6f6f"] : "#000000" }}
        transition={{ duration: 0.5, times: [0, 0.01, 1], delay: shown ? strikeDelay + 0.2 : 0 }}
      >
        {text}
        <motion.span
          className="absolute top-1/2 right-5 left-5 h-1.5 rounded-full bg-red"
          style={{ transformOrigin: "0% 50%" }}
          initial={false}
          animate={{ scaleX: shown ? 1 : 0 }}
          transition={{ ...sceneMove, duration: 0.4, delay: shown ? strikeDelay : 0 }}
        />
      </motion.p>
    </Show>
  );
}
