import type { IconName } from "@/components/icons";

/** Picture-first topics for people who would rather tap than type. Matched against scheme tags. */
export const CATEGORIES = [
  {
    id: "farmer",
    icon: "wheat",
    label: { hi: "किसान · खेती", en: "Farming" },
    tags: ["farmer", "farmers", "agriculture", "farming", "kisan", "horticulture", "fish", "fishermen", "fisheries", "animal husbandry", "dairy", "livestock"],
  },
  {
    id: "pension",
    icon: "elder",
    label: { hi: "पेंशन · बुज़ुर्ग", en: "Pension · Elderly" },
    tags: ["pension", "senior citizen", "old age", "widow"],
  },
  {
    id: "health",
    icon: "heart",
    label: { hi: "इलाज · बीमा", en: "Health · Insurance" },
    tags: ["health", "medical", "hospital", "insurance", "treatment"],
  },
  {
    id: "education",
    icon: "cap",
    label: { hi: "पढ़ाई · छात्रवृत्ति", en: "Study · Scholarship" },
    tags: ["student", "students", "scholarship", "education", "school", "higher education", "coaching"],
  },
  {
    id: "women",
    icon: "baby",
    label: { hi: "महिला · बच्चे", en: "Women · Children" },
    tags: ["women", "woman", "girl", "girl child", "maternity", "pregnant women", "mother", "children"],
  },
  {
    id: "housing",
    icon: "house",
    label: { hi: "घर · आवास", en: "Housing" },
    tags: ["housing", "house", "shelter", "home"],
  },
  {
    id: "business",
    icon: "banknote",
    label: { hi: "लोन · व्यापार", en: "Loan · Business" },
    tags: ["loan", "business", "entrepreneur", "entrepreneurship", "startup", "self employment", "msme", "credit"],
  },
  {
    id: "labour",
    icon: "hardhat",
    label: { hi: "मज़दूर · रोज़गार", en: "Workers · Jobs" },
    tags: ["labour", "construction worker", "building worker", "worker", "unorganised worker", "employment", "skill", "training", "labourer"],
  },
  {
    id: "disability",
    icon: "accessibility",
    label: { hi: "दिव्यांग", en: "Disability" },
    tags: ["disability", "person with disability", "divyang", "disabled", "differently abled"],
  },
  {
    id: "scst",
    icon: "users",
    label: { hi: "SC · ST", en: "SC · ST" },
    tags: ["scheduled caste", "scheduled tribe", "tribal"],
  },
] as const satisfies readonly { id: string; icon: IconName; label: { hi: string; en: string }; tags: readonly string[] }[];

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const TAGS = new Map<string, Set<string>>(CATEGORIES.map((c) => [c.id, new Set(c.tags)]));

export const isCategory = (id: string): id is CategoryId => TAGS.has(id);

export const inCategory = (tags: string[], id: CategoryId) => {
  const set = TAGS.get(id)!;
  return tags.some((t) => set.has(t.toLowerCase()));
};

export const categoryOf = (tags: string[]) => CATEGORIES.find((c) => inCategory(tags, c.id));
