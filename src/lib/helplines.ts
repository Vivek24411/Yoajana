import type { IconName } from "@/components/icons";

/** National toll-free numbers. Keep this list short and verified: a wrong number here costs people a trip. */
export const HELPLINES: { number: string; icon: IconName; label: { hi: string; en: string }; note: { hi: string; en: string } }[] = [
  {
    number: "112",
    icon: "siren",
    label: { hi: "आपातकाल", en: "Emergency" },
    note: { hi: "पुलिस, एम्बुलेंस, आग — एक नंबर", en: "Police, ambulance, fire — one number" },
  },
  {
    number: "1930",
    icon: "shield",
    label: { hi: "साइबर धोखाधड़ी", en: "Cyber fraud" },
    note: { hi: "OTP / UPI से पैसा कटा? तुरंत कॉल करें", en: "Lost money to OTP / UPI fraud? Call at once" },
  },
  {
    number: "1800-180-1551",
    icon: "wheat",
    label: { hi: "किसान कॉल सेंटर", en: "Kisan Call Centre" },
    note: { hi: "खेती, फसल और किसान योजनाओं पर सलाह", en: "Advice on farming, crops and farmer schemes" },
  },
  {
    number: "155261",
    icon: "banknote",
    label: { hi: "पीएम किसान हेल्पलाइन", en: "PM-KISAN helpline" },
    note: { hi: "किस्त नहीं आई? स्टेटस पूछें", en: "Instalment not received? Ask about status" },
  },
  {
    number: "14555",
    icon: "heart",
    label: { hi: "आयुष्मान भारत", en: "Ayushman Bharat" },
    note: { hi: "मुफ़्त इलाज और आयुष्मान कार्ड", en: "Free treatment and Ayushman card" },
  },
  {
    number: "181",
    icon: "users",
    label: { hi: "महिला हेल्पलाइन", en: "Women helpline" },
    note: { hi: "हिंसा, परेशानी या मदद के लिए", en: "For violence, harassment or support" },
  },
  {
    number: "1098",
    icon: "baby",
    label: { hi: "चाइल्डलाइन", en: "Childline" },
    note: { hi: "मुसीबत में बच्चों के लिए", en: "For children in trouble" },
  },
  {
    number: "14567",
    icon: "elder",
    label: { hi: "बुज़ुर्ग हेल्पलाइन", en: "Elderline" },
    note: { hi: "बुज़ुर्गों के लिए पेंशन, कानूनी और देखभाल सलाह", en: "Pension, legal and care advice for elders" },
  },
  {
    number: "1906",
    icon: "flame",
    label: { hi: "LPG गैस आपातकाल", en: "LPG gas emergency" },
    note: { hi: "गैस लीक होने पर", en: "If gas is leaking" },
  },
];

export const CSC_LOCATOR = "https://locator.csccloud.in/";
export const CYBER_PORTAL = "https://cybercrime.gov.in/";
export const MYSCHEME = "https://www.myscheme.gov.in/";
