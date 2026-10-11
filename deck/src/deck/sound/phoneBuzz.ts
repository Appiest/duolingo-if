// A phone vibrating on a desk, built from a motor hum with a rattle on top.
// The two pulses line up with the phone's shake in the skit, which starts
// 0.3 seconds after the Robux text arrives.
const PULSES = [
  { start: 0.3, length: 0.26 },
  { start: 0.66, length: 0.26 },
];
const MOTOR_HZ = 190;
const RATTLE_HZ = 32;
const VOLUME = 0.5;

let sharedContext: AudioContext | null = null;

function audioContext(): AudioContext {
  sharedContext ??= new AudioContext();
  return sharedContext;
}

export function playPhoneBuzz() {
  const context = audioContext();
  void context.resume();
  const now = context.currentTime;
  for (const pulse of PULSES) playPulse(context, now + pulse.start, pulse.length);
}

function playPulse(context: AudioContext, startTime: number, length: number) {
  const endTime = startTime + length;
  const motor = new OscillatorNode(context, { type: "sawtooth", frequency: MOTOR_HZ });
  const rattle = new OscillatorNode(context, { type: "square", frequency: RATTLE_HZ });
  const rattleDepth = new GainNode(context, { gain: 0.35 });
  const tone = new BiquadFilterNode(context, { type: "lowpass", frequency: 1400, Q: 0.7 });
  const level = new GainNode(context, { gain: 0 });

  rattle.connect(rattleDepth).connect(level.gain);
  motor.connect(tone).connect(level).connect(context.destination);
  level.gain.setValueAtTime(0, startTime);
  level.gain.linearRampToValueAtTime(VOLUME, startTime + 0.02);
  level.gain.setValueAtTime(VOLUME, endTime - 0.03);
  level.gain.linearRampToValueAtTime(0, endTime);

  for (const oscillator of [motor, rattle]) {
    oscillator.start(startTime);
    oscillator.stop(endTime + 0.05);
  }
}
