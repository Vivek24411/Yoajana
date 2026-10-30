"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Dictionary, Locale } from "@/lib/i18n";
import { activeMember, familyStore, hasAnswers, prefsStore, setPref, usePrefs } from "@/lib/storage";
import { Icon, Logo, type IconName } from "./icons";
import { MicButton, SoundWave, SpeakButton, speak, stopSpeaking, useVoiceInput } from "./voice";

const TOOLS: Record<string, { icon: IconName; done: keyof Dictionary["chat"]; running: keyof Dictionary["chat"] }> = {
  "tool-searchSchemes": { icon: "search", done: "searchedFor", running: "searching" },
  "tool-checkEligibility": { icon: "list", done: "checked", running: "checking" },
  "tool-getSchemeDetails": { icon: "file", done: "opened", running: "reading" },
};

const SUGGESTION_ICONS: IconName[] = ["wheat", "elder", "heart", "cap"];

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function ChatClient({ lang, t, initialQuestion }: { lang: Locale; t: Dictionary["chat"]; initialQuestion?: string }) {
  const storageKey = `yojana-chat-v1-${lang}`;
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Send the answers saved on this phone so the assistant does not ask again.
        body: () => {
          const m = activeMember(familyStore.get());
          return { lang, profile: hasAnswers(m.profile) ? m.profile : undefined };
        },
      }),
    [lang],
  );
  const { messages, sendMessage, status, error, regenerate, stop, setMessages } = useChat({ transport });
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const prefs = usePrefs();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const restored = useRef(false);
  const prevStatus = useRef(status);
  const busy = status === "submitted" || status === "streaming";

  const voice = useVoiceInput({
    lang,
    onInterim: setInput,
    onFinal: (text) => send(text),
    onUnsupported: () => setNotice(t.noVoice),
  });

  // Keep the conversation while the person opens a scheme and comes back.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (initialQuestion) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setMessages(JSON.parse(saved) as UIMessage[]);
    } catch {
      /* storage blocked: start fresh */
    }
  }, [initialQuestion, setMessages, storageKey]);

  useEffect(() => {
    if (busy) return;
    try {
      if (messages.length) sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
    } catch {
      /* ignore */
    }
  }, [messages, busy, storageKey]);

  // Questions arriving via ?q= (home mic, scheme pages). Deferred a tick so a dev-mode
  // effect re-run cancels the first attempt instead of swallowing it.
  useEffect(() => {
    if (!initialQuestion || sentInitial.current) return;
    const id = setTimeout(() => {
      sentInitial.current = true;
      void sendMessage({ text: initialQuestion });
      // Coming back to this page should show the conversation, not ask again.
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }, 0);
    return () => clearTimeout(id);
  }, [initialQuestion, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  // Read each finished answer aloud when the person has asked for that.
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (was === "streaming" && status === "ready" && prefsStore.get().autoSpeak) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") speak(textOf(last), `msg-${last.id}`);
    }
  }, [status, messages]);

  function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setNotice(null);
    void sendMessage({ text: q });
  }

  function newChat() {
    stop();
    stopSpeaking();
    setMessages([]);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4 pb-36">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight">{t.title}</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={prefs.autoSpeak}
            onClick={() => {
              if (prefs.autoSpeak) stopSpeaking();
              setPref("autoSpeak", !prefs.autoSpeak);
            }}
            title={t.autoSpeak}
            className={`pressable inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${
              prefs.autoSpeak ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-muted"
            }`}
          >
            <Icon name="volume" size={18} />
            <span className="hidden sm:inline">{t.autoSpeak}</span>
            <span className={`relative h-5 w-8 rounded-full transition-colors ${prefs.autoSpeak ? "bg-brand" : "bg-border-strong"}`}>
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-surface shadow transition-transform duration-300 ease-[var(--ease-spring)] ${
                  prefs.autoSpeak ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
          {!empty && (
            <button
              type="button"
              onClick={newChat}
              aria-label={t.newChat}
              title={t.newChat}
              className="pressable grid size-10 place-items-center rounded-full border border-border-strong text-muted"
            >
              <Icon name="plus" size={20} />
            </button>
          )}
        </div>
      </div>

      {empty && (
        <div className="flex flex-1 flex-col items-center gap-6 pt-6 text-center">
          <div className="enter flex flex-col items-center gap-4">
            <MicButton
              size="xl"
              listening={voice.listening}
              busy={voice.busy}
              onClick={voice.toggle}
              labels={{ start: t.micStart, stop: t.micStop, listening: t.listening }}
            />
            <div>
              <p className="font-display text-2xl font-semibold">{t.emptyTitle}</p>
              <p className="mt-1 text-muted">{t.emptyBody}</p>
            </div>
          </div>
          <div className="w-full text-left">
            <p className="eyebrow mb-2">{t.tryAsking}</p>
            <ul className="flex flex-col gap-2">
              {t.suggestions.map((s, i) => (
                <li key={s} className="enter" style={{ "--i": i + 2 } as React.CSSProperties}>
                  <button type="button" onClick={() => send(s)} className="card pressable lift flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className="grid size-9 flex-none place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon name={SUGGESTION_ICONS[i] ?? "chat"} size={19} />
                    </span>
                    <span className="flex-1 leading-snug">{s}</span>
                    <Icon name="arrowRight" size={18} className="flex-none text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-4" aria-live="polite">
        {messages.map((m, idx) => {
          const text = textOf(m);
          const isLast = idx === messages.length - 1;
          if (m.role === "user") {
            return (
              <li key={m.id} className="enter ml-auto max-w-[85%] rounded-[1.4rem] rounded-br-md bg-brand px-4 py-2.5 text-brand-ink">
                {text}
              </li>
            );
          }
          const tools = m.parts.filter((p) => p.type in TOOLS);
          const streaming = isLast && busy;
          return (
            <li key={m.id} className="enter flex gap-2.5">
              <span className="mt-1 flex-none">
                <Logo size={30} />
              </span>
              <div className="card min-w-0 flex-1 rounded-tl-md px-4 py-3">
                {tools.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {tools.map((p, i) => {
                      const meta = TOOLS[p.type];
                      const part = p as { state?: string; input?: { query?: string } };
                      const running = part.state !== "output-available" && part.state !== "output-error";
                      return (
                        <span key={i} className="chip fade-in max-w-full bg-surface-2 text-muted">
                          {running ? <Icon name="refresh" size={13} className="spin flex-none" /> : <Icon name={meta.icon} size={13} className="flex-none" />}
                          <span className="truncate">
                            {t[running ? meta.running : meta.done] as string}
                            {part.input?.query ? `: ${part.input.query}` : ""}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
                {text ? (
                  <div className="prose-chat break-words">
                    <ReactMarkdown
                      components={{
                        a: ({ href = "", children }) =>
                          href.startsWith("/") ? (
                            <Link href={href}>{children}</Link>
                          ) : (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  streaming && <TypingDots />
                )}
                {text && !streaming && (
                  <div className="mt-3 flex border-t border-border pt-2.5">
                    <SpeakButton id={`msg-${m.id}`} text={text} labels={{ listen: t.listen, stop: t.stopListen }} className="py-1.5" />
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {status === "submitted" && (
          <li className="fade-in flex gap-2.5">
            <span className="mt-1 flex-none">
              <Logo size={30} />
            </span>
            <div className="card flex items-center gap-3 rounded-tl-md px-4 py-3 text-muted">
              <TypingDots />
              <span className="text-sm">{t.thinking}</span>
            </div>
          </li>
        )}
      </ol>

      {error && (
        <div className="card flex flex-wrap items-center gap-3 border-danger/40 bg-danger-soft p-4 text-danger">
          <Icon name="alert" size={20} />
          <span className="flex-1">{t.error}</span>
          <button type="button" className="btn btn-ghost pressable min-h-10 bg-surface text-sm text-text" onClick={() => regenerate()}>
            <Icon name="refresh" size={16} />
            {t.retry}
          </button>
        </div>
      )}

      {!empty && <p className="flex items-start gap-2 text-sm text-muted"><Icon name="info" size={16} className="mt-0.5 flex-none" />{t.disclaimer}</p>}
      <div ref={bottomRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto max-w-3xl">
          {notice && (
            <p className="fade-in mb-2 flex items-center gap-2 text-sm text-danger">
              <Icon name="alert" size={16} />
              {notice}
            </p>
          )}
          {voice.listening && (
            <p className="fade-in mb-2 flex items-center gap-2.5 text-sm font-semibold text-danger">
              <SoundWave className="h-4" />
              {t.listening}
            </p>
          )}
          <div className="flex items-center gap-2">
            <MicButton
              listening={voice.listening}
              busy={voice.busy}
              onClick={voice.toggle}
              labels={{ start: t.micStart, stop: t.micStop, listening: t.listening }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              enterKeyHint="send"
              className="field h-14 min-w-0 flex-1 rounded-full bg-bg"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                aria-label={t.stop}
                className="pressable grid size-14 flex-none place-items-center rounded-full bg-text text-bg"
              >
                <Icon name="stop" size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label={t.send}
                className="pressable grid size-14 flex-none place-items-center rounded-full bg-brand text-brand-ink disabled:bg-surface-2 disabled:text-muted"
              >
                <Icon name="send" size={22} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-hidden>
      <span className="typing-dot" />
      <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
      <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
    </span>
  );
}
