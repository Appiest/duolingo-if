// Copies the lesson's character art into the deck, so the lesson's assets
// folder stays the one place to swap Pawnzy or Duo.
import { cpSync, mkdirSync, rmSync } from "node:fs";

const source = new URL("../../assets/characters/", import.meta.url);
const target = new URL("../public/characters/", import.meta.url);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log("Copied lesson art into public/characters");
