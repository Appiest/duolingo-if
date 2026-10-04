const SOUNDS = {
  correct: [
    { frequency: 784, start: 0, duration: 0.14 },
    { frequency: 1175, start: 0.1, duration: 0.3 },
  ],
  incorrect: [
    { frequency: 150, endFrequency: 120, start: 0, duration: 0.28, type: "square", volume: 0.06 },
    { frequency: 155, endFrequency: 124, start: 0, duration: 0.28, type: "sawtooth", volume: 0.05 },
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

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
}

export function playSound(name) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;
  SOUNDS[name].forEach((tone) => playTone(context, tone));
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
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
