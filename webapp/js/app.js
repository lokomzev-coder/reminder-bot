const app = {
    tg: null,
    folders: [],
    tasks: [],
    currentView: 'dashboard',

    async init() {
        this.tg = Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();

        // Навигация
        document.querySelectorAll('.nav-icon[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentView = btn.dataset.view;
                UI.switchView(btn.dataset.view);
            });
        });

        // Кнопки создания
        document.getElementById('btnAddTask')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('btnAddFolder')?.addEventListener('click', () => this.tg.showAlert('Создание папок — в разработке'));

        // Модальное окно
        document.getElementById('btnCancelTask')?.addEventListener('click', () => UI.toggleModal(false));
        document.getElementById('btnSaveTask')?.addEventListener('click', () => this.saveTask());
        document.getElementById('modalTask')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) UI.toggleModal(false);
        });

        // Клик по тегам папок (делегирование)
        document.getElementById('foldersRow')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('folder-tag')) {
                document.querySelectorAll('.folder-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.loadTasks(e.target.dataset.folder || null);
            }
        });

        await this.loadFolders();
        await this.loadTasks();
    },

    async loadFolders() {
        // TODO: Загрузить из БД
        this.folders = [
            { id: '1', name: 'Работа', task_count: 8 },
            { id: '2', name: 'Личное', task_count: 5 },
            { id: '3', name: 'Учеба', task_count: 3 }
        ];
        UI.renderFolderTags(this.folders);
        UI.renderFoldersGrid(this.folders);
        UI.populateFolderSelect(this.folders);
    },

    async loadTasks(folderId = null) {
        // TODO: Загрузить из БД
        this.tasks = [
            { id: '1', title: 'Дизайн-ревью макета', deadline: new Date(Date.now() + 7200000).toISOString(), folder_name: 'Работа', is_completed: false },
            { id: '2', title: 'Отправить отчет', deadline: new Date(Date.now() - 3600000).toISOString(), folder_name: 'Работа', is_completed: false },
            { id: '3', title: 'Созвон с командой', deadline: new Date(Date.now() + 14400000).toISOString(), folder_name: 'Работа', is_completed: false },
            { id: '4', title: 'Обновить документацию', deadline: new Date(Date.now() + 86400000).toISOString(), folder_name: 'Личное', is_completed: false }
        ];

        const filtered = folderId ? this.tasks.filter(t => t.folder_id === folderId) : this.tasks;
        UI.renderTasks(filtered);
        UI.renderCompactTasks(this.tasks);
    },

    openCreateModal() {
        UI.clearForm();
        UI.toggleModal(true);
    },

    async saveTask() {
        const title = document.getElementById('inputTitle').value.trim();
        if (!title) {
            this.tg.showAlert('Введите название задачи');
            return;
        }
        const data = {
            title,
            description: document.getElementById('inputDescription').value.trim(),
            deadline: document.getElementById('inputDeadline').value || null,
            remind_before: parseInt(document.getElementById('selectRemindBefore').value),
            repeat_type: document.getElementById('selectRepeat').value,
            folder_id: document.getElementById('selectFolder').value || null
        };
        await API.createReminder(data);
        UI.toggleModal(false);
        this.tg.showAlert('Задача создана');
        setTimeout(() => this.loadTasks(), 400);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());