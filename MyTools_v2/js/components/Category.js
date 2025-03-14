class CategoryComponent {
    constructor(app) {
        this.app = app;
        this.categoryList = document.getElementById('category-list');
        this.modal = document.getElementById('category-modal');
        this.form = document.getElementById('category-form');
        this.addButton = document.getElementById('add-category');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.addButton.addEventListener('click', () => this.openModal());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('category-cancel').addEventListener('click', () => this.closeModal());

        // Initialize drag and drop for categories
        this.initializeDragAndDrop();
    }

    openModal(category = null) {
        this.modal.classList.add('active');
        if (category) {
            // Edit mode
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-color').value = category.color;
            document.getElementById('category-icon').value = category.icon;
            this.form.dataset.editId = category.id;
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
        const categoryData = {
            name: formData.get('category-name'),
            color: formData.get('category-color'),
            icon: formData.get('category-icon') || '📁'
        };

        if (this.form.dataset.editId) {
            // Update existing category
            await this.app.updateCategory(this.form.dataset.editId, categoryData);
        } else {
            // Add new category
            await this.app.addCategory(categoryData);
        }

        this.closeModal();
        this.render();
    }

    render() {
        this.categoryList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        this.app.categories.forEach(category => {
            const btn = Utils.createElement('button', {
                className: 'category-btn',
                'data-category': category.id,
                style: `background-color: ${category.color}`,
                draggable: 'true'
            }, [`${category.icon} ${category.name}`]);

            btn.addEventListener('click', () => this.app.filterByCategory(category.id));
            fragment.appendChild(btn);
        });

        this.categoryList.appendChild(fragment);
    }

    initializeDragAndDrop() {
        this.categoryList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('category-btn')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.category);
            }
        });

        this.categoryList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('category-btn')) {
                e.target.classList.remove('dragging');
            }
        });

        this.categoryList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(e.clientX);
            const draggable = document.querySelector('.dragging');
            if (afterElement) {
                this.categoryList.insertBefore(draggable, afterElement);
            } else {
                this.categoryList.appendChild(draggable);
            }
        });
    }

    getDragAfterElement(x) {
        const draggableElements = [...this.categoryList.querySelectorAll('.category-btn:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}