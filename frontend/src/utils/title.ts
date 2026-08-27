/** True when a string looks like an SEO keyword dump rather than a page title. */
export function looksLikeKeywordList(text: string): boolean {
  const parts = text.split(/[,|;]/).map((part) => part.trim()).filter(Boolean);
  return parts.length >= 3;
}

/** Prefer the first clause when a title is a comma-separated keyword list. */
export function displayTitle(text: string): string {
  const trimmed = text.trim();
  if (!looksLikeKeywordList(trimmed)) {
    return trimmed;
  }
  return trimmed.split(/[,|;]/)[0]?.trim() || trimmed;
}
