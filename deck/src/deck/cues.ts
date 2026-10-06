import type { Beat } from "./script";

type Cue = { speaker: string; line: string };

export const cues: Record<Beat, Cue> = {
  skitText: { speaker: "Speaker A", line: "The text in our skit wasn’t made up." },
  fbiWarning: {
    speaker: "Speaker A",
    line: "The FBI warned about toll texts like it in 2024, after more than 2,000 complaints in about a month.",
  },
  topContact: { speaker: "Speaker B", line: "Text is now the number one way scammers reach people." },
  weekly: { speaker: "Speaker B", line: "61% of American adults get a scam text every week." },
  losses: {
    speaker: "Speaker B",
    line: "And in 2024, people reported losing $470 million to them, more than five times as much as in 2020.",
  },
  phones: {
    speaker: "Speaker C",
    line: "Kids get these texts too. 3 in 10 kids aged 8 to 10 already have their own smartphone.",
  },
  youngLosses: {
    speaker: "Speaker C",
    line: "And young people are the most likely to lose money. Half the fraud reports from people 19 and under involve a loss, more than any other age.",
  },
  aiTypos: {
    speaker: "Speaker D",
    line: "We used to tell people to look for typos. The FBI says AI now writes scam texts without any.",
  },
  gradeGap: {
    speaker: "Speaker D",
    line: "But the best-known scam lesson for schools doesn’t start until sixth grade.",
  },
  pawnzyLesson: { speaker: "Speaker A", line: "So we made Pawnzy’s lesson, for kids before they need it." },
  fourPs: {
    speaker: "Speaker A",
    line: "It teaches the same four red flags the FTC tells parents to teach: Pretend, Problem, Pressure, Pay.",
  },
  fades: {
    speaker: "Speaker B",
    line: "One lesson fades within four weeks. That’s why it belongs in Duolingo, where kids come back every day.",
  },
  play: { speaker: "Everyone", line: "Grab your phone and see if you can beat Pawnzy’s boss question." },
};
