"""
config.py
הגדרות מרכזיות לכל הפרויקט - קורא מconfig.json
"""
import os
import json
from pathlib import Path

# נתיב לקובץ הגדרות
CONFIG_FILE = Path(__file__).parent.parent / "config.json"

def load_config():
    """טעינת הגדרות מconfig.json"""
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ קובץ ההגדרות לא נמצא: {CONFIG_FILE}")
        return {}
    except json.JSONDecodeError as e:
        print(f"❌ שגיאה בקריאת קובץ ההגדרות: {e}")
        return {}

# טעינת ההגדרות
_config = load_config()

# 🔗 הגדרות Supabase
SUPABASE_URL = _config.get('supabase', {}).get('url', '')
SUPABASE_SERVICE_KEY = _config.get('supabase', {}).get('service_key', '')
SUPABASE_ANON_KEY = _config.get('supabase', {}).get('anon_key', '')

# 📁 נתיבי תיקיות
EXCEL_FILES_FOLDER = _config.get('paths', {}).get('data_folder', '')

# 🌐 הגדרות אתר
WEB_PORT = _config.get('web', {}).get('port', 8000)
WEB_HOST = _config.get('web', {}).get('host', 'localhost')

# 🤖 הגדרות AI
AI_CONFIDENCE_THRESHOLD = _config.get('ai', {}).get('confidence_threshold', 0.6)
AI_SIMILARITY_THRESHOLD = _config.get('ai', {}).get('similarity_threshold', 0.8)
AI_MAX_SUGGESTIONS = _config.get('ai', {}).get('max_suggestions', 20)

# 📊 הגדרות עסקאות
DEFAULT_CURRENCY = _config.get('app', {}).get('default_currency', 'ILS')
PAGINATION_SIZE = _config.get('app', {}).get('pagination_size', 50)

# 🎨 הגדרות עיצוב
CATEGORY_COLORS = _config.get('categories', {}).get('colors', {})

# 🔧 פונקציות עזר
def get_supabase_config():
    """קבלת הגדרות Supabase"""
    return {
        'url': SUPABASE_URL,
        'service_key': SUPABASE_SERVICE_KEY,
        'anon_key': SUPABASE_ANON_KEY
    }

def get_ai_config():
    """קבלת הגדרות AI"""
    return {
        'confidence_threshold': AI_CONFIDENCE_THRESHOLD,
        'similarity_threshold': AI_SIMILARITY_THRESHOLD,
        'max_suggestions': AI_MAX_SUGGESTIONS
    }

def get_web_config():
    """קבלת הגדרות אתר"""
    return {
        'supabase_url': SUPABASE_URL,
        'supabase_anon_key': SUPABASE_ANON_KEY,
        'pagination_size': PAGINATION_SIZE
    }

def validate_config():
    """בדיקת תקינות הגדרות"""
    errors = []
    
    if not SUPABASE_URL or 'your-project' in SUPABASE_URL:
        errors.append("❌ עדכן את SUPABASE_URL בconfig.json")
    
    if not SUPABASE_SERVICE_KEY or 'your-service-role-key' in SUPABASE_SERVICE_KEY:
        errors.append("❌ עדכן את SUPABASE_SERVICE_KEY בconfig.json")
    
    if not SUPABASE_ANON_KEY or 'YOUR_ANON_KEY_HERE' in SUPABASE_ANON_KEY:
        errors.append("❌ עדכן את SUPABASE_ANON_KEY בconfig.json")
    
    if EXCEL_FILES_FOLDER and not os.path.exists(EXCEL_FILES_FOLDER):
        errors.append(f"❌ תיקיית הנתונים לא קיימת: {EXCEL_FILES_FOLDER}")
    
    if errors:
        print("🚨 בעיות בהגדרות:")
        for error in errors:
            print(f"   {error}")
        return False
    
    print("✅ כל ההגדרות תקינות")
    return True

def update_config(section: str, key: str, value):
    """עדכון ערך בקובץ ההגדרות"""
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        if section not in config:
            config[section] = {}
        
        config[section][key] = value
        
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        print(f"✅ עודכן: {section}.{key} = {value}")
        return True
        
    except Exception as e:
        print(f"❌ שגיאה בעדכון הגדרות: {e}")
        return False

if __name__ == "__main__":
    print("⚙️ בדיקת הגדרות הפרויקט")
    print("=" * 40)
    validate_config()
    
    print(f"\n📊 הגדרות נוכחיות:")
    print(f"   🔗 Supabase URL: {SUPABASE_URL}")
    print(f"   📁 תיקיית נתונים: {EXCEL_FILES_FOLDER}")
    print(f"   🌐 פורט אתר: {WEB_PORT}")
    print(f"   🤖 סף ביטחון AI: {AI_CONFIDENCE_THRESHOLD}")