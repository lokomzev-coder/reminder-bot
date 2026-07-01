from aiogram import Router, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import json
from config import WEBAPP_URL
from database import Database

router = Router()

@router.message(lambda message: message.web_app_data is not None)
async def handle_webapp_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        action = data.get("action")
        
        if action == "create_reminder":
            await handle_create_reminder(message, data)
        elif action == "get_reminders":
            await handle_get_reminders(message, data)
        elif action == "get_folders":
            await handle_get_folders(message)
        elif action == "create_folder":
            await handle_create_folder(message, data)
        elif action == "toggle_complete":
            await handle_toggle_complete(message, data)
        elif action == "get_stats":
            await handle_get_stats(message)
        elif action == "delete_reminder":
            await handle_delete_reminder(message, data)
        else:
            await message.answer("Неизвестное действие")
            
    except Exception as e:
        await message.answer(f"Ошибка обработки данных: {str(e)}")

async def handle_create_reminder(message: types.Message, data: dict):
    title = data.get("title", "").strip()
    if not title:
        await message.answer("Название задачи не может быть пустым")
        return
    
    reminder = await Database.create_reminder(message.from_user.id, data)
    
    if reminder:
        await message.answer(
            f"Задача создана: <b>{title}</b>",
            parse_mode="HTML"
        )
    else:
        await message.answer("Не удалось создать задачу")

async def handle_get_reminders(message: types.Message, data: dict):
    folder_id = data.get("folder_id")
    reminders = await Database.get_reminders(message.from_user.id, folder_id)
    
    if not reminders:
        await message.answer("У вас пока нет задач")
        return
    
    text = "<b>Ваши задачи:</b>\n\n"
    for i, r in enumerate(reminders[:10], 1):
        deadline = r.get("deadline", "Без срока")
        if deadline and isinstance(deadline, str):
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                deadline = dt.strftime("%d.%m.%Y %H:%M")
            except:
                pass
        
        folder_name = "Без папки"
        if r.get("folders"):
            folder_name = r["folders"]["name"]
        
        text += f"{i}. <b>{r['title']}</b>\n"
        text += f"   Папка: {folder_name} | Срок: {deadline}\n\n"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть все задачи",
            web_app=WebAppInfo(url=WEBAPP_URL + "#tasks")
        )]
    ])
    
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")

async def handle_get_folders(message: types.Message):
    folders = await Database.get_folders(message.from_user.id)
    await message.answer(json.dumps({"folders": folders}))

async def handle_create_folder(message: types.Message, data: dict):
    name = data.get("name", "").strip()
    if not name:
        await message.answer("Название папки не может быть пустым")
        return
    
    folder = await Database.create_folder(
        user_id=message.from_user.id,
        name=name,
        color=data.get("color", "#4A90D9"),
        icon=data.get("icon", "folder")
    )
    
    if folder:
        await message.answer(f"Папка создана: <b>{name}</b>", parse_mode="HTML")
    else:
        await message.answer("Не удалось создать папку")

async def handle_toggle_complete(message: types.Message, data: dict):
    reminder_id = data.get("reminder_id")
    is_completed = data.get("is_completed", False)
    
    success = await Database.toggle_reminder(reminder_id, is_completed)
    if success:
        status = "выполнена" if is_completed else "возвращена в активные"
        await message.answer(f"Задача отмечена как {status}")
    else:
        await message.answer("Не удалось обновить задачу")

async def handle_get_stats(message: types.Message):
    stats = await Database.get_stats(message.from_user.id)
    await message.answer(json.dumps(stats))

async def handle_delete_reminder(message: types.Message, data: dict):
    reminder_id = data.get("reminder_id")
    await Database.toggle_reminder(reminder_id, True)
    await message.answer("Задача удалена")