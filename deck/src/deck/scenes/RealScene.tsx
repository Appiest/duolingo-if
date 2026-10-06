import { Show } from "../parts/Show";
import type { Beat } from "../script";

export function RealScene({ beat }: { beat: Beat }) {
  return (
    <Show when={beat === "fbiWarning"} delay={0.25} className="absolute left-[1080px] top-[330px] w-[720px] rounded-card bg-stage-sunken px-16 py-14">
      <p className="text-[168px] leading-none font-black text-ink tabular-nums">2,000+</p>
      <p className="mt-6 text-lede font-extrabold text-ink">FBI complaints in one month</p>
    </Show>
  );
}
