const app = {
    tg: null,
    editingTaskId: null,

    init() {
        this.tg = window.Telegram?.WebApp;
        if (this.tg) { this.tg.ready(); this.tg.expand(); }

        this.applyTranslations();
        this.setupLangButton();

        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(`page-${tab.dataset.page}`).classList.add('active');
                if (tab.dataset.page === 'calendar') this.renderCalendar();
                if (tab.dataset.page === 'folders') this.renderFolders();
            });
        });

        document.getElementById('btnAddHome')?.addEventListener('click', () => this.openModal());
        document.getElementById('btnAddTask')?.addEventListener('click', () => this.openModal());
        document.getElementById('btnAddCalendar')?.addEventListener('click', () => this.openModal());

        document.querySelectorAll('.smart-list-card').forEach(card => {
            card.addEventListener('click', () => {
                const filterMap = { 'overdue': 'overdue', 'today': 'today', 'upcoming': 'week' };
                const key = Object.keys(filterMap).find(k => card.classList.contains(`${k}-card`));
                if (key) this.navigateToTasks(filterMap[key]);
            });
        });

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.renderAllTasks(chip.dataset.filter);
            });
        });

        document.getElementById('searchTasks')?.addEventListener('input', (e) => {
            this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', e.target.value);
        });

        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('btnSave')?.addEventListener('click', () => this.saveTask());
        document.getElementById('btnDelete')?.addEventListener('click', () => this.deleteTask());
        document.getElementById('addSubtask')?.addEventListener('click', () => this.addSubtaskInput());

        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('btnAddFolder')?.addEventListener('click', () => this.addFolder());

        this.calendarDate = new Date();
        this.renderHome();
        this.renderAllTasks('all');
    },

    setupLangButton() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;
        btn.textContent = i18n.current === 'ru' ? 'EN' : 'RU';
        btn.addEventListener('click', () => {
            i18n.setLang(i18n.current === 'ru' ? 'en' : 'ru');
            btn.textContent = i18n.current === 'ru' ? 'EN' : 'RU';
            this.applyTranslations();
            this.renderHome();
            this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
            if (document.getElementById('page-calendar').classList.contains('active')) this.renderCalendar();
            if (document.getElementById('page-folders').classList.contains('active')) this.renderFolders();
            this.updateModalTranslations();
        });
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = i18n.t(key);
            } else {
                el.textContent = i18n.t(key);
            }
        });
    },

    updateModalTranslations() {
        const title = document.getElementById('modalTitle');
        if (title && this.editingTaskId) title.textContent = i18n.t('editReminder');
        else if (title) title.textContent = i18n.t('newReminder');
        document.getElementById('inputTitle')?.setAttribute('placeholder', i18n.t('taskName'));
        document.getElementById('inputDescription')?.setAttribute('placeholder', i18n.t('notes'));
        document.getElementById('addSubtask')?.textContent = i18n.t('addSubtask');
        document.getElementById('btnSave')?.textContent = i18n.t('save');
        document.getElementById('btnDelete')?.textContent = i18n.t('delete');
    },

    navigateToTasks(filter) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab-item[data-page="tasks"]').classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-tasks').classList.add('active');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
        if (chip) chip.classList.add('active');
        else document.querySelector('.chip[data-filter="all"]')?.classList.add('active');
        this.renderAllTasks(filter);
    },

    renderHome() {
        const active = store.getActive();
        document.getElementById('activeCount').textContent = active.length;
        document.getElementById('overdueCount').textContent = i18n.t('tasksCount', { n: store.getOverdue().length });
        document.getElementById('todayCount').textContent = i18n.t('tasksCount', { n: store.getToday().length });
        document.getElementById('upcomingCount').textContent = i18n.t('tasksCount', { n: store.getUpcoming().length });
    },

    renderAllTasks(filter = 'all', search = '') {
        let tasks = [];
        switch (filter) {
            case 'today': tasks = store.getToday(); break;
            case 'week': tasks = store.getUpcoming().filter(t => new Date(t.deadline) - new Date() < 7*86400000); break;
            case 'overdue': tasks = store.getOverdue(); break;
            default: tasks = store.getAll();
        }
        if (search) {
            const q = search.toLowerCase();
            tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)));
        }
        const container = document.getElementById('allTasksList');
        if (!tasks.length) {
            container.innerHTML = `<p class="no-tasks-text">${i18n.t('noTasks')}</p>`;
            return;
        }
        container.innerHTML = tasks.map(t => this.taskItemHTML(t)).join('');
        this.attachTaskEvents();
    },

    taskItemHTML(t) {
        const isOverdue = t.deadline && new Date(t.deadline) < new Date() && !t.completed;
        const d = t.deadline ? new Date(t.deadline) : null;
        const dateStr = d ? d.toLocaleDateString(i18n.current === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' }) + (d.getHours() ? ` ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` : '') : i18n.t('noDeadline');
        const folderNames = { work: i18n.t('work'), personal: i18n.t('personal'), study: i18n.t('study') };
        const repeatNames = { none: i18n.t('never'), daily: i18n.t('daily'), weekly: i18n.t('weekly'), monthly: i18n.t('monthly') };

        return `
            <div class="task-item ${isOverdue ? 'overdue-item' : ''} ${t.completed ? 'completed' : ''}" data-id="${t.id}">
                <div class="task-checkbox ${t.completed ? 'checked' : ''}" data-action="toggle"></div>
                <div class="task-item-body" data-action="edit">
                    <div class="task-item-title">${this.escapeHtml(t.title)}</div>
                    ${t.notes ? `<div class="task-item-notes">${this.escapeHtml(t.notes)}</div>` : ''}
                    <div class="task-item-meta">
                        <span class="${isOverdue ? 'overdue-text' : ''}">${dateStr}</span>
                        ${t.folder ? `<span>${folderNames[t.folder] || t.folder}</span>` : ''}
                        ${t.repeat !== 'none' ? `<span>${repeatNames[t.repeat]}</span>` : ''}
                        ${t.subtasks?.length ? `<span>${t.subtasks.filter(s => typeof s === 'object' ? !s.done : true).length}/${t.subtasks.length} subtasks</span>` : ''}
                    </div>
                </div>
                <span class="priority-dot ${t.priority}"></span>
            </div>`;
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    attachTaskEvents() {
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                const id = item.dataset.id;
                if (action === 'toggle') {
                    if (this.tg) this.tg.HapticFeedback?.notificationOccurred('success');
                    store.toggle(id);
                    this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
                    this.renderHome();
                } else if (action === 'edit' || !action) {
                    this.openModal(id);
                }
            });
        });
    },

    changeMonth(delta) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + delta);
        this.renderCalendar();
    },

    renderCalendar() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        document.getElementById('monthTitle').textContent = new Date(year, month).toLocaleDateString(i18n.current === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const grid = document.getElementById('calendarGrid');
        const weekdays = document.querySelectorAll('.weekdays span');
        const dayNames = i18n.current === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        weekdays.forEach((s, i) => s.textContent = dayNames[i]);

        let html = '';
        for (let i = 0; i < startOffset; i++) html += '<div class="calendar-day other-month"></div>';
        const today = new Date();
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const hasTasks = store.getByDate(date).length > 0;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
            html += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''}" data-date="${date.toISOString()}">${d}</div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll('.calendar-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                grid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                this.selectedDate = new Date(day.dataset.date);
                this.renderDateTasks(this.selectedDate);
            });
        });
    },

    renderDateTasks(date) {
        const tasks = store.getByDate(date);
        const container = document.getElementById('selectedDateTasks');
        if (!tasks.length) {
            container.innerHTML = `<p class="no-tasks-text">${i18n.t('noTasksDate')}</p>`;
            return;
        }
        container.innerHTML = tasks.map(t => this.taskItemHTML(t)).join('');
        this.attachTaskEvents();
    },

    renderFolders() {
        const folders = [
            { id: 'work', name: i18n.t('work'), color: '#7c5ce7' },
            { id: 'personal', name: i18n.t('personal'), color: '#2ecc71' },
            { id: 'study', name: i18n.t('study'), color: '#4A90D9' }
        ];
        const allTasks = store.getAll();
        const container = document.getElementById('foldersList');
        container.innerHTML = folders.map(f => {
            const count = allTasks.filter(t => t.folder === f.id).length;
            return `<div class="folder-card" data-folder="${f.id}"><div class="folder-left"><div class="folder-color" style="background: ${f.color};"></div><span class="folder-name">${f.name}</span></div><span class="folder-count">${count}</span></div>`;
        }).join('');

        container.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', () => {
                this.navigateToTasks('all');
                document.getElementById('searchTasks').value = card.dataset.folder;
                this.renderAllTasks('all', card.dataset.folder);
            });
        });
    },

    addFolder() {
        if (this.tg) this.tg.showAlert('Folder creation will be available soon');
    },

    openModal(id = null) {
        this.editingTaskId = id;
        const modal = document.getElementById('modalOverlay');
        const deleteBtn = document.getElementById('btnDelete');
        document.getElementById('subtasksList').innerHTML = '';
        this.updateModalTranslations();

        if (id) {
            const task = store.getAll().find(t => t.id === id);
            if (task) {
                document.getElementById('modalTitle').textContent = i18n.t('editReminder');
                deleteBtn.style.display = 'block';
                document.getElementById('inputTitle').value = task.title;
                document.getElementById('inputDescription').value = task.notes || '';
                document.getElementById('inputDeadline').value = task.deadline ? task.deadline.slice(0, 16) : '';
                document.getElementById('inputFolder').value = task.folder || '';
                document.getElementById('inputRepeat').value = task.repeat || 'none';
                document.getElementById('inputRemindBefore').value = task.remindBefore || 0;
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                document.querySelector(`.priority-btn[data-priority="${task.priority}"]`)?.classList.add('active');
                if (task.subtasks) task.subtasks.forEach(s => this.addSubtaskInput(typeof s === 'object' ? s.text : s));
            }
        } else {
            document.getElementById('modalTitle').textContent = i18n.t('newReminder');
            deleteBtn.style.display = 'none';
            document.getElementById('inputTitle').value = '';
            document.getElementById('inputDescription').value = '';
            document.getElementById('inputDeadline').value = '';
            document.getElementById('inputFolder').value = '';
            document.getElementById('inputRepeat').value = 'none';
            document.getElementById('inputRemindBefore').value = '0';
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.priority-btn[data-priority="medium"]')?.classList.add('active');
        }
        modal.classList.add('active');
        document.getElementById('inputTitle').focus();
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        this.editingTaskId = null;
    },

    addSubtaskInput(value = '') {
        const container = document.getElementById('subtasksList');
        const row = document.createElement('div');
        row.className = 'subtask-row';
        row.innerHTML = `<input type="text" class="modal-input subtask-input" placeholder="Subtask" value="${this.escapeHtml(value)}"><button class="subtask-remove">x</button>`;
        row.querySelector('.subtask-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
        row.querySelector('input').focus();
    },

    getSubtasks() {
        return Array.from(document.querySelectorAll('.subtask-input')).map(i => i.value.trim()).filter(v => v);
    },

    saveTask() {
        const title = document.getElementById('inputTitle').value.trim();
        if (!title) {
            if (this.tg) this.tg.showAlert(i18n.t('enterTaskName'));
            return;
        }
        const data = {
            title,
            notes: document.getElementById('inputDescription').value.trim(),
            deadline: document.getElementById('inputDeadline').value || null,
            priority: document.querySelector('.priority-btn.active')?.dataset.priority || 'medium',
            folder: document.getElementById('inputFolder').value || null,
            repeat: document.getElementById('inputRepeat').value,
            remindBefore: parseInt(document.getElementById('inputRemindBefore').value),
            subtasks: this.getSubtasks()
        };

        if (this.editingTaskId) {
            store.update(this.editingTaskId, data);
        } else {
            store.add(data);
        }

        if (this.tg) {
            this.tg.HapticFeedback?.notificationOccurred('success');
            try {
                Telegram.WebApp.sendData(JSON.stringify({ action: 'create_reminder', ...data, lang: i18n.current }));
            } catch (e) {}
        }

        this.closeModal();
        this.renderHome();
        this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
        this.renderFolders();
    },

    deleteTask() {
        if (this.editingTaskId && confirm(i18n.t('deleteConfirm'))) {
            store.remove(this.editingTaskId);
            this.closeModal();
            this.renderHome();
            this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
            this.renderFolders();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());