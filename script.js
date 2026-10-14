
const $ = (id) => document.getElementById(id);

const form = $("taskForm");
const taskList = $("taskList");
const emptyMessage = $("emptyMessage");

let tasks = [];
let currentView = "dashboard";

try {
  const savedTasks = JSON.parse(localStorage.getItem("studybuddy-tasks") || "[]");
  if (Array.isArray(savedTasks)) {
    tasks = savedTasks.filter(
      (task) => task && typeof task.id === "number" &&
      typeof task.title === "string"
    );
  }
} catch (error) {
  tasks = [];
}

function saveTasks() {
  try {
    localStorage.setItem("studybuddy-tasks", JSON.stringify(tasks));
  } catch (error) {
    $("formMessage").textContent = "Unable to save data in this browser.";
  }
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setupDate() {
  const now = new Date();

  $("dateLabel").textContent = now.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  $("todayDate").textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();

  const hour = now.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  $("greeting").textContent = `${greeting}! 👋`;
  $("taskDate").value = getLocalDate();
  $("taskDate").min = getLocalDate();
}

function updateStats() {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  $("totalCount").textContent = total;
  $("completedCount").textContent = completed;
  $("pendingCount").textContent = pending;
  $("progressPercent").textContent = `${percent}%`;
  $("progressBar").style.width = `${percent}%`;
}

function createTag(text, className = "") {
  const tag = document.createElement("span");
  tag.className = `tag ${className}`.trim();
  tag.textContent = text;
  return tag;
}

function renderTasks() {
  taskList.replaceChildren();

  const filter = $("taskFilter").value;
  const visibleTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  emptyMessage.hidden = visibleTasks.length > 0;

  visibleTasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderAll();
    });

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.append(
      createTag(task.subject),
      createTag(task.priority, `priority-${task.priority.toLowerCase()}`),
      document.createTextNode(`${task.duration} · Due ${task.dueDate}`)
    );

    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.className = "small-button";
    editButton.textContent = "✏️";
    editButton.title = "Edit task";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    editButton.addEventListener("click", () => editTask(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-button";
    deleteButton.textContent = "🗑️";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    actions.append(editButton, deleteButton);
    item.append(checkbox, content, actions);
    taskList.append(item);
  });

  updateStats();
  renderSubjects();
}

function renderSubjects() {
  const subjectList = $("subjectList");
  subjectList.replaceChildren();

  const subjects = [
    "Java", "DSA", "Database", "Web Development", "College", "Other"
  ];

  subjects.forEach((subject) => {
    const subjectTasks = tasks.filter((task) => task.subject === subject);
    const completed = subjectTasks.filter((task) => task.completed).length;
    const percent = subjectTasks.length
      ? Math.round((completed / subjectTasks.length) * 100)
      : 0;

    const card = document.createElement("div");
    card.className = "subject-card";

    const top = document.createElement("div");
    top.className = "subject-top";

    const name = document.createElement("strong");
    name.textContent = subject;

    const count = document.createElement("span");
    count.textContent = `${completed}/${subjectTasks.length} completed`;

    top.append(name, count);

    const track = document.createElement("div");
    track.className = "subject-track";

    const fill = document.createElement("div");
    fill.className = "subject-fill";
    fill.style.width = `${percent}%`;

    track.append(fill);
    card.append(top, track);
    subjectList.append(card);
  });
}

function renderAll() {
  renderTasks();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("taskName").value.trim();
  if (!title) {
    $("taskName").focus();
    return;
  }

  tasks.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    subject: $("taskSubject").value,
    priority: $("taskPriority").value,
    dueDate: $("taskDate").value,
    duration: $("taskDuration").value,
    completed: false
  });

  saveTasks();
  form.reset();
  $("taskDate").value = getLocalDate();
  $("taskDuration").value = "1 hour";
  $("formMessage").textContent = "Task added successfully! 🎉";

  $("taskFilter").value = "all";
  renderAll();
});

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const updatedTitle = prompt("Edit your task name:", task.title);
  if (updatedTitle === null) return;

  const cleanedTitle = updatedTitle.trim();
  if (!cleanedTitle) {
    alert("Task name cannot be empty.");
    return;
  }

  task.title = cleanedTitle.slice(0, 100);
  saveTasks();
  renderAll();
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  if (!confirm(`Delete "${task.title}"?`)) return;

  tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  renderAll();
}

$("taskFilter").addEventListener("change", renderTasks);

function showView(view) {
  currentView = view;

  $("addTaskSection").classList.toggle("hidden", view !== "dashboard" && view !== "tasks");
  $("taskListSection").classList.toggle("hidden", view === "subjects");
  $("subjectsSection").classList.toggle("hidden", view !== "subjects");

  $("taskHeading").textContent = view === "tasks" ? "All My Tasks" : "My Study Tasks";

  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (view === "tasks") {
    $("taskListSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.querySelectorAll(".nav").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

$("themeButton").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  $("themeButton").textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";

  try {
    localStorage.setItem("studybuddy-dark", String(isDark));
  } catch (error) {
    // Theme still works for this session.
  }
});

try {
  if (localStorage.getItem("studybuddy-dark") === "true") {
    document.body.classList.add("dark");
    $("themeButton").textContent = "☀️ Light Mode";
  }
} catch (error) {
  // Use the default light theme if storage is unavailable.
}

setupDate();
showView("dashboard");
renderAll();
