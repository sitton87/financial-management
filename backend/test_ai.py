"""
test_ai.py
בדיקה מהירה של מערכת AI
"""
from database_manager import FinancialDatabase
from config import get_supabase_config, validate_config

def main():
    print("🤖 בדיקת מערכת AI למידה חכמה")
    print("=" * 50)
    
    # בדיקת הגדרות
    if not validate_config():
        print("⚠️ תקן את ההגדרות בconfig.py")
        return
    
    # קבלת הגדרות
    config = get_supabase_config()
    
    # חיבור למסד נתונים
    db = FinancialDatabase(config['url'], config['service_key'])
    
    if not db.test_connection():
        print("❌ שגיאה בחיבור למסד הנתונים")
        return
    
    # אתחול AI
    print("\n🚀 מאתחל מערכת AI...")
    if db.initialize_ai():
        print("✅ AI אותחל בהצלחה!")
    else:
        print("❌ שגיאה באתחול AI")
        return
    
    # בדיקת הצעות קטגוריזציה
    print("\n🧪 בדיקת הצעות לעסקים חדשים:")
    test_cases = [
        ("קפה ג'ו רחובות", 28.5),
        ("רמי לוי נתניה", 156.80),
        ("דלק סונול תל אביב", 220.0),
        ("מקדונלד ירושלים", 45.0),
        ("סופר פארם אשדוד", 67.90)
    ]
    
    for business, amount in test_cases:
        category, confidence = db.ai_categorizer.suggest_category(business, amount)
        print(f"   • {business} (₪{amount})")
        print(f"     → {category} (ביטחון: {confidence:.0%})")
    
    # הצגת סטטיסטיקות AI
    print(f"\n📊 סטטיסטיקות AI:")
    stats = db.ai_categorizer.get_stats()
    print(f"   📂 קטגוריות נלמדו: {stats['total_categories']}")
    print(f"   🔤 מילות מפתח: {stats['total_keywords']}")
    print(f"   ✅ עסקאות ביטחון גבוה: {stats['high_confidence_transactions']}")
    print(f"   ⚠️ עסקאות ביטחון נמוך: {stats['low_confidence_transactions']}")
    
    # הצעות שיפור
    print(f"\n💡 הצעות שיפור אוטומטיות:")
    suggestions = db.get_ai_suggestions(5)
    
    if suggestions:
        for i, suggestion in enumerate(suggestions, 1):
            print(f"   {i}. {suggestion['business_name']}")
            print(f"      נוכחי: {suggestion['current_category']}")
            print(f"      הצעה: {suggestion['suggested_category']} ({suggestion['confidence']:.0%})")
    else:
        print("   🎉 אין הצעות שיפור - הכל מסווג נכון!")
    
    print(f"\n🎉 בדיקת AI הושלמה בהצלחה!")
    print(f"💡 עכשיו תוכל להשתמש ב-AI באתר או ליצור דף AI נפרד")

if __name__ == "__main__":
    main()