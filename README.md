# Yojana Sahayak · योजना सहायक

A voice-first web app that helps rural citizens understand and find Indian government schemes (Sarkari Yojana) in Hindi, English or Hinglish.

- **Ask (AI agent):** speak or type a question, from the big mic on the home screen or in chat. The agent searches the scheme database, checks eligibility with the rules engine (using answers already saved on the phone), and answers in the user's language with links to each scheme. Answers can be read aloud, automatically if the user turns that on.
- **My Schemes (eligibility finder):** one question per screen with picture cards and auto-advance (state, age, gender, category, village/city, work, income in lakh, disability, BPL and more). Results are split into **eligible**, **maybe** (with "answer these to confirm" shortcuts) and **open to all**, ranked so everyday schemes come before niche fellowships. Profiles for **family members** (mother, father, son…) sit side by side, and the list can be sent on WhatsApp.
- **Scheme pages:** main benefit up front, a "can I get this?" check that spells out every condition against your answers, a **document checklist** you tick at home, numbered application steps, where to apply (CSC locator), save, share and listen. Well-known schemes show their Hindi name.
- **All Schemes:** search and browse 2,066 central and state schemes by topic tiles (farming, pension, health, study…) and state; the most useful schemes come first.
- **Help:** tap-to-call national helplines (112, 1930 cyber fraud, Kisan Call Centre, PM-KISAN, Ayushman, women, child, elders, LPG), fraud safety tips, install button and "delete my data".
- **Built for village phones:** Hindi and English (`/hi`, `/en`), adjustable text size, light/dark, installable PWA with an offline service worker (saved schemes open without internet), small payloads, and nothing leaves the phone except the questions sent to the server.

## Quick start

```bash
pnpm install
cp .env.example .env.local      # add AI_GATEWAY_API_KEY to turn on the AI agent
pnpm dev                        # http://localhost:3000 → redirects to /hi
pnpm test                       # eligibility engine + search tests
```

The app works without any keys. Chat then falls back to keyword search results, and voice uses the browser's built-in speech recognition.

| Env var | Purpose |
|---|---|
| `AI_GATEWAY_API_KEY` | Turns on the AI agent (Vercel AI Gateway). On Vercel, OIDC works automatically. |
| `CHAT_MODEL` | Optional model override; the default is `anthropic/claude-sonnet-5.5`. |
| `SARVAM_API_KEY` | Optional server speech-to-text (Hindi, English and Hinglish) for browsers without built-in voice typing. |

## Data

Scheme data comes from the Hugging Face dataset [`Navraj025/gov_myscheme`](https://huggingface.co/datasets/Navraj025/gov_myscheme), which holds PDF snapshots of myScheme.gov.in pages from around March 2024. The pipeline is:

```bash
pip install -r scripts/requirements.txt
pnpm data:download   # ~2,150 PDFs → data/raw/ (gitignored)
pnpm data:build      # → data/schemes.json (committed; the app reads this)
```

- `scripts/extract_schemes.py` parses each PDF into sections (details, benefits, eligibility, exclusions, application process, documents, FAQ, sources), fixes encoding problems, and removes duplicates.
- `scripts/eligibility_rules.py` turns the eligibility text into machine-checkable rules (age, income, category, occupation, gender, disability, BPL, widow, minority, rural/urban, pregnancy, state). It's conservative: it only adds a rule when the text clearly restricts who can apply.
- `data/overrides.json` holds **hand-reviewed rules** for 20 high-impact schemes (PM-KISAN, PMAY-G, Ujjwala, APY, PMJJBY, PMSBY, NSAP pensions, PMMVY, MGNREGA, and others). These replace the automatic rules. Add more as you verify them.

**Known gaps:** a few major schemes aren't in the dataset (for example Ayushman Bharat PM-JAY and e-Shram). Amounts and dates are from 2024. Every page tells users to confirm on the official site.

## Architecture

```
src/
  proxy.ts                    / → /hi or /en (cookie, then Accept-Language; Hindi default)
  lib/
    eligibility.ts            deterministic rules engine (the LLM never decides eligibility)
    schemes.ts                loads data/schemes.json, MiniSearch index, search
    synonyms.ts               Hindi/Hinglish → English query expansion + transliteration
    i18n.ts                   Hindi & English dictionaries
    relevance.ts              ordering of results (never changes eligibility)
    storage.ts                on-device stores: family profiles, saved schemes, document checklists, display prefs
    categories.ts, popular.ts, helplines.ts, rules-text.ts
  app/
    [lang]/                   home, chat, find (wizard), schemes, schemes/[slug], saved, help
    api/chat                  AI SDK agent: searchSchemes, getSchemeDetails, checkEligibility tools
    api/eligibility           POST profile → matching schemes
    api/stt                   optional server speech-to-text (Sarvam)
  components/
    voice.tsx                 mic (Web Speech API, MediaRecorder fallback) + read-aloud (speechSynthesis)
    chat-client.tsx, find-wizard.tsx, scheme-client.tsx, home-client.tsx, tab-bar.tsx, icons.tsx
public/sw.js                  offline cache: pages network-first, build assets cache-first
```

## Deploy

```bash
vercel link && vercel env add AI_GATEWAY_API_KEY && vercel deploy
```

`next.config.ts` bundles `data/schemes.json` with the server functions.
