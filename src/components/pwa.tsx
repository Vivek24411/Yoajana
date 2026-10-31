"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Icon } from "./icons";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// The browser fires beforeinstallprompt once, early; keep it so the Help page can offer "Install" later.
let deferred: InstallEvent | null = null;
const installListeners = new Set<() => void>();
const notifyInstall = () => installListeners.forEach((l) => l());

export function useInstallPrompt() {
  const available = useSyncExternalStore(
    (l) => {
      installListeners.add(l);
      return () => installListeners.delete(l);
    },
    () => deferred !== null,
    () => false,
  );
  return {
    available,
    install: async () => {
      if (!deferred) return;
      await deferred.prompt();
      deferred = null;
      notifyInstall();
    },
  };
}

const subscribeOnline = (l: () => void) => {
  window.addEventListener("online", l);
  window.addEventListener("offline", l);
  return () => {
    window.removeEventListener("online", l);
    window.removeEventListener("offline", l);
  };
};

/** Service worker (offline pages) + a calm banner when the network drops, which happens a lot in villages. */
export function Pwa({ labels }: { labels: Dictionary["status"] }) {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [showBack, setShowBack] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallEvent;
      notifyInstall();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  // Briefly confirm when the connection comes back.
  if (!online && !wasOffline) setWasOffline(true);
  if (online && wasOffline) {
    setWasOffline(false);
    setShowBack(true);
  }
  useEffect(() => {
    if (!showBack) return;
    const id = setTimeout(() => setShowBack(false), 2500);
    return () => clearTimeout(id);
  }, [showBack]);

  if (online && !showBack) return null;
  return (
    <div
      role="status"
      className={`fixed left-1/2 top-[4.5rem] z-40 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-md px-4 py-2 text-sm font-bold [animation:toast-in_300ms_var(--ease-out)_both] ${
        online ? "bg-stamp text-paper" : "bg-ink text-paper"
      }`}
      style={{ transform: "translateX(-50%)" }}
    >
      <Icon name={online ? "check" : "wifiOff"} size={18} />
      {online ? labels.online : labels.offline}
    </div>
  );
}
