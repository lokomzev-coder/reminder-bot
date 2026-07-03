from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class Database:

    @staticmethod
    async def get_or_create_user(telegram_id: int, username: str = "", first_name: str = "") -> Optional[Dict]:
        try:
            user = supabase_admin.table("users").select("*").eq("telegram_id", telegram_id).execute()
            if user.data:
                return user.data[0]
            new_user = supabase_admin.table("users").insert({
                "telegram_id": telegram_id,
                "username": username,
                "first_name": first_name,
                "timezone": "Europe/Moscow"
            }).execute()
            if new_user.data:
                supabase_admin.table("folders").insert({
                    "user_id": telegram_id,
                    "name": "Общие",
                    "color": "#4A90D9",
                    "icon": "folder"
                }).execute()
            return new_user.data[0] if new_user.data else None
        except Exception as e:
            print(f"Error get_or_create_user: {e}")
            return None

    @staticmethod
    async def save_reminder(user_id: int, data: Dict) -> Optional[Dict]:
        try:
            deadline = data.get("deadline")
            remind_before = data.get("remind_before", 0)
            custom_reminders = data.get("customReminders", [])

            # Исправляем формат даты
            if deadline:
                deadline = deadline.replace(" 00:00", "+00:00").replace(" ", "T")
                if "T" in deadline and "+" not in deadline and "Z" not in deadline:
                    deadline += "+00:00"

            next_remind_at = None
            if deadline:
                try:
                    deadline_dt = datetime.fromisoformat(deadline)
                    now = datetime.now(timezone.utc)

                    all_times = []
                    if remind_before > 0:
                        all_times.append(deadline_dt - timedelta(minutes=remind_before))
                    else:
                        all_times.append(deadline_dt)

                    for mins in custom_reminders:
                        if mins > 0:
                            all_times.append(deadline_dt - timedelta(minutes=mins))

                    future = [t for t in all_times if t > now]
                    if future:
                        next_remind_at = min(future).isoformat()
                except Exception as e:
                    print(f"Error calculating next_remind_at: {e}")

            reminder = supabase_admin.table("reminders").insert({
                "user_id": user_id,
                "folder_id": data.get("folder"),
                "title": data["title"],
                "description": data.get("notes", ""),
                "deadline": deadline,
                "remind_before": remind_before,
                "repeat_type": data.get("repeat", "none"),
                "repeat_interval": 1,
                "is_completed": False,
                "next_remind_at": next_remind_at
            }).execute()

            return reminder.data[0] if reminder.data else None
        except Exception as e:
            print(f"Error save_reminder: {e}")
            return None

    @staticmethod
    async def get_stats(user_id: int) -> Dict:
        try:
            total = supabase_admin.table("reminders").select("id", count="exact").eq("user_id", user_id).execute()
            completed = supabase_admin.table("reminders").select("id", count="exact").eq("user_id", user_id).eq("is_completed", True).execute()
            active = supabase_admin.table("reminders").select("id", count="exact").eq("user_id", user_id).eq("is_completed", False).execute()
            return {"total": total.count or 0, "completed": completed.count or 0, "active": active.count or 0}
        except:
            return {"total": 0, "completed": 0, "active": 0}