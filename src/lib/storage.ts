"use client";

import { useSyncExternalStore } from "react";
import type { Profile } from "./types";

/**
 * Tiny localStorage-backed stores. Everything stays on the phone: no account, no server copy.
 * Falls back to memory when storage is blocked (private mode), so the app still works for the visit.
 */
function createStore<T>(key: string, fallback: T, migrate?: () => T | null) {
  const listeners = new Set<() => void>();
  let raw: string | null | undefined;
  let value: T = fallback;
  let memoryOnly = false;

  const read = (): T => {
    if (memoryOnly) return value;
    let next: string | null = null;
    try {
      next = localStorage.getItem(key);
      if (next === null && migrate && raw === undefined) {
        const migrated = migrate();
        if (migrated) {
          next = JSON.stringify(migrated);
          localStorage.setItem(key, next);
        }
      }
    } catch {
      return value;
    }
    if (next !== raw) {
      raw = next;
      try {
        value = next ? (JSON.parse(next) as T) : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  };

  const write = (update: T | ((prev: T) => T)) => {
    const next = typeof update === "function" ? (update as (p: T) => T)(read()) : update;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      memoryOnly = true;
      value = next;
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return {
    get: read,
    set: write,
    use: () => useSyncExternalStore(subscribe, read, () => fallback),
  };
}

/* ── Family profiles ─────────────────────────────────────────── */

export const RELATIONS = ["self", "mother", "father", "wife", "husband", "son", "daughter", "grandparent", "other"] as const;
export type Relation = (typeof RELATIONS)[number];
/** done: the person reached the end of the questions at least once, so open on results next time. */
export type Member = { id: string; relation: Relation; profile: Profile; done?: boolean };
type Family = { active: string; members: Member[] };

const EMPTY_FAMILY: Family = { active: "self", members: [{ id: "self", relation: "self", profile: {} }] };

export const familyStore = createStore<Family>("yojana-family-v1", EMPTY_FAMILY, () => {
  // v1 kept a single profile; carry it over as "self".
  const old = localStorage.getItem("yojana-profile-v1");
  if (!old) return null;
  try {
    return { active: "self", members: [{ id: "self", relation: "self", profile: JSON.parse(old) as Profile, done: true }] };
  } catch {
    return null;
  }
});

export const useFamily = familyStore.use;

export function activeMember(f: Family): Member {
  return f.members.find((m) => m.id === f.active) ?? f.members[0] ?? EMPTY_FAMILY.members[0];
}

export function updateActiveProfile(update: (p: Profile) => Profile) {
  familyStore.set((f) => ({
    ...f,
    members: f.members.map((m) => (m.id === f.active ? { ...m, profile: update(m.profile) } : m)),
  }));
}

export function setActiveDone(done: boolean) {
  familyStore.set((f) => ({ ...f, members: f.members.map((m) => (m.id === f.active ? { ...m, done } : m)) }));
}

export function resetActiveProfile() {
  familyStore.set((f) => ({
    ...f,
    members: f.members.map((m) => (m.id === f.active ? { ...m, profile: {}, done: false } : m)),
  }));
}

export function addMember(relation: Relation) {
  const id = `${relation}-${Date.now().toString(36)}`;
  familyStore.set((f) => ({ active: id, members: [...f.members, { id, relation, profile: {} }] }));
  return id;
}

export function setActiveMember(id: string) {
  familyStore.set((f) => ({ ...f, active: id }));
}

export function removeMember(id: string) {
  familyStore.set((f) => {
    const members = f.members.filter((m) => m.id !== id);
    if (!members.length) return EMPTY_FAMILY;
    return { active: f.active === id ? members[0].id : f.active, members };
  });
}

/** "बेटा", "बेटा 2" — relation label with a number when there are several. */
export function memberLabel(m: Member, members: Member[], labels: Record<Relation, string>) {
  const same = members.filter((x) => x.relation === m.relation);
  const n = same.indexOf(m) + 1;
  return same.length > 1 && n > 1 ? `${labels[m.relation]} ${n}` : labels[m.relation];
}

export const hasAnswers = (p: Profile) => Object.keys(p).length > 0;

/* ── Saved schemes and document checklists ───────────────────── */

export type SavedScheme = { slug: string; name: string; state: string | null; savedAt: number };

export const savedStore = createStore<SavedScheme[]>("yojana-saved-v1", []);
export const useSaved = savedStore.use;

export function toggleSaved(s: Omit<SavedScheme, "savedAt">) {
  let added = false;
  savedStore.set((list) => {
    if (list.some((x) => x.slug === s.slug)) return list.filter((x) => x.slug !== s.slug);
    added = true;
    return [{ ...s, savedAt: Date.now() }, ...list];
  });
  return added;
}

/** Per scheme: which document lines the person already has ready. */
export const docsStore = createStore<Record<string, number[]>>("yojana-docs-v1", {});
export const useDocs = docsStore.use;

export function toggleDoc(slug: string, index: number) {
  docsStore.set((all) => {
    const have = new Set(all[slug] ?? []);
    if (have.has(index)) have.delete(index);
    else have.add(index);
    return { ...all, [slug]: [...have].sort((a, b) => a - b) };
  });
}

/* ── Display preferences ─────────────────────────────────────── */

export type Prefs = { size: "md" | "lg" | "xl"; theme: "system" | "light" | "dark"; autoSpeak: boolean };
const DEFAULT_PREFS: Prefs = { size: "md", theme: "light", autoSpeak: false };

export const prefsStore = createStore<Prefs>("yojana-prefs-v1", DEFAULT_PREFS);
export const usePrefs = prefsStore.use;

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefsStore.set((p) => ({ ...DEFAULT_PREFS, ...p, [key]: value }));
  applyPrefs();
}

/** Mirror prefs onto <html> so CSS can react. The same logic runs inline before first paint (see layout). */
export function applyPrefs() {
  const p = { ...DEFAULT_PREFS, ...prefsStore.get() };
  const root = document.documentElement;
  root.dataset.size = p.size;
  const dark = p.theme === "dark" || (p.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) root.dataset.theme = "dark";
  else delete root.dataset.theme;
}
