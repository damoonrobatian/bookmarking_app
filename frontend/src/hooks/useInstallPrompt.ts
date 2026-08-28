import { useEffect, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __neshanakInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    if (window.__neshanakInstallPrompt) {
      setPromptEvent(window.__neshanakInstallPrompt);
    }
    const takePrompt = (event?: Event) => {
      if (event) {
        event.preventDefault();
        window.__neshanakInstallPrompt = event as BeforeInstallPromptEvent;
      }
      if (window.__neshanakInstallPrompt) setPromptEvent(window.__neshanakInstallPrompt);
    };
    const onInstalled = () => {
      window.__neshanakInstallPrompt = null;
      setPromptEvent(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", takePrompt);
    window.addEventListener("neshanak-can-install", takePrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", takePrompt);
      window.removeEventListener("neshanak-can-install", takePrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    window.__neshanakInstallPrompt = null;
    setPromptEvent(null);
  }

  return { canInstall: Boolean(promptEvent), installed, install };
}
