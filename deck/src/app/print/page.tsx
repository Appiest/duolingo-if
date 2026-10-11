"use client";

import { MotionConfig } from "motion/react";
import { canvas } from "@/deck/geometry";
import { Scene } from "@/deck/Scene";
import { slides, type Beat } from "@/deck/script";
import { skit, skitSegments, type SkitVisual } from "@/deck/skit";

type Page = { beat: Beat; skitVisual?: SkitVisual };

// The skit slide gets one page per visual behind the skit.
const pages = slides.flatMap((slide): Page[] =>
  slide.id === "skit" ? skitSegments(skit).map((segment) => ({ beat: slide.beats[0], skitVisual: segment.visual })) : slide.beats.map((beat) => ({ beat })),
);

// Every beat as its own 1920x1080 page, for the PDF export.
export default function PrintPage() {
  return (
    <MotionConfig reducedMotion="always">
      <style>{`@page { size: ${canvas.w}px ${canvas.h}px; margin: 0; } body { margin: 0; }`}</style>
      {pages.map((page, index) => (
        <section
          key={`${page.beat}-${page.skitVisual ?? ""}`}
          className="relative overflow-hidden bg-stage"
          style={{ width: canvas.w, height: canvas.h, breakAfter: index < pages.length - 1 ? "page" : "auto" }}
        >
          <Scene beat={page.beat} skitVisual={page.skitVisual} />
        </section>
      ))}
    </MotionConfig>
  );
}
