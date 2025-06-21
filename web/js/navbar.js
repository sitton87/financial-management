// 🧭 מערכת ניווט משותפת לכל הדפים
function createNavbar(currentPage = "") {
  return `
        <nav class="nav">
    <a href="index.html" class="${
      currentPage === "home" ? "nav-btn active" : "nav-btn"
    }">🏠 דף הבית</a>
    <a href="transactions.html" class="${
      currentPage === "transactions" ? "nav-btn active" : "nav-btn"
    }">📋 עסקאות</a>
    <a href="categories.html" class="${
      currentPage === "categories" ? "nav-btn active" : "nav-btn"
    }">📊 קטגוריות</a>
    <a href="ai-insights.html" class="${
      currentPage === "ai-insights" ? "nav-btn active" : "nav-btn"
    }">🧠 תובנות AI</a>
    <a href="comparisons.html" class="${
      currentPage === "comparisons" ? "nav-btn active" : "nav-btn"
    }">📈 השוואות</a>
</nav>
    `;
}

// 🔗 פונקציה ליצירת כותרת מלאה עם פרטי משתמש + ניווט
function createHeader(title, subtitle, currentPage = "") {
  return `
        <header class="header">
            <!-- פרטי משתמש -->
            <div id="user-info" class="user-info">
                <div class="user-details">
                    <img id="user-avatar" class="user-avatar" src="" alt="">
                    <div>
                        <div id="user-name" style="font-weight: bold;"></div>
                        <div id="user-email" style="font-size: 0.8rem; color: #666;"></div>
                    </div>
                </div>
                <button id="logout-btn" class="logout-btn">התנתק</button>
            </div>

            <h1>💳 ${title}</h1>
            <p>${subtitle}</p>
            
            ${createNavbar(currentPage)}
        </header>
    `;
}

// 🎨 הוספת סגנון לכפתור פעיל
function addNavbarStyles() {
  const style = document.createElement("style");
  style.textContent = `
        .nav-btn.active {
            background: linear-gradient(135deg, #28a745, #20c997) !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
    `;
  document.head.appendChild(style);
}

// 🚀 אתחול הניווט
function initNavbar(currentPage = "") {
  // הוספת סגנונות
  addNavbarStyles();

  // החלפת הכותרת אם קיימת
  const headerElement = document.querySelector(".header");
  if (headerElement) {
    const title =
      headerElement.querySelector("h1")?.textContent || "מערכת ניהול פיננסי";
    const subtitle =
      headerElement.querySelector("p")?.textContent ||
      "מבט כללי על ההוצאות שלך";

    headerElement.innerHTML = createHeader(title, subtitle, currentPage)
      .replace('<header class="header">', "")
      .replace("</header>", "");
  }
}

// 📤 ייצוא לשימוש גלובלי
window.navbarModule = {
  createNavbar,
  createHeader,
  initNavbar,
};
