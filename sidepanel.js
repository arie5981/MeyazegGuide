document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const scanBtn = document.getElementById('scanBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const pageCounter = document.getElementById('pageCounter');

  let currentPath = '';

  // חילוץ שם הקובץ בלבד מתוך ה-URL
  function extractCleanPath(urlStr) {
    try {
      const urlObj = new URL(urlStr);
      const filename = urlObj.pathname.split('/').pop(); // לוקח את החלק האחרון בנתיב
      return filename.replace(/\.aspx$/i, ''); // מסיר את הסיומת .aspx
    } catch (e) {
      return '';
    }
  }

  // טעינת ה-URL של הכרטיסייה הפעילה
  async function updateActiveTabInfo() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      currentPath = extractCleanPath(tab.url);
      statusDiv.textContent = currentPath ? `path: ${currentPath}` : 'לא פתוח בדף המייצגים';
    }
  }

  // עדכון מונה הדפים בזיכרון
  function updateCounter() {
    chrome.storage.local.get({ mappedPages: [] }, (result) => {
      pageCounter.textContent = `דפים שנשמרו: ${result.mappedPages.length}`;
    });
  }

  updateActiveTabInfo();
  updateCounter();

  // עריכת היררכיית ה-site מתוך 3 השדות
  function getSiteHierarchy() {
    const s1 = document.getElementById('site1').value.trim();
    const s2 = document.getElementById('site2').value.trim();
    const s3 = document.getElementById('site3').value.trim();

    return [s1, s2, s3].filter(Boolean).join(' > ');
  }

  // לחיצה על כפתור שמירה
  scanBtn.addEventListener('click', async () => {
    if (!currentPath) {
      alert('לא ניתן לחלץ path מכתובת זו.');
      return;
    }

    const site = getSiteHierarchy();
    const mainHeader = document.getElementById('mainHeader').value.trim();
    const searchText = document.getElementById('searchText').value.trim();

    const pageData = {
      site: site,
      mainHeader: mainHeader,
      searchText: searchText,
      path: currentPath
    };

    // שמירה ב-chrome.storage.local
    chrome.storage.local.get({ mappedPages: [] }, (result) => {
      const mappedPages = result.mappedPages;
      
      // עדכון במידה וה-path כבר קיים, או הוספת חדש
      const existingIndex = mappedPages.findIndex(p => p.path === currentPath);
      if (existingIndex > -1) {
        mappedPages[existingIndex] = pageData;
      } else {
        mappedPages.push(pageData);
      }

      chrome.storage.local.set({ mappedPages }, () => {
        updateCounter();
        alert(`הדף ${currentPath} שנשמר בהצלחה!`);
      });
    });
  });

  // ייצא לקובץ JSON
  exportBtn.addEventListener('click', () => {
    chrome.storage.local.get({ mappedPages: [] }, (result) => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.mappedPages, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "meyazeg_site_map.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  });

  // איפוס
  clearBtn.addEventListener('click', () => {
    if (confirm('האם למחוק את כל הדפים שנשמרו?')) {
      chrome.storage.local.set({ mappedPages: [] }, () => {
        updateCounter();
      });
    }
  });
});
