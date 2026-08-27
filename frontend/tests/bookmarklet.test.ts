import { BOOKMARKLET_TITLE, bookmarkletNetscapeHtml, saveBookmarkletHref } from "@/utils/bookmarklet";

describe("saveBookmarkletHref", () => {
  it("stays a javascript bookmark that opens the save popup", () => {
    const href = saveBookmarkletHref("https://neshanak.ca");
    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain("/save?url=");
    expect(href).toContain("https://neshanak.ca");
  });
});

describe("bookmarkletNetscapeHtml", () => {
  it("embeds the logo so Chrome can import it onto the bar", () => {
    const href = saveBookmarkletHref("https://neshanak.ca");
    const html = bookmarkletNetscapeHtml(href, "data:image/png;base64,AAA");
    expect(html).toContain("NETSCAPE-Bookmark-file-1");
    expect(html).toContain('PERSONAL_TOOLBAR_FOLDER="true"');
    expect(html).toContain('ICON="data:image/png;base64,AAA"');
    expect(html).toContain(BOOKMARKLET_TITLE);
    expect(html).toContain("&amp;title=");
  });
});
