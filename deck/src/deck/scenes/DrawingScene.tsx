"use client";

import { motion } from "motion/react";
import { assetPath } from "../assetPath";
import { grid } from "../geometry";
import layerData from "../layers.json";
import { Headline } from "../parts/Headline";
import { Show } from "../parts/Show";
import { sceneMove } from "../motion";
import type { Beat } from "../script";

type Expression = keyof typeof layerData;
type Layer = (typeof layerData)[Expression]["layers"][number];
type Box = { left: number; top: number; right: number; bottom: number };

const FIGURE_HEIGHT = 660;
const FIGURE_TOP = 290;
const LAND_STAGGER = 0.11;
const FIRST_LAND = 1.1;
const SCATTER_STAGGER = 0.03;
const BUILD_ORDER = ["body", "tail", "leg", "foot", "arm", "head", "ear", "eye", "muzzle", "brow", "paw"];

const PLACES: Record<Expression, Partial<Record<Beat, number>>> = {
  thinking: { drawLayers: 640, drawPoses: 560 },
  sad: { drawPoses: 1360 },
};

export function DrawingScene({ beat }: { beat: Beat }) {
  const drawing = beat === "drawLayers" || beat === "drawPoses";
  return (
    <>
      <Headline when={drawing}>How we drew Pawnzy</Headline>
      <Figure expression="thinking" beat={beat} />
      <Figure expression="sad" beat={beat} />
      <LayerPanel shown={beat === "drawLayers"} />
    </>
  );
}

function bounds(layers: readonly Layer[]): Box {
  return {
    left: Math.min(...layers.map((layer) => layer.x)),
    top: Math.min(...layers.map((layer) => layer.y)),
    right: Math.max(...layers.map((layer) => layer.x + layer.width)),
    bottom: Math.max(...layers.map((layer) => layer.y + layer.height)),
  };
}

function buildRank(name: string): number {
  const rank = BUILD_ORDER.findIndex((part) => name.startsWith(part));
  return rank === -1 ? BUILD_ORDER.length : rank;
}

// Layers stack in the team's order but land body first, face last, the way
// the drawing came together.
function landingDelays(layers: readonly Layer[]): Map<string, number> {
  const sorted = [...layers].sort((a, b) => buildRank(a.name) - buildRank(b.name));
  return new Map(sorted.map((layer, index) => [layer.name, FIRST_LAND + index * LAND_STAGGER]));
}

function Figure({ expression, beat }: { expression: Expression; beat: Beat }) {
  const layers = layerData[expression].layers;
  const box = bounds(layers);
  const scale = FIGURE_HEIGHT / (box.bottom - box.top);
  const center = PLACES[expression][beat];
  const shown = center !== undefined;
  const width = (box.right - box.left) * scale;
  const delays = landingDelays(layers);
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ top: FIGURE_TOP, width, height: FIGURE_HEIGHT }}
      initial={false}
      animate={{ left: (center ?? 640) - width / 2 }}
      transition={sceneMove}
      aria-hidden={!shown}
    >
      {layers.map((layer, index) => (
        <LayerPiece key={layer.name} src={layerSource(expression, layer)} layer={layer} box={box} scale={scale} stack={index} shown={shown} delay={delays.get(layer.name) ?? 0} />
      ))}
      <Show when={beat === "drawPoses"} delay={3} className="absolute inset-x-0 text-center" style={{ top: FIGURE_HEIGHT + 24 }}>
        <p className="text-caption font-extrabold text-ink-muted tabular-nums">{layers.length} layers</p>
      </Show>
    </motion.div>
  );
}

type LayerPieceProps = { src: string; layer: Layer; box: Box; scale: number; stack: number; shown: boolean; delay: number };

// Appears pushed out from the middle of the figure, like an exploded diagram,
// holds there a moment, then flies into place. It spreads less upward and
// downward so no piece covers the headline or leaves the slide.
function LayerPiece({ src, layer, box, scale, stack, shown, delay }: LayerPieceProps) {
  const middle = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  const away = { x: layer.x + layer.width / 2 - middle.x, y: layer.y + layer.height / 2 - middle.y };
  const length = Math.hypot(away.x, away.y) || 1;
  const push = 90 + length * scale * 0.35;
  const spreadY = away.y < 0 ? 0.35 : 0.7;
  const exploded = { x: (away.x / length) * push, y: (away.y / length) * push * spreadY, rotate: stack % 2 ? 9 : -9, opacity: 0, scale: 0.9 };
  return (
    <motion.img
      src={src}
      alt=""
      className="absolute max-w-none"
      style={{ left: (layer.x - box.left) * scale, top: (layer.y - box.top) * scale, width: layer.width * scale, height: layer.height * scale, zIndex: stack }}
      initial={false}
      animate={shown ? { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 } : exploded}
      transition={{
        type: "spring",
        duration: 0.9,
        bounce: 0.25,
        delay: shown ? delay : 0,
        opacity: { duration: 0.35, delay: shown ? 0.15 + stack * SCATTER_STAGGER : 0 },
      }}
    />
  );
}

function layerSource(expression: Expression, layer: Layer): string {
  return assetPath(`/characters/layers/${expression}/${layer.name}.png`);
}

function layerLabel(name: string): string {
  const words = name.replace(/-/g, " ");
  return words[0].toUpperCase() + words.slice(1);
}

const PANEL = { left: 1220, top: 250, width: 580, row: 52 };
const CHECKER = "repeating-conic-gradient(#e3e5e8 0% 25%, #ffffff 0% 50%) 50% / 12px 12px";

// A layers list like the one in the drawing app, top layer first. Each row
// flashes as its layer lands on the figure.
function LayerPanel({ shown }: { shown: boolean }) {
  const layers = layerData.thinking.layers;
  const delays = landingDelays(layers);
  return (
    <Show when={shown} delay={0.15} className="absolute rounded-card bg-stage-sunken p-5" style={{ left: PANEL.left, top: PANEL.top, width: PANEL.width }}>
      <p className="mb-3 flex items-center justify-between px-2 text-caption font-black text-ink">
        Layers
        <span className="rounded-full bg-white px-3 text-source font-extrabold text-ink-muted tabular-nums">{layers.length}</span>
      </p>
      {[...layers].reverse().map((layer) => (
        <LayerRow key={layer.name} src={layerSource("thinking", layer)} layer={layer} shown={shown} delay={delays.get(layer.name) ?? 0} />
      ))}
    </Show>
  );
}

function LayerRow({ src, layer, shown, delay }: { src: string; layer: Layer; shown: boolean; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-4 rounded-2xl px-2"
      style={{ height: PANEL.row }}
      initial={false}
      animate={shown ? { opacity: [0.35, 1, 1], backgroundColor: ["rgba(28,176,246,0)", "rgba(28,176,246,0.22)", "rgba(28,176,246,0)"] } : { opacity: 0.35 }}
      transition={{ duration: 0.9, times: [0, 0.2, 1], delay: shown ? delay : 0 }}
    >
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: CHECKER }}>
        <img src={src} alt="" className="max-h-9 max-w-9 object-contain" />
      </span>
      <span className="text-[26px] font-bold text-ink">{layerLabel(layer.name)}</span>
    </motion.div>
  );
}
