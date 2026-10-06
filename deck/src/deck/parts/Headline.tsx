import type { ReactNode } from "react";
import { Show } from "./Show";

export function Headline({ when, children, width = 1500 }: { when: boolean; children: ReactNode; width?: number }) {
  return (
    <Show when={when} className="absolute left-[120px] top-[96px]" style={{ width }}>
      <h2 className="text-headline font-black text-ink" style={{ textWrap: "balance" }}>
        {children}
      </h2>
    </Show>
  );
}
