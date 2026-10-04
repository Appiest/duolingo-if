const SYNTH_SOUNDS = {
  tap: [
    { frequency: 520, endFrequency: 380, start: 0, duration: 0.06, type: "triangle", volume: 0.08 },
  ],
  correct: [
    { frequency: 784, start: 0, duration: 0.14 },
    { frequency: 1175, start: 0.1, duration: 0.3 },
  ],
  incorrect: [
    { frequency: 150, endFrequency: 120, start: 0, duration: 0.28, type: "square", volume: 0.06 },
    { frequency: 155, endFrequency: 124, start: 0, duration: 0.28, type: "sawtooth", volume: 0.05 },
  ],
  match: [
    { frequency: 1047, start: 0, duration: 0.12, volume: 0.12 },
    { frequency: 1568, start: 0.06, duration: 0.2, volume: 0.1 },
  ],
  combo: [
    { frequency: 659, start: 0, duration: 0.1 },
    { frequency: 880, start: 0.07, duration: 0.1 },
    { frequency: 1319, start: 0.14, duration: 0.32 },
  ],
  message: [
    { frequency: 880, start: 0, duration: 0.08, volume: 0.07 },
    { frequency: 1320, start: 0.05, duration: 0.12, volume: 0.06 },
  ],
  complete: [
    { frequency: 523, start: 0, duration: 0.16 },
    { frequency: 659, start: 0.1, duration: 0.16 },
    { frequency: 784, start: 0.2, duration: 0.16 },
    { frequency: 1047, start: 0.3, duration: 0.5 },
  ],
};

let audioContext = null;
let soundEnabled = true;
let soundFiles = {};
let currentVoice = null;
let voiceRequest = 0;
const bufferCache = new Map();

const UNLOCK_EVENTS = ["pointerdown", "touchend", "keydown", "click"];

export function installAudioUnlock() {
  if (navigator.audioSession) navigator.audioSession.type = "playback";
  const unlock = () => {
    const context = getAudioContext();
    if (!context) return;
    const silence = context.createBufferSource();
    silence.buffer = context.createBuffer(1, 1, context.sampleRate);
    silence.connect(context.destination);
    silence.start();
    if (context.state === "running") UNLOCK_EVENTS.forEach((type) => document.removeEventListener(type, unlock, true));
  };
  UNLOCK_EVENTS.forEach((type) => document.addEventListener(type, unlock, true));
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  if (!enabled) stopVoice();
}

export function configureSoundFiles(files = {}) {
  soundFiles = Object.fromEntries(Object.entries(files).filter(([, path]) => Boolean(path)));
}

export function playSound(name) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (soundFiles[name]) {
    playBuffer(soundFiles[name]).catch(() => playSynth(context, name));
    return;
  }
  playSynth(context, name);
}

export function preloadAudio(paths) {
  paths.filter(Boolean).forEach((path) => loadBuffer(path).catch(() => {}));
}

export function playVoice(path) {
  return playVoices([path]);
}

export async function playVoices(paths) {
  stopVoice();
  const request = voiceRequest;
  preloadAudio(paths);
  for (const path of paths.filter(Boolean)) {
    const buffer = await loadBuffer(path).catch(() => null);
    if (request !== voiceRequest || !soundEnabled) return;
    if (buffer) await playToEnd(buffer);
    if (request !== voiceRequest) return;
  }
}

function playToEnd(buffer) {
  return new Promise((resolve) => {
    currentVoice = startBuffer(buffer);
    currentVoice.onended = resolve;
  });
}

export function stopVoice() {
  voiceRequest += 1;
  try {
    currentVoice?.stop();
  } catch {
    // Already stopped.
  }
  currentVoice = null;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state !== "running") audioContext.resume().catch(() => {});
  return audioContext;
}

function loadBuffer(path) {
  const context = getAudioContext();
  if (!context) return Promise.reject(new Error("WebAudio unavailable"));
  if (!bufferCache.has(path)) {
    const loading = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`${path} returned ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data));
    loading.catch(() => bufferCache.delete(path));
    bufferCache.set(path, loading);
  }
  return bufferCache.get(path);
}

async function playBuffer(path) {
  return startBuffer(await loadBuffer(path));
}

function startBuffer(buffer) {
  const context = getAudioContext();
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
  return source;
}

function playSynth(context, name) {
  SYNTH_SOUNDS[name]?.forEach((tone) => playTone(context, tone));
}

function playTone(context, { frequency, endFrequency, start, duration, type = "sine", volume = 0.16 }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime + start;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, endTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}
