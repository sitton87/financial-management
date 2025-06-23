// 🌍 ניהול משתני סביבה לפרודקשן
// קובץ: web/js/environment.js

// הגדרת משתני סביבה גלובליים
window.ENV = {
  NODE_ENV: "production",
  SUPABASE_URL: "https://ytbyoiqjhyskplwygsog.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YnlvaXFqaHlza3Bsd3lnc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTY4NjEsImV4cCI6MjA2NTk5Mjg2MX0.1ByP8TLn-fMOScIaTdB9hwKI_iDqyYhc1f6zth5M0dw",
  API_URL: "/api",
};

console.log("🌍 Environment variables loaded for:", window.ENV.NODE_ENV);
