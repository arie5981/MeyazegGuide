// sidepanel.js

async function scanCurrentPage() {
  const statusDiv = document.getElementById("status");
  const aiDiv = document.getElementById("aiResponse");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    statusDiv.innerText = "לא נמצאה כרטיסייה פעילה.";
    return;
  }

  // שליחת הודעה ל-content.js בדף
  chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTEXT" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      statusDiv.innerText = "אנא גלוש לאתר המייצגים (meyazegs.btl.gov.il)";
      aiDiv.innerText = "התוסף פועל רק בתוך אתר המייצגים.";
      return;
    }

    statusDiv.innerHTML = `<b>כתובת:</b> ${response.url}`;

    if (response.errors && response.errors.length > 0) {
      aiDiv.innerHTML = `⚠️ <b>זוהתה שגיאה בדף:</b><br>${response.errors.join("<br>")}`;
    } else if (response.hasTable) {
      aiDiv.innerHTML = "💡 <b>טיפ:</b> מופיעה טבלה במסך. ניתן לייצא אותה לאקסל באמצעות כפתור <b>'אקסל'</b> בתחתית הטבלה.";
    } else {
      aiDiv.innerHTML = "זיהיתי שאתה בדף הראשי. כדי להתחיל, לחץ על <b>'חיפוש מתקדם'</b> ולאחר מכן <b>'חפש'</b>.";
    }
  });
}

document.getElementById("scanBtn").addEventListener("click", scanCurrentPage);
scanCurrentPage();