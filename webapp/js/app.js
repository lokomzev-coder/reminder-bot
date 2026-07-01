const app = {
    tg: null,
    folders: [],
    tasks: [],
    stats: { total: 0, active: 0, completed: 0 },
    currentView: 'dashboard',
    currentFolder: null,

    async init() {
        this.tg = Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();
        
        this.tg.onEvent('mainButtonClicked', () => {
            this.openCreateModal();
        });
        
        this.tg.MainButton.setText('Создать задачу');
        this.tg.MainButton.show();

        document.querySelectorAll('.nav-icon[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentView = btn.dataset.view;
                UI.switchView(btn.dataset.view);
                if (btn.dataset.view === 'grid') {
                    this.tg.MainButton.show();
                } else {
                    this.tg.MainButton.hide();
                }
            });
        });

        document.getElementById('btnAddTask')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('btnAddFolder')?.addEventListener('click', () => this.createFolderPrompt());
        document.getElementById('btnCancelTask')?.addEventListener('click', () => UI.toggleModal(false));
        document.getElementById('btnSaveTask')?.addEventListener('click', () => this.saveTask());
        
        document.getElementById('modalTask')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) UI.toggleModal(false);
        });

        document.getElementById('foldersRow')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('folder-tag')) {
                document.querySelectorAll('.folder-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFolder = e.target.dataset.folder || null;
                this.loadTasks();
            }
        });

        document.getElementById('tasksFullList')?.addEventListener('click', (e) => {
            const row = e.target.closest('.task-row');
            if (row) {
                const id = row.dataset.id;
                const task = this.tasks.find(t => t.id === id);
                if (task) {
                    this.toggleTask(task);
                }
            }
        });

        const hash = window.location.hash;
        if (hash === '#tasks') {
            this.currentView = 'grid';
            UI.switchView('grid');
        } else if (hash === '#create') {
            this.openCreateModal();
        }

        await this.loadData();
    },

    async loadData() {
        await this.loadFolders();
        await this.loadTasks();
        await this.loadStats();
    },

    async loadFolders() {
        this.folders = [
            { id: '1', name: 'Работа', color: '#4A90D9', icon: 'folder', task_count: 0 },
            { id: '2', name: 'Личное', color: '#2ecc71', icon: 'folder', task_count: 0 },
            { id: '3', name: 'Учеба', color: '#f39c12', icon: 'folder', task_count: 0 }
        ];
        
        try {
            API.getFolders();
        } catch (e) {
            console.log('Using demo folders');
        }
        
        UI.renderFolderTags(this.folders, this.currentFolder);
        UI.renderFoldersGrid(this.folders);
        UI.populateFolderSelect(this.folders);
    },

    async loadTasks() {
        this.tasks = [
            { 
                id: '1', 
                title: 'Дизайн-ревью макета', 
                description: 'Проверить новый дизайн главной страницы',
                deadline: new Date(Date.now() + 7200000).toISOString(), 
                folder_name: 'Работа', 
                folder_id: '1',
                folder_color: '#4A90D9',
                repeat_type: 'none',
                is_completed: false 
            },
            { 
                id: '2', 
                title: 'Отправить отчет', 
                description: 'Еженедельный отчет руководителю',
                deadline: new Date(Date.now() - 3600000).toISOString(), 
                folder_name: 'Работа', 
                folder_id: '1',
                folder_color: '#4A90D9',
                repeat_type: 'weekly',
                is_completed: false 
            },
            { 
                id: '3', 
                title: 'Созвон с командой', 
                description: 'Ежедневный стендап',
                deadline: new Date(Date.now() + 14400000).toISOString(), 
                folder_name: 'Работа', 
                folder_id: '1',
                folder_color: '#4A90D9',
                repeat_type: 'daily',
                is_completed: false 
            },
            { 
                id: '4', 
                title: 'Обновить документацию', 
                description: 'API documentation update',
                deadline: new Date(Date.now() + 86400000).toISOString(), 
                folder_name: 'Личное', 
                folder_id: '2',
                folder_color: '#2ecc71',
                repeat_type: 'none',
                is_completed: false 
            },
            { 
                id: '5', 
                title: 'Подготовить презентацию', 
                description: 'Для встречи в пятницу',
                deadline: new Date(Date.now() + 172800000).toISOString(), 
                folder_name: 'Учеба', 
                folder_id: '3',
                folder_color: '#f39c12',
                repeat_type: 'none',
                is_completed: true 
            }
        ];

        const filtered = this.currentFolder 
            ? this.tasks.filter(t => t.folder_id === this.currentFolder)
            : this.tasks;

        UI.renderTasks(filtered);
        UI.renderCompactTasks(this.tasks.filter(t => !t.is_completed));
        
        try {
            API.getReminders(this.currentFolder);
        } catch (e) {}
    },

    async loadStats() {
        this.stats = {
            total: this.tasks.length,
            active: this.tasks.filter(t => !t.is_completed).length,
            completed: this.tasks.filter(t => t.is_completed).length
        };
        
        try {
            API.getStats();
        } catch (e) {}
    },

    openCreateModal() {
        UI.clearForm();
        UI.toggleModal(true);
        document.getElementById('inputTitle')?.focus();
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
            repeat_interval: 1,
            folder_id: document.getElementById('selectFolder').value || null
        };

        await API.createReminder(data);
        UI.toggleModal(false);
        this.tg.showAlert('Задача создана');
        
        setTimeout(async () => {
            await this.loadTasks();
            await this.loadStats();
        }, 500);
    },

    async toggleTask(task) {
        const newStatus = !task.is_completed;
        await API.toggleComplete(task.id, newStatus);
        task.is_completed = newStatus;
        UI.renderTasks(this.tasks.filter(t => 
            !this.currentFolder || t.folder_id === this.currentFolder
        ));
    },

    async createFolderPrompt() {
        this.tg.showPopup({
            title: 'Новая папка',
            message: 'Введите название папки',
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Отмена' },
                { id: 'ok', type: 'ok', text: 'Создать' }
            ]
        }, async (btnId) => {
            if (btnId === 'ok') {
                await API.createFolder('Новая папка', '#4A90D9', 'folder');
                this.tg.showAlert('Папка создана');
                await this.loadFolders();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());