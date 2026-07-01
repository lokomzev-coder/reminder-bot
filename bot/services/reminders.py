from datetime import datetime, timedelta, timezone
from typing import Optional
from dateutil.relativedelta import relativedelta

class ReminderScheduler:
    @staticmethod
    def calculate_next_remind(reminder: dict) -> Optional[str]:
        repeat_type = reminder.get("repeat_type", "none")
        
        if repeat_type == "none":
            return None
        
        now = datetime.now(timezone.utc)
        deadline = reminder.get("deadline")
        next_remind = reminder.get("next_remind_at")
        
        base_time = None
        if next_remind:
            base_time = datetime.fromisoformat(next_remind.replace("Z", "+00:00"))
        elif deadline:
            base_time = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
        else:
            base_time = now
        
        remind_before = timedelta(minutes=reminder.get("remind_before", 0))
        interval = reminder.get("repeat_interval", 1)
        
        if repeat_type == "daily":
            next_time = base_time + timedelta(days=interval)
        elif repeat_type == "weekly":
            next_time = base_time + timedelta(weeks=interval)
        elif repeat_type == "monthly":
            next_time = base_time + relativedelta(months=interval)
        elif repeat_type == "custom":
            repeat_days = reminder.get("repeat_days", [])
            if repeat_days:
                current_weekday = base_time.weekday() + 1
                future_days = [d for d in repeat_days if d > current_weekday]
                if future_days:
                    days_until = min(future_days) - current_weekday
                else:
                    days_until = 7 - current_weekday + min(repeat_days)
                next_time = base_time + timedelta(days=days_until)
            else:
                next_time = base_time + timedelta(days=interval)
        else:
            return None
        
        next_time = next_time - remind_before
        
        if next_time <= now:
            if repeat_type == "daily":
                next_time = now + timedelta(days=interval) - remind_before
            elif repeat_type == "weekly":
                next_time = now + timedelta(weeks=interval) - remind_before
            elif repeat_type == "monthly":
                next_time = now + relativedelta(months=interval) - remind_before
            else:
                next_time = now + timedelta(hours=1)
        
        return next_time.isoformat()