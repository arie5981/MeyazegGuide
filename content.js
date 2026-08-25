// content.js - מחזיר את ה-URL והכותרת של החלון/הפריים הנוכחי

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageUrl") {
    sendResponse({
      url: window.location.href
    });
  } else if (request.action === "getPageInfo") {
    // חילוץ כותרת מהדף במידה וקיבלנו דרישה
    const h1 = document.querySelector('h1, .page-title, .HeaderTitle');
    const headerText = h1 ? h1.innerText.trim() : "";

    sendResponse({
      mainHeader: headerText,
      url: window.location.href
    });
  }
  return true;
});
