"""
quick_update.py
עדכון מהיר של מספרי כרטיסים לעסקאות קיימות
"""
from database_manager import FinancialDatabase

# הגדרות
SUPABASE_URL = "https://ytbyoiqjhyskplwygsog.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YnlvaXFqaHlza3Bsd3lnc29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQxNjg2MSwiZXhwIjoyMDY1OTkyODYxfQ.HcmfvMS0fGDui8KyNkFIDAjDA6zsRERzeqJmE-oJGT8"
EXCEL_FILES_FOLDER = r"C:\Users\user1\OneDrive - Open University of Israel\שולחן העבודה\Siton\פיננסים\הוצאות\ניהול הוצאות 06_25"

def update_card_numbers():
    """עדכון מספרי כרטיסים לעסקאות קיימות"""
    
    print("🔄 מעדכן מספרי כרטיסים לעסקאות קיימות...")
    
    db = FinancialDatabase(SUPABASE_URL, SUPABASE_KEY)
    
    # מיפוי חברות למספרי כרטיסים
    card_mapping = {
        'דיינרס': '5590',
        'ישראכרט': '9158', 
        'כאל': '8092'
    }
    
    total_updated = 0
    
    for company, card_number in card_mapping.items():
        try:
            # עדכון עסקאות שאין להן מספר כרטיס
            response = db.supabase.table('transactions').update({
                'card_last_four': card_number
            }).eq('company', company).is_('card_last_four', 'null').execute()
            
            updated_count = len(response.data) if response.data else 0
            total_updated += updated_count
            
            print(f"   ✅ {company}: עודכנו {updated_count} עסקאות עם ****{card_number}")
            
        except Exception as e:
            print(f"   ❌ שגיאה בעדכון {company}: {e}")
    
    print(f"\n🎉 סיכום: עודכנו {total_updated} עסקאות בסה\"כ")
    
    # בדיקה
    try:
        response = db.supabase.table('transactions').select('company, card_last_four').execute()
        
        stats = {}
        for transaction in response.data:
            company = transaction['company']
            card = transaction['card_last_four']
            key = f"{company}_****{card}" if card else f"{company}_None"
            stats[key] = stats.get(key, 0) + 1
        
        print(f"\n📊 מצב נוכחי:")
        for key, count in stats.items():
            print(f"   {key}: {count} עסקאות")
            
    except Exception as e:
        print(f"❌ שגיאה בבדיקה: {e}")

if __name__ == "__main__":
    update_card_numbers()