const UI = {
    // Переключение вкладок навигации
    switchView(viewName) {
        document.querySelectorAll('.nav-icon').forEach(icon => icon.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

        const icon = document.querySelector(`[data-view="${viewName}"]`);
        if (icon) icon.classList.add('active');

        const view = document.getElementById(`view-${viewName}`);
        if (view) view.classList.add('active');
    },

    // Отрисовка тегов папок
    renderFolderTags(folders, activeId = null) {
        const row = document.getElementById('foldersRow');
        row.innerHTML = '<button class="folder-tag active" data-folder="">Все</button>';
        folders.forEach(f => {
            const btn = document.createElement('button');
            btn.className = 'folder-tag';
            btn.dataset.folder = f.id;
            btn.textContent = f.name;
            if (f.id === activeId) btn.classList.add('active');
            row.appendChild(btn);
        });
    },

    // Отрисовка списка задач
    renderTasks(tasks, containerId = 'tasksFullList') {
        const container = document.getElementById(containerId);
        if (!tasks || tasks.length === 0) {
            container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">Нет задач</div>`;
            return;
        }
        container.innerHTML = tasks.map(t => `
            <div class="task-row ${t.is_completed ? 'completed' : ''}" data-id="${t.id}">
                <div class="task-check"></div>
                <div class="task-info-row">
                    <div class="task-title-row">${t.title}</div>
                    <div class="task-meta-row">
                        ${t.deadline ? `<span>${UI.formatDate(t.deadline)}</span>` : ''}
                        ${t.folder_name ? `<span class="task-folder-tag">${t.folder_name}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Отрисовка сетки папок
    renderFoldersGrid(folders) {
        const grid = document.getElementById('foldersGrid');
        if (!folders.length) {
            grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">Нет папок</div>`;
            return;
        }
        grid.innerHTML = folders.map(f => `
            <div class="folder-card" data-id="${f.id}">
                <div class="folder-card-name">${f.name}</div>
                <div class="folder-card-count">${f.task_count || 0} задач</div>
            </div>
        `).join('');
    },

    // Отрисовка компактного списка на дашборде
    renderCompactTasks(tasks) {
        const container = document.getElementById('compactTaskList');
        const slice = tasks.slice(0, 4);
        container.innerHTML = slice.map(t => {
            const isOverdue = t.deadline && new Date(t.deadline) < new Date();
            return `
                <div class="compact-task ${isOverdue ? 'overdue' : ''}">
                    <div class="compact-status"></div>
                    <div class="compact-info">
                        <div class="compact-title">${t.title}</div>
                        <div class="compact-time">${isOverdue ? 'Просрочено' : UI.formatDate(t.deadline)}</div>
                    </div>
                </div>`;
        }).join('');
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const d = new Date(dateString);
        const now = new Date();
        const diff = d - now;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (diff < 0) return 'Просрочено';
        if (days > 0) return `${days} дн`;
        if (hours > 0) return `${hours} ч`;
        if (mins > 0) return `${mins} мин`;
        return 'Сейчас';
    },

    toggleModal(show) {
        const modal = document.getElementById('modalTask');
        modal.classList.toggle('active', show);
    },

    clearForm() {
        document.getElementById('inputTitle').value = '';
        document.getElementById('inputDescription').value = '';
        document.getElementById('inputDeadline').value = '';
        document.getElementById('selectRemindBefore').value = '0';
        document.getElementById('selectRepeat').value = 'none';
    },

    populateFolderSelect(folders) {
        const select = document.getElementById('selectFolder');
        select.innerHTML = '<option value="">Без папки</option>';
        folders.forEach(f => {
            select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });
    }
};