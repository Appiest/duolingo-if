"use client";

import { MotionConfig } from "motion/react";
import { canvas } from "@/deck/geometry";
import { Scene } from "@/deck/Scene";
import { slides } from "@/deck/script";

// Every beat as its own 1920x1080 page, for the PDF export.
export default function PrintPage() {
  const beats = slides.flatMap((slide) => slide.beats);
  return (
    <MotionConfig reducedMotion="always">
      <style>{`@page { size: ${canvas.w}px ${canvas.h}px; margin: 0; } body { margin: 0; }`}</style>
      {beats.map((beat, index) => (
        <section
          key={beat}
          className="relative overflow-hidden bg-stage"
          style={{ width: canvas.w, height: canvas.h, breakAfter: index < beats.length - 1 ? "page" : "auto" }}
        >
          <Scene beat={beat} />
        </section>
      ))}
    </MotionConfig>
  );
}
