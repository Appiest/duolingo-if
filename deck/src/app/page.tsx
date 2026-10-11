"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Deck } from "@/deck/Deck";
import { outlineFor } from "@/deck/steps";
import { parsePosition } from "@/deck/timeline";

function DeckFromSearch() {
  const params = useSearchParams();
  const initial = parsePosition(params.get("slide"), params.get("beat"), outlineFor(true));
  return <Deck initial={initial} />;
}

export default function PresentPage() {
  return (
    <Suspense>
      <DeckFromSearch />
    </Suspense>
  );
}
