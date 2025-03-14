class ShortcutComponent {
    constructor(app) {
        this.app = app;
        this.grid = document.getElementById('shortcuts-grid');
        this.modal = document.getElementById('shortcut-modal');
        this.form = document.getElementById('shortcut-form');
        this.addButton = document.getElementById('add-shortcut-fab');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.addButton.addEventListener('click', () => this.openModal());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('shortcut-cancel').addEventListener('click', () => this.closeModal());

        // Initialize drag and drop for shortcuts
        this.initializeDragAndDrop();

        // Initialize keyboard shortcuts
        this.initializeKeyboardShortcuts();
    }

    openModal(shortcut = null) {
        this.modal.classList.add('active');
        const categorySelect = document.getElementById('shortcut-category');
        
        // Populate categories
        categorySelect.innerHTML = this.app.categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        if (shortcut) {
            // Edit mode
            document.getElementById('shortcut-name').value = shortcut.name;
            document.getElementById('shortcut-url').value = shortcut.url;
            document.getElementById('shortcut-category').value = shortcut.category;
            document.getElementById('shortcut-icon').value = shortcut.customIcon || '';
            document.getElementById('shortcut-favorite').checked = shortcut.isFavorite;
            this.form.dataset.editId = shortcut.id;
        } else {
            // Add mode
            this.form.reset();
            delete this.form.dataset.editId;
        }
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const shortcutData = {
            name: formData.get('shortcut-name'),
            url: formData.get('shortcut-url'),
            category: formData.get('shortcut-category'),
            customIcon: formData.get('shortcut-icon'),
            isFavorite: formData.get('shortcut-favorite') === 'on'
        };

        if (this.form.dataset.editId) {
            // Update existing shortcut
            await this.app.updateShortcut(this.form.dataset.editId, shortcutData);
        } else {
            // Add new shortcut
            await this.app.addShortcut(shortcutData);
        }

        this.closeModal();
        this.render();
    }

    render(shortcuts = null) {
        const shortcutsToRender = shortcuts || this.app.shortcuts;
        this.grid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        shortcutsToRender.forEach(shortcut => {
            const tile = this.createShortcutTile(shortcut);
            fragment.appendChild(tile);
        });

        this.grid.appendChild(fragment);
    }

    createShortcutTile(shortcut) {
        const tile = Utils.createElement('div', {
            className: 'shortcut-tile',
            'data-id': shortcut.id,
            draggable: 'true'
        });

        const icon = shortcut.customIcon || Utils.getFaviconUrl(shortcut.url);
        const category = this.app.categories.find(c => c.id === shortcut.category);

        tile.innerHTML = `
            <div class="icon">
                <img src="${icon}" alt="${shortcut.name}" onerror="this.src='assets/icons/default.png'">
            </div>
            <div class="name">${shortcut.name}</div>
            <div class="url">${shortcut.url}</div>
            ${shortcut.isFavorite ? '<div class="favorite">⭐</div>' : ''}
            ${category ? `<div class="category" style="background-color: ${category.color}">${category.name}</div>` : ''}
        `;

        tile.addEventListener('click', () => this.handleShortcutClick(shortcut));
        tile.addEventListener('contextmenu', (e) => this.handleContextMenu(e, shortcut));

        return tile;
    }

    handleShortcutClick(shortcut) {
        // Track usage
        this.app.trackShortcutUsage(shortcut.id);
        // Open URL in new tab
        window.open(shortcut.url, '_blank');
    }

    handleContextMenu(e, shortcut) {
        e.preventDefault();
        // Create and show context menu
        const menu = Utils.createElement('div', {
            className: 'context-menu',
            style: `top: ${e.pageY}px; left: ${e.pageX}px`
        });

        const menuItems = [
            { text: 'Edit', icon: '✏️', action: () => this.openModal(shortcut) },
            { text: 'Delete', icon: '🗑️', action: () => this.app.deleteShortcut(shortcut.id) },
            { text: 'Copy URL', icon: '📋', action: () => navigator.clipboard.writeText(shortcut.url) },
            { text: shortcut.isFavorite ? 'Remove from Favorites' : 'Add to Favorites', 
              icon: shortcut.isFavorite ? '⭐' : '☆', 
              action: () => this.app.toggleFavorite(shortcut.id) }
        ];

        menuItems.forEach(item => {
            const menuItem = Utils.createElement('div', {
                className: 'context-menu-item'
            }, [`${item.icon} ${item.text}`]);
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);
        document.addEventListener('click', () => menu.remove(), { once: true });
    }

    initializeDragAndDrop() {
        this.grid.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('shortcut-tile')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            }
        });

        this.grid.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('shortcut-tile')) {
                e.target.classList.remove('dragging');
            }
        });

        this.grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.grid, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement) {
                this.grid.insertBefore(draggable, afterElement);
            } else {
                this.grid.appendChild(draggable);
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.shortcut-tile:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
            // Ctrl/Cmd + N to add new shortcut
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openModal();
            }
        });
    }
}