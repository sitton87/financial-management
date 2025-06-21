"""
smart_parsers.py - פרסר מושלם על בסיס ניתוח 3 חברות האשראי
"""
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import re

def parse_file(filepath) -> List[Dict]:
    """פונקציה ראשית לפרסור קובץ - נקודת כניסה יחידה"""
    company = detect_company_from_filename(filepath.name)
    print(f"   🏢 חברה: {company}")
    
    try:
        df = pd.read_excel(filepath)
        
        if df.empty:
            print(f"   ⚠️ הקובץ ריק")
            return []
        
        print(f"   📊 נטען קובץ עם {len(df)} שורות ו-{len(df.columns)} עמודות")
        
        # בחירת אסטרטגיית פרסור לפי חברה
        if company == 'ישראכרט':
            return parse_isracard(df, company)
        else:  # דיינרס או כאל
            return parse_diners_cal(df, company)
            
    except Exception as e:
        print(f"   ❌ שגיאה בפרסור: {e}")
        return []

def parse_isracard(df: pd.DataFrame, company: str) -> List[Dict]:
    """פרסר ייעודי לישראכרט - 2 קבוצות נתונים"""
    
    transactions = []
    
    # קבוצה 1: שורה 9
    group1 = parse_isracard_group(df, 8, "קבוצה 1", company)  # שורה 9 = אינדקס 8
    transactions.extend(group1)
    
    # קבוצה 2: שורה 26  
    group2 = parse_isracard_group(df, 25, "קבוצה 2", company)  # שורה 26 = אינדקס 25
    transactions.extend(group2)
    
    print(f"   ✅ סה\"כ עסקאות ישראכרט: {len(transactions)}")
    return transactions

def parse_isracard_group(df: pd.DataFrame, header_row: int, group_name: str, company: str) -> List[Dict]:
    """פרסור קבוצת נתונים אחת של ישראכרט"""
    
    if header_row >= len(df):
        return []
    
    print(f"   📋 מעבד {group_name} (שורת כותרות {header_row + 1})")
    
    # עמודות קבועות לישראכרט
    date_col = 0  # תאריך רכישה
    business_col = 1  # שם בית עסק
    amount_col = 4  # סכום חיוב
    
    transactions = []
    data_start = header_row + 1
    
    # עיבוד נתונים עד שנגמרים או נמצאת כותרת חדשה
    for row_idx in range(data_start, len(df)):
        
        # בדיקה אם השורה ריקה ברובה (סוף קבוצה)
        non_empty_count = sum(1 for col in range(len(df.columns)) 
                            if not pd.isna(df.iloc[row_idx, col]) and str(df.iloc[row_idx, col]).strip())
        
        if non_empty_count < 3:
            break
        
        # בדיקה אם זו כותרת חדשה
        if is_header_row(df, row_idx):
            break
        
        # פרסור השורה
        transaction = parse_isracard_row(df, row_idx, date_col, business_col, amount_col, company)
        if transaction:
            transactions.append(transaction)
    
    print(f"      ✅ נמצאו {len(transactions)} עסקאות ב{group_name}")
    return transactions

def parse_diners_cal(df: pd.DataFrame, company: str) -> List[Dict]:
    """פרסר ייעודי לדיינרס וכאל - מבנה פשוט"""
    
    transactions = []
    
    # שורת כותרות קבועה: שורה 3 (אינדקס 2)
    header_row = 2
    
    if header_row >= len(df):
        print(f"   ❌ שורת הכותרות לא נמצאה")
        return []
    
    print(f"   📋 מעבד נתונים מחל בשורה {header_row + 1}")
    
    # עמודות קבועות
    date_col = 0  # תאריך עסקה
    business_col = 1  # שם בית עסק  
    amount_col = 3  # סכום חיוב
    
    # עיבוד נתונים מהשורה שאחרי הכותרות
    data_start = header_row + 1
    
    for row_idx in range(data_start, len(df)):
        transaction = parse_simple_row(df, row_idx, date_col, business_col, amount_col, company)
        if transaction:
            transactions.append(transaction)
    
    print(f"   ✅ נמצאו {len(transactions)} עסקאות")
    return transactions

def parse_isracard_row(df: pd.DataFrame, row_idx: int, date_col: int, business_col: int, amount_col: int, company: str) -> Optional[Dict]:
    """פרסור שורה של ישראכרט"""
    
    try:
        # תאריך (פורמט dd.mm.yy)
        date_val = df.iloc[row_idx, date_col]
        if pd.isna(date_val):
            return None
        
        date_str = str(date_val).strip()
        try:
            # פורמט ישראכרט: dd.mm.yy
            transaction_date = datetime.strptime(date_str, '%d.%m.%y')
        except:
            return None
        
        # עסק
        business_val = df.iloc[row_idx, business_col]
        if pd.isna(business_val):
            return None
        
        business_name = str(business_val).strip()
        if len(business_name) < 2:
            return None
        
        # סכום
        amount_val = df.iloc[row_idx, amount_col]
        if pd.isna(amount_val):
            return None
        
        try:
            amount = abs(float(amount_val))
            if amount <= 0:
                return None
        except:
            return None
        
        return {
            'date': transaction_date,
            'business': business_name,
            'amount': amount,
            'company': company,
            'raw_data': df.iloc[row_idx].to_dict()
        }
        
    except Exception:
        return None

def parse_simple_row(df: pd.DataFrame, row_idx: int, date_col: int, business_col: int, amount_col: int, company: str) -> Optional[Dict]:
    """פרסור שורה של דיינרס/כאל"""
    
    try:
        # תאריך (datetime object)
        date_val = df.iloc[row_idx, date_col]
        if pd.isna(date_val):
            return None
        
        if isinstance(date_val, datetime):
            transaction_date = date_val
        else:
            try:
                transaction_date = pd.to_datetime(date_val)
            except:
                return None
        
        # עסק
        business_val = df.iloc[row_idx, business_col]
        if pd.isna(business_val):
            return None
        
        business_name = str(business_val).strip()
        if len(business_name) < 2:
            return None
        
        # סכום
        amount_val = df.iloc[row_idx, amount_col]
        if pd.isna(amount_val):
            return None
        
        try:
            amount = abs(float(amount_val))
            if amount <= 0:
                return None
        except:
            return None
        
        return {
            'date': transaction_date,
            'business': business_name,
            'amount': amount,
            'company': company,
            'raw_data': df.iloc[row_idx].to_dict()
        }
        
    except Exception:
        return None

def is_header_row(df: pd.DataFrame, row_idx: int) -> bool:
    """בדיקה אם השורה היא כותרת חדשה"""
    
    header_keywords = ['תאריך', 'שם', 'עסק', 'סכום', 'חיוב']
    score = 0
    
    for col_idx in range(len(df.columns)):
        cell_value = str(df.iloc[row_idx, col_idx]).lower().strip()
        for keyword in header_keywords:
            if keyword in cell_value:
                score += 1
                break
    
    return score >= 3

def detect_company_from_filename(filename: str) -> str:
    """זיהוי חברת כרטיס אשראי מתוך שם הקובץ"""
    filename_lower = filename.lower()
    
    if 'דיינרס' in filename_lower or 'diners' in filename_lower:
        return 'דיינרס'
    elif 'ישראכרט' in filename_lower or 'isracard' in filename_lower:
        return 'ישראכרט'
    elif 'כאל' in filename_lower or 'cal' in filename_lower:
        return 'כאל'
    elif 'ויזה' in filename_lower or 'visa' in filename_lower:  # ✅ הוספתי ויזה
        return 'ויזה'
    elif 'מסטרקארד' in filename_lower or 'mastercard' in filename_lower:
        return 'מסטרקארד'
    elif 'אמריקן' in filename_lower or 'american' in filename_lower:
        return 'אמריקן_אקספרס'
    else:
        return 'לא_ידוע'

# פונקציות Legacy לתאימות לאחור (אם נדרש)
def find_header_row(df: pd.DataFrame) -> Optional[int]:
    """Legacy function - לתאימות עם קוד קיים"""
    return 2  # עבור דיינרס/כאל

def detect_columns_smart(df: pd.DataFrame, header_row: int) -> Tuple[str, str, str]:
    """Legacy function - לתאימות עם קוד קיים"""
    return df.columns[0], df.columns[1], df.columns[3]

def parse_transaction_row(row: pd.Series, date_col: str, business_col: str, amount_col: str) -> Optional[Dict]:
    """Legacy function - לתאימות עם קוד קיים"""
    return None

def parse_excel_smart(filepath, company: str) -> List[Dict]:
    """Legacy function - מפנה לפונקציה החדשה"""
    return parse_file(filepath)


def extract_card_number(filename: str) -> str:
    """חילוץ 4 ספרות אחרונות של מספר כרטיס מתוך שם הקובץ"""
    import re
    
    # דפוס לחיפוש מספר כרטיס: חברה_מספר_חודש_שנה
    # דוגמאות: דיינרס_5590_05_2025, ישראכרט_9158_03_2025, כאל_8092_02_2025
    
    pattern = r'[א-ת]+_(\d{4})_\d{2}_\d{4}'
    match = re.search(pattern, filename)
    
    if match:
        card_number = match.group(1)
        print(f"   💳 מספר כרטיס: ****{card_number}")
        return card_number
    
    print(f"   ⚠️ לא נמצא מספר כרטיס בשם הקובץ")
    return None

# עדכן את הפונקציה parse_file:

def parse_file(filepath) -> List[Dict]:
    """פונקציה ראשית לפרסור קובץ - עם מספר כרטיס"""
    company = detect_company_from_filename(filepath.name)
    card_number = extract_card_number(filepath.name)  # ← חדש!
    
    print(f"   🏢 חברה: {company}")
    
    try:
        df = pd.read_excel(filepath)
        
        if df.empty:
            print(f"   ⚠️ הקובץ ריק")
            return []
        
        print(f"   📊 נטען קובץ עם {len(df)} שורות ו-{len(df.columns)} עמודות")
        
        # בחירת אסטרטגיית פרסור לפי חברה
        if company == 'ישראכרט':
            transactions = parse_isracard(df, company)
        else:  # דיינרס או כאל
            transactions = parse_diners_cal(df, company)
        
        # הוספת מספר כרטיס לכל עסקה
        for transaction in transactions:
            transaction['card_last_four'] = card_number  # ← חדש!
            
        return transactions
            
    except Exception as e:
        print(f"   ❌ שגיאה בפרסור: {e}")
        return []
    
if __name__ == "__main__":
    # בדיקה של הפרסר
    from pathlib import Path
    
    test_files = [
        "דיינרס_5590_05_2025.xlsx",
        "ישראכרט_9158_06_2025.xlsx", 
        "כאל_8092_04_2025.xlsx"
    ]
    
    base_path = Path("C:/Users/user1/OneDrive - Open University of Israel/שולחן העבודה/Siton/פיננסים/הוצאות/ניהול הוצאות 06_25")
    
    for filename in test_files:
        filepath = base_path / filename
        if filepath.exists():
            print(f"\n🧪 בודק: {filename}")
            results = parse_file(filepath)
            print(f"📊 תוצאה: {len(results)} עסקאות")
            
            # הצגת דוגמה
            if results:
                first = results[0]
                print(f"   דוגמה: {first['date'].strftime('%Y-%m-%d')} - {first['business']} - {first['amount']}")