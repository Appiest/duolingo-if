import type { SlideId } from "./script";
import type { SourceKey } from "./sources";

export type Figure = { figure: string; counts: string; source: SourceKey };
export type Question = { question: string; answer: string; sources: SourceKey[] };
export type SlideFacts = { title: string; figures: Figure[]; questions: Question[] };

export const facts: Record<SlideId, SlideFacts> = {
  skit: { title: "Skit backdrop", figures: [], questions: [] },
  real: {
    title: "The text from our skit is real",
    figures: [
      {
        figure: "2,000+ complaints",
        counts: "Complaints to the FBI about smishing texts posing as road-toll services, early March to April 12, 2024, from at least three states.",
        source: "fbiToll",
      },
    ],
    questions: [
      {
        question: "Is the skit’s FasTrak text a real message?",
        answer:
          "It’s written in the same shape as the toll texts the FBI warned about: a small unpaid toll, a late fee and a link. The FBI’s sample text reads “We’ve noticed an outstanding toll amount of $12.51 on your record. To avoid a late fee of $50.00, visit…”",
        sources: ["fbiToll"],
      },
    ],
  },
  scale: {
    title: "How many people scam texts reach",
    figures: [
      { figure: "#1", counts: "Text was the top contact method in 2025 fraud reports to the FTC that named one.", source: "ftcTopContact" },
      { figure: "61%", counts: "U.S. adults who get scam text messages at least weekly (survey of 9,397 adults, April 2025).", source: "pewWeekly" },
      {
        figure: "$86M, $131M, $326M, $372M, $470M",
        counts: "Reported losses to fraud that started with a text, 2020 through 2024, each year as first published. 2024 is more than 5× 2020.",
        source: "ftcTextLosses",
      },
    ],
    questions: [
      {
        question: "Aren’t those numbers small for a whole country?",
        answer:
          "They are only what people reported. The FTC says most fraud is never reported, citing a study where 4.8% of fraud victims complained to a Better Business Bureau or a government agency.",
        sources: ["ftcUnderreported"],
      },
      {
        question: "Do you have 2025 text-only losses?",
        answer: "Not yet. The FTC hasn’t posted a 2025 Data Book with the text-message row, so the chart stops at 2024.",
        sources: ["ftcTextLosses"],
      },
    ],
  },
  kids: {
    title: "Why elementary schoolers",
    figures: [
      { figure: "29%", counts: "Children ages 8–10 with their own smartphone, as reported by parents (May 2025).", source: "pewKidsPhones" },
      { figure: "57%", counts: "Children ages 11–12 with their own smartphone, same survey.", source: "pewKidsPhones" },
      {
        figure: "51% vs 21%",
        counts: "Share of 2024 FTC fraud reports that involved losing money: people 19 and under versus people 80 and over. Only reports that included age.",
        source: "ftcAgeLosses",
      },
    ],
    questions: [
      {
        question: "Isn’t fraud mostly an older-people problem?",
        answer:
          "Older people lose more dollars per scam, but younger people are more likely to lose money once targeted. In 2024, 51% of reports from people 19 and under involved a loss, the highest share of any age group the FTC tracks.",
        sources: ["ftcAgeLosses"],
      },
      {
        question: "Kids don’t have money. What’s at risk?",
        answer:
          "Scam texts go after personal information and account access as well as cash. The FTC warns this can lead to identity theft, lost money or scammers getting into accounts. A kid’s phone is often linked to a parent’s payment method, which is our inference, not a sourced figure.",
        sources: ["ftcParents"],
      },
    ],
  },
  now: {
    title: "Why now",
    figures: [
      { figure: "AI removes typos", counts: "The FBI warns generative AI corrects the mistakes that used to signal a scam.", source: "fbiAi" },
      { figure: "Grade 6", counts: "Grade listed for Common Sense Education’s phishing lesson, “Don’t Feed the Phish.”", source: "commonSensePhish" },
    ],
    questions: [
      {
        question: "Why not wait until middle school?",
        answer:
          "About 3 in 10 kids ages 8–10 already have their own smartphone, but the best-known phishing lesson is listed for Grade 6. Ages 8–10 are roughly grades 3–5, so the gap is up to three years.",
        sources: ["pewKidsPhones", "commonSensePhish"],
      },
    ],
  },
  lesson: {
    title: "Pawnzy’s lesson",
    figures: [
      {
        figure: "4 red flags",
        counts: "The FTC’s parent guide lists pretend, problem or prize, pressure, and pay, and suggests turning spotting them into a game.",
        source: "ftcParents",
      },
      {
        figure: "+14%, then gone in 4 weeks",
        counts: "Anti-phishing training raised 353 Dutch children’s (ages 8–13) scores by 14%, which returned to pre-training levels after four weeks.",
        source: "soupsStudy",
      },
    ],
    questions: [
      {
        question: "Does a lesson actually stick?",
        answer:
          "One lesson alone doesn’t. The SOUPS 2017 study found gains faded within four weeks. That’s our argument for repeated practice in Duolingo. The study didn’t test daily streaks, so that part is our approach, not a finding.",
        sources: ["soupsStudy"],
      },
    ],
  },
  play: {
    title: "Play the lesson",
    figures: [],
    questions: [],
  },
};
