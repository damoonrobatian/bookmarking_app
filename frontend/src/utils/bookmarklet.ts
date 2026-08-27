export const NESHANAK_ORIGIN = "https://neshanak.ca";
export const BOOKMARKLET_TITLE = "+Neshanak";

export function saveBookmarkletHref(origin?: string): string {
  const appOrigin =
    origin ??
    (typeof window !== "undefined" && window.location?.origin ? window.location.origin : NESHANAK_ORIGIN);
  return (
    `javascript:void((function(){` +
    `var u=encodeURIComponent(location.href);` +
    `var t=encodeURIComponent(document.title||'');` +
    `window.open(${JSON.stringify(appOrigin)}+'/save?url='+u+'&title='+t,'neshanak-save','popup=yes,width=520,height=760');` +
    `})())`
  );
}

export async function bookmarkletIconDataUri(): Promise<string> {
  const response = await fetch("/favicon-32.png");
  if (!response.ok) {
    throw new Error("Could not load the Neshanak mark.");
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the Neshanak mark."));
    reader.readAsDataURL(blob);
  });
}

export function bookmarkletNetscapeHtml(href: string, iconDataUri: string): string {
  return [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    "<!-- This is an automatically generated file.",
    "     It will be read and overwritten.",
    "     DO NOT EDIT! -->",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    '    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>',
    "    <DL><p>",
    `        <DT><A HREF="${escapeAttr(href)}" ICON="${escapeAttr(iconDataUri)}">${BOOKMARKLET_TITLE}</A>`,
    "    </DL><p>",
    "</DL><p>",
    "",
  ].join("\n");
}

export function downloadBookmarkletHtml(html: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Save To Neshanak.html";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
