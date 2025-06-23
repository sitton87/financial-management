// 📋 מערכת ניהול עסקאות מתקדמת - מעודכן למבנה החדש
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
let pageSize = 50;
let sortField = "date"; // 🔧 שונה מ-transaction_date ל-date
let sortDirection = "desc";
let categories = [];

// 🚀 אתחול הדף - עם המתנה נכונה
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 מאתחל דף עסקאות...");

  // המתנה ש-config יטען
  while (!window.appConfig?.loaded) {
    console.log("⏳ ממתין לconfig...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

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

// 🔐 פונקציות אותנטיקציה (מעודכן למבנה החדש)
async function checkUserAuthorization(email) {
  console.log("🔍 בודק הרשאה עבור:", email);

  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) {
      console.error("❌ Supabase לא זמין");
      return false;
    }

    console.log("✅ Supabase זמין, שולח שאילתה...");

    // 🔧 עדכון לשם הטבלה החדש
    const tableName = window.appConfig.getTableName("authorized_users");
    const { data, error } = await supabase
      .from(tableName)
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
    // 🔧 הגדרת pageSize מconfig
    pageSize = window.appConfig.getAppConfig().paginationSize;

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

// 📥 טעינת עסקאות (עם טעינה בחלקים)
async function loadTransactions() {
  try {
    const transactionsTable = window.appConfig.getTableName("transactions");
    const categoriesTable = window.appConfig.getTableName("categories");

    console.log(`📊 טוען עסקאות מטבלה: ${transactionsTable}`);

    // ספירה לבדיקה
    const { count, error: countError } = await window.authModule
      .supabase()
      .from(transactionsTable)
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ שגיאה בספירת עסקאות:", countError);
      throw countError;
    }

    console.log(`📊 סה"כ עסקאות בטבלה: ${count}`);

    // 🚀 טעינה בחלקים (batches)
    const batchSize = 1000;
    let allTransactionsData = [];

    for (let offset = 0; offset < count; offset += batchSize) {
      const endRange = Math.min(offset + batchSize - 1, count - 1);

      console.log(
        `📥 טוען batch ${
          Math.floor(offset / batchSize) + 1
        }: שורות ${offset}-${endRange}`
      );

      const { data: batch, error: batchError } = await window.authModule
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
          ${categoriesTable} (
            id,
            name,
            color,
            icon
          )
        `
        )
        .order("date", { ascending: false })
        .range(offset, endRange);

      if (batchError) {
        console.error(
          `❌ שגיאה בטעינת batch ${Math.floor(offset / batchSize) + 1}:`,
          batchError
        );
        throw batchError;
      }

      console.log(
        `✅ נטען batch ${Math.floor(offset / batchSize) + 1}: ${
          batch.length
        } עסקאות`
      );
      allTransactionsData.push(...batch);

      // עצירה אם קיבלנו פחות מהצפוי (סיימנו)
      if (batch.length < batchSize) {
        console.log(`🏁 סיימנו טעינה מוקדמת - batch אחרון`);
        break;
      }
    }

    console.log(
      `🎉 סיימנו טעינה: ${allTransactionsData.length} עסקאות נטענו בסך הכל`
    );

    // עיבוד הנתונים
    allTransactions = processTransactionData(allTransactionsData);
    filteredTransactions = [...allTransactions];

    // עדכון התצוגה
    populateFilters();
    updateSummary();
    renderTable();
  } catch (error) {
    console.error("❌ שגיאה בטעינת עסקאות:", error);
    throw error;
  }
}

// 🔧 פונקציה נפרדת לעיבוד נתונים
function processTransactionData(transactions) {
  return transactions.map((transaction) => ({
    ...transaction,
    // תאימות לאחור - המרה לשמות שהקוד מצפה להם
    business_name: transaction.description || "לא מוגדר",
    amount: transaction.chargedamount || transaction.originalamount || 0,
    transaction_date: transaction.date,
    company: extractCompanyFromDescription(transaction.description),
    card_last_four: transaction.cardlast4,
    // שמירה על הנתונים המקוריים
    original_data: {
      identifier: transaction.identifier,
      cardlast4: transaction.cardlast4,
      originalamount: transaction.originalamount,
      chargedamount: transaction.chargedamount,
      originalcurrency: transaction.originalcurrency,
      chargedcurrency: transaction.chargedcurrency,
    },
  }));
}

// 🏢 פונקציה לחישוב מידע תשלומים
function calculateInstallmentInfo(memo, transactionDate) {
  if (!memo) return "-";

  // חיפוש אחר פורמט "X מתוך Y"
  const match = memo.match(/(\d+)\s*מתוך\s*(\d+)/);

  if (match) {
    const currentPayment = parseInt(match[1]); // X
    const totalPayments = parseInt(match[2]); // Y
    const remainingPayments = totalPayments - currentPayment;

    if (remainingPayments <= 0) {
      return `<span class="installment-final">${currentPayment} מתוך ${totalPayments} - תשלום אחרון</span>`;
    } else {
      const date = new Date(transactionDate);
      date.setMonth(date.getMonth() + remainingPayments);
      const monthName = date.toLocaleDateString("he-IL", {
        month: "long",
        year: "2-digit",
      });
      return `<span class="installment-pending">${currentPayment} מתוך ${totalPayments}<br><small>אחרון: ${monthName}</small></span>`;
    }
  } else {
    // אין פורמט תשלומים - החזר את memo המקורי
    return `<span class="memo-text">${memo}</span>`;
  }
}

// 🏢 חילוץ שם חברה מתיאור (פונקציה חדשה)
function extractCompanyFromDescription(description) {
  if (!description) return "לא מוגדר";

  // רשימת חברות אשראי ידועות
  const companies = {
    visa: "ויזה",
    mastercard: "מסטרקארד",
    "american express": "אמריקן אקספרס",
    isracard: "ישראכרט",
    max: "מקס",
    cal: "כאל",
  };

  const desc = description.toLowerCase();
  for (const [key, value] of Object.entries(companies)) {
    if (desc.includes(key)) {
      return value;
    }
  }

  // אם לא נמצא, תחזיר את המילה הראשונה
  return description.split(" ")[0] || "לא מוגדר";
}

// 📂 טעינת קטגוריות (מעודכן)
async function loadCategories() {
  try {
    const categoriesTable = window.appConfig.getTableName("categories");

    const { data, error } = await window.authModule
      .supabase()
      .from(categoriesTable)
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    console.log(`✅ נטענו ${data.length} קטגוריות`);
    categories = data;
  } catch (error) {
    console.error("❌ שגיאה בטעינת קטגוריות:", error);
    throw error;
  }
}

// 🔧 הגדרת event listeners
function setupEventListeners() {
  // חיפוש
  document
    .getElementById("search-input")
    ?.addEventListener("input", applyFilters);

  // פילטרים
  document
    .getElementById("category-filter")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("company-filter")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("card-filter")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("date-from")
    ?.addEventListener("change", applyFilters);
  document.getElementById("date-to")?.addEventListener("change", applyFilters);

  // ניקוי פילטרים
  document
    .getElementById("clear-filters")
    ?.addEventListener("click", clearFilters);

  // מיון טבלה
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => handleSort(th.dataset.sort));
  });

  // גודל דף
  document.getElementById("page-size")?.addEventListener("change", (e) => {
    pageSize = e.target.value === "all" ? Infinity : parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });

  // ייצוא
  document
    .getElementById("export-btn")
    ?.addEventListener("click", exportToExcel);

  // מודל עריכה
  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  document.getElementById("cancel-edit")?.addEventListener("click", closeModal);
  document
    .getElementById("save-category")
    ?.addEventListener("click", saveCategoryEdit);
}

// 🔍 מילוי פילטרים (מעודכן למבנה החדש)
function populateFilters() {
  // קטגוריות - עכשיו עם הטבלה החדשה
  const categoryFilter = document.getElementById("category-filter");
  if (categoryFilter) {
    const uniqueCategories = [
      ...new Set(
        allTransactions
          .filter((t) => t.categories)
          .map((t) => t.categories.name)
      ),
    ];

    categoryFilter.innerHTML = '<option value="">כל הקטגוריות</option>';
    uniqueCategories.forEach((category) => {
      categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });
  }

  // חברות
  const companyFilter = document.getElementById("company-filter");
  if (companyFilter) {
    const uniqueCompanies = [...new Set(allTransactions.map((t) => t.company))];

    companyFilter.innerHTML = '<option value="">כל החברות</option>';
    uniqueCompanies.forEach((company) => {
      companyFilter.innerHTML += `<option value="${company}">${company}</option>`;
    });
  }

  // כרטיסים - עכשיו עם cardlast4
  const cardFilter = document.getElementById("card-filter");
  if (cardFilter) {
    const uniqueCards = [
      ...new Set(
        allTransactions.filter((t) => t.cardlast4).map((t) => t.cardlast4)
      ),
    ];

    cardFilter.innerHTML = '<option value="">כל הכרטיסים</option>';
    uniqueCards.forEach((card) => {
      cardFilter.innerHTML += `<option value="${card}">****${card}</option>`;
    });
  }
}

// 🔍 החלת פילטרים (מעודכן)
function applyFilters() {
  const searchTerm =
    document.getElementById("search-input")?.value.toLowerCase() || "";
  const categoryFilter =
    document.getElementById("category-filter")?.value || "";
  const companyFilter = document.getElementById("company-filter")?.value || "";
  const cardFilter = document.getElementById("card-filter")?.value || "";
  const dateFrom = document.getElementById("date-from")?.value || "";
  const dateTo = document.getElementById("date-to")?.value || "";

  filteredTransactions = allTransactions.filter((transaction) => {
    // חיפוש טקסט
    if (
      searchTerm &&
      !transaction.business_name.toLowerCase().includes(searchTerm) &&
      !transaction.description.toLowerCase().includes(searchTerm)
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

    // כרטיס - עכשיו עם cardlast4
    if (cardFilter && transaction.cardlast4 !== cardFilter) {
      return false;
    }

    // תאריכים - עכשיו עם date
    const transactionDate = transaction.date;
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
  document.getElementById("search-input") &&
    (document.getElementById("search-input").value = "");
  document.getElementById("category-filter") &&
    (document.getElementById("category-filter").value = "");
  document.getElementById("company-filter") &&
    (document.getElementById("company-filter").value = "");
  document.getElementById("card-filter") &&
    (document.getElementById("card-filter").value = "");
  document.getElementById("date-from") &&
    (document.getElementById("date-from").value = "");
  document.getElementById("date-to") &&
    (document.getElementById("date-to").value = "");

  filteredTransactions = [...allTransactions];
  currentPage = 1;
  updateSummary();
  renderTable();
}

// 📊 עדכון סיכום - עם debug לבדיקת ההבדלים
function updateSummary() {
  const count = filteredTransactions.length;
  const total = filteredTransactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );
  const avg = count > 0 ? total / count : 0;

  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  // 🔍 DEBUG: בדיקת ההבדלים
  console.log(`📊 KPI Debug:`);
  console.log(`   כל העסקאות (allTransactions): ${allTransactions.length}`);
  console.log(
    `   עסקאות מפולטרות (filteredTransactions): ${filteredTransactions.length}`
  );
  console.log(`   הצגה ב-KPI: ${count}`);

  if (allTransactions.length !== filteredTransactions.length) {
    console.log(
      `⚠️  יש הבדל! פילטרים פעילים מסתירים ${
        allTransactions.length - filteredTransactions.length
      } עסקאות`
    );
  }

  const countElement = document.getElementById("filtered-count");
  const totalElement = document.getElementById("filtered-total");
  const avgElement = document.getElementById("filtered-avg");

  if (countElement) {
    countElement.textContent = count.toLocaleString();
    // הוסף tooltip עם המידע המלא
    countElement.title = `מציג ${count} מתוך ${allTransactions.length} עסקאות`;
  }
  if (totalElement)
    totalElement.textContent = `${currencySymbol}${total.toLocaleString()}`;
  if (avgElement)
    avgElement.textContent = `${currencySymbol}${Math.round(
      avg
    ).toLocaleString()}`;
}

// 🔄 מיון (מעודכן לשדות החדשים)
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
  if (currentArrow) {
    currentArrow.className = `sort-arrow ${sortDirection}`;
  }

  // מיון הנתונים
  filteredTransactions.sort((a, b) => {
    let valueA, valueB;

    switch (field) {
      case "date":
      case "transaction_date":
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case "amount":
        valueA = a.amount || 0;
        valueB = b.amount || 0;
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

// 📋 רינדור טבלה (מעודכן למבנה החדש)
function renderTable() {
  const tbody = document.getElementById("transactions-tbody");
  if (!tbody) return;

  const startIndex = pageSize === Infinity ? 0 : (currentPage - 1) * pageSize;
  const endIndex =
    pageSize === Infinity ? filteredTransactions.length : startIndex + pageSize;
  const pageTransactions = filteredTransactions.slice(startIndex, endIndex);

  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  tbody.innerHTML = pageTransactions
    .map(
      (transaction) => `
        <tr ${transaction.is_ai_categorized ? 'class="ai-categorized"' : ""}>
            <td>${formatDate(transaction.date)}</td>
            <td>
              ${transaction.business_name}
              ${
                transaction.is_ai_categorized
                  ? '<span class="ai-badge">🤖 AI</span>'
                  : ""
              }
            </td>
            <td style="font-weight: bold; color: #e74c3c;">
              ${currencySymbol}${(transaction.amount || 0).toLocaleString()}
              ${
                transaction.originalamount !== transaction.chargedamount
                  ? `<br><small style="color: #6c757d;">(מקורי: ${currencySymbol}${(
                      transaction.originalamount || 0
                    ).toLocaleString()})</small>`
                  : ""
              }
            </td>
            <td>
                <span class="category-tag" style="background-color: ${
                  transaction.categories?.color || "#6c757d"
                }">
                    ${transaction.categories?.icon || "📂"} ${
        transaction.categories?.name || transaction.category || "לא מוגדר"
      }
                </span>
            </td>
            <td class="installment-info">
                ${calculateInstallmentInfo(
                  transaction.memo || "",
                  transaction.date
                )}
            </td>
            <td>${
              transaction.cardlast4 ? `****${transaction.cardlast4}` : "-"
            }</td>
            <td>
                <button class="action-btn" onclick="editCategory('${
                  transaction.identifier
                }', '${transaction.cardlast4}')">
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
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  if (pageSize === Infinity) {
    pagination.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
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

// ✏️ עריכת קטגוריה (מעודכן למפתח החדש)
function editCategory(identifier, cardlast4) {
  const transaction = allTransactions.find(
    (t) => t.identifier === identifier && t.cardlast4 === cardlast4
  );
  if (!transaction) return;

  // מילוי פרטי העסקה
  const businessNameElement = document.getElementById("edit-business-name");
  const amountElement = document.getElementById("edit-amount");

  if (businessNameElement)
    businessNameElement.textContent = transaction.business_name;
  if (amountElement) {
    const currencySymbol = window.appConfig.getUIConfig().currencySymbol;
    amountElement.textContent = `${currencySymbol}${(
      transaction.amount || 0
    ).toLocaleString()}`;
  }

  // מילוי רשימת קטגוריות
  const categorySelect = document.getElementById("edit-category-select");
  if (categorySelect) {
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

    // שמירת מפתח העסקה
    categorySelect.dataset.transactionIdentifier = identifier;
    categorySelect.dataset.transactionCardlast4 = cardlast4;
  }

  // הצגת המודל
  const modal = document.getElementById("edit-modal");
  if (modal) modal.style.display = "flex";
}

// 💾 שמירת עריכת קטגוריה (מעודכן למפתח החדש)
async function saveCategoryEdit() {
  const categorySelect = document.getElementById("edit-category-select");
  if (!categorySelect) return;

  const identifier = categorySelect.dataset.transactionIdentifier;
  const cardlast4 = categorySelect.dataset.transactionCardlast4;
  const newCategoryId = categorySelect.value;

  try {
    const transactionsTable = window.appConfig.getTableName("transactions");

    // עדכון במסד הנתונים - עם המפתח המורכב
    const { error } = await window.authModule
      .supabase()
      .from(transactionsTable)
      .update({
        category_id: newCategoryId,
        is_ai_categorized: false, // מסמן שזה עכשיו ידני
      })
      .eq("identifier", identifier)
      .eq("cardlast4", cardlast4);

    if (error) throw error;

    // עדכון בנתונים המקומיים
    const transaction = allTransactions.find(
      (t) => t.identifier === identifier && t.cardlast4 === cardlast4
    );
    if (transaction) {
      transaction.category_id = newCategoryId;
      transaction.is_ai_categorized = false;
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
  const modal = document.getElementById("edit-modal");
  if (modal) modal.style.display = "none";
}

// 📤 ייצוא לExcel (מעודכן)
function exportToExcel() {
  const currencySymbol = window.appConfig.getUIConfig().currencySymbol;

  const headers = ["תאריך", "עסק", "סכום", "קטגוריה", "תשלומים", "כרטיס", "AI"];
  const data = filteredTransactions.map((t) => [
    formatDate(t.date),
    t.business_name,
    `${currencySymbol}${(t.amount || 0).toLocaleString()}`,
    t.categories?.name || t.category || "לא מוגדר",
    stripHTML(calculateInstallmentInfo(t.memo || "", t.date)),
    t.cardlast4 ? `****${t.cardlast4}` : "-",
    t.is_ai_categorized ? "כן" : "לא",
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
function stripHTML(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

// 🛠️ פונקציות עזר
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const format = window.appConfig.getUIConfig().dateFormat;

  // פורמט בסיסי עברי
  return date.toLocaleDateString("he-IL");
}

function showError(message) {
  const loading = document.getElementById("loading");
  const errorMessage = document.getElementById("error-message");

  if (loading) loading.style.display = "none";
  if (errorMessage) {
    errorMessage.style.display = "block";
    errorMessage.textContent = message;
  }
}

// 🌐 חשיפת פונקציות לשימוש גלובלי
window.transactionsModule = {
  editCategory,
  changePage,
  saveCategoryEdit,
  closeModal,
  loadTransactions,
  applyFilters,
};

// גם לחשוף פונקציות לשימוש ישיר ב-HTML
window.editCategory = editCategory;
window.changePage = changePage;
