const MOOD_WORDS = {
  idle: "calm",
  happy: "happy",
  sad: "a little sad",
  shocked: "shocked",
  celebrate: "celebrating",
};
const NARRATOR = "Narrator";
const PREFERRED_TYPES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

const elements = {
  progress: document.getElementById("progress"),
  progressFill: document.getElementById("progress-fill"),
  progressText: document.getElementById("progress-text"),
  filters: document.getElementById("filters"),
  dot: document.getElementById("take-dot"),
  speaker: document.getElementById("take-speaker"),
  where: document.getElementById("take-where"),
  line: document.getElementById("take-line"),
  mood: document.getElementById("take-mood"),
  recordButton: document.getElementById("record-button"),
  recordLabel: document.getElementById("record-label"),
  meterFill: document.getElementById("meter-fill"),
  playButton: document.getElementById("play-button"),
  status: document.getElementById("take-status"),
  previous: document.getElementById("previous-button"),
  next: document.getElementById("next-button"),
  list: document.getElementById("line-list"),
};

const state = {
  lines: [],
  filter: "all",
  currentId: null,
  stream: null,
  recorder: null,
  meterFrame: 0,
  saving: false,
  player: null,
};

init();

async function init() {
  try {
    const response = await fetch("/api/lines");
    state.lines = await response.json();
  } catch {
    setStatus("Couldn't reach the recording server. Start it with python3 tools/record_voices.py.", "error");
    return;
  }
  state.currentId = firstUnrecorded()?.id ?? state.lines[0]?.id;
  renderFilters();
  render();
  bindControls();
}

function speakerNames() {
  return [...new Set(state.lines.map((line) => line.speaker))];
}

function speakerColor(speaker) {
  if (speaker === NARRATOR) return "var(--speaker-narrator)";
  return speaker === speakerNames()[0] ? "var(--speaker-character)" : "var(--speaker-friend)";
}

function visibleLines() {
  if (state.filter === "all") return state.lines;
  if (state.filter === "todo") return state.lines.filter((line) => !line.file);
  return state.lines.filter((line) => line.speaker === state.filter);
}

function currentLine() {
  return state.lines.find((line) => line.id === state.currentId);
}

function firstUnrecorded() {
  return state.lines.find((line) => !line.file);
}

function renderFilters() {
  const options = [["all", "All lines"], ...speakerNames().map((name) => [name, name]), ["todo", "Still to record"]];
  elements.filters.replaceChildren(...options.map(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(state.filter === value));
    button.addEventListener("click", () => setFilter(value));
    return button;
  }));
}

function setFilter(value) {
  state.filter = value;
  const visible = visibleLines();
  if (!visible.some((line) => line.id === state.currentId)) state.currentId = visible[0]?.id ?? state.currentId;
  renderFilters();
  render();
}

function render() {
  renderProgress();
  renderTake();
  renderList();
}

function renderProgress() {
  const recorded = state.lines.filter((line) => line.file).length;
  const total = state.lines.length;
  elements.progressText.innerHTML = `<strong>${recorded} of ${total}</strong> lines recorded`;
  elements.progress.setAttribute("aria-valuemax", String(total));
  elements.progress.setAttribute("aria-valuenow", String(recorded));
  elements.progressFill.style.setProperty("--progress", String(total ? recorded / total : 0));
}

function renderTake() {
  const line = currentLine();
  if (!line) return;
  const color = speakerColor(line.speaker);
  elements.dot.style.setProperty("--speaker-color", color);
  elements.speaker.style.setProperty("--speaker-color", color);
  elements.speaker.textContent = line.speaker;
  elements.where.textContent = line.where;
  elements.line.textContent = line.text;
  elements.mood.textContent = line.mood ? `${line.speaker} is ${MOOD_WORDS[line.mood] ?? line.mood} here.` : "";
  elements.playButton.disabled = !line.file;
  const visible = visibleLines();
  const position = visible.findIndex((item) => item.id === line.id);
  elements.previous.disabled = position <= 0;
  elements.next.disabled = position === -1 || position >= visible.length - 1;
}

function renderList() {
  const visible = visibleLines();
  if (visible.length === 0) {
    const done = document.createElement("li");
    done.className = "line-empty";
    done.textContent = "Every line here is recorded.";
    elements.list.replaceChildren(done);
    return;
  }
  elements.list.replaceChildren(...visible.map(listItem));
  elements.list.querySelector("[aria-current='true']")?.scrollIntoView({ block: "nearest" });
}

function listItem(line) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `line-item${line.file ? " is-recorded" : ""}`;
  button.setAttribute("aria-current", String(line.id === state.currentId));
  button.style.setProperty("--speaker-color", speakerColor(line.speaker));
  button.innerHTML = `<span class="line-check" aria-hidden="true">${line.file ? CHECK_ICON : ""}</span><span><span class="line-speaker"></span><span class="line-text"></span></span>`;
  button.querySelector(".line-speaker").textContent = line.speaker;
  button.querySelector(".line-text").textContent = line.text;
  button.setAttribute("aria-label", `${line.speaker}: ${line.text}${line.file ? ". Recorded." : ". Not recorded yet."}`);
  button.addEventListener("click", () => goTo(line.id));
  item.append(button);
  return item;
}

function goTo(id) {
  if (state.recorder) return;
  stopPlayback();
  state.currentId = id;
  setStatus("");
  render();
}

function move(step) {
  const visible = visibleLines();
  const position = visible.findIndex((line) => line.id === state.currentId);
  const target = visible[position + step];
  if (target) goTo(target.id);
}

function bindControls() {
  elements.recordButton.addEventListener("click", toggleRecording);
  elements.playButton.addEventListener("click", playTake);
  elements.previous.addEventListener("click", () => move(-1));
  elements.next.addEventListener("click", () => move(1));
  document.addEventListener("keydown", handleKey);
}

function handleKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const actions = {
    " ": toggleRecording,
    ArrowRight: () => move(1),
    ArrowLeft: () => move(-1),
    p: playTake,
    P: playTake,
  };
  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

async function toggleRecording() {
  if (state.saving) return;
  if (state.recorder) {
    state.recorder.stop();
    return;
  }
  try {
    await startRecording();
  } catch {
    setStatus("The microphone is blocked. Allow microphone access for this page and try again.", "error");
  }
}

async function startRecording() {
  stopPlayback();
  state.stream ??= await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false },
  });
  const mimeType = PREFERRED_TYPES.find((type) => window.MediaRecorder?.isTypeSupported(type)) ?? "";
  const recorder = new MediaRecorder(state.stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  const lineId = state.currentId;
  recorder.addEventListener("dataavailable", (event) => event.data.size && chunks.push(event.data));
  recorder.addEventListener("stop", () => finishRecording(lineId, new Blob(chunks, { type: recorder.mimeType })));
  recorder.start();
  state.recorder = recorder;
  startMeter();
  setRecordingUi(true);
  setStatus("Recording… press Space when you're done.");
}

async function finishRecording(lineId, blob) {
  state.recorder = null;
  stopMeter();
  setRecordingUi(false);
  state.saving = true;
  elements.recordButton.disabled = true;
  setStatus("Saving…");
  try {
    const saved = await uploadTake(lineId, blob);
    const line = state.lines.find((item) => item.id === lineId);
    line.file = saved.file;
    render();
    setStatus(`Saved. The take is ${saved.seconds.toFixed(1)} seconds after trimming.`, "saved");
    playTake();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.saving = false;
    elements.recordButton.disabled = false;
  }
}

async function uploadTake(lineId, blob) {
  const response = await fetch(`/api/recordings/${lineId}`, {
    method: "POST",
    headers: { "Content-Type": blob.type || "audio/webm" },
    body: blob,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "That take didn't save. Try again.");
  return result;
}

function setRecordingUi(recording) {
  elements.recordButton.setAttribute("aria-pressed", String(recording));
  elements.recordLabel.textContent = recording ? "Stop" : "Record";
}

function startMeter() {
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
  context.createMediaStreamSource(state.stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  const tick = () => {
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
    setLevel(Math.min(1, rms * 6));
    state.meterFrame = requestAnimationFrame(tick);
  };
  state.meterContext = context;
  tick();
}

function stopMeter() {
  cancelAnimationFrame(state.meterFrame);
  state.meterContext?.close();
  state.meterContext = null;
  setLevel(0);
}

function setLevel(level) {
  elements.recordButton.style.setProperty("--level", level.toFixed(3));
  elements.meterFill.style.setProperty("--level", level.toFixed(3));
}

function playTake() {
  const line = currentLine();
  if (!line?.file || state.recorder) return;
  stopPlayback();
  state.player = new Audio(`/${line.file}`);
  state.player.play().catch(() => {});
}

function stopPlayback() {
  state.player?.pause();
  state.player = null;
}

function setStatus(message, tone = "") {
  elements.status.textContent = message;
  elements.status.dataset.tone = tone;
}
