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
                document.getElementById('screen-' + tab.dataset.screen).classList.add('active');
                if (tab.dataset.screen === 'calendar') this.renderCalendar();
            };
        });

        // Add buttons
        document.getElementById('addHomeBtn').onclick = () => this.openModal();
        document.getElementById('addTaskBtn').onclick = () => this.openModal();
        document.getElementById('addCalBtn').onclick = () => this.openModal();
        document.getElementById('addFolderBtn').onclick = () => this.tg?.showAlert('Coming soon');

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
        document.getElementById('searchInput').oninput = () => {
            this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        };

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

        // Calendar nav
        document.getElementById('prevMonth').onclick = () => { this.calDate.setMonth(this.calDate.getMonth() - 1); this.renderCalendar(); };
        document.getElementById('nextMonth').onclick = () => { this.calDate.setMonth(this.calDate.getMonth() + 1); this.renderCalendar(); };

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
        // Обновим лейблы в модалке если она открыта
        if (document.getElementById('modal').classList.contains('show')) {
            document.querySelectorAll('.modal-box label').forEach((label, i) => {
                const keys = ['deadline', 'priority', 'folder', 'repeat', 'remindBefore'];
                if (keys[i]) label.textContent = i18n.t(keys[i]);
            });
            document.getElementById('delBtn').textContent = i18n.t('delete');
            document.getElementById('saveBtn').textContent = i18n.t('save');
            document.getElementById('inpTitle').placeholder = i18n.t('taskName');
            document.getElementById('inpDesc').placeholder = i18n.t('notes');
            if (this.editingId) document.getElementById('modalTitle').textContent = i18n.t('editReminder');
            else document.getElementById('modalTitle').textContent = i18n.t('newReminder');
        }
    },

    refresh() {
        this.renderHome();
        this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        if (document.getElementById('screen-calendar').classList.contains('active')) this.renderCalendar();
    },

    goToTasks(filter) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
        document.querySelector('.tab[data-screen="tasks"]').classList.add('on');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-tasks').classList.add('active');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
        if (chip) chip.classList.add('on');
        else document.querySelector('.chip[data-filter="all"]').classList.add('on');
        this.renderTasks(filter);
    },

    renderHome() {
        document.getElementById('activeCount').textContent = store.getActive().length;
        document.getElementById('overdueCount').textContent = i18n.t('tasksCount', { n: store.getOverdue().length });
        document.getElementById('todayCount').textContent = i18n.t('tasksCount', { n: store.getToday().length });
        document.getElementById('upcomingCount').textContent = i18n.t('tasksCount', { n: store.getUpcoming().length });
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
        if (!tasks.length) {
            container.innerHTML = `<div class="empty">${i18n.t('noTasks')}</div>`;
            return;
        }
        container.innerHTML = tasks.map(t => {
            const isOverdue = t.deadline && new Date(t.deadline) < new Date() && !t.completed;
            const d = t.deadline ? new Date(t.deadline) : null;
            const dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (d.getHours() ? ` ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` : '') : 'No deadline';
            const folderNames = { work: 'Work', personal: 'Personal', study: 'Study' };
            return `
                <div class="task ${isOverdue ? 'overdue' : ''} ${t.completed ? 'done' : ''}" data-id="${t.id}">
                    <div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div>
                    <div class="task-body" data-act="edit">
                        <div class="t">${t.title}</div>
                        ${t.notes ? `<div class="n">${t.notes}</div>` : ''}
                        <div class="m">
                            <span class="${isOverdue ? 'red' : ''}">${dateStr}</span>
                            ${t.folder ? '<span>' + (folderNames[t.folder] || t.folder) + '</span>' : ''}
                            ${t.repeat !== 'none' ? '<span>' + t.repeat + '</span>' : ''}
                        </div>
                    </div>
                    <span class="pdot ${t.priority}"></span>
                </div>`;
        }).join('');

        container.querySelectorAll('.task').forEach(item => {
            item.onclick = function(e) {
                const act = (e.target.closest('[data-act]') || {}).dataset?.act;
                const id = item.dataset.id;
                if (act === 'check') {
                    store.toggle(id);
                    app.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
                    app.renderHome();
                } else {
                    app.openModal(id);
                }
            };
        });
    },

    renderCalendar() {
        const year = this.calDate.getFullYear();
        const month = this.calDate.getMonth();
        document.getElementById('monthTitle').textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const offset = (firstDay.getDay() + 6) % 7;
        const grid = document.getElementById('calGrid');
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
        const tasks = store.getByDate(this.selDate);
        const container = document.getElementById('calTasks');
        if (!tasks.length) {
            container.innerHTML = `<div class="empty">${i18n.t('noTasksDate')}</div>`;
            return;
        }
        container.innerHTML = tasks.map(t => {
            return `<div class="task" data-id="${t.id}">
                <div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div>
                <div class="task-body" data-act="edit"><div class="t">${t.title}</div></div>
                <span class="pdot ${t.priority}"></span>
            </div>`;
        }).join('');
        container.querySelectorAll('.task').forEach(item => {
            item.onclick = function(e) {
                const act = (e.target.closest('[data-act]') || {}).dataset?.act;
                if (act === 'check') { store.toggle(item.dataset.id); app.renderCalTasks(); }
                else app.openModal(item.dataset.id);
            };
        });
    },

    openModal(id) {
        this.editingId = id;
        document.getElementById('delBtn').style.display = id ? 'block' : 'none';
        document.getElementById('modalTitle').textContent = id ? i18n.t('editReminder') : i18n.t('newReminder');

        // Перевод плейсхолдеров
        document.getElementById('inpTitle').placeholder = i18n.t('taskName');
        document.getElementById('inpDesc').placeholder = i18n.t('notes');

        // Перевод label
        document.querySelectorAll('.modal-box label').forEach((label, i) => {
            const keys = ['deadline', 'priority', 'folder', 'repeat', 'remindBefore'];
            if (keys[i]) label.textContent = i18n.t(keys[i]);
        });

        // Перевод select options
        const folderOpts = document.getElementById('inpFolder').options;
        folderOpts[0].textContent = i18n.t('none');
        folderOpts[1].textContent = i18n.t('work');
        folderOpts[2].textContent = i18n.t('personal');
        folderOpts[3].textContent = i18n.t('study');

        const repeatOpts = document.getElementById('inpRepeat').options;
        repeatOpts[0].textContent = i18n.t('never');
        repeatOpts[1].textContent = i18n.t('daily');
        repeatOpts[2].textContent = i18n.t('weekly');
        repeatOpts[3].textContent = i18n.t('monthly');

        const remindOpts = document.getElementById('inpRemind').options;
        remindOpts[0].textContent = i18n.t('atDeadline');
        remindOpts[1].textContent = i18n.t('min5');
        remindOpts[2].textContent = i18n.t('min15');
        remindOpts[3].textContent = i18n.t('min30');
        remindOpts[4].textContent = i18n.t('hour1');
        remindOpts[5].textContent = i18n.t('day1');

        document.getElementById('delBtn').textContent = i18n.t('delete');
        document.getElementById('saveBtn').textContent = i18n.t('save');

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
            }
        } else {
            document.getElementById('inpTitle').value = '';
            document.getElementById('inpDesc').value = '';
            document.getElementById('inpDeadline').value = '';
            document.getElementById('inpFolder').value = '';
            document.getElementById('inpRepeat').value = 'none';
            document.getElementById('inpRemind').value = '0';
            document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('on'));
            document.querySelector('.prio-btn[data-p="medium"]')?.classList.add('on');
        }
        document.getElementById('modal').classList.add('show');
        document.body.classList.add('modal-open');
    },

    closeModal() {
        document.getElementById('modal').classList.remove('show');
        document.body.classList.remove('modal-open');
        this.editingId = null;
    },

    saveTask() {
        const title = document.getElementById('inpTitle').value.trim();
        if (!title) { this.tg?.showAlert('Enter task name'); return; }
        const data = {
            title,
            notes: document.getElementById('inpDesc').value.trim(),
            deadline: document.getElementById('inpDeadline').value || null,
            priority: document.querySelector('.prio-btn.on')?.dataset.p || 'medium',
            folder: document.getElementById('inpFolder').value || null,
            repeat: document.getElementById('inpRepeat').value,
            remindBefore: parseInt(document.getElementById('inpRemind').value),
        };
        if (this.editingId) store.update(this.editingId, data);
        else store.add(data);
        if (this.tg) {
            try { Telegram.WebApp.sendData(JSON.stringify({ action: 'create_reminder', ...data, lang: i18n.current })); } catch(e) {}
        }
        this.closeModal();
        this.renderHome();
        this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
    },

    deleteTask() {
        if (this.editingId && confirm('Delete?')) {
            store.remove(this.editingId);
            this.closeModal();
            this.renderHome();
            this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());