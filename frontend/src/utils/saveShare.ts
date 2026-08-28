/** Minimal window surface used to dismiss `/save` after a bookmark is stored. */
export type SaveDismissWindow = {
  close: () => void;
  opener: unknown;
  closed: boolean;
  history: { back: () => void };
  location: { replace: (url: string) => void };
  matchMedia: (query: string) => { matches: boolean };
  navigator: { userAgent: string; standalone?: boolean };
  document?: { visibilityState?: DocumentVisibilityState };
  setTimeout: (handler: () => void, timeout?: number) => number;
};

export function isInstalledDisplay(win: SaveDismissWindow): boolean {
  return (
    win.matchMedia("(display-mode: standalone)").matches ||
    win.matchMedia("(display-mode: fullscreen)").matches ||
    win.matchMedia("(display-mode: minimal-ui)").matches ||
    Boolean(win.navigator.standalone)
  );
}

function attemptClose(win: SaveDismissWindow): void {
  try {
    win.close();
  } catch {
    /* Some WebViews throw if the window was not script-opened. */
  }
}

/**
 * Close `/save` after a successful save or cancel.
 * Bookmarklet popups can use `window.close()`. Android share opens a standalone
 * WebAPK that close() often only returns focus to the previous app and leaves
 * this task on the form.
 */
export function dismissSaveWindow(
  navigate: (to: string) => void,
  win: SaveDismissWindow = window,
  options: { saved?: boolean } = {},
): void {
  const fromScript = Boolean(win.opener);
  const shareWindow = !fromScript && (isInstalledDisplay(win) || /Android/i.test(win.navigator.userAgent));

  attemptClose(win);

  if (shareWindow) {
    try {
      win.history.back();
    } catch {
      /* ignore */
    }
    if (options.saved) {
      try {
        win.location.replace("/save-done.html");
      } catch {
        /* ignore */
      }
    }
    win.setTimeout(() => {
      if (win.closed || win.document?.visibilityState === "hidden") return;
      attemptClose(win);
      try {
        win.history.back();
      } catch {
        /* ignore */
      }
      if (!options.saved) navigate("/app");
    }, 50);
    return;
  }

  win.setTimeout(() => {
    if (!win.closed) navigate("/app");
  }, 200);
}

/** Pull the first http(s) URL out of a share payload. Android often puts the page in `text`. */
export function firstHttpUrl(value: string): string | null {
  const match = value.match(/https?:\/\/[^\s<>"'\\]+/i);
  if (!match) return null;
  try {
    const parsed = new URL(match[0].replace(/[),.;]+$/g, ""));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function savePageFromSearch(params: URLSearchParams): { url: string; title: string } {
  const urlParam = params.get("url")?.trim() ?? "";
  const text = params.get("text")?.trim() ?? "";
  const titleParam = params.get("title")?.trim() ?? "";
  const url = (/^https?:\/\//i.test(urlParam) ? urlParam : null) ?? firstHttpUrl(urlParam) ?? firstHttpUrl(text) ?? "";
  let title = titleParam;
  if (!title && text) {
    title = url ? text.replace(url, " ").replace(/\s+/g, " ").trim() : text;
    if (/^https?:\/\//i.test(title)) title = "";
  }
  return { url, title };
}
