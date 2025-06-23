// 🔐 מערכת אימות מתוקנת עם Google OAuth
class AuthModule {
  constructor() {
    this.supabaseClient = null;
    this.currentUserData = null;
    this.authReady = false;
    this.authStateHandlers = [];
  }

  // 🚀 אתחול Supabase עם הגדרות
  async init() {
    try {
      // המתנה לconfig
      while (!window.appConfig?.loaded) {
        console.log("⏳ ממתין לconfig...");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const config = window.appConfig.getSupabaseConfig();
      console.log("🔧 מאתחל Supabase עם הגדרות config");

      // יצירת Supabase client
      this.supabaseClient = window.supabase.createClient(
        config.url,
        config.anonKey,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: "pkce",
          },
        }
      );

      // האזנה לשינויי אימות
      this.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log(
          `🔄 שינוי באימות: ${event}`,
          session?.user?.email || "אין משתמש"
        );
        this.handleAuthStateChange(event, session);
      });

      // בדיקת session קיים
      const {
        data: { session },
        error,
      } = await this.supabaseClient.auth.getSession();

      if (error) {
        console.error("❌ שגיאה בקבלת session:", error);
      } else if (session) {
        console.log("✅ נמצא session קיים:", session.user.email);
        await this.setCurrentUser(session.user);
      } else {
        console.log("ℹ️ אין session קיים");
      }

      this.authReady = true;
      console.log("✅ Auth מוכן:", this.authReady);
      return true;
    } catch (error) {
      console.error("❌ שגיאה באתחול Auth:", error);
      this.authReady = false;
      return false;
    }
  }

  // 🔄 טיפול בשינויי אימות
  async handleAuthStateChange(event, session) {
    switch (event) {
      case "SIGNED_IN":
        console.log("✅ משתמש התחבר:", session.user.email);
        await this.setCurrentUser(session.user);
        break;

      case "SIGNED_OUT":
        console.log("🚪 משתמש התנתק");
        this.currentUserData = null;
        this.notifyAuthStateHandlers("SIGNED_OUT", null);
        break;

      case "TOKEN_REFRESHED":
        console.log("🔄 Token רוענן:", session.user.email);
        break;

      case "USER_UPDATED":
        console.log("👤 משתמש עודכן:", session.user.email);
        await this.setCurrentUser(session.user);
        break;
    }
  }

  // 👤 הגדרת משתמש נוכחי
  async setCurrentUser(user) {
    try {
      // בדיקת הרשאה
      const isAuthorized = await this.checkUserAuthorization(user.email);

      if (isAuthorized) {
        this.currentUserData = {
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          avatar: user.user_metadata?.avatar_url,
          authorized: true,
        };

        console.log("✅ משתמש מורשה הוגדר:", this.currentUserData.email);
        this.notifyAuthStateHandlers("AUTHORIZED", this.currentUserData);
      } else {
        console.log("❌ משתמש לא מורשה:", user.email);
        this.currentUserData = {
          email: user.email,
          authorized: false,
        };
        this.notifyAuthStateHandlers("UNAUTHORIZED", this.currentUserData);
      }
    } catch (error) {
      console.error("❌ שגיאה בהגדרת משתמש:", error);
      this.currentUserData = null;
    }
  }

  // 🔍 בדיקת הרשאות משתמש
  async checkUserAuthorization(email) {
    try {
      if (!this.supabaseClient) {
        console.error("❌ Supabase לא זמין");
        return false;
      }

      const tableName = window.appConfig.getTableName("authorized_users");
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select("email, name")
        .eq("email", email)
        .single();

      if (error) {
        console.error("❌ שגיאה בבדיקת הרשאה:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("❌ Exception בבדיקת הרשאה:", error);
      return false;
    }
  }

  // 🔐 התחברות עם Google
  async signInWithGoogle() {
    try {
      console.log("🔐 מתחבר עם Google...");

      const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("❌ שגיאה בהתחברות Google:", error);
        throw error;
      }

      console.log("🔐 בקשת התחברות נשלחה");
      return data;
    } catch (error) {
      console.error("❌ שגיאה בהתחברות:", error);
      throw error;
    }
  }

  // 🚪 התנתקות
  async signOut() {
    try {
      console.log("🚪 מתנתק...");

      const { error } = await this.supabaseClient.auth.signOut();

      if (error) {
        console.error("❌ שגיאה בהתנתקות:", error);
        throw error;
      }

      console.log("✅ התנתקות הושלמה");
    } catch (error) {
      console.error("❌ שגיאה בהתנתקות:", error);
      throw error;
    }
  }

  // 📞 הוספת מאזין לשינויי אימות
  onAuthStateChange(handler) {
    this.authStateHandlers.push(handler);
  }

  // 📢 הודעה למאזינים על שינויי אימות
  notifyAuthStateHandlers(event, user) {
    this.authStateHandlers.forEach((handler) => {
      try {
        handler(event, user);
      } catch (error) {
        console.error("❌ שגיאה במאזין אימות:", error);
      }
    });
  }

  // 🔍 בדיקה אם משתמש מחובר
  isAuthenticated() {
    return !!(this.currentUserData && this.currentUserData.authorized);
  }

  // 👤 קבלת משתמש נוכחי
  currentUser() {
    return this.currentUserData;
  }

  // 🔧 קבלת Supabase client
  supabase() {
    return this.supabaseClient;
  }

  // ✅ בדיקה אם Auth מוכן
  isReady() {
    return this.authReady;
  }
}

// יצירת instance גלובלי
const authModule = new AuthModule();

// אתחול אוטומטי
(async () => {
  console.log("🚀 מאתחל מערכת אימות...");
  await authModule.init();

  // הוספת כפתורי התחברות/התנתקות אוטומטיים
  authModule.onAuthStateChange((event, user) => {
    updateAuthUI(event, user);
  });
})();

// 🎨 עדכון ממשק האימות
function updateAuthUI(event, user) {
  const loginButtons = document.querySelectorAll(".login-btn");
  const logoutButtons = document.querySelectorAll(".logout-btn");
  const userInfo = document.querySelectorAll(".user-info");

  switch (event) {
    case "AUTHORIZED":
      loginButtons.forEach((btn) => (btn.style.display = "none"));
      logoutButtons.forEach((btn) => (btn.style.display = "inline-block"));
      userInfo.forEach((info) => {
        info.style.display = "inline-block";
        info.textContent = user.name || user.email;
      });
      break;

    case "SIGNED_OUT":
    case "UNAUTHORIZED":
      loginButtons.forEach((btn) => (btn.style.display = "inline-block"));
      logoutButtons.forEach((btn) => (btn.style.display = "none"));
      userInfo.forEach((info) => (info.style.display = "none"));
      break;
  }
}

// 🔐 פונקציות גלובליות לשימוש ב-HTML
window.signInWithGoogle = () => authModule.signInWithGoogle();
window.signOut = () => authModule.signOut();

// ייצוא לשימוש גלובלי
window.authModule = authModule;

console.log("🔐 Auth module טוען...");
