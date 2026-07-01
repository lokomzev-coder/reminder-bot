const API = {
    async createReminder(data) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'create_reminder',
            ...data
        }));
    },

    async getReminders(folderId = null) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'get_reminders',
            folder_id: folderId
        }));
    },

    async getFolders() {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'get_folders'
        }));
    },

    async createFolder(name, color, icon) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'create_folder',
            name: name,
            color: color,
            icon: icon
        }));
    },

    async toggleComplete(reminderId, isCompleted) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'toggle_complete',
            reminder_id: reminderId,
            is_completed: isCompleted
        }));
    },

    async getStats() {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'get_stats'
        }));
    },

    async deleteReminder(reminderId) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'delete_reminder',
            reminder_id: reminderId
        }));
    }
};