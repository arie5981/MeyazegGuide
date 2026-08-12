// content.js - רץ בתוך אתר המייצגים של ביטוח לאומי

function getPageContext() {
  const url = window.location.href;
  const title = document.title;
  
  // זיהוי הודעות שגיאה גלויות בדף
  const errorNodes = document.querySelectorAll('.error-message, .alert-danger, .msg-error');
  let errors = [];
  errorNodes.forEach(node => errors.push(node.innerText.trim()));

  // בדיקה אם קיימת טבלה
  const hasTable = document.querySelector('table') !== null;

  return {
    url: url,
    title: title,
    hasTable: hasTable,
    errors: errors
  };
}

// האזנה לבקשות מחלון העזרה (Side Panel)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_CONTEXT") {
    sendResponse(getPageContext());
  }
});