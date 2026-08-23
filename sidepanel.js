// sidepanel.js - רץ בתוך חלון הצד (Side Panel)

// 1. סריקת הדף הנוכחי והצגת מידע
async function scanCurrentPage() {
  const statusDiv = document.getElementById("status");
  const aiDiv = document.getElementById("aiResponse");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    if (statusDiv) statusDiv.innerText = "לא נמצאה כרטיסייה פעילה.";
    return;
  }

  // שליחת הודעה ל-content.js בדף
  chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTEXT" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      if (statusDiv) statusDiv.innerText = "אנא גלוש לאתר המייצגים (meyazegs.btl.gov.il)";
      if (aiDiv) aiDiv.innerText = "התוסף פועל רק בתוך אתר המייצגים.";
      return;
    }

    if (statusDiv) {
      statusDiv.innerHTML = `<b>דף:</b> ${response.mainHeader || response.title || response.pathname}`;
    }

    if (aiDiv) {
      if (response.errors && response.errors.length > 0) {
        aiDiv.innerHTML = `⚠️ <b>זוהתה שגיאה בדף:</b><br>${response.errors.join("<br>")}`;
      } else if (response.hasTable) {
        aiDiv.innerHTML = "💡 <b>טיפ:</b> מופיעה טבלה במסך. ניתן לייצא אותה לאקסל באמצעות כפתור <b>'אקסל'</b> בתחתית הטבלה.";
      } else {
        aiDiv.innerHTML = "זיהיתי שאתה בדף הראשי. כדי להתחיל, לחץ על <b>'חיפוש מתקדם'</b> ולאחר מכן <b>'חפש'</b>.";
      }
    }
  });

  updatePageCounter();
}

// 2. עדכון מונה הדפים שהוקלטו עד כה
function updatePageCounter() {
  const counterDiv = document.getElementById("pageCounter");
  if (!counterDiv) return;

  chrome.storage.local.get({ mappedPages: [] }, (result) => {
    counterDiv.innerText = `דפים שהוקלטו למיפוי: ${result.mappedPages.length}`;
  });
}

// 3. ייצוא קובץ JSON של כל הדפים שהוקלטו
function exportMapJSON() {
  chrome.storage.local.get({ mappedPages: [] }, (result) => {
    if (result.mappedPages.length === 0) {
      alert("טרם הוקלטו דפים. גלוש באתר המייצגים כדי לאסוף דפים.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.mappedPages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "meyazeg_pages_map.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });
}

// 4. איפוס רשימת הדפים המוקלטים
function clearMapData() {
  if (confirm("האם אתה בטוח שברצונך לאפס את כל הנתונים שהוקלטו?")) {
    chrome.storage.local.set({ mappedPages: [] }, () => {
      updatePageCounter();
      alert("רשימת הדפים אופסה בהצלחה.");
    });
  }
}

// חיבור אירועים לכפתורים במידה וקיימים ב-HTML
document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (scanBtn) scanBtn.addEventListener("click", scanCurrentPage);
  if (exportBtn) exportBtn.addEventListener("click", exportMapJSON);
  if (clearBtn) clearBtn.addEventListener("click", clearMapData);

  scanCurrentPage();
});
