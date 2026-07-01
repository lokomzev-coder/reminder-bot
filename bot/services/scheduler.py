import asyncio
from datetime import datetime, timezone
from aiogram import Bot
from config import BOT_TOKEN
from database import Database
from services.reminders import ReminderScheduler

bot = Bot(token=BOT_TOKEN)

async def check_reminders():
    while True:
        try:
            pending = await Database.get_pending_reminders()
            
            for reminder in pending:
                try:
                    await send_notification(reminder)
                    
                    next_time = ReminderScheduler.calculate_next_remind(reminder)
                    
                    if next_time is None:
                        await Database.update_next_reminder(
                            reminder["id"], 
                            next_remind_at=None, 
                            is_completed=True
                        )
                    else:
                        await Database.update_next_reminder(
                            reminder["id"], 
                            next_remind_at=next_time, 
                            is_completed=False
                        )
                    
                    await Database.log_reminder_sent(reminder["id"], "sent")
                    
                except Exception as e:
                    print(f"Error processing reminder {reminder.get('id')}: {e}")
                    await Database.log_reminder_sent(reminder["id"], "failed")
        
        except Exception as e:
            print(f"Scheduler error: {e}")
        
        await asyncio.sleep(60)

async def send_notification(reminder: dict):
    try:
        deadline = reminder.get("deadline")
        deadline_str = "Не указан"
        
        if deadline:
            try:
                deadline_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                diff = deadline_dt - now
                
                if diff.total_seconds() <= 0:
                    deadline_str = "Прямо сейчас"
                else:
                    minutes = int(diff.total_seconds() / 60)
                    hours = minutes // 60
                    days = hours // 24
                    
                    if days > 0:
                        deadline_str = f"Через {days} дн"
                    elif hours > 0:
                        deadline_str = f"Через {hours} ч"
                    elif minutes > 0:
                        deadline_str = f"Через {minutes} мин"
                    else:
                        deadline_str = "Прямо сейчас"
            except:
                deadline_str = str(deadline)
        
        text = f"<b>Напоминание</b>\n\n"
        text += f"<b>{reminder['title']}</b>\n"
        
        if reminder.get("description"):
            text += f"{reminder['description']}\n"
        
        text += f"\nДедлайн: {deadline_str}"
        
        if reminder["repeat_type"] != "none":
            repeat_names = {
                "daily": "Ежедневно",
                "weekly": "Еженедельно",
                "monthly": "Ежемесячно",
                "custom": "По расписанию"
            }
            text += f"\nПовтор: {repeat_names.get(reminder['repeat_type'], reminder['repeat_type'])}"
        
        await bot.send_message(
            chat_id=reminder["user_id"],
            text=text,
            parse_mode="HTML"
        )
        
    except Exception as e:
        print(f"Error sending notification for reminder {reminder.get('id')}: {e}")
        raise