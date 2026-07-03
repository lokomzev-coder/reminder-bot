from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEBAPP_URL
from database import Database

router = Router()

STRINGS = {
    'ru': {
        'start': '<b>Reminder Bot</b>\n\nСоздавайте задачи и получайте уведомления в этот чат.\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        'help': '<b>Помощь</b>\n\n/start — Главное меню\n/help — Помощь\n/stats — Статистика',
        'stats': '<b>Статистика</b>\n\nВсего задач: {total}\nАктивных: {active}\nВыполнено: {completed}\nПроцент: {rate}%',
        'open': 'Открыть приложение',
    },
    'en': {
        'start': '<b>Reminder Bot</b>\n\nCreate tasks and receive notifications in this chat.\n\nPress the button below to open the app:',
        'help': '<b>Help</b>\n\n/start — Main menu\n/help — Help\n/stats — Statistics',
        'stats': '<b>Statistics</b>\n\nTotal: {total}\nActive: {active}\nCompleted: {completed}\nRate: {rate}%',
        'open': 'Open app',
    }
}

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    await Database.get_or_create_user(message.from_user.id, message.from_user.username or "", message.from_user.first_name or "")
    s = STRINGS['ru']
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=s['open'], web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    await message.answer(s['start'], reply_markup=keyboard, parse_mode="HTML")

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(STRINGS['ru']['help'], parse_mode="HTML")

@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    stats = await Database.get_stats(message.from_user.id)
    rate = int((stats['completed'] / stats['total']) * 100) if stats['total'] > 0 else 0
    await message.answer(STRINGS['ru']['stats'].format(total=stats['total'], active=stats['active'], completed=stats['completed'], rate=rate), parse_mode="HTML")