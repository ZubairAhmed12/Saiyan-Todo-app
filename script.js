// Elements
const menuButton = document.querySelector('#menu-button');
const menuPanel = document.querySelector('#menu-panel');
const taskForm = document.querySelector('#task-form');
const taskNameInput = document.querySelector('#task-name');
const taskDifficultyInput = document.querySelector('#task-difficulty');
const taskList = document.querySelector('#task-list');
const saiyanPointsEl = document.getElementById('saiyan-points');
const saiyanLevelEl = document.getElementById('saiyan-level');
const resetButton = document.getElementById('reset-all');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const viewLevelsButton = document.getElementById('view-levels');
const saiyanLevelModal = document.getElementById('saiyan-level-modal');
const closeSaiyanLevelModal = document.getElementById('close-saiyan-level-modal');
const taskSettingsModal = document.getElementById('task-settings-modal');
const closeTaskSettingsModal = document.getElementById('close-task-settings-modal');
const deleteTaskButton = document.getElementById('delete-task');
const changeTaskDifficulty = document.getElementById('change-task-difficulty');
const applyPenaltyButton = document.getElementById('apply-penalty');
const exportJsonButton = document.querySelector('#export-json');
const importJsonButton = document.querySelector('#import-json');
const resetTasksButton = document.getElementById('reset-tasks');
const pointSystemInfoButton = document.getElementById('point-system-info');
const pointSystemModal = document.getElementById('point-system-modal');
const closePointSystemModal = document.getElementById('close-point-system-modal');

let dragStartIndex;
let db; // IndexedDB variable

// Dark Mode Toggle with persistence
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  darkModeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
});

// Load dark mode preference on page load
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  darkModeToggle.textContent = 'Toggle Light Mode';
}

// Open IndexedDB
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('SaiyanTodoDB', 1);
    
    request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const objectStore = db.createObjectStore('tasks', { keyPath: 'id' });
      objectStore.createIndex('id', 'id', { unique: true });
      
      db.createObjectStore('points', { keyPath: 'id' });
    };
  });
};

// Save tasks and points to IndexedDB
function saveTasks() {
  if (!db) return console.log('Database not available');

  const transaction = db.transaction(['tasks', 'points'], 'readwrite');
  const tasksStore = transaction.objectStore('tasks');
  const pointsStore = transaction.objectStore('points');

  tasksStore.clear().onsuccess = () => {
    tasks.forEach(task => tasksStore.add(task));
  };

  pointsStore.put({id: 'saiyanPoints', value: saiyanPoints});
}

// Load tasks and points from IndexedDB
async function loadTasksFromDB() {
  if (!db) return console.log('Database not available');

  const transaction = db.transaction(['tasks', 'points'], 'readonly');
  const tasksStore = transaction.objectStore('tasks');
  const pointsStore = transaction.objectStore('points');

  return new Promise((resolve) => {
    const tasksRequest = tasksStore.getAll();
    const pointsRequest = pointsStore.get('saiyanPoints');

    tasksRequest.onsuccess = (event) => {
      tasks = event.target.result || [];
      pointsRequest.onsuccess = (event) => {
        saiyanPoints = event.target.result ? event.target.result.value : 0;
        updateUI();
        resolve();
      };
    };
  });
}

// State
let tasks = [];
let saiyanPoints = 0;
let currentTaskId = null;

// Helper Functions
function updateSaiyanLevel() {
  const levels = [
    { name: 'Kaioken', min: 0, max: 1000 },
    { name: 'Super Saiyan', min: 1000, max: 5000 },
    { name: 'Super Saiyan 2', min: 5000, max: 15000 },
    { name: 'Super Saiyan 3', min: 15000, max: 40000 },
    { name: 'Super Saiyan God', min: 40000, max: 120000 },
    { name: 'Super Saiyan Blue', min: 120000, max: 250000 },
    { name: 'Ultra Instinct', min: 250000, max: 400000 },
    { name: 'Mastered Ultra Instinct', min: 400000, max: 800000 }
  ];

  const level = levels.find(level => saiyanPoints >= level.min && saiyanPoints <= level.max);
  saiyanLevelEl.textContent = level ? level.name : 'Unknown';
  saiyanPointsEl.textContent = saiyanPoints;
}

function penaltyPoints(difficulty) {
  const penalties = { 1: 1, 2: 2, 3: 4, 4: 6, 5: 7, 6: 8, 7: 10, 8: 12, 9: 15, 10: 20, 11: 25, 12: 30, 13: 35, 14: 40, 15: 45, 16: 50, 17: 55, 18: 60, 19: 65, 20: 70, 21: 75, 22: 80, 23: 85, 24: 90, 25: 95, 26: 100, 27: 105, 28: 110, 29: 115, 30: 120 };
  return penalties[difficulty] || 0;
}

function updateUI() {
  taskList.innerHTML = '';
  tasks.forEach(renderTask);
  updateSaiyanLevel();

  // Update task difficulty input based on Saiyan Points
  let maxDifficulty = 5; // Default max difficulty
  if (saiyanPoints >= 15000) {
    maxDifficulty = 10;
  }
  if (saiyanPoints >= 120000) {
    maxDifficulty = 30;
  }
  taskDifficultyInput.setAttribute('max', maxDifficulty);
  taskDifficultyInput.setAttribute('placeholder', `Difficulty (1-${maxDifficulty})`);
  
  // Disable penalty button if Saiyan Points are 15000 or more
  applyPenaltyButton.disabled = saiyanPoints >= 15000;
}

function addTask(name, difficulty) {
  // Check if the difficulty is within the allowed range based on Saiyan Points
  let maxDifficulty = 5; // Default max difficulty
  if (saiyanPoints >= 15000) {
    maxDifficulty = 10;
  }
  if (saiyanPoints >= 120000) {
    maxDifficulty = 30;
  }

  if (parseInt(difficulty) > maxDifficulty) {
    alert(`You can't set difficulty above ${maxDifficulty} at your current Saiyan level.`);
    return;
  }

  // Determine if this task should have a penalty
  const hasPenalty = saiyanPoints < 15000;

  const task = { id: Date.now(), name, difficulty: parseInt(difficulty), completed: false, hasPenalty };
  tasks.push(task);
  saveTasks();
  updateUI();
}

function renderTask(task) {
  const taskItem = document.createElement('li');
  taskItem.dataset.id = task.id;
  taskItem.classList.toggle('completed', task.completed);
  taskItem.setAttribute('draggable', 'true');
  taskItem.innerHTML = `
    <span>${task.name} (Difficulty: ${task.difficulty}${task.hasPenalty ? '' : ''})</span>
    <div>
      <button class="task-action" onclick="toggleTaskCompletion(${task.id})">${task.completed ? '✗' : '✓'}</button>
      <button class="task-action" onclick="showTaskOptions(${task.id})">⚙️</button>
    </div>
  `;

  taskItem.addEventListener('dragstart', dragStart);
  taskItem.addEventListener('dragover', dragOver);
  taskItem.addEventListener('dragenter', dragEnter);
  taskItem.addEventListener('dragleave', dragLeave);
  taskItem.addEventListener('drop', dragDrop);
  taskItem.addEventListener('dragend', dragEnd);

  requestAnimationFrame(() => {
    taskItem.classList.add('animate-in');
  });

  taskList.appendChild(taskItem);
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    saiyanPoints += task.completed ? task.difficulty : -task.difficulty;
    if (saiyanPoints < 0) saiyanPoints = 0;
    saveTasks();
    updateUI();
  }
}

function showTaskOptions(taskId) {
  currentTaskId = taskId;
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    taskSettingsModal.classList.remove('hidden');
    setTimeout(() => taskSettingsModal.classList.add('visible'), 10);
    document.getElementById('task-settings-info').textContent = `Task: ${task.name} (Difficulty: ${task.difficulty}${task.hasPenalty ? '' : ''})`;
    changeTaskDifficulty.value = task.difficulty;
    applyPenaltyButton.disabled = !task.hasPenalty; // Disable penalty if task does not have one
  }
}

function hideModal(modal) {
  modal.classList.remove('visible');
  setTimeout(() => modal.classList.add('hidden'), 300);
}

function deleteCurrentTask() {
  tasks = tasks.filter((t) => t.id !== currentTaskId);
  saveTasks();
  updateUI();
  hideModal(taskSettingsModal);
}

function resetTasks() {
  if (confirm('Are you sure you want to reset all task statuses?')) {
    tasks.forEach(task => task.completed = false);
    saveTasks();
    updateUI();
  }
}

// Drag and Drop Functions
function dragStart(e) {
  dragStartIndex = +e.target.closest('li').dataset.id;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', null);
  e.target.classList.add('dragging');
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
  e.target.closest('li').classList.add('drag-over');
}

function dragLeave(e) {
  e.target.closest('li').classList.remove('drag-over');
}

function dragDrop(e) {
  const dragEndIndex = +e.target.closest('li').dataset.id;
  swapTasks(dragStartIndex, dragEndIndex);
  e.target.closest('li').classList.remove('drag-over');
}

function dragEnd(e) {
  e.target.classList.remove('dragging');
}

function swapTasks(fromIndex, toIndex) {
  const itemOne = tasks.find(task => task.id === fromIndex);
  const itemTwo = tasks.find(task => task.id === toIndex);
  const itemOneIndex = tasks.indexOf(itemOne);
  const itemTwoIndex = tasks.indexOf(itemTwo);
  
  if (itemOneIndex !== -1 && itemTwoIndex !== -1) {
    tasks[itemOneIndex] = itemTwo;
    tasks[itemTwoIndex] = itemOne;
    saveTasks();
    updateUI();
  }
}

// Event Listeners
menuButton.addEventListener('click', () => {
  if (menuPanel.classList.contains('hidden')) {
    menuPanel.classList.remove('hidden');
    setTimeout(() => menuPanel.classList.add('visible'), 10);
  } else {
    menuPanel.classList.remove('visible');
    setTimeout(() => menuPanel.classList.add('hidden'), 300);
  }
});

resetButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all data?')) {
    const transaction = db.transaction(['tasks', 'points'], 'readwrite');
    transaction.objectStore('tasks').clear();
    transaction.objectStore('points').clear();
    saiyanPoints = 0;
    tasks = [];
    updateSaiyanLevel();
    updateUI();
  }
});

viewLevelsButton.addEventListener('click', () => {
  saiyanLevelModal.classList.remove('hidden');
  setTimeout(() => saiyanLevelModal.classList.add('visible'), 10);
});

closeSaiyanLevelModal.addEventListener('click', () => hideModal(saiyanLevelModal));
closeTaskSettingsModal.addEventListener('click', () => hideModal(taskSettingsModal));

deleteTaskButton.addEventListener('click', deleteCurrentTask);

changeTaskDifficulty.addEventListener('change', () => {
  const task = tasks.find((t) => t.id === currentTaskId);
  if (task) {
    task.difficulty = parseInt(changeTaskDifficulty.value, 10);
    saveTasks();
    updateUI();
  }
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = taskNameInput.value.trim();
  const difficulty = taskDifficultyInput.value;
  if (name && difficulty >= 1 && difficulty <= parseInt(taskDifficultyInput.getAttribute('max'))) {
    addTask(name, difficulty);
    taskNameInput.value = '';
    taskDifficultyInput.value = '';
  }
});

resetTasksButton.addEventListener('click', resetTasks);

// Export Tasks to JSON
exportJsonButton.addEventListener('click', () => {
  const data = {
    tasks,
    saiyanPoints
  };
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Import Tasks from JSON
importJsonButton.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          tasks = importedData.tasks || [];
          saiyanPoints = importedData.saiyanPoints || 0;
          saveTasks();
          updateUI();
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  });
  input.click();
});

applyPenaltyButton.addEventListener('click', () => {
  const task = tasks.find((t) => t.id === currentTaskId);
  if (task && task.hasPenalty) { // Only apply penalty if the task has one
    saiyanPoints -= penaltyPoints(task.difficulty);
    if (saiyanPoints < 0) saiyanPoints = 0;
    saveTasks();
    updateUI();
    taskSettingsModal.classList.remove('hidden');
    setTimeout(() => taskSettingsModal.classList.add('visible'), 10);
  }
});

// New Event Listener for Point System Info
pointSystemInfoButton.addEventListener('click', () => {
  pointSystemModal.classList.remove('hidden');
  setTimeout(() => pointSystemModal.classList.add('visible'), 10);
});

// Event Listener for Closing Point System Modal
closePointSystemModal.addEventListener('click', () => hideModal(pointSystemModal));

// Initialize
openDatabase().then(() => {
  loadTasksFromDB().catch((error) => {
    console.error('Failed to load tasks from IndexedDB:', error);
    // Fallback to localStorage if IndexedDB fails
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    saiyanPoints = parseInt(localStorage.getItem('saiyanPoints')) || 0;
    updateUI();
  });
}).catch((error) => {
  console.error('Failed to open IndexedDB:', error);
  // If IndexedDB fails entirely, use localStorage
  loadTasks(); // You need to implement this fallback function if needed
});

// Fallback function for localStorage (if needed)
function loadTasks() {
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  saiyanPoints = parseInt(localStorage.getItem('saiyanPoints')) || 0;
  updateUI();
}