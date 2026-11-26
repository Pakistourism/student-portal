// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable: app still works for this session */
  }
}

// ---------- Theme toggle ----------
const root = document.documentElement;
const themeBtn = $("themeBtn");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
}

const savedTheme = load("theme", null);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  save("theme", next);
});

// ---------- Mobile menu ----------
const menuBtn = $("menuBtn");
const nav = $("nav");

menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});

nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

// ---------- Greeting and live clock ----------
function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  $("greeting").textContent = greeting + ".";
  $("clock").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }) + " | " + now.toLocaleTimeString();
}

updateClock();
setInterval(updateClock, 1000);

$("year").textContent = new Date().getFullYear();

// ---------- Task list ----------
let tasks = load("tasks", []);
let currentFilter = "all";

const taskList = $("taskList");
const taskInput = $("taskInput");

function renderTasks() {
  taskList.innerHTML = "";

  const visible = tasks.filter((t) =>
    currentFilter === "all" ? true : currentFilter === "done" ? t.done : !t.done
  );

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = tasks.length
      ? "No tasks in this view."
      : "No tasks yet. Add your first one above.";
    taskList.appendChild(empty);
  }

  visible.forEach((task) => {
    const li = document.createElement("li");
    if (task.done) li.classList.add("done");

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", "Mark done: " + task.text);
    check.addEventListener("change", () => {
      task.done = check.checked;
      save("tasks", tasks);
      renderTasks();
    });

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = task.text; // textContent keeps user input safe

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.innerHTML = "&times;";
    del.setAttribute("aria-label", "Delete task: " + task.text);
    del.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      save("tasks", tasks);
      renderTasks();
    });

    li.append(check, label, del);
    taskList.appendChild(li);
  });

  const remaining = tasks.filter((t) => !t.done).length;
  $("taskCount").textContent =
    remaining + (remaining === 1 ? " task" : " tasks") + " left";
}

$("taskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  save("tasks", tasks);
  taskInput.value = "";
  renderTasks();
});

$("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter");
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll(".filter").forEach((f) => f.classList.remove("active"));
  btn.classList.add("active");
  renderTasks();
});

renderTasks();

// ---------- Contact form validation ----------
const form = $("contactForm");
const status = $("formStatus");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const fields = ["name", "email", "message"].map($);
  fields.forEach((f) => f.classList.remove("input-error"));

  const [name, email, message] = fields;
  let error = "";

  if (!name.value.trim()) {
    error = "Enter your name.";
    name.classList.add("input-error");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    error = "Enter a valid email address.";
    email.classList.add("input-error");
  } else if (message.value.trim().length < 10) {
    error = "Write a message of at least 10 characters.";
    message.classList.add("input-error");
  }

  if (error) {
    status.className = "form-status error";
    status.textContent = error;
    return;
  }

  // Demo only: connect this to a real backend or a form service to actually send.
  status.className = "form-status ok";
  status.textContent = "Thanks, " + name.value.trim() + ". Your message was sent.";
  form.reset();
});
