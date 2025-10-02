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
    createFireworks();
    shakeScreen();
}

function createConfetti() {
    const colors = [
        '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd',
        '#f9bec7', '#a786df', '#8b5cf6', '#7c3aed', '#6d28d9',
        '#fbbf24', '#f59e0b', '#d97706', '#fb923c', '#f97316',
        '#34d399', '#10b981', '#059669', '#4ade80', '#22c55e',
        '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4'
    ];
    const shapes = ['confetti-rect', 'confetti-circle', 'confetti-ribbon', 'confetti-star'];
    const confettiCount = 300;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            confetti.className = `confetti ${shape}`;
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = -20 + 'px';

            // Set color based on shape
            if (shape === 'confetti-star') {
                confetti.style.borderBottomColor = color;
            } else {
                confetti.style.background = color;
            }

            // Random drift and rotation
            const drift = (Math.random() - 0.5) * 400;
            const rotation = Math.random() * 1080 - 540;

            confetti.style.setProperty('--drift', drift + 'px');
            confetti.style.setProperty('--rotation', rotation + 'deg');

            const duration = 3 + Math.random() * 2;
            const delay = Math.random() * 0.5;

            confetti.style.animation = `confetti-fall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`;

            confettiContainer.appendChild(confetti);

            setTimeout(() => confetti.remove(), (duration + delay) * 1000 + 1000);
        }, i * 5);
    }
}

function createFireworks() {
    const fireworkCount = 6;
    const colors = [
        '#ff0a54', '#fbbf24', '#34d399', '#60a5fa',
        '#a786df', '#f97316', '#22c55e', '#06b6d4'
    ];

    for (let f = 0; f < fireworkCount; f++) {
        setTimeout(() => {
            const x = 20 + Math.random() * 60;
            const y = 20 + Math.random() * 40;
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Create rising trail
            const trail = document.createElement('div');
            trail.className = 'firework-trail';
            trail.style.left = x + '%';
            trail.style.bottom = '0';
            trail.style.setProperty('--color', color);
            trail.style.animation = 'firework-rise 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
            confettiContainer.appendChild(trail);

            setTimeout(() => trail.remove(), 1000);

            // Create explosion
            setTimeout(() => {
                // Flash effect
                const flash = document.createElement('div');
                flash.className = 'firework-flash';
                flash.style.left = x + '%';
                flash.style.top = y + '%';
                flash.style.setProperty('--color', color);
                flash.style.animation = 'flash 0.6s ease-out forwards';
                confettiContainer.appendChild(flash);
                setTimeout(() => flash.remove(), 600);

                // Main burst - 2 rings
                const rings = 2;
                const particlesPerRing = [50, 30];

                for (let ring = 0; ring < rings; ring++) {
                    const particleCount = particlesPerRing[ring];
                    const ringDelay = ring * 60;
                    const ringVelocityBase = 180 - (ring * 50);

                    setTimeout(() => {
                        for (let i = 0; i < particleCount; i++) {
                            const particle = document.createElement('div');
                            particle.className = 'firework';
                            particle.style.left = x + '%';
                            particle.style.top = y + '%';
                            particle.style.color = color;

                            const angle = (Math.PI * 2 * i) / particleCount;
                            const randomAngleOffset = (Math.random() - 0.5) * 0.3;
                            const actualAngle = angle + randomAngleOffset;

                            const velocity = ringVelocityBase + Math.random() * 50;
                            const xPos = Math.cos(actualAngle) * velocity;
                            const yPos = Math.sin(actualAngle) * velocity;

                            particle.style.setProperty('--x', xPos + 'px');
                            particle.style.setProperty('--y', yPos + 'px');

                            const duration = 1.5 + Math.random() * 0.5;
                            particle.style.animation = `firework-explode ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

                            confettiContainer.appendChild(particle);
                            setTimeout(() => particle.remove(), duration * 1000 + 500);
                        }
                    }, ringDelay);
                }
            }, 900);

        }, f * 300);
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
