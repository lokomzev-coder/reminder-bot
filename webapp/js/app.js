const app = {
    tg: null,
    currentFolder: null,
    folders: [],

    async init() {
        // Инициализация Telegram WebApp
        this.tg = Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();
        
        // Устанавливаем цвета темы
        document.documentElement.style.setProperty('--bg', this.tg.themeParams.bg_color || '#0f0f0f');
        document.documentElement.style.setProperty('--text', this.tg.themeParams.text_color || '#ffffff');
        
        // Обработчики кнопок
        document.getElementById('btnAdd').addEventListener('click', () => this.openCreateModal());
        document.getElementById('btnCreateFirst').addEventListener('click', () => this.openCreateModal());
        document.getElementById('btnCancel').addEventListener('click', () => UI.toggleModal(false));
        document.getElementById('btnSave').addEventListener('click', () => this.saveReminder());
        
        // Закрытие модалки по клику вне
        document.getElementById('modalCreate').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) UI.toggleModal(false);
        });

        // Загружаем данные
        await this.loadFolders();
        await this.loadTasks();
    },

    async loadFolders() {
        // TODO: Загрузить из БД через бота
        this.folders = [
            { id: '1', name: 'Работа', color: '#e74c3c', icon: '💼' },
            { id: '2', name: 'Личное', color: '#2ecc71', icon: '🏠' },
            { id: '3', name: 'Учёба', color: '#f39c12', icon: '📚' }
        ];
        UI.renderFolders(this.folders);
        this.populateFolderSelect();
    },

    async loadTasks(folderId = null) {
        // TODO: Загрузить из БД
        const tasks = [
            {
                id: '1',
                title: 'Сходить в магазин',
                deadline: new Date(Date.now() + 3600000).toISOString(),
                folder_name: 'Личное',
                folder_color: '#2ecc71',
                folder_icon: '🏠',
                is_completed: false
            }
        ];
        UI.renderTasks(tasks);
    },

    populateFolderSelect() {
        const select = document.getElementById('selectFolder');
        select.innerHTML = '<option value="">Без папки</option>';
        this.folders.forEach(f => {
            select.innerHTML += `<option value="${f.id}">${f.icon} ${f.name}</option>`;
        });
    },

    openCreateModal() {
        UI.clearForm();
        UI.toggleModal(true);
    },

    async saveReminder() {
        const title = document.getElementById('inputTitle').value.trim();
        if (!title) {
            this.tg.showAlert('Введите название задачи');
            return;
        }

        const data = {
            title: title,
            description: document.getElementById('inputDescription').value.trim(),
            deadline: document.getElementById('inputDeadline').value || null,
            remind_before: parseInt(document.getElementById('selectRemindBefore').value),
            repeat_type: document.getElementById('selectRepeat').value,
            folder_id: document.getElementById('selectFolder').value || null
        };

        await API.createReminder(data);
        UI.toggleModal(false);
        this.tg.showAlert('✅ Напоминание создано!');
        
        // Обновляем список
        setTimeout(() => this.loadTasks(), 500);
    },

    async toggleTask(id, completed) {
        await API.toggleComplete(id, completed);
        this.loadTasks();
    }
};

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => app.init());