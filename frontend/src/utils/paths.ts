/** Return a same-origin path, or fallback if the value could send the browser elsewhere. */
export function safeInternalPath(value: string | null | undefined, fallback = "/app"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://neshanak.ca");
    if (parsed.origin !== "https://neshanak.ca") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
