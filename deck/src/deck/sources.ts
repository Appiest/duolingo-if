export type Source = { short: string; citation: string; url: string; quote?: string };

export const sources = {
  fbiToll: {
    short: "FBI public service announcement, April 12, 2024",
    citation: "FBI IC3, PSA I-041224-PSA: Smishing Scam Regarding Debt for Unpaid Tolls, April 12, 2024.",
    url: "https://www.ic3.gov/PSA/2024/PSA240412",
    quote:
      "Since early-March 2024, the FBI Internet Crime Complaint Center (IC3) has received over 2,000 complaints reporting smishing texts representing road toll collection service from at least three states.",
  },
  ftcTopContact: {
    short: "FTC testimony to Congress, March 25, 2026",
    citation:
      "FTC Prepared Statement, The Rising Scam Economy, Joint Economic Committee, March 25, 2026 (witness Lois Greisman).",
    url: "https://www.ftc.gov/system/files/ftc_gov/pdf/ftc-testimony-jec-hearing-on-the-rising-scam-economy.pdf",
    quote:
      "…receipt of a text message was the top reported contact method in 2025 when consumers identified a contact method in their fraud reports.",
  },
  pewWeekly: {
    short: "Pew Research Center, July 31, 2025 (9,397 U.S. adults)",
    citation: "Pew Research Center, Online Scams and Attacks in America Today, July 31, 2025. Survey of 9,397 U.S. adults, April 14–20, 2025.",
    url: "https://www.pewresearch.org/wp-content/uploads/sites/20/2025/07/PI_2025.07.31_Scams_REPORT.pdf",
    quote:
      "…a majority of U.S. adults report getting scam phone calls (68%), emails (63%) or text messages (61%) at least weekly that attempt to get their personal information.",
  },
  ftcTextLosses: {
    short: "FTC Consumer Sentinel Data Books, 2020–2024 (reported losses)",
    citation:
      "FTC Consumer Sentinel Network Data Books 2020–2024, Fraud Reports by Contact Method, row “Text.” Each year as first published.",
    url: "https://www.ftc.gov/system/files/ftc_gov/pdf/csn-annual-data-book-2024.pdf",
    quote:
      "In 2024, people reported $470 million in losses to these scams, more than five times the 2020 number. (FTC Data Spotlight, April 14, 2025)",
  },
  ftcUnderreported: {
    short: "FTC Data Spotlight, April 14, 2025",
    citation: "FTC Data Spotlight, Top text scams of 2024, April 14, 2025.",
    url: "https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2025/04/top-text-scams-2024",
    quote:
      "Since the vast majority of frauds are never reported, this number likely reflects only a fraction of the actual harm.",
  },
  pewKidsPhones: {
    short: "Pew Research Center, October 8, 2025 (3,054 parents)",
    citation:
      "Pew Research Center, How Parents Manage Screen Time for Kids, October 8, 2025. Survey of 3,054 parents of children 12 and under, May 13–26, 2025.",
    url: "https://www.pewresearch.org/internet/2025/10/08/how-parents-describe-their-kids-tech-use/",
    quote: "Has own smartphone, by child’s age: 8–10, 29%; 11–12, 57%. (Report chart)",
  },
  ftcAgeLosses: {
    short: "FTC Consumer Sentinel Data Book 2024, fraud reports by age",
    citation:
      "FTC Consumer Sentinel Network Data Book 2024, Reported Frauds and Losses by Age, “Percentage Reporting $ Loss.”",
    url: "https://www.ftc.gov/system/files/ftc_gov/data/csn-data-book-2024-csv.zip",
    quote: "19 and Under: 51% reporting a loss. 80 and Over: 21%. (Of fraud reports that included age, 2024)",
  },
  fbiAi: {
    short: "FBI public service announcement, December 3, 2024",
    citation: "FBI IC3, PSA I-120324-PSA: Criminals Use Generative Artificial Intelligence to Facilitate Financial Fraud, December 3, 2024.",
    url: "https://www.ic3.gov/PSA/2024/PSA241203",
    quote:
      "…can correct for human errors that might otherwise serve as warning signs of fraud.",
  },
  commonSensePhish: {
    short: "Common Sense Education, “Don’t Feed the Phish” (Grade 6)",
    citation: "Common Sense Education, Digital Citizenship lesson “Don’t Feed the Phish,” listed for Grade 6.",
    url: "https://www.commonsense.org/education/digital-citizenship/lesson/dont-feed-the-phish",
    quote: "Objective: Use message clues to identify examples of phishing.",
  },
  ftcParents: {
    short: "FTC consumer alert, March 31, 2025",
    citation: "FTC Consumer Alert, Parents: Talking to your kids about text scams, March 31, 2025.",
    url: "https://consumer.ftc.gov/consumer-alerts/2025/03/parents-talking-your-kids-about-text-scams",
    quote:
      "Chances are your tweens and teens with phones are getting them, too. (Red flags listed: pretend, problem or prize, pressure, pay.)",
  },
  soupsStudy: {
    short: "Lastdrager et al., SOUPS 2017 (353 children ages 8–13)",
    citation:
      "Lastdrager, Carvajal Gallardo, Hartel and Junger, How Effective is Anti-Phishing Training for Children? SOUPS 2017. 353 Dutch primary-school pupils.",
    url: "https://www.usenix.org/system/files/conference/soups2017/soups2017-lastdrager.pdf",
    quote:
      "The training improved the children’s overall score by 14%… the improved phishing score returned to pre-training levels after four weeks.",
  },
} satisfies Record<string, Source>;

export type SourceKey = keyof typeof sources;
