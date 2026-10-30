import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { firstSentence, fixGlue, inWords, toLines, toSteps } from "../src/lib/format";
import { getDictionary } from "../src/lib/i18n";
import { relevance } from "../src/lib/relevance";
import { describeRule } from "../src/lib/rules-text";
import type { Scheme } from "../src/lib/types";

describe("fixGlue", () => {
  it("splits headings and list items the PDF glued together", () => {
    expect(fixGlue("ObjectiveThe scheme aims")).toBe("Objective\nThe scheme aims");
    expect(toLines(fixGlue("Aadhaar CardLandholding paperSavings bank account"))).toEqual([
      "Aadhaar Card",
      "Landholding paper",
      "Savings bank account",
    ]);
  });
  it("keeps real compound names intact", () => {
    expect(fixGlue("Members of LokSabha and RajyaSabha")).toBe("Members of LokSabha and RajyaSabha");
    expect(fixGlue("register on eShram via WhatsApp")).toBe("register on eShram via WhatsApp");
  });
});

describe("toSteps", () => {
  it("separates the intro from numbered steps", () => {
    const { intro, steps } = toSteps("Online - via CSCs\nStep 1: Visit the CSC.Step 2: Fill the form.");
    expect(intro).toEqual(["Online - via CSCs"]);
    expect(steps).toEqual(["Visit the CSC.", "Fill the form."]);
  });
});

describe("firstSentence", () => {
  it("returns the first sentence only", () => {
    expect(firstSentence("Rs 6000 per year. Paid in three parts.")).toBe("Rs 6000 per year.");
  });
});

describe("inWords", () => {
  it("speaks money the way villages count it", () => {
    expect(inWords(120000, "hi")).toBe("1.2 लाख");
    expect(inWords(250000, "en")).toBe("2.5 lakh");
    expect(inWords(50000, "en")).toBe("50 thousand");
  });
});

describe("describeRule", () => {
  const hi = getDictionary("hi");
  const en = getDictionary("en");
  it("turns rules into plain sentences", () => {
    expect(describeRule({ field: "age", op: "gte", value: 60 }, hi, "hi")).toBe("उम्र 60 साल या ज़्यादा");
    expect(describeRule({ field: "income", op: "lte", value: 200000 }, en, "en")).toBe("Family income up to ₹2 lakh a year");
    expect(describeRule({ field: "occupation", op: "in", value: ["farmer", "fisherman"] }, en, "en")).toBe("Work: Farmer, Fisherman");
    expect(describeRule({ field: "bpl", op: "eq", value: true }, en, "en")).toBe("Has a BPL / Antyodaya card");
  });
});

describe("relevance", () => {
  const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "schemes.json"), "utf8")) as Scheme[];
  const get = (slug: string) => schemes.find((s) => s.slug === slug)!;
  const elder = { age: 67, occupation: ["other" as const], state: "Uttar Pradesh", area: "rural" as const };
  it("ranks a research fellowship below a rural job guarantee for a village elder", () => {
    const fellowship = schemes.find((s) => s.tags.some((t) => t.toLowerCase() === "fellowship"))!;
    expect(relevance(get("mgnrega"), elder)).toBeGreaterThan(relevance(fellowship, elder));
  });
});
