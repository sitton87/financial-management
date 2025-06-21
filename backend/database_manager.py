"""
database_manager.py
מנהל מסד נתונים, קטגוריזציה וכל הפעולות הקשורות לSupabase
גרסה מלאה ומעודכנת עם AI
"""
import re
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from supabase import create_client
import pandas as pd

class FinancialDatabase:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase = create_client(supabase_url, supabase_key)
        self.categories_cache = {}
        self.known_businesses_cache = {}
        
    def test_connection(self) -> bool:
        """בדיקת חיבור למסד נתונים"""
        try:
            response = self.supabase.table('categories').select('id').limit(1).execute()
            print("✅ חיבור למסד הנתונים מוצלח")
            
            self._ensure_basic_categories()
            self._load_caches()
            
            return True
        except Exception as e:
            print(f"❌ שגיאה בחיבור: {e}")
            return False
    
    def _ensure_basic_categories(self):
        """יצירת קטגוריות בסיסיות אם לא קיימות"""
        try:
            response = self.supabase.table('categories').select('id').execute()
            
            if not response.data:
                print("📝 יוצר קטגוריות בסיסיות...")
                
                categories = [
                    {'name': 'מזון ומשקאות', 'description': 'מסעדות וסופרמרקטים', 'color': '#28a745', 'icon': '🍔'},
                    {'name': 'תחבורה', 'description': 'דלק וחניה', 'color': '#ffc107', 'icon': '🚗'},
                    {'name': 'קניות', 'description': 'ביגוד ואלקטרוניקה', 'color': '#17a2b8', 'icon': '🛍️'},
                    {'name': 'בילוי ותרבות', 'description': 'קולנוע וספורט', 'color': '#e83e8c', 'icon': '🎭'},
                    {'name': 'בריאות', 'description': 'רופאים ובתי מרקחת', 'color': '#fd7e14', 'icon': '🏥'},
                    {'name': 'שירותים', 'description': 'חשמל ואינטרנט', 'color': '#6c757d', 'icon': '🔧'},
                    {'name': 'חינוך', 'description': 'לימודים וקורסים', 'color': '#20c997', 'icon': '📚'},
                    {'name': 'בית ומשק', 'description': 'ריהוט ותחזוקה', 'color': '#6f42c1', 'icon': '🏠'},
                    {'name': 'ביטוח ופיננסים', 'description': 'ביטוחים ובנקים', 'color': '#343a40', 'icon': '🏦'},
                    {'name': 'שונות', 'description': 'הוצאות שונות', 'color': '#868e96', 'icon': '❓'}
                ]
                
                self.supabase.table('categories').insert(categories).execute()
                print(f"   ✅ נוצרו {len(categories)} קטגוריות")
                
        except Exception as e:
            print(f"   ⚠️ שגיאה ביצירת קטגוריות: {e}")
    
    def _load_caches(self):
        """טעינת קטגוריות ועסקים מוכרים לזיכרון"""
        try:
            # טעינת קטגוריות
            response = self.supabase.table('categories').select('id, name').execute()
            self.categories_cache = {cat['name']: cat['id'] for cat in response.data}
            print(f"   📋 נטענו {len(self.categories_cache)} קטגוריות")
            
            # טעינת עסקים מוכרים
            response = self.supabase.table('known_businesses').select('normalized_name, category_id').execute()
            self.known_businesses_cache = {
                business['normalized_name']: business['category_id'] 
                for business in response.data
            }
            print(f"   🏪 נטענו {len(self.known_businesses_cache)} עסקים מוכרים")
            
        except Exception as e:
            print(f"   ⚠️ שגיאה בטעינת מטמון: {e}")
    
    def normalize_business_name(self, name: str) -> str:
        """נרמול שם עסק לזיהוי"""
        if not name or pd.isna(name):
            return "unknown"
        
        normalized = str(name).lower().strip()
        # הסרת מספרי כרטיס ותאריכים
        normalized = re.sub(r'\d{4}[-\s]*\d{4}[-\s]*\d{4}[-\s]*\d{4}', '', normalized)
        normalized = re.sub(r'\d{2}[/\-]\d{2}', '', normalized)
        # הסרת סימנים מיוחדים
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized or "unknown"
    
    def categorize_business(self, business_name: str) -> Tuple[Optional[int], bool, float]:
        """קטגוריזציה חכמה של עסק"""
        normalized = self.normalize_business_name(business_name)
        
        # בדיקה בעסקים מוכרים
        if normalized in self.known_businesses_cache:
            return self.known_businesses_cache[normalized], True, 0.95
        
        # קטגוריזציה אוטומטית לפי כללים
        category_name, confidence = self._auto_categorize(business_name)
        category_id = self.categories_cache.get(category_name)
        
        if category_id:
            # שמירת העסק החדש
            self._save_new_business(business_name, normalized, category_id)
            return category_id, False, confidence
        
        # ברירת מחדל
        default_id = self.categories_cache.get('שונות')
        return default_id, False, 0.30
    
    def _auto_categorize(self, business_name: str) -> Tuple[str, float]:
        """קטגוריזציה אוטומטית לפי כללים"""
        business_lower = business_name.lower()
        
        rules = [
            (['רמי לוי', 'סופר', 'שופרסל', 'מגה', 'ויקטורי', 'טיב טעם', 'אושר עד'], 'מזון ומשקאות', 0.90),
            (['דלק', 'פז', 'סונול', 'דור אלון', 'חניה', 'פארק'], 'תחבורה', 0.90),
            (['מקדונלד', 'בורגר', 'פיצה', 'קפה', 'מסעדה', 'רולדין', 'גרג'], 'מזון ומשקאות', 0.85),
            (['פארם', 'מרקח', 'רופא', 'מכבי', 'כללית', 'לאומית', 'מנורה'], 'בריאות', 0.90),
            (['חשמל', 'בזק', 'פרטנר', 'סלקום', 'הוט', 'yes'], 'שירותים', 0.90),
            (['קולנוע', 'ספורט', 'כושר', 'חדר כושר'], 'בילוי ותרבות', 0.85),
            (['זארה', 'קסטרו', 'אלקטרה', 'כי.אס.פי'], 'קניות', 0.80),
            (['פנגו', 'מוביט', 'תחבורה'], 'תחבורה', 0.85),
            (['apple', 'אפל', 'גוגל', 'microsoft', 'cursor', 'openai', 'claude'], 'קניות', 0.80),
            (['paybox'], 'שונות', 0.70),
            (['ליברה', 'ביטוח', 'כלל רכב', 'כלל דירה'], 'ביטוח ופיננסים', 0.85),
            (['העברה', 'bit'], 'שונות', 0.60),
            (['דמי כרטיס', 'מזרחי'], 'ביטוח ופיננסים', 0.80),
        ]
        
        for keywords, category, confidence in rules:
            if any(keyword in business_lower for keyword in keywords):
                return category, confidence
        
        return 'שונות', 0.30
    
    def _save_new_business(self, original_name: str, normalized_name: str, category_id: int):
        """שמירת עסק חדש למסד הנתונים"""
        try:
            business_data = {
                'business_name': original_name,
                'normalized_name': normalized_name,
                'category_id': category_id,
                'auto_category': True
            }
            
            self.supabase.table('known_businesses').insert(business_data).execute()
            self.known_businesses_cache[normalized_name] = category_id
            
        except Exception:
            pass  # אם כבר קיים, זה בסדר
    
    def check_file_processed(self, file_hash: str) -> bool:
        """בדיקה אם קובץ כבר עובד"""
        try:
            response = self.supabase.table('processed_files').select('id').eq('file_hash', file_hash).limit(1).execute()
            return len(response.data) > 0
        except:
            return False

    def save_transactions(self, transactions: List[Dict], file_hash: str) -> int:
        """שמירת עסקאות למסד נתונים - עם מספר כרטיס"""
        if not transactions:
            return 0
        
        # הוספת מידע נוסף לכל עסקה
        processed_transactions = []
        for transaction in transactions:
            category_id, is_known, confidence = self.categorize_business(transaction['business'])
            
            # המרת datetime לstring
            transaction_date = transaction['date']
            if hasattr(transaction_date, 'strftime'):
                date_str = transaction_date.strftime('%Y-%m-%d')
            else:
                date_str = str(transaction_date)
            
            processed_transaction = {
                'transaction_date': date_str,
                'business_name': transaction['business'],
                'normalized_business': self.normalize_business_name(transaction['business']),
                'amount': float(transaction['amount']),
                'original_amount': float(transaction['amount']),
                'currency': 'ILS',
                'company': transaction['company'],
                'description': transaction['business'][:500],
                'category_id': category_id,
                'confidence_score': float(confidence) if confidence else 0.5,
                'file_hash': file_hash,
                'card_last_four': transaction.get('card_last_four'),
                'raw_data': self._clean_raw_data(transaction.get('raw_data', {})),
                'needs_review': confidence < 0.50 if confidence else True
            }
            processed_transactions.append(processed_transaction)
        
        try:
            response = self.supabase.table('transactions').insert(processed_transactions).execute()
            
            if response.data:
                saved_count = len(response.data)
                print(f"   ✅ נשמרו {saved_count} עסקאות למסד הנתונים")
                return saved_count
            else:
                print(f"   ❌ לא נשמרו עסקאות")
                return 0
                
        except Exception as e:
            print(f"   ❌ שגיאה בשמירה: {e}")
            return 0
        
    def save_processed_file(self, filename: str, file_hash: str, company: str, count: int, processing_time: float = 0):
        """שמירת מידע על קובץ מעובד"""
        try:
            file_data = {
                'filename': filename,
                'file_hash': file_hash,
                'company': company,
                'processing_status': 'completed',
                'transactions_count': count,
                'processing_time_seconds': processing_time
            }
            
            result = self.supabase.table('processed_files').insert(file_data).execute()
            print(f"   📝 קובץ נרשם כמעובד: {filename}")
            
        except Exception as e:
            print(f"   ⚠️ שגיאה בשמירת מידע קובץ: {e}")
        
    def _clean_raw_data(self, raw_data: Dict) -> Dict:
        """ניקוי raw_data מobjects שלא ניתנים לserialization"""
        cleaned = {}
        
        for key, value in raw_data.items():
            try:
                # המרת datetime לstring
                if hasattr(value, 'strftime'):
                    cleaned[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                # המרת pandas objects לסוגי נתונים פשוטים  
                elif hasattr(value, 'item'):  # numpy/pandas scalar
                    cleaned[key] = value.item()
                # המרת NaN לNone
                elif str(value).lower() == 'nan':
                    cleaned[key] = None
                # אם זה כבר JSON serializable
                else:
                    json.dumps(value)  # בדיקה שזה ניתן לserialization
                    cleaned[key] = value
            except:
                # אם לא ניתן לserialization - המר לstring
                cleaned[key] = str(value) if value is not None else None
        
        return cleaned
    
    def get_stats(self) -> Dict:
        """קבלת סטטיסטיקות מהמסד"""
        try:
            stats = {}
            
            # סה"כ עסקאות
            response = self.supabase.table('transactions').select('count', count='exact').execute()
            stats['total_transactions'] = response.count
            
            # סה"כ קטגוריות
            response = self.supabase.table('categories').select('count', count='exact').execute()
            stats['total_categories'] = response.count
            
            # קבצים מעובדים
            response = self.supabase.table('processed_files').select('count', count='exact').execute()
            stats['processed_files'] = response.count
            
            # סכום כולל
            response = self.supabase.table('transactions').select('amount').execute()
            total_amount = sum(float(t['amount']) for t in response.data if t['amount'])
            stats['total_amount'] = f"{total_amount:,.2f} ₪"
            
            return stats
            
        except Exception as e:
            print(f"❌ שגיאה בקבלת סטטיסטיקות: {e}")
            return {}

    # 🤖 פונקציות AI
    def categorize_business_with_ai(self, business_name: str, amount: float = 0) -> Tuple[Optional[int], bool, float]:
        """קטגוריזציה חכמה עם AI"""
        normalized = self.normalize_business_name(business_name)
        
        # בדיקה בעסקים מוכרים קודם
        if normalized in self.known_businesses_cache:
            return self.known_businesses_cache[normalized], True, 0.95
        
        # אם יש מערכת AI - השתמש בה
        if hasattr(self, 'ai_categorizer'):
            suggested_category, confidence = self.ai_categorizer.suggest_category(business_name, amount)
            category_id = self.categories_cache.get(suggested_category)
            
            if category_id and confidence > 0.6:
                # שמור את העסק החדש עם הקטגוריה המוצעת
                self._save_new_business(business_name, normalized, category_id)
                return category_id, False, confidence
        
        # נפילה לקטגוריזציה רגילה
        return self.categorize_business(business_name)

    def learn_from_correction(self, transaction_id: int, old_category_id: int, new_category_id: int):
        """למידה מתיקון משתמש"""
        try:
            # שליפת פרטי העסקה
            result = self.supabase.table('transactions').select('''
                business_name, amount
            ''').eq('id', transaction_id).single().execute()
            
            transaction = result.data
            business_name = transaction['business_name']
            
            # למידת התיקון אם יש AI
            if hasattr(self, 'ai_categorizer'):
                old_category_name = self._get_category_name(old_category_id)
                new_category_name = self._get_category_name(new_category_id)
                
                self.ai_categorizer.retrain_on_correction(
                    business_name, old_category_name, new_category_name
                )
                
                # עדכון עסקים דומים
                updated_count = self.ai_categorizer.update_similar_businesses(
                    business_name, new_category_id, threshold=0.85
                )
                
                print(f"🤖 AI עדכן {updated_count} עסקאות דומות")
                return updated_count
            
            return 0
            
        except Exception as e:
            print(f"שגיאה בלמידת תיקון: {e}")
            return 0

    def bulk_retrain_ai(self):
        """אימון מחדש של כל מערכת הAI"""
        if not hasattr(self, 'ai_categorizer'):
            from smart_ai import SmartCategorizer
            self.ai_categorizer = SmartCategorizer(self)
        
        return self.ai_categorizer.bulk_retrain_all()

    def get_ai_suggestions(self, limit: int = 20):
        """קבלת הצעות שיפור מהAI"""
        if hasattr(self, 'ai_categorizer'):
            return self.ai_categorizer.get_improvement_suggestions(limit)
        return []

    def initialize_ai(self):
        """אתחול מערכת AI"""
        try:
            from smart_ai import SmartCategorizer
            self.ai_categorizer = SmartCategorizer(self)
            
            # למידה ראשונית מהנתונים הקיימים
            transactions_count = self.ai_categorizer.learn_from_existing_data()
            
            print(f"🤖 AI אותחל בהצלחה עם {transactions_count} עסקאות")
            return True
            
        except Exception as e:
            print(f"⚠️ שגיאה באתחול AI: {e}")
            return False

    def _get_category_name(self, category_id: int) -> str:
        """קבלת שם קטגוריה לפי ID"""
        for name, cat_id in self.categories_cache.items():
            if cat_id == category_id:
                return name
        return 'לא מוגדר'


def get_file_hash(filepath) -> str:
    """חישוב hash לקובץ"""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except:
        return None


if __name__ == "__main__":
    # בדיקה של מנהל המסד
    from config import get_supabase_config, validate_config
    
    print("🧪 בדיקת מנהל מסד הנתונים...")
    
    if validate_config():
        config = get_supabase_config()
        db = FinancialDatabase(config['url'], config['service_key'])
        if db.test_connection():
            print("✅ הכל עובד!")
            stats = db.get_stats()
            print(f"📊 סטטיסטיקות: {stats}")
        else:
            print("❌ בעיה בחיבור")
    else:
        print("⚠️ תקן את ההגדרות בconfig.py")