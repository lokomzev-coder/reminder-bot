from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEBAPP_URL
from database import Database

router = Router()

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await Database.get_or_create_user(
        message.from_user.id,
        message.from_user.username or "",
        message.from_user.first_name or ""
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть приложение",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ])
    
    await message.answer(
        "<b>Reminder Bot</b>\n\n"
        "Создавайте задачи и получайте уведомления в этот чат.\n\n"
        "Нажмите кнопку ниже, чтобы открыть приложение:",
        reply_markup=keyboard
    )

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "<b>Помощь</b>\n\n"
        "/start — Главное меню\n"
        "/help — Помощь\n"
        "/stats — Статистика"
    )

@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    stats = await Database.get_stats(message.from_user.id)
    rate = int((stats['completed'] / stats['total']) * 100) if stats['total'] > 0 else 0
    await message.answer(
        f"<b>Статистика</b>\n\n"
        f"Всего задач: {stats['total']}\n"
        f"Активных: {stats['active']}\n"
        f"Выполнено: {stats['completed']}\n"
        f"Процент: {rate}%"
    )