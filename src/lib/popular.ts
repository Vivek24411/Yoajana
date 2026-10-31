import type { IconName } from "@/components/icons";
import type { Locale } from "./i18n";

/**
 * Hand-written names and one-line benefits for the hand-reviewed schemes (see data/overrides.json).
 * The dataset is English-only, so these give Hindi readers a name they recognise.
 * Amounts follow the 2024 dataset; scheme pages still tell people to confirm.
 */
export const POPULAR: Record<string, { icon: IconName; hi: { name: string; line: string }; en: { name: string; line: string } }> = {
  "pm-kisan": {
    icon: "wheat",
    hi: { name: "पीएम किसान सम्मान निधि", line: "ज़मीन वाले किसान परिवार को ₹6,000 सालाना, तीन किस्तों में" },
    en: { name: "PM-KISAN", line: "₹6,000 a year to landholding farmer families, in three instalments" },
  },
  "pmay-g": {
    icon: "house",
    hi: { name: "प्रधानमंत्री आवास योजना – ग्रामीण", line: "गाँव में पक्का घर बनाने के लिए पैसे की मदद" },
    en: { name: "PM Awaas Yojana – Gramin", line: "Money to build a pucca house in villages" },
  },
  mgnrega: {
    icon: "hardhat",
    hi: { name: "मनरेगा", line: "ग्रामीण परिवार को साल में 100 दिन काम की गारंटी" },
    en: { name: "MGNREGA", line: "Guaranteed 100 days of paid work a year for rural households" },
  },
  "nsap-ignoaps": {
    icon: "elder",
    hi: { name: "वृद्धावस्था पेंशन (IGNOAPS)", line: "60 साल से ऊपर के BPL बुज़ुर्गों को हर महीने पेंशन" },
    en: { name: "Old Age Pension (IGNOAPS)", line: "Monthly pension for BPL elders aged 60+" },
  },
  ignwps: {
    icon: "users",
    hi: { name: "विधवा पेंशन (IGNWPS)", line: "40–79 साल की BPL विधवाओं को हर महीने पेंशन" },
    en: { name: "Widow Pension (IGNWPS)", line: "Monthly pension for BPL widows aged 40–79" },
  },
  igndps: {
    icon: "accessibility",
    hi: { name: "दिव्यांग पेंशन (IGNDPS)", line: "गंभीर दिव्यांगता वाले BPL लोगों को हर महीने पेंशन" },
    en: { name: "Disability Pension (IGNDPS)", line: "Monthly pension for BPL persons with severe disability" },
  },
  pmuy: {
    icon: "flame",
    hi: { name: "प्रधानमंत्री उज्ज्वला योजना", line: "गरीब परिवार की महिलाओं को मुफ़्त LPG गैस कनेक्शन" },
    en: { name: "PM Ujjwala Yojana", line: "Free LPG gas connection for women of poor households" },
  },
  pmuy2: {
    icon: "flame",
    hi: { name: "उज्ज्वला योजना 2.0", line: "मुफ़्त LPG कनेक्शन, पहला सिलेंडर और चूल्हा" },
    en: { name: "Ujjwala Yojana 2.0", line: "Free LPG connection, first refill and stove" },
  },
  apy: {
    icon: "banknote",
    hi: { name: "अटल पेंशन योजना", line: "18–40 साल में जुड़ें, 60 के बाद ₹1,000–5,000 महीना पेंशन" },
    en: { name: "Atal Pension Yojana", line: "Join at 18–40, get ₹1,000–5,000 a month after 60" },
  },
  pmjjby: {
    icon: "shield",
    hi: { name: "जीवन ज्योति बीमा योजना", line: "₹436 सालाना में ₹2 लाख का जीवन बीमा" },
    en: { name: "PM Jeevan Jyoti Bima", line: "₹2 lakh life cover for ₹436 a year" },
  },
  pmsby: {
    icon: "shield",
    hi: { name: "सुरक्षा बीमा योजना", line: "₹20 सालाना में ₹2 लाख का दुर्घटना बीमा" },
    en: { name: "PM Suraksha Bima", line: "₹2 lakh accident cover for ₹20 a year" },
  },
  pmjdy: {
    icon: "banknote",
    hi: { name: "जन धन योजना", line: "ज़ीरो बैलेंस बैंक खाता, RuPay कार्ड और बीमा" },
    en: { name: "PM Jan Dhan Yojana", line: "Zero-balance bank account with RuPay card and insurance" },
  },
  pmfby: {
    icon: "wheat",
    hi: { name: "फ़सल बीमा योजना", line: "फ़सल ख़राब होने पर कम प्रीमियम में बीमा" },
    en: { name: "PM Fasal Bima Yojana", line: "Low-premium insurance when crops fail" },
  },
  kcc: {
    icon: "wheat",
    hi: { name: "किसान क्रेडिट कार्ड", line: "खेती के ख़र्च के लिए कम ब्याज पर कर्ज़" },
    en: { name: "Kisan Credit Card", line: "Low-interest credit for farming costs" },
  },
  pmmvy: {
    icon: "baby",
    hi: { name: "मातृ वंदना योजना", line: "पहले बच्चे पर गर्भवती महिला को ₹5,000" },
    en: { name: "PM Matru Vandana Yojana", line: "₹5,000 to pregnant women for the first child" },
  },
  ssy: {
    icon: "baby",
    hi: { name: "सुकन्या समृद्धि योजना", line: "बेटी के नाम बचत खाता, ऊँचा ब्याज और टैक्स छूट" },
    en: { name: "Sukanya Samriddhi Yojana", line: "High-interest savings account for a daughter" },
  },
  nfbs: {
    icon: "users",
    hi: { name: "राष्ट्रीय परिवार सहायता योजना", line: "कमाने वाले की मृत्यु पर BPL परिवार को ₹20,000 एकमुश्त" },
    en: { name: "National Family Benefit Scheme", line: "₹20,000 lump sum to a BPL family when the earner dies" },
  },
  "pm-svanidhi": {
    icon: "store",
    hi: { name: "पीएम स्वनिधि", line: "ठेले-फेरीवालों को बिना गारंटी का छोटा कर्ज़" },
    en: { name: "PM SVANidhi", line: "Collateral-free working capital loans for street vendors" },
  },
  pmv: {
    icon: "hammer",
    hi: { name: "पीएम विश्वकर्मा", line: "कारीगरों को ट्रेनिंग, औज़ार के लिए मदद और सस्ता कर्ज़" },
    en: { name: "PM Vishwakarma", line: "Training, toolkit support and cheap loans for artisans" },
  },
  pmmy: {
    icon: "store",
    hi: { name: "प्रधानमंत्री मुद्रा योजना", line: "छोटे व्यापार के लिए बिना गारंटी का कर्ज़" },
    en: { name: "PM Mudra Yojana", line: "Collateral-free loans for small businesses" },
  },
};

/** The one number or fact people remember a scheme by, for list rows. */
export const FIGURE: Record<string, { hi: string; en: string }> = {
  "pm-kisan": { hi: "₹6,000 / साल", en: "₹6,000 / yr" },
  "pmay-g": { hi: "पक्का घर", en: "Pucca house" },
  mgnrega: { hi: "100 दिन काम", en: "100 days work" },
  "nsap-ignoaps": { hi: "मासिक पेंशन", en: "Monthly pension" },
  pmuy: { hi: "मुफ़्त गैस", en: "Free LPG" },
  ignwps: { hi: "मासिक पेंशन", en: "Monthly pension" },
  apy: { hi: "₹1–5 हज़ार / माह", en: "₹1–5k / month" },
  pmsby: { hi: "₹2 लाख बीमा", en: "₹2 lakh cover" },
  pmjjby: { hi: "₹2 लाख बीमा", en: "₹2 lakh cover" },
  pmfby: { hi: "फ़सल बीमा", en: "Crop insurance" },
  kcc: { hi: "सस्ता कर्ज़", en: "Cheap credit" },
  pmmvy: { hi: "₹5,000", en: "₹5,000" },
  ssy: { hi: "बेटी की बचत", en: "Girl's savings" },
  pmjdy: { hi: "बैंक खाता", en: "Bank account" },
  igndps: { hi: "मासिक पेंशन", en: "Monthly pension" },
  "pm-svanidhi": { hi: "बिना गारंटी कर्ज़", en: "No-collateral loan" },
  pmv: { hi: "औज़ार + कर्ज़", en: "Tools + loan" },
  nfbs: { hi: "₹20,000", en: "₹20,000" },
};

/** Order for the home page: the schemes most rural families ask about first. */
export const POPULAR_ORDER = [
  "pm-kisan", "pmay-g", "mgnrega", "nsap-ignoaps", "pmuy", "ignwps", "apy", "pmsby", "pmjjby", "pmfby", "kcc", "pmmvy", "ssy", "pmjdy", "igndps", "pm-svanidhi", "pmv", "nfbs",
];

/** Hindi name for well-known schemes, shown alongside the official English name. */
export const localName = (slug: string, lang: Locale) => (lang === "hi" ? POPULAR[slug]?.hi.name : undefined);
