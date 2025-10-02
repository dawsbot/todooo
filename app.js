// State management
let tasks = [];
let currentView = 'active';

// DOM elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const activeTasksContainer = document.getElementById('active-tasks');
const completedTasksContainer = document.getElementById('completed-tasks');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const confettiContainer = document.getElementById('confetti-container');

// Initialize app
function init() {
    loadFromLocalStorage();
    renderTasks();
    attachEventListeners();
}

// Load tasks from localStorage
function loadFromLocalStorage() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

// Save tasks to localStorage
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Attach event listeners
function attachEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = btn.dataset.view;
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            toggleViews();
        });
    });
}

// Add new task
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);
    taskInput.value = '';
    saveToLocalStorage();
    renderTasks();
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;

    if (task.completed) {
        triggerCelebration();
    }

    saveToLocalStorage();
    renderTasks();
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTasks();
}

// Reorder tasks (drag and drop)
let draggedElement = null;
let draggedTaskId = null;

function handleDragStart(e, taskId) {
    draggedElement = e.currentTarget;
    draggedTaskId = taskId;
    e.currentTarget.classList.add('dragging');
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedElement = null;
    draggedTaskId = null;
}

function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(e.currentTarget.parentElement, e.clientY);
    const draggable = draggedElement;

    if (afterElement == null) {
        e.currentTarget.parentElement.appendChild(draggable);
    } else {
        e.currentTarget.parentElement.insertBefore(draggable, afterElement);
    }
}

function handleDrop(e, isCompleted) {
    e.preventDefault();

    // Get new order of task IDs from DOM
    const container = isCompleted ? completedTasksContainer : activeTasksContainer;
    const taskElements = container.querySelectorAll('.task-item');
    const newOrder = Array.from(taskElements).map(el => parseInt(el.dataset.taskId));

    // Reorder tasks array
    const activeTasks = tasks.filter(t => t.completed === isCompleted);
    const otherTasks = tasks.filter(t => t.completed !== isCompleted);

    const reorderedTasks = newOrder.map(id => activeTasks.find(t => t.id === id));
    tasks = [...reorderedTasks, ...otherTasks];

    saveToLocalStorage();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

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

// Render tasks
function renderTasks() {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    activeTasksContainer.innerHTML = activeTasks.length
        ? activeTasks.map(createTaskHTML).join('')
        : '<div class="empty-state">No active tasks. Add one above!</div>';

    completedTasksContainer.innerHTML = completedTasks.length
        ? completedTasks.map(createTaskHTML).join('')
        : '<div class="empty-state">No completed tasks yet.</div>';

    // Re-attach event listeners to newly created elements
    attachTaskEventListeners();
}

// Create task HTML
function createTaskHTML(task) {
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}"
             draggable="true"
             data-task-id="${task.id}">
            <span class="drag-handle">☰</span>
            <input type="checkbox"
                   class="task-checkbox"
                   ${task.completed ? 'checked' : ''}
                   data-task-id="${task.id}">
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="delete-btn" data-task-id="${task.id}">Delete</button>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Attach event listeners to task elements
function attachTaskEventListeners() {
    // Checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleTask(parseInt(e.target.dataset.taskId));
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteTask(parseInt(e.target.dataset.taskId));
        });
    });

    // Drag and drop
    document.querySelectorAll('.task-item').forEach(item => {
        const taskId = parseInt(item.dataset.taskId);
        const task = tasks.find(t => t.id === taskId);

        item.addEventListener('dragstart', (e) => handleDragStart(e, taskId));
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', (e) => handleDrop(e, task.completed));
    });
}

// Toggle between active and completed views
function toggleViews() {
    if (currentView === 'active') {
        activeTasksContainer.classList.remove('hidden');
        completedTasksContainer.classList.add('hidden');
    } else {
        activeTasksContainer.classList.add('hidden');
        completedTasksContainer.classList.remove('hidden');
    }
}

// Celebration effects
function triggerCelebration() {
    createConfetti();
    shakeScreen();
}

function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493'];
    const confettiCount = 1000;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `confetti-fall ${2 + Math.random() * 2}s linear forwards`;
            confetti.style.animationDelay = '0s';

            confettiContainer.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 10);
    }
}

function shakeScreen() {
    document.body.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('shake');
    }, 800);
}

// Start the app
init();
