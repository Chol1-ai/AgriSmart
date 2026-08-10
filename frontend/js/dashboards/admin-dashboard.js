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

const renderNotifications = (data) => {
  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const supportQueries = Array.isArray(data?.supportQueries) ? data.supportQueries : [];
  const items = [
    ...supportQueries.map((query) => ({ type: 'support', ...query })),
    ...alerts.map((alert) => ({ type: 'alert', ...alert }))
  ];
  if (notificationBadge) notificationBadge.textContent = items.length;
  if (notificationPanel) {
    notificationPanel.innerHTML = items.length
      ? items.map((item, index) => `
        <div class="notification-item" data-index="${index}" data-type="${item.type}">
          <div class="notification-title">${item.type === 'support' ? item.subject : item.title || 'Alert'}</div>
          <div class="notification-meta">${item.type === 'support' ? item.userId?.name || 'Farmer request' : item.region || 'Regional'} • ${new Date(item.createdAt || Date.now()).toLocaleString()}</div>
          <div class="notification-meta">${item.type === 'support' ? 'Pending expert response' : item.message || ''}</div>
        </div>`).join('')
      : '<div class="notification-empty">No notifications yet.</div>';
  }
};

const loadNotifications = async () => {
  try {
    const data = await request('/admin/notifications');
    renderNotifications(data);
  } catch (_error) {
    renderNotifications({ alerts: [], supportQueries: [] });
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

const loadSupportQueries = async () => {
  const table = document.getElementById('supportQueryTable');
  if (!table) return;
  try {
    const queries = await request('/admin/support');
    const entries = Array.isArray(queries) ? queries : [];
    table.innerHTML = entries.length
      ? entries.map((query) => `
        <tr>
          <td>${query.userId?.name || 'Farmer'}</td>
          <td>${query.subject}</td>
          <td>${query.category}</td>
          <td><span class="status-tag yellow">${query.status}</span></td>
          <td><button class="btn-primary" data-review-query="${query._id}">Answer</button></td>
        </tr>`).join('')
      : '<tr><td colspan="5">No pending support requests.</td></tr>';
  } catch (error) {
    table.innerHTML = `<tr><td colspan="5">${error.message || 'Unable to load support requests.'}</td></tr>`;
  }
};

const loadSupportPreview = async () => {
  const preview = document.getElementById('supportPreviewList');
  if (!preview) return;
  try {
    const queries = await request('/admin/support');
    const entries = Array.isArray(queries) ? queries : [];
    preview.innerHTML = entries.length
      ? entries.slice(0, 3).map((query) => `
          <div class="small-card">
            <div><strong>${query.subject}</strong> <span class="status-tag yellow">${query.status}</span></div>
            <div>${query.userId?.name || 'Farmer'} · ${query.category}</div>
            <button class="btn-secondary" data-preview-review="${query._id}">Answer</button>
          </div>`).join('')
      : '<div>No pending support queries.</div>';
  } catch (error) {
    preview.innerHTML = `<div>${error.message || 'Unable to load support preview.'}</div>`;
  }
};

const loadSummary = async () => {
  try {
    setAdminMessage('Loading dashboard data...', 'info');
    const summary = await request('/admin/summary');
    const userCountEl = document.getElementById('userCount');
    const supportCountEl = document.getElementById('supportCount');
    const alertCountEl = document.getElementById('alertCount');
    const statusEl = document.getElementById('databaseStatus');
    const statusDetailEl = document.getElementById('databaseStatusDetail');
    const userCountDetailEl = document.getElementById('databaseUserCount');
    if (userCountEl) userCountEl.textContent = summary.userCount;
    if (supportCountEl) supportCountEl.textContent = summary.supportCount;
    if (alertCountEl) alertCountEl.textContent = summary.alertCount;
    if (statusEl) statusEl.textContent = summary.serviceStatus;
    if (statusDetailEl) statusDetailEl.textContent = summary.serviceStatus;
    if (userCountDetailEl) userCountDetailEl.textContent = summary.userCount;
    await loadUsers();
    await loadSupportQueries();
    await loadSupportPreview();
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

  const supportTable = document.getElementById('supportQueryTable');
  if (supportTable) {
    supportTable.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-review-query]');
      if (!button) return;
      const id = button.dataset.reviewQuery;
      const response = window.prompt('Enter your advice or response for this query:');
      if (!response) return;
      button.disabled = true;
      try {
        await request(`/admin/support/${id}/review`, { method: 'POST', body: JSON.stringify({ response, status: 'reviewed' }) });
        showToast('Support query answered.', 'success');
        await loadSummary();
        await loadNotifications();
      } catch (error) {
        showToast(error.message || 'Unable to answer query.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  const supportPreview = document.getElementById('supportPreviewList');
  if (supportPreview) {
    supportPreview.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-preview-review]');
      if (!button) return;
      const id = button.dataset.previewReview;
      const response = window.prompt('Enter your advice or response for this query:');
      if (!response) return;
      button.disabled = true;
      try {
        await request(`/admin/support/${id}/review`, { method: 'POST', body: JSON.stringify({ response, status: 'reviewed' }) });
        showToast('Support query answered.', 'success');
        await loadSummary();
        await loadNotifications();
      } catch (error) {
        showToast(error.message || 'Unable to answer query.', 'error');
      } finally {
        button.disabled = false;
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

const markNotificationsRead = async () => {
  try {
    await request('/admin/notifications/read', { method: 'POST' });
  } catch (_error) {
    // ignore failures for marking notifications read
  }
};

if (notificationBell) {
  notificationBell.addEventListener('click', async () => {
    if (!notificationPanel) return;
    const isHidden = notificationPanel.hasAttribute('hidden');
    notificationPanel.toggleAttribute('hidden', !isHidden);
    if (isHidden) {
      await markNotificationsRead();
      await loadNotifications();
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
