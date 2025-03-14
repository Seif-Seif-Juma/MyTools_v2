// Base Model Class
class Model {
    constructor(data = {}) {
        this.id = data.id || Date.now().toString();
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

// Shortcut Model
class Shortcut extends Model {
    constructor(data = {}) {
        super(data);
        this.name = data.name || '';
        this.url = data.url || '';
        this.category = data.category || 'uncategorized';
        this.icon = data.icon || '';
        this.isFavorite = data.isFavorite || false;
        this.lastAccessed = data.lastAccessed || null;
        this.accessCount = data.accessCount || 0;
        this.customIcon = data.customIcon || null;
        this.tags = data.tags || [];
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            url: this.url,
            category: this.category,
            icon: this.icon,
            isFavorite: this.isFavorite,
            lastAccessed: this.lastAccessed,
            accessCount: this.accessCount,
            customIcon: this.customIcon,
            tags: this.tags
        };
    }
}

// Category Model
class Category extends Model {
    constructor(data = {}) {
        super(data);
        this.name = data.name || '';
        this.color = data.color || '#2196f3';
        this.icon = data.icon || '📁';
        this.order = data.order || 0;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            color: this.color,
            icon: this.icon,
            order: this.order
        };
    }
}

// Settings Model
class Settings extends Model {
    constructor(data = {}) {
        super(data);
        this.theme = data.theme || 'light';
        this.viewMode = data.viewMode || 'grid';
        this.sortBy = data.sortBy || 'name';
        this.tileSize = data.tileSize || 'medium';
        this.autoBackup = data.autoBackup !== undefined ? data.autoBackup : true;
        this.lastBackup = data.lastBackup || null;
        this.customColors = data.customColors || {
            primary: '#2196f3',
            secondary: '#ffffff',
            text: '#333333'
        };
    }

    toJSON() {
        return {
            ...super.toJSON(),
            theme: this.theme,
            viewMode: this.viewMode,
            sortBy: this.sortBy,
            tileSize: this.tileSize,
            autoBackup: this.autoBackup,
            lastBackup: this.lastBackup,
            customColors: this.customColors
        };
    }
}