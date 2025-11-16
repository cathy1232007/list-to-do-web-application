// Task class for better organization
class Task {
    constructor(id, text, completed = false, createdAt = new Date()) {
        this.id = id;
        this.text = text;
        this.completed = completed;
        this.createdAt = createdAt;
    }

    getFormattedDate() {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return this.createdAt.toLocaleDateString('en-US', options);
    }
}

// Main application class
class TodoApp {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingId = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Add task button and input
        document.getElementById('addBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear buttons
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (text === '') {
            alert('Please enter a task!');
            return;
        }

        if (text.length > 100) {
            alert('Task is too long! Maximum 100 characters.');
            return;
        }

        const id = Date.now();
        const task = new Task(id, text);
        this.tasks.push(task);
        input.value = '';
        input.focus();

        this.saveTasks();
        this.render();
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.render();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.showEditModal(task);
        }
    }

    showEditModal(task) {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('editInput');
        const saveBtn = document.getElementById('saveEditBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');

        input.value = task.text;
        this.editingId = task.id;
        modal.classList.add('show');
        input.focus();

        const save = () => this.saveEdit(task.id, input.value);
        const close = () => this.closeEditModal();

        saveBtn.onclick = save;
        cancelBtn.onclick = close;
        input.onkeypress = (e) => e.key === 'Enter' ? save() : null;
        modal.onclick = (e) => e.target === modal ? close() : null;
    }

    saveEdit(id, newText) {
        const text = newText.trim();
        if (text === '') {
            alert('Task cannot be empty!');
            return;
        }

        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = text;
            this.saveTasks();
            this.closeEditModal();
            this.render();
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('show');
        this.editingId = null;
    }

    clearCompleted() {
        if (confirm('Delete all completed tasks?')) {
            this.tasks = this.tasks.filter(task => !task.completed);
            this.saveTasks();
            this.render();
        }
    }

    clearAll() {
        if (confirm('Delete ALL tasks? This cannot be undone!')) {
            this.tasks = [];
            this.saveTasks();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(task => !task.completed);
            case 'completed':
                return this.tasks.filter(task => task.completed);
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('activeCount').textContent = active;
        document.getElementById('completedCount').textContent = completed;
    }

    render() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.classList.add('show');
        } else {
            emptyState.classList.remove('show');
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <div class="checkbox" onclick="app.toggleTask(${task.id})"></div>
                    <div class="task-content">
                        <div class="task-text">${this.escapeHtml(task.text)}</div>
                        <div class="task-meta">${task.getFormattedDate()}</div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.editTask(${task.id})">Edit</button>
                        <button class="delete-btn" onclick="app.deleteTask(${task.id})">Delete</button>
                    </div>
                `;
                taskList.appendChild(li);
            });
        }

        this.updateStats();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks.map(t => ({
            id: t.id,
            text: t.text,
            completed: t.completed,
            createdAt: t.createdAt
        }))));
    }

    loadTasks() {
        const stored = localStorage.getItem('tasks');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.tasks = data.map(t => new Task(t.id, t.text, t.completed, new Date(t.createdAt)));
            } catch (e) {
                console.error('Error loading tasks:', e);
                this.tasks = [];
            }
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();

    // Create edit modal if it doesn't exist
    if (!document.getElementById('editModal')) {
        const modal = document.createElement('div');
        modal.id = 'editModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Task</h2>
                <input type="text" id="editInput" class="modal-input" placeholder="Edit your task...">
                <div class="modal-buttons">
                    <button id="cancelEditBtn" class="modal-btn cancel">Cancel</button>
                    <button id="saveEditBtn" class="modal-btn save">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
});
