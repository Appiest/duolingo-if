import { el, icon, renderExercise, restartAnimation } from "./exercises.js";
import { TIMELINE, createCelebration } from "./celebration.js";
import { createChatScene } from "./chat-scene.js";
import { configureSoundFiles, installAudioUnlock, isSoundEnabled, playSound, playVoice, playVoices, setSoundEnabled, stopVoice } from "./sounds.js";

const DEFAULT_UI = {
  praise: ["Nice!", "Great job!", "Amazing!", "You got it!"],
  incorrect: "Not quite",
  almost: "Almost!",
  combo: "{count} in a row!",
  comboMilestones: [5, 10],
};
const PROMPT_VOICE_DELAY_MS = 400;
const PEEK_VISIBLE_PX = 90;
const FEEDBACK_VOICE_DELAY_MS = 350;
const HOP_POSES = new Set(["happy", "celebrate"]);
const BADGES = {
  replay: { emoji: "🔁", text: "Previous mistake" },
  boss: { emoji: "⚡", text: "Boss question" },
};
const DISCLAIMER = "A student concept for a USC Iovine and Young Academy class. Not affiliated with or endorsed by Duolingo.";

const appRoot = document.getElementById("app");
const announcer = document.getElementById("announcer");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let lesson = null;
let voiceManifest = {};
let session = null;
let primaryAction = null;

document.addEventListener("keydown", handleKeydown);
installAudioUnlock();
start();

async function start() {
  try {
    [lesson, voiceManifest] = await Promise.all([loadLesson(), loadVoiceManifest()]);
    configureSoundFiles(lesson.lesson.sounds);
    showIntro();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

async function loadLesson() {
  const response = await fetch("./lesson.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`lesson.json returned ${response.status}`);
  const data = await response.json();
  return fillCharacterName(data, data.lesson.character.name);
}

function fillCharacterName(value, name) {
  if (typeof value === "string") return value.replaceAll("{name}", name);
  if (Array.isArray(value)) return value.map((item) => fillCharacterName(item, name));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillCharacterName(item, name)]));
  }
  return value;
}

async function loadVoiceManifest() {
  try {
    const response = await fetch("./assets/voice/manifest.json", { cache: "no-cache" });
    return response.ok ? await response.json() : {};
  } catch {
    return {};
  }
}

function voiceFor(text) {
  return voiceManifest[text] ?? null;
}

function poseSource(pose) {
  return artFor(pose, "pose");
}

function portraitSource(pose) {
  return artFor(pose, "portrait");
}

function artFor(pose, kind) {
  const { poses, portraits = poses } = lesson.lesson.character;
  const art = kind === "portrait" ? portraits : poses;
  return art[pose] ?? art.idle;
}

function uiText() {
  return { ...DEFAULT_UI, ...lesson.lesson.ui };
}

function speakLater(texts, delay) {
  const files = [texts].flat().map((text) => voiceFor(text)?.file).filter(Boolean);
  if (files.length === 0) return;
  if (session) clearTimeout(session.voiceTimer);
  const timer = setTimeout(() => playVoices(files), delay);
  if (session) session.voiceTimer = timer;
}

function listenButton(text, label) {
  const voice = voiceFor(text);
  if (!voice) return null;
  return el("button", { type: "button", class: "icon-button bubble-listen", "aria-label": label, onClick: () => playVoice(voice.file) }, icon("soundOn"));
}

function showLoadError() {
  appRoot.replaceChildren(el("main", { class: "screen" },
    el("div", { class: "screen-body" },
      el("h1", { class: "screen-title" }, "The lesson didn't load"),
      el("p", { class: "screen-note" }, "If you opened index.html straight from your files, start a local server instead: run python3 -m http.server 8000 in this folder, then open localhost:8000."))));
}

function totalSteps() {
  return lesson.questions.length + 1;
}

function characterImage(pose, className, kind = "pose") {
  const image = el("img", { class: `biscuit ${className}`, width: "200", height: "200", decoding: "async", dataset: { art: kind } });
  setPose(image, pose);
  return image;
}

function setPose(image, pose) {
  const { name, poses } = lesson.lesson.character;
  const resolvedPose = poses[pose] ? pose : "idle";
  image.src = artFor(resolvedPose, image.dataset.art);
  image.alt = `${name}, ${resolvedPose}`;
  if (HOP_POSES.has(resolvedPose) && image.isConnected) restartAnimation(image, "is-hopping");
}

function speechBubble(text, variant) {
  return el("div", { class: `bubble ${variant}` }, el("p", {}, text), listenButton(text, `Hear ${lesson.lesson.character.name} say this`));
}

function disclaimer() {
  return el("footer", { class: "disclaimer" }, el("p", {}, DISCLAIMER));
}

function announce(text) {
  announcer.textContent = "";
  requestAnimationFrame(() => (announcer.textContent = text));
}

function showIntro() {
  session = null;
  const { title, unit, intro } = lesson.lesson;
  appRoot.replaceChildren(el("main", { class: "screen screen-intro" },
    el("div", { class: "screen-body" },
      el("p", { class: "unit-label" }, unit),
      el("h1", { class: "screen-title" }, title),
      el("div", { class: "character-stage" },
        speechBubble(intro.speech, "bubble-above"),
        characterImage(intro.pose, "biscuit-large")),
      el("button", { type: "button", class: "btn btn-primary btn-wide", onClick: showIntroChat }, intro.button)),
    disclaimer()));
  primaryAction = showIntroChat;
}

function showIntroChat() {
  if (!lesson.lesson.introChat?.messages?.length) return startLesson();
  playChat(lesson.lesson.introChat, "Skip intro", startLesson);
}

function playChat(chat, skipLabel, onFinish) {
  stopVoice();
  const scene = createChatScene({
    lesson,
    chat,
    voiceFor,
    poseSource,
    soundToggle: soundToggle(),
    reducedMotion: reducedMotion.matches,
    skipLabel,
    onFinish,
  });
  appRoot.replaceChildren(scene.root);
  window.scrollTo(0, 0);
  scene.root.focus({ preventScroll: true });
  scene.start();
  primaryAction = scene.handleEnter;
}

function pendingTeachChat(questionId) {
  return (lesson.lesson.teachChats ?? []).find((chat) => chat.before === questionId && !session.shownChats.has(chat));
}

function showTeachChat(chat) {
  session.shownChats.add(chat);
  playChat(chat, "Skip", () => {
    appRoot.replaceChildren(session.shell.root);
    showQuestion();
  });
}

function startLesson() {
  stopVoice();
  session = { step: 0, results: [], praiseIndex: 0, streak: 0, voiceTimer: null, shownChats: new Set(), phase: "answering", exercise: null, question: null, image: null };
  session.shell = buildLessonShell();
  appRoot.replaceChildren(session.shell.root);
  showQuestion();
}

function buildLessonShell() {
  const progressFill = el("div", { class: "progress-fill" });
  const progress = el("div", {
    class: "progress", role: "progressbar", "aria-label": "Lesson progress",
    "aria-valuemin": "0", "aria-valuemax": String(totalSteps()), "aria-valuenow": "0",
  }, progressFill);
  const quitDialog = buildQuitDialog();
  const closeButton = el("button", { type: "button", class: "icon-button", "aria-label": "Quit lesson", onClick: () => quitDialog.showModal() }, icon("close"));
  const column = el("div", { class: "column" });
  const main = el("main", { class: "lesson-main", tabindex: "-1" }, column);
  const skipButton = el("button", { type: "button", class: "btn btn-secondary", onClick: handleSkip }, "Skip");
  const checkButton = el("button", { type: "button", class: "btn btn-primary btn-check", onClick: handleCheck }, "Check");
  const bottomBar = el("footer", { class: "bottom-bar" }, el("div", { class: "bar-inner" }, skipButton, checkButton));
  const sheetContent = el("div", { class: "bar-inner sheet-inner" });
  const peekImage = el("img", { alt: "", width: "200", height: "200" });
  const sheet = el("section", { class: "sheet", "data-state": "idle", "aria-label": "Answer feedback" },
    el("div", { class: "sheet-peek", "aria-hidden": "true" }, peekImage), sheetContent);

  const root = el("div", { class: "lesson" },
    el("header", { class: "topbar" }, el("div", { class: "topbar-inner" }, closeButton, progress, soundToggle())),
    main, bottomBar, sheet, quitDialog);

  return { root, progress, progressFill, column, main, skipButton, checkButton, bottomBar, sheet, sheetContent, peekImage };
}

function soundToggle() {
  const button = el("button", { type: "button", class: "icon-button sound-toggle", "aria-label": "Sound effects", "aria-pressed": String(isSoundEnabled()) },
    icon("soundOn"), icon("soundOff"));
  button.addEventListener("click", () => {
    setSoundEnabled(!isSoundEnabled());
    button.setAttribute("aria-pressed", String(isSoundEnabled()));
  });
  return button;
}

function buildQuitDialog() {
  const dialog = el("dialog", { class: "quit-sheet", "aria-labelledby": "quit-title" });
  dialog.append(el("div", { class: "quit-content" },
    characterImage("sad", "biscuit-quit", "portrait"),
    el("h2", { id: "quit-title" }, "Wait, don't go!"),
    el("p", {}, "You'll lose your progress if you end the session now."),
    el("button", { type: "button", class: "btn btn-blue btn-wide", onClick: () => dialog.close() }, "Keep learning"),
    el("button", { type: "button", class: "btn-text btn-text-danger", onClick: () => window.location.reload() }, "End session")));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  return dialog;
}

function currentQuestion() {
  const regular = lesson.questions[session.step];
  if (regular) return { question: regular, badge: null };
  return pickFinalQuestion();
}

function pickFinalQuestion() {
  const firstMiss = session.results.find((result) => !result.correct);
  const replay = firstMiss && lesson.q10.replays[firstMiss.question.concept];
  if (replay) return { question: replay, badge: "replay" };
  return { question: lesson.q10.boss, badge: "boss" };
}

function showQuestion() {
  const { question, badge } = currentQuestion();
  const teachChat = pendingTeachChat(question.id);
  if (teachChat) return showTeachChat(teachChat);
  const shell = session.shell;
  session.question = question;
  session.phase = "answering";
  session.image = characterImage("idle", "biscuit-prompt", "portrait");
  session.exercise = renderExercise(question, { lesson, onChange: updateCheckButton, onComplete: finishQuestion, playSound });

  const badgeNode = questionBadge(badge);
  shell.column.replaceChildren(...[
    badgeNode,
    el("div", { class: "prompt-row" }, session.image, el("div", { class: "bubble bubble-left" }, promptContent(question))),
    session.exercise.element,
  ].filter(Boolean));

  hideSheet();
  updateCheckButton();
  window.scrollTo(0, 0);
  shell.main.focus({ preventScroll: true });
  speakLater(question.prompt, PROMPT_VOICE_DELAY_MS);
  primaryAction = handleCheck;
}

function questionBadge(kind) {
  if (!kind) return null;
  const badge = BADGES[kind];
  return el("p", { class: `badge badge-${kind}` }, el("span", { "aria-hidden": "true" }, badge.emoji), badge.text);
}

function promptContent(question) {
  const heading = el("div", { class: "prompt-line" },
    el("h1", { class: "prompt" }, question.prompt),
    listenButton(question.prompt, "Read the question out loud"));
  if (!question.newWord) return [heading];
  return [heading, newWordRow(question.newWord)];
}

function newWordRow(newWord) {
  const definition = el("span", { class: "new-word-definition", hidden: true }, newWord.definition);
  const term = el("button", { type: "button", class: "new-word", "aria-expanded": "false" }, newWord.word);
  term.addEventListener("click", () => {
    const expanded = term.getAttribute("aria-expanded") !== "true";
    term.setAttribute("aria-expanded", String(expanded));
    definition.hidden = !expanded;
  });
  return el("p", { class: "new-word-row" }, el("span", { class: "new-word-label" }, "New word:"), term, definition);
}

function updateCheckButton() {
  const { checkButton, skipButton } = session.shell;
  const answering = session.phase === "answering";
  checkButton.disabled = !answering || !session.exercise.isReady();
  skipButton.disabled = !answering;
}

function handleCheck() {
  if (session.phase !== "answering" || !session.exercise.isReady()) return;
  clearTimeout(session.voiceTimer);
  finishQuestion(session.exercise.check());
}

function handleSkip() {
  if (session.phase !== "answering") return;
  session.exercise.lock();
  finishQuestion({ correct: false, chosenFeedback: null });
}

function finishQuestion({ correct, almost, chosenFeedback }) {
  if (session.phase !== "answering") return;
  session.phase = "feedback";
  const { question, exercise } = session;
  const correctAnswer = exercise.correctAnswer();
  const feedback = question.feedback[correct ? "correct" : "incorrect"];
  const text = correct ? feedback.text : chosenFeedback ?? feedback.text;
  session.streak = correct ? session.streak + 1 : 0;
  const isCombo = correct && uiText().comboMilestones.includes(session.streak);

  session.results.push({ question, correct, correctAnswer });
  setPose(session.image, feedback.pose);
  playSound(feedbackSound(correct, isCombo));
  updateCheckButton();
  const heading = sheetHeading(correct, almost, isCombo);
  showSheet({ correct, almost, correctAnswer, text, heading, pose: isCombo ? "celebrate" : feedback.pose });
  speakLater([heading, text], FEEDBACK_VOICE_DELAY_MS);
  primaryAction = advance;
}

function feedbackSound(correct, isCombo) {
  if (!correct) return "incorrect";
  return isCombo ? "combo" : "correct";
}

function sheetHeading(correct, almost, isCombo) {
  const ui = uiText();
  if (!correct) return ui.incorrect;
  if (almost) return ui.almost;
  if (isCombo) return ui.combo.replace("{count}", String(session.streak));
  return nextPraise();
}

function nextPraise() {
  const { praise } = uiText();
  const heading = praise[session.praiseIndex % praise.length];
  session.praiseIndex += 1;
  return heading;
}

function showSheet({ correct, almost, correctAnswer, text, heading, pose }) {
  const { sheet, sheetContent, bottomBar, main, peekImage } = session.shell;
  peekImage.src = portraitSource(pose);
  const continueButton = el("button", { type: "button", class: `btn ${correct ? "btn-primary" : "btn-danger"} sheet-button`, onClick: advance },
    correct ? "Continue" : "Got it");

  sheetContent.replaceChildren(
    el("div", { class: "sheet-message" },
      el("span", { class: "sheet-icon" }, icon(correct ? "check" : "close")),
      el("div", { class: "sheet-text" },
        el("h2", { class: "sheet-heading" }, heading),
        almost ? el("p", { class: "sheet-almost" }, almost) : null,
        correct && !almost ? null : answerBlock(correctAnswer),
        el("p", { class: "sheet-feedback" }, text))),
    continueButton);

  sheet.dataset.state = correct ? "correct" : "incorrect";
  bottomBar.inert = true;
  main.style.setProperty("--sheet-space", `${sheet.offsetHeight + PEEK_VISIBLE_PX}px`);
  revealAboveSheet(session.exercise.element, sheet);
  const answerNote = correct && !almost ? "" : `Correct answer: ${[correctAnswer].flat().join(", ")}.`;
  announce([heading, almost ?? "", answerNote, text].join(" "));
  continueButton.focus({ preventScroll: true });
}

function revealAboveSheet(element, sheet) {
  const settledSheetTop = window.innerHeight - sheet.offsetHeight;
  const visibleBottom = settledSheetTop - PEEK_VISIBLE_PX - 12;
  const overlap = element.getBoundingClientRect().bottom - visibleBottom;
  if (overlap > 0) window.scrollBy({ top: overlap, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

function answerBlock(correctAnswer) {
  const answer = Array.isArray(correctAnswer)
    ? el("ul", { class: "sheet-answer-list" }, correctAnswer.map((item) => el("li", {}, item)))
    : el("p", { class: "sheet-answer-text" }, correctAnswer);
  return el("div", { class: "sheet-answer" }, el("p", { class: "sheet-answer-label" }, "Correct answer:"), answer);
}

function hideSheet() {
  const { sheet, bottomBar, main } = session.shell;
  sheet.dataset.state = "idle";
  bottomBar.inert = false;
  main.style.removeProperty("--sheet-space");
}

function advance() {
  if (session.phase !== "feedback") return;
  clearTimeout(session.voiceTimer);
  stopVoice();
  session.step += 1;
  updateProgress();
  if (session.step >= totalSteps()) showComplete();
  else showQuestion();
}

function updateProgress() {
  const { progress, progressFill } = session.shell;
  progress.setAttribute("aria-valuenow", String(session.step));
  progressFill.style.setProperty("--progress", String(session.step / totalSteps()));
}

function showComplete() {
  const { outro } = lesson.lesson;
  const correctCount = session.results.filter((result) => result.correct).length;
  const accuracy = Math.round((correctCount / session.results.length) * 100);
  const misses = session.results.filter((result) => !result.correct);
  const tiles = [
    statTile("xp", "Total XP", outro.xp, String),
    statTile("accuracy", "Accuracy", accuracy, (value) => `${value}%`),
    statTile("streak", "Streak", 1, (value) => `🔥 ${value} day`),
  ];
  const parts = {
    canvas: el("canvas", { class: "confetti", "aria-hidden": "true" }),
    character: el("div", { class: "celebrate-character" }, characterImage(outro.pose, "biscuit-large")),
    bubble: speechBubble(outro.speech, "bubble-above"),
    title: el("h1", { class: "screen-title" }, outro.title),
    tiles,
    rule: el("p", { class: "rule-card" }, outro.rule),
    actions: el("div", { class: "complete-actions" },
      el("button", { type: "button", class: "btn btn-primary btn-wide", onClick: startLesson }, "Continue"),
      reviewSection(misses)),
  };

  appRoot.replaceChildren(parts.canvas, el("main", { class: "screen screen-complete", tabindex: "-1" },
    el("div", { class: "screen-body" },
      el("div", { class: "character-stage" }, parts.bubble, parts.character),
      parts.title,
      el("div", { class: "stats" }, tiles.map((tile) => tile.root)),
      parts.rule,
      parts.actions),
    disclaimer()));

  window.scrollTo(0, 0);
  appRoot.querySelector(".screen-complete").focus({ preventScroll: true });
  const celebration = createCelebration({ parts, cues: celebrationCues(tiles.length, outro.speech), reducedMotion: reducedMotion.matches });
  celebration.play();
  primaryAction = () => celebration.skipToEnd() || startLesson();
}

function celebrationCues(tileCount, speech) {
  const ticks = TIMELINE.tiles.slice(0, tileCount).map((at) => ({ at, run: () => playSound("tick"), skippable: true }));
  const voice = voiceFor(speech)?.file;
  return [
    { at: 0, run: () => playSound("complete") },
    ...ticks,
    { at: TIMELINE.voice, run: () => voice && playVoice(voice) },
  ];
}

function statTile(kind, label, target, format) {
  const value = el("p", { class: "stat-value" }, format(target));
  const root = el("div", { class: `stat stat-${kind}` }, el("p", { class: "stat-label" }, label), value);
  return { root, value, target, format };
}

function reviewSection(misses) {
  if (misses.length === 0) return null;
  const list = el("ol", { class: "review-list", id: "review-list", hidden: true },
    misses.map(({ question, correctAnswer }) => el("li", { class: "review-item" },
      el("p", { class: "review-prompt" }, question.prompt),
      el("p", { class: "review-answer" }, `Correct answer: ${[correctAnswer].flat().join("; ")}`))));
  const toggle = el("button", { type: "button", class: "btn-text", "aria-expanded": "false", "aria-controls": "review-list" },
    `Review mistakes (${misses.length})`);
  toggle.addEventListener("click", () => {
    list.hidden = !list.hidden;
    toggle.setAttribute("aria-expanded", String(!list.hidden));
  });
  return el("div", { class: "review" }, toggle, list);
}

function handleKeydown(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (document.querySelector("dialog[open]")) return;
  if (/^[1-9]$/.test(event.key)) {
    selectByNumber(Number(event.key));
    return;
  }
  if (event.key === "Enter" && enterRunsPrimaryAction(event.target)) {
    event.preventDefault();
    primaryAction?.();
  }
}

function selectByNumber(number) {
  if (session?.phase !== "answering") return;
  session.exercise.selectByNumber?.(number);
}

function enterRunsPrimaryAction(target) {
  const control = target.closest?.("button, [role='button'], a");
  if (!control) return true;
  return control.classList.contains("choice-single") && control.getAttribute("aria-pressed") === "true";
}
