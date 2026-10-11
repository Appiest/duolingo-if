"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Counts up from 0 to `end` while active, one step every `stepMs`. With
// reduced motion (and in the PDF) it shows the end state straight away.
export function useTicker(active: boolean, end: number, stepMs: number, startMs = 0) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || reduced) return;
    let step = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        step = Math.min(step + 1, end);
        setCount(step);
        if (step === end) window.clearInterval(interval);
      }, stepMs);
    }, startMs);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
      setCount(0);
    };
  }, [active, reduced, end, stepMs, startMs]);
  return reduced ? end : count;
}
