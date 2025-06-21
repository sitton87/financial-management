// 🔐 מערכת התחברות עם Google OAuth - משתמש בconfig
let currentUser = null;
let supabase = null;

// 🚀 אתחול בטעינת הדף
window.addEventListener("DOMContentLoaded", async () => {
  // טעינת הגדרות
  await window.appConfig.loadConfig();

  // יצירת חיבור Supabase
  const supabaseConfig = window.appConfig.getSupabaseConfig();

  if (supabaseConfig.url && supabaseConfig.anonKey) {
    supabase = window.supabase.createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey
    );
    console.log("✅ Supabase אותחל מהגדרות config");
  } else {
    console.error("❌ הגדרות Supabase חסרות");
    return;
  }

  // בדיקת משתמש נוכחי
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await handleUserLogin(user);
  } else {
    showLoginScreen();
  }

  setupEventListeners();
});

// 🔗 הגדרת מאזיני אירועים
function setupEventListeners() {
  // כפתור התחברות
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", loginWithGoogle);
  }

  // כפתורי התנתקות
  const logoutBtn = document.getElementById("logout-btn");
  const logoutBtnDenied = document.getElementById("logout-btn-denied");

  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  if (logoutBtnDenied) logoutBtnDenied.addEventListener("click", logout);

  // האזנה לשינויי אותנטיקציה
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        handleUserLogin(session.user);
      } else if (event === "SIGNED_OUT") {
        currentUser = null;
        showLoginScreen();
      }
    });
  }
}

// 🔐 התחברות עם Google
async function loginWithGoogle() {
  if (!supabase) {
    alert("שגיאה: מערכת לא אותחלה");
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error("שגיאה בהתחברות:", error);
    alert("שגיאה בהתחברות: " + error.message);
  }
}

// 🚪 התנתקות
async function logout() {
  if (!supabase) return;

  try {
    await supabase.auth.signOut();
    currentUser = null;
    showLoginScreen();
  } catch (error) {
    console.error("שגיאה בהתנתקות:", error);
  }
}

// 👤 טיפול בהתחברות משתמש
async function handleUserLogin(user) {
  currentUser = user;

  // בדיקה אם המשתמש מורשה
  const isAuthorized = await checkUserAuthorization(user.email);

  if (!isAuthorized) {
    showAccessDenied();
    return;
  }

  // הצגת האפליקציה
  showMainApp();

  // עדכון פרטי המשתמש
  setTimeout(() => updateUserInfo(user), 100);

  // טעינת הנתונים (אם יש פונקציה כזו)
  if (typeof loadDashboard === "function") {
    await loadDashboard();
  }
}

// ✅ בדיקת הרשאת משתמש
// 🔐 פונקציות הרשאה (העתקה מauth.js)
async function checkUserAuthorization(email) {
  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) {
      console.error("❌ Supabase לא זמין בהרשאות");
      return false;
    }

    console.log("🔍 בודק הרשאה עבור:", email);

    const { data, error } = await supabase
      .from("authorized_users")
      .select("email")
      .eq("email", email)
      .single();

    if (error) {
      console.error("❌ שגיאה בבדיקת הרשאה:", error);
      return false;
    }

    console.log("✅ הרשאה אושרה:", !!data);
    return !!data;
  } catch (error) {
    console.error("❌ שגיאה כללית בבדיקת הרשאה:", error);
    return false;
  }
}

// 📱 עדכון פרטי משתמש בממשק
function updateUserInfo(user) {
  const nameElement = document.getElementById("user-name");
  const emailElement = document.getElementById("user-email");
  const avatarElement = document.getElementById("user-avatar");

  if (nameElement)
    nameElement.textContent = user.user_metadata.full_name || "משתמש";
  if (emailElement) emailElement.textContent = user.email;
  if (avatarElement) avatarElement.src = user.user_metadata.avatar_url || "";

  // אם האלמנטים לא קיימים, נחכה ונעדכן שוב
  if (!nameElement || !emailElement || !avatarElement) {
    setTimeout(() => updateUserInfo(user), 100);
  }
}

// 🖥️ הצגת מסכים שונים
function showLoginScreen() {
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");
  const accessDenied = document.getElementById("access-denied");

  if (loginScreen) loginScreen.style.display = "block";
  if (mainApp) mainApp.style.display = "none";
  if (accessDenied) accessDenied.style.display = "none";
}

function showAccessDenied() {
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");
  const accessDenied = document.getElementById("access-denied");

  if (loginScreen) loginScreen.style.display = "none";
  if (mainApp) mainApp.style.display = "none";
  if (accessDenied) accessDenied.style.display = "block";
}

function showMainApp() {
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");
  const accessDenied = document.getElementById("access-denied");

  if (loginScreen) loginScreen.style.display = "none";
  if (accessDenied) accessDenied.style.display = "none";
  if (mainApp) mainApp.style.display = "block";

  // יצירת כותרת עם ניווט
  const headerContainer = document.getElementById("header-container");
  if (headerContainer && window.navbarModule) {
    const pageName = window.location.pathname.includes("transactions")
      ? "transactions"
      : window.location.pathname.includes("categories")
      ? "categories"
      : window.location.pathname.includes("comparisons")
      ? "comparisons"
      : "home";

    headerContainer.innerHTML = window.navbarModule.createHeader(
      "מערכת ניהול פיננסי",
      "מבט כללי על ההוצאות שלך",
      pageName
    );
  }
}

// 📤 ייצוא לשימוש חיצוני
window.authModule = {
  currentUser: () => currentUser,
  supabase: () => supabase, // ← חזור לפונקציה!
  showError: (message) => {
    const errorElement = document.getElementById("error-message");
    if (errorElement) {
      errorElement.style.display = "block";
      errorElement.textContent = message;
    }
  },
};
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    console.log("✅ Auth מוכן:", !!window.authModule);
    console.log("✅ משתמש נוכחי:", !!window.authModule?.currentUser());
  }, 500);
});
