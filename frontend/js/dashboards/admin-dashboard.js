const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationPanel = document.getElementById('notificationPanel');
if (!token) window.location.href = 'index.html';

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
      ? items.map((alert) => `
        <div class="notification-item">
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
    table.innerHTML = entries.map((user) => `<tr><td>${user.name}</td><td>${user.email}</td><td><span class="status-tag blue">${user.role}</span></td></tr>`).join('');
  } catch (error) {
    table.innerHTML = `<tr><td colspan="3">${error.message || 'Unable to load users.'}</td></tr>`;
  }
};

const loadSummary = async () => {
  try {
    const summary = await request('/admin/summary');
    const userCountEl = document.getElementById('userCount');
    const alertCountEl = document.getElementById('alertCount');
    const statusEl = document.getElementById('databaseStatus');
    if (userCountEl) userCountEl.textContent = summary.userCount;
    if (alertCountEl) alertCountEl.textContent = summary.alertCount;
    if (statusEl) statusEl.textContent = summary.serviceStatus;
    await loadUsers();
    await loadNotifications();
  } catch (error) {
    const messageEl = document.getElementById('adminMessage');
    if (messageEl) messageEl.textContent = error.message || 'Unable to load admin summary.';
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

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => showPage(item.dataset.page)));
document.querySelectorAll('[data-page-link]').forEach((item) => item.addEventListener('click', () => showPage(item.dataset.pageLink)));
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
    try {
      await request('/admin/alerts', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      event.currentTarget.reset();
      const messageEl = document.getElementById('adminMessage');
      if (messageEl) messageEl.textContent = 'Alert created.';
      loadSummary();
      loadNotifications();
    } catch (error) {
      const messageEl = document.getElementById('adminMessage');
      if (messageEl) messageEl.textContent = error.message || 'Unable to create alert.';
    }
  });
}
loadSummary();
loadNotifications();
initializeUserInfo();

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

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
