const API = {
    // Получить список папок
    async getFolders() {
        // Через Telegram WebApp отправляем данные
        return new Promise((resolve) => {
            Telegram.WebApp.sendData(JSON.stringify({
                action: 'get_folders'
            }));
            resolve([]);
        });
    },

    // Создать напоминание
    async createReminder(data) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'create_reminder',
            ...data
        }));
    },

    // Получить список напоминаний
    async getReminders(folderId = null) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'get_reminders',
            folder_id: folderId
        }));
    },

    // Выполнить/снять выполнение задачи
    async toggleComplete(reminderId, completed) {
        Telegram.WebApp.sendData(JSON.stringify({
            action: 'toggle_complete',
            reminder_id: reminderId,
            is_completed: completed
        }));
    }
};