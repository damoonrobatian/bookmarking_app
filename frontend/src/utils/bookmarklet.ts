export const NESHANAK_ORIGIN = "https://neshanak.ca";
export const BOOKMARKLET_FAVICON = `${NESHANAK_ORIGIN}/favicon.ico`;

/** javascript: bookmarks have no site favicon. Chromium still fetches this URL when it appears in the script. */
export function saveBookmarkletHref(origin?: string): string {
  const appOrigin =
    origin ??
    (typeof window !== "undefined" && window.location?.origin ? window.location.origin : NESHANAK_ORIGIN);
  return (
    `javascript:/*${BOOKMARKLET_FAVICON}*/void((function(){` +
    `var u=encodeURIComponent(location.href);` +
    `var t=encodeURIComponent(document.title||'');` +
    `window.open(${JSON.stringify(appOrigin)}+'/save?url='+u+'&title='+t,'neshanak-save','popup=yes,width=520,height=760');` +
    `})())`
  );
}

export function setBookmarkletDragImage(event: { currentTarget: EventTarget; dataTransfer: DataTransfer | null }): void {
  const transfer = event.dataTransfer;
  const target = event.currentTarget;
  if (!transfer || !(target instanceof Element)) {
    return;
  }
  const mark = target.querySelector("[data-bookmarklet-mark]");
  if (mark instanceof HTMLImageElement) {
    transfer.setDragImage(mark, 8, 8);
  }
}
