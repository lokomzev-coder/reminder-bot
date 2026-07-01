const UI = {
    // Отрисовка вкладок папок
    renderFolders(folders, activeFolderId = null) {
        const container = document.getElementById('foldersList');
        container.innerHTML = '<button class="tab active" data-folder="">📋 Все</button>';
        
        folders.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'tab';
            btn.dataset.folder = folder.id;
            btn.textContent = `${folder.icon || '📁'} ${folder.name}`;
            if (folder.id === activeFolderId) btn.classList.add('active');
            container.appendChild(btn);
        });
    },

    // Отрисовка списка задач
    renderTasks(tasks) {
        const container = document.getElementById('tasksList');
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <p>Нет активных задач</p>
                    <button class="btn-primary" onclick="app.openCreateModal()">Создать первую</button>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-card ${task.is_completed ? 'completed' : ''}" 
                 onclick="app.toggleTask('${task.id}', ${!task.is_completed})">
                <div class="task-header">
                    <span class="task-title">${task.title}</span>
                    <span class="task-folder" style="background: ${task.folder_color || '#333'}20; color: ${task.folder_color || '#aaa'}">
                        ${task.folder_icon || '📁'} ${task.folder_name || 'Без папки'}
                    </span>
                </div>
                ${task.deadline ? `
                <div class="task-deadline ${UI.isUrgent(task.deadline) ? 'urgent' : ''}">
                    ⏰ ${UI.formatDate(task.deadline)}
                </div>` : ''}
            </div>
        `).join('');
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) return 'Просрочено';
        if (days > 0) return `Через ${days} дн.`;
        if (hours > 0) return `Через ${hours} ч.`;
        return `Через ${minutes} мин.`;
    },

    isUrgent(dateString) {
        const diff = new Date(dateString) - new Date();
        return diff < 3600000; // Меньше часа
    },

    // Показать/скрыть модальное окно
    toggleModal(show) {
        const modal = document.getElementById('modalCreate');
        modal.classList.toggle('active', show);
    },

    // Очистить форму
    clearForm() {
        document.getElementById('inputTitle').value = '';
        document.getElementById('inputDescription').value = '';
        document.getElementById('inputDeadline').value = '';
        document.getElementById('selectRemindBefore').value = '0';
        document.getElementById('selectRepeat').value = 'none';
    }
};