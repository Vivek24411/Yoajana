"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, inCategory } from "@/lib/categories";
import { formatINR, inWords } from "@/lib/format";
import { fmt, stateLabel, type Dictionary, type Locale } from "@/lib/i18n";
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
    <div className="flex flex-col gap-5">
      <MemberBar
        t={t}
        family={family}
        onPick={switchTo}
        onAdd={() => setView("who")}
        adding={shown === "who"}
      />
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
          who={memberLabel(member, family.members, t.relations)}
          onEdit={editAt}
          onReset={() => {
            if (!window.confirm(fmt(t.find.confirmReset, { who: memberLabel(member, family.members, t.relations) }))) return;
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
    <div className="enter -mx-4">
      <p className="eyebrow mb-2 px-4">{t.find.forWho}</p>
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        {family.members.map((m) => {
          const on = m.id === family.active && !adding;
          return (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(m.id)}
                className={`pressable chip h-11 whitespace-nowrap border px-4 text-[0.95rem] ${
                  on ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"
                }`}
              >
                <Icon name="user" size={17} />
                {memberLabel(m, family.members, t.relations)}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-pressed={adding}
            onClick={onAdd}
            className={`pressable chip h-11 whitespace-nowrap border border-dashed px-4 text-[0.95rem] ${
              adding ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-muted"
            }`}
          >
            <Icon name="userPlus" size={17} />
            {t.find.addMember}
          </button>
        </li>
      </ul>
    </div>
  );
}

const RELATION_ICONS: Record<Relation, IconName> = {
  self: "user", mother: "user", father: "user", wife: "user", husband: "user", son: "user", daughter: "user", grandparent: "elder", other: "users",
};

function WhoPicker({ t, onPick, onCancel }: { t: Dictionary; onPick: (r: Relation) => void; onCancel: () => void }) {
  return (
    <section className="step-next flex flex-col gap-4">
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight">{t.find.whoIsThis}</h1>
      <div className="grid grid-cols-2 gap-2.5">
        {RELATIONS.filter((r) => r !== "self").map((r, i) => (
          <button key={r} type="button" onClick={() => onPick(r)} className="option pressable enter" style={{ "--i": i } as React.CSSProperties}>
            <span className="option-icon">
              <Icon name={RELATION_ICONS[r]} size={22} />
            </span>
            {t.relations[r]}
          </button>
        ))}
      </div>
      <button type="button" onClick={onCancel} className="btn btn-ghost pressable self-start">
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
    if (value !== undefined) timer.current = setTimeout(next, 280);
  };
  const skip = () => {
    if (id !== "extra") set(id as keyof Profile, undefined);
    next();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm font-semibold text-muted">
          <span>
            {f.step} <b className="text-text tabular-nums">{step + 1}</b> {f.of} {STEPS.length}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="shield" size={15} />
            {f.savedNote}
          </span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }} aria-hidden>
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              tabIndex={-1}
              onClick={() => go(i)}
              className="h-1.5 overflow-hidden rounded-full bg-border"
            >
              <span
                className="block h-full rounded-full bg-brand transition-transform duration-500 ease-[var(--ease-out)]"
                style={{ transform: `scaleX(${i <= step ? 1 : 0})`, transformOrigin: "left", transitionDelay: i === step ? "120ms" : "0ms" }}
              />
            </button>
          ))}
        </div>
      </div>

      <fieldset key={id} className={`flex flex-col gap-4 ${dir === "next" ? "step-next" : "step-prev"}`}>
        <legend className="contents">
          <span className="block font-display text-[1.85rem] font-semibold leading-tight text-balance">{f.q[id]}</span>
        </legend>
        <p className="-mt-2 flex items-start gap-2 text-[0.98rem] text-muted">
          <Icon name="info" size={18} className="mt-1 flex-none" />
          {f.hints[id]}
        </p>

        {id === "state" && <StatePicker t={t} states={states} value={profile.state} onPick={(v) => pickAndAdvance("state", v)} />}

        {id === "age" && (
          <Stepper value={profile.age} min={0} max={120} step={1} unit={t.common.years} placeholder={f.agePlaceholder} onChange={(v) => set("age", v)} onEnter={next} />
        )}

        {id === "gender" && (
          <Choices
            options={GENDERS}
            labels={t.options.gender}
            icons={{ male: "user", female: "user", transgender: "users" }}
            value={profile.gender}
            onChange={(v) => pickAndAdvance("gender", v)}
          />
        )}

        {id === "category" && (
          <Choices
            options={SOCIAL}
            labels={t.options.category}
            badges={{ GEN: "GEN", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS" }}
            value={profile.category}
            onChange={(v) => pickAndAdvance("category", v)}
          />
        )}

        {id === "area" && (
          <Choices
            options={["rural", "urban"] as const}
            labels={t.options.area}
            icons={{ rural: "village", urban: "city" }}
            value={profile.area}
            onChange={(v) => pickAndAdvance("area", v)}
            big
          />
        )}

        {id === "occupation" && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {OCCUPATIONS.map((o, i) => {
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
                  className="option pressable enter"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="option-icon">
                    <Icon name={OCCUPATION_ICONS[o]} size={22} />
                  </span>
                  <span className="flex-1">{t.options.occupation[o]}</span>
                  <Tick on={on} square />
                </button>
              );
            })}
          </div>
        )}

        {id === "income" && <IncomeInput lang={lang} t={t} value={profile.income} onChange={(v) => set("income", v)} onEnter={next} />}

        {id === "disability" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" aria-pressed={profile.disability === 0} className="option pressable justify-center" onClick={() => pickAndAdvance("disability", 0)}>
                {f.no}
              </button>
              <button
                type="button"
                aria-pressed={(profile.disability ?? 0) > 0}
                className="option pressable justify-center"
                onClick={() => set("disability", profile.disability || 40)}
              >
                {f.yes}
              </button>
            </div>
            {(profile.disability ?? 0) > 0 && (
              <div className="card enter flex flex-col gap-3 p-4">
                <span className="text-muted">{f.disabilityPercent}</span>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={profile.disability}
                    onChange={(e) => set("disability", Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer accent-[var(--brand)]"
                    aria-label={f.disabilityPercent}
                  />
                  <span className="w-16 text-right font-display text-3xl font-semibold tabular-nums text-brand">{profile.disability}%</span>
                </div>
              </div>
            )}
          </>
        )}

        {id === "extra" && (
          <div className="flex flex-col gap-2.5">
            {EXTRA_FIELDS.filter((k) => k !== "pregnant" || profile.gender === "female").map((k, i) => (
              <div key={k} className="card enter flex flex-col gap-3 p-4" style={{ "--i": i } as React.CSSProperties}>
                <span className="font-semibold leading-snug">{t.options.extra[k]}</span>
                <YesNo t={t} value={profile[k]} onChange={(v) => set(k, v)} />
              </div>
            ))}
            <div className="card enter flex flex-col gap-3 p-4" style={{ "--i": 6 } as React.CSSProperties}>
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
                      className={`pressable chip h-11 border px-4 text-[0.95rem] ${on ? "border-brand bg-brand text-brand-ink" : "border-border-strong"}`}
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

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 flex items-center gap-2 border-t border-border/70 bg-bg/90 px-4 py-3 backdrop-blur-xl sm:bottom-0">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => go(step - 1)}
          aria-label={f.back}
          className="pressable grid size-14 flex-none place-items-center rounded-full border-[1.5px] border-border-strong disabled:opacity-30"
        >
          <Icon name="arrowLeft" size={22} />
        </button>
        {!last && (
          <button type="button" onClick={skip} className="pressable rounded-full px-3 py-3 text-[0.95rem] font-semibold text-muted">
            {f.skip}
          </button>
        )}
        <button type="button" onClick={next} className="btn btn-primary pressable ml-auto h-14 px-6 text-[1.05rem]">
          {last ? f.seeResults : f.next}
          <Icon name={last ? "check" : "arrowRight"} size={20} />
        </button>
      </div>
    </div>
  );
}

function Tick({ on, square = false }: { on: boolean; square?: boolean }) {
  return (
    <span
      className={`grid size-6 flex-none place-items-center border-2 transition-colors duration-200 ${square ? "rounded-md" : "rounded-full"} ${
        on ? "border-brand bg-brand text-brand-ink" : "border-border-strong"
      }`}
    >
      {on && <Icon name="check" size={14} strokeWidth={3} className="check-draw" />}
    </span>
  );
}

function Choices<T extends string>({
  options,
  labels,
  icons,
  badges,
  value,
  onChange,
  big = false,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  icons?: Record<T, IconName>;
  badges?: Record<T, string>;
  value?: T;
  onChange: (v: T | undefined) => void;
  big?: boolean;
}) {
  return (
    <div className={`grid gap-2.5 ${big ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
      {options.map((o, i) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? undefined : o)}
            className={`option pressable enter ${big ? "min-h-36 flex-col justify-center text-center" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            {icons && (
              <span className={`option-icon ${big ? "size-16 rounded-2xl" : ""}`}>
                <Icon name={icons[o]} size={big ? 34 : 22} />
              </span>
            )}
            {badges && <span className="option-icon text-[0.8rem] font-bold">{badges[o]}</span>}
            <span className={big ? "" : "flex-1"}>{labels[o]}</span>
            {!big && <Tick on={on} />}
          </button>
        );
      })}
    </div>
  );
}

function YesNo({ t, value, onChange }: { t: Dictionary; value?: boolean; onChange: (v: boolean | undefined) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2 p-1.5">
      {[true, false].map((v) => {
        const on = value === v;
        return (
          <button
            key={String(v)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? undefined : v)}
            className={`pressable h-11 rounded-xl font-semibold ${on ? "bg-surface text-brand shadow-sm ring-1 ring-brand" : "text-muted"}`}
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
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.find.searchState} aria-label={t.find.searchState} className="field rounded-full pl-12" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {list.map((s) => {
          const on = value === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? undefined : s.value)}
              className="option pressable min-h-14 px-3.5 py-2.5 text-[0.98rem] leading-tight"
            >
              <span className="flex-1">{s.label}</span>
              {on && <Tick on />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  step,
  unit,
  placeholder,
  onChange,
  onEnter,
}: {
  value?: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  placeholder: string;
  onChange: (v: number | undefined) => void;
  onEnter: () => void;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="card flex items-center gap-3 p-3">
      <button
        type="button"
        aria-label="−"
        onClick={() => onChange(clamp((value ?? 30) - step))}
        className="pressable grid size-14 flex-none place-items-center rounded-2xl bg-surface-2"
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
          className="w-24 bg-transparent text-center font-display text-5xl font-semibold tabular-nums outline-none placeholder:text-2xl placeholder:text-muted/60"
        />
        <span className="text-muted">{unit}</span>
      </label>
      <button
        type="button"
        aria-label="+"
        onClick={() => onChange(clamp((value ?? 29) + step))}
        className="pressable grid size-14 flex-none place-items-center rounded-2xl bg-surface-2"
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
    <div className="flex flex-col gap-3">
      <div className="card flex flex-col gap-1 p-4">
        <label className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold text-muted">₹</span>
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
            className="min-w-0 flex-1 bg-transparent font-display text-4xl font-semibold tabular-nums outline-none placeholder:text-xl placeholder:text-muted/60"
          />
        </label>
        <p className="h-6 text-[0.95rem] font-semibold text-brand" aria-live="polite">
          {value ? `${inWords(value, lang)} · ${t.find.perYear}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {INCOME_PRESETS.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(n)}
              className={`pressable h-12 rounded-xl border text-[0.92rem] font-semibold ${on ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"}`}
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
  who,
  onEdit,
  onReset,
}: {
  lang: Locale;
  t: Dictionary;
  profile: Profile;
  who: string;
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
    <div className="flex flex-col gap-5">
      <section className="enter relative overflow-hidden rounded-[1.5rem] bg-hero p-5 text-hero-ink">
        <div aria-hidden className="absolute -right-10 -top-10 size-44 rounded-full bg-accent/20 blur-3xl" />
        <p className="relative font-semibold text-hero-ink/80">{fmt(f.resultsFor, { who })}</p>
        {data ? (
          <div className="relative mt-1 flex items-end gap-3">
            <span className="font-display text-[4.5rem] font-semibold leading-none tabular-nums text-accent">{eligibleCount}</span>
            <span className="pb-2 text-lg font-semibold leading-tight">{f.eligibleHero}</span>
          </div>
        ) : failed ? null : (
          <div className="relative mt-3 flex items-center gap-3">
            <Icon name="refresh" size={28} className="spin text-accent" />
            <span className="font-semibold">{f.loading}</span>
          </div>
        )}
        {data && data.counts.maybe > 0 && <p className="relative mt-1 text-hero-ink/75">{fmt(f.maybeHero, { n: data.counts.maybe })}</p>}
        {answerChips.length > 0 && (
          <ul className="relative mt-4 flex flex-wrap gap-1.5">
            {answerChips.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onEdit(c.id)}
                  className="pressable chip max-w-[16rem] bg-hero-ink/10 py-1.5 text-hero-ink hover:bg-hero-ink/20"
                >
                  <span className="truncate">{c.label}</span>
                  <Icon name="pencil" size={13} className="flex-none opacity-70" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {failed && (
        <div className="card flex flex-col items-start gap-3 border-danger/40 bg-danger-soft p-5">
          <p className="font-semibold text-danger">{t.chat.error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-ghost pressable min-h-11 bg-surface text-base">
            <Icon name="refresh" size={18} />
            {t.chat.retry}
          </button>
        </div>
      )}

      {data && (
        <>
          <div role="tablist" className="enter grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1.5" style={{ "--i": 1 } as React.CSSProperties}>
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
                  className={`pressable flex flex-col items-center rounded-xl py-2 text-[0.92rem] font-semibold leading-tight ${
                    on ? "bg-surface text-text shadow-sm" : "text-muted"
                  }`}
                >
                  <span className={`font-display text-xl tabular-nums ${on ? (g === "eligible" ? "text-green" : g === "maybe" ? "text-amber" : "text-text") : ""}`}>
                    {data.counts[g]}
                  </span>
                  {f.tabs[g]}
                </button>
              );
            })}
          </div>

          <p key={tab} className="fade-in -mt-2 text-[0.95rem] text-muted">{f.tabHints[tab]}</p>

          {tab === "maybe" && missing.length > 0 && (
            <div className="card flex flex-col gap-2.5 border-amber/40 bg-amber-soft p-4">
              <p className="font-semibold">{f.needInfo}:</p>
              <div className="flex flex-wrap gap-2">
                {missing.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onEdit(STEP_FOR[m] ?? "extra")}
                    className="pressable chip h-10 border border-amber/50 bg-surface px-3.5 text-[0.92rem]"
                  >
                    {t.fields[m]}
                    <Icon name="arrowRight" size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {inTab.length > 8 && (
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={f.filter} aria-label={f.filter} className="field rounded-full pl-12" />
              </div>
              {cats.length > 1 && (
                <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  <li>
                    <button
                      type="button"
                      aria-pressed={!cat}
                      onClick={() => setCat(null)}
                      className={`pressable chip h-10 whitespace-nowrap border px-4 text-[0.9rem] ${!cat ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"}`}
                    >
                      {f.allTopics}
                    </button>
                  </li>
                  {cats.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={cat === c.id}
                        onClick={() => setCat(cat === c.id ? null : c.id)}
                        className={`pressable chip h-10 whitespace-nowrap border px-3.5 text-[0.9rem] ${
                          cat === c.id ? "border-brand bg-brand text-brand-ink" : "border-border-strong bg-surface"
                        }`}
                      >
                        <Icon name={c.icon} size={16} />
                        {c.label[lang]}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="card p-6 text-center text-muted">{f.noneFound}</p>
          ) : (
            <ul key={`${tab}-${cat}`} className="flex flex-col gap-3">
              {filtered.slice(0, shownCount).map((r, i) => (
                <SchemeCard
                  key={r.slug}
                  index={i % 20}
                  href={`/${lang}/schemes/${r.slug}`}
                  slug={r.slug}
                  name={r.name}
                  state={r.state}
                  place={r.state ? stateLabel(r.state, lang) : t.scheme.central}
                  summary={r.summary}
                  tags={r.tags}
                  reviewed={r.reviewed}
                  reviewedLabel={t.scheme.reviewed}
                  saveLabels={{ save: t.scheme.save, saved: t.scheme.saved }}
                >
                  {(r.matched.some((m) => m !== "state") || r.unknown.length > 0) && (
                    <span className="mt-2.5 flex flex-wrap gap-1.5">
                      {r.matched
                        .filter((m) => m !== "state")
                        .map((m) => (
                          <span key={m} className="chip bg-green-soft text-green">
                            <Icon name="check" size={13} strokeWidth={2.75} />
                            {t.fields[m]}
                          </span>
                        ))}
                      {r.unknown.map((m) => (
                        <span key={m} className="chip border border-dashed border-amber/60 text-amber">
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
            <button type="button" onClick={() => setShownCount((s) => s + 30)} className="btn btn-ghost pressable w-full">
              {f.showMore} ({filtered.length - shownCount})
              <Icon name="chevronDown" size={18} />
            </button>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            {data.counts.eligible > 0 && (
              <button type="button" onClick={share} className="btn btn-primary pressable flex-1">
                <Icon name="share" size={19} />
                {f.share}
              </button>
            )}
            <button type="button" onClick={() => onEdit("state")} className="btn btn-ghost pressable flex-1">
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
