"""
rename_files_fixed.py
סקריפט מתוקן לשינוי שמות קבצי Excel שנמצאים בתיקייה הראשית
"""
import os
import re
from pathlib import Path

# נתיב התיקייה
BASE_FOLDER = r"C:\Users\user1\OneDrive - Open University of Israel\שולחן העבודה\Siton\פיננסים\הוצאות\ניהול הוצאות 06_25\כאל_6298"

def extract_card_and_date_from_filename(filename: str) -> tuple:
    """חילוץ מספר כרטיס, חודש ושנה מתוך שם קובץ"""
    
    print(f"   🔍 מנתח: {filename}")
    
    # דוגמה: "פירוט חיובים לכרטיס ויזה 6298 - 02_25(1).xlsx"
    
    # חיפוש מספר כרטיס (4 ספרות)
    card_match = re.search(r'\b(\d{4})\b', filename)
    card_number = card_match.group(1) if card_match else None
    
    # חיפוש חודש ושנה (MM_YY או MM/YY)
    date_patterns = [
        r'(\d{2})[_/\-](\d{2})',  # MM_YY או MM/YY או MM-YY
        r'(\d{2})[_/\-](\d{4})',  # MM_YYYY או MM/YYYY או MM-YYYY
    ]
    
    month, year = None, None
    
    for pattern in date_patterns:
        match = re.search(pattern, filename)
        if match:
            month = match.group(1)
            year_part = match.group(2)
            
            # אם השנה בפורמט YY, הוסף 20 בתחילה
            if len(year_part) == 2:
                year = f"20{year_part}"
            else:
                year = year_part
            break
    
    print(f"      💳 כרטיס: {card_number}")
    print(f"      📅 תאריך: {month}/{year}")
    
    return card_number, month, year

def detect_company_from_filename(filename: str) -> str:
    """זיהוי חברת כרטיס אשראי מתוך שם הקובץ"""
    filename_lower = filename.lower()
    
    if 'דיינרס' in filename_lower or 'diners' in filename_lower:
        return 'דיינרס'
    elif 'ישראכרט' in filename_lower or 'isracard' in filename_lower:
        return 'ישראכרט'
    elif 'כאל' in filename_lower or 'cal' in filename_lower:
        return 'כאל'
    elif 'ויזה' in filename_lower or 'visa' in filename_lower:
        return 'ויזה'
    elif 'מסטרקארד' in filename_lower or 'mastercard' in filename_lower:
        return 'מסטרקארד'
    elif 'אמריקן' in filename_lower or 'american' in filename_lower:
        return 'אמריקן_אקספרס'
    else:
        return 'לא_ידוע'

def rename_files_in_main_folder():
    """שינוי שמות קבצים בתיקייה הראשית"""
    
    base_path = Path(BASE_FOLDER)
    
    if not base_path.exists():
        print(f"❌ התיקייה לא נמצאה: {BASE_FOLDER}")
        return
    
    print(f"📁 מעבד קבצים בתיקייה: {base_path.name}")
    print("=" * 80)
    
    # מצא קבצי Excel בתיקייה הראשית
    excel_files = list(base_path.glob("*.xlsx")) + list(base_path.glob("*.xls"))
    
    if not excel_files:
        print("⚠️ לא נמצאו קבצי Excel בתיקייה")
        return
    
    print(f"📊 נמצאו {len(excel_files)} קבצי Excel")
    
    total_renamed = 0
    
    for file_path in excel_files:
        filename = file_path.name
        
        print(f"\n📄 קובץ מקורי: {filename}")
        
        # זהה חברה
        company = detect_company_from_filename(filename)
        print(f"   🏢 חברה: {company}")
        
        # חלץ מספר כרטיס ותאריך
        card_number, month, year = extract_card_and_date_from_filename(filename)
        
        if not all([card_number, month, year]):
            print(f"   ❌ לא ניתן לחלץ את כל הפרטים - מדלג")
            continue
        
        # בנה שם חדש
        file_extension = file_path.suffix
        new_filename = f"{company}_{card_number}_{month}_{year}{file_extension}"
        new_path = base_path / new_filename
        
        print(f"   ➡️ שם חדש: {new_filename}")
        
        # בדוק אם הקובץ החדש כבר קיים
        if new_path.exists() and new_path != file_path:
            print(f"   ⚠️ קובץ בשם זה כבר קיים - מדלג")
            continue
        
        # בדוק אם השם כבר נכון
        if file_path.name == new_filename:
            print(f"   ✅ השם כבר נכון - לא נדרש שינוי")
            continue
        
        # שנה שם
        try:
            file_path.rename(new_path)
            print(f"   ✅ שינוי שם הושלם")
            total_renamed += 1
        except Exception as e:
            print(f"   ❌ שגיאה בשינוי שם: {e}")
    
    print(f"\n" + "=" * 80)
    print(f"📊 סיכום:")
    print(f"   📄 סה\"כ קבצים נסרקו: {len(excel_files)}")
    print(f"   ✅ קבצים ששונו: {total_renamed}")
    print(f"   🎉 פעולה הושלמה!")

def preview_changes():
    """תצוגה מקדימה של השינויים"""
    
    base_path = Path(BASE_FOLDER)
    
    if not base_path.exists():
        print(f"❌ התיקייה לא נמצאה: {BASE_FOLDER}")
        return
    
    print(f"👁️ תצוגה מקדימה - ללא ביצוע שינויים")
    print(f"📁 תיקייה: {base_path.name}")
    print("=" * 80)
    
    # מצא קבצי Excel
    excel_files = list(base_path.glob("*.xlsx")) + list(base_path.glob("*.xls"))
    
    if not excel_files:
        print("⚠️ לא נמצאו קבצי Excel")
        return
    
    print(f"📊 נמצאו {len(excel_files)} קבצי Excel:")
    
    for file_path in excel_files:
        filename = file_path.name
        company = detect_company_from_filename(filename)
        card_number, month, year = extract_card_and_date_from_filename(filename)
        
        print(f"\n📄 {filename}")
        print(f"   🏢 חברה: {company}")
        
        if all([card_number, month, year]):
            file_extension = file_path.suffix
            new_filename = f"{company}_{card_number}_{month}_{year}{file_extension}"
            print(f"   ➡️ {new_filename}")
        else:
            print(f"   ❌ לא ניתן לחלץ פרטים")

def main():
    print("📋 מערכת שינוי שמות קבצי Excel")
    print("🎯 מיועד לקבצים בתיקייה הראשית")
    print("=" * 50)
    
    while True:
        print(f"\nבחר פעולה:")
        print(f"1. תצוגה מקדימה (ללא שינויים)")
        print(f"2. שינוי שמות קבצים")
        print(f"3. יציאה")
        
        choice = input("\nבחר (1-3): ").strip()
        
        if choice == "1":
            preview_changes()
        elif choice == "2":
            confirm = input("\n⚠️ האם אתה בטוח שברצונך לשנות שמות קבצים? (y/n): ")
            if confirm.lower() in ['y', 'yes', 'כן']:
                rename_files_in_main_folder()
            else:
                print("ביטול פעולה")
        elif choice == "3":
            print("👋 יציאה...")
            break
        else:
            print("❌ בחירה לא תקינה")

if __name__ == "__main__":
    main()