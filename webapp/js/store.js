class Store {
    constructor() {
        this.supabaseUrl = 'https://hscqeskjrffeniuobvve.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzY3Flc2tqcmZmZW5pdW9idnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTk0MjgsImV4cCI6MjA5ODQ5NTQyOH0.-8avQQqeQ0QVZbyRHhS41ctQptXu_9_JOgtJa7uTMj0';
        this.tasks = [];
        this.folders = [];
        this.userId = null;
        this.ready = false;
        this.listeners = [];
    }

    async init() {
        // Получаем ID пользователя из Telegram
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            this.userId = window.Telegram.WebApp.initDataUnsafe.user.id;
        } else {
            // Для тестов в браузере
            this.userId = parseInt(localStorage.getItem('test_user_id') || '123456789');
        }

        // Загружаем папки
        await this.loadFolders();
        
        // Загружаем задачи
        await this.loadTasks();
        
        this.ready = true;
        this.notifyListeners();
    }

    async loadTasks() {
        try {
            const resp = await fetch(
                `${this.supabaseUrl}/rest/v1/reminders?user_id=eq.${this.userId}&order=created_at.desc&limit=100`,
                {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (resp.ok) {
                this.tasks = await resp.json();
            } else {
                console.error('Failed to load tasks:', resp.status);
                this.tasks = this.loadLocal();
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.tasks = this.loadLocal();
        }
    }

    async loadFolders() {
        try {
            const resp = await fetch(
                `${this.supabaseUrl}/rest/v1/folders?user_id=eq.${this.userId}&order=created_at.asc`,
                {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (resp.ok) {
                this.folders = await resp.json();
            } else {
                this.folders = this.loadLocalFolders();
            }
        } catch (e) {
            this.folders = this.loadLocalFolders();
        }
        
        if (!this.folders.length) {
            // Создаём папки по умолчанию
            await this.createDefaultFolders();
        }
    }

    async createDefaultFolders() {
        const defaults = [
            { user_id: this.userId, name: 'Work', color: '#7c5ce7', icon: 'briefcase' },
            { user_id: this.userId, name: 'Personal', color: '#2ecc71', icon: 'person' },
            { user_id: this.userId, name: 'Study', color: '#4A90D9', icon: 'book' }
        ];
        for (const f of defaults) {
            await this.addFolderRemote(f);
        }
        await this.loadFolders();
    }

    async addFolderRemote(folder) {
        try {
            await fetch(`${this.supabaseUrl}/rest/v1/folders`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(folder)
            });
        } catch (e) {
            console.error('Error adding folder:', e);
        }
    }

    loadLocal() {
        try { return JSON.parse(localStorage.getItem('reminder_bot_tasks')) || []; } catch { return []; }
    }

    loadLocalFolders() {
        try { return JSON.parse(localStorage.getItem('reminder_folders')) || []; } catch { return []; }
    }

    saveLocal() {
        localStorage.setItem('reminder_bot_tasks', JSON.stringify(this.tasks));
    }

    // CRUD операции
    getAll() { return [...this.tasks]; }
    getActive() { return this.tasks.filter(t => !t.is_completed); }
    
    getToday() {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(start.getTime() + 86400000);
        return this.tasks.filter(t => !t.is_completed && t.deadline && new Date(t.deadline) >= start && new Date(t.deadline) < end);
    }
    
    getOverdue() {
        const now = new Date();
        return this.tasks.filter(t => !t.is_completed && t.deadline && new Date(t.deadline) < now);
    }
    
    getUpcoming() {
        const now = new Date();
        return this.tasks.filter(t => !t.is_completed && t.deadline && new Date(t.deadline) >= now);
    }
    
    getByDate(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(start.getTime() + 86400000);
        return this.tasks.filter(t => t.deadline && new Date(t.deadline) >= start && new Date(t.deadline) < end);
    }

    async add(task) {
        task.user_id = this.userId;
        task.created_at = new Date().toISOString();
        task.is_completed = false;
        
        try {
            const resp = await fetch(`${this.supabaseUrl}/rest/v1/reminders`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(task)
            });
            if (resp.ok) {
                const data = await resp.json();
                this.tasks.unshift(data[0]);
                this.saveLocal();
                this.notifyListeners();
                
                // Отправляем данные боту для расчёта next_remind_at
                if (window.Telegram?.WebApp) {
                    Telegram.WebApp.sendData(JSON.stringify({
                        action: 'create_reminder',
                        title: task.title,
                        notes: task.description || '',
                        deadline: task.deadline,
                        remind_before: task.remind_before || 0,
                        repeat: task.repeat_type || 'none',
                        customReminders: task.custom_reminders || [],
                        folder: task.folder_id
                    }));
                }
                return data[0];
            }
        } catch (e) {
            console.error('Error adding task:', e);
        }
        
        // Fallback: сохраняем локально
        task.id = Date.now().toString();
        this.tasks.unshift(task);
        this.saveLocal();
        this.notifyListeners();
        return task;
    }

    async update(id, updates) {
        const idx = this.tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            this.tasks[idx] = { ...this.tasks[idx], ...updates };
            this.saveLocal();
            this.notifyListeners();
        }
        
        try {
            await fetch(`${this.supabaseUrl}/rest/v1/reminders?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(updates)
            });
        } catch (e) {
            console.error('Error updating task:', e);
        }
    }

    async toggle(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.is_completed = !task.is_completed;
            this.saveLocal();
            this.notifyListeners();
            await this.update(id, { is_completed: task.is_completed });
        }
    }

    async remove(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveLocal();
        this.notifyListeners();
        
        try {
            await fetch(`${this.supabaseUrl}/rest/v1/reminders?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            console.error('Error deleting task:', e);
        }
    }

    // Папки
    getFolders() { return this.folders; }

    async addFolder(name, color) {
        const folder = { user_id: this.userId, name, color: color || '#7c5ce7', icon: 'folder' };
        await this.addFolderRemote(folder);
        await this.loadFolders();
        this.notifyListeners();
    }

    async updateFolder(id, name) {
        try {
            await fetch(`${this.supabaseUrl}/rest/v1/folders?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ name })
            });
            await this.loadFolders();
            this.notifyListeners();
        } catch (e) {
            console.error('Error updating folder:', e);
        }
    }

    async removeFolder(id) {
        try {
            // Убираем папку из задач
            const tasksInFolder = this.tasks.filter(t => t.folder_id === id);
            for (const t of tasksInFolder) {
                await this.update(t.id, { folder_id: null });
            }
            
            await fetch(`${this.supabaseUrl}/rest/v1/folders?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.supabaseKey,
                    'Authorization': `Bearer ${this.supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            });
            await this.loadFolders();
            this.notifyListeners();
        } catch (e) {
            console.error('Error deleting folder:', e);
        }
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb());
    }
}

const store = new Store();