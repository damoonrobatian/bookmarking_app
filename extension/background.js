const ORIGIN = "https://neshanak.ca";

function openSave(tab) {
  const pageUrl = tab && tab.url ? tab.url : "";
  if (!pageUrl.startsWith("http://") && !pageUrl.startsWith("https://")) {
    return;
  }
  const saveUrl =
    ORIGIN +
    "/save?url=" +
    encodeURIComponent(pageUrl) +
    "&title=" +
    encodeURIComponent(tab.title || "");
  chrome.windows.create({ url: saveUrl, type: "popup", width: 520, height: 760 });
}

chrome.action.onClicked.addListener(openSave);
