import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { SourceNote } from "../parts/SourceNote";
import { slideOf, type Beat } from "../script";

export function RealScene({ beat }: { beat: Beat }) {
  const onSlide = slideOf(beat) === "real";
  const warned = beat === "fbiWarning";
  return (
    <>
      <Headline when={onSlide}>The text from our skit is real.</Headline>
      <Show when={warned} delay={0.25} className="absolute left-[1100px] top-[360px] w-[700px] rounded-card bg-stage-sunken p-14">
        <p className="text-caption font-extrabold text-red-text">FBI warning, April 2024</p>
        <p className="mt-4 text-poster font-black text-ink">2,000+</p>
        <p className="mt-4 text-lede font-bold text-ink" style={{ textWrap: "balance" }}>
          complaints about fake toll texts in about one month
        </p>
      </Show>
      <SourceNote when={warned} keys={["fbiToll"]} />
    </>
  );
}
