// 🧭 מודול ניווט מחודש - navbar.js
const navbarModule = {
  // 🎨 יצירת Header מלא עם ניווט וזאזור משתמש
  createHeader: function (pageTitle, userInfo, currentPage = "") {
    const systemTitle = "💳 מערכת ניהול פיננסי";
    const dynamicPageTitle = this.getPageTitle(currentPage);

    return `
      <!-- 🔝 שורה עליונה - קבועה -->
      <div class="top-bar">
        <!-- 🏢 שם המערכת - שמאל -->
        <div class="system-area">
          <h2 class="system-title">${systemTitle}</h2>
        </div>
        
        <!-- 🧭 ניווט ראשי - מרכז -->
        <nav class="main-nav">
          ${this.createNavLinks(currentPage)}
        </nav>
        
        <!-- 👤 אזור משתמש - ימין -->
        <div class="user-area">
          <div class="user-info-compact">
            <span class="user-greeting">שלום, ${this.extractUserName(
              userInfo
            )}</span>
            <button class="logout-btn-compact" onclick="window.authModule?.signOut()">
              🚪 התנתק
            </button>
          </div>
        </div>
        
        <!-- 📱 כפתור המבורגר - מובייל -->
        <div class="mobile-menu-toggle" onclick="navbarModule.toggleMobileMenu()">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <!-- 📋 כותרת העמוד הדינמית -->
      <div class="page-header">
        <h1 class="page-title">${dynamicPageTitle}</h1>
        <p class="page-description">${this.getPageDescription(currentPage)}</p>
      </div>
      
      <!-- 📱 ניווט מובייל -->
      <div class="mobile-nav" id="mobile-nav">
        ${this.createMobileNavLinks(currentPage)}
      </div>
    `;
  },

  // 🔗 יצירת קישורי ניווט
  createNavLinks: function (currentPage) {
    const navItems = [
      { id: "home", label: "🏠 דף הבית", href: "index.html" },
      { id: "transactions", label: "💳 עסקאות", href: "transactions.html" },
      { id: "categories", label: "🏷️ קטגוריות", href: "categories.html" },
      { id: "ai-insights", label: "🤖 תובנות AI", href: "ai-insights.html" },
      { id: "training", label: "🎓 הדרכה", href: "training.html" },
    ];

    return navItems
      .map(
        (item) => `
      <a href="${item.href}" 
         class="nav-link ${currentPage === item.id ? "active" : ""}"
         data-page="${item.id}">
        ${item.label}
      </a>
    `
      )
      .join("");
  },

  // 📱 יצירת ניווט מובייל
  createMobileNavLinks: function (currentPage) {
    const navItems = [
      { id: "home", label: "🏠 דף הבית", href: "index.html" },
      { id: "transactions", label: "💳 עסקאות", href: "transactions.html" },
      { id: "categories", label: "🏷️ קטגוריות", href: "categories.html" },
      { id: "ai-insights", label: "🤖 תובנות AI", href: "ai-insights.html" },
      { id: "training", label: "🎓 הדרכה", href: "training.html" },
    ];

    return navItems
      .map(
        (item) => `
      <a href="${item.href}" 
         class="mobile-nav-link ${currentPage === item.id ? "active" : ""}"
         onclick="navbarModule.closeMobileMenu()">
        ${item.label}
      </a>
    `
      )
      .join("");
  },

  // 📱 פתיחה/סגירה של תפריט מובייל
  toggleMobileMenu: function () {
    const mobileNav = document.getElementById("mobile-nav");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (mobileNav && toggle) {
      mobileNav.classList.toggle("open");
      toggle.classList.toggle("open");
    }
  },

  closeMobileMenu: function () {
    const mobileNav = document.getElementById("mobile-nav");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (mobileNav && toggle) {
      mobileNav.classList.remove("open");
      toggle.classList.remove("open");
    }
  },

  // 📋 קבלת כותרת דף דינמית
  getPageTitle: function (pageId) {
    const pageTitles = {
      home: "📊 דשבורד ראשי",
      transactions: "💳 רשימת עסקאות",
      categories: "🏷️ ניהול קטגוריות",
      "ai-insights": "🤖 תובנות בינה מלאכותית",
      training: "🎓 מרכז הדרכה ולמידה",
    };

    return pageTitles[pageId] || "📊 מערכת ניהול פיננסי";
  },

  // 📝 קבלת משפט הסבר לדף
  getPageDescription: function (pageId) {
    const pageDescriptions = {
      home: "כאן תוכל לראות סקירה כללית של המצב הפיננסי שלך ותובנות חשובות",
      transactions: "כאן תוכל לראות את כל העסקאות שלך, לערוך ולנהל אותן",
      categories: "כאן תוכל לנהל את קטגוריות העסקאות ולהתאים אותן לצרכים שלך",
      "ai-insights": "כאן תוכל לקבל תובנות חכמות על הרגלי ההוצאה והחיסכון שלך",
      training: "כאן תוכל ללמוד איך להשתמש במערכת ולקבל טיפים לניהול פיננסי",
    };

    return pageDescriptions[pageId] || "ברוך הבא למערכת ניהול פיננסי מתקדמת";
  },

  // 👤 חילוץ שם משתמש
  extractUserName: function (userInfo) {
    if (typeof userInfo === "string") {
      if (userInfo.includes("שלום")) {
        return userInfo.replace("שלום ", "");
      }
      return userInfo;
    }
    return userInfo?.name || userInfo?.email || "משתמש";
  },

  // 🎯 עדכון כותרת עמוד
  updatePageTitle: function (title) {
    const pageTitleElement = document.querySelector(".page-title");
    if (pageTitleElement) {
      pageTitleElement.textContent = title;
    }
  },

  // ⭐ סימון דף פעיל
  setActivePage: function (pageId) {
    // הסרת active מכל הקישורים
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
      link.classList.remove("active");
    });

    // הוספת active לדף הנוכחי
    document.querySelectorAll(`[data-page="${pageId}"]`).forEach((link) => {
      link.classList.add("active");
    });
  },
};

// ייצוא גלובלי
window.navbarModule = navbarModule;

console.log("🧭 Navbar module טוען...");
