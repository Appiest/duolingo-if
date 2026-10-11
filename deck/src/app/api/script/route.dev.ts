import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { slides } from "@/deck/script";
import type { Draft } from "@/deck/scriptDraft";

// Local-only: next.config.ts drops *.dev.ts files from the static export.
const deckDir = path.join(process.cwd(), "src", "deck");
const beats = new Set<string>(slides.flatMap((slide) => slide.beats));

function isCue(value: unknown): boolean {
  const cue = value as { speaker?: unknown; line?: unknown };
  return typeof cue?.speaker === "string" && typeof cue?.line === "string";
}

function isSkit(value: unknown): boolean {
  return Array.isArray(value) && value.every((line) => isCue(line) && typeof line.id === "string");
}

function isDraft(value: unknown): value is Draft {
  const draft = value as Partial<Draft>;
  if (!draft?.cues || !Array.isArray(draft.proposals) || !isSkit(draft.skit)) return false;
  const entries = Object.entries(draft.cues);
  return entries.length === beats.size && entries.every(([beat, cue]) => beats.has(beat) && isCue(cue));
}

function asJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const parts = ["cues", "proposals", "skit"] as const;

async function onDisk(): Promise<string> {
  const files = await Promise.all(parts.map((part) => readFile(path.join(deckDir, `${part}.json`), "utf8")));
  return JSON.stringify(files.map((text) => JSON.parse(text)));
}

function asSaved(draft: Draft): string {
  return JSON.stringify(parts.map((part) => draft[part]));
}

// A tab that loaded the script before someone else changed it must not save
// its old copy over theirs, so every save names the version it started from.
export async function PUT(request: Request) {
  const { draft, base }: { draft: unknown; base: unknown } = await request.json();
  if (!isDraft(draft) || !isDraft(base)) return Response.json({ error: "The script didn't match the deck's beats." }, { status: 400 });
  if ((await onDisk()) !== asSaved(base)) return Response.json({ error: "The script changed since this page loaded." }, { status: 409 });
  await writeFile(path.join(deckDir, "cues.json"), asJson(draft.cues));
  await writeFile(path.join(deckDir, "proposals.json"), asJson(draft.proposals));
  await writeFile(path.join(deckDir, "skit.json"), asJson(draft.skit));
  return Response.json({ saved: true });
}
