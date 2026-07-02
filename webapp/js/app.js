const app = {
    tg: null,
    editingTaskId: null,

    init() {
        this.tg = window.Telegram?.WebApp;
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            this.tg.setHeaderColor('#0d0d1a');
            this.tg.setBackgroundColor('#0d0d1a');
            this.tg.MainButton.hide();
        }

        this.applyTranslations();
        this.setupLangButton();

        // Tabs
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
                this.switchTab(tab.dataset.page);
            });
            tab.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
                this.switchTab(tab.dataset.page);
            });
        });

        // Add buttons
        document.getElementById('btnAddHome')?.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        document.getElementById('btnAddHome')?.addEventListener('touchend', (e) => { e.preventDefault(); this.openModal(); });
        document.getElementById('btnAddTask')?.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        document.getElementById('btnAddTask')?.addEventListener('touchend', (e) => { e.preventDefault(); this.openModal(); });
        document.getElementById('btnAddCalendar')?.addEventListener('click', (e) => { e.preventDefault(); this.openModal(); });
        document.getElementById('btnAddCalendar')?.addEventListener('touchend', (e) => { e.preventDefault(); this.openModal(); });

        // Smart lists
        document.querySelectorAll('.smart-list-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const filterMap = { 'overdue': 'overdue', 'today': 'today', 'upcoming': 'week' };
                const key = Object.keys(filterMap).find(k => card.classList.contains(`${k}-card`));
                if (key) this.navigateToTasks(filterMap[key]);
            });
            card.addEventListener('touchend', (e) => {
                e.preventDefault();
                const filterMap = { 'overdue': 'overdue', 'today': 'today', 'upcoming': 'week' };
                const key = Object.keys(filterMap).find(k => card.classList.contains(`${k}-card`));
                if (key) this.navigateToTasks(filterMap[key]);
            });
        });

        // Filter chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.renderAllTasks(chip.dataset.filter);
            });
            chip.addEventListener('touchend', (e) => {
                e.preventDefault();
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.renderAllTasks(chip.dataset.filter);
            });
        });

        // Search
        document.getElementById('searchTasks')?.addEventListener('input', (e) => {
            this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', e.target.value);
        });

        // Modal
        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
        document.getElementById('btnSave')?.addEventListener('click', (e) => { e.preventDefault(); this.saveTask(); });
        document.getElementById('btnSave')?.addEventListener('touchend', (e) => { e.preventDefault(); this.saveTask(); });
        document.getElementById('btnDelete')?.addEventListener('click', (e) => { e.preventDefault(); this.deleteTask(); });
        document.getElementById('btnDelete')?.addEventListener('touchend', (e) => { e.preventDefault(); this.deleteTask(); });
        document.getElementById('addSubtask')?.addEventListener('click', (e) => { e.preventDefault(); this.addSubtaskInput(); });
        document.getElementById('addSubtask')?.addEventListener('touchend', (e) => { e.preventDefault(); this.addSubtaskInput(); });

        // Priority buttons
        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Calendar nav
        document.getElementById('prevMonth')?.addEventListener('click', (e) => { e.preventDefault(); this.changeMonth(-1); });
        document.getElementById('prevMonth')?.addEventListener('touchend', (e) => { e.preventDefault(); this.changeMonth(-1); });
        document.getElementById('nextMonth')?.addEventListener('click', (e) => { e.preventDefault(); this.changeMonth(1); });
        document.getElementById('nextMonth')?.addEventListener('touchend', (e) => { e.preventDefault(); this.changeMonth(1); });

        // Folder add
        document.getElementById('btnAddFolder')?.addEventListener('click', (e) => { e.preventDefault(); this.addFolder(); });
        document.getElementById('btnAddFolder')?.addEventListener('touchend', (e) => { e.preventDefault(); this.addFolder(); });

        this.calendarDate = new Date();
        this.renderHome();
        this.renderAllTasks('all');
    },

    switchTab(page) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        const tab = document.querySelector(`.tab-item[data-page="${page}"]`);
        if (tab) tab.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) pageEl.classList.add('active');
        if (page === 'calendar') this.renderCalendar();
        if (page === 'folders') this.renderFolders();
    },

    setupLangButton() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;
        btn.textContent = i18n.current === 'ru' ? 'EN' : 'RU';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.switchLanguage();
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.switchLanguage();
        });
    },

    switchLanguage() {
        i18n.setLang(i18n.current === 'ru' ? 'en' : 'ru');
        document.getElementById('langToggle').textContent = i18n.current === 'ru' ? 'EN' : 'RU';
        this.applyTranslations();
        this.renderHome();
        this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
        if (document.getElementById('page-calendar').classList.contains('active')) this.renderCalendar();
        if (document.getElementById('page-folders').classList.contains('active')) this.renderFolders();
        this.updateModalTranslations();
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (!key) return;
            const text = i18n.t(key);
            if ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA') {
                el.placeholder = text;
            } else if (el.tagName === 'OPTION') {
                el.textContent = text;
            } else {
                el.textContent = text;
            }
        });
    },

    updateModalTranslations() {
        const title = document.getElementById('modalTitle');
        if (title) title.textContent = this.editingTaskId ? i18n.t('editReminder') : i18n.t('newReminder');
        document.getElementById('inputTitle')?.setAttribute('placeholder', i18n.t('taskName'));
        document.getElementById('inputDescription')?.setAttribute('placeholder', i18n.t('notes'));
        document.getElementById('addSubtask')?.textContent = i18n.t('addSubtask');
        document.getElementById('btnSave')?.textContent = i18n.t('save');
        document.getElementById('btnDelete')?.textContent = i18n.t('delete');
        document.querySelectorAll('.modal-label[data-i18n]').forEach(el => {
            if (el.dataset.i18n) el.textContent = i18n.t(el.dataset.i18n);
        });
        document.querySelectorAll('#inputFolder option').forEach(opt => {
            if (opt.dataset.i18n) opt.textContent = i18n.t(opt.dataset.i18n);
        });
        document.querySelectorAll('#inputRepeat option').forEach(opt => {
            if (opt.dataset.i18n) opt.textContent = i18n.t(opt.dataset.i18n);
        });
        document.querySelectorAll('#inputRemindBefore option').forEach(opt => {
            if (opt.dataset.i18n) opt.textContent = i18n.t(opt.dataset.i18n);
        });
    },

    navigateToTasks(filter) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        const tasksTab = document.querySelector('.tab-item[data-page="tasks"]');
        if (tasksTab) tasksTab.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-tasks').classList.add('active');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
        if (chip) chip.classList.add('active');
        else {
            const allChip = document.querySelector('.chip[data-filter="all"]');
            if (allChip) allChip.classList.add('active');
        }
        this.renderAllTasks(filter);
    },

    renderHome() {
        const active = store.getActive();
        const countEl = document.getElementById('activeCount');
        if (countEl) countEl.textContent = active.length;
        const overdueEl = document.getElementById('overdueCount');
        if (overdueEl) overdueEl.textContent = i18n.t('tasksCount', { n: store.getOverdue().length });
        const todayEl = document.getElementById('todayCount');
        if (todayEl) todayEl.textContent = i18n.t('tasksCount', { n: store.getToday().length });
        const upcomingEl = document.getElementById('upcomingCount');
        if (upcomingEl) upcomingEl.textContent = i18n.t('tasksCount', { n: store.getUpcoming().length });
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
        if (!container) return;
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
        const locale = i18n.current === 'ru' ? 'ru-RU' : 'en-US';
        const dateStr = d ? d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + (d.getHours() ? ` ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` : '') : i18n.t('noDeadline');
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
                        ${t.subtasks?.length ? `<span>${t.subtasks.filter(s => typeof s === 'object' ? !s.done : true).length}/${t.subtasks.length}</span>` : ''}
                    </div>
                </div>
                <span class="priority-dot ${t.priority}"></span>
            </div>`;
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    attachTaskEvents() {
        document.querySelectorAll('.task-item').forEach(item => {
            item.onclick = null;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.closest('[data-action]')?.dataset.action;
                const id = item.dataset.id;
                if (action === 'toggle') {
                    if (this.tg) this.tg.HapticFeedback?.notificationOccurred('success');
                    store.toggle(id);
                    this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
                    this.renderHome();
                } else {
                    this.openModal(id);
                }
            });
            item.addEventListener('touchend', (e) => {
                e.preventDefault();
                const action = e.target.closest('[data-action]')?.dataset.action;
                const id = item.dataset.id;
                if (action === 'toggle') {
                    if (this.tg) this.tg.HapticFeedback?.notificationOccurred('success');
                    store.toggle(id);
                    this.renderAllTasks(document.querySelector('.chip.active')?.dataset.filter || 'all', document.getElementById('searchTasks')?.value || '');
                    this.renderHome();
                } else {
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
        const locale = i18n.current === 'ru' ? 'ru-RU' : 'en-US';
        const monthTitle = document.getElementById('monthTitle');
        if (monthTitle) monthTitle.textContent = new Date(year, month).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        const dayNames = i18n.current === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        document.querySelectorAll('.weekdays span').forEach((s, i) => { if (dayNames[i]) s.textContent = dayNames[i]; });

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
            day.addEventListener('click', (e) => {
                e.preventDefault();
                grid.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');
                this.selectedDate = new Date(day.dataset.date);
                this.renderDateTasks(this.selectedDate);
            });
            day.addEventListener('touchend', (e) => {
                e.preventDefault();
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
        if (!container) return;
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
        if (!container) return;
        container.innerHTML = folders.map(f => {
            const count = allTasks.filter(t => t.folder === f.id).length;
            return `<div class="folder-card" data-folder="${f.id}"><div class="folder-left"><div class="folder-color" style="background: ${f.color};"></div><span class="folder-name">${f.name}</span></div><span class="folder-count">${count}</span></div>`;
        }).join('');

        container.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToTasks('all');
                const searchInput = document.getElementById('searchTasks');
                if (searchInput) searchInput.value = card.dataset.folder;
                this.renderAllTasks('all', card.dataset.folder);
            });
            card.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.navigateToTasks('all');
                const searchInput = document.getElementById('searchTasks');
                if (searchInput) searchInput.value = card.dataset.folder;
                this.renderAllTasks('all', card.dataset.folder);
            });
        });
    },

    addFolder() {
        if (this.tg) this.tg.showAlert('Создание папок будет доступно позже');
    },

    openModal(id = null) {
        this.editingTaskId = id;
        const modal = document.getElementById('modalOverlay');
        const deleteBtn = document.getElementById('btnDelete');
        const subtasksList = document.getElementById('subtasksList');
        if (subtasksList) subtasksList.innerHTML = '';
        this.updateModalTranslations();

        if (id) {
            const task = store.getAll().find(t => t.id === id);
            if (task) {
                const titleEl = document.getElementById('modalTitle');
                if (titleEl) titleEl.textContent = i18n.t('editReminder');
                if (deleteBtn) deleteBtn.style.display = 'block';
                const inputTitle = document.getElementById('inputTitle');
                if (inputTitle) inputTitle.value = task.title;
                const inputDesc = document.getElementById('inputDescription');
                if (inputDesc) inputDesc.value = task.notes || '';
                const inputDeadline = document.getElementById('inputDeadline');
                if (inputDeadline) inputDeadline.value = task.deadline ? task.deadline.slice(0, 16) : '';
                const inputFolder = document.getElementById('inputFolder');
                if (inputFolder) inputFolder.value = task.folder || '';
                const inputRepeat = document.getElementById('inputRepeat');
                if (inputRepeat) inputRepeat.value = task.repeat || 'none';
                const inputRemind = document.getElementById('inputRemindBefore');
                if (inputRemind) inputRemind.value = task.remindBefore || 0;
                document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
                const priorityBtn = document.querySelector(`.priority-btn[data-priority="${task.priority}"]`);
                if (priorityBtn) priorityBtn.classList.add('active');
                if (task.subtasks) task.subtasks.forEach(s => this.addSubtaskInput(typeof s === 'object' ? s.text : s));
            }
        } else {
            const titleEl = document.getElementById('modalTitle');
            if (titleEl) titleEl.textContent = i18n.t('newReminder');
            if (deleteBtn) deleteBtn.style.display = 'none';
            const inputTitle = document.getElementById('inputTitle');
            if (inputTitle) inputTitle.value = '';
            const inputDesc = document.getElementById('inputDescription');
            if (inputDesc) inputDesc.value = '';
            const inputDeadline = document.getElementById('inputDeadline');
            if (inputDeadline) inputDeadline.value = '';
            const inputFolder = document.getElementById('inputFolder');
            if (inputFolder) inputFolder.value = '';
            const inputRepeat = document.getElementById('inputRepeat');
            if (inputRepeat) inputRepeat.value = 'none';
            const inputRemind = document.getElementById('inputRemindBefore');
            if (inputRemind) inputRemind.value = '0';
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            const mediumBtn = document.querySelector('.priority-btn[data-priority="medium"]');
            if (mediumBtn) mediumBtn.classList.add('active');
        }
        if (modal) modal.classList.add('active');
        setTimeout(() => {
            const inputTitle = document.getElementById('inputTitle');
            if (inputTitle) inputTitle.focus();
        }, 300);
    },

    closeModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) modal.classList.remove('active');
        this.editingTaskId = null;
    },

    addSubtaskInput(value = '') {
        const container = document.getElementById('subtasksList');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'subtask-row';
        row.innerHTML = `<input type="text" class="modal-input subtask-input" placeholder="Subtask" value="${this.escapeHtml(value)}"><button class="subtask-remove">x</button>`;
        row.querySelector('.subtask-remove').addEventListener('click', () => row.remove());
        container.appendChild(row);
        const input = row.querySelector('input');
        if (input) input.focus();
    },

    getSubtasks() {
        return Array.from(document.querySelectorAll('.subtask-input')).map(i => i.value.trim()).filter(v => v);
    },

    saveTask() {
        const inputTitle = document.getElementById('inputTitle');
        const title = inputTitle?.value?.trim();
        if (!title) {
            if (this.tg) this.tg.showAlert(i18n.t('enterTaskName'));
            return;
        }
        const data = {
            title,
            notes: document.getElementById('inputDescription')?.value?.trim() || '',
            deadline: document.getElementById('inputDeadline')?.value || null,
            priority: document.querySelector('.priority-btn.active')?.dataset.priority || 'medium',
            folder: document.getElementById('inputFolder')?.value || null,
            repeat: document.getElementById('inputRepeat')?.value || 'none',
            remindBefore: parseInt(document.getElementById('inputRemindBefore')?.value || '0'),
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