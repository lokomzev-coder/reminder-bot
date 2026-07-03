from aiogram import Router, types
import json
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

            reminder = await Database.save_reminder(message.from_user.id, data)

            if reminder:
                await message.answer(f"Задача создана: <b>{title}</b>")
            else:
                await message.answer("Ошибка при создании задачи")

    except Exception as e:
        print(f"Error webapp: {e}")
        await message.answer("Ошибка обработки данных")