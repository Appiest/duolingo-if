const URL_PATTERN = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|info|co|io|gov|us)\b(?:\/\S*)?/gi;
const LONG_PRESS_MS = 450;
const MATCH_FLASH_MS = 450;
const MISMATCH_FLASH_MS = 600;
const ALL_MATCHED_DELAY_MS = 600;

const ICONS = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.3" r="1.4" fill="currentColor" stroke="none"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5H7l4.5-4v13L7 14.5H3.5z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5H7l4.5-4v13L7 14.5H3.5z" fill="currentColor"/><path d="m16 9.5 5 5M21 9.5l-5 5"/></svg>',
};

const RENDERERS = {
  "real-or-scam": renderRealOrScam,
  "tap-text": renderTapText,
  "match-pairs": renderMatchPairs,
  "chat-reply": renderChatReply,
  "word-bank": renderWordBank,
  "image-choice": renderImageChoice,
  "multiple-choice": renderMultipleChoice,
};

export function renderExercise(question, context) {
  const renderer = RENDERERS[question.type];
  if (!renderer) throw new Error(`Unknown exercise type "${question.type}" in question ${question.id}`);
  return renderer(question, context);
}

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    applyProp(node, key, value);
  }
  node.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
  return node;
}

function applyProp(node, key, value) {
  if (value === undefined || value === null || value === false) return;
  if (key === "class") node.className = value;
  else if (key === "dataset") Object.assign(node.dataset, value);
  else if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
  else node.setAttribute(key, value === true ? "" : value);
}

export function icon(name) {
  const wrapper = el("span", { class: `icon icon-${name}`, "aria-hidden": "true" });
  wrapper.innerHTML = ICONS[name];
  return wrapper;
}

export function restartAnimation(node, className) {
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function linkify(text) {
  const nodes = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    nodes.push(text.slice(lastIndex, match.index), el("span", { class: "sms-link" }, match[0]));
    lastIndex = match.index + match[0].length;
  }
  nodes.push(text.slice(lastIndex));
  return nodes.filter(Boolean);
}

function signName(lesson, tag) {
  const sign = lesson.lesson.signs?.[tag] ?? tag;
  return sign.split(":")[0];
}

function phoneCard(message, bubbleContent, bubbleClass = "") {
  const thread = el("div", { class: "phone-thread" },
    el("p", { class: `sms sms-in ${bubbleClass}` }, bubbleContent ?? linkify(message.text)));
  const card = el("div", { class: "phone", role: "group", "aria-label": `Text message from ${message.sender}` },
    el("div", { class: "phone-header" },
      el("span", { class: "phone-avatar", "aria-hidden": "true" }, message.sender.trim().charAt(0).toUpperCase()),
      el("div", {},
        el("p", { class: "phone-sender" }, message.sender),
        el("p", { class: "phone-meta" }, "Text Message • now"))),
    thread);
  return { card, thread };
}

function contextCard(context) {
  if (!context) return null;
  return el("p", { class: "context-card" },
    context.emoji ? el("span", { "aria-hidden": "true" }, `${context.emoji} `) : null,
    el("strong", {}, `${context.label}:`), ` ${context.text}`);
}

function createChoiceGroup(items, context, groupClass, buildContent) {
  const buttons = new Map();
  const group = el("div", { class: groupClass, role: "group" });
  let selectedId = null;

  const select = (id) => {
    selectedId = id;
    for (const [itemId, button] of buttons) button.setAttribute("aria-pressed", String(itemId === id));
    restartAnimation(buttons.get(id), "is-bouncing");
    context.playSound("tap");
    context.onChange();
  };

  items.forEach((item, index) => {
    const button = el("button", { type: "button", class: "choice choice-single", "aria-pressed": "false", onClick: () => select(item.id) },
      buildContent(item, index));
    buttons.set(item.id, button);
    group.append(button);
  });

  return {
    group,
    selectedId: () => selectedId,
    selectByNumber: (number) => items[number - 1] && select(items[number - 1].id),
    reveal(correctId) {
      for (const [itemId, button] of buttons) {
        button.disabled = true;
        if (itemId === correctId) button.classList.add("is-correct");
        else if (itemId === selectedId) button.classList.add("is-wrong");
      }
    },
  };
}

function singleChoiceExercise(question, items, choices, element) {
  const findItem = (id) => items.find((item) => item.id === id);
  return {
    element,
    isReady: () => choices.selectedId() !== null,
    selectByNumber: choices.selectByNumber,
    correctAnswer: () => findItem(question.answer).text,
    chosenText: () => findItem(choices.selectedId())?.text,
    lock: () => choices.reveal(question.answer),
    check() {
      const chosen = findItem(choices.selectedId());
      choices.reveal(question.answer);
      return { correct: chosen.id === question.answer, chosenFeedback: chosen.feedback };
    },
  };
}

function emojiCardContent(item) {
  return [
    el("span", { class: "choice-emoji", "aria-hidden": "true" }, item.emoji),
    el("span", { class: "choice-label" }, item.text),
  ];
}

function numberedContent(item, index) {
  return [
    el("span", { class: "choice-number", "aria-hidden": "true" }, String(index + 1)),
    el("span", { class: "choice-label" }, item.text),
  ];
}

function renderRealOrScam(question, context) {
  const items = [
    { id: "real", emoji: "✅", text: "Real" },
    { id: "scam", emoji: "🚩", text: "Scam" },
  ];
  const choices = createChoiceGroup(items, context, "choice-pair", emojiCardContent);
  const element = el("div", { class: "exercise" },
    contextCard(question.context), phoneCard(question.message).card, choices.group);
  return singleChoiceExercise(question, items, choices, element);
}

function renderImageChoice(question, context) {
  const items = question.options.map((option) => ({ ...option, text: option.label }));
  const choices = createChoiceGroup(items, context, "choice-cards", emojiCardContent);
  const element = el("div", { class: "exercise" },
    contextCard(question.context), question.message ? phoneCard(question.message).card : null, choices.group);
  return singleChoiceExercise(question, items, choices, element);
}

function renderMultipleChoice(question, context) {
  const items = question.options;
  const choices = createChoiceGroup(items, context, "choice-list", numberedContent);
  const element = el("div", { class: "exercise" },
    contextCard(question.context), question.message ? phoneCard(question.message).card : null, choices.group);
  return singleChoiceExercise(question, items, choices, element);
}

function renderChatReply(question, context) {
  const items = question.options;
  const { card, thread } = phoneCard(question.message);
  const choices = createChoiceGroup(items, context, "choice-list reply-list", (item, index) => [
    el("span", { class: "choice-number", "aria-hidden": "true" }, String(index + 1)),
    el("span", { class: "reply-bubble" }, item.text),
  ]);
  const element = el("div", { class: "exercise" }, contextCard(question.context), card, choices.group);
  const exercise = singleChoiceExercise(question, items, choices, element);

  return {
    ...exercise,
    check() {
      const sentText = exercise.chosenText();
      const result = exercise.check();
      const sentBubble = el("p", { class: "sms sms-out" }, sentText);
      thread.append(sentBubble);
      restartAnimation(sentBubble, "is-entering");
      return result;
    },
  };
}

function renderTapText(question, context) {
  const selected = new Set();
  const segmentNodes = new Map();
  const correctIds = new Set(question.correctSegments);
  const counter = question.multi ? el("p", { class: "tap-counter" }, "0 selected") : null;
  let locked = false;

  const toggle = (id) => {
    if (locked) return;
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      if (!question.multi) selected.clear();
      selected.add(id);
    }
    for (const [segmentId, node] of segmentNodes) node.setAttribute("aria-pressed", String(selected.has(segmentId)));
    restartAnimation(segmentNodes.get(id), "is-bouncing");
    context.playSound("tap");
    if (counter) counter.textContent = `${selected.size} selected`;
    context.onChange();
  };

  const bubbleContent = question.message.segments.flatMap((segment) => {
    const node = tappableSegment(segment, () => toggle(segment.id));
    segmentNodes.set(segment.id, node);
    const leadingSpace = segment.text.match(/^\s*/)[0];
    return leadingSpace ? [leadingSpace, node] : [node];
  });

  const reveal = () => {
    locked = true;
    for (const segment of question.message.segments) {
      const node = segmentNodes.get(segment.id);
      lockSegment(node);
      node.classList.add(segmentResultClass(correctIds.has(segment.id), selected.has(segment.id)));
      if (question.multi && segment.tag) node.after(el("span", { class: `segment-tag p-${segment.tag}` }, signName(context.lesson, segment.tag)));
    }
  };

  const { card } = phoneCard(question.message, bubbleContent, "sms-tappable");
  return {
    element: el("div", { class: "exercise" }, contextCard(question.context), card, counter),
    isReady: () => selected.size > 0,
    correctAnswer: () => tapTextAnswer(question, context.lesson),
    lock: reveal,
    check() {
      reveal();
      const correct = selected.size === correctIds.size && [...selected].every((id) => correctIds.has(id));
      return { correct, chosenFeedback: null };
    },
  };
}

function tappableSegment(segment, onToggle) {
  const node = el("span", { class: "segment", role: "button", tabindex: "0", "aria-pressed": "false" },
    linkify(segment.text.trimStart()));
  node.addEventListener("click", onToggle);
  node.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggle();
  });
  return node;
}

function lockSegment(node) {
  node.setAttribute("tabindex", "-1");
  node.setAttribute("aria-disabled", "true");
}

function segmentResultClass(isAnswer, isPicked) {
  if (isAnswer) return isPicked ? "is-correct" : "is-missed";
  return isPicked ? "is-wrong" : "is-neutral";
}

function tapTextAnswer(question, lesson) {
  const answers = question.message.segments
    .filter((segment) => question.correctSegments.includes(segment.id))
    .map((segment) => {
      const text = segment.text.trim();
      return question.multi && segment.tag ? `${text} (${signName(lesson, segment.tag)})` : text;
    });
  return answers.length === 1 ? answers[0] : answers;
}

function renderMatchPairs(question, context) {
  const state = { matchedCount: 0, picks: { left: null, right: null }, locked: false };
  const tiles = [];
  const hint = el("p", { class: "pair-hint", role: "status" });

  const showHint = (pair) => {
    hint.textContent = `${pair.right}: ${pair.hint}`;
  };

  const createTile = (side, pairIndex, label) => {
    const tile = { side, pairIndex, done: false };
    tile.button = el("button", { type: "button", class: "choice pair-tile", "aria-pressed": "false", onClick: () => pick(tile) }, label);
    tiles.push(tile);
    return tile;
  };

  const rightTile = (tile, pair) => {
    addLongPress(tile.button, () => showHint(pair));
    const infoButton = el("button", { type: "button", class: "pair-info", "aria-label": `Hint for ${pair.right}`, onClick: () => showHint(pair) }, icon("info"));
    return el("div", { class: "pair-right" }, tile.button, infoButton);
  };

  const indexedPairs = question.pairs.map((pair, index) => ({ pair, index }));
  const leftColumn = el("div", { class: "pair-column" },
    shuffle(indexedPairs).map(({ pair, index }) => createTile("left", index, pair.left).button));
  const rightColumn = el("div", { class: "pair-column" },
    shuffle(indexedPairs).map(({ pair, index }) => rightTile(createTile("right", index, pair.right), pair)));

  function pick(tile) {
    if (state.locked || tile.done) return;
    const previous = state.picks[tile.side];
    previous?.button.setAttribute("aria-pressed", "false");
    state.picks[tile.side] = previous === tile ? null : tile;
    if (previous === tile) return;
    tile.button.setAttribute("aria-pressed", "true");
    restartAnimation(tile.button, "is-bouncing");
    context.playSound("tap");
    if (state.picks.left && state.picks.right) resolvePicks();
  }

  function resolvePicks() {
    const pickedTiles = [state.picks.left, state.picks.right];
    state.picks = { left: null, right: null };
    pickedTiles.forEach((tile) => tile.button.setAttribute("aria-pressed", "false"));
    if (pickedTiles[0].pairIndex === pickedTiles[1].pairIndex) markMatched(pickedTiles);
    else markMismatched(pickedTiles);
  }

  function markMatched(pickedTiles) {
    context.playSound("match");
    pickedTiles.forEach((tile) => {
      tile.done = true;
      tile.button.classList.add("is-match");
    });
    setTimeout(() => retireTiles(pickedTiles), MATCH_FLASH_MS);
    state.matchedCount += 1;
    if (state.matchedCount === question.pairs.length) setTimeout(finish, ALL_MATCHED_DELAY_MS);
  }

  function retireTiles(pickedTiles) {
    const hadFocus = pickedTiles.some((tile) => tile.button === document.activeElement);
    pickedTiles.forEach((tile) => {
      tile.button.classList.replace("is-match", "is-done");
      tile.button.disabled = true;
    });
    if (hadFocus) tiles.find((tile) => !tile.done)?.button.focus();
  }

  function markMismatched(pickedTiles) {
    context.playSound("incorrect");
    pickedTiles.forEach((tile) => restartAnimation(tile.button, "is-mismatch"));
    setTimeout(() => pickedTiles.forEach((tile) => tile.button.classList.remove("is-mismatch")), MISMATCH_FLASH_MS);
  }

  function finish() {
    if (state.locked) return;
    state.locked = true;
    context.onComplete({ correct: true, chosenFeedback: null });
  }

  return {
    element: el("div", { class: "exercise" }, el("div", { class: "pairs" }, leftColumn, rightColumn), hint),
    isReady: () => false,
    selectByNumber: (number) => tiles[number - 1] && pick(tiles[number - 1]),
    correctAnswer: () => question.pairs.map((pair) => `${pair.left} → ${pair.right}`),
    lock() {
      state.locked = true;
      tiles.forEach((tile) => (tile.button.disabled = true));
    },
  };
}

function addLongPress(node, action) {
  let timer = null;
  let fired = false;
  const cancel = () => clearTimeout(timer);

  node.addEventListener("pointerdown", () => {
    fired = false;
    timer = setTimeout(() => {
      fired = true;
      action();
    }, LONG_PRESS_MS);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((type) => node.addEventListener(type, cancel));
  node.addEventListener("contextmenu", (event) => event.preventDefault());
  node.addEventListener("click", (event) => {
    if (!fired) return;
    fired = false;
    event.stopImmediatePropagation();
  }, true);
}

function renderWordBank(question, context) {
  const placed = [];
  const answerLine = el("div", { class: "answer-lines", role: "group", "aria-label": "Your answer" });
  const bank = el("div", { class: "word-bank", role: "group", "aria-label": "Word tiles" });
  const tiles = shuffle(question.tiles.map((word, index) => ({ word, index })));
  let locked = false;

  const place = (tile) => {
    if (locked || placed.includes(tile)) return;
    placed.push(tile);
    tile.slot.classList.add("is-empty");
    tile.bankButton.disabled = true;
    tile.answerButton = el("button", { type: "button", class: "tile", onClick: () => unplace(tile) }, tile.word);
    answerLine.append(tile.answerButton);
    context.playSound("tap");
    tiles.find((other) => !placed.includes(other))?.bankButton.focus({ preventScroll: true });
    context.onChange();
  };

  const unplace = (tile) => {
    if (locked) return;
    placed.splice(placed.indexOf(tile), 1);
    tile.answerButton.remove();
    tile.slot.classList.remove("is-empty");
    tile.bankButton.disabled = false;
    context.onChange();
  };

  tiles.forEach((tile) => {
    tile.bankButton = el("button", { type: "button", class: "tile", onClick: () => place(tile) }, tile.word);
    tile.slot = el("span", { class: "tile-slot" }, tile.bankButton);
    bank.append(tile.slot);
  });

  const lock = () => {
    locked = true;
    tiles.forEach((tile) => {
      tile.bankButton.disabled = true;
      if (tile.answerButton) tile.answerButton.disabled = true;
    });
  };

  return {
    element: el("div", { class: "exercise" }, answerLine, bank),
    isReady: () => placed.length > 0,
    selectByNumber: (number) => tiles[number - 1] && place(tiles[number - 1]),
    correctAnswer: () => question.answer.join(" "),
    lock,
    check() {
      lock();
      const result = judgeWords(placed.map((tile) => tile.word), question);
      answerLine.classList.add(result.correct ? "is-correct" : "is-wrong");
      return { ...result, chosenFeedback: null };
    },
  };
}

function judgeWords(words, question) {
  const answers = [question.answer, ...(question.acceptedAnswers ?? [])];
  if (answers.some((answer) => sameWords(words, answer))) return { correct: true };
  const extraWord = findSingleExtraWord(words, question.answer);
  if (extraWord) return { correct: true, almost: `You added one extra word: "${extraWord}".` };
  return { correct: false };
}

function sameWords(words, answer) {
  return words.length === answer.length && words.every((word, index) => word === answer[index]);
}

function findSingleExtraWord(words, answer) {
  if (words.length !== answer.length + 1) return null;
  const skipIndex = words.findIndex((_, index) => sameWords(words.filter((__, other) => other !== index), answer));
  return skipIndex === -1 ? null : words[skipIndex];
}
