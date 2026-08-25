// sidepanel.js - ניהול ממשק חלון הצד, חילוץ ה-path ואיסוף נתוני דפים

document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const scanBtn = document.getElementById('scanBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pageCounter = document.getElementById('pageCounter');

  // חילוץ נקי של שם הקובץ בלבד (ללא סיומת .aspx וללא פרמטרים של ? ו-&)
  function extractCleanPath(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      // לוקח את החלק האחרון בנתיב (למשל: v109_s_cheshbonotbank.aspx)
      let filename = urlObj.pathname.split('/').pop(); 
      // מסיר את הסיומת .aspx בצורה גמישה
      return filename.replace(/\.aspx/i, ''); 
    } catch (e) {
      return '';
    }
  }

  // שליפת ה-URL המעודכן ביותר (כולל תמיכה ב-iframe פנימי)
  async function getActiveTabPath() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        if (statusDiv) statusDiv.textContent = 'לא נמצאה כרטיסייה פעילה';
        return '';
      }

      // ניסיון פנייה ל-content.js כדי לבדוק אם הדף מוצג בתוך iframe
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageUrl" }).catch(() => null);
      
      const targetUrl = (response && response.url) ? response.url : tab.url;
      const cleanPath = extractCleanPath(targetUrl);

      if (statusDiv) {
        statusDiv.textContent = cleanPath ? `path: ${cleanPath}` : 'לא פתוח בדף המייצגים';
      }
      return cleanPath;
    } catch (e) {
      console.error(e);
    }
    if (statusDiv) statusDiv.textContent = 'שגיאה בשליפת ה-URL';
    return '';
  }

  // עדכון מונה הדפים שנשמרו בזיכרון התוסף
  function updateCounter() {
    chrome.storage.local.get({ mappedPages: [] }, (result) => {
      if (pageCounter) {
        pageCounter.textContent = `דפים שנשמרו: ${result.mappedPages.length}`;
      }
    });
  }

  // חיבור 3 רמות היררכיית ה-site מתוך תיבות הטקסט (מפריד ' > ')
  function getSiteHierarchy() {
    const s1 = document.getElementById('site1')?.value.trim() || '';
    const s2 = document.getElementById('site2')?.value.trim() || '';
    const s3 = document.getElementById('site3')?.value.trim() || '';

    return [s1, s2, s3].filter(Boolean).join(' > ');
  }

  // הרצה ראשונית של התצוגה והמונה בטעינה
  getActiveTabPath();
  updateCounter();

  // 1. שמירת/עדכון הדף הנוכחי ב-JSON
  if (scanBtn) {
    scanBtn.addEventListener('click', async () => {
      // שליפת ה-path המעודכן ביותר ממש ברגע בלחיצה
      const currentPath = await getActiveTabPath();

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

      // שמירה ב-chrome.storage.local תוך שילוב עם הרשימה הקיימת
      chrome.storage.local.get({ mappedPages: [] }, (result) => {
        let mappedPages = result.mappedPages;
        
        // בדיקה אם ה-path כבר קיים ברשימה
        const existingIndex = mappedPages.findIndex(p => p.path === currentPath);
        
        if (existingIndex > -1) {
          // עדכון רשומה קיימת
          mappedPages[existingIndex] = pageData;
        } else {
          // הוספת רשומה חדשה לרשימה
          mappedPages.push(pageData);
        }

        chrome.storage.local.set({ mappedPages: mappedPages }, () => {
          updateCounter();
          alert(`הדף '${currentPath}' נשמר/עודכן בהצלחה! (סה"כ נשמרו: ${mappedPages.length})`);
        });
      });
    });
  }

  // 2. ייצוא לקובץ JSON עם קידוד UTF-8 תקין לעברית (BOM)
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      chrome.storage.local.get({ mappedPages: [] }, (result) => {
        if (result.mappedPages.length === 0) {
          alert("אין דפים שמורים לייצוא.");
          return;
        }

        const jsonString = JSON.stringify(result.mappedPages, null, 2);
        
        // הוספת BOM (\uFEFF) למניעת בעיות תצוגת עברית ב-Windows / Notepad
        const blob = new Blob(["\uFEFF" + jsonString], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", "meyazeg_site_map.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        
        // ניקוי המשאב מהזיכרון
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
