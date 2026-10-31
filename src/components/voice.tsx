"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { Icon } from "./icons";

/* eslint-disable @typescript-eslint/no-explicit-any -- Web Speech API types are not in lib.dom */
type Recognition = any;

function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Mode = "browser" | "server" | "none";

/**
 * Voice input. Prefers the browser's built-in recognizer (free, works on Android Chrome
 * with hi-IN / en-IN). Falls back to recording audio and sending it to /api/stt when the
 * server has a speech-to-text key.
 */
export function useVoiceInput({
  lang,
  onInterim,
  onFinal,
  onUnsupported,
}: {
  lang: Locale;
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onUnsupported?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("browser");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  // Callers pass fresh closures each render; read the latest without restarting recognition.
  const cb = useRef({ onInterim, onFinal, onUnsupported });
  useEffect(() => {
    cb.current = { onInterim, onFinal, onUnsupported };
  });

  useEffect(() => {
    if (getRecognition()) return;
    fetch("/api/stt")
      .then((r) => r.json())
      .then((d: { enabled: boolean }) => setMode(d.enabled && "MediaRecorder" in window ? "server" : "none"))
      .catch(() => setMode("none"));
  }, []);

  useEffect(
    () => () => {
      recRef.current?.abort?.();
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  function startBrowser() {
    const Rec = getRecognition();
    if (!Rec) return;
    const rec = new Rec();
    // Hindi recognizer also understands most Hinglish; English (India) handles Indian accents.
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      cb.current.onInterim?.(finalText + interim);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") cb.current.onUnsupported?.();
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) cb.current.onFinal(finalText.trim());
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  async function startServer() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      cb.current.onUnsupported?.();
      return;
    }
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setListening(false);
      setBusy(true);
      try {
        const body = new FormData();
        body.append("audio", new Blob(chunks, { type: rec.mimeType }), "speech.webm");
        const res = await fetch("/api/stt", { method: "POST", body });
        const data = (await res.json()) as { text?: string };
        if (data.text?.trim()) cb.current.onFinal(data.text.trim());
      } catch {
        cb.current.onUnsupported?.();
      } finally {
        setBusy(false);
      }
    };
    mediaRef.current = rec;
    rec.start();
    setListening(true);
    // Safety stop so a forgotten mic doesn't record forever.
    setTimeout(() => rec.state === "recording" && rec.stop(), 30000);
  }

  function toggle() {
    if (listening) {
      recRef.current?.stop?.();
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      return;
    }
    stopSpeaking();
    if (mode === "browser") startBrowser();
    else if (mode === "server") void startServer();
    else cb.current.onUnsupported?.();
  }

  return { listening, busy, toggle };
}

/** Round mic button with live ripples while listening. */
export function MicButton({
  listening,
  busy,
  onClick,
  labels,
  size = "md",
}: {
  listening: boolean;
  busy: boolean;
  onClick: () => void;
  labels: { start: string; stop: string; listening: string };
  size?: "md" | "xl";
}) {
  const dims = size === "xl" ? "size-[4.5rem]" : "size-14";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={listening}
      aria-label={listening ? labels.stop : labels.start}
      className={`pressable relative grid shrink-0 place-items-center rounded-full text-paper disabled:opacity-60 ${dims} ${
        listening || size === "xl" ? "bg-accent" : "bg-ink"
      }`}
    >
      {listening && (
        <span aria-hidden className="pointer-events-none absolute inset-0 text-accent">
          <span className="mic-ring" />
          <span className="mic-ring" />
          <span className="mic-ring" />
        </span>
      )}
      <span aria-hidden className="relative">
        {busy ? (
          <Icon name="refresh" size={size === "xl" ? 30 : 24} className="spin" />
        ) : listening ? (
          <Icon name="stop" size={size === "xl" ? 28 : 22} />
        ) : (
          <Icon name="mic" size={size === "xl" ? 34 : 26} strokeWidth={2} />
        )}
      </span>
      <span className="sr-only" aria-live="polite">{listening ? labels.listening : ""}</span>
    </button>
  );
}

/** Five bars that dance while the mic is open. */
export function SoundWave({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex h-6 items-center gap-1 ${className}`}>
      {[0.1, 0.35, 0, 0.25, 0.5].map((d, i) => (
        <span key={i} className="wave-bar h-full" style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

/* ── Read aloud ─────────────────────────────────────────────── */

function plainText(md: string) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickVoice(langTag: string) {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === langTag.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(langTag.slice(0, 2)))
  );
}

// One shared "who is speaking" so starting a new read-aloud resets any other button.
let speakingId: string | null = null;
const speakListeners = new Set<() => void>();
const setSpeakingId = (id: string | null) => {
  speakingId = id;
  speakListeners.forEach((l) => l());
};
const subscribeSpeaking = (l: () => void) => {
  speakListeners.add(l);
  return () => speakListeners.delete(l);
};

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  setSpeakingId(null);
}

/** Reads text aloud with the device's own voice (no network, no cost). */
export function speak(text: string, id = "auto") {
  if (!("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const clean = plainText(text);
  const langTag = /[ऀ-ॿ]/.test(clean) ? "hi-IN" : "en-IN";
  const voice = pickVoice(langTag);
  // Chrome stops long utterances after ~15s, so speak sentence by sentence.
  const parts = clean.match(/[^.!?।]+[.!?।]?/g) ?? [clean];
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    u.lang = langTag;
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (i === parts.length - 1) u.onend = () => speakingId === id && setSpeakingId(null);
    u.onerror = () => speakingId === id && setSpeakingId(null);
    synth.speak(u);
  });
  setSpeakingId(id);
}

const noopSubscribe = () => () => {};

export function useSpeechSupported() {
  return useSyncExternalStore(noopSubscribe, () => "speechSynthesis" in window, () => false);
}

export function SpeakButton({
  text,
  id,
  labels,
  className = "",
}: {
  text: string;
  id: string;
  labels: { listen: string; stop: string };
  className?: string;
}) {
  const supported = useSpeechSupported();
  const active = useSyncExternalStore(subscribeSpeaking, () => speakingId === id, () => false);

  useEffect(() => () => {
    if (speakingId === id) stopSpeaking();
  }, [id]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (active ? stopSpeaking() : speak(text, id))}
      aria-pressed={active}
      className={`pressable inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] border-ink px-3 text-[0.95rem] font-bold ${
        active ? "bg-ink text-paper" : "hover:bg-paper-2"
      } ${className}`}
    >
      {active ? <SoundWave className="h-4" /> : <Icon name="volume" size={18} />}
      {active ? labels.stop : labels.listen}
    </button>
  );
}
