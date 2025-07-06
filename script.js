

let words = [];

let currentWord = null;

let currentDirection = 'hebrew';

let totalSuccesses = parseInt(localStorage.getItem("totalSuccesses") || "0");

let totalFailures = parseInt(localStorage.getItem("totalFailures") || "0");

let previousWord = null;

let dailyPracticeLog = {};

let globalSuccessStreak = 0;






function loadWordsFromStorage() {
  words = JSON.parse(localStorage.getItem("words") || "[]");
}

function saveWordsToStorage() {
  localStorage.setItem("words", JSON.stringify(words));
}





window.onload = () => {
    loadDailyPracticeLog();
    showSection("about");
    loadWordsFromStorage();
    renderWordList();
    renderStats();
    renderAchievements()
}


setInterval(() => {
  checkForNewAchievements();
}, 1000);




function saveWords() {
    saveWordsToStorage();
    renderStats();
}













function addWord(event) {

    event.preventDefault();

    const heb = document.getElementById("hebrew-word").value.trim();
    const arb = document.getElementById("arabic-word").value.trim();
    const lvl = parseInt(document.getElementById("word-level").value);
    const folder = document.getElementById("word-folder").value.trim();


    if (heb && arb) {
        words.push({     hebrew: heb,
            arabic: arb,
            level: lvl,
            history: [],
           folder: folder || "כללי" ,  // אם לא נכתב כלום "כללי"  
                   order: Date.now(),
                   createdAt: new Date().toISOString(),   // תיעוד זמן הוספה
              lastPracticedAt: null                  // עדיין לא תורגל
 });
        saveWords();
        renderWordList();
        renderFolderFilter();
        event.target.reset();
    }
}












function renderWordList(openFoldersOverride) {
    const container = document.getElementById("word-list");
    if (!container) return;

    // 🧠 שלב 1: טעינת המילים מהאחסון
    loadWordsFromStorage();

    // 📂 שלב 2: שמירת סטטוס פתיחה של תיקיות (אם לא סופק override)
    const openFolders = openFoldersOverride || new Set();
    if (!openFoldersOverride) {
        document.querySelectorAll("#word-list details[open]").forEach(d => {
            const folderName = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
            if (folderName) openFolders.add(folderName);
        });
    }

    container.innerHTML = "";

    // 📁 שלב 3: קיבוץ מילים לפי תיקייה
    const folders = {};
    words.forEach(word => {
        const folderName = word.folder || "כללי";
        if (!folders[folderName]) folders[folderName] = [];
        folders[folderName].push(word);
    });

    // 🔄 שלב 4: יצירת תצוגה עבור כל תיקייה
    Object.entries(folders).forEach(([folderName, folderWords]) => {
        // ✨ מיון לפי סדר – אם יש שדה order
        folderWords.sort((a, b) => {
            if (a.order != null && b.order != null) {
                return a.order - b.order;
            }
            return 0;
        });

        const details = document.createElement("details");

        // ✅ הפיכת התיקייה ליעד גרירה לשינוי תיקייה
        details.ondragover = (e) => e.preventDefault();
        details.ondrop = (e) => {
            e.preventDefault();
            const [heb, arb] = e.dataTransfer.getData("text/plain").split("|");

            words = words.map(item => {
                if (item.hebrew === heb && item.arabic === arb) {
                    return { ...item, folder: folderName === "כללי" ? null : folderName };
                }
                return item;
            });

            saveWordsToStorage();

            // שמירת סטטוס פתיחה והצגה מחדש
            const openFoldersNow = new Set();
            document.querySelectorAll("#word-list details[open]").forEach(d => {
                const name = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
                if (name) openFoldersNow.add(name);
            });

            renderWordList(openFoldersNow);
        };

        if (openFolders.has(folderName)) details.open = true;

        // 🏷️ שלב 5: כותרת תיקייה
const summary = document.createElement("summary");
summary.style.display = "flex";
summary.style.alignItems = "center";
summary.style.gap = "10px";
summary.style.fontWeight = "bold";
summary.style.fontSize = "1.1em";
summary.style.cursor = "pointer";

// צ'קבוקס תיקייה
const folderCheckbox = document.createElement("input");
folderCheckbox.type = "checkbox";
folderCheckbox.title = "בחר/הסר את כל המילים בתיקייה זו";

// פעולה: סימון/ביטול כל תיבות הסימון שבתיקייה
folderCheckbox.onchange = () => {
    const checkboxes = details.querySelectorAll("input.word-checkbox");
    checkboxes.forEach(cb => cb.checked = folderCheckbox.checked);
};

// טקסט התיקייה
const folderLabel = document.createElement("span");
folderLabel.textContent = `📂 ${folderName} (${folderWords.length} מילים)`;

// שינוי רקע בהובר
summary.onmouseover = () => summary.style.backgroundColor = "#f7f7f7";
summary.onmouseout = () => summary.style.backgroundColor = "";

// הרכבת הסיכום
summary.appendChild(folderCheckbox);
summary.appendChild(folderLabel);


        summary.onmouseover = () => summary.style.backgroundColor = "#f7f7f7";
        summary.onmouseout = () => summary.style.backgroundColor = "";

        details.appendChild(summary);

        // ✏️ שלב 6: כפתור עריכת שם תיקייה - מעל רשימת המילים!
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "flex-end";
        header.style.margin = "5px 0 10px 0";

        const renameBtn = document.createElement("button");
        renameBtn.textContent = "📝 ערוך שם תיקייה";
        renameBtn.style.fontSize = "0.8em";
        renameBtn.onclick = () => {
            const newName = prompt("הכנס שם תיקייה חדש:", folderName);
            if (newName && newName !== folderName) {
                words = words.map(w => {
                    if ((w.folder || "כללי") === folderName) {
                        return { ...w, folder: newName === "כללי" ? null : newName };
                    }
                    return w;
                });
                saveWordsToStorage();
                renderWordList(openFolders);
            }
        };
        header.appendChild(renameBtn);
        details.appendChild(header);

        // 📋 שלב 7: יצירת רשימת מילים עם תמיכה בגרירה לשינוי סדר
        const ul = document.createElement("ul");
        let draggedIndex = null;

        folderWords.forEach((w, index) => {
            const li = document.createElement("li");
            li.style.border = "1px solid #ccc";
            li.style.padding = "6px";
            li.style.marginBottom = "8px";
            li.style.borderRadius = "8px";
            li.onmouseover = () => li.style.backgroundColor = "#f7f7f7";
            li.onmouseout = () => li.style.backgroundColor = "";

            // הוסף זיהוי ייחודי למילה
            li.dataset.hebrew = w.hebrew;
            li.dataset.arabic = w.arabic;

            li.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span class="drag-handle" title="גרור מילה" style="cursor: grab;">⠿</span>
                  <input type="checkbox" class="word-checkbox">
                  ${w.hebrew} – <span class="arabic-text">${w.arabic}</span> (רמה ${w.level})
                </span>
                <span class="word-buttons"></span>
              </div>
            `;

            li.ondragover = (e) => e.preventDefault();

            li.ondrop = () => {
                if (draggedIndex === null || draggedIndex === index) return;

                const temp = folderWords[draggedIndex];
                folderWords.splice(draggedIndex, 1);
                folderWords.splice(index, 0, temp);

                // עדכן את מערך words הגלובלי עם סדר ה-order החדש
                folderWords.forEach((fw, i) => {
                    const wIndex = words.findIndex(w => w.hebrew === fw.hebrew && w.arabic === fw.arabic);
                    if (wIndex !== -1) {
                        words[wIndex].order = i + Date.now(); // אפשר גם רק i
                    }
                });

                saveWordsToStorage();

                const openFoldersNow = new Set();
                document.querySelectorAll("#word-list details[open]").forEach(d => {
                    const name = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
                    if (name) openFoldersNow.add(name);
                });

                renderWordList(openFoldersNow);
            };

            const dragHandle = li.querySelector(".drag-handle");
            if (dragHandle) {
                dragHandle.draggable = true;

                dragHandle.ondragstart = (e) => {
                    draggedIndex = index;
                    li.style.opacity = "0.5";
                    e.dataTransfer.setData("text/plain", w.hebrew + "|" + w.arabic);
                };

                dragHandle.ondragend = () => {
                    draggedIndex = null;
                    li.style.opacity = "1";
                };
            }

            // 🗑️ שלב 8: כפתור מחיקה
            const delBtn = document.createElement("button");
            delBtn.textContent = "🗑️ מחיקה";
            delBtn.style.fontSize = "0.8em";
            delBtn.onclick = () => {
                const checkboxes = document.querySelectorAll("#word-list li input.word-checkbox");
                const checkedWords = [];
                checkboxes.forEach((box) => {
                    if (box.checked) {
                        const li = box.closest('li');
                        if (!li) return;
                        checkedWords.push({
                            hebrew: li.dataset.hebrew,
                            arabic: li.dataset.arabic
                        });
                    }
                });

                let newWords;
                if (checkedWords.length > 0) {
                    // מחיקה מרובה – כל המסומנים
                    newWords = words.filter(w =>
                        !checkedWords.some(cw => cw.hebrew === w.hebrew && cw.arabic === w.arabic)
                    );
                } else {
                    // מחיקת מילה אחת (אם לא סומן שום צ'ק בוקס)
                    newWords = words.filter(item => item !== w);
                }

                let wordsToDelete;
                if (checkedWords.length > 0) {
                    wordsToDelete = checkedWords.length;
                } else {
                    wordsToDelete = 1;
                }

                // הודעת אישור
                if (!confirm(`האם אתה בטוח שברצונך למחוק ${wordsToDelete} מיל${wordsToDelete === 1 ? "ה" : "ים"}? פעולה זו אינה ניתנת לשחזור!`)) {
                    return; // המשתמש ביטל
                }

                words = newWords; // עדכון גלובלי
                saveWordsToStorage();

                const openFoldersNow = new Set();
                document.querySelectorAll("#word-list details[open]").forEach(d => {
                    const name = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
                    if (name) openFoldersNow.add(name);
                });
                renderWordList(openFoldersNow);
            };

            // ✏️ שלב 9: כפתור עריכה
            const editBtn = document.createElement("button");
            editBtn.textContent = "✏️ עריכה";
            editBtn.style.fontSize = "0.8em";
            editBtn.onclick = () => {
                if (li.querySelector(".edit-row")) return;
                const editDiv = document.createElement("div");
                editDiv.className = "edit-row";
                editDiv.style.backgroundColor = "#dad6c8";
                editDiv.style.border = "1px solid #e0c97f";
                editDiv.style.borderRadius = "10px";
                editDiv.style.padding = "10px";
                editDiv.style.marginTop = "10px";
                editDiv.style.display = "flex";
                editDiv.style.alignItems = "center";
                editDiv.style.gap = "10px";
                editDiv.style.flexWrap = "wrap";

                const hebInput = document.createElement("input");
                hebInput.type = "text";
                hebInput.value = w.hebrew;
                hebInput.placeholder = "עברית";
                hebInput.style.padding = "6px";
                hebInput.style.flex = "1";

                const arbInput = document.createElement("input");
                arbInput.type = "text";
                arbInput.value = w.arabic;
                arbInput.placeholder = "ערבית";
                arbInput.style.padding = "6px";
                arbInput.style.flex = "1";

                const saveBtn = document.createElement("button");
                saveBtn.textContent = "💾 שמירה";
                saveBtn.style.fontSize = "0.8em";
                saveBtn.style.padding = "6px 12px";

                const cancelBtn = document.createElement("button");
                cancelBtn.textContent = "❌ ביטול";
                cancelBtn.style.fontSize = "0.8em";
                cancelBtn.style.padding = "6px 12px";

                saveBtn.onclick = () => {
                    const newHeb = hebInput.value.trim();
                    const newArb = arbInput.value.trim();
                    if (newHeb && newArb) {
                        w.hebrew = newHeb;
                        w.arabic = newArb;
                        saveWordsToStorage();
                        li.style.transition = "background-color 0.5s";
                        li.style.backgroundColor = "#d4edda";
                        setTimeout(() => {
                            li.style.backgroundColor = "";
                            const openFoldersNow = new Set();
                            document.querySelectorAll("#word-list details[open]").forEach(d => {
                                const name = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
                                if (name) openFoldersNow.add(name);
                            });
                            renderWordList(openFoldersNow);
                        }, 1200);
                    } else {
                        alert("נא למלא גם את השדה בעברית וגם את השדה בערבית.");
                    }
                };

                cancelBtn.onclick = () => editDiv.remove();

                [hebInput, arbInput].forEach(input => {
                    input.addEventListener("keydown", e => {
                        if (e.key === "Enter") saveBtn.onclick();
                        if (e.key === "Escape") cancelBtn.onclick();
                    });
                });

                editDiv.appendChild(hebInput);
                editDiv.appendChild(arbInput);
                editDiv.appendChild(saveBtn);
                editDiv.appendChild(cancelBtn);

                li.appendChild(editDiv);
            };

            // ⬇️ שלב 10: כפתור הורדת רמה
            const lowerLevelBtn = document.createElement("button");
            lowerLevelBtn.textContent = "⬇️ הורדת רמה";
            lowerLevelBtn.style.fontSize = "0.8em";
            lowerLevelBtn.onclick = () => {
                if (w.level > 1) {
                    w.level -= 1;
                    w.successStreak = 0;
                    w.failStreak = 0;
                    w.history = [];
                    saveWordsToStorage();
                    const openFoldersNow = new Set();
                    document.querySelectorAll("#word-list details[open]").forEach(d => {
                        const name = d.querySelector("summary")?.textContent?.replace(/^📂 /, "").split("(")[0]?.trim();
                        if (name) openFoldersNow.add(name);
                    });
                    renderWordList(openFoldersNow);
                } else {
                    alert("המילה כבר ברמה הנמוכה ביותר.");
                }
            };

            const buttonSpan = li.querySelector(".word-buttons");
            buttonSpan.appendChild(editBtn);
            buttonSpan.appendChild(delBtn);
            buttonSpan.appendChild(lowerLevelBtn);

            ul.appendChild(li);
        });

        details.appendChild(ul);

        container.appendChild(details);
    });
}







// חיפוש מילה

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("word-search-input");
  const searchBtn = document.getElementById("word-search-btn");
  if (searchBtn) {
    searchBtn.onclick = handleWordSearch;
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") handleWordSearch();
    });
  }
});

function handleWordSearch() {
  const query = document.getElementById("word-search-input").value.trim();
  if (!query) return;

  loadWordsFromStorage();

  // מצא את המילה (בעברית או בערבית)
  const found = words.find(w =>
    w.hebrew === query || w.arabic === query
  );
  if (!found) {
    alert("לא נמצאה מילה מתאימה.");
    return;
  }

  // פתח את התיקייה הרלוונטית
  const folderName = found.folder || "כללי";
  // מצא את ה-details של התיקייה ופתח אותו
  const allDetails = document.querySelectorAll("#word-list details");
  let detailsEl = null;
  allDetails.forEach(d => {
    const summary = d.querySelector("summary");
    if (summary && summary.textContent.includes(folderName)) {
      d.open = true;
      detailsEl = d;
    }
  });

  // מצא את ה-li של המילה בתוך התיקייה שפתחת
  if (detailsEl) {
    setTimeout(() => {
      const allLis = detailsEl.querySelectorAll("li");
      let targetLi = null;
      allLis.forEach(li => {
        // בדוק אם זה ה-li הנכון
        if (
          li.textContent.includes(found.hebrew) &&
          li.textContent.includes(found.arabic)
        ) {
          targetLi = li;
        }
      });

      if (targetLi) {
        // גלול אל המילה
        targetLi.scrollIntoView({ behavior: "smooth", block: "center" });

        // צבע את ה-li
        targetLi.classList.add("search-highlight");
        setTimeout(() => {
          targetLi.classList.remove("search-highlight");
        }, 5000);
      }
    }, 100); // שה־details יספיק להיפתח
  }
}













function importWordsFromJsonData(imported) {
  if (!Array.isArray(imported)) {
    alert("הקובץ אינו בפורמט תקין.");
    return;
  }

  const existingSet = new Set(words.map(w => w.hebrew + "|" + w.arabic));
  const newWords = imported.filter(w => {
    const key = w.hebrew + "|" + w.arabic;
    return !existingSet.has(key);
  });

  words = words.concat(newWords);
  saveWordsToStorage();

  alert("נוספו " + newWords.length + " מילים חדשות!");
  showSection("manage");
  renderWordList();
}



function importWords(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      importWordsFromJsonData(imported);
    } catch (err) {
      alert("התרחשה שגיאה בקריאת הקובץ: " + err.message);
    }
  };

  reader.readAsText(file);
}


function loadWordFile(url) {
  fetch(url)
    .then(res => res.json())
    .then(importWordsFromJsonData)
    .catch(() => alert("אירעה שגיאה בטעינת הקובץ."));
}











function exportWords() {

  const cleanWords = words.map(word => ({
  hebrew: word.hebrew,
  arabic: word.arabic,
  folder: word.folder,
  level: 1,
  history: [],
  order: word.order || Date.now()
}));

 // בקשת שם קובץ מהמשתמש
  const filename = prompt("הכנס שם לקובץ (ללא סיומת):", "words");
  if (!filename) return; // ביטול אם בוטל

  const blob = new Blob([JSON.stringify(cleanWords, null, 2)], { type: "application/json" });

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);

  a.download = filename + ".json";

  a.click();

}

















function exportSelectedWords() {
  loadWordsFromStorage(); // ודא שהגלובלי מעודכן

  const checkboxes = document.querySelectorAll("#word-list li input.word-checkbox");
  const selected = [];

  checkboxes.forEach((box, i) => {
    if (box.checked && words[i]) {
      selected.push({
        hebrew: words[i].hebrew,
        arabic: words[i].arabic,
        level: 1,
        history: [],
        folder: words[i].folder || undefined
      });
    }
  });

  if (selected.length === 0) {
    alert("לא נבחרו מילים לייצוא.");
    return;
  }

  // בקשת שם קובץ מהמשתמש
  const filename = prompt("הכנס שם לקובץ (ללא סיומת):", "selected_words");
  if (!filename) return;

  const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".json";
  a.click();
}













const practiceTaglines = [
  "התרגול עכשיו, התודה אחר כך",
  "רמה 6 שלך נראית לי קצת ריקה...",
  "חזרה קטנה - שליטה גדולה",
  "כאב זמני, ערבית לנצח",
  "מילים שאתה באמת צריך",
  "תרגול הוא כמו שווארמה: עדיף חם ובמנות קטנות",
  "הדרך לשליטה מלאה מתחילה כאן",
  "תרגל – ותן לזה זמן לשקוע"
];







function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";

    if (id === "stats") {
        renderStats();
    } else if (id === "manage") {
        renderWordList();
    } else if (id === "awards") {
        renderAchievements();
    } else if (id === "practice") {
  loadWordsFromStorage();
    // ✨ מילוי משפט רנדומלי בראש העמוד
    const randomTagline = practiceTaglines[Math.floor(Math.random() * practiceTaglines.length)];
    const taglineEl = document.querySelector(".practice-header .tagline");
    if (taglineEl) taglineEl.textContent = randomTagline;

    // ✨ מילוי תפריט תיקיות
    populateFolderFilter();

    // ✨ הצגת כפתור התחלה והוספת ריווח מותנה
    document.getElementById("start-button-container").style.display = "block";
    document.getElementById("folder-filter-container").classList.add("with-start-button");

    // ✨ הסתרת שדות תרגול
    document.getElementById("question-word").textContent = "";
    document.getElementById("answer-word").style.display = "none";
    document.getElementById("show-answer").style.display = "none";
    document.getElementById("response-buttons").style.display = "none";

 // ✨ הוספת אנימציה הדרגתית לתיבת התרגול
    const practiceBox = document.querySelector(".practice-box");
    practiceBox.classList.remove("visible"); // איפוס אם היה
    setTimeout(() => {
        practiceBox.classList.add("visible");
    }, 20);
}
    
}












function startPractice() {

loadWordsFromStorage();

    // הסתרת כפתור התחלה
    document.getElementById("start-button-container").style.display = "none";

    // הסרת ריווח מותנה
    document.getElementById("folder-filter-container").classList.remove("with-start-button");

    // איפוס תצוגה
    document.getElementById("answer-word").style.display = "none";
    document.getElementById("show-answer").style.display = "inline-block";
    document.getElementById("response-buttons").style.display = "none";

    // טעינת מילה חדשה
    loadNextWord();
}












function populateFolderFilter() {
  loadWordsFromStorage(); // ודא שהגלובלי מעודכן

  const folderSelect = document.getElementById("folder-filter");
  folderSelect.innerHTML = `<option value="">כל התיקיות</option>`;

  const folders = [...new Set(words.map(w => w.folder || "כללי"))];

  folders.forEach(folder => {
    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    folderSelect.appendChild(option);
  });
}









function chooseWordByLevel() {
  const weightsByLevel = {
    1: 0.28,
    2: 0.23,
    3: 0.19,
    4: 0.14,
    5: 0.10,
    6: 0.06
  };

  const selectedFolders = Array.from(document.getElementById("folder-filter").selectedOptions)
    .map(option => option.value);

  const filteredWords = words.filter(word => {
    if (selectedFolders.length === 0) return true;
  return selectedFolders.includes(word.folder || "כללי");
  });

  // ❗ תיקון: לא נשתמש במשתנה "words" מקומי
  let wordPool = filteredWords;

  if (previousWord && wordPool.length > 1) {
    wordPool = wordPool.filter(w =>
      !(w.hebrew === previousWord.hebrew && w.arabic === previousWord.arabic)
    );
  }

  if (wordPool.length === 0) return null;

// עדיפות מוחלטת למילים שטרם תורגלה
const neverPracticed = wordPool.filter(w => !w.lastPracticedAt);
if (neverPracticed.length > 0) {
  const chosen = neverPracticed[Math.floor(Math.random() * neverPracticed.length)];
  previousWord = chosen;
  return chosen;
}

  const levelGroups = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: []
  };

  wordPool.forEach(word => {
    if (word.level >= 1 && word.level <= 6) {
      levelGroups[word.level].push(word);
    }
  });

  const totalWordsCount = wordPool.length;
  const level1plus2 = wordPool.filter(w => w.level === 1 || w.level === 2).length;
  const level6count = wordPool.filter(w => w.level === 6).length;

  const useLevelMode = totalWordsCount >= 80 && level6count >= 2 * level1plus2;

  if (useLevelMode) {
    const levelWeights = Object.entries(weightsByLevel)
      .map(([lvl, w]) => ({ level: parseInt(lvl), weight: w }))
      .filter(entry => levelGroups[entry.level].length > 0);

    const totalLevelWeight = levelWeights.reduce((sum, entry) => sum + entry.weight, 0);
    let rand = Math.random() * totalLevelWeight;

    for (const entry of levelWeights) {
      rand -= entry.weight;
      if (rand <= 0) {
        const pool = levelGroups[entry.level];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        previousWord = chosen;
        return chosen;
      }
    }
  }

  const weightedWords = wordPool.map(word => ({
    word,
    weight: weightsByLevel[word.level] || 0
  })).filter(entry => entry.weight > 0);

  const totalWeight = weightedWords.reduce((sum, entry) => sum + entry.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const entry of weightedWords) {
    rand -= entry.weight;
    if (rand <= 0) {
      previousWord = entry.word;
      return entry.word;
    }
  }

  const last = weightedWords[weightedWords.length - 1];
  if (last) {
    previousWord = last.word;
    return last.word;
  }

  return null;
}






 // שמירת מידע כל תרגול יומי 

function loadDailyPracticeLog() {
  const raw = localStorage.getItem("dailyPracticeLog");
  dailyPracticeLog = raw ? JSON.parse(raw) : {};
}


function saveDailyPracticeLog() {
  localStorage.setItem("dailyPracticeLog", JSON.stringify(dailyPracticeLog));
}

function incrementTodayPracticeCount() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  dailyPracticeLog[today] = (dailyPracticeLog[today] || 0) + 1;

  // מחיקה של ימים ישנים – שמירה של 40 ימים אחרונים בלבד
  const days = Object.keys(dailyPracticeLog).sort(); // ממוין מהישן לחדש
  if (days.length > 40) {
    const excess = days.length - 40;
    for (let i = 0; i < excess; i++) {
      delete dailyPracticeLog[days[i]];
    }
  }

  saveDailyPracticeLog();
}





function renderFolderFilter() {
  loadWordsFromStorage(); // ודא שהגלובלי מעודכן
  const select = document.getElementById("folder-filter");
  select.innerHTML = ""; // נקה תפריט קודם

  // שלוף את כל התיקיות הייחודיות מה-words הגלובלי
  const uniqueFolders = [...new Set(words.map(w => w.folder).filter(f => f))];

  // הוסף אופציה אחת לכל תיקייה
  for (const folder of uniqueFolders) {
    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    select.appendChild(option);
  }
}




function loadNextWord() {
    // ✨ בחירת מילה לפי רמות שליטה וסינון תיקיות (כולל מניעת כפילויות מהופעה קודמת)
    currentWord = chooseWordByLevel();

    // אם לא נמצאה מילה מתאימה – מפסיקים (למשל אם אין מילים בתיקייה המסוננת)
    if (!currentWord) return;

    // ✨ קביעת כיוון התרגול לפי הבחירה של המשתמש בתפריט
    const dir = document.getElementById("direction-select").value;
    let q, a;

    if (dir === "hebrew") {
        // עברית → ערבית
        q = currentWord.hebrew;
        a = currentWord.arabic;
        currentDirection = "hebrew";
    } else if (dir === "arabic") {
        // ערבית → עברית
        q = currentWord.arabic;
        a = currentWord.hebrew;
        currentDirection = "arabic";
    } else {
        // כיוון אקראי – 50% עברית, 50% ערבית
        const flip = Math.random() < 0.5;
        if (flip) {
            q = currentWord.hebrew;
            a = currentWord.arabic;
            currentDirection = "hebrew";
        } else {
            q = currentWord.arabic;
            a = currentWord.hebrew;
            currentDirection = "arabic";
        }
    }

    // ✨ שליפת האלמנטים מה־DOM להצגת השאלה, תשובה וכפתורים
    const questionEl = document.getElementById("question-word");
    const answerEl = document.getElementById("answer-word");
    const buttonsEl = document.getElementById("response-buttons");
    const showAnswerBtn = document.getElementById("show-answer");

    // ✨ הצגת מילת השאלה בצורה הדרגתית (אנימציית Opacity)
    questionEl.style.opacity = "0";       // קודם כל הסתרה
    questionEl.textContent = q;           // עדכון הטקסט
    questionEl.style.display = "block";   // ווידוא שהאלמנט מוצג
    setTimeout(() => {
        questionEl.style.opacity = "1";   // הופעה הדרגתית
    }, 50);

    // ✨ הכנת התשובה – הסתרה + איפוס שקיפות
    answerEl.textContent = a;
    answerEl.style.display = "none";
    answerEl.style.opacity = "0";

    // ✨ הצגת כפתור "הצג תרגום"
    showAnswerBtn.style.display = "inline-block";

    // ✨ הסתרת כפתורי תגובה ("✔️ ידעתי" / "❌ לא ידעתי") עד לחשיפת התרגום
    buttonsEl.style.display = "none";
    buttonsEl.style.opacity = "0";
}

















function revealAnswer() {
    const answerEl = document.getElementById("answer-word");
    const buttonsEl = document.getElementById("response-buttons");

    // אפס שקיפות והצג
    answerEl.style.display = "block";
    answerEl.style.opacity = "0";

    buttonsEl.style.display = "block";
    buttonsEl.style.opacity = "0";

    // העלה בהדרגה
    setTimeout(() => {
        answerEl.style.opacity = "1";
        buttonsEl.style.opacity = "1";
    }, 50);
}












function submitAnswer(success) {
    if (!currentWord.history) currentWord.history = [];
    currentWord.history.push(success);
       incrementTodayPracticeCount();
// ✅ עדכון רצף הצלחות גלובלי
if (success) {
  globalSuccessStreak++;
} else {
  globalSuccessStreak = 0;
}

// ✅ שמירת שיא הצלחות רצופות
let maxSuccessStreak = parseInt(localStorage.getItem("maxSuccessStreak") || "0");
if (globalSuccessStreak > maxSuccessStreak) {
  localStorage.setItem("maxSuccessStreak", globalSuccessStreak);
}

    if (currentWord.history.length > 3) currentWord.history.shift();

    const recent = currentWord.history.slice(-3);
    const level = currentWord.level;

    let leveledUpTo6 = false;

    // ✅ קידום לרמה הבאה אם 3 הצלחות רצופות
    if (recent.length === 3 && recent.every(x => x) && level < 6) {
        currentWord.level++;
        currentWord.history = [];

        if (currentWord.level === 6) {
            leveledUpTo6 = true;
        }
    } 
    
    // ✅ הורדת רמה לפי הכללים:
    else if (
        (level === 6 && recent.slice(-1)[0] === false)  // ברמה 6 – טעות אחת
    ) {
        currentWord.level = 4;
        currentWord.history = [];
    } else if (
        (level === 5 && recent.slice(-1)[0] === false) ||  // ברמה 5 – טעות אחת
        (level < 5 && recent.length >= 2 && recent.slice(-2).every(x => x === false))  // ברמות 1–4 – שתי טעויות רצופות
    ) {
        currentWord.level = Math.max(1, currentWord.level - 1);
        currentWord.history = [];
    }

    // ✅ עדכון המילה גם במערך words לפני שמירה
    const index = words.findIndex(w =>
        w.hebrew === currentWord.hebrew && w.arabic === currentWord.arabic
    );
   if (index !== -1) {
    // עדכון תאריך תרגול אחרון
    words[index] = { ...currentWord, lastPracticedAt: new Date().toISOString() };
}

    // ✅ אפקט גרפי אם עלתה לרמה 6
    if (leveledUpTo6) {
        const wordDisplay = document.getElementById("question-word");

        const effectContainer = document.createElement("div");
        effectContainer.className = "level-up-container";

        const star = document.createElement("div");
        star.className = "level-up-star";
        star.textContent = "⭐";

        const message = document.createElement("div");
        message.className = "level-up-message";
        message.textContent = "שליטה מלאה! המילה עלתה לרמה 6!";

        effectContainer.appendChild(star);
        effectContainer.appendChild(message);
        wordDisplay.parentNode.appendChild(effectContainer);

        setTimeout(() => {
            effectContainer.remove();
        }, 3000);
    }

    // ✅ עדכון סטטיסטיקות כלליות
  if (success) {
    totalSuccesses++;
} else {
    totalFailures++;
}
localStorage.setItem("totalSuccesses", totalSuccesses);
localStorage.setItem("totalFailures", totalFailures);
    saveWords();
    loadNextWord();
    }











const achievements = [
  {
    id: "award1",
    revealedTitle: "33 המילים הראשונות שלי :)",
    coveredTitle: "צברו 33 מילים בעמוד ניהול המילים",
    description:"במסורת המוסלמית משתמשים בסֻבְּחָה, מחרוזת תפילה, לחזרה על אמירות של שבח והודיה 33 פעמים.<br> כל כל חרוז מסמל רגע של כוונה, והתמדה.<br> גם אתם עכשיו כמו הסבחה, יצרתם שרשרת של 33 פעולות רצופות.",
    image: "images/SHARSHERET.png",
    isUnlocked: () => words.length >= 33
  },
  {
    id: "award2",
    revealedTitle: "100 הצלחות",
    coveredTitle: "הגיעו ל-100 הצלחות בתרגול",
    description: "הגעת למאה הצלחות בעמוד התרגול! <br> זה יפה, זה נחמד, זו התחלה! אך כבר אמרו רבותינו כי: ''אינו דומה שונה פרקו מאה פעמים לשונה פרקו מאה ואחד''.<br>אז קדימה לעבודה!",
    image: "images/MADBEKA.png",
    isUnlocked: () => parseInt(localStorage.getItem("totalSuccesses") || "0") >= 100
  },
  {
    id: "award3",
    revealedTitle: "50 מילים ברמה 6!",
    coveredTitle: "50 מילים ברמה 6 והפרס שלכם",
    description: "ברגע שתינוק צובר כ-50 מילים, לרוב סביב גיל שנה וחצי, מתרחש ''פרץ לקסיקלי'' – תקופה של האצה מהירה מאוד בלמידת מילים, ולאחריה מופיעים לרוב חיבורים של שתי מילים כמו:<br> אבא הלך, עוד אוכל, לא רוצה.<br> אילו מילים אתם כבר יודעים לחבר?",
    image: "images/MATARA1.png",
    isUnlocked: () => words.filter(w => w.level === 6).length >= 13
  },
  {
 id: "award4",
    revealedTitle: "דגל מתרגלים יומיים 😏",
    coveredTitle: "פרס לאנשים שמתרגלים כל יום",
    description: "תרגלתם את הערבית שלכם במשך 7 ימים ללא דילוגים!<br> דגל המתרגלים היומיים שלכם בצדק,<br> זו הדרך הנכונה להצלחה.",
    image: "images/FLAG.png",
    isUnlocked: () => has7DayStreak()
  },
  {
 id: "award5",
    revealedTitle: "102 הצלחות רצופות",
    coveredTitle: "פרס למי שלעולם לא טועה (טוב, כמעט)",
    description: "וואו! 102 הצלחות רצופות ללא טעות!<br> הידעת? <br> 102 הוא המספר האטומי של נובליום - חומר רדיואקטיבי! <br> חומר נדיר ומלא עוצמה אך זמני ומתכלה... <br><br> תוכלו לשבור את השיא של עצמכם? השיא האישי מופיע בעמוד הסטטיסטיקה",
    image: "images/NO.png",
    isUnlocked: () => {
    const streak = parseInt(localStorage.getItem("maxSuccessStreak") || "0");
    return streak >= 102;
      }
  },
{
 id: "award6",
    revealedTitle: "250 טעויות",
    coveredTitle: "???????",
    description: "אין למידה בלי טעות, ואין התקדמות בלי אומץ לטעות... <br> אשריכם שזכיתם בפרס יוקרתי זה. <br> מי ייתן ותזכו לעוד אלפי טעויות במסע הלימוד שלכם.",
    image: "images/YAEN.png",
    isUnlocked: () => totalFailures >= 250
  },
{
 id: "award7",
    revealedTitle: "גביע עין הנץ",
    coveredTitle: "מעל 2500 תרגולים עם 93% אחוזי הצלחה",
    description: "אין למידה בלי טעות, ואין התקע הלימוד שלכם.",
    image: "images/cup.png",
    isUnlocked: () => totalFailures >= 250
  },
{
 id: "award8",
    revealedTitle: "250 טעויות",
    coveredTitle: "אוצר של מילים",
    description: "אין למידה בלי טעות, ואין התקדמות בלי אומץ לטעות... <br> אשריכם שזכיתם בפרס יוקרתי זה. <br> מי ייתן ותזכו לעוד אלפי טעויות במסע הלימוד שלכם.",
    image: "images/YAEN.png",
    isUnlocked: () => totalFailures >= 250
  },
{
 id: "award9",
    revealedTitle: "250 טעויות",
    coveredTitle: "???????",
    description: "אין למידה בלי טעות, ואין התקדמות בלי אומץ לטעות... <br> אשריכם שזכיתם בפרס יוקרתי זה. <br> מי ייתן ותזכו לעוד אלפי טעויות במסע הלימוד שלכם.",
    image: "images/YAEN.png",
    isUnlocked: () => totalFailures >= 250
  },
{
 id: "award10",
    revealedTitle: "250 טעויות",
    coveredTitle: "???????",
    description: "אין למידה בלי טעות, ואין התקדמות בלי אומץ לטעות... <br> אשריכם שזכיתם בפרס יוקרתי זה. <br> מי ייתן ותזכו לעוד אלפי טעויות במסע הלימוד שלכם.",
    image: "images/YAEN.png",
    isUnlocked: () => totalFailures >= 250
  }

];








function getUnlockedAchievementsCount() {
  const unlocked = JSON.parse(localStorage.getItem("unlockedRewards") || "[]");
  return unlocked.length;
}






function has7DayStreak(minPerDay = 10) {
  if (localStorage.getItem("streak7Unlocked") === "true") {
    return true;
  }

  const log = JSON.parse(localStorage.getItem("dailyPracticeLog") || "{}");

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if ((log[key] || 0) < minPerDay) {
      return false;
    }
  }

  // ✅ הצלחה – נשמור בזיכרון לצמיתות
  localStorage.setItem("streak7Unlocked", "true");
  return true;
}








function renderStats() {
    const container = document.getElementById("stats-container");

    const levels = [0, 0, 0, 0, 0, 0];

    words.forEach(w => {
        if (w.level >= 1 && w.level <= 6) {
            levels[w.level - 1]++;
        }
    });

    const total = totalSuccesses + totalFailures;
    const rate = total ? Math.round((totalSuccesses / total) * 100) : 0;
       const unlockedCount = getUnlockedAchievementsCount();


    container.innerHTML = `

        <p><span style="font-size: 1.2em;">📌 מספר הצמדים הכולל: <strong>${words.length}</strong></span></p>
        <ul>
            ${levels.map((n, i) => `<li>רמה ${i + 1}: ${n}</li>`).join("")}
        </ul>
        <p>🎯 הצלחות: <strong>${totalSuccesses}</strong> | טעויות: <strong>${totalFailures}</strong></p>
             <p>🔥 שיא הצלחות רצופות: <strong>${localStorage.getItem("maxSuccessStreak") || 0}</strong></p>
             <p>✅ אחוז הצלחה כולל: <strong>${rate}%</strong></p>
        <p>🏆 מספר פרסים שהושגו: <strong>${unlockedCount}</strong></p>

    `;
}














function renderAchievements() {
  loadWordsFromStorage(); // ודא שהגלובלי מעודכן
  const container = document.getElementById("awards-container");
  container.innerHTML = ""; // ניקוי קודם

  const unlocked = JSON.parse(localStorage.getItem("unlockedRewards") || "[]");

  achievements.forEach(award => {
    const alreadyUnlocked = unlocked.includes(award.id);
    const currentlyEligible = award.isUnlocked();
    const achieved = alreadyUnlocked || currentlyEligible;

    // אם זה עדיין לא היה ברשימת unlocked אבל זכאי עכשיו – הוסף
    if (currentlyEligible && !alreadyUnlocked) {
      unlocked.push(award.id);
      localStorage.setItem("unlockedRewards", JSON.stringify(unlocked));
    }

    const card = document.createElement("div");
    card.className = "award-card";
    card.style.opacity = achieved ? "1" : "0.25";

    const imageSrc = achieved ? award.image : "images/QM.png";
    const title = achieved ? award.revealedTitle : award.coveredTitle;

    card.innerHTML = `
      <img src="${imageSrc}" alt="${title}" class="award-image">
      <p class="award-title">${title}</p>
      ${achieved ? `<p class="award-desc">${award.description}</p>` : ""}
    `;

    container.appendChild(card);
  });
}











function checkForNewAchievements() {
  const unlocked = JSON.parse(localStorage.getItem("unlockedRewards") || "[]");
  let updated = false;

  achievements.forEach(a => {
    if (!unlocked.includes(a.id) && a.isUnlocked()) {
      unlocked.push(a.id);
      localStorage.setItem("unlockedRewards", JSON.stringify(unlocked));
      showRewardPopup(a); // 🎉 תציג את הפרס!
      updated = true;
    }
  });

 // עדכון רק אם נוספו פרסים חדשים
  if (updated) {
    localStorage.setItem("unlockedRewards", JSON.stringify([...unlocked]));
  }

  return updated;
}















function showRewardPopup(achievement) {
  document.getElementById("reward-image").src = achievement.image;
  document.getElementById("reward-title").innerHTML = achievement.revealedTitle;
  document.getElementById("reward-description").innerHTML = achievement.description;
  document.getElementById("reward-popup").style.display = "flex";
}

function hideRewardPopup() {
  document.getElementById("reward-popup").style.display = "none";
}










document.addEventListener("DOMContentLoaded", function () {
  const genBtn = document.getElementById("generate-sentence-btn");
  if (genBtn) {
    genBtn.onclick = generateSentenceFromWords;
  }
});

async function generateSentenceFromWords() {
  loadWordsFromStorage();
  const lang = document.getElementById("sentence-lang").value;
  const allHeb = words.map(w => w.hebrew).filter(Boolean);
  const allArb = words.map(w => w.arabic).filter(Boolean);

  const vocab = (lang === "ar" ? allArb : allHeb);
  const promptLang = (lang === "ar" ? "בערבית" : "בעברית");

  if (vocab.length < 3) {
    document.getElementById("generated-sentence").textContent = "צריך לפחות 3 מילים.";
    return;
  }

  const userPrompt = `צור משפט ${promptLang} תקני, אך ורק מהמילים הבאות ברשימה (אפשר לחזור על מילים):\n${vocab.join(", ")}`;

  const apiKey = "PASTE_YOUR_OPENAI_KEY_HERE"; // ← כאן שים את ה־API KEY שלך
  document.getElementById("generated-sentence").textContent = "מייצר משפט...";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: "אתה בונה משפטים הגיוניים אך ורק מתוך אוצר מילים מוגבל."},
          {role: "user", content: userPrompt}
        ],
        temperature: 0.7,
        max_tokens: 40
      })
    });

    const data = await response.json();
    let msg = "לא נוצר משפט, נסה שוב או בדוק את ה־API KEY.";
    if (data.choices && data.choices.length > 0) {
      msg = data.choices[0].message.content.trim();
    }
    document.getElementById("generated-sentence").textContent = msg;
  } catch (err) {
    document.getElementById("generated-sentence").textContent = "אירעה שגיאה: " + err.message;
  }
}