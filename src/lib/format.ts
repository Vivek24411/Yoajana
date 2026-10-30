// Real compound words that look like two glued words ("LokSabha", "eShram", "WhatsApp").
const CAMEL_OK = new Set([
  "Sabha", "Nidhi", "Nirbhar", "Samman", "Yojana", "Kendra", "Mitra", "Shakti", "Bandhu", "Seva", "Shram", "Dhan",
  "App", "Tube", "Locker", "Net", "Pay", "In", "Book",
]);

/**
 * PDF extraction dropped line breaks between list items and headings
 * ("ObjectiveThe scheme…", "Aadhaar CardPassportBank Passbook"). Put them back.
 */
export function fixGlue(text: string): string {
  return text.replace(/([a-z]{2})([A-Z][a-z]+)/g, (m, left: string, right: string) =>
    CAMEL_OK.has(right) ? m : `${left}\n${right}`,
  );
}

/**
 * The PDF text is one flowing string with sentences glued together
 * ("...50 years.The applicant must..."). Split it back into readable lines.
 */
export function toLines(text: string): string[] {
  return text
    .replace(/([.?:;])(?=[A-Z₹“"(])/g, "$1\n")
    .replace(/\s*(Step\s*\d+\s*:)/gi, "\n$1")
    .replace(/(?<=\S)\s*(?=\d{1,2}\.\s+[A-Z])/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
}

/** Application text often has "Step 1: … Step 2: …". Return intro lines plus numbered steps. */
export function toSteps(text: string): { intro: string[]; steps: string[] } {
  const intro: string[] = [];
  const steps: string[] = [];
  for (const line of toLines(text)) {
    const m = line.match(/^Step\s*\d+\s*:\s*(.*)$/i);
    if (m) steps.push(m[1] || line);
    else if (steps.length) steps[steps.length - 1] += ` ${line}`;
    else intro.push(line);
  }
  return { intro, steps };
}

/** First readable sentence, for highlight cards. */
export function firstSentence(text: string, max = 200): string {
  const line = toLines(text)[0] ?? "";
  const sentence = line.match(/^.+?[.!?।](?=\s|$)/)?.[0] ?? line;
  return sentence.length > max ? `${sentence.slice(0, max).replace(/\s+\S*$/, "")}…` : sentence;
}

/** FAQ text is "Question?Answer.Question?Answer." — pair questions with answers. */
export function toFaq(text: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const re = /([A-Z][^?]{8,240}\?)\s*([\s\S]*?)(?=(?:[A-Z][^?.!]{8,240}\?)|$)/g;
  for (const m of text.replace(/\n/g, " ").matchAll(re)) {
    const a = m[2].trim();
    if (a) out.push({ q: m[1].trim(), a });
  }
  return out;
}

/** ₹1,20,000 */
export const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

/** Villages count in lakh: 120000 → "1.2 लाख" / "1.2 lakh". */
export function inWords(n: number, lang: "hi" | "en") {
  const trim = (x: number) => String(Math.round(x * 100) / 100);
  if (n >= 10000000) return `${trim(n / 10000000)} ${lang === "hi" ? "करोड़" : "crore"}`;
  if (n >= 100000) return `${trim(n / 100000)} ${lang === "hi" ? "लाख" : "lakh"}`;
  if (n >= 1000) return `${trim(n / 1000)} ${lang === "hi" ? "हज़ार" : "thousand"}`;
  return String(n);
}
