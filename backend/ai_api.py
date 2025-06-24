"""
AI API Server - שרת פשוט לתובנות AI
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime, timedelta
import sys
import os

# הוספת נתיב לbackend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import get_supabase_config, validate_config
from database_manager import FinancialDatabase
from smart_ai import SmartCategorizer

app = Flask(__name__)
CORS(app)  # מאפשר קריאות מהדפדפן

# 🌐 משתנים גלובליים
db = None
ai = None

def init_ai_system():
    """אתחול מערכת AI"""
    global db, ai
    
    try:
        # בדיקת הגדרות
        if not validate_config():
            print("❌ הגדרות לא תקינות")
            return False
            
        # חיבור למסד נתונים
        config = get_supabase_config()
        db = FinancialDatabase(config['url'], config['service_key'])
        
        if not db.test_connection():
            print("❌ חיבור למסד נתונים נכשל")
            return False
            
        # אתחול AI
        ai = SmartCategorizer(db)
        
        print("✅ מערכת AI אותחלה בהצלחה")
        return True
        
    except Exception as e:
        print(f"❌ שגיאה באתחול AI: {e}")
        return False

@app.route('/api/ai-stats', methods=['GET'])
def get_ai_stats():
    """קבלת סטטיסטיקות AI"""
    try:
        if not ai:
            return jsonify({'error': 'AI לא מאותחל'}), 500
            
        # חישוב סטטיסטיקות
        total_businesses = len(ai.db.known_businesses_cache)
        
        # עסקאות מהשבוע האחרון
        week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        recent_transactions = ai.db.supabase.table('transactions').select('*').gte('date', week_ago).execute()
        processed_count = len(recent_transactions.data) if recent_transactions.data else 0
        
        # חישוב דיוק (דמה - נשפר בהמשך)
        accuracy = min(95, 60 + (total_businesses * 0.5))  # ככל שיש יותר עסקים, דיוק גבוה יותר
        
        stats = {
            'accuracy': round(accuracy),
            'processed': processed_count,
            'learned': total_businesses,
            'improvement': 12  # דמה לעכשיו
        }
        
        return jsonify(stats)
        
    except Exception as e:
        print(f"שגיאה בקבלת סטטיסטיקות: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ai-suggestions', methods=['GET'])
def get_ai_suggestions():
    """קבלת הצעות שיפור מ-AI"""
    try:
        if not ai:
            return jsonify({'error': 'AI לא מאותחל'}), 500
            
        # קבלת הצעות שיפור אמיתיות מה-AI
        real_suggestions = ai.get_improvement_suggestions(limit=10)
        
        # המרה לפורמט הנכון
        suggestions = []
        for idx, suggestion in enumerate(real_suggestions[:5]):  # מקסימום 5
            suggestions.append({
                'id': idx + 1,
                'business': suggestion.get('description', 'לא ידוע'),
                'current': suggestion.get('current_category', 'לא מסווג'),
                'recommended': suggestion.get('suggested_category', 'שונות'),
                'confidence': suggestion.get('confidence', 0),
                'amount': suggestion.get('avg_amount', 0),
                'transaction_count': suggestion.get('transaction_count', 1)
            })
        
        return jsonify(suggestions)
        
    except Exception as e:
        print(f"שגיאה בקבלת הצעות: {e}")
        # במקרה של שגיאה, נחזיר רשימה ריקה
        return jsonify([])

@app.route('/api/new-businesses', methods=['GET'])
def get_new_businesses():
    """קבלת עסקים חדשים לאישור"""
    try:
        # לעכשיו נחזיר רשימה ריקה - נוסיף לוגיקה אמיתית בהמשך
        return jsonify([])
        
    except Exception as e:
        print(f"שגיאה בקבלת עסקים חדשים: {e}")
        return jsonify([])

@app.route('/api/accept-suggestion', methods=['POST'])
def accept_suggestion():
    """אישור הצעת שיפור"""
    try:
        data = request.json
        description = data.get('business')
        new_category = data.get('recommended')
        
        print(f"✅ מאשר הצעה: {description} → {new_category}")
        
        # כאן נוסיף לוגיקה לעדכון בפועל
        # לעכשיו רק מחזירים הצלחה
        
        return jsonify({'success': True, 'message': f'הצעה אושרה עבור {description}'})
        
    except Exception as e:
        print(f"שגיאה באישור הצעה: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reject-suggestion', methods=['POST'])
def reject_suggestion():
    """דחיית הצעת שיפור"""
    try:
        data = request.json
        business_name = data.get('business')
        
        print(f"❌ דוחה הצעה עבור: {business_name}")
        
        return jsonify({'success': True, 'message': f'הצעה נדחתה עבור {business_name}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/approve-business', methods=['POST'])
def approve_business():
    """אישור סיווג עסק חדש"""
    try:
        data = request.json
        business_name = data.get('business')
        category = data.get('category')
        
        print(f"✅ מסווג עסק חדש: {business_name} → {category}")
        
        return jsonify({'success': True, 'message': f'עסק {business_name} סווג כ-{category}'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/retrain', methods=['POST'])
def retrain_ai():
    """אימון מחדש של ה-AI"""
    try:
        if not ai:
            return jsonify({'error': 'AI לא מאותחל'}), 500
            
        print("🚀 מתחיל אימון מחדש...")
        
        # כאן נוסיף את הלוגיקה האמיתית של אימון מחדש
        # לעכשיו רק סימולציה
        import time
        time.sleep(2)  # סימולציה של עיבוד
        
        updated_count = 23  # דמה
        
        return jsonify({
            'success': True, 
            'message': f'אימון הושלם! עודכנו {updated_count} עסקאות'
        })
        
    except Exception as e:
        print(f"שגיאה באימון מחדש: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """בדיקת תקינות השרת"""
    return jsonify({
        'status': 'healthy',
        'ai_initialized': ai is not None,
        'db_connected': db is not None
    })

@app.route('/api/training-data', methods=['GET'])
def get_training_data():
    """קבלת כל העסקים לאימון ראשוני"""
    try:
        if not db:
            return jsonify({'error': 'מסד נתונים לא מאותחל'}), 500
            
        print("📊 שולף נתוני אימון מהמסד נתונים...")
        
        # שליפת כל העסקים עם פרטים מלאים
        result = db.supabase.table('transactions').select('''
            description,
            categories (id, name, color),
            chargedamount
        ''').execute()
        
        if not result.data:
            return jsonify([])
            
        # קיבוץ לפי עסק
        business_stats = {}
        
        for transaction in result.data:
            business_name = transaction['description']
            if not business_name:
                continue
                
            if business_name not in business_stats:
                business_stats[business_name] = {
                    'business_name': business_name,
                    'category_id': transaction['categories']['id'] if transaction.get('categories') else None,
                    'category_name': transaction['categories']['name'] if transaction.get('categories') else 'לא מסווג',
                    'category_color': transaction['categories']['color'] if transaction.get('categories') else '#999',
                    'company_name': 'לא ידוע',  # נמלא בהמשך אם נצטרך
                    'transaction_count': 0,
                    'total_amount': 0,
                    'avg_amount': 0,
                    'approved': False  # סטטוס אישור
                }
            
            # עדכון סטטיסטיקות
            business_stats[business_name]['transaction_count'] += 1
            business_stats[business_name]['total_amount'] += transaction.get('chargedamount', 0)
        
        # חישוב ממוצעים ומיון
        training_data = []
        for business_name, stats in business_stats.items():
            stats['avg_amount'] = round(stats['total_amount'] / stats['transaction_count'], 2)
            training_data.append(stats)
        
        # מיון לפי כמות עסקאות (החשובים ביותר קודם)
        training_data.sort(key=lambda x: x['transaction_count'], reverse=True)
        
        print(f"✅ נמצאו {len(training_data)} עסקים לאימון")
        return jsonify(training_data)
        
    except Exception as e:
        print(f"❌ שגיאה בשליפת נתוני אימון: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/approve-business-training', methods=['POST'])
def approve_business_training():
    """אישור עסק באימון ראשוני"""
    try:
        data = request.json
        description = data.get('business_name')
        category_id = data.get('category_id')
        
        if not description or not category_id:
            return jsonify({'error': 'חסרים נתונים'}), 400
            
        print(f"✅ מאשר עסק באימון: {description} → קטגוריה {category_id}")
        
        # עדכון כל העסקאות של העסק הזה
        result = db.supabase.table('transactions').update({
            'category_id': category_id
        }).eq('description', description).execute()
        
        updated_count = len(result.data) if result.data else 0
        
        # עדכון רשימת העסקים המוכרים
        if hasattr(db, 'known_businesses_cache'):
            normalized_name = db.normalize_business_name(description)
            db.known_businesses_cache[normalized_name] = category_id
        
        return jsonify({
            'success': True, 
            'message': f'עסק {description} אושר',
            'updated_transactions': updated_count
        })
        
    except Exception as e:
        print(f"❌ שגיאה באישור עסק: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/training-status', methods=['GET'])
def get_training_status():
    """בדיקת סטטוס אימון"""
    try:
        # כאן נוסיף לוגיקה לבדיקה אם האימון הושלם
        # לעכשיו נחזיר שהאימון לא הושלם
        return jsonify({
            'training_completed': False,
            'total_businesses': 0,
            'approved_businesses': 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/complete-training', methods=['POST'])
def complete_training():
    """סיום אימון ראשוני"""
    try:
        print("🎉 מסיים אימון ראשוני...")
        
        # כאן נוסיף לוגיקה לשמירת סטטוס "אימון הושלם"
        # לעכשיו רק נחזיר הצלחה
        
        return jsonify({
            'success': True,
            'message': 'אימון ראשוני הושלם בהצלחה!'
        })
        
    except Exception as e:
        print(f"❌ שגיאה בסיום אימון: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 מפעיל שרת AI API...")
    
    if init_ai_system():
        print("🌐 שרת רץ על: http://localhost:5000")
        print("🧠 API endpoints זמינים:")
        print("  GET  /api/ai-stats")
        print("  GET  /api/ai-suggestions") 
        print("  GET  /api/new-businesses")
        print("  GET  /api/training-data")
        print("  POST /api/approve-business-training")
        print("  GET  /api/training-status")
        print("  POST /api/complete-training")
        print("  POST /api/accept-suggestion")
        print("  POST /api/reject-suggestion")
        print("  POST /api/approve-business")
        print("  POST /api/retrain")
        print("  GET  /health")
        
        app.run(debug=True, port=5000)
    else:
        print("❌ שרת לא הופעל - בעיה באתחול AI")