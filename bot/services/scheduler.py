import asyncio
from datetime import datetime, timedelta, timezone
from aiogram import Bot
from config import BOT_TOKEN
from database import Database

bot = Bot(token=BOT_TOKEN)

NOTIFICATIONS = {
    'ru': {
        'title': 'Напоминание',
        'deadline_now': 'Прямо сейчас',
        'in_minutes': 'Через {n} мин',
        'in_hours': 'Через {n} ч',
        'in_days': 'Через {n} дн',
        'repeat_none': '',
        'repeat_daily': 'Ежедневно',
        'repeat_weekly': 'Еженедельно',
        'repeat_monthly': 'Ежемесячно',
        'overdue': 'ПРОСРОЧЕНО',
    },
    'en': {
        'title': 'Reminder',
        'deadline_now': 'Right now',
        'in_minutes': 'In {n} min',
        'in_hours': 'In {n} h',
        'in_days': 'In {n} d',
        'repeat_none': '',
        'repeat_daily': 'Daily',
        'repeat_weekly': 'Weekly',
        'repeat_monthly': 'Monthly',
        'overdue': 'OVERDUE',
    }
}

async def check_reminders():
    while True:
        try:
            pending = await Database.get_pending_reminders()
            for reminder in pending:
                try:
                    await send_notification(reminder)
                except Exception as e:
                    print(f"Error sending notification: {e}")
        except Exception as e:
            print(f"Scheduler error: {e}")
        await asyncio.sleep(60)


async def send_notification(reminder: dict):
    try:
        user_id = reminder["user_id"]
        lang = "ru"
        s = NOTIFICATIONS.get(lang, NOTIFICATIONS["en"])

        deadline = reminder.get("deadline")
        now = datetime.now(timezone.utc)

        deadline_str = s['deadline_now']
        if deadline:
            try:
                deadline_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                diff = deadline_dt - now
                total_minutes = int(diff.total_seconds() / 60)

                if total_minutes < 0:
                    deadline_str = s['overdue']
                elif total_minutes < 60:
                    deadline_str = s['in_minutes'].format(n=total_minutes)
                elif total_minutes < 1440:
                    deadline_str = s['in_hours'].format(n=total_minutes // 60)
                else:
                    deadline_str = s['in_days'].format(n=total_minutes // 1440)
            except:
                deadline_str = str(deadline)

        repeat_type = reminder.get("repeat_type", "none")
        repeat_str = ""
        if repeat_type != "none":
            repeat_str = s.get(f'repeat_{repeat_type}', '')

        text = f"<b>{s['title']}</b>\n\n"
        text += f"<b>{reminder['title']}</b>\n"

        if reminder.get("description"):
            text += f"{reminder['description']}\n"

        text += f"\nДедлайн: {deadline_str}"
        if repeat_str:
            text += f"\nПовтор: {repeat_str}"

        await bot.send_message(chat_id=user_id, text=text, parse_mode="HTML")
        print(f"Notification sent to {user_id}: {reminder['title']}")

        # Обновляем next_remind_at
        next_time = calculate_next_reminder_time(reminder)
        if next_time:
            await Database.update_reminder(reminder["id"], {"next_remind_at": next_time.isoformat()})
        else:
            await Database.update_reminder(reminder["id"], {"is_completed": True, "next_remind_at": None})

    except Exception as e:
        print(f"Error in send_notification: {e}")


def calculate_next_reminder_time(reminder: dict):
    from dateutil.relativedelta import relativedelta

    now = datetime.now(timezone.utc)
    remind_before = timedelta(minutes=reminder.get("remind_before", 0))
    repeat_type = reminder.get("repeat_type", "none")

    if repeat_type == "none":
        return None

    interval = reminder.get("repeat_interval", 1)
    deadline = reminder.get("deadline")

    base = now
    if deadline:
        try:
            base = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
        except:
            pass

    if repeat_type == "daily":
        next_time = base + timedelta(days=interval)
    elif repeat_type == "weekly":
        next_time = base + timedelta(weeks=interval)
    elif repeat_type == "monthly":
        next_time = base + relativedelta(months=interval)
    else:
        return None

    next_time = next_time - remind_before

    if next_time <= now:
        if repeat_type == "daily":
            next_time = now + timedelta(days=interval)
        elif repeat_type == "weekly":
            next_time = now + timedelta(weeks=interval)
        elif repeat_type == "monthly":
            next_time = now + relativedelta(months=interval)
        next_time = next_time - remind_before

    return next_time