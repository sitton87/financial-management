// 📋 מערכת ניהול עסקאות מתקדמת
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
let pageSize = 50;
let sortField = "transaction_date";
let sortDirection = "desc";
let categories = [];

// 🚀 אתחול הדף - עם המתנה נכונה
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 מאתחל דף עסקאות...");

  // המתנה שauth.js יסיים
  let attempts = 0;
  while (
    (!window.authModule?.supabase() || !window.authModule?.currentUser()) &&
    attempts < 100
  ) {
    console.log(`⏳ ממתין לauth... ניסיון ${attempts + 1}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (attempts >= 100) {
    console.error("❌ timeout - auth לא נטען");
    showLoginScreen();
    return;
  }

  console.log("✅ Auth מוכן, בודק משתמש...");

  // עכשיו זה אמור לעבוד
  if (window.authModule?.currentUser()) {
    const user = window.authModule.currentUser();
    console.log("✅ משתמש נמצא:", user.email);

    const isAuthorized = await checkUserAuthorization(user.email);
    if (isAuthorized) {
      showMainApp();
      await initTransactionsPage();
    } else {
      showAccessDenied();
    }
  } else {
    console.log("❌ אין משתמש מחובר");
    showLoginScreen();
  }
});

// 🔐 פונקציות אותנטיקציה (העתקה מauth.js)
async function checkUserAuthorization(email) {
  console.log("🔍 בודק הרשאה עבור:", email);

  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) {
      console.error("❌ Supabase לא זמין");
      return false;
    }

    console.log("✅ Supabase זמין, שולח שאילתה...");

    const { data, error } = await supabase
      .from("authorized_users")
      .select("email")
      .eq("email", email)
      .single();

    console.log("📊 תוצאת שאילתה:", { data, error });

    if (error) {
      console.error("❌ שגיאה:", error);
      return false;
    }

    console.log("✅ הרשאה:", !!data);
    return !!data;
  } catch (error) {
    console.error("❌ Exception:", error);
    return false;
  }
}

function showLoginScreen() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("main-app").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
}

function showAccessDenied() {
  document.getElementById("access-denied").style.display = "block";
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-app").style.display = "none";
}

function showMainApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("main-app").style.display = "block";

  // יצירת כותרת עם ניווט
  const headerContainer = document.getElementById("header-container");
  if (headerContainer && window.navbarModule) {
    headerContainer.innerHTML = window.navbarModule.createHeader(
      "מערכת ניהול פיננסי",
      "ניהול וצפייה בעסקאות",
      "transactions"
    );
  }
}

// 📊 אתחול דף עסקאות
async function initTransactionsPage() {
  try {
    // טעינת נתונים
    await Promise.all([loadTransactions(), loadCategories()]);

    // הגדרת event listeners
    setupEventListeners();

    // הצגת התוכן
    document.getElementById("loading").style.display = "none";
    document.getElementById("content").style.display = "block";
  } catch (error) {
    console.error("שגיאה באתחול דף עסקאות:", error);
    showError("שגיאה בטעינת נתונים: " + error.message);
  }
}

// 📥 טעינת עסקאות
async function loadTransactions() {
  const { data: transactions, error } = await window.authModule
    .supabase()
    .from("transactions")
    .select(
      `
            *,
            categories (name, color, icon)
        `
    )
    .order("transaction_date", { ascending: false });

  if (error) throw error;

  allTransactions = transactions;
  filteredTransactions = [...allTransactions];

  // עדכון פילטרים
  populateFilters();

  // הצגת הנתונים
  updateSummary();
  renderTable();
}

// 📂 טעינת קטגוריות
async function loadCategories() {
  const { data, error } = await window.authModule
    .supabase()
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  categories = data;
}

// 🔧 הגדרת event listeners
function setupEventListeners() {
  // חיפוש
  document
    .getElementById("search-input")
    .addEventListener("input", applyFilters);

  // פילטרים
  document
    .getElementById("category-filter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("company-filter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("card-filter")
    .addEventListener("change", applyFilters);
  document.getElementById("date-from").addEventListener("change", applyFilters);
  document.getElementById("date-to").addEventListener("change", applyFilters);

  // ניקוי פילטרים
  document
    .getElementById("clear-filters")
    .addEventListener("click", clearFilters);

  // מיון טבלה
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => handleSort(th.dataset.sort));
  });

  // גודל דף
  document.getElementById("page-size").addEventListener("change", (e) => {
    pageSize = e.target.value === "all" ? Infinity : parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });

  // ייצוא
  document
    .getElementById("export-btn")
    .addEventListener("click", exportToExcel);

  // מודל עריכה
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-edit").addEventListener("click", closeModal);
  document
    .getElementById("save-category")
    .addEventListener("click", saveCategoryEdit);
}

// 🔍 מילוי פילטרים
function populateFilters() {
  // קטגוריות
  const categoryFilter = document.getElementById("category-filter");
  const uniqueCategories = [
    ...new Set(
      allTransactions.filter((t) => t.categories).map((t) => t.categories.name)
    ),
  ];

  categoryFilter.innerHTML = '<option value="">כל הקטגוריות</option>';
  uniqueCategories.forEach((category) => {
    categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
  });

  // חברות
  const companyFilter = document.getElementById("company-filter");
  const uniqueCompanies = [...new Set(allTransactions.map((t) => t.company))];

  companyFilter.innerHTML = '<option value="">כל החברות</option>';
  uniqueCompanies.forEach((company) => {
    companyFilter.innerHTML += `<option value="${company}">${company}</option>`;
  });

  // כרטיסים
  const cardFilter = document.getElementById("card-filter");
  const uniqueCards = [
    ...new Set(
      allTransactions
        .filter((t) => t.card_last_four)
        .map((t) => t.card_last_four)
    ),
  ];

  cardFilter.innerHTML = '<option value="">כל הכרטיסים</option>';
  uniqueCards.forEach((card) => {
    cardFilter.innerHTML += `<option value="${card}">****${card}</option>`;
  });
}

// 🔍 החלת פילטרים
function applyFilters() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("category-filter").value;
  const companyFilter = document.getElementById("company-filter").value;
  const cardFilter = document.getElementById("card-filter").value;
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;

  filteredTransactions = allTransactions.filter((transaction) => {
    // חיפוש טקסט
    if (
      searchTerm &&
      !transaction.business_name.toLowerCase().includes(searchTerm)
    ) {
      return false;
    }

    // קטגוריה
    if (categoryFilter && transaction.categories?.name !== categoryFilter) {
      return false;
    }

    // חברה
    if (companyFilter && transaction.company !== companyFilter) {
      return false;
    }

    // כרטיס
    if (cardFilter && transaction.card_last_four !== cardFilter) {
      return false;
    }

    // תאריכים
    const transactionDate = transaction.transaction_date;
    if (dateFrom && transactionDate < dateFrom) {
      return false;
    }
    if (dateTo && transactionDate > dateTo) {
      return false;
    }

    return true;
  });

  currentPage = 1;
  updateSummary();
  renderTable();
}

// 🗑️ ניקוי פילטרים
function clearFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("category-filter").value = "";
  document.getElementById("company-filter").value = "";
  document.getElementById("card-filter").value = "";
  document.getElementById("date-from").value = "";
  document.getElementById("date-to").value = "";

  filteredTransactions = [...allTransactions];
  currentPage = 1;
  updateSummary();
  renderTable();
}

// 📊 עדכון סיכום
function updateSummary() {
  const count = filteredTransactions.length;
  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avg = count > 0 ? total / count : 0;

  document.getElementById("filtered-count").textContent =
    count.toLocaleString();
  document.getElementById(
    "filtered-total"
  ).textContent = `₪${total.toLocaleString()}`;
  document.getElementById("filtered-avg").textContent = `₪${Math.round(
    avg
  ).toLocaleString()}`;
}

// 🔄 מיון
function handleSort(field) {
  if (sortField === field) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortDirection = "desc";
  }

  // עדכון UI
  document.querySelectorAll(".sort-arrow").forEach((arrow) => {
    arrow.className = "sort-arrow";
  });

  const currentArrow = document.querySelector(
    `th[data-sort="${field}"] .sort-arrow`
  );
  currentArrow.className = `sort-arrow ${sortDirection}`;

  // מיון הנתונים
  filteredTransactions.sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case "transaction_date":
        valueA = new Date(a.transaction_date);
        valueB = new Date(b.transaction_date);
        break;
      case "amount":
        valueA = a.amount;
        valueB = b.amount;
        break;
      case "category":
        valueA = a.categories?.name || "";
        valueB = b.categories?.name || "";
        break;
      default:
        valueA = a[field] || "";
        valueB = b[field] || "";
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  currentPage = 1;
  renderTable();
}

// 📋 רינדור טבלה
function renderTable() {
  const tbody = document.getElementById("transactions-tbody");
  const startIndex = pageSize === Infinity ? 0 : (currentPage - 1) * pageSize;
  const endIndex =
    pageSize === Infinity ? filteredTransactions.length : startIndex + pageSize;
  const pageTransactions = filteredTransactions.slice(startIndex, endIndex);

  tbody.innerHTML = pageTransactions
    .map(
      (transaction) => `
        <tr>
            <td>${formatDate(transaction.transaction_date)}</td>
            <td>${transaction.business_name}</td>
            <td style="font-weight: bold; color: #e74c3c;">₪${transaction.amount.toLocaleString()}</td>
            <td>
                <span class="category-tag" style="background-color: ${
                  transaction.categories?.color || "#6c757d"
                }">
                    ${transaction.categories?.icon || "📂"} ${
        transaction.categories?.name || "לא מוגדר"
      }
                </span>
            </td>
            <td>
                <span class="company-tag company-${transaction.company}">
                    ${transaction.company}
                </span>
            </td>
            <td>${
              transaction.card_last_four
                ? `****${transaction.card_last_four}`
                : "-"
            }</td>
            <td>
                <button class="action-btn" onclick="editCategory(${
                  transaction.id
                })">
                    ✏️ ערוך
                </button>
            </td>
        </tr>
    `
    )
    .join("");

  renderPagination();
}

// 📄 רינדור ניווט דפים
function renderPagination() {
  if (pageSize === Infinity) {
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const pagination = document.getElementById("pagination");

  let paginationHTML = "";

  // כפתור הקודם
  paginationHTML += `
        <button ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${
    currentPage - 1
  })">
            ← הקודם
        </button>
    `;

  // מספרי דפים
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <button class="${
              i === currentPage ? "active" : ""
            }" onclick="changePage(${i})">
                ${i}
            </button>
        `;
  }

  // כפתור הבא
  paginationHTML += `
        <button ${
          currentPage === totalPages ? "disabled" : ""
        } onclick="changePage(${currentPage + 1})">
            הבא →
        </button>
    `;

  pagination.innerHTML = paginationHTML;
}

// 📄 שינוי דף
function changePage(page) {
  currentPage = page;
  renderTable();
}

// ✏️ עריכת קטגוריה
function editCategory(transactionId) {
  const transaction = allTransactions.find((t) => t.id === transactionId);
  if (!transaction) return;

  // מילוי פרטי העסקה
  document.getElementById("edit-business-name").textContent =
    transaction.business_name;
  document.getElementById(
    "edit-amount"
  ).textContent = `₪${transaction.amount.toLocaleString()}`;

  // מילוי רשימת קטגוריות
  const categorySelect = document.getElementById("edit-category-select");
  categorySelect.innerHTML = categories
    .map(
      (cat) => `
        <option value="${cat.id}" ${
        cat.id === transaction.category_id ? "selected" : ""
      }>
            ${cat.icon} ${cat.name}
        </option>
    `
    )
    .join("");

  // שמירת ID העסקה
  categorySelect.dataset.transactionId = transactionId;

  // הצגת המודל
  document.getElementById("edit-modal").style.display = "flex";
}

// 💾 שמירת עריכת קטגוריה
async function saveCategoryEdit() {
  const categorySelect = document.getElementById("edit-category-select");
  const transactionId = categorySelect.dataset.transactionId;
  const newCategoryId = categorySelect.value;

  try {
    // עדכון במסד הנתונים
    const { error } = await window.authModule.supabase
      .from("transactions")
      .update({ category_id: newCategoryId })
      .eq("id", transactionId);

    if (error) throw error;

    // עדכון בנתונים המקומיים
    const transaction = allTransactions.find((t) => t.id == transactionId);
    if (transaction) {
      transaction.category_id = newCategoryId;
      const newCategory = categories.find((c) => c.id == newCategoryId);
      transaction.categories = newCategory;
    }

    // עדכון התצוגה
    applyFilters();
    closeModal();

    alert("הקטגוריה עודכנה בהצלחה!");
  } catch (error) {
    console.error("שגיאה בעדכון קטגוריה:", error);
    alert("שגיאה בעדכון הקטגוריה: " + error.message);
  }
}

// ❌ סגירת מודל
function closeModal() {
  document.getElementById("edit-modal").style.display = "none";
}

// 📤 ייצוא לExcel
function exportToExcel() {
  const headers = ["תאריך", "עסק", "סכום", "קטגוריה", "חברה", "כרטיס"];
  const data = filteredTransactions.map((t) => [
    formatDate(t.transaction_date),
    t.business_name,
    t.amount,
    t.categories?.name || "לא מוגדר",
    t.company,
    t.card_last_four ? `****${t.card_last_four}` : "-",
  ]);

  // יצירת CSV
  const csvContent = [headers, ...data]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  // הורדה
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `עסקאות_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

// 🛠️ פונקציות עזר
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("he-IL");
}

function showError(message) {
  document.getElementById("loading").style.display = "none";
  document.getElementById("error-message").style.display = "block";
  document.getElementById("error-message").textContent = message;
}

// 🌐 חשיפת פונקציות לשימוש גלובלי
window.transactionsModule = {
  editCategory,
  changePage,
  saveCategoryEdit,
  closeModal,
};

// גם לחשוף פונקציות לשימוש ישיר ב-HTML
window.editCategory = editCategory;
window.changePage = changePage;
