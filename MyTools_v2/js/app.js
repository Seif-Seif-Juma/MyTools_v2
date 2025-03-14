class MyToolsApp {
    constructor() {
        this.shortcuts = [];
        this.categories = [];
        this.settings = new Settings();
        
        // Initialize components
        this.categoryComponent = new CategoryComponent(this);
        this.shortcutComponent = new ShortcutComponent(this);
        this.statisticsComponent = new StatisticsComponent(this);
        
        // Initialize theme
        this.initializeTheme();
        
        // Load data
        this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    }

    initializeTheme() {
        if (this.settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.querySelector('#theme-toggle i').classList.replace('fa-sun', 'fa-moon');
        }
    }

    loadData() {
        // Load settings
        const savedSettings = Utils.storage.get('settings');
        if (savedSettings) {
            this.settings = new Settings(savedSettings);
        }

        // Load categories
        const savedCategories = Utils.storage.get('categories') || [];
        this.categories = savedCategories.map(data => new Category(data));

        // Load shortcuts
        const savedShortcuts = Utils.storage.get('shortcuts') || [];
        this.shortcuts = savedShortcuts.map(data => new Shortcut(data));
    }

    saveData() {
        Utils.storage.set('settings', this.settings.toJSON());
        Utils.storage.set('categories', this.categories.map(c => c.toJSON()));
        Utils.storage.set('shortcuts', this.shortcuts.map(s => s.toJSON()));
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // View toggle
        document.getElementById('grid-view').addEventListener('click', () => this.setViewMode('grid'));
        document.getElementById('list-view').addEventListener('click', () => this.setViewMode('list'));

        // Search
        const searchInput = document.getElementById('search-input');
        const debouncedSearch = Utils.debounce(() => {
            this.filterShortcuts();
        }, 300);
        searchInput.addEventListener('input', debouncedSearch);

        // Sort
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.settings.sortBy = e.target.value;
            this.saveData();
            this.render();
        });

        // Auto-save data when window closes
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('#theme-toggle i');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            this.settings.theme = 'light';
        } else {
            body.classList.add('dark-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            this.settings.theme = 'dark';
        }
        
        this.saveData();
    }

    setViewMode(mode) {
        const grid = document.getElementById('shortcuts-grid');
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');

        if (mode === 'list') {
            grid.classList.add('list-view');
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        } else {
            grid.classList.remove('list-view');
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        }

        this.settings.viewMode = mode;
        this.saveData();
    }

    filterShortcuts() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filterType = document.getElementById('search-filter').value;
        
        let filtered = this.shortcuts;

        if (searchTerm) {
            filtered = filtered.filter(shortcut => {
                switch (filterType) {
                    case 'name':
                        return shortcut.name.toLowerCase().includes(searchTerm);
                    case 'url':
                        return shortcut.url.toLowerCase().includes(searchTerm);
                    case 'category':
                        const category = this.categories.find(c => c.id === shortcut.category);
                        return category && category.name.toLowerCase().includes(searchTerm);
                    default:
                        return shortcut.name.toLowerCase().includes(searchTerm) ||
                               shortcut.url.toLowerCase().includes(searchTerm) ||
                               shortcut.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                }
            });
        }

        this.shortcutComponent.render(filtered);
    }

    sortShortcuts(shortcuts) {
        const sortBy = this.settings.sortBy;
        return [...shortcuts].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'recent':
                    return new Date(b.lastAccessed || 0) - new Date(a.lastAccessed || 0);
                case 'popular':
                    return b.accessCount - a.accessCount;
                case 'category':
                    const catA = this.categories.find(c => c.id === a.category)?.name || '';
                    const catB = this.categories.find(c => c.id === b.category)?.name || '';
                    return catA.localeCompare(catB);
                default:
                    return 0;
            }
        });
    }

    // Category Management
    async addCategory(data) {
        const category = new Category(data);
        this.categories.push(category);
        this.saveData();
        this.categoryComponent.render();
        return category;
    }

    async updateCategory(id, data) {
        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) {
            this.categories[index] = new Category({ ...this.categories[index], ...data });
            this.saveData();
            this.categoryComponent.render();
            this.shortcutComponent.render();
        }
    }

    async deleteCategory(id) {
        this.categories = this.categories.filter(c => c.id !== id);
        // Update shortcuts with deleted category
        this.shortcuts.forEach(s => {
            if (s.category === id) {
                s.category = 'uncategorized';
            }
        });
        this.saveData();
        this.render();
    }

    // Shortcut Management
    async addShortcut(data) {
        const shortcut = new Shortcut(data);
        this.shortcuts.push(shortcut);
        this.saveData();
        this.render();
        return shortcut;
    }

    async updateShortcut(id, data) {
        const index = this.shortcuts.findIndex(s => s.id === id);
        if (index !== -1) {
            this.shortcuts[index] = new Shortcut({ ...this.shortcuts[index], ...data });
            this.saveData();
            this.render();
        }
    }

    async deleteShortcut(id) {
        this.shortcuts = this.shortcuts.filter(s => s.id !== id);
        this.saveData();
        this.render();
    }

    trackShortcutUsage(id) {
        const shortcut = this.shortcuts.find(s => s.id === id);
        if (shortcut) {
            shortcut.accessCount++;
            shortcut.lastAccessed = new Date().toISOString();
            this.saveData();
        }
    }

    toggleFavorite(id) {
        const shortcut = this.shortcuts.find(s => s.id === id);
        if (shortcut) {
            shortcut.isFavorite = !shortcut.isFavorite;
            this.saveData();
            this.render();
        }
    }

    render() {
        const sortedShortcuts = this.sortShortcuts(this.shortcuts);
        this.categoryComponent.render();
        this.shortcutComponent.render(sortedShortcuts);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MyToolsApp();
});
