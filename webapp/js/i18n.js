const i18n = {
    current: 'en',

    strings: {
        en: {
            home: 'Home',
            tasks: 'Tasks',
            calendar: 'Calendar',
            settings: 'Settings',
            folders: 'Folders',
            reminders: 'Reminders',
            active: 'active',
            overdue: 'Overdue',
            today: 'Today',
            upcoming: 'Upcoming',
            tasksCount: '{n} tasks',
            noTasks: 'No tasks found',
            noTasksDate: 'No tasks for this date',
            selectDate: 'Select a date to see tasks',
            search: 'Search tasks...',
            all: 'All',
            week: 'Week',
            newReminder: 'New Reminder',
            editReminder: 'Edit Reminder',
            taskName: 'Task name',
            notes: 'Notes',
            deadline: 'Deadline',
            priority: 'Priority',
            folder: 'Folder',
            repeat: 'Repeat',
            remindBefore: 'Remind before',
            customReminders: 'Custom reminders',
            addReminder: '+ Add reminder time',
            subtasks: 'Subtasks',
            addSubtask: '+ Add subtask',
            save: 'Save',
            delete: 'Delete',
            cancel: 'Cancel',
            never: 'Never',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            atDeadline: 'At deadline',
            min5: '5 minutes',
            min15: '15 minutes',
            min30: '30 minutes',
            hour1: '1 hour',
            day1: '1 day',
            none: 'None',
            work: 'Work',
            personal: 'Personal',
            study: 'Study',
            noDeadline: 'No deadline',
            deleteConfirm: 'Delete this task?',
            deleteFolderConfirm: 'Delete folder and remove it from all tasks?',
            enterTaskName: 'Please enter a task name',
            folderNamePrompt: 'Folder name:',
            folderRenamePrompt: 'New name:',
            addFolder: '+ Add folder',
            before: 'before',
        },
        ru: {
            home: 'Главная',
            tasks: 'Задачи',
            calendar: 'Календарь',
            settings: 'Настройки',
            folders: 'Папки',
            reminders: 'Напоминания',
            active: 'активных',
            overdue: 'Просрочено',
            today: 'Сегодня',
            upcoming: 'Предстоящие',
            tasksCount: '{n} задач',
            noTasks: 'Нет задач',
            noTasksDate: 'На эту дату нет задач',
            selectDate: 'Выберите дату',
            search: 'Поиск задач...',
            all: 'Все',
            week: 'Неделя',
            newReminder: 'Новое напоминание',
            editReminder: 'Редактировать',
            taskName: 'Название задачи',
            notes: 'Заметки',
            deadline: 'Дедлайн',
            priority: 'Приоритет',
            folder: 'Папка',
            repeat: 'Повтор',
            remindBefore: 'Напомнить за',
            customReminders: 'Напоминания',
            addReminder: '+ Добавить напоминание',
            subtasks: 'Подзадачи',
            addSubtask: '+ Добавить подзадачу',
            save: 'Сохранить',
            delete: 'Удалить',
            cancel: 'Отмена',
            never: 'Никогда',
            daily: 'Ежедневно',
            weekly: 'Еженедельно',
            monthly: 'Ежемесячно',
            atDeadline: 'В момент дедлайна',
            min5: '5 минут',
            min15: '15 минут',
            min30: '30 минут',
            hour1: '1 час',
            day1: '1 день',
            none: 'Без папки',
            work: 'Работа',
            personal: 'Личное',
            study: 'Учёба',
            noDeadline: 'Без срока',
            deleteConfirm: 'Удалить эту задачу?',
            deleteFolderConfirm: 'Удалить папку и убрать её из всех задач?',
            enterTaskName: 'Введите название задачи',
            folderNamePrompt: 'Название папки:',
            folderRenamePrompt: 'Новое название:',
            addFolder: '+ Добавить папку',
            before: 'до',
        }
    },

    t(key, params = {}) {
        let str = this.strings[this.current][key] || this.strings['en'][key] || key;
        for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, v);
        }
        return str;
    },

    setLang(lang) {
        this.current = lang;
        localStorage.setItem('reminder_lang', lang);
    },

    load() {
        const saved = localStorage.getItem('reminder_lang');
        if (saved && this.strings[saved]) {
            this.current = saved;
        } else {
            const browserLang = navigator.language?.slice(0, 2);
            this.current = browserLang === 'ru' ? 'ru' : 'en';
        }
    }
};

i18n.load();