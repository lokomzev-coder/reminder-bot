from aiogram import Router, types
import json
from datetime import datetime, timedelta, timezone
from database import Database

router = Router()

@router.message(lambda message: message.web_app_data is not None)
async def handle_webapp_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")

        if action == "create_reminder":
            title = data.get("title", "").strip()
            if not title:
                await message.answer("Введите название задачи")
                return

            # Сохраняем в БД
            await Database.save_reminder(message.from_user.id, data)

            # Рассчитываем даты напоминаний
            deadline = data.get("deadline")
            remind_before = data.get("remind_before", 0)
            custom_reminders = data.get("customReminders", [])

            all_reminders = []
            if deadline:
                deadline_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))

                # Основное напоминание
                if remind_before > 0:
                    all_reminders.append(deadline_dt - timedelta(minutes=remind_before))
                else:
                    all_reminders.append(deadline_dt)

                # Кастомные напоминания
                for minutes in custom_reminders:
                    if minutes > 0:
                        all_reminders.append(deadline_dt - timedelta(minutes=minutes))

                # Сортируем и берём ближайшее
                now = datetime.now(timezone.utc)
                future = [r for r in all_reminders if r > now]
                if future:
                    next_time = min(future)
                    await Database.update_reminder(
                        reminder_id=message.from_user.id,  # На самом деле нужно получить id созданной задачи
                        data={"next_remind_at": next_time.isoformat()}
                    )

            await message.answer(f"Задача создана: <b>{title}</b>", parse_mode="HTML")

    except Exception as e:
        print(f"Error webapp: {e}")
        await message.answer("Ошибка обработки данных")