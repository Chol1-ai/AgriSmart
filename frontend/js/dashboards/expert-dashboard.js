const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const apiHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
if (!token) window.location.href = 'index.html';

const expertMessage = document.getElementById('expertMessage');
const toastContainer = document.getElementById('toastContainer');
const setExpertMessage = (value, type = 'info') => {
  if (!expertMessage) return;
  expertMessage.textContent = value;
  expertMessage.classList.remove('success', 'error', 'info');
  expertMessage.classList.add(type);
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
const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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
    setExpertMessage('Loading farmer queries...', 'info');
    const queries = await request('/expert/queries');
    const list = document.getElementById('queryList');
    const countElement = document.getElementById('pendingCount');
    const entries = Array.isArray(queries) ? queries : [];
    if (countElement) countElement.textContent = entries.length;
    if (list) {
      list.innerHTML = entries.length ? entries.map((query) => `<article class="card" style="margin-bottom:16px"><div class="card-title">${escapeHtml(query.subject)}<span class="status-tag yellow">Pending</span></div><p>${escapeHtml(query.details)}</p><button class="btn-primary" data-query-id="${escapeHtml(query._id)}">Mark reviewed</button></article>`).join('') : '<div class="card">No pending farmer queries.</div>';
      list.querySelectorAll('[data-query-id]').forEach((button) => button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await request(`/expert/queries/${button.dataset.queryId}/review`, { method: 'POST', body: JSON.stringify({ response: 'Reviewed by extension worker', status: 'reviewed' }) });
          setExpertMessage('Query reviewed successfully.', 'success');
          showToast('Query reviewed successfully.', 'success');
          await loadQueries();
        } catch (reviewError) {
          setExpertMessage(reviewError.message || 'Unable to mark query reviewed.', 'error');
          showToast(reviewError.message || 'Unable to mark query reviewed.', 'error');
        } finally {
          button.disabled = false;
        }
      }));
    }
    if (!entries.length) setExpertMessage('No pending queries at the moment.', 'info');
  } catch (error) {
    setExpertMessage(error.message || 'Unable to load queries.', 'error');
  }
};

const initializeUserInfo = () => {
  const userNameElement = document.getElementById('userName');
  if (userNameElement && user.name) {
    userNameElement.textContent = user.name;
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
const alertForm = document.getElementById('alertForm');
if (alertForm) {
  alertForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = alertForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    try {
      await request('/expert/broadcast', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
      event.currentTarget.reset();
      setExpertMessage('Advisory published.', 'success');
      showToast('Advisory published.', 'success');
      await loadQueries();
    } catch (error) {
      setExpertMessage(error.message || 'Unable to publish advisory.', 'error');
      showToast(error.message || 'Unable to publish advisory.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
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
