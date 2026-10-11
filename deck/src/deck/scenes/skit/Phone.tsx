"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { assetPath } from "../../assetPath";
import { canvas } from "../../geometry";
import { sceneMove } from "../../motion";
import type { SkitVisual } from "../../skit";
import { ROBUX_LINK, ROBUX_PARTS, ROBUX_SENDER } from "./robuxText";
import { useTicker } from "./useTicker";

// The team's phone drawing is 613px square; its screen is the white area below.
const ART = 613;
const SCREEN = { x: 177, y: 66, width: 268, height: 426 };
const ZOOM = 1.62;
const SIDE = ART * ZOOM;

type Placement = { x: number; opacity: number; scale: number };

const PLACES: Partial<Record<SkitVisual, Placement>> = {
  message: { x: 960, opacity: 1, scale: 1 },
  login: { x: 960, opacity: 1, scale: 1 },
  swoop: { x: 1340, opacity: 0.4, scale: 0.9 },
};
const AWAY: Placement = { x: 960, opacity: 0, scale: 0.85 };

export function Phone({ visual }: { visual: SkitVisual }) {
  const place = PLACES[visual] ?? AWAY;
  const buzzing = visual === "message";
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: 0, top: (canvas.h - SIDE) / 2, width: SIDE, height: SIDE }}
      initial={false}
      animate={{ x: place.x - SIDE / 2, opacity: place.opacity, scale: place.scale }}
      transition={sceneMove}
      aria-hidden={place === AWAY}
    >
      <motion.div
        className="size-full"
        initial={false}
        animate={buzzing ? { rotate: [0, -3, 3, -3, 3, -2, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6, delay: buzzing ? 0.3 : 0 }}
      >
        <img src={assetPath("/characters/phone.png")} alt="" width={SIDE} height={SIDE} className="absolute inset-0" />
        <div
          className="absolute overflow-hidden rounded-[30px] bg-white"
          style={{ left: SCREEN.x * ZOOM, top: SCREEN.y * ZOOM, width: SCREEN.width * ZOOM, height: SCREEN.height * ZOOM }}
        >
          <ScreenLayer shown={visual === "message"}>
            <MessageScreen shown={visual === "message"} />
          </ScreenLayer>
          <ScreenLayer shown={visual === "login" || visual === "swoop"}>
            <LoginScreen typing={visual === "login"} />
          </ScreenLayer>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScreenLayer({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <motion.div className="absolute inset-0 flex flex-col" initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.35 }}>
      {children}
    </motion.div>
  );
}

function MessageScreen({ shown }: { shown: boolean }) {
  return (
    <>
      <div className="flex flex-col items-center gap-1 bg-stage-sunken pt-6 pb-3">
        <span className="grid size-16 place-items-center rounded-full bg-[#8e8e93] text-[32px] font-extrabold text-white">R</span>
        <span className="text-[24px] font-bold text-ink">{ROBUX_SENDER}</span>
      </div>
      <motion.p
        className="mx-4 mt-7 rounded-[28px] rounded-bl-[8px] bg-sms-in px-5 py-4 text-[31px] leading-snug font-semibold text-black"
        style={{ transformOrigin: "0% 100%" }}
        initial={false}
        animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.35, delay: shown ? 0.55 : 0 }}
      >
        {ROBUX_PARTS.slice(0, 2).map((part) => part.text).join(" ")}{" "}
        <span className="text-sms-link underline decoration-2 underline-offset-4">{ROBUX_LINK}</span>
      </motion.p>
    </>
  );
}

const USERNAME = "alexis_rox";
const PASSWORD_LENGTH = 10;
const COUNTDOWN_FROM = 9 * 60 + 59;

function LoginScreen({ typing }: { typing: boolean }) {
  const typed = useTicker(typing, USERNAME.length + PASSWORD_LENGTH, 140, 700);
  const elapsed = useTicker(typing, 60, 1000);
  const left = COUNTDOWN_FROM - elapsed;
  return (
    <div className="flex h-full flex-col px-6 pt-5">
      <p className="mx-auto rounded-full bg-stage-sunken px-4 py-1.5 text-[21px] font-bold text-ink-muted">{ROBUX_LINK}</p>
      <p className="mt-6 text-[42px] leading-tight font-black text-ink">Claim 10,000 Robux</p>
      <p className="mt-2 text-[27px] font-extrabold text-red-text tabular-nums">
        Offer ends in {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
      </p>
      <Field label="Username" value={USERNAME.slice(0, typed)} />
      <Field label="Password" value={"•".repeat(Math.max(typed - USERNAME.length, 0))} />
      <p className="mt-auto mb-7 rounded-2xl bg-green py-4 text-center text-[32px] font-black text-white">Claim Robux</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5">
      <p className="text-[22px] font-bold text-ink-muted">{label}</p>
      <p className="mt-1 h-[60px] rounded-xl bg-stage-sunken px-4 text-[30px] leading-[60px] font-semibold text-ink">{value}</p>
    </div>
  );
}
