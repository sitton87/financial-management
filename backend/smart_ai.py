"""
smart_ai.py
מערכת AI למידה חכמה לקטגוריזציה אוטומטית
"""
import re
import difflib
from collections import defaultdict, Counter
from typing import List, Dict, Tuple, Optional
from database_manager import FinancialDatabase

class SmartCategorizer:
    def __init__(self, db: FinancialDatabase):
        self.db = db
        self.business_patterns = {}
        self.category_keywords = {}
        self.amount_patterns = {}
        
    def learn_from_existing_data(self):
        """למידה מכל הנתונים הקיימים"""
        print("🧠 מתחיל למידה מהנתונים הקיימים...")
        
        # שליפת כל העסקאות
        result = self.db.supabase.table('transactions').select('''
            business_name, 
            normalized_business, 
            amount, 
            category_id,
            categories(name)
        ''').execute()
        
        transactions = result.data
        print(f"📊 נמצאו {len(transactions)} עסקאות ללמידה")
        
        # למידת תבניות
        self._learn_business_patterns(transactions)
        self._learn_category_keywords(transactions)
        self._learn_amount_patterns(transactions)
        
        print("✅ למידה הושלמה!")
        return len(transactions)
    
    def _learn_business_patterns(self, transactions):
        """למידת תבניות שמות עסקים"""
        category_businesses = defaultdict(list)
        
        for t in transactions:
            if t['categories']:
                category_name = t['categories']['name']
                business_name = t['business_name'].lower()
                category_businesses[category_name].append(business_name)
        
        # חילוץ מילות מפתח לכל קטגוריה
        for category, businesses in category_businesses.items():
            words = []
            for business in businesses:
                # חילוץ מילים (ללא מספרים וסימנים)
                business_words = re.findall(r'[א-תa-z]{2,}', business)
                words.extend(business_words)
            
            # ספירת מילים נפוצות
            word_counts = Counter(words)
            # שמירת המילים הנפוצות ביותר (מעל 2 הופעות)
            common_words = {word: count for word, count in word_counts.items() if count >= 2}
            
            if common_words:
                self.category_keywords[category] = common_words
                print(f"   📝 {category}: {list(common_words.keys())[:5]}")
    
    def _learn_category_keywords(self, transactions):
        """למידת מילות מפתח לקטגוריות"""
        # זה כבר נעשה ב-_learn_business_patterns
        pass
    
    def _learn_amount_patterns(self, transactions):
        """למידת תבניות סכומים"""
        category_amounts = defaultdict(list)
        
        for t in transactions:
            if t['categories']:
                category_name = t['categories']['name']
                category_amounts[category_name].append(t['amount'])
        
        # חישוב ממוצע וטווח לכל קטגוריה
        for category, amounts in category_amounts.items():
            avg_amount = sum(amounts) / len(amounts)
            min_amount = min(amounts)
            max_amount = max(amounts)
            
            self.amount_patterns[category] = {
                'avg': avg_amount,
                'min': min_amount,
                'max': max_amount,
                'count': len(amounts)
            }
    
    def suggest_category(self, business_name: str, amount: float) -> Tuple[str, float]:
        """הצעת קטגוריה לעסק חדש"""
        business_lower = business_name.lower()
        scores = {}
        
        # ניקוד לפי מילות מפתח
        for category, keywords in self.category_keywords.items():
            score = 0
            for keyword, frequency in keywords.items():
                if keyword in business_lower:
                    # ניקוד גבוה יותר למילים נפוצות יותר
                    score += frequency * 0.1
            scores[category] = score
        
        # ניקוד לפי סכום (בונוס קטן)
        for category, pattern in self.amount_patterns.items():
            if category in scores:
                # אם הסכום קרוב לממוצע הקטגוריה
                avg_diff = abs(amount - pattern['avg']) / pattern['avg']
                if avg_diff < 0.5:  # בטווח של 50% מהממוצע
                    scores[category] += 0.2
        
        # מציאת הקטגוריה עם הניקוד הגבוה ביותר
        if scores:
            best_category = max(scores, key=scores.get)
            confidence = min(scores[best_category], 0.95)  # מקסימום 95%
            return best_category, confidence
        
        return 'שונות', 0.3
    
    def find_similar_businesses(self, business_name: str, threshold: float = 0.7) -> List[Dict]:
        """מציאת עסקים דומים"""
        business_lower = business_name.lower()
        
        # שליפת כל העסקים
        result = self.db.supabase.table('transactions').select('''
            id, business_name, normalized_business, category_id,
            categories(name, color)
        ''').execute()
        
        similar = []
        for transaction in result.data:
            other_business = transaction['business_name'].lower()
            
            # חישוב דמיון
            similarity = difflib.SequenceMatcher(None, business_lower, other_business).ratio()
            
            if similarity >= threshold and business_lower != other_business:
                similar.append({
                    'id': transaction['id'],
                    'business_name': transaction['business_name'],
                    'similarity': similarity,
                    'current_category': transaction['categories']['name'] if transaction['categories'] else None
                })
        
        # מיון לפי דמיון
        similar.sort(key=lambda x: x['similarity'], reverse=True)
        return similar[:10]  # מקסימום 10 תוצאות
    
    def update_similar_businesses(self, business_name: str, new_category_id: int, threshold: float = 0.8):
        """עדכון עסקים דומים לקטגוריה חדשה"""
        similar = self.find_similar_businesses(business_name, threshold)
        updated_count = 0
        
        for similar_business in similar:
            # עדכון רק אם הדמיון גבוה מאוד
            if similar_business['similarity'] >= threshold:
                try:
                    self.db.supabase.table('transactions').update({
                        'category_id': new_category_id
                    }).eq('id', similar_business['id']).execute()
                    updated_count += 1
                except Exception as e:
                    print(f"   ⚠️ שגיאה בעדכון {similar_business['business_name']}: {e}")
        
        return updated_count
    
    def retrain_on_correction(self, business_name: str, old_category: str, new_category: str):
        """למידה מתיקון משתמש"""
        print(f"📚 לומד מתיקון: {business_name} מ-{old_category} ל-{new_category}")
        
        # הוספת המילים מהעסק לקטגוריה החדשה
        business_words = re.findall(r'[א-תa-z]{2,}', business_name.lower())
        
        if new_category not in self.category_keywords:
            self.category_keywords[new_category] = {}
        
        for word in business_words:
            if word in self.category_keywords[new_category]:
                self.category_keywords[new_category][word] += 1
            else:
                self.category_keywords[new_category][word] = 1
        
        # הסרת המילים מהקטגוריה הישנה (אם יש)
        if old_category in self.category_keywords:
            for word in business_words:
                if word in self.category_keywords[old_category]:
                    self.category_keywords[old_category][word] = max(
                        self.category_keywords[old_category][word] - 1, 0
                    )
        
        print(f"   ✅ נלמדו {len(business_words)} מילות מפתח חדשות")
    
    def bulk_retrain_all(self):
        """אימון מחדש על כל הנתונים"""
        print("🔄 מתחיל אימון מחדש על כל הנתונים...")
        
        # איפוס ידע קיים
        self.business_patterns = {}
        self.category_keywords = {}
        self.amount_patterns = {}
        
        # למידה מחדש
        transactions_count = self.learn_from_existing_data()
        
        # הצעות שיפור אוטומטיות
        suggestions = self.get_improvement_suggestions()
        
        return {
            'transactions_processed': transactions_count,
            'suggestions_count': len(suggestions),
            'categories_learned': len(self.category_keywords),
            'keywords_total': sum(len(words) for words in self.category_keywords.values())
        }
    
    def get_improvement_suggestions(self, limit: int = 20) -> List[Dict]:
        """קבלת הצעות שיפור"""
        suggestions = []
        
        # שליפת עסקאות עם ביטחון נמוך
        result = self.db.supabase.table('transactions').select('''
            id, business_name, amount, confidence_score, category_id,
            categories(name, color)
        ''').lt('confidence_score', 0.7).limit(limit).execute()
        
        for transaction in result.data:
            # הצעת קטגוריה חדשה
            suggested_category, confidence = self.suggest_category(
                transaction['business_name'], 
                transaction['amount']
            )
            
            current_category = transaction['categories']['name'] if transaction['categories'] else 'לא מוגדר'
            
            # רק אם ההצעה שונה מהנוכחית ויש ביטחון גבוה
            if suggested_category != current_category and confidence > 0.6:
                suggestions.append({
                    'transaction_id': transaction['id'],
                    'business_name': transaction['business_name'],
                    'current_category': current_category,
                    'suggested_category': suggested_category,
                    'confidence': confidence,
                    'amount': transaction['amount']
                })
        
        return suggestions
    
    def get_stats(self) -> Dict:
        """סטטיסטיקות AI"""
        # ספירת עסקאות לפי רמת ביטחון
        high_confidence = self.db.supabase.table('transactions').select('id').gte('confidence_score', 0.8).execute()
        medium_confidence = self.db.supabase.table('transactions').select('id').gte('confidence_score', 0.5).lt('confidence_score', 0.8).execute()
        low_confidence = self.db.supabase.table('transactions').select('id').lt('confidence_score', 0.5).execute()
        
        return {
            'total_categories': len(self.category_keywords),
            'total_keywords': sum(len(words) for words in self.category_keywords.values()),
            'high_confidence_transactions': len(high_confidence.data),
            'medium_confidence_transactions': len(medium_confidence.data),
            'low_confidence_transactions': len(low_confidence.data),
            'learned_patterns': len(self.amount_patterns)
        }


def main():
    """בדיקת המערכת"""
    # ייבוא הגדרות מרכזיות
    from config import get_supabase_config, validate_config
    
    if not validate_config():
        print("⚠️ תקן את ההגדרות בconfig.py")
        return
    
    config = get_supabase_config()
    URL = config['url']
    KEY = config['service_key']
    
    # יצירת מערכת AI
    db = FinancialDatabase(URL, KEY)
    ai = SmartCategorizer(db)
    
    print("🤖 מערכת AI חכמה למידה פיננסית")
    print("=" * 50)
    
    # למידה מהנתונים הקיימים
    ai.learn_from_existing_data()
    
    # הצגת סטטיסטיקות
    stats = ai.get_stats()
    print(f"\n📊 סטטיסטיקות AI:")
    print(f"   📂 קטגוריות: {stats['total_categories']}")
    print(f"   🔤 מילות מפתח: {stats['total_keywords']}")
    print(f"   ✅ ביטחון גבוה: {stats['high_confidence_transactions']}")
    print(f"   ⚠️ ביטחון נמוך: {stats['low_confidence_transactions']}")
    
    # הצעות שיפור
    suggestions = ai.get_improvement_suggestions(5)
    print(f"\n💡 הצעות שיפור ({len(suggestions)}):")
    for suggestion in suggestions:
        print(f"   • {suggestion['business_name']}")
        print(f"     נוכחי: {suggestion['current_category']}")
        print(f"     הצעה: {suggestion['suggested_category']} ({suggestion['confidence']:.0%})")
    
    # בדיקת עסק חדש
    print(f"\n🧪 בדיקת הצעות לעסקים חדשים:")
    test_businesses = [
        ("קפה גרג תל אביב", 25.0),
        ("סופר פארם בת ים", 89.50),
        ("דלק קריית גת", 180.0)
    ]
    
    for business, amount in test_businesses:
        category, confidence = ai.suggest_category(business, amount)
        print(f"   • {business} (₪{amount}) → {category} ({confidence:.0%})")


if __name__ == "__main__":
    main()