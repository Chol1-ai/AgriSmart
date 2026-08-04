const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const apiHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
if (!token) window.location.href = 'index.html';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...apiHeaders, ...(options.headers || {}) } });
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

const loadQueries = async () => {
  try {
    const queries = await request('/expert/queries');
    const list = document.getElementById('queryList');
    const countElement = document.getElementById('pendingCount');
    const entries = Array.isArray(queries) ? queries : [];
    if (countElement) countElement.textContent = entries.length;
    if (list) {
      list.innerHTML = entries.length ? entries.map((query) => `<article class="card" style="margin-bottom:16px"><div class="card-title">${query.subject}<span class="status-tag yellow">Pending</span></div><p>${query.details}</p><button class="btn-primary" data-query-id="${query._id}">Mark reviewed</button></article>`).join('') : '<div class="card">No pending farmer queries.</div>';
      list.querySelectorAll('[data-query-id]').forEach((button) => button.addEventListener('click', async () => {
        await request(`/expert/queries/${button.dataset.queryId}/review`, { method: 'POST', body: JSON.stringify({ response: 'Reviewed by extension worker', status: 'reviewed' }) });
        loadQueries();
      }));
    }
  } catch (error) {
    const messageEl = document.getElementById('expertMessage');
    if (messageEl) messageEl.textContent = error.message || 'Unable to load queries.';
  }
};

const initializeUserInfo = () => {
  const userNameElement = document.getElementById('userName');
  if (userNameElement && user.name) {
    userNameElement.textContent = user.name;
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
const alertForm = document.getElementById('alertForm');
if (alertForm) {
  alertForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await request('/expert/broadcast', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      event.currentTarget.reset();
      const messageEl = document.getElementById('expertMessage');
      if (messageEl) messageEl.textContent = 'Advisory published.';
    } catch (error) {
      const messageEl = document.getElementById('expertMessage');
      if (messageEl) messageEl.textContent = error.message || 'Unable to publish advisory.';
    }
  });
}
loadQueries();
initializeUserInfo();

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
