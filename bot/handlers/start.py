from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEBAPP_URL
from database import Database

router = Router()

STRINGS = {
    'en': {
        'start': '<b>Reminder Bot</b>\n\nCreate tasks and receive notifications in this chat.\n\n• Flexible reminder settings\n• Recurring tasks\n• Folders for organization\n• Productivity statistics\n\nPress the button below to open the app:',
        'help': '<b>Help</b>\n\n<b>Commands:</b>\n/start — Main menu\n/help — This message\n/stats — Statistics\n\n<b>How to use:</b>\n1. Press «Open app»\n2. Create a task\n3. Set deadline and repeat\n4. Bot will send a notification on time',
        'stats': '<b>Your Statistics</b>\n\nTotal tasks: {total}\nActive: {active}\nCompleted: {completed}\nCompletion rate: {rate}%',
        'open_app': 'Open app',
        'my_tasks': 'My tasks',
        'create_task': 'Create task',
    },
    'ru': {
        'start': '<b>Reminder Bot</b>\n\nСоздавайте задачи и получайте уведомления в этот чат.\n\n• Гибкие настройки напоминаний\n• Повторяющиеся задачи\n• Папки для организации\n• Статистика продуктивности\n\nНажмите кнопку ниже, чтобы открыть приложение:',
        'help': '<b>Помощь</b>\n\n<b>Команды:</b>\n/start — Главное меню\n/help — Это сообщение\n/stats — Статистика\n\n<b>Как использовать:</b>\n1. Нажмите «Открыть приложение»\n2. Создайте задачу\n3. Настройте дедлайн и повтор\n4. Бот пришлёт уведомление вовремя',
        'stats': '<b>Ваша статистика</b>\n\nВсего задач: {total}\nАктивных: {active}\nВыполнено: {completed}\nПроцент выполнения: {rate}%',
        'open_app': 'Открыть приложение',
        'my_tasks': 'Мои задачи',
        'create_task': 'Создать задачу',
    }
}

NOTIFICATION_STRINGS = {
    'en': {
        'title': 'Reminder',
        'deadline_now': 'Right now',
        'deadline_minutes': '{n} min',
        'deadline_hours': '{n} h',
        'deadline_days': '{n} d',
        'repeat_daily': 'Daily',
        'repeat_weekly': 'Weekly',
        'repeat_monthly': 'Monthly',
    },
    'ru': {
        'title': 'Напоминание',
        'deadline_now': 'Прямо сейчас',
        'deadline_minutes': '{n} мин',
        'deadline_hours': '{n} ч',
        'deadline_days': '{n} дн',
        'repeat_daily': 'Ежедневно',
        'repeat_weekly': 'Еженедельно',
        'repeat_monthly': 'Ежемесячно',
    }
}

def get_lang(user_id: int) -> str:
    # TODO: хранить язык пользователя в БД
    return 'en'

@router.message(Command("start"))
async def cmd_start(message: types.Message):
    lang = get_lang(message.from_user.id)
    s = STRINGS.get(lang, STRINGS['en'])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=s['open_app'], web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text=s['my_tasks'], web_app=WebAppInfo(url=f"{WEBAPP_URL}#tasks"))],
        [InlineKeyboardButton(text=s['create_task'], web_app=WebAppInfo(url=f"{WEBAPP_URL}#create"))]
    ])
    
    await message.answer(s['start'], reply_markup=keyboard, parse_mode="HTML")

@router.message(Command("help"))
async def cmd_help(message: types.Message):
    lang = get_lang(message.from_user.id)
    s = STRINGS.get(lang, STRINGS['en'])
    await message.answer(s['help'], parse_mode="HTML")

@router.message(Command("stats"))
async def cmd_stats(message: types.Message):
    lang = get_lang(message.from_user.id)
    s = STRINGS.get(lang, STRINGS['en'])
    stats = await Database.get_stats(message.from_user.id)
    rate = int((stats['completed'] / stats['total']) * 100) if stats['total'] > 0 else 0
    await message.answer(s['stats'].format(total=stats['total'], active=stats['active'], completed=stats['completed'], rate=rate), parse_mode="HTML")