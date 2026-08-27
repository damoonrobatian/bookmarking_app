import { BOOKMARKLET_FAVICON, saveBookmarkletHref } from "@/utils/bookmarklet";

describe("saveBookmarkletHref", () => {
  it("stays a javascript bookmark that still names the site favicon", () => {
    const href = saveBookmarkletHref("https://neshanak.ca");
    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain(BOOKMARKLET_FAVICON);
    expect(href).toContain("/save?url=");
    expect(href).toContain("https://neshanak.ca");
  });
});
