export function spring(time, frequency = 2, damping = 0.82) {
  if (time <= 0) return 0;
  const omega = 2 * Math.PI * frequency;
  const dampedOmega = omega * Math.sqrt(1 - damping * damping);
  const decay = Math.exp(-damping * omega * time);
  return 1 - decay * (Math.cos(dampedOmega * time) + ((damping * omega) / dampedOmega) * Math.sin(dampedOmega * time));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(progress) {
  return 1 - (1 - clamp(progress, 0, 1)) ** 3;
}

export function createClock() {
  let origin = performance.now();
  return {
    now: () => (performance.now() - origin) / 1000,
    jumpTo(time) {
      origin = performance.now() - time * 1000;
    },
  };
}
