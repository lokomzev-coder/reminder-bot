import asyncio
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from config import BOT_TOKEN
from handlers import start, webapp
from services.scheduler import check_reminders

async def main():
    # Инициализация бота
    bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher()
    
    # Подключаем роутеры
    dp.include_router(start.router)
    dp.include_router(webapp.router)
    
    # Запускаем планировщик в фоне
    asyncio.create_task(check_reminders())
    
    # Запускаем бота
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())