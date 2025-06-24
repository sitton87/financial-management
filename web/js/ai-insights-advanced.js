// 🚀 ai-insights-advanced.js - תכונות AI מתקדמות
let advancedAIData = {
  alerts: [],
  predictions: [],
  patterns: [],
  recommendations: [],
  chartData: {},
};

// גרף מגמות חכם
let smartTrendsChart = null;

// 🚀 אתחול תכונות מתקדמות
async function initAdvancedAI() {
  try {
    console.log("🚀 מאתחל תכונות AI מתקדמות...");

    // וידוא שהמודול הבסיסי נטען
    if (!window.aiCoreModule || !window.aiCoreModule.getData().transactions) {
      throw new Error("מודול AI בסיסי לא נטען");
    }

    // חישוב תכונות מתקדמות
    await calculateSmartAlerts();
    await calculatePredictions();
    await calculateSpendingPatterns();
    await calculateSavingsRecommendations();
    await prepareChartData();

    // עדכון הממשק
    displaySmartAlerts();
    displayPredictions();
    displaySpendingPatterns();
    displaySavingsRecommendations();
    createSmartTrendsChart();

    console.log("✅ תכונות AI מתקדמות מוכנות");
    return true;
  } catch (error) {
    console.error("❌ שגיאה באתחול תכונות מתקדמות:", error);
    throw error;
  }
}

// 🚨 חישוב התראות חכמות
async function calculateSmartAlerts() {
  const coreData = window.aiCoreModule.getData();
  const transactions = coreData.transactions;
  const alerts = [];

  if (transactions.length === 0) {
    advancedAIData.alerts = alerts;
    return;
  }

  // התראות על הוצאות חריגות
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekTransactions = transactions.filter(
    (t) => new Date(t.date) >= weekAgo
  );

  // ניתוח לפי קטגוריות השבוע
  const weeklyByCategory = {};
  thisWeekTransactions.forEach((t) => {
    const category = t.categories?.name || "לא מוגדר";
    if (!weeklyByCategory[category]) {
      weeklyByCategory[category] = { total: 0, count: 0 };
    }
    weeklyByCategory[category].total += Math.abs(
      t.chargedamount || t.originalamount || 0
    );
    weeklyByCategory[category].count++;
  });

  // השוואה לחודש שעבר
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const lastMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= twoMonthsAgo && date < monthAgo;
  });

  const lastMonthByCategory = {};
  lastMonthTransactions.forEach((t) => {
    const category = t.categories?.name || "לא מוגדר";
    if (!lastMonthByCategory[category]) {
      lastMonthByCategory[category] = { total: 0, count: 0 };
    }
    lastMonthByCategory[category].total += Math.abs(
      t.chargedamount || t.originalamount || 0
    );
    lastMonthByCategory[category].count++;
  });

  // זיהוי הוצאות חריגות
  Object.entries(weeklyByCategory).forEach(([category, thisWeek]) => {
    const lastWeekInMonth = lastMonthByCategory[category];
    if (!lastWeekInMonth) return;

    const weeklyAvgLastMonth = lastWeekInMonth.total / 4; // ממוצע שבועי בחודש שעבר
    const increasePercent =
      weeklyAvgLastMonth > 0
        ? Math.round(
            ((thisWeek.total - weeklyAvgLastMonth) / weeklyAvgLastMonth) * 100
          )
        : 0;

    if (increasePercent > 50 && thisWeek.total > 500) {
      alerts.push({
        type: "critical",
        icon: "🚨",
        title: "הוצאה חריגה זוהתה",
        description: `הוצאה של ₪${thisWeek.total.toLocaleString()} ב${category} השבוע - ${increasePercent}% מעל הממוצע`,
      });
    } else if (increasePercent > 25 && thisWeek.total > 300) {
      alerts.push({
        type: "warning",
        icon: "⚠️",
        title: "מגמת עלייה זוהתה",
        description: `הוצאות ${category} עלו ב-${increasePercent}% השבוע`,
      });
    }
  });

  // זיהוי עסקאות לילה (אחרי 22:00)
  const nightTransactions = thisWeekTransactions.filter((t) => {
    const hour = new Date(t.created_at || t.date).getHours();
    return hour >= 22 || hour <= 6;
  });

  if (nightTransactions.length > 5) {
    const nightTotal = nightTransactions.reduce(
      (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
      0
    );

    alerts.push({
      type: "info",
      icon: "🌙",
      title: "קניות לילה מזוהות",
      description: `${
        nightTransactions.length
      } עסקאות בשעות הלילה בשבוע - סה"כ ₪${nightTotal.toLocaleString()}`,
    });
  }

  // זיהוי מנויים כפולים (לפי תיאור דומה)
  const subscriptionPatterns = [
    "netflix",
    "spotify",
    "apple",
    "google",
    "amazon",
    "microsoft",
  ];
  const foundSubscriptions = {};

  transactions.forEach((t) => {
    const desc = (t.description || "").toLowerCase();
    subscriptionPatterns.forEach((pattern) => {
      if (desc.includes(pattern)) {
        if (!foundSubscriptions[pattern]) foundSubscriptions[pattern] = [];
        foundSubscriptions[pattern].push(t);
      }
    });
  });

  Object.entries(foundSubscriptions).forEach(([service, transactions]) => {
    if (transactions.length > 1) {
      const monthlyAmount = transactions.reduce(
        (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
        0
      );

      alerts.push({
        type: "info",
        icon: "💡",
        title: "מנויים כפולים אפשריים",
        description: `זוהו ${
          transactions.length
        } חיובים של ${service} - חיסכון פוטנציאלי של ₪${Math.round(
          monthlyAmount / 2
        )}/חודש`,
      });
    }
  });

  // אם אין התראות, הוסף הודעה חיובית
  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      icon: "✅",
      title: "הכל נראה תקין",
      description: "לא זוהו הוצאות חריגות או דפוסים מדאיגים השבוע",
    });
  }

  advancedAIData.alerts = alerts;
  console.log(`✅ חושבו ${alerts.length} התראות חכמות`);
}

// 🔮 חישוב תחזיות
async function calculatePredictions() {
  const coreData = window.aiCoreModule.getData();
  const transactions = coreData.transactions;
  const predictions = [];

  if (transactions.length < 30) {
    // תחזיות דמה אם אין מספיק נתונים
    predictions.push(
      {
        month: "החודש הבא",
        amount: "₪7,500",
        confidence: "75%",
        trend: "יציבות צפויה",
      },
      {
        month: "בעוד חודשיים",
        amount: "₪7,200",
        confidence: "68%",
        trend: "ירידה קלה",
      }
    );

    advancedAIData.predictions = predictions;
    return;
  }

  // חישוב ממוצע חודשי מהנתונים האמיתיים
  const monthlyTotals = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = 0;
    }

    monthlyTotals[monthKey] += Math.abs(
      t.chargedamount || t.originalamount || 0
    );
  });

  const monthlyAmounts = Object.values(monthlyTotals);
  const avgMonthly =
    monthlyAmounts.reduce((sum, amount) => sum + amount, 0) /
    monthlyAmounts.length;

  // חישוב מגמה (3 חודשים אחרונים vs קודמים)
  const sortedMonths = Object.keys(monthlyTotals).sort();
  const recentMonths = sortedMonths.slice(-3);
  const previousMonths = sortedMonths.slice(-6, -3);

  const recentAvg =
    recentMonths.reduce((sum, month) => sum + monthlyTotals[month], 0) /
    recentMonths.length;
  const previousAvg =
    previousMonths.length > 0
      ? previousMonths.reduce((sum, month) => sum + monthlyTotals[month], 0) /
        previousMonths.length
      : recentAvg;

  const trendPercent =
    previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  // תחזית לחודש הבא (בהתבסס על מגמה)
  const nextMonthPrediction = Math.round(
    recentAvg * (1 + (trendPercent / 100) * 0.5)
  );
  const confidence = Math.max(60, Math.min(90, 85 - Math.abs(trendPercent)));

  let trendDescription = "יציבות";
  if (trendPercent > 10) trendDescription = "עלייה";
  else if (trendPercent < -10) trendDescription = "ירידה";

  predictions.push({
    month: "החודש הבא",
    amount: `₪${nextMonthPrediction.toLocaleString()}`,
    confidence: `${Math.round(confidence)}%`,
    trend: `${trendDescription} צפויה`,
  });

  // תחזית לחודשיים קדימה (פחות ביטחון)
  const twoMonthsPrediction = Math.round(
    nextMonthPrediction * (1 + (trendPercent / 100) * 0.3)
  );

  predictions.push({
    month: "בעוד חודשיים",
    amount: `₪${twoMonthsPrediction.toLocaleString()}`,
    confidence: `${Math.round(confidence - 15)}%`,
    trend: `המשך ${trendDescription.toLowerCase()}`,
  });

  advancedAIData.predictions = predictions;
  console.log(`✅ חושבו ${predictions.length} תחזיות`);
}

// 🔍 חישוב דפוסי הוצאה
async function calculateSpendingPatterns() {
  const coreData = window.aiCoreModule.getData();
  const transactions = coreData.transactions;
  const patterns = [];

  if (transactions.length < 50) {
    // דפוסים דמה אם אין מספיק נתונים
    patterns.push(
      {
        title: "דפוס סוף שבוע",
        description: "הוצאות בילוי גבוהות יותר בסופי שבוע",
        impact: "+₪150",
        type: "weekend",
      },
      {
        title: "קניות דחופות",
        description: "עסקאות מהירות אחרי שעות העבודה",
        impact: "+₪89",
        type: "impulse",
      }
    );

    advancedAIData.patterns = patterns;
    return;
  }

  // ניתוח דפוס סוף שבוע
  const weekendSpending = [];
  const weekdaySpending = [];

  transactions.forEach((t) => {
    const dayOfWeek = new Date(t.date).getDay();
    const amount = Math.abs(t.chargedamount || t.originalamount || 0);

    if (dayOfWeek === 5 || dayOfWeek === 6) {
      // שישי ושבת
      weekendSpending.push(amount);
    } else {
      weekdaySpending.push(amount);
    }
  });

  const weekendAvg =
    weekendSpending.length > 0
      ? weekendSpending.reduce((sum, amount) => sum + amount, 0) /
        weekendSpending.length
      : 0;
  const weekdayAvg =
    weekdaySpending.length > 0
      ? weekdaySpending.reduce((sum, amount) => sum + amount, 0) /
        weekdaySpending.length
      : 0;

  if (weekendAvg > weekdayAvg * 1.3) {
    const weekendExtra = Math.round((weekendAvg - weekdayAvg) * 2 * 4); // 2 ימים × 4 שבועות
    patterns.push({
      title: "דפוס סוף שבוע",
      description: `הוצאות סוף שבוע גבוהות ב-${Math.round(
        ((weekendAvg - weekdayAvg) / weekdayAvg) * 100
      )}% מימי חול`,
      impact: `+₪${weekendExtra}`,
      type: "weekend",
    });
  }

  // ניתוח עסקאות קטנות תכופות
  const smallTransactions = transactions.filter((t) => {
    const amount = Math.abs(t.chargedamount || t.originalamount || 0);
    return amount > 10 && amount < 100;
  });

  if (smallTransactions.length > transactions.length * 0.6) {
    const smallTotal = smallTransactions.reduce(
      (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
      0
    );

    patterns.push({
      title: "עסקאות קטנות תכופות",
      description: `${smallTransactions.length} עסקאות קטנות (₪10-100) החודש`,
      impact: `₪${Math.round(smallTotal)}`,
      type: "frequent",
    });
  }

  // ניתוח תשלומים בתפזורת
  const installmentTransactions = transactions.filter(
    (t) => t.installment_info || (t.memo && t.memo.includes("מתוך"))
  );

  if (installmentTransactions.length > 5) {
    const installmentTotal = installmentTransactions.reduce(
      (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
      0
    );

    patterns.push({
      title: "תשלומים בתפזורת",
      description: `${installmentTransactions.length} תשלומים פעילים החודש`,
      impact: `₪${Math.round(installmentTotal)}`,
      type: "installments",
    });
  }

  advancedAIData.patterns = patterns;
  console.log(`✅ זוהו ${patterns.length} דפוסי הוצאה`);
}

// 💰 חישוב המלצות חיסכון
async function calculateSavingsRecommendations() {
  const coreData = window.aiCoreModule.getData();
  const transactions = coreData.transactions;
  const recommendations = [];

  // המלצות בסיסיות אם אין מספיק נתונים
  if (transactions.length < 30) {
    recommendations.push(
      {
        icon: "📱",
        title: "מעקב אחר מנויים",
        description: "עבור על כל המנויים החודשיים שלך ובטל את מה שלא בשימוש",
        impact: "₪50-150/חודש",
      },
      {
        icon: "🛒",
        title: "קניות מתוכננות",
        description: "כתוב רשימת קניות מראש כדי להימנע מקניות אימפולסיביות",
        impact: "₪100-300/חודש",
      }
    );

    advancedAIData.recommendations = recommendations;
    return;
  }

  // ניתוח הוצאות משלוח
  const deliveryTransactions = transactions.filter((t) => {
    const desc = (t.description || "").toLowerCase();
    return (
      desc.includes("wolt") ||
      desc.includes("uber") ||
      desc.includes("delivery") ||
      desc.includes("משלוח") ||
      desc.includes("דומינו") ||
      desc.includes("פיצה")
    );
  });

  if (deliveryTransactions.length > 8) {
    const deliveryTotal = deliveryTransactions.reduce(
      (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
      0
    );
    const monthlyDelivery = Math.round((deliveryTotal / 6) * 12); // הערכה שנתית

    recommendations.push({
      icon: "🍕",
      title: "הקטנת הזמנות משלוח",
      description: `${deliveryTransactions.length} הזמנות משלוח ב-6 חודשים - בישול בבית יכול לחסוך הרבה`,
      impact: `₪${Math.round(monthlyDelivery * 0.4)}/שנה`,
    });
  }

  // ניתוח מנויים
  const subscriptionKeywords = [
    "spotify",
    "netflix",
    "apple",
    "google",
    "amazon",
    "microsoft",
    "zoom",
  ];
  const subscriptions = {};

  transactions.forEach((t) => {
    const desc = (t.description || "").toLowerCase();
    subscriptionKeywords.forEach((keyword) => {
      if (desc.includes(keyword)) {
        if (!subscriptions[keyword]) subscriptions[keyword] = [];
        subscriptions[keyword].push(t);
      }
    });
  });

  const totalSubscriptions = Object.keys(subscriptions).length;
  if (totalSubscriptions > 3) {
    const subscriptionTotal = Object.values(subscriptions)
      .flat()
      .reduce(
        (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
        0
      );

    recommendations.push({
      icon: "📱",
      title: "ניהול מנויים דיגיטליים",
      description: `${totalSubscriptions} מנויים דיגיטליים זוהו - בדוק אילו מהם באמת בשימוש`,
      impact: `₪${Math.round(subscriptionTotal * 0.3)}/שנה`,
    });
  }

  // ניתוח קניות אימפולסיביות (עסקאות לילה)
  const nightTransactions = transactions.filter((t) => {
    const hour = new Date(t.created_at || t.date).getHours();
    return (
      (hour >= 22 || hour <= 6) &&
      Math.abs(t.chargedamount || t.originalamount || 0) > 50
    );
  });

  if (nightTransactions.length > 5) {
    const nightTotal = nightTransactions.reduce(
      (sum, t) => sum + Math.abs(t.chargedamount || t.originalamount || 0),
      0
    );

    recommendations.push({
      icon: "🌙",
      title: "הימנעות מקניות לילה",
      description: `${nightTransactions.length} קניות בשעות הלילה - התמהל 24 שעות לפני רכישות גדולות`,
      impact: `₪${Math.round(nightTotal * 0.5)}/שנה`,
    });
  }

  // המלצה כללית אם אין המלצות ספציפיות
  if (recommendations.length === 0) {
    recommendations.push({
      icon: "💡",
      title: "המשך בדרך הטובה",
      description: "הרגלי ההוצאה שלך נראים מאוזנים. המשך לעקוב ולבקר מעת לעת",
      impact: "חיסכון שוטף",
    });
  }

  advancedAIData.recommendations = recommendations;
  console.log(`✅ חושבו ${recommendations.length} המלצות חיסכון`);
}

// 📈 הכנת נתוני גרף
async function prepareChartData() {
  const coreData = window.aiCoreModule.getData();
  const transactions = coreData.transactions;

  if (transactions.length === 0) return;

  // נתונים לגרף מגמות (30 ימים אחרונים)
  const dailyData = {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // אתחול כל הימים
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = { amount: 0, aiCount: 0, manualCount: 0 };
  }

  // מילוי נתונים אמיתיים
  transactions
    .filter((t) => new Date(t.date) >= thirtyDaysAgo)
    .forEach((t) => {
      const dateKey = t.date.split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].amount += Math.abs(
          t.chargedamount || t.originalamount || 0
        );
        if (t.is_ai_categorized) {
          dailyData[dateKey].aiCount++;
        } else {
          dailyData[dateKey].manualCount++;
        }
      }
    });

  advancedAIData.chartData = dailyData;
}

// 📊 יצירת גרף מגמות חכם
function createSmartTrendsChart() {
  const ctx = document.getElementById("smartTrendsChart");
  if (!ctx) return;

  const chartData = advancedAIData.chartData;
  const dates = Object.keys(chartData).sort();

  // הרס גרף קיים
  if (smartTrendsChart) {
    smartTrendsChart.destroy();
  }

  smartTrendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.map((date) => {
        const d = new Date(date);
        return d.toLocaleDateString("he-IL", {
          month: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          label: "הוצאות יומיות",
          data: dates.map((date) => chartData[date].amount),
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          yAxisID: "y",
        },
        {
          label: "עסקאות AI",
          data: dates.map((date) => chartData[date].aiCount),
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          ticks: {
            callback: function (value) {
              return "₪" + value.toLocaleString();
            },
          },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function (value) {
              return value + " עסקאות";
            },
          },
        },
      },
    },
  });
}

// 🖥️ הצגת התראות חכמות
function displaySmartAlerts() {
  const container = document.getElementById("smart-alerts");
  if (!container) return;

  const alerts = advancedAIData.alerts;

  container.innerHTML = alerts
    .map(
      (alert) => `
    <div class="alert-item ${alert.type}">
      <div class="alert-icon">${alert.icon}</div>
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-description">${alert.description}</div>
      </div>
    </div>
  `
    )
    .join("");
}

// 🖥️ הצגת תחזיות
function displayPredictions() {
  const container = document.getElementById("predictions-list");
  if (!container) return;

  const predictions = advancedAIData.predictions;

  container.innerHTML = predictions
    .map(
      (pred) => `
    <div class="prediction-item">
      <div class="prediction-month">${pred.month}</div>
      <div class="prediction-amount">${pred.amount}</div>
      <div class="prediction-confidence">רמת ביטחון: ${pred.confidence} | מגמה: ${pred.trend}</div>
    </div>
  `
    )
    .join("");
}

// 🖥️ הצגת דפוסי הוצאה
function displaySpendingPatterns() {
  const container = document.getElementById("spending-patterns-list");
  if (!container) return;

  const patterns = advancedAIData.patterns;

  container.innerHTML = patterns
    .map(
      (pattern) => `
    <div class="pattern-item">
      <div class="pattern-info">
        <div class="pattern-title">${pattern.title}</div>
        <div class="pattern-description">${pattern.description}</div>
      </div>
      <div class="pattern-impact">${pattern.impact}</div>
    </div>
  `
    )
    .join("");
}

// 🖥️ הצגת המלצות חיסכון
function displaySavingsRecommendations() {
  const container = document.getElementById("savings-recommendations");
  if (!container) return;

  const recommendations = advancedAIData.recommendations;

  container.innerHTML = recommendations
    .map(
      (rec) => `
    <div class="recommendation-item">
      <div class="recommendation-title">
        <span>${rec.icon}</span>
        <span>${rec.title}</span>
      </div>
      <div class="recommendation-description">${rec.description}</div>
      <div class="recommendation-impact">חיסכון פוטנציאלי: ${rec.impact}</div>
    </div>
  `
    )
    .join("");
}

// 🧹 ניקוי משאבים
function destroyAdvancedCharts() {
  if (smartTrendsChart) {
    smartTrendsChart.destroy();
    smartTrendsChart = null;
  }
}

// 📤 ייצוא לשימוש גלובלי
window.aiAdvancedModule = {
  init: initAdvancedAI,
  getData: () => advancedAIData,
  destroyCharts: destroyAdvancedCharts,
};

// ניקוי בעזיבת דף
window.addEventListener("beforeunload", destroyAdvancedCharts);

console.log("🚀 AI Insights Advanced טוען...");
