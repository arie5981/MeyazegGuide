// content.js - גרסה נקייה ללא שמירה אוטומטית ישנה

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageInfo") {
    // חילוץ כותרת מהדף במידה ויש
    const h1 = document.querySelector('h1, .page-title, .HeaderTitle');
    const headerText = h1 ? h1.innerText.trim() : "";

    sendResponse({
      mainHeader: headerText,
      url: window.location.href
    });
  }
  return true;
});
