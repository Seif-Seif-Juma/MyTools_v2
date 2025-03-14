class StatisticsComponent {
    constructor(app) {
        this.app = app;
        this.modal = document.getElementById('stats-modal');
        this.mostUsedStats = document.getElementById('most-used-stats');
        this.recentActivity = document.getElementById('recent-activity');
        this.categoryStats = document.getElementById('category-stats');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('view-stats').addEventListener('click', () => this.openModal());
        document.getElementById('stats-close').addEventListener('click', () => this.closeModal());
    }

    openModal() {
        this.modal.classList.add('active');
        this.render();
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    render() {
        this.renderMostUsed();
        this.renderRecentActivity();
        this.renderCategoryStats();
    }

    renderMostUsed() {
        const mostUsed = [...this.app.shortcuts]
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 5);

        this.mostUsedStats.innerHTML = mostUsed.map(shortcut => `
            <div class="stat-item">
                <div class="stat-name">${shortcut.name}</div>
                <div class="stat-value">${shortcut.accessCount} uses</div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const recent = [...this.app.shortcuts]
            .filter(s => s.lastAccessed)
            .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
            .slice(0, 5);

        this.recentActivity.innerHTML = recent.map(shortcut => `
            <div class="stat-item">
                <div class="stat-name">${shortcut.name}</div>
                <div class="stat-value">${Utils.timeAgo(shortcut.lastAccessed)}</div>
            </div>
        `).join('');
    }

    renderCategoryStats() {
        const categoryCount = {};
        this.app.shortcuts.forEach(shortcut => {
            categoryCount[shortcut.category] = (categoryCount[shortcut.category] || 0) + 1;
        });

        const categoryStats = Object.entries(categoryCount)
            .map(([categoryId, count]) => {
                const category = this.app.categories.find(c => c.id === categoryId);
                return { name: category?.name || 'Uncategorized', count, color: category?.color };
            });

        this.categoryStats.innerHTML = categoryStats.map(stat => `
            <div class="stat-item">
                <div class="stat-name" style="color: ${stat.color}">${stat.name}</div>
                <div class="stat-value">${stat.count} shortcuts</div>
            </div>
        `).join('');
    }
}