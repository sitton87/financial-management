// 📊 מערכת דשבורד - גרפים ונתונים
// עובד עם auth.js ו-config.js

// 📊 טעינת נתונים ראשית
async function loadDashboard() {
  try {
    // קבלת supabase מ-auth.js
    const supabase = window.authModule?.supabase();
    if (!supabase) {
      console.error("❌ Supabase לא זמין");
      showError("מערכת לא מוכנה עדיין");
      return;
    }

    console.log("✅ Supabase מוכן לשימוש");

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // טעינת עסקאות החודש הנוכחי
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        categories (name, color, icon)
      `
      )
      .gte("transaction_date", `${currentMonth}-01`)
      .order("transaction_date", { ascending: false });

    if (error) throw error;

    console.log(`✅ נטענו ${transactions?.length || 0} עסקאות`);

    // עדכון סטטיסטיקות
    updateStats(transactions || []);

    // יצירת גרפים
    await createMonthlyChart();
    await createCategoryChart(transactions || []);

    // הצגת עסקאות אחרונות
    displayRecentTransactions((transactions || []).slice(0, 10));

    // הסתרת טעינה והצגת תוכן
    document.getElementById("loading").style.display = "none";
    document.getElementById("content").style.display = "block";
  } catch (error) {
    console.error("שגיאה בטעינת נתונים:", error);
    showError("שגיאה בטעינת נתונים: " + error.message);
  }
}

// 📈 עדכון סטטיסטיקות
function updateStats(transactions) {
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const avgAmount =
    transactions.length > 0 ? totalAmount / transactions.length : 0;

  // קטגוריה מובילה
  const categoryStats = {};
  transactions.forEach((t) => {
    if (t.categories?.name) {
      const categoryName = t.categories.name;
      categoryStats[categoryName] =
        (categoryStats[categoryName] || 0) + (t.amount || 0);
    }
  });

  const topCategory =
    Object.keys(categoryStats).length > 0
      ? Object.keys(categoryStats).reduce((a, b) =>
          categoryStats[a] > categoryStats[b] ? a : b
        )
      : "אין נתונים";

  // עדכון הממשק
  updateElement("total-amount", `₪${totalAmount.toLocaleString()}`);
  updateElement("total-transactions", transactions.length.toLocaleString());
  updateElement(
    "avg-transaction",
    `₪${Math.round(avgAmount).toLocaleString()}`
  );
  updateElement("top-category", topCategory);
}

// 📊 יצירת גרף חודשי
async function createMonthlyChart() {
  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) return;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from("transactions")
      .select("transaction_date, amount")
      .gte("transaction_date", sixMonthsAgo.toISOString().slice(0, 10))
      .order("transaction_date", { ascending: true });

    if (error) throw error;

    // קיבוץ לפי חודשים
    const monthlyData = {};
    (data || []).forEach((t) => {
      if (t.transaction_date && t.amount) {
        const month = t.transaction_date.slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + t.amount;
      }
    });

    const months = Object.keys(monthlyData).sort();
    const amounts = months.map((month) => monthlyData[month]);

    // יצירת גרף
    const ctx = document.getElementById("monthlyChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "line",
      data: {
        labels: months.map(formatMonthLabel),
        datasets: [
          {
            label: "הוצאות חודשיות",
            data: amounts,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
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

    console.log("✅ גרף חודשי נוצר");
  } catch (error) {
    console.error("שגיאה ביצירת גרף חודשי:", error);
  }
}

// 🥧 יצירת גרף קטגוריות
function createCategoryChart(transactions) {
  try {
    const categoryStats = {};
    const categoryColors = {};

    transactions.forEach((t) => {
      if (t.categories?.name) {
        const categoryName = t.categories.name;
        categoryStats[categoryName] =
          (categoryStats[categoryName] || 0) + (t.amount || 0);
        categoryColors[categoryName] = t.categories.color || "#667eea";
      }
    });

    const labels = Object.keys(categoryStats);
    const amounts = Object.values(categoryStats);
    const colors = labels.map((label) => categoryColors[label]);

    const ctx = document.getElementById("categoryChart");
    if (!ctx) return;

    if (labels.length === 0) {
      // אין נתונים - הצג הודעה
      ctx.getContext("2d").font = "16px Arial";
      ctx.getContext("2d").fillText("אין נתונים להצגה", 50, 50);
      return;
    }

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: amounts,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#fff",
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
              font: { size: 12 },
            },
          },
        },
      },
    });

    console.log("✅ גרף קטגוריות נוצר");
  } catch (error) {
    console.error("שגיאה ביצירת גרף קטגוריות:", error);
  }
}

// 📋 הצגת עסקאות אחרונות
function displayRecentTransactions(transactions) {
  const container = document.getElementById("recent-list");
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; padding: 20px; color: #666;">אין עסקאות להצגה</div>';
    return;
  }

  container.innerHTML = transactions
    .map(
      (t) => `
    <div class="transaction-item" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
      <div>
        <div class="transaction-business" style="font-weight: bold;">${
          t.business_name || "לא ידוע"
        }</div>
        <div class="transaction-date" style="font-size: 0.9rem; color: #666;">${formatDate(
          t.transaction_date
        )}</div>
      </div>
      <div class="transaction-amount" style="font-weight: bold; color: #e74c3c;">₪${(
        t.amount || 0
      ).toLocaleString()}</div>
    </div>
  `
    )
    .join("");
}

// 🛠️ פונקציות עזר
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function formatDate(dateString) {
  if (!dateString) return "תאריך לא ידוע";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL");
  } catch {
    return "תאריך לא תקין";
  }
}

function formatMonthLabel(month) {
  if (!month) return "";
  try {
    const [year, monthNum] = month.split("-");
    const monthNames = [
      "ינו",
      "פבר",
      "מרץ",
      "אפר",
      "מאי",
      "יונ",
      "יול",
      "אוג",
      "ספט",
      "אוק",
      "נוב",
      "דצמ",
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  } catch {
    return month;
  }
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.style.display = "block";
    errorElement.textContent = message;

    // הסתר טעינה
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";
  }

  console.error("🚨 Dashboard Error:", message);
}
