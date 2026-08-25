// sidepanel.js - ניהול ממשק חלון הצד ואיסוף נתוני דפים

document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const scanBtn = document.getElementById('scanBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pageCounter = document.getElementById('pageCounter');

  let currentPath = '';

  // חילוץ שם הקובץ בלבד מתוך ה-URL (ללא סיומת aspx וללא פרמטרים)
  function extractCleanPath(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      const filename = urlObj.pathname.split('/').pop(); // נטילת החלק האחרון בנתיב
      return filename.replace(/\.aspx$/i, ''); // הסרת הסיומת .aspx בלבד
    } catch (e) {
      return '';
    }
  }

  // שליפת ה-URL מתוך הכרטיסייה הפעילה בדפדפן
  async function updateActiveTabInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        currentPath = extractCleanPath(tab.url);
        statusDiv.textContent = currentPath ? `path: ${currentPath}` : 'לא פתוח בדף המייצגים';
      } else {
        statusDiv.textContent = 'לא נמצאה כרטיסייה פעילה';
      }
    } catch (e) {
      statusDiv.textContent = 'שגיאה בטעינת נתוני כרטיסייה';
    }
  }

  // עדכון מונה הדפים שנשמרו בזיכרון התוסף
  function updateCounter() {
    chrome.storage.local.get({ mappedPages: [] }, (result) => {
      if (pageCounter) {
        pageCounter.textContent = `דפים שנשמרו: ${result.mappedPages.length}`;
      }
    });
  }

  // הרצה ראשונית בטעינת ה-Side Panel
  updateActiveTabInfo();
  updateCounter();

  // הרכבת מחרוזת ה-site מתוך 3 תיבות הטקסט (מפריד ' > ')
  function getSiteHierarchy() {
    const s1 = document.getElementById('site1')?.value.trim() || '';
    const s2 = document.getElementById('site2')?.value.trim() || '';
    const s3 = document.getElementById('site3')?.value.trim() || '';

    return [s1, s2, s3].filter(Boolean).join(' > ');
  }

  // 1. שמירת/עדכון הדף הנוכחי ב-JSON
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      if (!currentPath) {
        alert('לא ניתן לחלץ path מכתובת זו.');
        return;
      }

      const site = getSiteHierarchy();
      const mainHeader = document.getElementById('mainHeader')?.value.trim() || '';
      const searchText = document.getElementById('searchText')?.value.trim() || '';

      const pageData = {
        site: site,
        mainHeader: mainHeader,
        searchText: searchText,
        path: currentPath
      };

      // שמירה ב-chrome.storage.local
      chrome.storage.local.get({ mappedPages: [] }, (result) => {
        const mappedPages = result.mappedPages;
        
        // אם הדף (path) כבר קיים - מעדכנים אותו, אחרת מוסיפים
        const existingIndex = mappedPages.findIndex(p => p.path === currentPath);
        if (existingIndex > -1) {
          mappedPages[existingIndex] = pageData;
        } else {
          mappedPages.push(pageData);
        }

        chrome.storage.local.set({ mappedPages }, () => {
          updateCounter();
          alert(`הדף ${currentPath} שנשמר/עודכן בהצלחה!`);
        });
      });
    });
  }

  // 2. ייצוא לקובץ JSON עם קידוד UTF-8 תקין לעברית
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      chrome.storage.local.get({ mappedPages: [] }, (result) => {
        if (result.mappedPages.length === 0) {
          alert("אין דפים שמורים לייצוא.");
          return;
        }

        const jsonString = JSON.stringify(result.mappedPages, null, 2);
        
        // הוספת BOM (\uFEFF) למניעת בעיות תצוגת עברית ב-Windows/Notepad
        const blob = new Blob(["\uFEFF" + jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", "meyazeg_site_map.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        
        // ניקוי משאב ה-URL מהזיכרון
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
      });
    });
  }

  // 3. איפוס מוחלט של הנתונים שנאגרו
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('האם למחוק את כל הדפים שנשמרו?')) {
        chrome.storage.local.set({ mappedPages: [] }, () => {
          updateCounter();
          alert("כל הנתונים נמחקו בהצלחה.");
        });
      }
    });
  }
});
