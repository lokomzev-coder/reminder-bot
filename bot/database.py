from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class Database:
    @staticmethod
    async def get_or_create_user(telegram_id: int, username: str, first_name: str) -> Optional[Dict]:
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
            print(f"Error in get_or_create_user: {e}")
            return None

    @staticmethod
    async def create_reminder(user_id: int, data: Dict) -> Optional[Dict]:
        try:
            deadline = data.get("deadline")
            remind_before_minutes = data.get("remind_before", 0)
            
            next_remind_at = None
            if deadline:
                from datetime import timedelta
                deadline_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                next_remind_at = deadline_dt - timedelta(minutes=remind_before_minutes)
                next_remind_at = next_remind_at.isoformat()
            
            reminder = supabase_admin.table("reminders").insert({
                "user_id": user_id,
                "folder_id": data.get("folder_id"),
                "title": data["title"],
                "description": data.get("description", ""),
                "deadline": deadline,
                "remind_before": remind_before_minutes,
                "repeat_type": data.get("repeat_type", "none"),
                "repeat_interval": data.get("repeat_interval", 1),
                "repeat_days": data.get("repeat_days", []),
                "next_remind_at": next_remind_at,
                "is_completed": False
            }).execute()
            
            return reminder.data[0] if reminder.data else None
        except Exception as e:
            print(f"Error creating reminder: {e}")
            return None

    @staticmethod
    async def get_reminders(user_id: int, folder_id: Optional[str] = None, include_completed: bool = False) -> List[Dict]:
        try:
            query = supabase_admin.table("reminders")\
                .select("*, folders(name, color, icon)")\
                .eq("user_id", user_id)
            
            if not include_completed:
                query = query.eq("is_completed", False)
            
            if folder_id:
                query = query.eq("folder_id", folder_id)
            
            result = query.order("deadline", ascending=True).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting reminders: {e}")
            return []

    @staticmethod
    async def get_folders(user_id: int) -> List[Dict]:
        try:
            result = supabase_admin.table("folders")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", ascending=True)\
                .execute()
            
            folders = result.data if result.data else []
            
            for folder in folders:
                count = supabase_admin.table("reminders")\
                    .select("id", count="exact")\
                    .eq("folder_id", folder["id"])\
                    .eq("is_completed", False)\
                    .execute()
                folder["task_count"] = count.count if count.count else 0
            
            return folders
        except Exception as e:
            print(f"Error getting folders: {e}")
            return []

    @staticmethod
    async def create_folder(user_id: int, name: str, color: str = "#4A90D9", icon: str = "folder") -> Optional[Dict]:
        try:
            result = supabase_admin.table("folders").insert({
                "user_id": user_id,
                "name": name,
                "color": color,
                "icon": icon
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating folder: {e}")
            return None

    @staticmethod
    async def toggle_reminder(reminder_id: str, is_completed: bool) -> bool:
        try:
            supabase_admin.table("reminders")\
                .update({"is_completed": is_completed})\
                .eq("id", reminder_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error toggling reminder: {e}")
            return False

    @staticmethod
    async def get_pending_reminders() -> List[Dict]:
        try:
            now = datetime.now(timezone.utc).isoformat()
            result = supabase_admin.table("reminders")\
                .select("*")\
                .eq("is_completed", False)\
                .lte("next_remind_at", now)\
                .not_.is_("next_remind_at", "null")\
                .execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting pending reminders: {e}")
            return []

    @staticmethod
    async def update_next_reminder(reminder_id: str, next_remind_at: Optional[str], is_completed: bool = False):
        try:
            data = {"is_completed": is_completed}
            if next_remind_at:
                data["next_remind_at"] = next_remind_at
            supabase_admin.table("reminders")\
                .update(data)\
                .eq("id", reminder_id)\
                .execute()
        except Exception as e:
            print(f"Error updating next reminder: {e}")

    @staticmethod
    async def log_reminder_sent(reminder_id: str, status: str = "sent"):
        try:
            supabase_admin.table("reminder_logs").insert({
                "reminder_id": reminder_id,
                "status": status
            }).execute()
        except Exception as e:
            print(f"Error logging reminder: {e}")

    @staticmethod
    async def get_stats(user_id: int) -> Dict:
        try:
            total = supabase_admin.table("reminders")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .execute()
            
            completed = supabase_admin.table("reminders")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("is_completed", True)\
                .execute()
            
            active = supabase_admin.table("reminders")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("is_completed", False)\
                .execute()
            
            return {
                "total": total.count if total.count else 0,
                "completed": completed.count if completed.count else 0,
                "active": active.count if active.count else 0
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {"total": 0, "completed": 0, "active": 0}