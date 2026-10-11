import { grid } from "../geometry";
import { sources, type SourceKey } from "../sources";
import { Show } from "./Show";

const SOURCE_TOP = 1000;

export function SourceNote({ when, source, delay = 0.6 }: { when: boolean; source: SourceKey; delay?: number }) {
  return (
    <Show when={when} delay={delay} rise={0} className="absolute" style={{ left: grid.left, top: SOURCE_TOP, width: grid.width }}>
      <p className="text-source font-bold text-ink-muted">Source: {sources[source].short}</p>
    </Show>
  );
}
