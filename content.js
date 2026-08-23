// content.js - רץ בתוך אתר המייצגים של ביטוח לאומי

// 1. פונקציה להקלטת הדף הנוכחי ושמירתו ב-chrome.storage למיפוי הדפים
function capturePageData() {
  const pageData = {
    url: window.location.href,
    pathname: window.location.pathname,
    searchParams: window.location.search,
    title: document.title,
    mainHeader: document.querySelector('h1, h2, .page-title, .title')?.innerText?.trim() || '',
    timestamp: new Date().toISOString()
  };

  // שמירה בזיכרון המקומי של התוסף תוך מניעת כפילויות
  chrome.storage.local.get({ mappedPages: [] }, (result) => {
    const pages = result.mappedPages;
    const exists = pages.some(p => p.url === pageData.url);
    
    if (!exists) {
      pages.push(pageData);
      chrome.storage.local.set({ mappedPages: pages }, () => {
        console.log(" MeyazegGuide: הדף הוקלט למיפוי:", pageData.title || pageData.pathname);
      });
    }
  });
}

// 2. פונקציה לשליפת הקשר הדף עבור ה-Side Panel
function getPageContext() {
  const url = window.location.href;
  const title = document.title;
  
  // זיהוי הודעות שגיאה גלויות בדף
  const errorNodes = document.querySelectorAll('.error-message, .alert-danger, .msg-error, .errorMessage');
  let errors = [];
  errorNodes.forEach(node => {
    const text = node.innerText.trim();
    if (text) errors.push(text);
  });

  // בדיקה אם קיימת טבלה בדף
  const hasTable = document.querySelector('table') !== null;

  // שליפת כותרת ראשית בדף
  const mainHeader = document.querySelector('h1, h2, .page-title, .title')?.innerText?.trim() || '';

  return {
    url: url,
    pathname: window.location.pathname,
    searchParams: window.location.search,
    title: title,
    mainHeader: mainHeader,
    hasTable: hasTable,
    errors: errors
  };
}

// 3. הפעלת הקלטת הדף בטעינה
capturePageData();

// 4. האזנה לבקשות מחלון העזרה (Side Panel)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_CONTEXT") {
    sendResponse(getPageContext());
  }
});
