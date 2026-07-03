const app = {
    tg: null,
    editingId: null,
    calDate: new Date(),
    selDate: null,

    init() {
        this.tg = window.Telegram?.WebApp;
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
        }

        // Lang button
        const updateLangBtn = () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.textContent = i18n.current === 'ru' ? 'EN' : 'RU');
        };
        updateLangBtn();
        document.querySelectorAll('.lang-btn').forEach(b => {
            b.onclick = () => {
                i18n.setLang(i18n.current === 'ru' ? 'en' : 'ru');
                updateLangBtn();
                this.applyI18n();
                this.refresh();
            };
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
                tab.classList.add('on');
                document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
                const screen = document.getElementById('screen-' + tab.dataset.screen);
                if (screen) screen.classList.add('active');
                if (tab.dataset.screen === 'calendar') this.renderCalendar();
                if (tab.dataset.screen === 'settings') this.renderFolders();
            };
        });

        // Add buttons
        document.getElementById('addHomeBtn').onclick = () => this.openModal();
        document.getElementById('addTaskBtn').onclick = () => this.openModal();
        document.getElementById('addCalBtn').onclick = () => this.openModal();

        // Settings
        const addFolderSettingsBtn = document.getElementById('addFolderSettingsBtn');
        if (addFolderSettingsBtn) addFolderSettingsBtn.onclick = () => this.addFolder();

        // Cards
        document.getElementById('cardOverdue').onclick = () => this.goToTasks('overdue');
        document.getElementById('cardToday').onclick = () => this.goToTasks('today');
        document.getElementById('cardUpcoming').onclick = () => this.goToTasks('week');

        // Chips
        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
                c.classList.add('on');
                this.renderTasks(c.dataset.filter);
            };
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.oninput = () => {
                this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
            };
        }

        // Modal
        document.getElementById('modal').onclick = function(e) { if (e.target === this) app.closeModal(); };
        document.getElementById('saveBtn').onclick = () => this.saveTask();
        document.getElementById('delBtn').onclick = () => this.deleteTask();
        document.querySelectorAll('.prio-btn').forEach(b => {
            b.onclick = () => {
                document.querySelectorAll('.prio-btn').forEach(x => x.classList.remove('on'));
                b.classList.add('on');
            };
        });

        // Custom reminder button
        const addCustomBtn = document.getElementById('addCustomReminderBtn');
        if (addCustomBtn) addCustomBtn.onclick = () => this.addCustomReminder();

        // Calendar nav
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        if (prevMonth) prevMonth.onclick = () => { this.calDate.setMonth(this.calDate.getMonth() - 1); this.renderCalendar(); };
        if (nextMonth) nextMonth.onclick = () => { this.calDate.setMonth(this.calDate.getMonth() + 1); this.renderCalendar(); };

        this.applyI18n();
        this.renderHome();
        this.renderTasks('all');
    },

    applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (!key) return;
            const text = i18n.t(key);
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = text;
            else el.textContent = text;
        });
        if (document.getElementById('modal').classList.contains('show')) {
            document.querySelectorAll('.modal-box label').forEach((label, i) => {
                const keys = ['deadline', 'priority', 'folder', 'repeat', 'remindBefore', 'customReminders'];
                if (keys[i]) label.textContent = i18n.t(keys[i]);
            });
            document.getElementById('delBtn').textContent = i18n.t('delete');
            document.getElementById('saveBtn').textContent = i18n.t('save');
            document.getElementById('inpTitle').placeholder = i18n.t('taskName');
            document.getElementById('inpDesc').placeholder = i18n.t('notes');
            if (this.editingId) document.getElementById('modalTitle').textContent = i18n.t('editReminder');
            else document.getElementById('modalTitle').textContent = i18n.t('newReminder');

            // Translate select options
            const folderOpts = document.getElementById('inpFolder').options;
            if (folderOpts[0]) folderOpts[0].textContent = i18n.t('none');
            const repeatOpts = document.getElementById('inpRepeat').options;
            if (repeatOpts[0]) repeatOpts[0].textContent = i18n.t('never');
            if (repeatOpts[1]) repeatOpts[1].textContent = i18n.t('daily');
            if (repeatOpts[2]) repeatOpts[2].textContent = i18n.t('weekly');
            if (repeatOpts[3]) repeatOpts[3].textContent = i18n.t('monthly');
            const remindOpts = document.getElementById('inpRemind').options;
            if (remindOpts[0]) remindOpts[0].textContent = i18n.t('atDeadline');
            if (remindOpts[1]) remindOpts[1].textContent = i18n.t('min5');
            if (remindOpts[2]) remindOpts[2].textContent = i18n.t('min15');
            if (remindOpts[3]) remindOpts[3].textContent = i18n.t('min30');
            if (remindOpts[4]) remindOpts[4].textContent = i18n.t('hour1');
            if (remindOpts[5]) remindOpts[5].textContent = i18n.t('day1');
        }
    },

    refresh() {
        this.renderHome();
        this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        if (document.getElementById('screen-calendar').classList.contains('active')) this.renderCalendar();
        if (document.getElementById('screen-settings') && document.getElementById('screen-settings').classList.contains('active')) this.renderFolders();
    },

    goToTasks(filter) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
        const tasksTab = document.querySelector('.tab[data-screen="tasks"]');
        if (tasksTab) tasksTab.classList.add('on');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const tasksScreen = document.getElementById('screen-tasks');
        if (tasksScreen) tasksScreen.classList.add('active');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
        if (chip) chip.classList.add('on');
        else {
            const allChip = document.querySelector('.chip[data-filter="all"]');
            if (allChip) allChip.classList.add('on');
        }
        this.renderTasks(filter);
    },

    renderHome() {
        const activeCount = document.getElementById('activeCount');
        if (activeCount) activeCount.textContent = store.getActive().length;
        const overdueCount = document.getElementById('overdueCount');
        if (overdueCount) overdueCount.textContent = i18n.t('tasksCount', { n: store.getOverdue().length });
        const todayCount = document.getElementById('todayCount');
        if (todayCount) todayCount.textContent = i18n.t('tasksCount', { n: store.getToday().length });
        const upcomingCount = document.getElementById('upcomingCount');
        if (upcomingCount) upcomingCount.textContent = i18n.t('tasksCount', { n: store.getUpcoming().length });
    },

    renderTasks(filter, search) {
        search = search || document.getElementById('searchInput')?.value || '';
        let tasks;
        switch (filter) {
            case 'today': tasks = store.getToday(); break;
            case 'week': tasks = store.getUpcoming().filter(t => (new Date(t.deadline) - new Date()) < 7*86400000); break;
            case 'overdue': tasks = store.getOverdue(); break;
            default: tasks = store.getAll();
        }
        if (search) {
            const q = search.toLowerCase();
            tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)));
        }
        const container = document.getElementById('taskList');
        if (!container) return;
        if (!tasks.length) {
            container.innerHTML = `<div class="empty">${i18n.t('noTasks')}</div>`;
            return;
        }
        container.innerHTML = tasks.map(t => {
            const isOverdue = t.deadline && new Date(t.deadline) < new Date() && !t.completed;
            const d = t.deadline ? new Date(t.deadline) : null;
            const locale = i18n.current === 'ru' ? 'ru-RU' : 'en-US';
            const dateStr = d ? d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + (d.getHours() ? ` ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` : '') : i18n.t('noDeadline');
            const folderNames = {};
            const folders = store.getFolders();
            folders.forEach(f => { folderNames[f.id] = f.name; });
            const repeatNames = { none: i18n.t('never'), daily: i18n.t('daily'), weekly: i18n.t('weekly'), monthly: i18n.t('monthly') };
            return `
                <div class="task ${isOverdue ? 'overdue' : ''} ${t.completed ? 'done' : ''}" data-id="${t.id}">
                    <div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div>
                    <div class="task-body" data-act="edit">
                        <div class="t">${this.escapeHtml(t.title)}</div>
                        ${t.notes ? `<div class="n">${this.escapeHtml(t.notes)}</div>` : ''}
                        <div class="m">
                            <span class="${isOverdue ? 'red' : ''}">${dateStr}</span>
                            ${t.folder ? '<span>' + (folderNames[t.folder] || t.folder) + '</span>' : ''}
                            ${t.repeat !== 'none' ? '<span>' + (repeatNames[t.repeat] || t.repeat) + '</span>' : ''}
                            ${t.customReminders && t.customReminders.length > 0 ? '<span>' + t.customReminders.length + ' reminders</span>' : ''}
                        </div>
                    </div>
                    <span class="pdot ${t.priority}"></span>
                </div>`;
        }).join('');

        // Attach events
        this.attachTaskEvents(container);

        // Swipe detection
        this.attachSwipeEvents(container);
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    attachTaskEvents(container) {
        container.querySelectorAll('.task').forEach(item => {
            item.onclick = function(e) {
                const act = (e.target.closest('[data-act]') || {}).dataset?.act;
                const id = item.dataset.id;
                if (act === 'check') {
                    if (app.tg) app.tg.HapticFeedback?.notificationOccurred('success');
                    store.toggle(id);
                    app.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
                    app.renderHome();
                } else if (act === 'edit') {
                    app.openModal(id);
                }
            };
        });
    },

    attachSwipeEvents(container) {
        let touchStartX = 0;
        let touchStartY = 0;

        container.querySelectorAll('.task').forEach(item => {
            item.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                item.style.transition = 'none';
            }, { passive: true });

            item.addEventListener('touchmove', (e) => {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                    e.preventDefault();
                    const maxSwipe = 120;
                    const clamped = Math.max(-maxSwipe, Math.min(maxSwipe, dx));
                    item.style.transform = `translateX(${clamped}px)`;
                    item.style.opacity = 1 - Math.abs(clamped) / maxSwipe * 0.3;

                    if (clamped < -40) {
                        item.classList.add('swipe-delete');
                        item.classList.remove('swipe-complete');
                    } else if (clamped > 40) {
                        item.classList.add('swipe-complete');
                        item.classList.remove('swipe-delete');
                    } else {
                        item.classList.remove('swipe-delete', 'swipe-complete');
                    }
                }
            }, { passive: false });

            item.addEventListener('touchend', () => {
                item.style.transition = 'all 0.3s ease';
                item.style.transform = '';
                item.style.opacity = '';

                if (item.classList.contains('swipe-delete')) {
                    item.classList.remove('swipe-delete');
                    if (confirm(i18n.t('deleteConfirm') || 'Delete?')) {
                        if (app.tg) app.tg.HapticFeedback?.notificationOccurred('warning');
                        store.remove(item.dataset.id);
                        app.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
                        app.renderHome();
                    }
                } else if (item.classList.contains('swipe-complete')) {
                    item.classList.remove('swipe-complete');
                    if (app.tg) app.tg.HapticFeedback?.notificationOccurred('success');
                    store.toggle(item.dataset.id);
                    app.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
                    app.renderHome();
                }
            });
        });
    },

    renderCalendar() {
        const year = this.calDate.getFullYear();
        const month = this.calDate.getMonth();
        const monthTitle = document.getElementById('monthTitle');
        if (monthTitle) monthTitle.textContent = new Date(year, month).toLocaleDateString(i18n.current === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const offset = (firstDay.getDay() + 6) % 7;
        const grid = document.getElementById('calGrid');
        if (!grid) return;

        const dayNames = i18n.current === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        document.querySelectorAll('.cal-weekdays span').forEach((s, i) => { if (dayNames[i]) s.textContent = dayNames[i]; });

        let html = '';
        for (let i = 0; i < offset; i++) html += '<div class="cal-day dim"></div>';
        const today = new Date();
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const has = store.getByDate(date).length > 0;
            const isToday = date.toDateString() === today.toDateString();
            const isSel = this.selDate && date.toDateString() === this.selDate.toDateString();
            html += `<div class="cal-day ${isToday ? 'now' : ''} ${isSel ? 'sel' : ''} ${has ? 'dot' : ''}" data-date="${date.toISOString()}">${d}</div>`;
        }
        grid.innerHTML = html;

        grid.querySelectorAll('.cal-day[data-date]').forEach(day => {
            day.onclick = () => {
                grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('sel'));
                day.classList.add('sel');
                this.selDate = new Date(day.dataset.date);
                this.renderCalTasks();
            };
        });
    },

    renderCalTasks() {
        if (!this.selDate) return;
        const tasks = store.getByDate(this.selDate);
        const container = document.getElementById('calTasks');
        if (!container) return;
        if (!tasks.length) {
            container.innerHTML = `<div class="empty">${i18n.t('noTasksDate')}</div>`;
            return;
        }
        container.innerHTML = tasks.map(t => {
            return `<div class="task" data-id="${t.id}">
                <div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div>
                <div class="task-body" data-act="edit"><div class="t">${this.escapeHtml(t.title)}</div></div>
                <span class="pdot ${t.priority}"></span>
            </div>`;
        }).join('');
        this.attachTaskEvents(container);
    },

    renderFolders() {
        const folders = store.getFolders();
        const container = document.getElementById('settingsFolderList');
        if (!container) return;
        const allTasks = store.getAll();
        container.innerHTML = folders.map(f => {
            const count = allTasks.filter(t => t.folder === f.id).length;
            return `<div class="folder-row">
                <div class="folder-dot" style="background:${f.color || '#7c5ce7'}"></div>
                <span>${f.name}</span>
                <span class="folder-num">${count}</span>
                <div class="folder-row-actions">
                    <button class="folder-edit-btn" data-edit="${f.id}">✎</button>
                    <button class="folder-del-btn" data-del="${f.id}">✕</button>
                </div>
            </div>`;
        }).join('');

        container.querySelectorAll('.folder-edit-btn').forEach(b => {
            b.onclick = (e) => { e.stopPropagation(); this.editFolder(b.dataset.edit); };
        });
        container.querySelectorAll('.folder-del-btn').forEach(b => {
            b.onclick = (e) => { e.stopPropagation(); this.deleteFolder(b.dataset.del); };
        });
    },

    addFolder() {
        const name = prompt(i18n.t('folderNamePrompt') || 'Folder name:');
        if (name && name.trim()) {
            const colors = ['#7c5ce7', '#2ecc71', '#4A90D9', '#f97316', '#e74c3c', '#f39c12'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            store.addFolder(name.trim(), color);
            this.renderFolders();
        }
    },

    editFolder(id) {
        const folders = store.getFolders();
        const folder = folders.find(f => f.id === id);
        if (!folder) return;
        const name = prompt(i18n.t('folderRenamePrompt') || 'New name:', folder.name);
        if (name && name.trim()) {
            store.updateFolder(id, name.trim());
            this.renderFolders();
        }
    },

    deleteFolder(id) {
        const folders = store.getFolders();
        const folder = folders.find(f => f.id === id);
        if (!folder) return;
        if (confirm(i18n.t('deleteFolderConfirm') || `Delete folder "${folder.name}" and remove it from all tasks?`)) {
            store.removeFolder(id);
            this.renderFolders();
            this.renderHome();
        }
    },

    openModal(id) {
        this.editingId = id;
        const delBtn = document.getElementById('delBtn');
        delBtn.style.display = id ? 'block' : 'none';
        document.getElementById('modalTitle').textContent = id ? i18n.t('editReminder') : i18n.t('newReminder');

        // Translate placeholders
        document.getElementById('inpTitle').placeholder = i18n.t('taskName');
        document.getElementById('inpDesc').placeholder = i18n.t('notes');

        // Translate labels
        const labels = document.querySelectorAll('.modal-box label');
        const labelKeys = ['deadline', 'priority', 'folder', 'repeat', 'remindBefore', 'customReminders'];
        labels.forEach((label, i) => {
            if (labelKeys[i]) label.textContent = i18n.t(labelKeys[i]);
        });

        // Translate buttons
        delBtn.textContent = i18n.t('delete');
        document.getElementById('saveBtn').textContent = i18n.t('save');
        const addCustomBtn = document.getElementById('addCustomReminderBtn');
        if (addCustomBtn) addCustomBtn.textContent = i18n.t('addReminder');

        // Populate folder select
        const folderSelect = document.getElementById('inpFolder');
        folderSelect.innerHTML = '<option value="">' + i18n.t('none') + '</option>';
        const folders = store.getFolders();
        folders.forEach(f => {
            folderSelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });

        // Translate repeat select
        const repeatOpts = document.getElementById('inpRepeat').options;
        repeatOpts[0].textContent = i18n.t('never');
        repeatOpts[1].textContent = i18n.t('daily');
        repeatOpts[2].textContent = i18n.t('weekly');
        repeatOpts[3].textContent = i18n.t('monthly');

        // Translate remind select
        const remindOpts = document.getElementById('inpRemind').options;
        remindOpts[0].textContent = i18n.t('atDeadline');
        remindOpts[1].textContent = i18n.t('min5');
        remindOpts[2].textContent = i18n.t('min15');
        remindOpts[3].textContent = i18n.t('min30');
        remindOpts[4].textContent = i18n.t('hour1');
        remindOpts[5].textContent = i18n.t('day1');

        // Clear custom reminders
        const customList = document.getElementById('customRemindersList');
        if (customList) customList.innerHTML = '';

        if (id) {
            const t = store.getAll().find(x => x.id === id);
            if (t) {
                document.getElementById('inpTitle').value = t.title;
                document.getElementById('inpDesc').value = t.notes || '';
                document.getElementById('inpDeadline').value = t.deadline ? t.deadline.slice(0, 16) : '';
                document.getElementById('inpFolder').value = t.folder || '';
                document.getElementById('inpRepeat').value = t.repeat || 'none';
                document.getElementById('inpRemind').value = t.remindBefore || 0;
                document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('on'));
                const pb = document.querySelector(`.prio-btn[data-p="${t.priority}"]`);
                if (pb) pb.classList.add('on');

                // Fill custom reminders
                if (t.customReminders && customList) {
                    t.customReminders.forEach(m => {
                        let val = m;
                        let unit = 'minutes';
                        if (m >= 1440 && m % 1440 === 0) { val = m / 1440; unit = 'days'; }
                        else if (m >= 60 && m % 60 === 0) { val = m / 60; unit = 'hours'; }
                        this.addCustomReminder(val, unit);
                    });
                }
            }
        } else {
            document.getElementById('inpTitle').value = '';
            document.getElementById('inpDesc').value = '';
            document.getElementById('inpDeadline').value = '';
            document.getElementById('inpFolder').value = '';
            document.getElementById('inpRepeat').value = 'none';
            document.getElementById('inpRemind').value = '0';
            document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('on'));
            const mediumBtn = document.querySelector('.prio-btn[data-p="medium"]');
            if (mediumBtn) mediumBtn.classList.add('on');
        }
        document.getElementById('modal').classList.add('show');
        document.body.classList.add('modal-open');
    },

    closeModal() {
        document.getElementById('modal').classList.remove('show');
        document.body.classList.remove('modal-open');
        this.editingId = null;
    },

    addCustomReminder(value, unit) {
        value = value || '';
        unit = unit || 'minutes';
        const container = document.getElementById('customRemindersList');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'reminder-row';
        row.innerHTML = `
            <input type="number" class="reminder-value" placeholder="5" value="${value}" min="1" style="width:60px;">
            <select class="reminder-unit">
                <option value="minutes" ${unit === 'minutes' ? 'selected' : ''}>min</option>
                <option value="hours" ${unit === 'hours' ? 'selected' : ''}>hours</option>
                <option value="days" ${unit === 'days' ? 'selected' : ''}>days</option>
            </select>
            <span style="color:rgba(255,255,255,0.4);font-size:12px;">${i18n.t('before') || 'before'}</span>
            <button class="reminder-remove">✕</button>`;
        row.querySelector('.reminder-remove').onclick = () => row.remove();
        container.appendChild(row);
        const input = row.querySelector('input');
        if (input) input.focus();
    },

    getCustomReminders() {
        return Array.from(document.querySelectorAll('.reminder-row')).map(row => {
            const valInput = row.querySelector('.reminder-value');
            const unitSelect = row.querySelector('.reminder-unit');
            const val = parseInt(valInput?.value) || 0;
            const unit = unitSelect?.value || 'minutes';
            let minutes = 0;
            if (unit === 'minutes') minutes = val;
            else if (unit === 'hours') minutes = val * 60;
            else if (unit === 'days') minutes = val * 1440;
            return minutes;
        }).filter(m => m > 0);
    },

    saveTask() {
        const inpTitle = document.getElementById('inpTitle');
        const title = inpTitle?.value?.trim();
        if (!title) {
            if (this.tg) this.tg.showAlert(i18n.t('enterTaskName'));
            return;
        }
        const data = {
            title,
            notes: document.getElementById('inpDesc')?.value?.trim() || '',
            deadline: document.getElementById('inpDeadline')?.value || null,
            priority: document.querySelector('.prio-btn.on')?.dataset.p || 'medium',
            folder: document.getElementById('inpFolder')?.value || null,
            repeat: document.getElementById('inpRepeat')?.value || 'none',
            remindBefore: parseInt(document.getElementById('inpRemind')?.value || '0'),
            customReminders: this.getCustomReminders(),
        };

        if (this.editingId) {
            store.update(this.editingId, data);
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
        this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
    },

    deleteTask() {
        if (this.editingId && confirm(i18n.t('deleteConfirm') || 'Delete this task?')) {
            store.remove(this.editingId);
            this.closeModal();
            this.renderHome();
            this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());