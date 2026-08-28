/** Minimal window surface used to dismiss `/save` after a bookmark is stored. */
export type SaveDismissWindow = {
  close: () => void;
  opener: unknown;
  closed: boolean;
  history: { back: () => void; length: number };
  location: { replace: (url: string) => void };
  setTimeout: (handler: () => void, timeout?: number) => number;
};

function attemptClose(win: SaveDismissWindow): void {
  try {
    win.close();
  } catch {
    /* Some WebViews throw if the window was not script-opened. */
  }
}

/**
 * Leave `/save` after a successful save or cancel.
 * Android share-target windows treat `window.close()` as “return to the previous
 * app” and freeze this document, so a successful save must navigate away first.
 */
export function dismissSaveWindow(
  navigate: (to: string) => void,
  win: SaveDismissWindow = window,
  options: { saved?: boolean } = {},
): void {
  if (options.saved) {
    win.location.replace("/save-done.html");
    return;
  }

  if (win.opener) {
    attemptClose(win);
    win.setTimeout(() => {
      if (!win.closed) navigate("/app");
    }, 200);
    return;
  }

  try {
    if (win.history.length > 1) {
      win.history.back();
      return;
    }
  } catch {
    /* ignore */
  }
  navigate("/app");
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
