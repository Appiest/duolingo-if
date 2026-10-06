import { sources, type SourceKey } from "../sources";
import { Show } from "./Show";

export function SourceNote({ when, keys, note }: { when: boolean; keys: SourceKey[]; note?: string }) {
  return (
    <Show when={when} className="absolute bottom-[56px] left-[120px] right-[120px]" rise={8}>
      <p className="text-source font-semibold text-ink-muted">
        {note ? `${note} ` : ""}
        Source: {keys.map((key) => sources[key].short).join("; ")}
      </p>
    </Show>
  );
}
