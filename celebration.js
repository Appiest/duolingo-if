import { clamp, createClock, easeOutCubic, spring } from "./motion.js";

export const TIMELINE = {
  rise: 0.3,
  title: 0.75,
  tiles: [1.0, 1.15, 1.3],
  rule: 1.9,
  voice: 2.2,
  actions: 2.4,
  end: 3.0,
};

const COUNT_SECONDS = 0.6;
const CONFETTI_SECONDS = 4;
const CONFETTI_PIECES_PER_CANNON = 70;
const CONFETTI_COLORS = ["#58CC02", "#1CB0F6", "#FF4B4B", "#FFC800", "#CE82FF", "#FF9600"];
const GRAVITY = 1400;
const AIR_DRAG = 1.8;

export function createCelebration({ parts, cues, reducedMotion }) {
  const clock = createClock();
  const fired = new Set();
  const confetti = reducedMotion ? null : prepareConfetti(parts.canvas);
  let frame = 0;

  function seek(time) {
    paintCharacter(parts.character, time - TIMELINE.rise);
    paintPop(parts.title, time - TIMELINE.title, 0.6);
    parts.tiles.forEach((tile, index) => paintTile(tile, time - TIMELINE.tiles[index]));
    paintRise(parts.rule, time - TIMELINE.rule);
    paintPop(parts.bubble, time - TIMELINE.voice, 0.8);
    paintFade(parts.actions, time - TIMELINE.actions);
    if (confetti) drawConfetti(confetti, time - TIMELINE.rise);
  }

  function runCues(time, skipping) {
    for (const [index, cue] of cues.entries()) {
      if (fired.has(index) || time < cue.at) continue;
      fired.add(index);
      if (!(skipping && cue.skippable)) cue.run();
    }
  }

  function tick() {
    const time = clock.now();
    seek(time);
    runCues(time, false);
    const lastMoment = confetti ? TIMELINE.rise + CONFETTI_SECONDS : TIMELINE.end;
    if (time < lastMoment && parts.canvas.isConnected) frame = requestAnimationFrame(tick);
  }

  return {
    seek,
    play() {
      if (reducedMotion) {
        seek(TIMELINE.end);
        runCues(0, false);
        return;
      }
      seek(0);
      runCues(0, false);
      frame = requestAnimationFrame(tick);
    },
    skipToEnd() {
      if (clock.now() >= TIMELINE.end) return false;
      clock.jumpTo(TIMELINE.end);
      runCues(TIMELINE.end, true);
      seek(TIMELINE.end);
      return true;
    },
    stop() {
      cancelAnimationFrame(frame);
    },
  };
}

function paintCharacter(node, local) {
  const rise = spring(local, 2.2, 0.72);
  const jump = spring(local, 3, 0.9) - spring(local - 0.2, 3, 0.9);
  const squashX = 1.12 - 0.12 * rise;
  const squashY = 0.82 + 0.18 * rise;
  node.style.translate = `0 ${(28 * (1 - rise) - 34 * jump).toFixed(2)}px`;
  node.style.scale = `${squashX.toFixed(4)} ${squashY.toFixed(4)}`;
}

function paintPop(node, local, scaleFrom) {
  const progress = spring(local, 2.6, 0.75);
  node.style.opacity = clamp(progress * 2, 0, 1).toFixed(3);
  node.style.scale = (scaleFrom + (1 - scaleFrom) * progress).toFixed(4);
}

function paintRise(node, local) {
  const progress = spring(local, 2.4, 0.8);
  node.style.opacity = clamp(progress * 1.6, 0, 1).toFixed(3);
  node.style.translate = `0 ${((1 - progress) * 24).toFixed(2)}px`;
}

function paintFade(node, local) {
  node.style.opacity = easeOutCubic(local / 0.3).toFixed(3);
  node.inert = local < 0;
}

function paintTile(tile, local) {
  paintRise(tile.root, local);
  const counted = Math.round(tile.target * easeOutCubic((local - 0.1) / COUNT_SECONDS));
  tile.value.textContent = tile.format(counted);
}

function prepareConfetti(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const pieces = [
    ...Array.from({ length: CONFETTI_PIECES_PER_CANNON }, () => cannonPiece(0, height, 1, height)),
    ...Array.from({ length: CONFETTI_PIECES_PER_CANNON }, () => cannonPiece(width, height, -1, height)),
  ];
  return { context, pieces, width, height };
}

function cannonPiece(x, y, direction, height) {
  const angle = (55 + Math.random() * 25) * (Math.PI / 180);
  const speed = height * (1.4 + Math.random() * 0.9);
  return {
    x,
    y,
    velocityX: Math.cos(angle) * speed * direction,
    velocityY: -Math.sin(angle) * speed,
    spin: (Math.random() - 0.5) * 14,
    phase: Math.random() * Math.PI * 2,
    width: 7 + Math.random() * 6,
    height: 11 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  };
}

function confettiPosition(piece, seconds) {
  const slowed = (1 - Math.exp(-AIR_DRAG * seconds)) / AIR_DRAG;
  const fall = (GRAVITY / AIR_DRAG) * (seconds - slowed);
  return {
    x: piece.x + piece.velocityX * slowed + Math.sin(seconds * 4 + piece.phase) * 10,
    y: piece.y + piece.velocityY * slowed + fall,
  };
}

function drawConfetti({ context, pieces, width, height }, seconds) {
  context.clearRect(0, 0, width, height);
  if (seconds <= 0 || seconds > CONFETTI_SECONDS) return;
  for (const piece of pieces) {
    const { x, y } = confettiPosition(piece, seconds);
    context.save();
    context.translate(x, y);
    context.rotate(piece.phase + piece.spin * seconds);
    context.scale(1, Math.cos(seconds * 7 + piece.phase));
    context.fillStyle = piece.color;
    context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    context.restore();
  }
}
