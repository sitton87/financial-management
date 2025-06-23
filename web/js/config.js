// 🔧 מערכת הגדרות משותפת לJavaScript - מעודכן למבנה DB החדש
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
      // 🗄️ הגדרות טבלאות - מעודכן למבנה החדש
      database: {
        // טבלאות עיקריות
        transactions: "transactions", // הטבלה הראשית ✅
        temp: "temp", // טבלה זמנית להעלאות ✅
        categories: "categories", // קטגוריות ✅

        // טבלאות תמיכה
        known_businesses: "known_businesses", // עסקים מוכרים ✅
        learning_rules: "learning_rules", // כללי AI ✅
        tags: "tags", // תגיות ✅

        // טבלאות מעקב
        transaction_history: "transaction_history", // היסטוריה ✅
        transaction_tags: "transaction_tags", // תיוג עסקאות ✅

        // טבלאות מערכת
        authorized_users: "authorized_users", // משתמשים מורשים ✅
        system_settings: "system_settings", // הגדרות מערכת ✅
      },
      app: {
        pagination_size: 50,
        default_currency: "ILS",

        // 🎯 הגדרות AI חדשות
        ai: {
          confidence_threshold: 0.8, // ציון מינימלי לקטגוריזציה אוטומטית
          learning_threshold: 0.6, // ציון מינימלי ללמידה
          max_suggestions: 10, // מקסימום הצעות
          auto_categorize: true, // האם לקטגר אוטומטית
          enable_learning: true, // האם ללמוד מהמשתמש
        },
      },

      // 🎨 הגדרות UI
      ui: {
        theme: "light",
        items_per_page: 25,
        currency_symbol: "₪",
        date_format: "DD/MM/YYYY",
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

  // 🗄️ קבלת שמות טבלאות
  getTableNames() {
    this.ensureLoaded();
    return this.config.database || {};
  }

  // קבלת שם טבלה ספציפית
  getTableName(tableName) {
    const tables = this.getTableNames();
    return tables[tableName] || tableName;
  }

  // קבלת הגדרות אפליקציה
  getAppConfig() {
    this.ensureLoaded();
    return {
      paginationSize: this.config.app?.pagination_size || 50,
      defaultCurrency: this.config.app?.default_currency || "ILS",
    };
  }

  // 🤖 קבלת הגדרות AI
  getAIConfig() {
    this.ensureLoaded();
    return {
      confidenceThreshold: this.config.app?.ai?.confidence_threshold || 0.8,
      learningThreshold: this.config.app?.ai?.learning_threshold || 0.6,
      maxSuggestions: this.config.app?.ai?.max_suggestions || 10,
      autoCategorize: this.config.app?.ai?.auto_categorize || true,
      enableLearning: this.config.app?.ai?.enable_learning || true,
    };
  }

  // 🎨 קבלת הגדרות UI
  getUIConfig() {
    this.ensureLoaded();
    return {
      theme: this.config.ui?.theme || "light",
      itemsPerPage: this.config.ui?.items_per_page || 25,
      currencySymbol: this.config.ui?.currency_symbol || "₪",
      dateFormat: this.config.ui?.date_format || "DD/MM/YYYY",
    };
  }

  // קבלת צבעי קטגוריות (נשאר כמו שהיה)
  getCategoryColors() {
    this.ensureLoaded();
    return this.config.categories?.colors || {};
  }

  // 🔧 פונקציות עזר חדשות למבנה החדש

  // בדיקה אם יש תמיכה ב-AI
  isAIEnabled() {
    const aiConfig = this.getAIConfig();
    return aiConfig.enableLearning;
  }

  // קבלת רמת ביטחון לקטגוריזציה אוטומטית
  getAutoCategorizationThreshold() {
    const aiConfig = this.getAIConfig();
    return aiConfig.confidenceThreshold;
  }

  // קבלת הגדרות עמודות עסקאות
  getTransactionColumns() {
    return [
      "identifier",
      "cardlast4",
      "date",
      "description",
      "originalamount",
      "chargedamount",
      "category_id",
      "is_ai_categorized",
      "installment_info",
      "created_at",
    ];
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
    const tables = this.getTableNames();

    // בדיקת Supabase
    if (!supabase.url || supabase.url.includes("your-project")) {
      errors.push("❌ URL של Supabase לא מוגדר");
    }

    if (!supabase.anonKey || supabase.anonKey.includes("your-anon-key")) {
      errors.push("❌ Anon Key של Supabase לא מוגדר");
    }

    // 🔧 בדיקת טבלאות חיוניות - תיקון
    const requiredTables = ["transactions", "categories", "temp"];
    requiredTables.forEach((table) => {
      if (!tables[table]) {
        console.warn(
          `⚠️ טבלה לא מוגדרת בconfig: ${table} - משתמש בשם ברירת מחדל`
        );
      }
    });

    if (errors.length > 0) {
      console.error("🚨 בעיות בהגדרות:");
      errors.forEach((error) => console.error(`   ${error}`));
      return false;
    }

    console.log("✅ כל ההגדרות תקינות");
    console.log(`📊 טבלאות זמינות: ${Object.keys(tables).join(", ")}`);
    console.log(`🤖 AI מופעל: ${this.isAIEnabled() ? "כן" : "לא"}`);
    return true;
  }

  // 🔧 פונקציה חדשה: קבלת הגדרות שאילתות
  getQueryConfig() {
    return {
      defaultLimit: this.getAppConfig().paginationSize,
      maxLimit: 1000,
      defaultOrderBy: "created_at",
      defaultOrderDirection: "desc",
    };
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
