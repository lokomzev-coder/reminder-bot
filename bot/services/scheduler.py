import asyncio
from datetime import datetime, timezone
from database import supabase_admin
from config import BOT_TOKEN
from aiogram import Bot

bot = Bot(token=BOT_TOKEN)

async def check_reminders():
    """Проверяет и отправляет напоминания каждую минуту"""
    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            # Находим напоминания, которые пора отправить
            reminders = supabase_admin.table("reminders")\
                .select("*")\
                .eq("is_completed", False)\
                .lte("next_remind_at", now)\
                .execute()
            
            for reminder in reminders.data:
                await send_reminder(reminder)
                await update_next_reminder(reminder)
                
        except Exception as e:
            print(f"Scheduler error: {e}")
        
        await asyncio.sleep(60)  # Проверка раз в минуту

async def send_reminder(reminder: dict):
    """Отправляет напоминание в чат"""
    try:
        deadline_str = reminder.get("deadline", "Не указан")
        text = f"⏰ *Напоминание!*\n\n"
        text += f"📌 *{reminder['title']}*\n"
        
        if reminder.get("description"):
            text += f"📝 {reminder['description']}\n"
        
        text += f"📅 Дедлайн: {deadline_str}\n"
        
        if reminder["repeat_type"] != "none":
            text += f"🔄 Повтор: {reminder['repeat_type']}\n"
        
        await bot.send_message(
            chat_id=reminder["user_id"],
            text=text,
            parse_mode="Markdown"
        )
        
        # Логируем отправку
        supabase_admin.table("reminder_logs").insert({
            "reminder_id": reminder["id"],
            "status": "sent"
        }).execute()
        
    except Exception as e:
        print(f"Error sending reminder {reminder['id']}: {e}")
        
        supabase_admin.table("reminder_logs").insert({
            "reminder_id": reminder["id"],
            "status": "failed"
        }).execute()

async def update_next_reminder(reminder: dict):
    """Обновляет время следующего напоминания с учётом повторов"""
    if reminder["repeat_type"] == "none":
        # Помечаем как выполненное
        supabase_admin.table("reminders")\
            .update({"is_completed": True})\
            .eq("id", reminder["id"])\
            .execute()
    else:
        # Логика расчёта следующей даты (упрощённая)
        from datetime import timedelta
        
        next_time = datetime.fromisoformat(reminder["next_remind_at"])
        
        if reminder["repeat_type"] == "daily":
            next_time += timedelta(days=reminder["repeat_interval"])
        elif reminder["repeat_type"] == "weekly":
            next_time += timedelta(weeks=reminder["repeat_interval"])
        elif reminder["repeat_type"] == "monthly":
            next_time += timedelta(days=30 * reminder["repeat_interval"])
        
        supabase_admin.table("reminders")\
            .update({"next_remind_at": next_time.isoformat()})\
            .eq("id", reminder["id"])\
            .execute()