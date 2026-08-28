import { dismissSaveWindow, firstHttpUrl, savePageFromSearch, type SaveDismissWindow } from "@/utils/saveShare";

describe("savePageFromSearch", () => {
  it("uses url and title query params from the bookmarklet", () => {
    const params = new URLSearchParams("url=https://react.dev/learn&title=React");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "React" });
  });

  it("reads an Android share that puts the page address in text", () => {
    const params = new URLSearchParams("title=React Docs&text=https://react.dev/learn");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "React Docs" });
  });

  it("pulls a URL out of a share message", () => {
    const params = new URLSearchParams("text=Look at this https://react.dev/learn please");
    expect(savePageFromSearch(params)).toEqual({ url: "https://react.dev/learn", title: "Look at this please" });
  });
});

describe("firstHttpUrl", () => {
  it("ignores non-http schemes", () => {
    expect(firstHttpUrl("javascript:alert(1)")).toBeNull();
  });
});

function fakeSaveWindow(overrides: {
  opener?: unknown;
  closed?: boolean;
  standalone?: boolean;
  android?: boolean;
  visibilityState?: DocumentVisibilityState;
} = {}): SaveDismissWindow {
  return {
    close: vi.fn(),
    opener: overrides.opener ?? null,
    closed: overrides.closed ?? false,
    history: { back: vi.fn() },
    location: { replace: vi.fn() },
    matchMedia: (query) => ({ matches: Boolean(overrides.standalone && query.includes("standalone")) }),
    navigator: {
      userAgent: overrides.android ? "Mozilla/5.0 (Linux; Android 14)" : "Mozilla/5.0",
    },
    document: { visibilityState: overrides.visibilityState ?? "visible" },
    setTimeout: (handler, timeout) => window.setTimeout(handler, timeout),
  };
}

describe("dismissSaveWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes a bookmarklet popup and opens the library if the window stays", () => {
    const navigate = vi.fn();
    const win = fakeSaveWindow({ opener: {} });
    dismissSaveWindow(navigate, win);
    expect(win.close).toHaveBeenCalled();
    expect(win.history.back).not.toHaveBeenCalled();
    expect(win.location.replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(navigate).toHaveBeenCalledWith("/app");
  });

  it("does not open the library when the popup actually closed", () => {
    const navigate = vi.fn();
    const win = fakeSaveWindow({ opener: {}, closed: true });
    dismissSaveWindow(navigate, win);
    vi.advanceTimersByTime(200);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("goes back and replaces the form after an Android share save", () => {
    const navigate = vi.fn();
    const win = fakeSaveWindow({ android: true });
    dismissSaveWindow(navigate, win, { saved: true });
    expect(win.close).toHaveBeenCalled();
    expect(win.history.back).toHaveBeenCalled();
    expect(win.location.replace).toHaveBeenCalledWith("/save-done.html");
    vi.advanceTimersByTime(300);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not open the library when a share window has already been hidden", () => {
    const navigate = vi.fn();
    const win = fakeSaveWindow({ android: true, visibilityState: "hidden" });
    dismissSaveWindow(navigate, win);
    vi.advanceTimersByTime(300);
    expect(navigate).not.toHaveBeenCalled();
  });
});
