"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { notesShown, notesShownOnServer, subscribeToNotes, toggleNotes } from "./notes";
import { Rehearsal } from "./Rehearsal";
import { Scene } from "./Scene";
import { outline, slides } from "./script";
import { Stage } from "./Stage";
import { advance, last, retreat, start, toSearch, type Position } from "./timeline";
import { useDeckControls } from "./useDeckControls";

export function Deck({ initial }: { initial: Position }) {
  const [position, setPosition] = useState(initial);
  const showingNotes = useSyncExternalStore(subscribeToNotes, notesShown, notesShownOnServer);

  const commands = useMemo(
    () => ({
      next: () => setPosition((current) => advance(current, outline)),
      previous: () => setPosition((current) => retreat(current, outline)),
      first: () => setPosition(start),
      last: () => setPosition(last(outline)),
      notes: toggleNotes,
    }),
    [],
  );
  useDeckControls(commands);

  useEffect(() => {
    window.history.replaceState(null, "", `${window.location.pathname}${toSearch(position)}`);
  }, [position]);

  const beat = slides[position.slide].beats[position.beat];

  return (
    <MotionConfig reducedMotion="user">
      <main className="cursor-none select-none" onClick={commands.next}>
        <h1 className="sr-only">Real or Scam? Why kids need to spot scam texts</h1>
        <p className="sr-only" aria-live="polite">{`Slide ${position.slide + 1} of ${slides.length}, beat ${position.beat + 1}`}</p>
        <Stage>
          <Scene beat={beat} />
        </Stage>
        <Rehearsal position={position} beat={beat} shown={showingNotes} />
      </main>
    </MotionConfig>
  );
}
