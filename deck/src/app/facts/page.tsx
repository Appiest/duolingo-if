import type { Metadata } from "next";
import { cues } from "@/deck/cues";
import { facts } from "@/deck/facts";
import { slides } from "@/deck/script";
import { sources, type SourceKey } from "@/deck/sources";

export const metadata: Metadata = { title: "Real or Scam? facts and sources" };

export default function FactsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-16 text-[17px] leading-relaxed font-semibold text-ink">
      <h1 className="text-[40px] leading-tight font-black">Facts, sources and questions</h1>
      <p className="mt-3 text-ink-muted">
        Every number in the deck, what it counts, and where it comes from. FTC figures are losses people chose to report, so they undercount the real harm.
      </p>
      {slides.map((slide, index) => (
        <SlideSection key={slide.id} number={index + 1} slideId={slide.id} beats={slide.beats} />
      ))}
    </main>
  );
}

function SlideSection({ number, slideId, beats }: { number: number; slideId: keyof typeof facts; beats: readonly (keyof typeof cues)[] }) {
  const slide = facts[slideId];
  return (
    <section className="mt-14">
      <h2 className="text-[28px] font-black">
        Slide {number}: {slide.title}
      </h2>
      <ol className="mt-4 space-y-2">
        {beats.map((beat, index) => (
          <li key={beat} className="text-ink-muted">
            <span className="font-extrabold text-ink">Beat {index + 1}, {cues[beat].speaker}:</span> “{cues[beat].line}”
          </li>
        ))}
      </ol>
      {slide.figures.length > 0 && (
        <dl className="mt-6 space-y-5">
          {slide.figures.map((figure) => (
            <div key={figure.figure} className="rounded-2xl bg-stage-sunken p-5">
              <dt className="text-[22px] font-black">{figure.figure}</dt>
              <dd className="mt-1">{figure.counts}</dd>
              <dd className="mt-2">
                <SourceDetail sourceKey={figure.source} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {slide.questions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[20px] font-black">Likely questions</h3>
          {slide.questions.map((item) => (
            <div key={item.question} className="mt-3">
              <p className="font-extrabold">{item.question}</p>
              <p className="text-ink-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SourceDetail({ sourceKey }: { sourceKey: SourceKey }) {
  const source = sources[sourceKey];
  return (
    <span className="block text-[15px] text-ink-muted">
      {"quote" in source && source.quote && <q className="block font-bold text-ink">{source.quote}</q>}
      <a className="mt-1 block text-blue-text underline underline-offset-2" href={source.url}>
        {source.citation}
      </a>
    </span>
  );
}
