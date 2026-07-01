from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEBAPP_URL
from database import get_or_create_user

router = Router()

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    user = await get_or_create_user(
        telegram_id=message.from_user.id,
        username=message.from_user.username or "",
        first_name=message.from_user.first_name
    )
    
    # Кнопка для открытия WebApp
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="📝 Мои напоминания",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton(
            text="➕ Создать напоминание",
            web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=create")
        )]
    ])
    
    await message.answer(
        f"👋 Привет, {message.from_user.first_name}!\n\n"
        "Я бот-напоминалка. Буду присылать тебе уведомления о задачах "
        "прямо в этот чат.\n\n"
        "🎨 Нажми на кнопку ниже, чтобы открыть красивое приложение:",
        reply_markup=keyboard
    )