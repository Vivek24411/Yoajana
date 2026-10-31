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
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-5 pb-36">
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-3">
        <h1 className="font-display text-[1.75rem] leading-tight">{t.title}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            role="switch"
            aria-checked={prefs.autoSpeak}
            onClick={() => {
              if (prefs.autoSpeak) stopSpeaking();
              setPref("autoSpeak", !prefs.autoSpeak);
            }}
            title={t.autoSpeak}
            className="pressable inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-bold"
          >
            <Icon name="volume" size={19} className={prefs.autoSpeak ? "text-accent" : "text-muted"} />
            <span className="hidden sm:inline">{t.autoSpeak}</span>
            <span className={`relative h-5 w-9 rounded-full border-[1.5px] border-ink transition-colors ${prefs.autoSpeak ? "bg-ink" : ""}`}>
              <span
                className={`absolute top-[1.5px] size-3.5 rounded-full transition-transform duration-300 ease-[var(--ease-spring)] ${
                  prefs.autoSpeak ? "translate-x-[1.05rem] bg-paper" : "translate-x-[2px] bg-ink"
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
              className="pressable inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-bold text-accent"
            >
              <Icon name="plus" size={18} strokeWidth={2.4} />
              <span className="hidden sm:inline">{t.newChat}</span>
            </button>
          )}
        </div>
      </div>

      {empty && (
        <div className="flex flex-1 flex-col gap-8 pt-4">
          <div className="enter flex items-center gap-4">
            <MicButton
              size="xl"
              listening={voice.listening}
              busy={voice.busy}
              onClick={voice.toggle}
              labels={{ start: t.micStart, stop: t.micStop, listening: t.listening }}
            />
            <div>
              <p className="font-display text-[1.6rem] leading-tight">{t.emptyTitle}</p>
              <p className="mt-1 leading-snug text-muted">{t.emptyBody}</p>
            </div>
          </div>
          <div>
            <p className="kicker mb-1">{t.tryAsking}</p>
            <ul className="border-t border-rule">
              {t.suggestions.map((s, i) => (
                <li key={s} className="enter" style={{ "--i": i + 2 } as React.CSSProperties}>
                  <button type="button" onClick={() => send(s)} className="group flex w-full items-center gap-3 border-b border-rule py-3.5 text-left">
                    <Icon name={SUGGESTION_ICONS[i] ?? "chat"} size={20} className="flex-none text-accent" />
                    <span className="flex-1 font-semibold leading-snug">“{s}”</span>
                    <Icon name="arrowRight" size={18} className="flex-none text-muted transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-6" aria-live="polite">
        {messages.map((m, idx) => {
          const text = textOf(m);
          const isLast = idx === messages.length - 1;
          if (m.role === "user") {
            return (
              <li key={m.id} className="enter ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-ink px-4 py-2.5 font-semibold text-paper">
                {text}
              </li>
            );
          }
          const tools = m.parts.filter((p) => p.type in TOOLS);
          const streaming = isLast && busy;
          return (
            <li key={m.id} className="enter flex flex-col gap-2">
              <span className="flex items-center gap-2 text-sm font-bold text-muted">
                <Logo size={22} />
                {t.assistant}
              </span>
              {tools.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.82rem] font-semibold text-muted">
                  {tools.map((p, i) => {
                    const meta = TOOLS[p.type];
                    const part = p as { state?: string; input?: { query?: string } };
                    const running = part.state !== "output-available" && part.state !== "output-error";
                    return (
                      <span key={i} className="fade-in inline-flex max-w-full items-center gap-1.5">
                        {running ? <Icon name="refresh" size={13} className="spin flex-none text-accent" /> : <Icon name="check" size={13} strokeWidth={3} className="flex-none text-stamp" />}
                        <span className="truncate">
                          {t[running ? meta.running : meta.done] as string}
                          {part.input?.query ? `: ${part.input.query}` : ""}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="border-l-2 border-accent pl-4">
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
                  <div className="mt-3">
                    <SpeakButton id={`msg-${m.id}`} text={text} labels={{ listen: t.listen, stop: t.stopListen }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {status === "submitted" && (
          <li className="fade-in flex items-center gap-3 border-l-2 border-accent pl-4 text-muted">
            <TypingDots />
            <span className="text-sm font-semibold">{t.thinking}</span>
          </li>
        )}
      </ol>

      {error && (
        <div className="notice flex flex-wrap items-center gap-3">
          <Icon name="alert" size={20} className="text-accent" />
          <span className="flex-1 font-bold">{t.error}</span>
          <button type="button" className="btn btn-ink pressable min-h-10 text-sm" onClick={() => regenerate()}>
            <Icon name="refresh" size={16} />
            {t.retry}
          </button>
        </div>
      )}

      {!empty && (
        <p className="flex items-start gap-2 border-t border-rule pt-3 text-sm text-muted">
          <Icon name="info" size={16} className="mt-0.5 flex-none" />
          {t.disclaimer}
        </p>
      )}
      <div ref={bottomRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
      >
        <div className="mx-auto max-w-2xl">
          {notice && (
            <p className="fade-in mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
              <Icon name="alert" size={16} />
              {notice}
            </p>
          )}
          {voice.listening && (
            <p className="fade-in mb-2 flex items-center gap-2.5 text-sm font-bold text-accent">
              <SoundWave className="h-4" />
              {t.listening}
            </p>
          )}
          <div className="flex items-center gap-2.5">
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
              className="field min-w-0 flex-1"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                aria-label={t.stop}
                className="pressable grid size-12 flex-none place-items-center rounded-md border-[1.5px] border-ink"
              >
                <Icon name="stop" size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label={t.send}
                className="pressable grid size-12 flex-none place-items-center rounded-md bg-accent text-paper disabled:bg-paper-2 disabled:text-muted"
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
