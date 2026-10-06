"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { pick, sceneMove } from "../motion";
import type { Beat } from "../script";

type Tag = "pretend" | "problem" | "pressure" | "pay";
type Word = readonly [correct: string, typo?: string];
type Segment = { tag: Tag; words: readonly Word[]; link?: boolean };
type Placement = { x: number; y: number; scale: number; opacity?: number };

const SENDER = "FasTrak";
const BUBBLE_WIDTH = 820;
const TYPO_START_SECONDS = 0.9;
const TYPO_STEP_SECONDS = 0.45;
const TYPO_FADE_SECONDS = 0.35;
const TAG_LABELS: Record<Tag, string> = { pretend: "Pretend", problem: "Problem", pressure: "Pressure", pay: "Pay" };

const SEGMENTS: readonly Segment[] = [
  { tag: "problem", words: [["You"], ["have", "hav"], ["an"], ["unpaid", "unpayed"], ["toll", "tol"], ["balance"], ["of"], ["$4.15."]] },
  { tag: "pressure", words: [["Pay"], ["by"], ["today"], ["to"], ["avoid", "avoyd"], ["a"], ["$50"], ["late"], ["fee:"]] },
  { tag: "pay", words: [["fastrak-tollpay.com"]], link: true },
];

const TYPO_ORDER = new Map<Word, number>(
  SEGMENTS.flatMap((segment) => segment.words).filter((word) => word[1]).map((word, index) => [word, index]),
);

const HIDDEN: Placement = { x: 960, y: 560, scale: 0.6, opacity: 0 };

const PLACEMENTS: Partial<Record<Beat, Placement>> = {
  skitText: { x: 960, y: 540, scale: 1.3 },
  fbiWarning: { x: 530, y: 540, scale: 0.92 },
  topContact: { x: 960, y: 560, scale: 0.3, opacity: 0 },
  aiTypos: { x: 960, y: 610, scale: 1.25 },
  pawnzyLesson: { x: 1270, y: 590, scale: 1.05 },
  fourPs: { x: 960, y: 500, scale: 0.85 },
};

const TAGGED_BEATS = new Set<Beat>(["pawnzyLesson", "fourPs"]);

export function ScamBubble({ beat }: { beat: Beat }) {
  const place = pick(PLACEMENTS, beat, HIDDEN);
  const tagged = TAGGED_BEATS.has(beat);
  const fixing = beat === "aiTypos";

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0"
      style={{ transformOrigin: "0px 0px" }}
      initial={false}
      animate={{ x: place.x, y: place.y, scale: place.scale, opacity: place.opacity ?? 1 }}
      transition={sceneMove}
      aria-hidden={place.opacity === 0}
    >
      <div className="-translate-x-1/2 -translate-y-1/2" style={{ width: BUBBLE_WIDTH }}>
        <div className="mb-4 flex items-center gap-4 pl-3">
          <span className="grid size-16 place-items-center rounded-full bg-[#8e8e93] text-[32px] font-extrabold text-white">F</span>
          <span className="text-[36px] font-extrabold text-ink">{SENDER}</span>
          <TagLabel tag="pretend" lit={tagged} delay={0.2} />
        </div>
        <p className="rounded-bubble rounded-bl-[14px] bg-sms-in px-11 py-8 text-[46px] leading-[1.55] font-semibold text-black">
          {SEGMENTS.map((segment, segmentIndex) => (
            <span key={segment.tag}>
              {segmentIndex > 0 && " "}
              <TaggedSpan segment={segment} lit={tagged} delay={0.45 + segmentIndex * 0.3}>
                {segment.words.map((word, wordIndex) => (
                  <span key={`${word[0]}-${wordIndex}`}>
                    {wordIndex > 0 && " "}
                    <WordSwap word={word} fixing={fixing} order={TYPO_ORDER.get(word) ?? 0} />
                  </span>
                ))}
              </TaggedSpan>
              <TagLabel tag={segment.tag} lit={tagged} delay={0.45 + segmentIndex * 0.3} />
            </span>
          ))}
        </p>
      </div>
    </motion.div>
  );
}

function TaggedSpan({ segment, lit, delay, children }: { segment: Segment; lit: boolean; delay: number; children: React.ReactNode }) {
  return (
    <motion.span
      className={segment.link ? "text-sms-link underline decoration-2 underline-offset-8" : undefined}
      style={{ borderRadius: 10, boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone", padding: "2px 0" }}
      initial={false}
      animate={{ backgroundColor: lit ? `var(--color-p-${segment.tag}-wash)` : "rgba(0,0,0,0)" }}
      transition={{ duration: 0.4, delay: lit ? delay : 0 }}
    >
      {children}
    </motion.span>
  );
}

function TagLabel({ tag, lit, delay }: { tag: Tag; lit: boolean; delay: number }) {
  return (
    <motion.span
      className="inline-block overflow-hidden rounded-[12px] align-middle text-[28px] leading-[44px] font-extrabold whitespace-nowrap text-white"
      style={{ backgroundColor: `var(--color-p-${tag})`, transformOrigin: "50% 50%" }}
      initial={false}
      animate={lit ? { opacity: 1, scale: 1, maxWidth: 260, marginInline: 8, paddingInline: 12 } : { opacity: 0, scale: 0.6, maxWidth: 0, marginInline: 0, paddingInline: 0 }}
      transition={{ ...sceneMove, delay: lit ? delay : 0 }}
    >
      {TAG_LABELS[tag]}
    </motion.span>
  );
}

function WordSwap({ word, fixing, order }: { word: Word; fixing: boolean; order: number }) {
  const [correct, typo] = word;
  if (!typo || !fixing) return <>{correct}</>;
  return <AutoCorrect correct={correct} typo={typo} fixAfter={TYPO_START_SECONDS + order * TYPO_STEP_SECONDS} />;
}

// Mounts fresh each time the typo beat begins, shows the typo, then swaps in
// the real word the way autocorrect does.
function AutoCorrect({ correct, typo, fixAfter }: { correct: string; typo: string; fixAfter: number }) {
  const [fixed, setFixed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setFixed(true), fixAfter * 1000);
    return () => window.clearTimeout(timer);
  }, [fixAfter]);
  if (!fixed) {
    return <span className="text-red-text underline decoration-red decoration-wavy decoration-[3px] underline-offset-8">{typo}</span>;
  }
  return (
    <motion.span
      initial={{ color: "#3f7d00", filter: "blur(4px)" }}
      animate={{ color: "#000000", filter: "blur(0px)" }}
      transition={{ duration: TYPO_FADE_SECONDS * 2, ease: [0.2, 0, 0, 1] }}
    >
      {correct}
    </motion.span>
  );
}
