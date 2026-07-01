from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

# Клиент для запросов от имени пользователя (с RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Админ-клиент для серверных операций (обходит RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def get_or_create_user(telegram_id: int, username: str, first_name: str):
    """Создаёт или возвращает пользователя"""
    try:
        # Пробуем найти
        user = supabase_admin.table("users").select("*").eq("telegram_id", telegram_id).execute()
        if user.data:
            return user.data[0]
        
        # Создаём нового
        new_user = supabase_admin.table("users").insert({
            "telegram_id": telegram_id,
            "username": username,
            "first_name": first_name
        }).execute()
        
        # Создаём дефолтную папку
        supabase_admin.table("folders").insert({
            "user_id": telegram_id,
            "name": "Общие",
            "color": "#4A90D9",
            "icon": "📌"
        }).execute()
        
        return new_user.data[0]
    except Exception as e:
        print(f"Error in get_or_create_user: {e}")
        return None