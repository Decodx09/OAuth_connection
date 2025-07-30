// Global variables
let todos = [];
let currentFilter = "all";

// Check current page and initialize appropriate functionality
document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;

  if (path === "/login") {
    initLogin();
  } else if (path === "/register") {
    initRegister();
  } else if (path === "/dashboard") {
    initDashboard();
  }

  // Check for error in URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  if (error) {
    showError(error.replace(/_/g, " "));
  }
});

function initLogin() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    try {
      clearMessages();
      showLoading("Signing in...");

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        showError(data.message || "Login failed");
      }
    } catch (error) {
      showError("Network error. Please try again.");
      console.error("Login error:", error);
    }
  });
}

function initRegister() {
  const form = document.getElementById("registerForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
    };

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    try {
      clearMessages();
      showLoading("Creating account...");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          "Registration successful! Please check your email to verify your account."
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        showError(data.message || "Registration failed");
      }
    } catch (error) {
      showError("Network error. Please try again.");
    }
  });
}

async function initDashboard() {
  await loadUserInfo();
  await loadTodos();
  initTodoForm();
  initFilterButtons();
  initLogout();
}

async function loadUserInfo() {
  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    if (data.user) {
      const userGreeting = document.getElementById("userGreeting");
      if (userGreeting) {
        userGreeting.textContent = `Welcome, ${data.user.firstName}!`;
      }

      const userInfo = document.getElementById("userInfo");
      if (userInfo) {
        userInfo.innerHTML = `
                    <div class="user-details">
                        <div class="user-detail-item">
                            <span class="detail-label">ID:</span>
                            <span class="detail-value">${data.user.id}</span>
                        </div>
                        <div class="user-detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${data.user.email}</span>
                        </div>
                        <div class="user-detail-item">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${data.user.firstName} ${
          data.user.lastName
        }</span>
                        </div>
                        <div class="user-detail-item">
                            <span class="detail-label">Role:</span>
                            <span class="detail-value">${
                              data.user.role || "User"
                            }</span>
                        </div>
                        <div class="user-detail-item">
                            <span class="detail-label">Verified:</span>
                            <span class="detail-value ${
                              data.user.isVerified ? "verified" : "unverified"
                            }">
                                ${data.user.isVerified ? "✅ Yes" : "❌ No"}
                            </span>
                        </div>
                    </div>
                `;
      }
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

async function loadTodos() {
  try {
    const response = await fetch("/api/todos");
    const data = await response.json();

    if (data.todos) {
      todos = data.todos;
      renderTodos();
      updateStats();
    }
  } catch (error) {
    console.error("Failed to load todos:", error);
    showError("Failed to load tasks");
  }
}

function initTodoForm() {
  const form = document.getElementById("todoForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("todoTitle").value.trim();
      const description = document
        .getElementById("todoDescription")
        .value.trim();

      if (!title) {
        showError("Task title is required");
        return;
      }

      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });

        const data = await response.json();

        if (data.success) {
          todos.push(data.todo);
          renderTodos();
          updateStats();
          form.reset();
          showSuccess("Task added successfully!");
        } else {
          showError(data.message || "Failed to add task");
        }
      } catch (error) {
        showError("Network error. Please try again.");
      }
    });
  }
}

function initFilterButtons() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTodos();
    });
  });
}

function initLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/";
      } catch (error) {
        window.location.href = "/";
      }
    });
  }
}

function renderTodos() {
  const todoList = document.getElementById("todoList");
  const emptyState = document.getElementById("emptyState");

  if (!todoList) return;

  let filteredTodos = todos;

  if (currentFilter === "completed") {
    filteredTodos = todos.filter((todo) => todo.completed);
  } else if (currentFilter === "pending") {
    filteredTodos = todos.filter((todo) => !todo.completed);
  }

  if (filteredTodos.length === 0) {
    todoList.style.display = "none";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  todoList.style.display = "block";

  todoList.innerHTML = filteredTodos
    .map(
      (todo) => `
        <div class="todo-item ${todo.completed ? "completed" : ""}" data-id="${
        todo.id
      }">
            <div class="todo-content">
                <div class="todo-checkbox">
                    <input type="checkbox" ${todo.completed ? "checked" : ""} 
                           onchange="toggleTodo(${todo.id})" id="todo-${
        todo.id
      }">
                    <label for="todo-${todo.id}" class="checkbox-label"></label>
                </div>
                <div class="todo-details">
                    <h3 class="todo-title">${escapeHtml(todo.title)}</h3>
                    ${
                      todo.description
                        ? `<p class="todo-description">${escapeHtml(
                            todo.description
                          )}</p>`
                        : ""
                    }
                    <div class="todo-meta">
                        <span class="todo-date">Created: ${formatDate(
                          todo.createdAt
                        )}</span>
                        ${
                          todo.updatedAt !== todo.createdAt
                            ? `<span class="todo-date">Updated: ${formatDate(
                                todo.updatedAt
                              )}</span>`
                            : ""
                        }
                    </div>
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn-icon edit-btn" onclick="openEditModal(${
                  todo.id
                })" title="Edit task">
                    ✏️
                </button>
                <button class="btn-icon delete-btn" onclick="deleteTodo(${
                  todo.id
                })" title="Delete task">
                    🗑️
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

async function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });

    const data = await response.json();

    if (data.success) {
      todo.completed = data.todo.completed;
      todo.updatedAt = data.todo.updatedAt;
      renderTodos();
      updateStats();
    } else {
      showError("Failed to update task");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  }
}

async function deleteTodo(id) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      todos = todos.filter((t) => t.id !== id);
      renderTodos();
      updateStats();
      showSuccess("Task deleted successfully!");
    } else {
      showError("Failed to delete task");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  }
}

function openEditModal(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  document.getElementById("editTodoId").value = id;
  document.getElementById("editTodoTitle").value = todo.title;
  document.getElementById("editTodoDescription").value = todo.description || "";
  document.getElementById("editModal").style.display = "flex";

  const editForm = document.getElementById("editTodoForm");
  editForm.onsubmit = async (e) => {
    e.preventDefault();
    await updateTodo(id);
  };
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function updateTodo(id) {
  const title = document.getElementById("editTodoTitle").value.trim();
  const description = document
    .getElementById("editTodoDescription")
    .value.trim();

  if (!title) {
    showError("Task title is required");
    return;
  }

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    const data = await response.json();

    if (data.success) {
      const todoIndex = todos.findIndex((t) => t.id === id);
      if (todoIndex !== -1) {
        todos[todoIndex] = data.todo;
      }
      renderTodos();
      closeEditModal();
      showSuccess("Task updated successfully!");
    } else {
      showError("Failed to update task");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  }
}

function updateStats() {
  const totalTodos = document.getElementById("totalTodos");
  const completedTodos = document.getElementById("completedTodos");

  if (totalTodos) totalTodos.textContent = todos.length;
  if (completedTodos)
    completedTodos.textContent = todos.filter((t) => t.completed).length;
}

function toggleUserInfo() {
  const userInfo = document.getElementById("userInfo");
  const toggle = document.getElementById("userInfoToggle");

  if (userInfo.style.display === "none") {
    userInfo.style.display = "block";
    toggle.textContent = "▲";
  } else {
    userInfo.style.display = "none";
    toggle.textContent = "▼";
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }
}

function showSuccess(message) {
  const successDiv = document.getElementById("success-message");
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = "block";
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 3000);
  }
}

function showLoading(message) {
  const errorDiv = document.getElementById("error-message");
  const successDiv = document.getElementById("success-message");

  if (errorDiv) errorDiv.style.display = "none";
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = "block";
  }
}

function clearMessages() {
  const errorDiv = document.getElementById("error-message");
  const successDiv = document.getElementById("success-message");

  if (errorDiv) errorDiv.style.display = "none";
  if (successDiv) successDiv.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeEditModal();
  }
};
