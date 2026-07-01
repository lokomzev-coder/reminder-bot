from aiogram import Router, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import json
from config import WEBAPP_URL
from database import supabase_admin

router = Router()

@router.message(lambda message: message.web_app_data is not None)
async def handle_webapp_data(message: types.Message):
    """Обрабатывает данные, присланные из WebApp"""
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")
        
        if action == "create_reminder":
            await create_reminder(message.from_user.id, data)
        elif action == "get_reminders":
            await send_reminders_list(message.from_user.id, message)
            
    except Exception as e:
        await message.answer(f"❌ Ошибка: {str(e)}")

async def create_reminder(user_id: int, data: dict):
    """Создаёт напоминание в БД"""
    reminder = supabase_admin.table("reminders").insert({
        "user_id": user_id,
        "folder_id": data.get("folder_id"),
        "title": data["title"],
        "description": data.get("description", ""),
        "deadline": data.get("deadline"),
        "remind_before": data.get("remind_before", 0),
        "repeat_type": data.get("repeat_type", "none"),
        "repeat_interval": data.get("repeat_interval", 1),
        "repeat_days": data.get("repeat_days", []),
        "next_remind_at": data.get("deadline")  # Первое напоминание = дедлайн
    }).execute()
    
    return reminder.data[0] if reminder.data else None

async def send_reminders_list(user_id: int, message: types.Message):
    """Отправляет список напоминаний"""
    reminders = supabase_admin.table("reminders")\
        .select("*, folders(name, color, icon)")\
        .eq("user_id", user_id)\
        .eq("is_completed", False)\
        .order("deadline")\
        .execute()
    
    if not reminders.data:
        await message.answer("У вас пока нет активных напоминаний ✨")
        return
    
    text = "📋 *Ваши напоминания:*\n\n"
    for r in reminders.data:
        deadline = r.get("deadline", "Без срока")
        folder_name = r.get("folders", {}).get("name", "Без папки") if r.get("folders") else "Без папки"
        text += f"• *{r['title']}*\n"
        text += f"  📁 {folder_name} | ⏰ {deadline}\n\n"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="📝 Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ])
    
    await message.answer(text, parse_mode="Markdown", reply_markup=keyboard)