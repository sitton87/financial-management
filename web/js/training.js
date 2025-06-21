// 🧠 מערכת אימון ראשוני
let trainingData = [];
let filteredData = [];
let categories = [];
let currentEditBusiness = null;
const API_BASE = "http://localhost:5000";

// 🚀 אתחול הדף
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🧠 מאתחל דף אימון ראשוני...");

  // המתנה ל-auth.js
  const authReady = await waitForAuth();
  if (!authReady) {
    showLoginScreen();
    return;
  }

  if (window.authModule?.currentUser()) {
    const user = window.authModule.currentUser();
    const isAuthorized = await checkUserAuthorization(user.email);

    if (isAuthorized) {
      showMainApp();
      await initTrainingPage();
    } else {
      showAccessDenied();
    }
  } else {
    showLoginScreen();
  }
});

// ⏳ המתנה לauth
async function waitForAuth() {
  let attempts = 0;
  while (
    (!window.authModule || !window.authModule?.currentUser()) &&
    attempts < 100
  ) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }
  return attempts < 100;
}

// 🔐 בדיקת הרשאה
async function checkUserAuthorization(email) {
  try {
    const supabase = window.authModule?.supabase();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from("authorized_users")
      .select("email")
      .eq("email", email)
      .single();

    return !error && data;
  } catch (error) {
    console.error("שגיאה בבדיקת הרשאה:", error);
    return false;
  }
}

// 📱 הצגת מסכים
function showLoginScreen() {
  document.getElementById("login-screen").style.display = "block";
  document.getElementById("main-app").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
}

function showAccessDenied() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("main-app").style.display = "none";
  document.getElementById("access-denied").style.display = "block";
}

function showMainApp() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("access-denied").style.display = "none";
  document.getElementById("main-app").style.display = "block";

  // יצירת כותרת עם ניווט
  const headerContainer = document.getElementById("header-container");
  if (headerContainer && window.navbarModule) {
    headerContainer.innerHTML = window.navbarModule.createHeader(
      "אימון ראשוני למערכת AI",
      "אשר את כל העסקים כדי שה-AI ילמד את העדפותיך",
      "training"
    );
  }
}

// 🚀 אתחול דף אימון
async function initTrainingPage() {
  try {
    console.log("🤖 מאתחל דף אימון...");

    // בדיקת חיבור לשרת
    await checkServerConnection();

    // טעינת נתוני אימון
    await loadTrainingData();
    await loadCategories();

    // הגדרת event listeners
    setupEventListeners();

    // הצגת התוכן
    document.getElementById("loading").style.display = "none";
    document.getElementById("training-content").style.display = "block";

    console.log("✅ דף אימון אותחל בהצלחה");
  } catch (error) {
    console.error("שגיאה באתחול דף אימון:", error);
    showError("שגיאה בטעינת דף אימון: " + error.message);
  }
}

// 🌐 בדיקת חיבור לשרת
async function checkServerConnection() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error("שרת לא זמין");
    console.log("✅ שרת AI מחובר");
  } catch (error) {
    throw new Error("לא ניתן להתחבר לשרת AI");
  }
}

// 📊 טעינת נתוני אימון
async function loadTrainingData() {
  try {
    console.log("📊 טוען נתוני אימון מהשרת...");

    const response = await fetch(`${API_BASE}/api/training-data`);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינה: ${response.status}`);
    }

    trainingData = await response.json();
    filteredData = [...trainingData];

    console.log(`✅ נטענו ${trainingData.length} עסקים לאימון`);

    // עדכון התקדמות
    updateProgress();

    // הצגת הטבלה
    displayTrainingTable();
  } catch (error) {
    console.error("שגיאה בטעינת נתוני אימון:", error);
    throw error;
  }
}

// 📂 טעינת קטגוריות
async function loadCategories() {
  try {
    const supabase = window.authModule.supabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;

    categories = data || [];
    populateCategoryFilters();

    console.log(`✅ נטענו ${categories.length} קטגוריות`);
  } catch (error) {
    console.error("שגיאה בטעינת קטגוריות:", error);
  }
}

// 🎛️ הגדרת Event Listeners
function setupEventListeners() {
  // חיפוש
  const searchInput = document.getElementById("search-business");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(applyFilters, 300));
  }

  // פילטרים
  const filterCategory = document.getElementById("filter-category");
  const sortBy = document.getElementById("sort-by");
  const showFilter = document.getElementById("show-filter");

  if (filterCategory) filterCategory.addEventListener("change", applyFilters);
  if (sortBy) sortBy.addEventListener("change", applyFilters);
  if (showFilter) showFilter.addEventListener("change", applyFilters);

  // כפתורים
  const approveAllBtn = document.getElementById("approve-all-visible");
  const completeBtn = document.getElementById("complete-training");
  const saveCategoryBtn = document.getElementById("save-category");

  if (approveAllBtn) approveAllBtn.addEventListener("click", approveAllVisible);
  if (completeBtn) completeBtn.addEventListener("click", completeTraining);
  if (saveCategoryBtn)
    saveCategoryBtn.addEventListener("click", saveEditedCategory);
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("approve-btn")) {
      const businessName = e.target.dataset.business;
      const categoryId = e.target.dataset.category;
      approveBusiness(businessName, parseInt(categoryId));
    }

    if (e.target.classList.contains("edit-btn")) {
      const businessName = e.target.dataset.business;
      editBusiness(businessName);
    }
  });
  // כפתורי קטגוריה חדשה
  const addCategoryBtn = document.getElementById("add-new-category");
  const saveNewCategoryBtn = document.getElementById("save-new-category");
  const cancelNewCategoryBtn = document.getElementById("cancel-new-category");

  if (addCategoryBtn)
    addCategoryBtn.addEventListener("click", toggleNewCategorySection);
  if (saveNewCategoryBtn)
    saveNewCategoryBtn.addEventListener("click", createNewCategory);
  if (cancelNewCategoryBtn)
    cancelNewCategoryBtn.addEventListener("click", cancelNewCategory);
}

// 📊 עדכון התקדמות
function updateProgress() {
  const approvedCount = trainingData.filter((item) => item.approved).length;
  const totalCount = trainingData.length;
  const percentage =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  document.getElementById("progress-current").textContent = approvedCount;
  document.getElementById("progress-total").textContent = totalCount;
  document.getElementById("progress-percent").textContent = percentage + "%";

  const progressFill = document.getElementById("progress-fill");
  if (progressFill) {
    progressFill.style.width = percentage + "%";
  }

  // הצגת כפתור סיום אם הכל אושר
  const completeBtn = document.getElementById("complete-training");
  if (completeBtn) {
    completeBtn.style.display = percentage === 100 ? "block" : "none";
  }
}

// 🔍 יישום פילטרים
function applyFilters() {
  const searchTerm =
    document.getElementById("search-business")?.value.toLowerCase() || "";
  const categoryFilter =
    document.getElementById("filter-category")?.value || "";
  const sortBy =
    document.getElementById("sort-by")?.value || "transaction_count";
  const showFilter = document.getElementById("show-filter")?.value || "all";

  // פילטר
  filteredData = trainingData.filter((item) => {
    const matchesSearch =
      !searchTerm || item.business_name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      !categoryFilter || item.category_name === categoryFilter;
    const matchesShow =
      showFilter === "all" ||
      (showFilter === "approved" && item.approved) ||
      (showFilter === "pending" && !item.approved);

    return matchesSearch && matchesCategory && matchesShow;
  });

  // מיון
  filteredData.sort((a, b) => {
    if (sortBy === "business_name") {
      return a.business_name.localeCompare(b.business_name);
    } else {
      return b[sortBy] - a[sortBy];
    }
  });

  displayTrainingTable();
}

// 📋 הצגת טבלת אימון
function displayTrainingTable() {
  const tbody = document.getElementById("training-tbody");
  if (!tbody) return;

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
          אין עסקים להצגה
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredData
    .map(
      (item) => `
    <tr class="${item.approved ? "approved" : ""}">
      <td style="font-weight: bold;">${item.business_name}</td>
      <td>
        <span class="category-badge" style="background-color: ${
          item.category_color
        };">
          ${item.category_name}
        </span>
      </td>
      <td>${item.company_name}</td>
      <td style="text-align: center; font-weight: bold;">${
        item.transaction_count
      }</td>
      <td style="text-align: center;">₪${item.total_amount.toLocaleString()}</td>
      <td style="text-align: center;">₪${item.avg_amount}</td>
      <td>
        <div class="action-buttons">
          ${
            item.approved
              ? '<span class="approved-badge">✅ אושר</span>'
              : `<button class="approve-btn" data-business="${item.business_name.replace(
                  /"/g,
                  "&quot;"
                )}" data-category="${item.category_id}">
               ✅ אשר
             </button>
             <button class="edit-btn" data-business="${item.business_name.replace(
               /"/g,
               "&quot;"
             )}">
               ✏️ ערוך
             </button>`
          }
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// 📂 מילוי פילטרי קטגוריות
function populateCategoryFilters() {
  const filterSelect = document.getElementById("filter-category");
  const editSelect = document.getElementById("edit-category-select");

  if (filterSelect) {
    filterSelect.innerHTML =
      '<option value="">כל הקטגוריות</option>' +
      categories
        .map((cat) => `<option value="${cat.name}">${cat.name}</option>`)
        .join("");
  }

  if (editSelect) {
    editSelect.innerHTML = categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join("");
  }
}

// ✅ אישור עסק
async function approveBusiness(businessName, categoryId) {
  try {
    console.log("✅ מאשר עסק:", businessName);

    const response = await fetch(`${API_BASE}/api/approve-business-training`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        category_id: categoryId,
      }),
    });

    if (!response.ok) {
      throw new Error(`שגיאה באישור: ${response.status}`);
    }

    const result = await response.json();

    // עדכון מקומי
    const business = trainingData.find(
      (item) => item.business_name === businessName
    );
    if (business) {
      business.approved = true;
    }

    // עדכון תצוגה
    updateProgress();
    applyFilters();

    console.log("✅ עסק אושר:", result.message);
  } catch (error) {
    console.error("שגיאה באישור עסק:", error);
    alert("❌ שגיאה באישור: " + error.message);
  }
}

// ✏️ עריכת עסק
function editBusiness(businessName) {
  currentEditBusiness = trainingData.find(
    (item) => item.business_name === businessName
  );
  if (!currentEditBusiness) return;

  document.getElementById("edit-business-name").textContent =
    currentEditBusiness.business_name;
  document.getElementById("edit-transaction-count").textContent =
    currentEditBusiness.transaction_count;
  document.getElementById("edit-total-amount").textContent =
    "₪" + currentEditBusiness.total_amount.toLocaleString();

  const editSelect = document.getElementById("edit-category-select");
  if (editSelect) {
    editSelect.value = currentEditBusiness.category_id;
  }

  document.getElementById("edit-modal").style.display = "flex";
}

// 💾 שמירת עריכה
async function saveEditedCategory() {
  if (!currentEditBusiness) return;

  const newCategoryId = parseInt(
    document.getElementById("edit-category-select").value
  );
  const newCategory = categories.find((cat) => cat.id === newCategoryId);

  if (!newCategory) return;

  try {
    // אישור עם קטגוריה חדשה
    await approveBusiness(currentEditBusiness.business_name, newCategoryId);

    // עדכון מקומי
    currentEditBusiness.category_id = newCategoryId;
    currentEditBusiness.category_name = newCategory.name;
    currentEditBusiness.category_color = newCategory.color;

    closeEditModal();
    applyFilters();
  } catch (error) {
    console.error("שגיאה בשמירת עריכה:", error);
    alert("❌ שגיאה בשמירה: " + error.message);
  }
}

// ✅ אישור כל הגלויים
async function approveAllVisible() {
  const pendingItems = filteredData.filter((item) => !item.approved);

  if (pendingItems.length === 0) {
    alert("📋 אין עסקים לאישור");
    return;
  }

  if (!confirm(`האם לאשר ${pendingItems.length} עסקים?`)) {
    return;
  }

  try {
    console.log(`✅ מאשר ${pendingItems.length} עסקים...`);

    for (const item of pendingItems) {
      await approveBusiness(item.business_name, item.category_id);
      await new Promise((resolve) => setTimeout(resolve, 100)); // המתנה קצרה
    }

    alert(`✅ ${pendingItems.length} עסקים אושרו בהצלחה!`);
  } catch (error) {
    console.error("שגיאה באישור מרובה:", error);
    alert("❌ שגיאה באישור: " + error.message);
  }
}

// 🎉 סיום אימון
async function completeTraining() {
  try {
    const response = await fetch(`${API_BASE}/api/complete-training`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`שגיאה בסיום: ${response.status}`);
    }

    const result = await response.json();

    // הצגת הודעת סיום
    document.getElementById("training-content").style.display = "none";
    document.getElementById("completion-message").style.display = "block";

    console.log("🎉 אימון הושלם:", result.message);
  } catch (error) {
    console.error("שגיאה בסיום אימון:", error);
    alert("❌ שגיאה בסיום: " + error.message);
  }
}

// 🛠️ פונקציות עזר
function closeEditModal() {
  document.getElementById("edit-modal").style.display = "none";
  currentEditBusiness = null;
}

function showError(message) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.style.display = "block";
    errorElement.textContent = message;
  }

  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";

  console.error("🚨 Training Error:", message);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 🆕 הוספת קטגוריה חדשה
function toggleNewCategorySection() {
  const section = document.getElementById("new-category-section");
  const isVisible = section.style.display !== "none";

  section.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    document.getElementById("new-category-name").focus();
  }
}

async function createNewCategory() {
  const name = document.getElementById("new-category-name").value.trim();
  const color = document.getElementById("new-category-color").value;
  const icon = document.getElementById("new-category-icon").value;

  if (!name) {
    alert("❌ הכנס שם לקטגוריה");
    return;
  }

  // בדיקה שהקטגוריה לא קיימת
  if (categories.find((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
    alert("❌ קטגוריה זו כבר קיימת");
    return;
  }

  try {
    console.log("🆕 יוצר קטגוריה חדשה:", name);

    const supabase = window.authModule.supabase();
    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: name,
          color: color,
          icon: icon,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // הוספה לרשימה המקומית
    categories.push(data);

    // עדכון הselect
    populateCategoryFilters();

    // בחירת הקטגוריה החדשה
    document.getElementById("edit-category-select").value = data.id;

    // הסתרת הקטע
    document.getElementById("new-category-section").style.display = "none";

    // ניקוי השדות
    document.getElementById("new-category-name").value = "";
    document.getElementById("new-category-color").value = "#667eea";
    document.getElementById("new-category-icon").value = "📂";

    alert(`✅ קטגוריה "${name}" נוצרה בהצלחה!`);
  } catch (error) {
    console.error("שגיאה ביצירת קטגוריה:", error);
    alert("❌ שגיאה ביצירת קטגוריה: " + error.message);
  }
}

function cancelNewCategory() {
  document.getElementById("new-category-section").style.display = "none";
  document.getElementById("new-category-name").value = "";
  document.getElementById("new-category-color").value = "#667eea";
  document.getElementById("new-category-icon").value = "📂";
}

// הפיכת פונקציות לגלובליות
window.approveBusiness = approveBusiness;
window.editBusiness = editBusiness;
window.closeEditModal = closeEditModal;
