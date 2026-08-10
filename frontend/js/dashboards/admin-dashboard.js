const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationPanel = document.getElementById('notificationPanel');
const adminMessage = document.getElementById('adminMessage');
const toastContainer = document.getElementById('toastContainer');
if (!token) window.location.href = 'index.html';

const setAdminMessage = (value, type = 'info') => {
  if (!adminMessage) return;
  adminMessage.textContent = value;
  adminMessage.classList.remove('success', 'error', 'info');
  adminMessage.classList.add(type);
};

const showToast = (message, type = 'info') => {
  if (!toastContainer) return;
  const toast = document.createElement('section');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✔️' : type === 'error' ? '⚠️' : 'ℹ️'}</span><div class="toast-body"><span class="toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</span><span class="toast-text"></span></div><button class="close-toast" aria-label="Dismiss notification">×</button>`;
  toast.querySelector('.toast-text').textContent = message;
  toast.querySelector('.close-toast').addEventListener('click', () => toast.remove());
  toastContainer.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
};

const showPage = (name) => {
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === name));
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === `page-${name}`));
  document.getElementById('sidebar').classList.remove('open');
};

const renderNotifications = (alerts) => {
  const items = Array.isArray(alerts) ? alerts : [];
  if (notificationBadge) notificationBadge.textContent = items.length;
  if (notificationPanel) {
    notificationPanel.innerHTML = items.length
      ? items.map((alert, index) => `
        <div class="notification-item" data-index="${index}">
          <div class="notification-title">${alert.title || 'Alert'}</div>
          <div class="notification-meta">${alert.region || 'Regional'} • ${new Date(alert.createdAt || Date.now()).toLocaleString()}</div>
          <div class="notification-meta">${alert.message || ''}</div>
        </div>`).join('')
      : '<div class="notification-empty">No alerts yet.</div>';
  }
};

const loadNotifications = async () => {
  try {
    const alerts = await request('/admin/alerts');
    renderNotifications(alerts);
  } catch (_error) {
    renderNotifications([]);
  }
};

const loadUsers = async () => {
  const table = document.getElementById('userTable');
  if (!table) return;
  try {
    const users = await request('/admin/users');
    const entries = Array.isArray(users) ? users : [];
    table.innerHTML = entries.map((user) => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="status-tag blue">${user.role}</span></td>
        <td><button class="btn-secondary" data-delete-user="${user._id}">Delete</button></td>
      </tr>
    `).join('');
  } catch (error) {
    table.innerHTML = `<tr><td colspan="4">${error.message || 'Unable to load users.'}</td></tr>`;
  }
};

const loadSummary = async () => {
  try {
    setAdminMessage('Loading dashboard data...', 'info');
    const summary = await request('/admin/summary');
    const userCountEl = document.getElementById('userCount');
    const alertCountEl = document.getElementById('alertCount');
    const statusEl = document.getElementById('databaseStatus');
    const statusDetailEl = document.getElementById('databaseStatusDetail');
    const userCountDetailEl = document.getElementById('databaseUserCount');
    if (userCountEl) userCountEl.textContent = summary.userCount;
    if (alertCountEl) alertCountEl.textContent = summary.alertCount;
    if (statusEl) statusEl.textContent = summary.serviceStatus;
    if (statusDetailEl) statusDetailEl.textContent = summary.serviceStatus;
    if (userCountDetailEl) userCountDetailEl.textContent = summary.userCount;
    await loadUsers();
    setAdminMessage('Dashboard metrics updated.', 'success');
  } catch (error) {
    setAdminMessage(error.message || 'Unable to load admin summary.', 'error');
  }
};

const initializeUserInfo = () => {
  const userNameElement = document.getElementById('userName');
  const userAvatarElement = document.getElementById('userAvatar');
  if (userNameElement && user.name) {
    userNameElement.textContent = user.name;
  }
  if (userAvatarElement && user.name) {
    userAvatarElement.textContent = user.name.slice(0, 2).toUpperCase();
  }
};

const bindAdminInteractions = () => {
  document.querySelectorAll('.card-interactive').forEach((card) => {
    card.addEventListener('click', () => {
      if (!card.dataset.pageLink) return;
      showPage(card.dataset.pageLink);
    });
  });

  const adminUserForm = document.getElementById('adminUserForm');
  if (adminUserForm) {
    adminUserForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = adminUserForm.querySelector('button[type="submit"]');
      const messageEl = document.getElementById('createUserMessage');
      if (submitButton) submitButton.disabled = true;
      if (messageEl) {
        messageEl.textContent = 'Creating user...';
        messageEl.className = 'message info';
      }
      try {
        await request('/admin/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(adminUserForm))) });
        adminUserForm.reset();
        if (messageEl) {
          messageEl.textContent = 'User created successfully.';
          messageEl.className = 'message success';
        }
        showToast('User created successfully.', 'success');
        await loadSummary();
        showPage('users');
      } catch (error) {
        if (messageEl) {
          messageEl.textContent = error.message || 'Unable to create user.';
          messageEl.className = 'message error';
        }
        showToast(error.message || 'Unable to create user.', 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  const userTable = document.getElementById('userTable');
  if (userTable) {
    userTable.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-delete-user]');
      if (!button) return;
      const id = button.dataset.deleteUser;
      if (!id) return;
      if (!confirm('Delete this user?')) return;
      button.disabled = true;
      try {
        await request(`/admin/users/${id}`, { method: 'DELETE' });
        setAdminMessage('User deleted successfully.', 'success');
        showToast('User deleted successfully.', 'success');
        await loadSummary();
      } catch (error) {
        setAdminMessage(error.message || 'Unable to delete user.', 'error');
        showToast(error.message || 'Unable to delete user.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  const refreshDatabaseButton = document.getElementById('refreshDatabaseButton');
  if (refreshDatabaseButton) {
    refreshDatabaseButton.addEventListener('click', async () => {
      try {
        await loadSummary();
        const dbMessage = document.getElementById('databaseMessage');
        if (dbMessage) dbMessage.textContent = 'Database status refreshed.';
      } catch (error) {
        const dbMessage = document.getElementById('databaseMessage');
        if (dbMessage) dbMessage.textContent = error.message || 'Unable to refresh database status.';
      }
    });
  }
};

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => showPage(item.dataset.page)));
document.querySelectorAll('[data-page-link]').forEach((item) => {
  item.addEventListener('click', () => showPage(item.dataset.pageLink));
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showPage(item.dataset.pageLink);
    }
  });
});
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburgerBtn');
if (localStorage.getItem('agrismart.sidebarCollapsed') === 'true' && sidebar) {
  sidebar.classList.add('collapsed');
  document.body.classList.add('sidebar-collapsed');
}
if (hamburger) {
  hamburger.addEventListener('click', () => {
    if (!sidebar) return;
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
      return;
    }
    const collapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('agrismart.sidebarCollapsed', String(collapsed));
  });
}
const adminAlertForm = document.getElementById('adminAlertForm');
if (adminAlertForm) {
  adminAlertForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = adminAlertForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await request('/admin/alerts', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      event.currentTarget.reset();
      setAdminMessage('Alert created successfully.', 'success');
      showToast('Alert created successfully.', 'success');
      await loadSummary();
      await loadNotifications();
    } catch (error) {
      setAdminMessage(error.message || 'Unable to create alert.', 'error');
      showToast(error.message || 'Unable to create alert.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}
loadSummary();
loadNotifications();
bindAdminInteractions();
initializeUserInfo();

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

const markNotificationRead = (item) => {
  if (!notificationPanel || !notificationBadge) return;
  item.remove();
  const remaining = notificationPanel.querySelectorAll('.notification-item').length;
  if (notificationBadge) notificationBadge.textContent = remaining;
  if (!remaining) {
    notificationPanel.innerHTML = '<div class="notification-empty">No alerts yet.</div>';
    if (notificationBadge) notificationBadge.textContent = '0';
  }
};

if (notificationPanel) {
  notificationPanel.addEventListener('click', (event) => {
    const item = event.target.closest('.notification-item');
    if (item) {
      markNotificationRead(item);
    }
  });
}

if (notificationBell) {
  notificationBell.addEventListener('click', () => {
    if (notificationPanel) {
      const isHidden = notificationPanel.hasAttribute('hidden');
      notificationPanel.toggleAttribute('hidden', !isHidden);
    }
  });
}

document.addEventListener('click', (event) => {
  if (!notificationPanel || notificationPanel.hasAttribute('hidden')) return;
  if (!notificationPanel.contains(event.target) && event.target !== notificationBell) {
    notificationPanel.setAttribute('hidden', '');
  }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
