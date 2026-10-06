import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { SourceNote } from "../parts/SourceNote";
import type { Beat } from "../script";

const GRADES = [1, 2, 3, 4, 5, 6];
const STRIP = { left: 160, top: 520, column: 260 };

export function NowScene({ beat }: { beat: Beat }) {
  const typos = beat === "aiTypos";
  const gap = beat === "gradeGap";
  return (
    <>
      <Headline when={typos}>AI writes scam texts without typos.</Headline>
      <SourceNote when={typos} keys={["fbiAi"]} />

      <Headline when={gap}>Kids get phones years before their first scam lesson.</Headline>
      <GradeStrip shown={gap} />
      <SourceNote when={gap} keys={["pewKidsPhones", "commonSensePhish"]} note="Ages 8–10 are roughly grades 3–5." />
    </>
  );
}

function gradeFill(grade: number) {
  if (grade === 6) return "bg-red";
  if (grade >= 3) return "bg-green";
  return "bg-stage-sunken";
}

function GradeStrip({ shown }: { shown: boolean }) {
  const columnLeft = (grade: number) => STRIP.left + (grade - 1) * STRIP.column;
  return (
    <>
      <Show when={shown} delay={0.15} className="absolute" style={{ left: columnLeft(3), top: STRIP.top - 190, width: STRIP.column * 3 - 20 }}>
        <div className="rounded-card bg-green-wash px-8 py-6">
          <p className="text-[56px] leading-none font-black text-green-text">29%</p>
          <p className="mt-2 text-caption font-extrabold text-green-text">of kids ages 8–10 have their own smartphone</p>
        </div>
      </Show>
      <Show when={shown} delay={0.55} className="absolute" style={{ left: columnLeft(6), top: STRIP.top - 190, width: STRIP.column - 20 }}>
        <div className="rounded-card bg-red-wash px-6 py-6">
          <p className="text-[40px] leading-none font-black text-red-text">Grade 6</p>
          <p className="mt-2 text-caption font-extrabold text-red-text">first phishing lesson</p>
        </div>
      </Show>
      {GRADES.map((grade, index) => (
        <Show key={grade} when={shown} delay={index * 0.05} rise={10} className="absolute" style={{ left: columnLeft(grade), top: STRIP.top, width: STRIP.column - 20 }}>
          <div className={`flex h-[150px] items-center justify-center rounded-[24px] ${gradeFill(grade)}`}>
            <p className={`text-[44px] font-black ${grade >= 3 ? "text-white" : "text-ink-muted"}`}>Grade {grade}</p>
          </div>
        </Show>
      ))}
      <Show when={shown} delay={0.9} className="absolute" style={{ left: columnLeft(3), top: STRIP.top + 190, width: STRIP.column * 4 - 20 }}>
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 rounded bg-ink" />
          <p className="text-lede font-black text-ink">a gap of up to 3 years</p>
          <div className="h-2 flex-1 rounded bg-ink" />
        </div>
      </Show>
    </>
  );
}
