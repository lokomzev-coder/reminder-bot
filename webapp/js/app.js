const app = {
    tg: null,

    init() {
        this.tg = window.Telegram?.WebApp;
        if (this.tg) {
            this.tg.ready();
            this.tg.expand();
            this.tg.setHeaderColor('#0d0d1a');
            this.tg.setBackgroundColor('#0d0d1a');
        }

        document.querySelector('.invite-card')?.addEventListener('click', () => {
            if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
        });

        document.querySelectorAll('.task-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.task-row-check')) {
                    if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
                }
            });
        });

        document.querySelectorAll('.task-row-check').forEach(check => {
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.tg) this.tg.HapticFeedback?.notificationOccurred('success');
                const row = check.closest('.task-row');
                row.style.opacity = '0.4';
                row.style.transition = 'all 0.3s ease';
                row.style.transform = 'translateX(8px)';
                setTimeout(() => {
                    row.style.maxHeight = '0';
                    row.style.padding = '0';
                    row.style.margin = '0';
                    row.style.border = 'none';
                    row.style.opacity = '0';
                }, 250);
            });
        });

        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                if (this.tg) this.tg.HapticFeedback?.impactOccurred('light');
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());