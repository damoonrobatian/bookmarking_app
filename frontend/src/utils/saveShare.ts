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
