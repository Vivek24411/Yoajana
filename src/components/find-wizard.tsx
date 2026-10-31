"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, inCategory } from "@/lib/categories";
import { formatINR, inWords } from "@/lib/format";
import { fmt, numeral, stateLabel, type Dictionary, type Locale } from "@/lib/i18n";
import {
  activeMember,
  addMember,
  memberLabel,
  RELATIONS,
  resetActiveProfile,
  setActiveDone,
  setActiveMember,
  updateActiveProfile,
  useFamily,
  type Relation,
} from "@/lib/storage";
import { CATEGORIES as SOCIAL, GENDERS, MARITAL, OCCUPATIONS, type Profile, type RuleField } from "@/lib/types";
import { localName, POPULAR } from "@/lib/popular";
import { Icon, type IconName } from "./icons";
import { SchemeCard } from "./scheme-card";

type Group = "eligible" | "maybe" | "general";
type Result = {
  slug: string;
  name: string;
  state: string | null;
  tags: string[];
  summary: string;
  group: Group;
  matched: RuleField[];
  unknown: RuleField[];
  reviewed: boolean;
};
type Response = { counts: Record<Group, number>; results: Result[] };

type StepId = "state" | "age" | "gender" | "category" | "area" | "occupation" | "income" | "disability" | "extra";
const STEPS: StepId[] = ["state", "age", "gender", "category", "area", "occupation", "income", "disability", "extra"];
const EXTRA_FIELDS = ["bpl", "incomeTaxPayer", "govtEmployee", "hasPuccaHouse", "minority", "pregnant"] as const;

/** Which question to reopen when a result says "still need to know X". */
const STEP_FOR: Partial<Record<RuleField, StepId>> = {
  state: "state", age: "age", gender: "gender", category: "category", area: "area",
  occupation: "occupation", income: "income", disability: "disability",
};

const OCCUPATION_ICONS: Record<(typeof OCCUPATIONS)[number], IconName> = {
  farmer: "wheat", unorganised_worker: "hardhat", construction_worker: "house", student: "cap", fisherman: "fish",
  artisan: "hammer", street_vendor: "store", entrepreneur: "briefcase", ex_serviceman: "shield", sports_person: "medal", other: "user",
};

const INCOME_PRESETS = [50000, 100000, 150000, 200000, 250000, 300000, 500000, 800000];

export function FindWizard({ lang, t, states }: { lang: Locale; t: Dictionary; states: { value: string; label: string }[] }) {
  const family = useFamily();
  const member = activeMember(family);
  const profile = member.profile;
  const [view, setView] = useState<"auto" | "wizard" | "results" | "who">("auto");
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const shown = view === "auto" ? (member.done ? "results" : "wizard") : view;

  const go = (to: number) => {
    setDir(to >= step ? "next" : "prev");
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = () => {
    setActiveDone(true);
    setView("results");
    window.scrollTo({ top: 0 });
  };
  const editAt = (id: StepId) => {
    setDir("next");
    setStep(STEPS.indexOf(id));
    setView("wizard");
    window.scrollTo({ top: 0 });
  };
  const switchTo = (id: string) => {
    setActiveMember(id);
    setStep(0);
    setView("auto");
  };

  return (
    <div className="flex flex-col gap-6">
      <MemberBar t={t} family={family} onPick={switchTo} onAdd={() => setView("who")} adding={shown === "who"} />
      {shown === "who" ? (
        <WhoPicker
          t={t}
          onPick={(r) => {
            addMember(r);
            setStep(0);
            setDir("next");
            setView("wizard");
          }}
          onCancel={() => setView("auto")}
        />
      ) : shown === "results" ? (
        <Results
          lang={lang}
          t={t}
          profile={profile}
          title={member.relation === "self" ? t.find.results : fmt(t.find.resultsFor, { who: memberLabel(member, family.members, t.relations) })}
          onEdit={editAt}
          onReset={() => {
            const question =
              member.relation === "self" ? t.find.confirmResetSelf : fmt(t.find.confirmReset, { who: memberLabel(member, family.members, t.relations) });
            if (!window.confirm(question)) return;
            resetActiveProfile();
            setStep(0);
            setView("wizard");
          }}
        />
      ) : (
        <Wizard lang={lang} t={t} states={states} profile={profile} step={step} dir={dir} go={go} finish={finish} />
      )}
    </div>
  );
}

/* ── Family member switcher ───────────────────────────────────── */

function MemberBar({
  t,
  family,
  onPick,
  onAdd,
  adding,
}: {
  t: Dictionary;
  family: ReturnType<typeof useFamily>;
  onPick: (id: string) => void;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <div className="enter -mx-4 flex items-center gap-3 border-b border-rule px-4">
      <span className="flex-none text-sm font-bold text-muted">{t.find.forWho}</span>
      <ul className="no-scrollbar flex flex-1 gap-5 overflow-x-auto">
        {family.members.map((m) => (
          <li key={m.id}>
            <button type="button" aria-pressed={m.id === family.active && !adding} onClick={() => onPick(m.id)} className="tab">
              {memberLabel(m, family.members, t.relations)}
            </button>
          </li>
        ))}
        <li>
          <button type="button" aria-pressed={adding} onClick={onAdd} className="tab inline-flex items-center gap-1 text-accent">
            <Icon name="plus" size={16} strokeWidth={2.5} />
            {t.find.addMember}
          </button>
        </li>
      </ul>
    </div>
  );
}

function WhoPicker({ t, onPick, onCancel }: { t: Dictionary; onPick: (r: Relation) => void; onCancel: () => void }) {
  return (
    <section className="step-next flex flex-col gap-4">
      <h1 className="font-display text-[2.1rem] leading-tight">{t.find.whoIsThis}</h1>
      <div className="grid grid-cols-2 gap-x-6 border-t border-rule">
        {RELATIONS.filter((r) => r !== "self").map((r) => (
          <button key={r} type="button" onClick={() => onPick(r)} className="choice pressable">
            <span className="flex-1">{t.relations[r]}</span>
            <Icon name="arrowRight" size={18} className="text-muted" />
          </button>
        ))}
      </div>
      <button type="button" onClick={onCancel} className="btn btn-line pressable self-start">
        <Icon name="arrowLeft" size={18} />
        {t.find.back}
      </button>
    </section>
  );
}

/* ── Questions ────────────────────────────────────────────────── */

function Wizard({
  lang,
  t,
  states,
  profile,
  step,
  dir,
  go,
  finish,
}: {
  lang: Locale;
  t: Dictionary;
  states: { value: string; label: string }[];
  profile: Profile;
  step: number;
  dir: "next" | "prev";
  go: (to: number) => void;
  finish: () => void;
}) {
  const f = t.find;
  const id = STEPS[step];
  const last = step === STEPS.length - 1;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), [step]);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    updateActiveProfile((p) => {
      const copy = { ...p, [key]: value };
      if (value === undefined) delete copy[key];
      return copy;
    });
  const next = () => (last ? finish() : go(step + 1));
  // Single-choice answers move on by themselves after a beat, so a tap is all it takes.
  const pickAndAdvance = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    set(key, value);
    clearTimeout(timer.current);
    if (value !== undefined) timer.current = setTimeout(next, 300);
  };
  const skip = () => {
    if (id !== "extra") set(id as keyof Profile, undefined);
    next();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="kicker">
            {f.step} {numeral(step + 1, lang, 1)} / {numeral(STEPS.length, lang, 1)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Icon name="shield" size={14} />
            {f.savedNote}
          </span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <button key={s} type="button" tabIndex={-1} onClick={() => go(i)} className="h-[5px] flex-1 bg-paper-2">
              <span
                className="block h-full origin-left bg-ink transition-transform duration-500 ease-[var(--ease-out)]"
                style={{ transform: `scaleX(${i <= step ? 1 : 0})`, transitionDelay: i === step ? "100ms" : "0ms", background: i === step ? "var(--accent)" : undefined }}
              />
            </button>
          ))}
        </div>
      </div>

      <fieldset key={id} className={`flex flex-col gap-4 ${dir === "next" ? "step-next" : "step-prev"}`}>
        <legend className="contents">
          <span className="block font-display text-[2.15rem] leading-[1.1] text-balance">{f.q[id]}</span>
        </legend>
        <p className="-mt-1 text-[0.98rem] leading-snug text-muted">{f.hints[id]}</p>

        {id === "state" && <StatePicker t={t} states={states} value={profile.state} onPick={(v) => pickAndAdvance("state", v)} />}

        {id === "age" && (
          <Stepper value={profile.age} min={0} max={120} unit={t.common.years} placeholder={f.agePlaceholder} onChange={(v) => set("age", v)} onEnter={next} />
        )}

        {id === "gender" && (
          <Choices options={GENDERS} labels={t.options.gender} value={profile.gender} onChange={(v) => pickAndAdvance("gender", v)} />
        )}

        {id === "category" && (
          <Choices options={SOCIAL} labels={t.options.category} value={profile.category} onChange={(v) => pickAndAdvance("category", v)} />
        )}

        {id === "area" && (
          <Choices
            options={["rural", "urban"] as const}
            labels={t.options.area}
            icons={{ rural: "village", urban: "city" }}
            value={profile.area}
            onChange={(v) => pickAndAdvance("area", v)}
          />
        )}

        {id === "occupation" && (
          <div className="grid grid-cols-1 border-t border-rule sm:grid-cols-2 sm:gap-x-6">
            {OCCUPATIONS.map((o) => {
              const on = profile.occupation?.includes(o) ?? false;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const list = on ? profile.occupation?.filter((x) => x !== o) : [...(profile.occupation ?? []), o];
                    set("occupation", list?.length ? list : undefined);
                  }}
                  className="choice"
                >
                  <span className="box">{on && <Icon name="check" size={15} strokeWidth={3} className="check-draw" />}</span>
                  <span className="flex-1">{t.options.occupation[o]}</span>
                  <Icon name={OCCUPATION_ICONS[o]} size={22} className={on ? "text-accent" : "text-muted"} />
                </button>
              );
            })}
          </div>
        )}

        {id === "income" && <IncomeInput lang={lang} t={t} value={profile.income} onChange={(v) => set("income", v)} onEnter={next} />}

        {id === "disability" && (
          <>
            <div className="border-t border-rule">
              <button type="button" aria-pressed={profile.disability === 0} className="choice" onClick={() => pickAndAdvance("disability", 0)}>
                <span className="radio" />
                {f.no}
              </button>
              <button type="button" aria-pressed={(profile.disability ?? 0) > 0} className="choice" onClick={() => set("disability", profile.disability || 40)}>
                <span className="radio" />
                {f.yes}
              </button>
            </div>
            {(profile.disability ?? 0) > 0 && (
              <div className="enter flex flex-col gap-2 pt-2">
                <span className="text-muted">{f.disabilityPercent}</span>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={profile.disability}
                    onChange={(e) => set("disability", Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer accent-[var(--accent)]"
                    aria-label={f.disabilityPercent}
                  />
                  <span className="w-20 text-right font-display text-4xl tabular-nums">{profile.disability}%</span>
                </div>
              </div>
            )}
          </>
        )}

        {id === "extra" && (
          <div className="flex flex-col border-t border-rule">
            {EXTRA_FIELDS.filter((k) => k !== "pregnant" || profile.gender === "female").map((k) => (
              <div key={k} className="flex flex-col gap-2.5 border-b border-rule py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold leading-snug">{t.options.extra[k]}</span>
                <YesNo t={t} value={profile[k]} onChange={(v) => set(k, v)} />
              </div>
            ))}
            <div className="flex flex-col gap-2.5 py-4">
              <span className="font-semibold">{t.options.extra.maritalStatus}</span>
              <div className="flex flex-wrap gap-2">
                {MARITAL.map((m) => {
                  const on = profile.maritalStatus === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("maritalStatus", on ? undefined : m)}
                      className={`pressable h-11 rounded-md border-[1.5px] border-ink px-4 text-[0.95rem] font-bold ${on ? "bg-ink text-paper" : ""}`}
                    >
                      {t.options.maritalStatus[m]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex items-center gap-2 border-t-2 border-ink bg-paper/95 px-4 py-3 backdrop-blur-md sm:bottom-0">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => go(step - 1)}
          aria-label={f.back}
          className="pressable grid size-13 flex-none place-items-center rounded-md border-[1.5px] border-ink disabled:opacity-25"
        >
          <Icon name="arrowLeft" size={22} />
        </button>
        {!last && (
          <button type="button" onClick={skip} className="pressable px-3 py-3 text-[0.95rem] font-bold text-muted underline decoration-rule decoration-2 underline-offset-4">
            {f.skip}
          </button>
        )}
        <button type="button" onClick={next} className="btn btn-ink pressable ml-auto h-13 px-6 text-[1.05rem]">
          {last ? f.seeResults : f.next}
          <Icon name={last ? "check" : "arrowRight"} size={20} />
        </button>
      </div>
    </div>
  );
}

function Choices<T extends string>({
  options,
  labels,
  icons,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  icons?: Record<T, IconName>;
  value?: T;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="border-t border-rule">
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? undefined : o)} className="choice">
            <span className="radio" />
            <span className="flex-1 text-[1.08rem]">{labels[o]}</span>
            {icons && <Icon name={icons[o]} size={26} className={on ? "text-accent" : "text-muted"} />}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ t, value, onChange }: { t: Dictionary; value?: boolean; onChange: (v: boolean | undefined) => void }) {
  return (
    <div className="flex flex-none gap-2">
      {[true, false].map((v) => {
        const on = value === v;
        return (
          <button
            key={String(v)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? undefined : v)}
            className={`pressable h-11 min-w-20 rounded-md border-[1.5px] border-ink px-4 font-bold ${on ? "bg-ink text-paper" : ""}`}
          >
            {v ? t.find.yes : t.find.no}
          </button>
        );
      })}
    </div>
  );
}

function StatePicker({
  t,
  states,
  value,
  onPick,
}: {
  t: Dictionary;
  states: { value: string; label: string }[];
  value?: string;
  onPick: (v: string | undefined) => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? states.filter((s) => `${s.label} ${s.value}`.toLowerCase().includes(needle)) : states;
  }, [q, states]);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Icon name="search" size={20} className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.find.searchState} aria-label={t.find.searchState} className="field pl-9" />
      </div>
      <div className="grid grid-cols-2 gap-x-5">
        {list.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={value === s.value}
            onClick={() => onPick(value === s.value ? undefined : s.value)}
            className="choice min-h-13 gap-2.5 py-2 text-[0.98rem] leading-tight"
          >
            <span className="radio size-5" />
            <span className="flex-1">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  unit,
  placeholder,
  onChange,
  onEnter,
}: {
  value?: number;
  min: number;
  max: number;
  unit: string;
  placeholder: string;
  onChange: (v: number | undefined) => void;
  onEnter: () => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex items-center gap-3 border-y-2 border-ink py-4">
      <button
        type="button"
        aria-label="−"
        onClick={() => onChange(clamp((value ?? 30) - 1))}
        className="pressable grid size-14 flex-none place-items-center rounded-md border-[1.5px] border-ink"
      >
        <Icon name="minus" size={24} />
      </button>
      <label className="flex flex-1 items-baseline justify-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "");
            onChange(digits ? clamp(Number(digits)) : undefined);
          }}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          className="w-28 bg-transparent text-center font-display text-6xl tabular-nums outline-none placeholder:font-sans placeholder:text-xl placeholder:text-muted/60"
        />
        <span className="font-bold text-muted">{unit}</span>
      </label>
      <button
        type="button"
        aria-label="+"
        onClick={() => onChange(clamp((value ?? 29) + 1))}
        className="pressable grid size-14 flex-none place-items-center rounded-md border-[1.5px] border-ink"
      >
        <Icon name="plus" size={24} />
      </button>
    </div>
  );
}

function IncomeInput({
  lang,
  t,
  value,
  onChange,
  onEnter,
}: {
  lang: Locale;
  t: Dictionary;
  value?: number;
  onChange: (v: number | undefined) => void;
  onEnter: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="flex items-baseline gap-2 border-b-2 border-ink pb-1 focus-within:border-accent">
          <span className="font-display text-4xl text-muted">₹</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value !== undefined ? value.toLocaleString("en-IN") : ""}
            placeholder={t.find.incomePlaceholder}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              onChange(digits ? Math.min(Number(digits), 100000000) : undefined);
            }}
            onKeyDown={(e) => e.key === "Enter" && onEnter()}
            className="min-w-0 flex-1 bg-transparent font-display text-5xl tabular-nums outline-none placeholder:font-sans placeholder:text-xl placeholder:text-muted/60"
          />
        </label>
        <p className="mt-1.5 h-6 font-bold text-accent" aria-live="polite">
          {value ? `${inWords(value, lang)} · ${t.find.perYear}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-4 border-l border-t border-ink">
        {INCOME_PRESETS.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(n)}
              className={`pressable h-12 border-b border-r border-ink text-[0.92rem] font-bold ${on ? "bg-ink text-paper" : "hover:bg-paper-2"}`}
            >
              {n >= 100000 ? inWords(n, lang) : formatINR(n)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Results ──────────────────────────────────────────────────── */

function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : ms;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

function Results({
  lang,
  t,
  profile,
  title,
  onEdit,
  onReset,
}: {
  lang: Locale;
  t: Dictionary;
  profile: Profile;
  title: string;
  onEdit: (id: StepId) => void;
  onReset: () => void;
}) {
  const f = t.find;
  const key = JSON.stringify(profile);
  const [state, setState] = useState<{ key: string; data?: Response; failed?: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<Group>("eligible");
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [shownCount, setShownCount] = useState(20);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/eligibility", { method: "POST", headers: { "content-type": "application/json" }, body: key, signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Response>;
      })
      .then((data) => setState({ key, data }))
      .catch((e: Error) => e.name !== "AbortError" && setState({ key, failed: true }));
    return () => ctrl.abort();
  }, [key, attempt]);

  const data = state?.key === key ? state.data : undefined;
  const failed = state?.key === key && state.failed;
  const eligibleCount = useCountUp(data?.counts.eligible ?? 0);

  const inTab = useMemo(() => (data?.results ?? []).filter((r) => r.group === tab), [data, tab]);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return inTab.filter(
      (r) =>
        (!cat || inCategory(r.tags, cat as (typeof CATEGORIES)[number]["id"])) &&
        (!q || `${r.name} ${r.tags.join(" ")} ${r.summary}`.toLowerCase().includes(q)),
    );
  }, [inTab, filter, cat]);
  const cats = useMemo(() => CATEGORIES.filter((c) => inTab.some((r) => inCategory(r.tags, c.id))), [inTab]);

  // In "maybe", the answers that would settle the most schemes.
  const missing = useMemo(() => {
    const count = new Map<RuleField, number>();
    for (const r of data?.results ?? []) if (r.group === "maybe") for (const u of r.unknown) count.set(u, (count.get(u) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([field]) => field);
  }, [data]);

  function share() {
    const top = (data?.results ?? []).filter((r) => r.group === "eligible").slice(0, 10);
    const text = [f.shareIntro, ...top.map((r, i) => `${i + 1}. ${r.name}`), "", `${window.location.origin}/${lang}/find`].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const answerChips = [
    profile.state && { id: "state" as const, label: stateLabel(profile.state, lang) },
    profile.age !== undefined && { id: "age" as const, label: `${profile.age} ${t.common.years}` },
    profile.gender && { id: "gender" as const, label: t.options.gender[profile.gender] },
    profile.category && { id: "category" as const, label: t.options.category[profile.category] },
    profile.area && { id: "area" as const, label: t.options.area[profile.area] },
    profile.occupation?.length && { id: "occupation" as const, label: profile.occupation.map((o) => t.options.occupation[o]).join(", ") },
    profile.income !== undefined && { id: "income" as const, label: `₹${inWords(profile.income, lang)}` },
  ].filter(Boolean) as { id: StepId; label: string }[];

  return (
    <div className="flex flex-col gap-6">
      <section className="enter flex flex-col">
        <p className="kicker">{title}</p>
        {data ? (
          <div className="mt-2 flex items-end gap-4">
            <span className="font-display text-[5.5rem] leading-[0.8] tabular-nums">{eligibleCount}</span>
            <span className="min-w-0 flex-1 pb-1 text-lg font-bold leading-tight">{f.eligibleHero}</span>
            {data.counts.eligible > 0 && <span className="stamp stamp-in mb-3">{t.stamp.eligible}</span>}
          </div>
        ) : failed ? null : (
          <div className="mt-3 flex items-center gap-3 text-muted">
            <Icon name="refresh" size={24} className="spin text-accent" />
            <span className="font-bold">{f.loading}</span>
          </div>
        )}
        {data && data.counts.maybe > 0 && <p className="mt-2 text-muted">{fmt(f.maybeHero, { n: data.counts.maybe })}</p>}
        {answerChips.length > 0 && (
          <p className="mt-4 border-t border-rule pt-3 text-[0.95rem] leading-loose">
            {answerChips.map((c, i) => (
              <span key={c.id}>
                {i > 0 && <span className="mx-1.5 text-rule">/</span>}
                <button type="button" onClick={() => onEdit(c.id)} className="font-semibold underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent">
                  {c.label}
                </button>
              </span>
            ))}
            <button type="button" onClick={() => onEdit("state")} aria-label={f.edit} className="ml-2 inline-flex translate-y-0.5 text-accent">
              <Icon name="pencil" size={16} />
            </button>
          </p>
        )}
      </section>

      {failed && (
        <div className="notice flex flex-col items-start gap-3">
          <p className="font-bold text-accent">{t.chat.error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-ink pressable">
            <Icon name="refresh" size={18} />
            {t.chat.retry}
          </button>
        </div>
      )}

      {data && (
        <>
          <div role="tablist" className="enter grid grid-cols-3 border-y-2 border-ink" style={{ "--i": 1 } as React.CSSProperties}>
            {(["eligible", "maybe", "general"] as const).map((g) => {
              const on = tab === g;
              return (
                <button
                  key={g}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => {
                    setTab(g);
                    setCat(null);
                    setShownCount(20);
                  }}
                  className={`pressable flex flex-col items-center border-r border-ink py-2.5 leading-tight last:border-r-0 ${on ? "bg-ink text-paper" : ""}`}
                >
                  <span className="font-display text-2xl tabular-nums">{data.counts[g]}</span>
                  <span className="text-[0.9rem] font-bold">{f.tabs[g]}</span>
                </button>
              );
            })}
          </div>

          <p key={tab} className="fade-in -mt-3 text-[0.95rem] text-muted">{f.tabHints[tab]}</p>

          {tab === "maybe" && missing.length > 0 && (
            <div className="border-l-4 border-ochre pl-4">
              <p className="font-bold">{f.needInfo}:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missing.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onEdit(STEP_FOR[m] ?? "extra")}
                    className="pressable inline-flex h-10 items-center gap-1.5 rounded-md border-[1.5px] border-ink px-3 text-[0.92rem] font-bold hover:bg-ink hover:text-paper"
                  >
                    {t.fields[m]}
                    <Icon name="arrowRight" size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {inTab.length > 8 && (
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Icon name="search" size={20} className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-muted" />
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={f.filter} aria-label={f.filter} className="field pl-9" />
              </div>
              {cats.length > 1 && (
                <ul className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto border-b border-rule px-4">
                  <li>
                    <button type="button" aria-pressed={!cat} onClick={() => setCat(null)} className="tab">
                      {f.allTopics}
                    </button>
                  </li>
                  {cats.map((c) => (
                    <li key={c.id}>
                      <button type="button" aria-pressed={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className="tab">
                        {c.label[lang]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-6 text-muted">{f.noneFound}</p>
          ) : (
            <ul key={`${tab}-${cat}`} className="-mt-2">
              {filtered.slice(0, shownCount).map((r, i) => (
                <SchemeCard
                  key={r.slug}
                  index={i % 20}
                  href={`/${lang}/schemes/${r.slug}`}
                  slug={r.slug}
                  name={r.name}
                  localName={localName(r.slug, lang)}
                  state={r.state}
                  place={r.state ? stateLabel(r.state, lang) : t.scheme.central}
                  summary={POPULAR[r.slug]?.[lang].line ?? r.summary}
                  reviewed={r.reviewed}
                  reviewedLabel={t.scheme.reviewed}
                  saveLabels={{ save: t.scheme.save, saved: t.scheme.saved }}
                >
                  {(r.matched.some((m) => m !== "state") || r.unknown.length > 0) && (
                    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.82rem] font-bold">
                      {r.matched
                        .filter((m) => m !== "state")
                        .map((m) => (
                          <span key={m} className="inline-flex items-center gap-1 text-stamp">
                            <Icon name="check" size={13} strokeWidth={3} />
                            {t.fields[m]}
                          </span>
                        ))}
                      {r.unknown.map((m) => (
                        <span key={m} className="text-ochre">
                          ? {t.fields[m]}
                        </span>
                      ))}
                    </span>
                  )}
                </SchemeCard>
              ))}
            </ul>
          )}

          {filtered.length > shownCount && (
            <button type="button" onClick={() => setShownCount((s) => s + 30)} className="btn btn-line pressable w-full">
              {f.showMore} ({filtered.length - shownCount})
              <Icon name="chevronDown" size={18} />
            </button>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            {data.counts.eligible > 0 && (
              <button type="button" onClick={share} className="btn btn-accent pressable flex-1">
                <Icon name="share" size={19} />
                {f.share}
              </button>
            )}
            <button type="button" onClick={() => onEdit("state")} className="btn btn-line pressable flex-1">
              <Icon name="pencil" size={18} />
              {f.edit}
            </button>
            <button type="button" onClick={onReset} className="btn pressable text-muted">
              <Icon name="trash" size={18} />
              {f.startOver}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
