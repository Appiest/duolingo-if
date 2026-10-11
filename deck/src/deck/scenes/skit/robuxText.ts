// The scam text from the skit, split into the parts the red-flags visual marks.
export const ROBUX_SENDER = "Roblox";
export const ROBUX_LINK = "roblox-rewards.co";

export const ROBUX_PARTS = [
  { text: "Congrats! You won 10,000 free Robux.", flag: "prize" },
  { text: "Claim them in 10 minutes or they’re gone:", flag: "pressure" },
  { text: ROBUX_LINK, flag: "link" },
] as const;

export type Flag = "pretend" | (typeof ROBUX_PARTS)[number]["flag"];
