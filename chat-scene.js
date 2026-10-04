import { el, linkify } from "./exercises.js";
import { clamp, createClock, spring } from "./motion.js";
import { playSound, playVoice, preloadAudio, stopVoice } from "./sounds.js";

const PHONE_ENTER_SECONDS = 0.5;
const TYPING_SECONDS = { friend: 0.9, biscuit: 0.6 };
const GAP_SECONDS = 0.3;
const READ_BASE_SECONDS = 0.9;
const READ_SECONDS_PER_CHARACTER = 0.055;
const MORPH_SECONDS = 0.9;
const SKIP_TOLERANCE_SECONDS = 0.05;
const LABEL_MAX_WIDTH_PX = 120;

const BUBBLE_COLOR = [22, 119, 201];
const BUTTON_COLOR = [88, 204, 2];
const BUTTON_EDGE_COLOR = "#58a700";

export function createChatScene({ lesson, chat, voiceFor, poseSource, soundToggle, reducedMotion, onFinish, skipLabel }) {
  const character = lesson.lesson.character;
  const friend = chat.friend ?? lesson.lesson.introChat.friend;
  const example = chat.example ? buildExample(chat.example, lesson.lesson.signs ?? {}) : null;
  const beats = buildSchedule(chat.messages, voiceFor);
  const lastBeat = beats.at(-1);
  const morphStart = lastBeat.start + Math.min(lastBeat.end - lastBeat.start, 1.2);
  const morphEnd = morphStart + MORPH_SECONDS;

  const biscuitImage = el("img", { class: "chat-character-image", width: "200", height: "200", alt: "" });
  const friendImage = el("img", { class: "chat-character-image", width: "200", height: "200", alt: "", src: friend.image });
  const biscuitFigure = characterFigure(biscuitImage, character.name);
  const friendFigure = characterFigure(friendImage, friend.name);
  const rows = beats.map((beat) => buildRow(beat, friend));
  const thread = el("div", { class: "chat-thread", role: "log", "aria-label": `Chat between ${character.name} and ${friend.name}` }, rows.map((row) => row.root));
  const startButton = el("button", { type: "button", class: "btn btn-primary btn-wide chat-start", onClick: finish }, chat.button);
  const morphOld = el("span", { class: "chat-morph-old" }, lastBeat.message.text);
  const morphNew = el("span", { class: "chat-morph-new" }, chat.button);
  const morph = el("div", { class: "chat-morph", "aria-hidden": "true" }, morphOld, morphNew);

  const root = el("main", { class: `screen-chat${example ? " has-example" : ""}`, tabindex: "-1" },
    el("header", { class: "chat-topbar" }, soundToggle,
      el("button", { type: "button", class: "btn-text chat-skip", onClick: finish }, skipLabel)),
    el("div", { class: "chat-stage" }, biscuitFigure, friendFigure),
    example?.root,
    el("section", { class: "chat-phone" },
      el("div", { class: "phone-header" },
        el("img", { class: "chat-header-avatar", src: friend.image, alt: "", width: "36", height: "36" }),
        el("p", { class: "phone-sender" }, friend.name)),
      thread),
    el("footer", { class: "chat-footer" }, el("div", { class: "bar-inner" }, startButton)),
    morph);

  const clock = createClock();
  const state = { frame: 0, voicedIndex: -1, morphRects: null, finished: false, shownPose: null };
  preloadAudio(beats.map((beat) => voiceFor(beat.message.text)?.file));

  function seek(time) {
    beats.forEach((beat, index) => renderRow(rows[index], beat, time, reducedMotion));
    renderCharacters(time);
    if (example) paintExample(example, beats, time, reducedMotion);
    renderMorph(time);
    if (time < morphEnd) thread.scrollTop = thread.scrollHeight;
  }

  function renderCharacters(time) {
    const pose = currentBiscuitPose(beats, time);
    if (pose !== state.shownPose) {
      state.shownPose = pose;
      biscuitImage.src = poseSource(pose);
    }
    const speaker = beats.find((beat) => time >= beat.start && time < beat.end);
    renderSpeaker(biscuitFigure, speaker?.message.from === "biscuit" ? speaker : null, time);
    renderSpeaker(friendFigure, speaker?.message.from === "friend" ? speaker : null, time);
  }

  function renderSpeaker(figure, beat, time) {
    figure.classList.toggle("is-speaking", Boolean(beat));
    const hop = beat && !reducedMotion ? -12 * (spring(time - beat.start, 3) - spring(time - beat.start - 0.16, 3)) : 0;
    figure.style.translate = `0 ${hop.toFixed(2)}px`;
  }

  function renderMorph(time) {
    const lastBubble = rows.at(-1).bubble;
    const done = time >= morphEnd || (reducedMotion && time >= morphStart);
    startButton.classList.toggle("is-ready", done);
    lastBubble.style.visibility = time >= morphStart ? "hidden" : "";
    morph.hidden = done || time < morphStart;
    if (morph.hidden) return;
    state.morphRects ??= { from: lastBubble.getBoundingClientRect(), to: startButton.getBoundingClientRect() };
    paintMorph(morph, morphOld, morphNew, state.morphRects, spring(time - morphStart, 1.5));
  }

  function tick() {
    const time = clock.now();
    seek(time);
    triggerAudio(time);
    if (time >= morphEnd && !state.focusedStart) {
      state.focusedStart = true;
      startButton.focus({ preventScroll: true });
    }
    if (!state.finished && time < morphEnd + 0.2) state.frame = requestAnimationFrame(tick);
  }

  function triggerAudio(time) {
    const index = beats.findLastIndex((beat) => time >= beat.start);
    if (index <= state.voicedIndex || index < 0) return;
    state.voicedIndex = index;
    if (time - beats[index].start > 0.5) return;
    playSound("message");
    playVoice(voiceFor(beats[index].message.text)?.file);
  }

  function skipAhead() {
    const time = clock.now();
    if (time >= morphEnd) return finish();
    const next = beats.find((beat) => beat.start > time + SKIP_TOLERANCE_SECONDS);
    clock.jumpTo(next ? next.start : morphStart);
    if (!next) stopVoice();
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    cancelAnimationFrame(state.frame);
    stopVoice();
    onFinish();
  }

  thread.addEventListener("click", skipAhead);
  root.querySelector(".chat-stage").addEventListener("click", skipAhead);

  return {
    root,
    seek,
    start() {
      clock.jumpTo(0);
      state.frame = requestAnimationFrame(tick);
    },
    handleEnter: skipAhead,
    stop() {
      state.finished = true;
      cancelAnimationFrame(state.frame);
      stopVoice();
    },
    duration: morphEnd,
  };
}

function buildSchedule(messages, voiceFor) {
  let time = PHONE_ENTER_SECONDS;
  return messages.map((message) => {
    const typingStart = time;
    const start = typingStart + (TYPING_SECONDS[message.from] ?? TYPING_SECONDS.friend);
    const readSeconds = READ_BASE_SECONDS + message.text.length * READ_SECONDS_PER_CHARACTER;
    const voiceSeconds = voiceFor(message.text)?.seconds ?? 0;
    const end = start + Math.max(readSeconds, voiceSeconds + 0.15);
    time = end + GAP_SECONDS;
    return { message, typingStart, start, end };
  });
}

function buildExample(example, signs) {
  const marks = [];
  const parts = example.segments.flatMap((segment) => {
    const leadingSpace = segment.text.match(/^\s*/)[0];
    const part = el("span", { class: segment.tag ? `example-part p-${segment.tag}` : "" }, linkify(segment.text.trimStart()));
    const nodes = leadingSpace ? [leadingSpace, part] : [part];
    if (!segment.tag) return nodes;
    const label = el("span", { class: `example-tag p-${segment.tag}` }, (signs[segment.tag] ?? segment.tag).split(":")[0]);
    marks.push({ tag: segment.tag, part, label });
    return [...nodes, label];
  });
  const card = el("div", { class: "chat-example", "aria-label": `Example text from ${example.sender}` },
    el("p", { class: "example-sender" }, example.sender),
    el("p", { class: "example-text" }, parts));
  const root = el("div", { class: "chat-example-slot" }, el("div", { class: "chat-example-clip" }, card));
  return { root, card, marks };
}

function paintExample(example, beats, time, reducedMotion) {
  const reveal = beats.find((beat) => beat.message.showExample);
  const shown = reveal ? springOrStep(time - reveal.start, reducedMotion) : 1;
  example.root.style.gridTemplateRows = `${clamp(shown, 0, 1).toFixed(3)}fr`;
  example.card.style.opacity = clamp(shown * 1.6, 0, 1).toFixed(3);
  example.card.style.translate = `0 ${((1 - shown) * 16).toFixed(2)}px`;
  const all = beats.find((beat) => beat.message.highlight === "all");
  const pulse = all && !reducedMotion ? spring(time - all.start, 3, 0.9) - spring(time - all.start - 0.18, 3, 0.9) : 0;
  for (const mark of example.marks) {
    const beat = beats.find((item) => item.message.highlight === mark.tag);
    const lit = beat ? clamp(springOrStep(time - beat.start, reducedMotion), 0, 1) : 0;
    mark.part.style.setProperty("--mark", lit.toFixed(3));
    mark.label.style.opacity = lit.toFixed(3);
    mark.label.style.maxWidth = `${(lit * LABEL_MAX_WIDTH_PX).toFixed(1)}px`;
    mark.label.style.paddingInline = `${(lit * 7).toFixed(2)}px`;
    mark.label.style.marginInline = `${(lit * 4).toFixed(2)}px`;
    mark.label.style.scale = ((0.6 + 0.4 * lit) * (1 + 0.25 * pulse)).toFixed(4);
  }
}

function springOrStep(local, reducedMotion) {
  if (reducedMotion) return local >= 0 ? 1 : 0;
  return spring(local, 2.4, 0.8);
}

function currentBiscuitPose(beats, time) {
  const spoken = beats.filter((beat) => beat.message.from === "biscuit" && beat.message.pose && time >= beat.start);
  return spoken.at(-1)?.message.pose ?? "idle";
}

function characterFigure(image, name) {
  return el("figure", { class: "chat-character" }, image, el("figcaption", {}, name));
}

function buildRow(beat, friend) {
  const fromFriend = beat.message.from === "friend";
  const dots = el("span", { class: "typing-dots", "aria-hidden": "true" }, el("span"), el("span"), el("span"));
  const bubble = el("div", { class: `chat-bubble ${fromFriend ? "chat-bubble-in" : "chat-bubble-out"}` },
    forwardedCard(beat.message.forwarded),
    el("p", {}, beat.message.text));
  const root = el("div", { class: `chat-row ${fromFriend ? "from-friend" : "from-biscuit"}`, hidden: true },
    el("div", { class: "chat-row-inner" },
      fromFriend ? el("img", { class: "chat-row-avatar", src: friend.image, alt: "", width: "28", height: "28" }) : null,
      dots, bubble));
  return { root, dots, bubble };
}

function forwardedCard(forwarded) {
  if (!forwarded) return null;
  return el("div", { class: "forwarded" },
    el("p", { class: "forwarded-sender" }, forwarded.sender),
    el("p", { class: "forwarded-text" }, linkify(forwarded.text)));
}

function renderRow(row, beat, time, reducedMotion) {
  row.root.hidden = time < beat.typingStart;
  if (row.root.hidden) return;
  const typing = time < beat.start;
  row.dots.hidden = !typing;
  row.bubble.hidden = typing;
  const opened = reducedMotion ? 1 : clamp(spring(time - beat.typingStart, 2.4), 0, 1);
  row.root.style.gridTemplateRows = `${opened}fr`;
  if (typing) return paintDots(row.dots, time, reducedMotion);
  const entered = reducedMotion ? 1 : spring(time - beat.start, 2.2);
  row.bubble.style.opacity = clamp(entered * 1.6, 0, 1).toFixed(3);
  row.bubble.style.translate = `0 ${((1 - entered) * 14).toFixed(2)}px`;
  row.bubble.style.scale = (0.9 + 0.1 * entered).toFixed(4);
}

function paintDots(dots, time, reducedMotion) {
  [...dots.children].forEach((dot, index) => {
    const wave = reducedMotion ? 0 : Math.max(0, Math.sin(time * 9 - index * 0.9));
    dot.style.translate = `0 ${(-4 * wave).toFixed(2)}px`;
    dot.style.opacity = (0.45 + 0.55 * wave).toFixed(3);
  });
}

function paintMorph(morph, oldLabel, newLabel, rects, progress) {
  const { from, to } = rects;
  const mix = (a, b) => a + (b - a) * progress;
  const color = BUBBLE_COLOR.map((channel, index) => Math.round(mix(channel, BUTTON_COLOR[index])));
  const oldFade = clamp(progress * 2.5, 0, 1);
  const newFade = clamp((progress - 0.35) * 2.5, 0, 1);
  Object.assign(morph.style, {
    left: `${mix(from.left, to.left)}px`,
    top: `${mix(from.top, to.top)}px`,
    width: `${mix(from.width, to.width)}px`,
    height: `${mix(from.height, to.height)}px`,
    borderRadius: `${mix(18, 16)}px`,
    backgroundColor: `rgb(${color.join(" ")})`,
    borderBottom: `${clamp(progress, 0, 1) * 4}px solid ${BUTTON_EDGE_COLOR}`,
  });
  oldLabel.style.opacity = String(1 - oldFade);
  oldLabel.style.filter = `blur(${(oldFade * 4).toFixed(2)}px)`;
  newLabel.style.opacity = String(newFade);
  newLabel.style.filter = `blur(${((1 - newFade) * 4).toFixed(2)}px)`;
}
