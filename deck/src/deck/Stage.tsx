"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { canvas } from "./geometry";

function fitScale(): number {
  return Math.min(window.innerWidth / canvas.w, window.innerHeight / canvas.h);
}

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const update = () => setScale(fitScale());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-stage">
      <div
        className="relative shrink-0 overflow-hidden bg-stage"
        style={{ width: canvas.w, height: canvas.h, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
