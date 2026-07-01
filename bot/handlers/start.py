from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEBAPP_URL
from database import Database

router = Router()

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    user = await Database.get_or_create_user(
        telegram_id=message.from_user.id,
        username=message.from_user.username or "",
        first_name=message.from_user.first_name or ""
    )
    
    if not user:
        await message.answer("Произошла ошибка при регистрации. Попробуйте позже.")
        return
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton(
            text="Мои задачи",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}#tasks")
        )],
        [InlineKeyboardButton(
            text="Создать задачу",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}#create")
        )]
    ])
    
    await message.answer(
        f"<b>Reminder Bot</b>\n\n"
        f"Создавайте задачи и получайте уведомления в этот чат.\n\n"
        f"• Гибкие настройки напоминаний\n"
        f"• Повторяющиеся задачи\n"
        f"• Папки для организации\n"
        f"• Статистика продуктивности\n\n"
        f"Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "<b>Помощь</b>\n\n"
        "<b>Основные команды:</b>\n"
        "/start - Главное меню\n"
        "/help - Это сообщение\n"
        "/stats - Статистика\n\n"
        "<b>Как использовать:</b>\n"
        "1. Нажмите «Открыть приложение»\n"
        "2. Создайте задачу\n"
        "3. Настройте дедлайн и повтор\n"
        "4. Бот пришлёт уведомление в нужное время",
        parse_mode="HTML"
    )

@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    stats = await Database.get_stats(message.from_user.id)
    
    text = "<b>Ваша статистика</b>\n\n"
    text += f"Всего задач: {stats['total']}\n"
    text += f"Активных: {stats['active']}\n"
    text += f"Выполнено: {stats['completed']}\n"
    
    if stats['total'] > 0:
        completion_rate = int((stats['completed'] / stats['total']) * 100)
        text += f"Процент выполнения: {completion_rate}%\n"
    
    await message.answer(text, parse_mode="HTML")