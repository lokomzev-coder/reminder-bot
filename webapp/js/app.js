const app = {
    tg: null, editingId: null, calDate: new Date(), selDate: null,

    async init() {
        this.tg = window.Telegram?.WebApp;
        if (this.tg) { this.tg.ready(); this.tg.expand(); }
    
        // Ждём загрузки данных из Supabase
        await store.init();
        
        // Подписываемся на изменения
        store.onChange(() => this.refresh());
    
        const updateLangBtn = () => document.querySelectorAll('.lang-btn').forEach(b => b.textContent = i18n.current === 'ru' ? 'EN' : 'RU');
        updateLangBtn();
        document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => { i18n.setLang(i18n.current === 'ru' ? 'en' : 'ru'); updateLangBtn(); this.applyI18n(); this.refresh(); });
    
        document.querySelectorAll('.tab').forEach(tab => tab.onclick = () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('on')); tab.classList.add('on');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-' + tab.dataset.screen)?.classList.add('active');
            if (tab.dataset.screen === 'calendar') this.renderCalendar();
            if (tab.dataset.screen === 'settings') this.renderFolders();
        });
    
        document.getElementById('addHomeBtn').onclick = () => this.openModal();
        document.getElementById('addTaskBtn').onclick = () => this.openModal();
        document.getElementById('addCalBtn').onclick = () => this.openModal();
        document.getElementById('addFolderSettingsBtn').onclick = () => this.addFolder();
        document.getElementById('cardOverdue').onclick = () => this.goToTasks('overdue');
        document.getElementById('cardToday').onclick = () => this.goToTasks('today');
        document.getElementById('cardUpcoming').onclick = () => this.goToTasks('week');
    
        document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
            document.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on');
            this.renderTasks(c.dataset.filter);
        });
    
        document.getElementById('searchInput').oninput = () => this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        document.getElementById('modal').onclick = e => { if (e.target === document.getElementById('modal')) this.closeModal(); };
        document.getElementById('saveBtn').onclick = () => this.saveTask();
        document.getElementById('delBtn').onclick = () => this.deleteTask();
        document.querySelectorAll('.prio-btn').forEach(b => b.onclick = () => { document.querySelectorAll('.prio-btn').forEach(x => x.classList.remove('on')); b.classList.add('on'); });
        document.getElementById('addCustomReminderBtn').onclick = () => this.addCustomReminder();
        document.getElementById('prevMonth').onclick = () => { this.calDate.setMonth(this.calDate.getMonth() - 1); this.renderCalendar(); };
        document.getElementById('nextMonth').onclick = () => { this.calDate.setMonth(this.calDate.getMonth() + 1); this.renderCalendar(); };
    
        this.applyI18n(); this.renderHome(); this.renderTasks('all');
    },

    applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n; if (!key) return;
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
            document.getElementById('modalTitle').textContent = this.editingId ? i18n.t('editReminder') : i18n.t('newReminder');
            const ro = document.getElementById('inpRepeat').options;
            if (ro[0]) ro[0].textContent = i18n.t('never');
            if (ro[1]) ro[1].textContent = i18n.t('daily');
            if (ro[2]) ro[2].textContent = i18n.t('weekly');
            if (ro[3]) ro[3].textContent = i18n.t('monthly');
            const rm = document.getElementById('inpRemind').options;
            if (rm[0]) rm[0].textContent = i18n.t('atDeadline');
            if (rm[1]) rm[1].textContent = i18n.t('min5');
            if (rm[2]) rm[2].textContent = i18n.t('min15');
            if (rm[3]) rm[3].textContent = i18n.t('min30');
            if (rm[4]) rm[4].textContent = i18n.t('hour1');
            if (rm[5]) rm[5].textContent = i18n.t('day1');
            document.getElementById('addCustomReminderBtn').textContent = i18n.t('addReminder');
        }
    },

    refresh() {
        this.renderHome(); this.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all');
        if (document.getElementById('screen-calendar').classList.contains('active')) this.renderCalendar();
        if (document.getElementById('screen-settings')?.classList.contains('active')) this.renderFolders();
    },

    goToTasks(filter) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
        document.querySelector('.tab[data-screen="tasks"]')?.classList.add('on');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('screen-tasks')?.classList.add('active');
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
        const chip = document.querySelector(`.chip[data-filter="${filter}"]`);
        if (chip) chip.classList.add('on'); else document.querySelector('.chip[data-filter="all"]')?.classList.add('on');
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
        if (search) { const q = search.toLowerCase(); tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))); }
        const container = document.getElementById('taskList');
        if (!tasks.length) { container.innerHTML = `<div class="empty">${i18n.t('noTasks')}</div>`; return; }
        const folderNames = {}; store.getFolders().forEach(f => folderNames[f.id] = f.name);
        const repeatNames = { none: i18n.t('never'), daily: i18n.t('daily'), weekly: i18n.t('weekly'), monthly: i18n.t('monthly') };
        container.innerHTML = tasks.map(t => {
            const over = t.deadline && new Date(t.deadline) < new Date() && !t.completed;
            const d = t.deadline ? new Date(t.deadline) : null;
            const dateStr = d ? d.toLocaleDateString(i18n.current === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' }) + (d.getHours() ? ` ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` : '') : i18n.t('noDeadline');
            return `<div class="task ${over ? 'overdue' : ''} ${t.completed ? 'done' : ''}" data-id="${t.id}">
                <div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div>
                <div class="task-body" data-act="edit"><div class="t">${t.title}</div>${t.notes ? `<div class="n">${t.notes}</div>` : ''}<div class="m"><span class="${over ? 'red' : ''}">${dateStr}</span>${t.folder ? '<span>'+ (folderNames[t.folder]||t.folder) +'</span>' : ''}${t.repeat !== 'none' ? '<span>'+ (repeatNames[t.repeat]||t.repeat) +'</span>' : ''}${t.customReminders?.length ? '<span>'+ t.customReminders.length +' rem</span>' : ''}</div></div>
                <span class="pdot ${t.priority}"></span></div>`;
        }).join('');
        this.attachTasks(container);
        this.attachSwipes(container);
    },

    attachTasks(container) {
        container.querySelectorAll('.task').forEach(item => item.onclick = function(e) {
            const act = e.target.closest('[data-act]')?.dataset?.act;
            if (act === 'check') { if (app.tg) app.tg.HapticFeedback?.notificationOccurred('success'); store.toggle(item.dataset.id); app.renderTasks(document.querySelector('.chip.on')?.dataset.filter || 'all'); app.renderHome(); }
            else if (act === 'edit') app.openModal(item.dataset.id);
        });
    },

    attachSwipes(container) {
        let sx = 0, sy = 0;
        container.querySelectorAll('.task').forEach(item => {
            item.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; item.style.transition = 'none'; }, { passive: true });
            item.addEventListener('touchmove', e => {
                const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
                    e.preventDefault();
                    const c = Math.max(-120, Math.min(120, dx));
                    item.style.transform = `translateX(${c}px)`;
                    item.style.opacity = 1 - Math.abs(c) / 120 * 0.3;
                    item.classList.toggle('swipe-delete', c < -40);
                    item.classList.toggle('swipe-complete', c > 40);
                }
            }, { passive: false });
            item.addEventListener('touchend', () => {
                item.style.transition = 'all 0.3s ease'; item.style.transform = ''; item.style.opacity = '';
                if (item.classList.contains('swipe-delete')) { item.classList.remove('swipe-delete'); if (confirm(i18n.t('deleteConfirm'))) { if (app.tg) app.tg.HapticFeedback?.notificationOccurred('warning'); store.remove(item.dataset.id); app.refresh(); } }
                else if (item.classList.contains('swipe-complete')) { item.classList.remove('swipe-complete'); if (app.tg) app.tg.HapticFeedback?.notificationOccurred('success'); store.toggle(item.dataset.id); app.refresh(); }
            });
        });
    },

    renderCalendar() {
        const y = this.calDate.getFullYear(), m = this.calDate.getMonth();
        document.getElementById('monthTitle').textContent = new Date(y, m).toLocaleDateString(i18n.current === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' });
        const offset = (new Date(y, m, 1).getDay() + 6) % 7, last = new Date(y, m + 1, 0).getDate(), grid = document.getElementById('calGrid');
        const dn = i18n.current === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        document.querySelectorAll('.cal-weekdays span').forEach((s, i) => { if (dn[i]) s.textContent = dn[i]; });
        let h = ''; for (let i = 0; i < offset; i++) h += '<div class="cal-day dim"></div>';
        const today = new Date();
        for (let d = 1; d <= last; d++) {
            const date = new Date(y, m, d), has = store.getByDate(date).length > 0, isT = date.toDateString() === today.toDateString(), isS = this.selDate && date.toDateString() === this.selDate.toDateString();
            h += `<div class="cal-day ${isT ? 'now' : ''} ${isS ? 'sel' : ''} ${has ? 'dot' : ''}" data-date="${date.toISOString()}">${d}</div>`;
        }
        grid.innerHTML = h;
        grid.querySelectorAll('.cal-day[data-date]').forEach(day => day.onclick = () => { grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('sel')); day.classList.add('sel'); this.selDate = new Date(day.dataset.date); this.renderCalTasks(); });
    },

    renderCalTasks() {
        const tasks = store.getByDate(this.selDate), c = document.getElementById('calTasks');
        if (!tasks.length) { c.innerHTML = `<div class="empty">${i18n.t('noTasksDate')}</div>`; return; }
        c.innerHTML = tasks.map(t => `<div class="task" data-id="${t.id}"><div class="task-check ${t.completed ? 'on' : ''}" data-act="check"></div><div class="task-body" data-act="edit"><div class="t">${t.title}</div></div><span class="pdot ${t.priority}"></span></div>`).join('');
        this.attachTasks(c);
    },

    renderFolders() {
        const folders = store.getFolders(), c = document.getElementById('settingsFolderList'), all = store.getAll();
        c.innerHTML = folders.map(f => `<div class="folder-row"><div class="folder-dot" style="background:${f.color}"></div><span>${f.name}</span><span class="folder-num">${all.filter(t => t.folder === f.id).length}</span><div class="folder-row-actions"><button class="folder-edit-btn" data-edit="${f.id}">✎</button><button class="folder-del-btn" data-del="${f.id}">✕</button></div></div>`).join('');
        c.querySelectorAll('.folder-edit-btn').forEach(b => b.onclick = e => { e.stopPropagation(); this.editFolder(b.dataset.edit); });
        c.querySelectorAll('.folder-del-btn').forEach(b => b.onclick = e => { e.stopPropagation(); this.deleteFolder(b.dataset.del); });
    },

    addFolder() { const n = prompt(i18n.t('folderNamePrompt')); if (n?.trim()) { store.addFolder(n.trim(), ['#7c5ce7','#2ecc71','#4A90D9','#f97316','#e74c3c','#f39c12'][Math.floor(Math.random()*6)]); this.renderFolders(); } },
    editFolder(id) { const f = store.getFolders().find(x => x.id === id); if (f) { const n = prompt(i18n.t('folderRenamePrompt'), f.name); if (n?.trim()) { store.updateFolder(id, n.trim()); this.renderFolders(); } } },
    deleteFolder(id) { const f = store.getFolders().find(x => x.id === id); if (f && confirm(i18n.t('deleteFolderConfirm'))) { store.removeFolder(id); this.renderFolders(); } },

    openModal(id) {
        this.editingId = id;
        document.getElementById('delBtn').style.display = id ? 'block' : 'none';
        document.getElementById('modalTitle').textContent = id ? i18n.t('editReminder') : i18n.t('newReminder');
        document.getElementById('inpTitle').placeholder = i18n.t('taskName');
        document.getElementById('inpDesc').placeholder = i18n.t('notes');
        document.querySelectorAll('.modal-box label').forEach((l, i) => { const k = ['deadline','priority','folder','repeat','remindBefore','customReminders']; if (k[i]) l.textContent = i18n.t(k[i]); });
        document.getElementById('delBtn').textContent = i18n.t('delete');
        document.getElementById('saveBtn').textContent = i18n.t('save');
        document.getElementById('addCustomReminderBtn').textContent = i18n.t('addReminder');

        const fs = document.getElementById('inpFolder');
        fs.innerHTML = '<option value="">' + i18n.t('none') + '</option>';
        store.getFolders().forEach(f => fs.innerHTML += `<option value="${f.id}">${f.name}</option>`);

        document.getElementById('customRemindersList').innerHTML = '';
        if (id) {
            const t = store.getAll().find(x => x.id === id);
            if (t) {
                document.getElementById('inpTitle').value = t.title;
                document.getElementById('inpDesc').value = t.notes || '';
                document.getElementById('inpDeadline').value = t.deadline?.slice(0, 16) || '';
                document.getElementById('inpFolder').value = t.folder || '';
                document.getElementById('inpRepeat').value = t.repeat || 'none';
                document.getElementById('inpRemind').value = t.remindBefore || 0;
                document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('on'));
                document.querySelector(`.prio-btn[data-p="${t.priority}"]`)?.classList.add('on');
                t.customReminders?.forEach(m => { let v = m, u = 'minutes'; if (m >= 1440 && m % 1440 === 0) { v = m/1440; u = 'days'; } else if (m >= 60 && m % 60 === 0) { v = m/60; u = 'hours'; } this.addCustomReminder(v, u); });
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

    closeModal() { document.getElementById('modal').classList.remove('show'); document.body.classList.remove('modal-open'); this.editingId = null; },

    addCustomReminder(v, u) {
        v = v || ''; u = u || 'minutes';
        const row = document.createElement('div'); row.className = 'reminder-row';
        row.innerHTML = `<input type="number" class="reminder-value" placeholder="5" value="${v}" min="1" style="width:60px"><select class="reminder-unit"><option value="minutes" ${u==='minutes'?'selected':''}>min</option><option value="hours" ${u==='hours'?'selected':''}>hours</option><option value="days" ${u==='days'?'selected':''}>days</option></select><span style="color:rgba(255,255,255,0.4);font-size:12px">${i18n.t('before')}</span><button class="reminder-remove">✕</button>`;
        row.querySelector('.reminder-remove').onclick = () => row.remove();
        document.getElementById('customRemindersList').appendChild(row);
    },

    getCustomReminders() {
        return Array.from(document.querySelectorAll('.reminder-row')).map(r => {
            const v = parseInt(r.querySelector('.reminder-value')?.value) || 0, u = r.querySelector('.reminder-unit')?.value || 'minutes';
            return u === 'minutes' ? v : u === 'hours' ? v * 60 : v * 1440;
        }).filter(m => m > 0);
    },

    async saveTask() {
        const inpTitle = document.getElementById('inpTitle');
        const title = inpTitle?.value?.trim();
        if (!title) {
            if (this.tg) this.tg.showAlert(i18n.t('enterTaskName'));
            return;
        }
        
        // Исправляем формат даты
        let deadline = document.getElementById('inpDeadline')?.value || null;
        if (deadline) {
            deadline = deadline.replace(' ', 'T') + ':00+00:00';
        }
        
        const data = {
            title,
            description: document.getElementById('inpDesc')?.value?.trim() || '',
            deadline: deadline,
            priority: document.querySelector('.prio-btn.on')?.dataset.p || 'medium',
            folder_id: document.getElementById('inpFolder')?.value || null,
            repeat_type: document.getElementById('inpRepeat')?.value || 'none',
            remind_before: parseInt(document.getElementById('inpRemind')?.value || '0'),
            custom_reminders: this.getCustomReminders(),
        };
    
        if (this.editingId) {
            await store.update(this.editingId, data);
        } else {
            await store.add(data);
        }
    
        if (this.tg) {
            this.tg.HapticFeedback?.notificationOccurred('success');
        }
    
        this.closeModal();
        this.refresh();
    },

    deleteTask() {
        if (this.editingId && confirm(i18n.t('deleteConfirm'))) { store.remove(this.editingId); this.closeModal(); this.refresh(); }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());