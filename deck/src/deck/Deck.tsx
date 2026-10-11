"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { notesShown, notesShownOnServer, subscribeToNotes, toggleNotes } from "./notes";
import { Rehearsal } from "./Rehearsal";
import { Scene } from "./Scene";
import { slides, type Beat } from "./script";
import type { SkitVisual } from "./skit";
import { playTextAlert } from "./sound/textAlert";
import { Stage } from "./Stage";
import { beatAt, fit, outlineFor, promptAt, skitVisualAt } from "./steps";
import { advance, last, retreat, start, toSearch, type Position } from "./timeline";
import { useDeckControls } from "./useDeckControls";

export function Deck({ initial }: { initial: Position }) {
  const [requested, setPosition] = useState(initial);
  const showingNotes = useSyncExternalStore(subscribeToNotes, notesShown, notesShownOnServer);
  const outline = useMemo(() => outlineFor(showingNotes), [showingNotes]);
  const position = fit(requested, outline);
  const search = toSearch(position);
  const beat = beatAt(position);
  const skitVisual = skitVisualAt(position, showingNotes);
  useTextAlert(beat, skitVisual);

  const commands = useMemo(
    () => ({
      next: () => setPosition((current) => advance(fit(current, outline), outline)),
      previous: () => setPosition((current) => retreat(fit(current, outline), outline)),
      first: () => setPosition(start),
      last: () => setPosition(last(outline)),
      notes: toggleNotes,
    }),
    [outline],
  );
  useDeckControls(commands);

  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [search]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="cursor-none select-none" onClick={commands.next}>
        <h1 className="sr-only">Real or Scam? Why kids need to spot scam texts</h1>
        <p className="sr-only" aria-live="polite">{`Slide ${position.slide + 1} of ${slides.length}, beat ${position.beat + 1}`}</p>
        <Stage>
          <Scene beat={beat} skitVisual={skitVisual} />
        </Stage>
        <Rehearsal prompt={promptAt(position, showingNotes)} shown={showingNotes} />
      </main>
    </MotionConfig>
  );
}

// Chimes when the presenter steps onto the Robux text, but not when the deck
// is opened straight onto it.
function useTextAlert(beat: Beat, skitVisual: SkitVisual) {
  const arriving = beat === "skitStage" && skitVisual === "message";
  const wasArriving = useRef(arriving);
  useEffect(() => {
    if (arriving && !wasArriving.current) playTextAlert();
    wasArriving.current = arriving;
  }, [arriving]);
}
