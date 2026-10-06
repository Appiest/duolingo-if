import type { ReactNode } from "react";
import { grid } from "../geometry";
import { Show } from "./Show";

export function Headline({ when, children }: { when: boolean; children: ReactNode }) {
  return (
    <Show when={when} className="absolute" style={{ left: grid.left, top: grid.titleTop, width: grid.width }}>
      <h2 className="text-headline font-black whitespace-nowrap text-ink">{children}</h2>
    </Show>
  );
}
