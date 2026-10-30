import { inWords } from "./format";
import { fmt, stateLabel, type Dictionary, type Locale } from "./i18n";
import type { Rule } from "./types";

/** One machine rule as a short sentence a person can check themselves ("Age 60 or above"). */
export function describeRule(rule: Rule, t: Dictionary, lang: Locale): string {
  const r = t.rules;
  const n = Number(rule.value);
  const list = (labels: Record<string, string>) =>
    (rule.value as string[]).map((v) => labels[v] ?? v).join(", ");

  switch (rule.field) {
    case "age":
      return fmt(rule.op === "gte" ? r.ageMin : r.ageMax, { n });
    case "income":
      return fmt(rule.op === "gte" ? r.incomeMin : r.incomeMax, { n: inWords(n, lang) });
    case "disability":
      return fmt(r.disability, { n });
    case "category":
      return `${r.category}: ${list(t.options.category)}`;
    case "occupation":
      return `${r.occupation}: ${list(t.options.occupation)}`;
    case "gender":
      return `${r.gender}: ${list(t.options.gender)}`;
    case "maritalStatus":
      return `${r.marital}: ${list(t.options.maritalStatus)}`;
    case "area":
      return `${r.area}: ${list(t.options.area)}`;
    case "state":
      return `${r.state}: ${(rule.value as string[]).map((s) => stateLabel(s, lang)).join(", ")}`;
    case "bpl":
      return rule.value ? r.bplYes : r.bplNo;
    case "minority":
      return rule.value ? r.minorityYes : r.minorityNo;
    case "pregnant":
      return rule.value ? r.pregnantYes : r.pregnantNo;
    case "incomeTaxPayer":
      return rule.value ? r.taxYes : r.taxNo;
    case "govtEmployee":
      return rule.value ? r.govtYes : r.govtNo;
    case "hasPuccaHouse":
      return rule.value ? r.puccaYes : r.puccaNo;
  }
}
