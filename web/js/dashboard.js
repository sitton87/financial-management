// 📊 דשבורד ראשי - מעודכן למערכת אימות חדשה
let dashboardData = {
  transactions: [],
  categories: [],
  monthlyStats: [],
};

// משתנים גלובליים לגרפים
let monthlyChart = null;
let weeklyChart = null;
let categoryChart = null;
let dailyChart = null;

// 🚀 אתחול הדף
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🏠 מאתחל דף הבית...");

  // המתנה ל-config
  while (!window.appConfig?.loaded) {
    console.log("⏳ ממתין לconfig...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // המתנה ל-auth
  while (!window.authModule?.isReady()) {
    console.log("⏳ ממתין לauth...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("✅ מערכות מוכנות, בודק אימות...");

  // בדיקת אימות ואתחול
  initDashboard();
});

// 🔐 אתחול הדשבורד
function initDashboard() {
  // האזנה לשינויי אימות
  window.authModule.onAuthStateChange((event, user) => {
    console.log(`🔄 שינוי אימות בדשבורד: ${event}`, user?.email || "אין משתמש");

    switch (event) {
      case "AUTHORIZED":
        showMainApp(user);
        loadDashboardData();
        break;

      case "UNAUTHORIZED":
        showAccessDenied();
        break;

      case "SIGNED_OUT":
        showLoginScreen();
        break;
    }
  });

  // בדיקת מצב נוכחי
  if (window.authModule.isAuthenticated()) {
    const user = window.authModule.currentUser();
    showMainApp(user);
    loadDashboardData();
  } else {
    showLoginScreen();
  }
}

// 🔐 הצגת מסך התחברות
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("main-app").style.display = "none";

  // הוספת event listener לכפתור התחברות
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = () => window.authModule.signInWithGoogle();
  }
}

// ❌ הצגת מסך גישה נדחתה
function showAccessDenied() {
  document.getElementById("access-denied").style.display = "block";
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-app").style.display = "none";

  // הוספת event listener לכפתור התנתקות
  const logoutBtn = document.getElementById("logout-btn-denied");
  if (logoutBtn) {
    logoutBtn.onclick = () => window.authModule.signOut();
  }
}

// 📊 הצגת האפליקציה הראשית
function showMainApp(user) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("main-app").style.display = "block";

  // יצירת כותרת עם ניווט
  const headerContainer = document.getElementById("header-container");
  if (headerContainer && window.navbarModule) {
    headerContainer.innerHTML = window.navbarModule.createHeader(
      "מערכת ניהול פיננסי",
      `שלום ${user.name || user.email}`,
      "home"
    );
  }

  // הוסף כפתור התנתקות אם קיים navbar
  setTimeout(() => {
    const logoutBtns = document.querySelectorAll(".logout-btn");
    logoutBtns.forEach((btn) => {
      btn.onclick = () => window.authModule.signOut();
    });
  }, 100);
}

// 📥 טעינת נתונים לדשבורד
async function loadDashboardData() {
  try {
    console.log("📊 טוען נתונים לדשבורד...");

    // הצגת מסך טעינה
    document.getElementById("loading").style.display = "block";
    document.getElementById("content").style.display = "none";
    document.getElementById("error-message").style.display = "none";

    // שמות טבלאות
    const transactionsTable = window.appConfig.getTableName("transactions");
    const categoriesTable = window.appConfig.getTableName("categories");

    // טעינת נתונים בבקשות מקבילות
    const [transactionsResult, categoriesResult] = await Promise.all([
      loadTransactionsData(transactionsTable, categoriesTable),
      loadCategoriesData(categoriesTable),
    ]);

    if (transactionsResult.error || categoriesResult.error) {
      throw new Error(
        transactionsResult.error?.message || categoriesResult.error?.message
      );
    }

    dashboardData.transactions = transactionsResult.data || [];
    dashboardData.categories = categoriesResult.data || [];

    console.log(
      `✅ נטענו ${dashboardData.transactions.length} עסקאות ו-${dashboardData.categories.length} קטגוריות`
    );

    // עיבוד ונתונים והצגה
    await processAndDisplayData();
  } catch (error) {
    console.error("❌ שגיאה בטעינת נתונים:", error);
    showError("שגיאה בטעינת נתונים: " + error.message);
  }
}

// 📊 טעינת עסקאות
async function loadTransactionsData(transactionsTable, categoriesTable) {
  try {
    // טעינת עסקאות מ-12 חודשים אחרונים (יותר נתונים לdropdowns)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    console.log(`🔍 טוען עסקאות עם JOIN ל-${categoriesTable}...`);

    const result = await window.authModule
      .supabase()
      .from(transactionsTable)
      .select(
        `
        identifier,
        cardlast4,
        date,
        description,
        memo,
        originalamount,
        chargedamount,
        originalcurrency,
        chargedcurrency,
        category_id,
        category,
        is_ai_categorized,
        installment_info,
        created_at,
        source_file,
        categories:category_id (
          id,
          name,
          color,
          icon
        )
      `
      )
      .gte("date", twelveMonthsAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
      .limit(2000);

    // 🔍 Debug: בדוק מבנה הנתונים
    if (result.data && result.data.length > 0) {
      console.log("🔍 דוגמא של עסקה ראשונה:", result.data[0]);
      console.log("🔍 מבנה categories:", result.data[0].categories);
    }

    return result;
  } catch (error) {
    console.error("❌ שגיאה בטעינת עסקאות:", error);
    return { error };
  }
}

// 📂 טעינת קטגוריות
async function loadCategoriesData(categoriesTable) {
  try {
    return await window.authModule
      .supabase()
      .from(categoriesTable)
      .select("*")
      .eq("is_active", true)
      .order("name");
  } catch (error) {
    console.error("❌ שגיאה בטעינת קטגוריות:", error);
    return { error };
  }
}

// 🔢 עיבוד והצגת נתונים
async function processAndDisplayData() {
  // חישוב סטטיסטיקות
  const stats = calculateStats();

  // עדכון KPIs
  updateStatsDisplay(stats);

  // יצירת גרפים
  await createCharts(stats);

  // הצגת עסקאות אחרונות
  displayRecentTransactions();

  // אתחול dropdowns
  initializeDropdowns();

  // הסתרת מסך טעינה והצגת התוכן
  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "block";
}

// 📊 חישוב סטטיסטיקות
function calculateStats() {
  const transactions = dashboardData.transactions;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // עסקאות החודש הנוכחי
  const thisMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  // חישובים בסיסיים
  const totalAmount = thisMonthTransactions.reduce(
    (sum, t) => sum + (t.chargedamount || t.originalamount || 0),
    0
  );
  const totalCount = thisMonthTransactions.length;
  const avgTransaction = totalCount > 0 ? totalAmount / totalCount : 0;

  // 🔧 תיקון קטגוריה מובילה
  const categoryStats = {};
  thisMonthTransactions.forEach((t) => {
    let categoryName = "לא מוגדר";

    if (t.categories && t.categories.name) {
      categoryName = t.categories.name;
    } else if (t.category) {
      categoryName = t.category;
    }

    const amount = Math.abs(t.chargedamount || t.originalamount || 0);
    categoryStats[categoryName] = (categoryStats[categoryName] || 0) + amount;
  });

  let topCategory = "לא מוגדר";
  let maxAmount = 0;

  Object.keys(categoryStats).forEach((category) => {
    if (categoryStats[category] > maxAmount) {
      maxAmount = categoryStats[category];
      topCategory = category;
    }
  });

  // נתונים לגרפים עם ערכי ברירת מחדל
  const monthlyData = calculateMonthlyData(6);
  const categoryData = calculateCategoryData(3);
  const weeklyData = calculateWeeklyData(4);
  const dailyTrendData = calculateDailyTrendData(7);

  return {
    totalAmount,
    totalCount,
    avgTransaction,
    topCategory,
    monthlyData,
    categoryData,
    weeklyData,
    dailyTrendData,
  };
}

// 📊 עדכון תצוגת KPIs
function updateStatsDisplay(stats) {
  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  const displayAmount = Math.abs(stats.totalAmount);
  const displayAvg = Math.abs(stats.avgTransaction);

  document.getElementById(
    "total-amount"
  ).textContent = `${currencySymbol}${Math.round(
    displayAmount
  ).toLocaleString()}`;

  document.getElementById("total-transactions").textContent =
    stats.totalCount.toLocaleString();

  document.getElementById(
    "avg-transaction"
  ).textContent = `${currencySymbol}${Math.round(displayAvg).toLocaleString()}`;

  document.getElementById("top-category").textContent =
    stats.topCategory || "לא מוגדר";
}

// 📈 יצירת גרפים
async function createCharts(stats) {
  createMonthlyChart(stats.monthlyData);
  createWeeklyChart(stats.weeklyData);
  createCategoryChart(stats.categoryData);
  createDailyTrendChart(stats.dailyTrendData);
}

// 🎯 אתחול event listeners ל-dropdowns
function initializeDropdowns() {
  console.log("🎛️ מאתחל dropdowns...");

  // Event listeners לכל ה-dropdowns
  const monthlyRange = document.getElementById("monthlyRange");
  const weeklyRange = document.getElementById("weeklyRange");
  const categoryRange = document.getElementById("categoryRange");
  const dailyRange = document.getElementById("dailyRange");

  if (monthlyRange) {
    monthlyRange.addEventListener("change", updateMonthlyChart);
    console.log("✅ Monthly dropdown מחובר");
  }

  if (weeklyRange) {
    weeklyRange.addEventListener("change", updateWeeklyChart);
    console.log("✅ Weekly dropdown מחובר");
  }

  if (categoryRange) {
    categoryRange.addEventListener("change", updateCategoryChart);
    console.log("✅ Category dropdown מחובר");
  }

  if (dailyRange) {
    dailyRange.addEventListener("change", updateDailyChart);
    console.log("✅ Daily dropdown מחובר");
  }

  console.log("🎛️ כל הDropdowns מותקנים");
}

// 📈 עדכון גרף חודשי
function updateMonthlyChart() {
  const months = parseInt(document.getElementById("monthlyRange").value);
  console.log(`📈 מעדכן גרף חודשי ל-${months} חודשים`);

  const monthlyData = calculateMonthlyData(months);

  // הרס גרף קיים
  if (monthlyChart) {
    monthlyChart.destroy();
  }

  createMonthlyChart(monthlyData);
  console.log(`✅ גרף חודשי עודכן ל-${months} חודשים`);
}

// 📊 עדכון גרף שבועי
function updateWeeklyChart() {
  const weeks = parseInt(document.getElementById("weeklyRange").value);
  console.log(`📊 מעדכן גרף שבועי ל-${weeks} שבועות`);

  const weeklyData = calculateWeeklyData(weeks);

  // הרס גרף קיים
  if (weeklyChart) {
    weeklyChart.destroy();
  }

  createWeeklyChart(weeklyData);
  console.log(`✅ גרף שבועי עודכן ל-${weeks} שבועות`);
}

// 🥧 עדכון גרף קטגוריות
function updateCategoryChart() {
  const months = parseInt(document.getElementById("categoryRange").value);
  console.log(`🥧 מעדכן גרף קטגוריות ל-${months} חודשים`);

  const categoryData = calculateCategoryData(months);

  // הרס גרף קיים
  if (categoryChart) {
    categoryChart.destroy();
  }

  createCategoryChart(categoryData);
  console.log(`✅ גרף קטגוריות עודכן ל-${months} חודשים`);
}

// 📈 עדכון גרף יומי
function updateDailyChart() {
  const days = parseInt(document.getElementById("dailyRange").value);
  console.log(`📈 מעדכן גרף יומי ל-${days} ימים`);

  const dailyData = calculateDailyTrendData(days);

  // הרס גרף קיים
  if (dailyChart) {
    dailyChart.destroy();
  }

  createDailyTrendChart(dailyData);
  console.log(`✅ גרף יומי עודכן ל-${days} ימים`);
}

// 📈 חישוב נתונים חודשיים (עם פרמטר)
function calculateMonthlyData(monthsBack = 6) {
  const monthlyStats = {};

  dashboardData.transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = 0;
    }

    const amount = Math.abs(t.chargedamount || t.originalamount || 0);
    monthlyStats[monthKey] += amount;
  });

  return Object.keys(monthlyStats)
    .sort()
    .slice(-monthsBack)
    .map((key) => ({
      month: key,
      amount: monthlyStats[key],
    }));
}

// 📊 חישוב נתונים שבועיים (עם פרמטר)
function calculateWeeklyData(weeksBack = 4) {
  const weeklyStats = {};
  const currentDate = new Date();
  const weeksAgo = new Date(
    currentDate.getTime() - weeksBack * 7 * 24 * 60 * 60 * 1000
  );

  const recentTransactions = dashboardData.transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= weeksAgo;
  });

  recentTransactions.forEach((t) => {
    const date = new Date(t.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = {
        amount: 0,
        count: 0,
      };
    }

    const amount = Math.abs(t.chargedamount || t.originalamount || 0);
    weeklyStats[weekKey].amount += amount;
    weeklyStats[weekKey].count++;
  });

  return Object.keys(weeklyStats)
    .sort()
    .slice(-weeksBack)
    .map((key) => ({
      week: key,
      amount: weeklyStats[key].amount,
      count: weeklyStats[key].count,
    }));
}

// 🥧 חישוב נתונים קטגוריות (עם פרמטר)
function calculateCategoryData(monthsBack = 3) {
  const categoryStats = {};
  const currentDate = new Date();
  const monthsAgo = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - monthsBack,
    1
  );

  // פילטר עסקאות לפי טווח זמן
  const filteredTransactions = dashboardData.transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= monthsAgo;
  });

  filteredTransactions.forEach((t) => {
    let categoryName = "לא מוגדר";
    let categoryColor = "#6c757d";

    if (t.categories && t.categories.name) {
      categoryName = t.categories.name;
      categoryColor = t.categories.color || "#6c757d";
    } else if (t.category) {
      categoryName = t.category;
    }

    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = {
        amount: 0,
        color: categoryColor,
        count: 0,
      };
    }

    categoryStats[categoryName].amount += Math.abs(
      t.chargedamount || t.originalamount || 0
    );
    categoryStats[categoryName].count++;
  });

  return Object.keys(categoryStats)
    .map((name) => ({
      name,
      amount: categoryStats[name].amount,
      color: categoryStats[name].color,
      count: categoryStats[name].count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

// 📈 חישוב נתונים יומיים (עם פרמטר)
function calculateDailyTrendData(daysBack = 7) {
  const dailyStats = {};
  const currentDate = new Date();

  // אתחול כל הימים ב-0
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dayKey = date.toISOString().split("T")[0];
    dailyStats[dayKey] = { amount: 0, count: 0 };
  }

  // פילטר עסקאות לפי טווח זמן
  const daysAgo = new Date(
    currentDate.getTime() - daysBack * 24 * 60 * 60 * 1000
  );
  const recentTransactions = dashboardData.transactions.filter((t) => {
    const date = new Date(t.date);
    return date >= daysAgo;
  });

  recentTransactions.forEach((t) => {
    const dayKey = t.date.split("T")[0];
    if (dailyStats[dayKey]) {
      const amount = Math.abs(t.chargedamount || t.originalamount || 0);
      dailyStats[dayKey].amount += amount;
      dailyStats[dayKey].count++;
    }
  });

  return Object.keys(dailyStats)
    .sort()
    .map((key) => ({
      day: key,
      amount: dailyStats[key].amount,
      count: dailyStats[key].count,
    }));
}

// 📈 גרף הוצאות חודשי
function createMonthlyChart(monthlyData) {
  const ctx = document.getElementById("monthlyChart");
  if (!ctx) return;

  monthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: monthlyData.map((d) => {
        const [year, month] = d.month.split("-");
        return new Date(year, month - 1).toLocaleDateString("he-IL", {
          month: "short",
          year: "2-digit",
        });
      }),
      datasets: [
        {
          label: "הוצאות חודשיות",
          data: monthlyData.map((d) => d.amount),
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "₪" + value.toLocaleString();
            },
          },
        },
      },
    },
  });
}

// 🆕 גרף הוצאות שבועי
function createWeeklyChart(weeklyData) {
  const ctx = document.getElementById("weeklyChart");
  if (!ctx) return;

  weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weeklyData.map((d) => {
        const date = new Date(d.week);
        return `שבוע ${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: "הוצאות שבועיות",
          data: weeklyData.map((d) => d.amount),
          backgroundColor: "rgba(118, 75, 162, 0.8)",
          borderColor: "#764ba2",
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "₪" + value.toLocaleString();
            },
          },
        },
      },
    },
  });
}

// 🥧 גרף קטגוריות (עם אחוזים וסכומים בתוך החלקים)
function createCategoryChart(categoryData) {
  const ctx = document.getElementById("categoryChart");
  if (!ctx) return;

  // צבעים קבועים ומגוונים
  const fixedColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
  ];

  const finalColors = categoryData.map((item, index) => {
    return fixedColors[index % fixedColors.length];
  });

  // חישוב סה"כ לאחוזים
  const totalAmount = categoryData.reduce(
    (sum, item) => sum + Math.abs(item.amount),
    0
  );
  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryData.map((c) => c.name),
      datasets: [
        {
          data: categoryData.map((c) => Math.abs(c.amount)),
          backgroundColor: finalColors,
          borderWidth: 3,
          borderColor: "#ffffff",
          hoverBorderWidth: 4,
          hoverBorderColor: "#000000",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = ((value / totalAmount) * 100).toFixed(1);
              return `${label}: ${currencySymbol}${value.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
      elements: {
        arc: {
          borderWidth: 3,
        },
      },
    },
    // הוספת plugin מותאם אישית לlabels בתוך הפאי
    plugins: [
      {
        afterDatasetsDraw: function (chart) {
          const ctx = chart.ctx;

          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);

            meta.data.forEach((arc, index) => {
              const value = dataset.data[index];
              const percentage = ((value / totalAmount) * 100).toFixed(0);

              // הצג רק אם האחוז גדול מ-8%
              if (percentage >= 8) {
                const centerX = arc.x;
                const centerY = arc.y;

                // חישוב זווית למיקום הטקסט
                const startAngle = arc.startAngle;
                const endAngle = arc.endAngle;
                const midAngle = (startAngle + endAngle) / 2;

                // מיקום הטקסט
                const radius = (arc.innerRadius + arc.outerRadius) / 2;
                const x = centerX + Math.cos(midAngle) * radius * 0.7;
                const y = centerY + Math.sin(midAngle) * radius * 0.7;

                // עיצוב הטקסט
                ctx.fillStyle = "white";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // הוספת צל לטקסט
                ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                // ציור האחוז
                ctx.fillText(`${percentage}%`, x, y - 8);

                // ציור הסכום
                ctx.font = "bold 12px Arial";
                ctx.fillText(
                  `₪${Math.round(value).toLocaleString()}`,
                  x,
                  y + 8
                );

                // איפוס הצל
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              }
            });
          });
        },
      },
    ],
  });
}

// 🆕 גרף מגמה יומית (רביעי)
function createDailyTrendChart(dailyData) {
  const ctx = document.getElementById("dailyChart");
  if (!ctx) return;

  dailyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dailyData.map((d) => {
        const date = new Date(d.day);
        return date.toLocaleDateString("he-IL", {
          weekday: "short",
          day: "numeric",
        });
      }),
      datasets: [
        {
          label: "מגמה יומית",
          data: dailyData.map((d) => d.amount),
          borderColor: "#ff6b6b",
          backgroundColor: "rgba(255, 107, 107, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#ff6b6b",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return "₪" + value.toLocaleString();
            },
          },
        },
      },
    },
  });
}

// 📋 הצגת עסקאות אחרונות (טבלה מסודרת)
function displayRecentTransactions() {
  const recentList = document.getElementById("recent-list");
  if (!recentList) return;

  const recent = dashboardData.transactions.slice(0, 10);
  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  recentList.innerHTML = `
    <div style="background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- כותרות הטבלה -->
      <div style="background: #f8f9fa; padding: 15px; border-bottom: 2px solid #dee2e6; display: flex; font-weight: bold; color: #495057;">
        <div style="flex: 2.5; text-align: right;">📋 עסקה</div>
        <div style="flex: 1.2; text-align: center;">💰 סכום</div>
        <div style="flex: 1.3; text-align: center;">🏷️ קטגוריה</div>
        <div style="flex: 1; text-align: center;">💳 כרטיס</div>
        <div style="flex: 0.8; text-align: center;">🤖 סוג</div>
        <div style="flex: 1.5; text-align: center;">📅 תשלומים</div>
      </div>
      
      <!-- שורות הטבלה -->
      ${recent
        .map((t, index) => {
          // זיהוי קטגוריה
          let categoryName = "לא מוגדר";
          let categoryColor = "#6c757d";
          let categoryIcon = "📂";

          if (t.categories && t.categories.name) {
            categoryName = t.categories.name;
            categoryColor = t.categories.color || "#6c757d";
            categoryIcon = t.categories.icon || "📂";
          } else if (t.category) {
            categoryName = t.category;
          }

          // חישוב מידע
          const isAI = t.is_ai_categorized ? "🤖" : "👤";
          const hasInstallments = t.memo && t.memo.includes("מתוך");
          const installmentInfo = hasInstallments
            ? calculateInstallmentInfo(t.memo, t.date)
            : "";
          const displayAmount = Math.abs(
            t.chargedamount || t.originalamount || 0
          );

          return `
          <div style="padding: 15px; border-bottom: 1px solid #e9ecef; display: flex; align-items: center; ${
            index % 2 === 0 ? "background: #f8f9fa;" : "background: white;"
          } border-right: 4px solid ${categoryColor};">
            <!-- מידע העסקה -->
            <div style="flex: 2.5; text-align: right;">
              <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 1em;">
                ${t.description || "עסקה"}
              </div>
              <div style="color: #666; font-size: 0.85em;">
                📅 ${formatDate(t.date)}
              </div>
            </div>
            
            <!-- סכום -->
            <div style="flex: 1.2; text-align: center;">
              <div style="font-size: 1.1em; font-weight: bold; color: #28a745;">
                ${currencySymbol}${displayAmount.toLocaleString()}
              </div>
            </div>
            
            <!-- קטגוריה -->
            <div style="flex: 1.3; text-align: center;">
              <span style="background-color: ${categoryColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; display: inline-block; white-space: nowrap;">
                ${categoryIcon} ${categoryName}
              </span>
            </div>
            
            <!-- כרטיס אשראי -->
            <div style="flex: 1; text-align: center;">
              <div style="background: #e9ecef; color: #495057; padding: 6px 10px; border-radius: 15px; font-size: 0.85em; display: inline-block;">
                💳 ****${t.cardlast4 || "0000"}
              </div>
            </div>
            
            <!-- AI/ידני -->
            <div style="flex: 0.8; text-align: center;">
              <div style="font-size: 1.2em; ${
                t.is_ai_categorized ? "color: #007bff;" : "color: #28a745;"
              }">
                ${isAI}
              </div>
              <div style="font-size: 0.7em; margin-top: 2px; font-weight: bold;">
                ${t.is_ai_categorized ? "AI" : "ידני"}
              </div>
            </div>
            
            <!-- תשלומים -->
            <div style="flex: 1.5; text-align: center;">
              ${
                installmentInfo
                  ? `<div style="font-size: 0.85em; color: #007bff; background: #e3f2fd; padding: 6px 10px; border-radius: 12px; display: inline-block; white-space: nowrap;">
                   💳 ${installmentInfo}
                 </div>`
                  : `<div style="font-size: 0.85em; color: #28a745; background: #e8f5e8; padding: 6px 10px; border-radius: 12px; display: inline-block;">
                   ✅ חד פעמי
                 </div>`
              }
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

// 🔧 פונקציה לחישוב מידע תשלומים
function calculateInstallmentInfo(memo, transactionDate) {
  if (!memo) return "";

  const match = memo.match(/(\d+)\s*מתוך\s*(\d+)/);

  if (match) {
    const currentPayment = parseInt(match[1]);
    const totalPayments = parseInt(match[2]);
    const remainingPayments = totalPayments - currentPayment;

    if (remainingPayments <= 0) {
      return `${currentPayment}/${totalPayments} - אחרון`;
    } else {
      return `${currentPayment}/${totalPayments} - עוד ${remainingPayments}`;
    }
  }

  return "";
}

// 🛠️ פונקציות עזר
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("he-IL");
}

function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("content").style.display = "none";
  document.getElementById("error-message").style.display = "block";
  document.getElementById("error-message").textContent = message;
}

// ייצוא לשימוש גלובלי
window.dashboardModule = {
  loadDashboardData,
  showError,
};

console.log("🏠 Dashboard module טוען...");
