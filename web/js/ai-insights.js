// 🧠 מערכת תובנות AI - מחוברת לשרת אמיתי
let aiData = {};
const API_BASE = "http://localhost:5000";

// 🚀 אתחול הדף
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🧠 מאתחל דף תובנות AI...");

  // המתנה ל-auth.js
  const authReady = await waitForAuth();
  if (!authReady) {
    showLoginScreen();
    return;
  }

  console.log("🔍 Auth מוכן, בודק משתמש...");

  if (window.authModule?.currentUser()) {
    console.log("✅ משתמש נמצא:", window.authModule.currentUser().email);
    const user = window.authModule.currentUser();
    const isAuthorized = await checkUserAuthorization(user.email);
    console.log("🔐 בדיקת הרשאה:", isAuthorized);

    if (isAuthorized) {
      console.log("🚀 הרשאה אושרה, מתחיל...");
      showMainApp();
      await initAIPage();
    } else {
      showAccessDenied();
    }
  } else {
    console.log("❌ אין משתמש מחובר");
    showLoginScreen();
  }
});

// ⏳ המתנה לauth
async function waitForAuth() {
  let attempts = 0;
  while (
    (!window.authModule || !window.authModule?.currentUser()) &&
    attempts < 100
  ) {
    console.log(`⏳ ממתין... ניסיון ${attempts + 1}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }

  if (attempts >= 100) {
    console.error("❌ Timeout - auth לא נטען בזמן");
    return false;
  }

  console.log("✅ Auth נטען בהצלחה!");
  return true;
}

// 🔐 בדיקת הרשאה
async function checkUserAuthorization(email) {
  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from("authorized_users")
      .select("email")
      .eq("email", email)
      .single();

    return !error && data;
  } catch (error) {
    console.error("שגיאה בבדיקת הרשאה:", error);
    return false;
  }
}

// 📱 הצגת מסכים
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("main-app").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
}

function showAccessDenied() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-app").style.display = "none";
  document.getElementById("access-denied").style.display = "block";
}

function showMainApp() {
  console.log("📱 מציג אפליקציה ראשית...");
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("main-app").style.display = "block";

  // יצירת כותרת עם ניווט
  const headerContainer = document.getElementById("header-container");
  if (headerContainer && window.navbarModule) {
    headerContainer.innerHTML = window.navbarModule.createHeader(
      "מערכת ניהול פיננסי",
      window.authModule.currentUser(),
      "ai-insights"
    );
  }
}

// 🚀 אתחול דף AI
async function initAIPage() {
  try {
    console.log("🤖 מאתחל מערכת AI...");

    // בדיקת חיבור לשרת
    await checkServerConnection();

    // טעינת נתוני AI
    await loadAIStats();
    await loadSuggestions();
    await loadNewBusinesses();

    // הגדרת event listeners
    setupEventListeners();
    await checkTrainingStatus();

    // הצגת התוכן
    document.getElementById("loading").style.display = "none";
    document.getElementById("ai-content").style.display = "block";

    console.log("✅ דף AI אותחל בהצלחה");
  } catch (error) {
    console.error("שגיאה באתחול דף AI:", error);
    showError("שגיאה בטעינת תובנות AI: " + error.message);
  }
}

// 🌐 בדיקת חיבור לשרת
async function checkServerConnection() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (data.status === "healthy") {
      console.log("✅ שרת AI מחובר ופעיל");
    } else {
      throw new Error("שרת לא פעיל");
    }
  } catch (error) {
    console.error("❌ שרת AI לא זמין:", error);
    throw new Error("לא ניתן להתחבר לשרת AI. וודא שהשרת רץ על localhost:5000");
  }
}

// 📊 טעינת סטטיסטיקות AI
async function loadAIStats() {
  try {
    console.log("📊 טוען סטטיסטיקות AI מהשרת...");

    const response = await fetch(`${API_BASE}/api/ai-stats`);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינה: ${response.status}`);
    }

    const stats = await response.json();

    // עדכון הממשק
    document.getElementById("ai-accuracy").textContent = stats.accuracy + "%";
    document.getElementById("ai-processed").textContent = stats.processed;
    document.getElementById("ai-learned").textContent = stats.learned;
    document.getElementById("ai-improvement").textContent =
      "+" + stats.improvement + "%";

    console.log("✅ סטטיסטיקות AI נטענו:", stats);
  } catch (error) {
    console.error("שגיאה בטעינת סטטיסטיקות:", error);
    showError("שגיאה בטעינת סטטיסטיקות: " + error.message);
  }
}

// 💡 טעינת הצעות שיפור
async function loadSuggestions() {
  try {
    console.log("💡 טוען הצעות שיפור מהשרת...");

    const response = await fetch(`${API_BASE}/api/ai-suggestions`);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינה: ${response.status}`);
    }

    const suggestions = await response.json();

    const container = document.getElementById("suggestions-list");
    if (suggestions.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666;">🎉 אין הצעות שיפור - הכל מסווג נכון!</p>';
    } else {
      container.innerHTML = suggestions
        .map(
          (suggestion) => `
        <div class="suggestion-item">
          <div class="suggestion-business">${suggestion.business}</div>
          <div class="suggestion-current">נוכחי: ${suggestion.current}</div>
          <div class="suggestion-recommended">מומלץ: ${suggestion.recommended}</div>
          <div class="suggestion-confidence">רמת ביטחון: ${suggestion.confidence}%</div>
          <div class="suggestion-actions">
            <button class="accept-btn" onclick="acceptSuggestion('${suggestion.business}', '${suggestion.recommended}')">
              ✅ אשר
            </button>
            <button class="reject-btn" onclick="rejectSuggestion('${suggestion.business}')">
              ❌ דחה
            </button>
          </div>
        </div>
      `
        )
        .join("");
    }

    console.log("✅ הצעות שיפור נטענו:", suggestions.length, "הצעות");
  } catch (error) {
    console.error("שגיאה בטעינת הצעות:", error);
    showError("שגיאה בטעינת הצעות: " + error.message);
  }
}

// 🔍 טעינת עסקים חדשים
async function loadNewBusinesses() {
  try {
    console.log("🔍 טוען עסקים חדשים מהשרת...");

    const response = await fetch(`${API_BASE}/api/new-businesses`);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינה: ${response.status}`);
    }

    const businesses = await response.json();

    const container = document.getElementById("new-businesses-list");
    if (businesses.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: #666;">📋 אין עסקים חדשים לסיווג</p>';
    } else {
      container.innerHTML = businesses
        .map(
          (business) => `
        <div class="new-business-item">
          <div class="business-info">
            <div class="business-name">${business.name}</div>
            <div class="business-amount">₪${business.amount}</div>
          </div>
          <div class="business-actions">
            <select class="category-select" id="category-${business.id}">
              <option value="${business.suggested}">${business.suggested} (מוצע)</option>
              <option value="מזון ומשקאות">מזון ומשקאות</option>
              <option value="תחבורה">תחבורה</option>
              <option value="קניות">קניות</option>
              <option value="בילוי ותרבות">בילוי ותרבות</option>
              <option value="בריאות">בריאות</option>
              <option value="שירותים">שירותים</option>
              <option value="שונות">שונות</option>
            </select>
            <button class="approve-btn" onclick="approveBusiness('${business.name}', ${business.id})">
              ✅ אשר
            </button>
          </div>
        </div>
      `
        )
        .join("");
    }

    console.log("✅ עסקים חדשים נטענו:", businesses.length, "עסקים");
  } catch (error) {
    console.error("שגיאה בטעינת עסקים חדשים:", error);
    showError("שגיאה בטעינת עסקים חדשים: " + error.message);
  }
}

// 🎛️ הגדרת Event Listeners
function setupEventListeners() {
  const retrainBtn = document.getElementById("retrain-btn");
  if (retrainBtn) {
    retrainBtn.addEventListener("click", retrainAI);
  }

  // כפתור אימון ראשוני
  const startTrainingBtn = document.getElementById("start-training");
  if (startTrainingBtn) {
    startTrainingBtn.addEventListener("click", startTraining);
    console.log("✅ event listener לכפתור אימון נוסף");
  }
}

// 🔄 אימון מחדש
async function retrainAI() {
  const btn = document.getElementById("retrain-btn");
  const status = document.getElementById("retrain-status");

  try {
    btn.disabled = true;
    btn.classList.add("processing");
    btn.textContent = "🔄 מאמן...";

    status.style.display = "block";
    status.textContent = "🚀 מתחיל אימון מחדש...";

    const response = await fetch(`${API_BASE}/api/retrain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`שגיאה באימון: ${response.status}`);
    }

    const result = await response.json();
    status.textContent = "✅ " + result.message;

    // רענון הנתונים
    await loadAIStats();
    await loadSuggestions();
  } catch (error) {
    console.error("שגיאה באימון מחדש:", error);
    status.textContent = "❌ שגיאה באימון: " + error.message;
  } finally {
    btn.disabled = false;
    btn.classList.remove("processing");
    btn.textContent = "🧠 אמן מחדש";
  }
}

// 📝 פונקציות פעולות
async function acceptSuggestion(businessName, recommendedCategory) {
  try {
    console.log("✅ מאשר הצעה עבור:", businessName);

    const response = await fetch(`${API_BASE}/api/accept-suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business: businessName,
        recommended: recommendedCategory,
      }),
    });

    if (!response.ok) {
      throw new Error(`שגיאה באישור: ${response.status}`);
    }

    const result = await response.json();
    alert("✅ " + result.message);

    // רענון הצעות
    await loadSuggestions();
  } catch (error) {
    console.error("שגיאה באישור הצעה:", error);
    alert("❌ שגיאה באישור: " + error.message);
  }
}

async function rejectSuggestion(businessName) {
  try {
    console.log("❌ דוחה הצעה עבור:", businessName);

    const response = await fetch(`${API_BASE}/api/reject-suggestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business: businessName,
      }),
    });

    if (!response.ok) {
      throw new Error(`שגיאה בדחייה: ${response.status}`);
    }

    const result = await response.json();
    alert("❌ " + result.message);

    // רענון הצעות
    await loadSuggestions();
  } catch (error) {
    console.error("שגיאה בדחיית הצעה:", error);
    alert("❌ שגיאה בדחייה: " + error.message);
  }
}

async function approveBusiness(businessName, businessId) {
  try {
    const select = document.getElementById("category-" + businessId);
    const category = select.value;

    console.log("✅ מאשר עסק:", businessName, "קטגוריה:", category);

    const response = await fetch(`${API_BASE}/api/approve-business`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business: businessName,
        category: category,
      }),
    });

    if (!response.ok) {
      throw new Error(`שגיאה באישור: ${response.status}`);
    }

    const result = await response.json();
    alert("✅ " + result.message);

    // רענון עסקים חדשים
    await loadNewBusinesses();
  } catch (error) {
    console.error("שגיאה באישור עסק:", error);
    alert("❌ שגיאה באישור: " + error.message);
  }
}

// 🛠️ פונקציות עזר
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.style.display = "block";
    errorElement.textContent = message;
  }

  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";

  console.error("🚨 AI Page Error:", message);
}

// 🧠 בדיקת סטטוס אימון
async function checkTrainingStatus() {
  try {
    console.log("🧠 בודק סטטוס אימון...");

    // לעכשיו נציג תמיד את האזהרה (נשפר בהמשך)
    const trainingAlert = document.getElementById("training-needed");
    const progressText = document.getElementById("training-progress-text");

    if (trainingAlert) {
      trainingAlert.style.display = "block";
      console.log("✅ אזהרת אימון מוצגת");
    }

    if (progressText) {
      progressText.textContent = "0 מתוך 201 עסקים אומנו";
    }
  } catch (error) {
    console.error("שגיאה בבדיקת סטטוס אימון:", error);
  }
}

// 🚀 התחלת אימון
function startTraining() {
  console.log("🚀 מעביר לדף אימון...");
  window.location.href = "training.html";
}

// הפיכת פונקציות לגלובליות
window.acceptSuggestion = acceptSuggestion;
window.rejectSuggestion = rejectSuggestion;
window.approveBusiness = approveBusiness;
