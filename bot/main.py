import asyncio
import sys
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from config import BOT_TOKEN
from handlers import start, webapp
from services.scheduler import check_reminders

async def main():
    if not BOT_TOKEN:
        print("Error: BOT_TOKEN not set")
        sys.exit(1)
    
    bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
    dp = Dispatcher()
    
    dp.include_router(start.router)
    dp.include_router(webapp.router)
    
    asyncio.create_task(check_reminders())
    
    print("Bot started!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())