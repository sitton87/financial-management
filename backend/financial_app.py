"""
financial_app.py
האפליקציה הראשית - עם תיקון סדר השמירה
"""
from pathlib import Path
from datetime import datetime

# Import הקבצים שלנו
from smart_parsers import parse_file
from database_manager import FinancialDatabase, get_file_hash
from config import get_supabase_config, validate_config, EXCEL_FILES_FOLDER

# ==========================================
# הגדרות מרכזיות מconfig.py
# ==========================================
def process_single_file(filepath: Path, db: FinancialDatabase) -> int:
    """עיבוד קובץ בודד - עם תיקון סדר השמירה"""
    filename = filepath.name
    print(f"\n📄 מפרסר: {filename}")
    
    start_time = datetime.now()
    
    # בדיקת hash
    file_hash = get_file_hash(filepath)
    if not file_hash:
        print(f"   ❌ לא ניתן לחשב hash")
        return 0
    
    if db.check_file_processed(file_hash):
        print(f"   ⏭️ קובץ כבר עובד - מדלג")
        return 0
    
    # פרסור עם הפרסר החכם
    transactions = parse_file(filepath)
    
    if not transactions:
        print(f"   ⚠️ לא נמצאו עסקאות")
        return 0
    
    # 🔧 תיקון: שמירת הקובץ קודם!
    company = transactions[0]['company']
    processing_time = int((datetime.now() - start_time).total_seconds())
    
    try:
        # שלב 1: שמירת הקובץ ב-processed_files
        db.save_processed_file(filename, file_hash, company, len(transactions), processing_time)
        print(f"   📝 רושם קובץ כמעובד...")
        
        # שלב 2: שמירת העסקאות (עכשיו יש קשר ל-processed_files)
        saved_count = db.save_transactions(transactions, file_hash)
        
        if saved_count > 0:
            print(f"   🎉 הושלם: {saved_count} עסקאות")
        
        return saved_count
        
    except Exception as e:
        print(f"   ❌ שגיאה כללית: {e}")
        return 0

def process_all_files(EXCEL_FILES_FOLDER: Path, db: FinancialDatabase):
    """עיבוד כל הקבצים בתיקייה"""
    # חיפוש קבצי Excel
    excel_files = list(EXCEL_FILES_FOLDER.rglob("*.xlsx")) + list(EXCEL_FILES_FOLDER.rglob("*.xls"))
    
    if not excel_files:
        print("❌ לא נמצאו קבצי Excel")
        return
    
    print(f"📁 נמצאו {len(excel_files)} קבצי Excel")
    print(f"\n🚀 מתחיל עיבוד...")
    
    total_transactions = 0
    successful_files = 0
    
    for file_path in excel_files:
        try:
            transactions_count = process_single_file(file_path, db)
            if transactions_count > 0:
                total_transactions += transactions_count
                successful_files += 1
        except Exception as e:
            print(f"   ❌ שגיאה: {e}")
    
    print(f"\n📊 סיכום:")
    print(f"✅ קבצים שהצליחו: {successful_files}/{len(excel_files)}")
    print(f"📈 סה\"כ עסקאות חדשות: {total_transactions}")
    
    if total_transactions > 0:
        print(f"🎉 כל העסקאות נשמרו בהצלחה למסד הנתונים!")

def show_menu(excel_count: int):
    """הצגת תפריט פשוט"""
    print(f"\n📋 בחר פעולה:")
    print(f"1. עיבוד כל הקבצים ({excel_count} קבצים)")
    print(f"2. הצגת סטטיסטיקות")
    print(f"3. יציאה")

def main():
    # בדיקת הגדרות
    if not validate_config():
        print("⚠️ תקן את ההגדרות בconfig.py")
        return
    
    config = get_supabase_config()
    
    # חיבור למסד נתונים
    db = FinancialDatabase(config['url'], config['service_key'])
    
    if not db.test_connection():
        return
    
    
    # בדיקת תיקיית קבצים
    EXCEL_FILES_FOLDER = Path(EXCEL_FILES_FOLDER)
    if not EXCEL_FILES_FOLDER.exists():
        print(f"❌ תיקיית הקבצים לא נמצאה: {EXCEL_FILES_FOLDER}")
        return
    
    # ספירת קבצי Excel
    excel_files = list(EXCEL_FILES_FOLDER.rglob("*.xlsx")) + list(EXCEL_FILES_FOLDER.rglob("*.xls"))
    
    # תפריט ראשי
    while True:
        show_menu(len(excel_files))
        choice = input("\nבחר (1-3): ").strip()
        
        if choice == "1":
            process_all_files(EXCEL_FILES_FOLDER, db)
            
        elif choice == "2":
            print("\n📊 סטטיסטיקות מערכת:")
            stats = db.get_stats()
            for key, value in stats.items():
                key_hebrew = {
                    'total_transactions': 'סה"כ עסקאות',
                    'total_categories': 'סה"כ קטגוריות', 
                    'processed_files': 'קבצים מעובדים',
                    'total_amount': 'סכום כולל'
                }.get(key, key)
                print(f"   {key_hebrew}: {value}")
                
        elif choice == "3":
            print("👋 יציאה...")
            break
            
        else:
            print("❌ בחירה לא תקינה")

if __name__ == "__main__":
    main()