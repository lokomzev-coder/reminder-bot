import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hscqeskjrffeniuobvve.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")

WEBAPP_URL = "https://lokomzev-coder.github.io/reminder-bot/webapp"