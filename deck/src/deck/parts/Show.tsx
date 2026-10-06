"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { sceneMove } from "../motion";

type ShowProps = {
  when: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  rise?: number;
};

export function Show({ when, children, className, style, delay = 0, rise = 28 }: ShowProps) {
  return (
    <motion.div
      className={className}
      style={{ ...style, pointerEvents: "none" }}
      initial={false}
      animate={when ? { opacity: 1, y: 0 } : { opacity: 0, y: rise }}
      transition={{ ...sceneMove, delay: when ? delay : 0 }}
      aria-hidden={!when}
    >
      {children}
    </motion.div>
  );
}
