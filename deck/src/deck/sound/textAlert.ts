import { assetPath } from "../assetPath";

// Android's default text alert, "Pixie Dust", from the Android Open Source
// Project (Apache 2.0). It plays as the Robux text pops onto the phone.
const ALERT_DELAY_MS = 500;

let alert: HTMLAudioElement | null = null;

export function playTextAlert() {
  alert ??= new Audio(assetPath("/sounds/text-alert.m4a"));
  const sound = alert;
  window.setTimeout(() => {
    sound.currentTime = 0;
    void sound.play().catch(() => {});
  }, ALERT_DELAY_MS);
}
