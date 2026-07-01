class Store {
    constructor() {
        this.key = 'reminder_bot_tasks';
        this.tasks = this.load();
        if (!this.tasks.length) {
            this.seed();
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    save() {
        localStorage.setItem(this.key, JSON.stringify(this.tasks));
    }

    seed() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 86400000);
        const tomorrow = new Date(today.getTime() + 86400000);

        this.tasks = [
            { id: '1', title: 'Design review', notes: 'Check new mockups', deadline: new Date(today.getTime() + 14.5*3600000).toISOString(), priority: 'medium', folder: 'work', repeat: 'none', remindBefore: 15, subtasks: ['Check colors', 'Verify spacing'], completed: false, createdAt: Date.now() },
            { id: '2', title: 'Weekly report', notes: 'Send to manager', deadline: yesterday.toISOString(), priority: 'high', folder: 'work', repeat: 'weekly', remindBefore: 30, subtasks: [], completed: false, createdAt: Date.now() - 86400000 },
            { id: '3', title: 'Team standup', notes: '', deadline: new Date(today.getTime() + 16*3600000).toISOString(), priority: 'low', folder: 'work', repeat: 'daily', remindBefore: 5, subtasks: [], completed: false, createdAt: Date.now() },
            { id: '4', title: 'Gym session', notes: 'Leg day', deadline: new Date(today.getTime() + 18*3600000).toISOString(), priority: 'medium', folder: 'personal', repeat: 'none', remindBefore: 60, subtasks: ['Warm up', 'Squats', 'Stretching'], completed: false, createdAt: Date.now() },
            { id: '5', title: 'Read chapter 5', notes: 'History textbook', deadline: tomorrow.toISOString(), priority: 'low', folder: 'study', repeat: 'none', remindBefore: 1440, subtasks: [], completed: false, createdAt: Date.now() },
            { id: '6', title: 'Update documentation', notes: 'API docs', deadline: new Date(today.getTime() + 7*86400000).toISOString(), priority: 'medium', folder: 'work', repeat: 'none', remindBefore: 0, subtasks: [], completed: false, createdAt: Date.now() },
            { id: '7', title: 'Buy groceries', notes: '', deadline: new Date(today.getTime() + 2*86400000).toISOString(), priority: 'low', folder: 'personal', repeat: 'weekly', remindBefore: 0, subtasks: ['Milk', 'Bread', 'Eggs'], completed: true, createdAt: Date.now() - 172800000 }
        ];
        this.save();
    }

    getAll() { return [...this.tasks]; }

    getActive() { return this.tasks.filter(t => !t.completed); }

    getToday() {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const end = new Date(start.getTime() + 86400000);
        return this.tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) >= start && new Date(t.deadline) < end);
    }

    getOverdue() {
        const now = new Date();
        return this.tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now);
    }

    getUpcoming() {
        const now = new Date();
        return this.tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) >= now);
    }

    getByDate(date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const end = new Date(start.getTime() + 86400000);
        return this.tasks.filter(t => t.deadline && new Date(t.deadline) >= start && new Date(t.deadline) < end);
    }

    add(task) {
        task.id = Date.now().toString();
        task.createdAt = Date.now();
        task.completed = false;
        task.subtasks = task.subtasks || [];
        this.tasks.unshift(task);
        this.save();
        return task;
    }

    update(id, updates) {
        const idx = this.tasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            this.tasks[idx] = { ...this.tasks[idx], ...updates };
            this.save();
        }
    }

    toggle(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.save();
        }
    }

    remove(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
    }
}

const store = new Store();