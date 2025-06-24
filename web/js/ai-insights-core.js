// 🧠 ai-insights-core.js - תובנות AI בסיסיות מנתונים אמיתיים
let aiCoreData = {
  transactions: [],
  categories: [],
  insights: {},
  stats: {},
};

const AI_API_BASE = "http://localhost:5000";

// 🚀 אתחול מערכת תובנות AI
async function initAIInsightsCore() {
  try {
    console.log("🧠 מאתחל תובנות AI בסיסיות...");

    // טעינת נתונים בסיסיים
    await loadTransactionData();
    await loadCategoriesData();

    // חישוב תובנות
    await calculateCoreInsights();
    await calculateAIStats();

    // עדכון הממשק
    updateStatsDisplay();
    updateInsightsDisplay();

    // טעינת נתוני שרת AI (אם זמין)
    try {
      await loadServerAIData();
    } catch (error) {
      console.warn("שרת AI לא זמין:", error.message);
    }

    console.log("✅ תובנות AI בסיסיות מוכנות");
    return true;
  } catch (error) {
    console.error("❌ שגיאה באתחול תובנות AI:", error);
    throw error;
  }
}

// 📊 טעינת נתוני עסקאות מSupabase
async function loadTransactionData() {
  try {
    const supabase = window.authModule.supabase();

    // נתונים מ-6 חודשים אחרונים
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    console.log("📊 טוען עסקאות מSupabase...");

    const { data, error } = await supabase
      .from("transactions")
      .select(
        `
        identifier,
        cardlast4,
        date,
        description,
        originalamount,
        chargedamount,
        category_id,
        is_ai_categorized,
        installment_info,
        memo,
        created_at,
        categories:category_id (
          id,
          name,
          color,
          icon
        )
      `
      )
      .gte("date", sixMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(3000);

    if (error) throw error;

    aiCoreData.transactions = data || [];
    console.log(`✅ נטענו ${aiCoreData.transactions.length} עסקאות לתובנות AI`);
  } catch (error) {
    console.error("❌ שגיאה בטעינת עסקאות:", error);
    // במקרה של שגיאה, נשתמש במערך ריק
    aiCoreData.transactions = [];
  }
}

// 📂 טעינת נתוני קטגוריות
async function loadCategoriesData() {
  try {
    const supabase = window.authModule.supabase();

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    aiCoreData.categories = data || [];
    console.log(`✅ נטענו ${aiCoreData.categories.length} קטגוריות`);
  } catch (error) {
    console.error("❌ שגיאה בטעינת קטגוריות:", error);
    aiCoreData.categories = [];
  }
}

// 🧮 חישוב תובנות מרכזיות
async function calculateCoreInsights() {
  const transactions = aiCoreData.transactions;
  const insights = {};

  if (transactions.length === 0) {
    // ערכי ברירת מחדל אם אין נתונים
    insights.dailyAverage = 0;
    insights.dailyTrend = "אין נתונים";
    insights.expensiveDay = "לא ידוע";
    insights.expensiveDayAmount = 0;
    insights.topCategory = "לא מוגדר";
    insights.topCategoryPercent = 0;
    insights.transactionFrequency = 0;

    aiCoreData.insights = insights;
    return;
  }

  // נתונים מ-30 ימים אחרונים לחישובים
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentTransactions = transactions.filter(
    (t) => new Date(t.date) >= thirtyDaysAgo
  );

  // חישוב הוצאה יומית ממוצעת
  const totalAmount = recentTransactions.reduce((sum, t) => {
    return sum + Math.abs(t.chargedamount || t.originalamount || 0);
  }, 0);

  insights.dailyAverage = Math.round(totalAmount / 30);

  // השוואה לחודש שעבר
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const previousMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  });

  const previousMonthTotal = previousMonthTransactions.reduce((sum, t) => {
    return sum + Math.abs(t.chargedamount || t.originalamount || 0);
  }, 0);

  const previousDailyAvg = previousMonthTotal / 30;
  const trendPercent =
    previousDailyAvg > 0
      ? Math.round(
          ((insights.dailyAverage - previousDailyAvg) / previousDailyAvg) * 100
        )
      : 0;

  if (trendPercent > 5) {
    insights.dailyTrend = `<span class="trend-up">📈 +${trendPercent}% מהחודש שעבר</span>`;
  } else if (trendPercent < -5) {
    insights.dailyTrend = `<span class="trend-down">📉 ${trendPercent}% מהחודש שעבר</span>`;
  } else {
    insights.dailyTrend = `<span class="trend-neutral">📊 יציב (${
      trendPercent >= 0 ? "+" : ""
    }${trendPercent}%)</span>`;
  }

  // ניתוח יום יקר בשבוע
  const dayStats = {};
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  // אתחול כל הימים
  dayNames.forEach((day) => {
    dayStats[day] = { total: 0, count: 0 };
  });

  recentTransactions.forEach((t) => {
    const dayIndex = new Date(t.date).getDay();
    const dayName = dayNames[dayIndex];
    const amount = Math.abs(t.chargedamount || t.originalamount || 0);

    dayStats[dayName].total += amount;
    dayStats[dayName].count++;
  });

  // מציאת היום הכי יקר
  let expensiveDay = "ראשון";
  let maxAverage = 0;

  Object.entries(dayStats).forEach(([day, stats]) => {
    const average = stats.count > 0 ? stats.total / stats.count : 0;
    if (average > maxAverage) {
      maxAverage = average;
      expensiveDay = day;
    }
  });

  insights.expensiveDay = expensiveDay;
  insights.expensiveDayAmount = Math.round(maxAverage);

  // ניתוח קטגוריה דומיננטית
  const categoryStats = {};

  recentTransactions.forEach((t) => {
    let categoryName = "לא מוגדר";

    if (t.categories && t.categories.name) {
      categoryName = t.categories.name;
    }

    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = 0;
    }

    categoryStats[categoryName] += Math.abs(
      t.chargedamount || t.originalamount || 0
    );
  });

  // מציאת הקטגוריה הדומיננטית
  let topCategory = "לא מוגדר";
  let maxCategoryAmount = 0;

  Object.entries(categoryStats).forEach(([category, amount]) => {
    if (amount > maxCategoryAmount) {
      maxCategoryAmount = amount;
      topCategory = category;
    }
  });

  insights.topCategory = topCategory;
  insights.topCategoryPercent =
    totalAmount > 0 ? Math.round((maxCategoryAmount / totalAmount) * 100) : 0;

  // תדירות עסקאות יומית
  insights.transactionFrequency = (recentTransactions.length / 30).toFixed(1);

  aiCoreData.insights = insights;
  console.log("✅ תובנות מרכזיות חושבו:", insights);
}

// 📈 חישוב סטטיסטיקות AI
async function calculateAIStats() {
  const transactions = aiCoreData.transactions;
  const stats = {};

  if (transactions.length === 0) {
    stats.accuracy = 0;
    stats.processed = 0;
    stats.learned = 0;
    stats.improvement = 0;
    aiCoreData.stats = stats;
    return;
  }

  // עסקאות מהשבוע האחרון
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyTransactions = transactions.filter(
    (t) => new Date(t.date) >= weekAgo
  );

  // עסקאות שקוטגרו על ידי AI
  const aiCategorized = weeklyTransactions.filter((t) => t.is_ai_categorized);

  // דיוק AI (אחוז העסקאות שקוטגרו על ידי AI)
  stats.accuracy =
    weeklyTransactions.length > 0
      ? Math.round((aiCategorized.length / weeklyTransactions.length) * 100)
      : 0;

  // מספר עסקאות מעובדות השבוע
  stats.processed = weeklyTransactions.length;

  // מספר עסקים ייחודיים שנלמדו
  const uniqueBusinesses = new Set();
  transactions.forEach((t) => {
    if (t.description && t.is_ai_categorized) {
      uniqueBusinesses.add(t.description.toLowerCase().trim());
    }
  });
  stats.learned = uniqueBusinesses.size;

  // שיפור (השוואה לשבוע שעבר)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const previousWeekTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= twoWeeksAgo && date < weekAgo;
  });

  const previousWeekAI = previousWeekTransactions.filter(
    (t) => t.is_ai_categorized
  );
  const previousAccuracy =
    previousWeekTransactions.length > 0
      ? (previousWeekAI.length / previousWeekTransactions.length) * 100
      : 0;

  stats.improvement = Math.round(stats.accuracy - previousAccuracy);

  aiCoreData.stats = stats;
  console.log("✅ סטטיסטיקות AI חושבו:", stats);
}

// 🖥️ עדכון תצוגת סטטיסטיקות
function updateStatsDisplay() {
  const stats = aiCoreData.stats;

  const elements = {
    "ai-accuracy": `${stats.accuracy}%`,
    "ai-processed": stats.processed.toLocaleString(),
    "ai-learned": stats.learned.toLocaleString(),
    "ai-improvement": `${stats.improvement >= 0 ? "+" : ""}${
      stats.improvement
    }%`,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  });

  console.log("✅ סטטיסטיקות AI עודכנו בממשק");
}

// 🖥️ עדכון תצוגת תובנות
function updateInsightsDisplay() {
  const insights = aiCoreData.insights;

  const elements = {
    "daily-average": `₪${insights.dailyAverage.toLocaleString()}`,
    "daily-trend": `
      <div class="insight-subtitle">בהשוואה לחודש קודם</div>
      ${insights.dailyTrend}
    `,
    "expensive-day": `יום ${insights.expensiveDay}`,
    "expensive-day-amount": `
      <div class="insight-subtitle">ביום הכי יקר</div>
      ממוצע: ₪${insights.expensiveDayAmount.toLocaleString()}
    `,
    "top-category": insights.topCategory,
    "top-category-percent": `
      <div class="insight-subtitle">אחוז מסך ההוצאות</div>
      ${insights.topCategoryPercent}% מההוצאות
    `,
    "transaction-frequency": insights.transactionFrequency,
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = value;
    }
  });

  console.log("✅ תובנות עודכנו בממשק");
}

// 🌐 טעינת נתוני שרת AI
async function loadServerAIData() {
  try {
    console.log("🌐 מתחבר לשרת AI...");

    // בדיקת זמינות השרת
    const healthResponse = await fetch(`${AI_API_BASE}/health`);
    if (!healthResponse.ok) {
      throw new Error("שרת AI לא זמין");
    }

    const healthData = await healthResponse.json();
    console.log("✅ שרת AI פעיל:", healthData);

    // טעינת נתוני AI נוספים מהשרת
    try {
      await loadAISuggestions();
      await loadNewBusinesses();
    } catch (error) {
      console.warn("⚠️ חלק מנתוני השרת לא זמינים:", error.message);
    }
  } catch (error) {
    console.warn("⚠️ שרת AI לא זמין:", error.message);
    // נמשיך עם הנתונים המקומיים בלבד
  }
}

// 💡 טעינת הצעות שיפור מהשרת
async function loadAISuggestions() {
  try {
    const response = await fetch(`${AI_API_BASE}/api/ai-suggestions`);
    if (!response.ok) return;

    const suggestions = await response.json();
    displaySuggestions(suggestions);
  } catch (error) {
    console.warn("לא ניתן לטעון הצעות מהשרת:", error);
    displaySuggestions([]); // רשימה ריקה
  }
}

// 🔍 טעינת עסקים חדשים מהשרת
async function loadNewBusinesses() {
  try {
    const response = await fetch(`${AI_API_BASE}/api/new-businesses`);
    if (!response.ok) return;

    const businesses = await response.json();
    displayNewBusinesses(businesses);
  } catch (error) {
    console.warn("לא ניתן לטעון עסקים חדשים מהשרת:", error);
    displayNewBusinesses([]); // רשימה ריקה
  }
}

// 🖥️ הצגת הצעות שיפור
function displaySuggestions(suggestions) {
  const container = document.getElementById("suggestions-list");
  if (!container) return;

  if (suggestions.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666;">🎉 אין הצעות שיפור - הכל מסווג נכון!</p>';
    return;
  }

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

// 🖥️ הצגת עסקים חדשים
function displayNewBusinesses(businesses) {
  const container = document.getElementById("new-businesses-list");
  if (!container) return;

  if (businesses.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666;">📋 אין עסקים חדשים לסיווג</p>';
    return;
  }

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

// 🛠️ פונקציות פעולה לשרת AI
async function acceptSuggestion(businessName, recommendedCategory) {
  try {
    const response = await fetch(`${AI_API_BASE}/api/accept-suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: businessName,
        recommended: recommendedCategory,
      }),
    });

    if (response.ok) {
      alert(`✅ הצעה אושרה עבור ${businessName}`);
      await loadAISuggestions(); // רענון
    }
  } catch (error) {
    console.error("שגיאה באישור הצעה:", error);
    alert("❌ שגיאה באישור הצעה");
  }
}

async function rejectSuggestion(businessName) {
  try {
    const response = await fetch(`${AI_API_BASE}/api/reject-suggestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business: businessName }),
    });

    if (response.ok) {
      alert(`❌ הצעה נדחתה עבור ${businessName}`);
      await loadAISuggestions(); // רענון
    }
  } catch (error) {
    console.error("שגיאה בדחיית הצעה:", error);
    alert("❌ שגיאה בדחיית הצעה");
  }
}

async function approveBusiness(businessName, businessId) {
  try {
    const select = document.getElementById(`category-${businessId}`);
    const category = select.value;

    const response = await fetch(`${AI_API_BASE}/api/approve-business`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: businessName,
        category: category,
      }),
    });

    if (response.ok) {
      alert(`✅ עסק ${businessName} אושר בקטגוריה ${category}`);
      await loadNewBusinesses(); // רענון
    }
  } catch (error) {
    console.error("שגיאה באישור עסק:", error);
    alert("❌ שגיאה באישור עסק");
  }
}

// 🧹 פונקציות עזר
function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.style.display = "block";
    errorElement.textContent = message;
  }
  console.error("🚨 AI Core Error:", message);
}

// 📤 ייצוא פונקציות לשימוש גלובלי
window.aiCoreModule = {
  init: initAIInsightsCore,
  getData: () => aiCoreData,
  acceptSuggestion,
  rejectSuggestion,
  approveBusiness,
  showError,
};

// הפיכת פונקציות לגלובליות לטובת HTML onclick
window.acceptSuggestion = acceptSuggestion;
window.rejectSuggestion = rejectSuggestion;
window.approveBusiness = approveBusiness;

console.log("🧠 AI Insights Core טוען...");
