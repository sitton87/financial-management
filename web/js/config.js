// 🔧 מערכת הגדרות משותפת לJavaScript
class Config {
  constructor() {
    this.config = null;
    this.loaded = false;
  }

  // טעינת הגדרות מהשרת
  async loadConfig() {
    try {
      const response = await fetch("./config.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.config = await response.json();
      this.loaded = true;
      console.log("✅ הגדרות נטענו בהצלחה");
      return this.config;
    } catch (error) {
      console.error("❌ שגיאה בטעינת הגדרות:", error);
      // הגדרות fallback
      this.config = this.getFallbackConfig();
      this.loaded = true;
      return this.config;
    }
  }

  // הגדרות גיבוי אם לא ניתן לטעון מJSON
  getFallbackConfig() {
    return {
      supabase: {
        url: "https://ytbyoiqjhyskplwygsog.supabase.co",
        anon_key:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YnlvaXFqaHlza3Bsd3lnc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY4NjEsImV4cCI6MjA2NTk5Mjg2MX0.1ByP8TLn-fMOScIaTdB9hwKI_iDqyYhc1f6zth5M0dw",
      },
      app: {
        pagination_size: 50,
      },
    };
  }

  // קבלת הגדרות Supabase
  getSupabaseConfig() {
    this.ensureLoaded();
    return {
      url: this.config.supabase?.url || "",
      anonKey: this.config.supabase?.anon_key || "",
    };
  }

  // קבלת הגדרות אפליקציה
  getAppConfig() {
    this.ensureLoaded();
    return {
      paginationSize: this.config.app?.pagination_size || 50,
      defaultCurrency: this.config.app?.default_currency || "ILS",
    };
  }

  // קבלת צבעי קטגוריות
  getCategoryColors() {
    this.ensureLoaded();
    return this.config.categories?.colors || {};
  }

  // קבלת הגדרות AI
  getAIConfig() {
    this.ensureLoaded();
    return {
      confidenceThreshold: this.config.ai?.confidence_threshold || 0.6,
      similarityThreshold: this.config.ai?.similarity_threshold || 0.8,
      maxSuggestions: this.config.ai?.max_suggestions || 20,
    };
  }

  // בדיקה שההגדרות נטענו
  ensureLoaded() {
    if (!this.loaded) {
      console.warn("⚠️ הגדרות לא נטענו עדיין");
    }
  }

  // בדיקת תקינות הגדרות
  validateConfig() {
    const errors = [];
    const supabase = this.getSupabaseConfig();

    if (!supabase.url || supabase.url.includes("your-project")) {
      errors.push("❌ URL של Supabase לא מוגדר");
    }

    if (!supabase.anonKey || supabase.anonKey.includes("your-anon-key")) {
      errors.push("❌ Anon Key של Supabase לא מוגדר");
    }

    if (errors.length > 0) {
      console.error("🚨 בעיות בהגדרות:");
      errors.forEach((error) => console.error(`   ${error}`));
      return false;
    }

    console.log("✅ כל ההגדרות JavaScript תקינות");
    return true;
  }
}

// יצירת instance גלובלי
const config = new Config();

// אתחול אוטומטי
(async () => {
  await config.loadConfig();
  config.validateConfig();
})();

// ייצוא לשימוש גלובלי
window.appConfig = config;
