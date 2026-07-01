const app = {
    tg: null,

    async init() {
        this.tg = Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        this.tg.setHeaderColor('#0d081a');
        this.tg.setBackgroundColor('#0d081a');
        this.tg.setBottomBarColor('#0d081a');

        document.getElementById('ctaCard').addEventListener('click', () => {
            this.tg.HapticFeedback.impactOccurred('light');
            this.openCreateModal();
        });

        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.task-check-btn')) {
                    this.tg.HapticFeedback.impactOccurred('light');
                    const name = card.querySelector('.task-name').textContent;
                    this.tg.showAlert(`Задача: ${name}`);
                }
            });
        });

        document.querySelectorAll('.task-check-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.tg.HapticFeedback.notificationOccurred('success');
                const card = btn.closest('.task-card');
                card.style.opacity = '0.5';
                card.style.textDecoration = 'line-through';
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(20px)';
                    card.style.maxHeight = '0';
                    card.style.padding = '0';
                    card.style.margin = '0';
                    card.style.border = 'none';
                }, 300);
            });
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.tg.HapticFeedback.impactOccurred('light');
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },

    openCreateModal() {
        this.tg.showPopup({
            title: 'New Reminder',
            message: 'Create a new reminder with flexible settings',
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Cancel' },
                { id: 'create', type: 'ok', text: 'Create' }
            ]
        }, (btnId) => {
            if (btnId === 'create') {
                this.tg.HapticFeedback.notificationOccurred('success');
                this.tg.showAlert('Reminder created');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());