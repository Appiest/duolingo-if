import type { Metadata } from "next";
import { cues } from "@/deck/cues";
import { facts } from "@/deck/facts";
import proposals from "@/deck/proposals.json";
import type { SlideId } from "@/deck/script";
import type { Proposal } from "@/deck/scriptDraft";
import { skit } from "@/deck/skit";
import { ScriptEditor } from "@/script/ScriptEditor";

export const metadata: Metadata = { title: "Real or Scam? script" };

const titles = Object.fromEntries(Object.entries(facts).map(([id, slide]) => [id, slide.title])) as Record<SlideId, string>;

export default function ScriptPage() {
  return <ScriptEditor initial={{ cues, proposals: proposals as Proposal[], skit }} editable={!process.env.PAGES_BASE_PATH} titles={titles} />;
}
