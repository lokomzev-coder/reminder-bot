import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")

SUPABASE_URL = "https://hscqeskjrffeniuobvve.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzY3Flc2tqcmZmZW5pdW9idnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTk0MjgsImV4cCI6MjA5ODQ5NTQyOH0.-8avQQqeQ0QVZbyRHhS41ctQptXu_9_JOgtJa7uTMj0"
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

WEBAPP_URL = "https://lokomzev-coder.github.io/reminder-bot/webapp"