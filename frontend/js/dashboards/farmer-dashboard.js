const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const apiHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const pendingKey = 'agrismart.pendingOperations';
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationPanel = document.getElementById('notificationPanel');

if (!token) {
  window.location.href = 'index.html';
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...apiHeaders, ...(options.headers || {}) }
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
};

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const renderDashboard = (data) => {
  const crops = Array.isArray(data?.crops) ? data.crops : [];
  const livestock = Array.isArray(data?.livestock) ? data.livestock : [];
  const ponds = Array.isArray(data?.ponds) ? data.ponds : [];
  const cropSummary = crops.length
    ? crops.map((crop) => `${crop.cropType || 'Crop'}${crop.variety ? ` (${crop.variety})` : ''}`).join(', ')
    : 'No crop records yet';

  setText('welcome', `Welcome, ${user.name || 'farmer'}!`);
  setText('userName', user.name || 'Farmer');
  setText('userAvatar', (user.name || 'U').slice(0, 2).toUpperCase());
  setText('cropCount', cropSummary);
  setText('livestockCount', `${livestock.length || 0} animal records tracked`);
  setText('pondCount', `${ponds.length || 0} ponds active`);
  setText('alertCount', `${data?.pendingSupportQueries || 0} pending support queries`);
  setText('pondCountAquaculture', ponds.length || 0);
};

const queueOperation = (operation) => {
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  pending.push({ ...operation, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
  localStorage.setItem(pendingKey, JSON.stringify(pending));
  setText('actionMessage', 'Saved offline. It will sync when connectivity returns.');
};

const syncOfflineOperations = async () => {
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  if (!pending.length || !navigator.onLine) return;
  try {
    await request('/farmer/sync', { method: 'POST', body: JSON.stringify({ operations: pending }) });
    await request('/farmer/sync/resolve', { method: 'POST' });
    localStorage.removeItem(pendingKey);
    setText('actionMessage', 'Offline records synchronized.');
  } catch (_error) {
    setText('actionMessage', 'Sync will retry when the connection is available.');
  }
};

const renderNotifications = (alerts) => {
  const items = Array.isArray(alerts) ? alerts : [];
  if (notificationBadge) notificationBadge.textContent = items.length;
  if (notificationPanel) {
    notificationPanel.innerHTML = items.length
      ? items.map((alert, index) => `
        <div class="notification-item" data-index="${index}">
          <div class="notification-title">${escapeHtml(alert.title || 'Alert')}</div>
          <div class="notification-meta">${escapeHtml(alert.region || 'Regional')} • ${escapeHtml(new Date(alert.createdAt || Date.now()).toLocaleString())}</div>
          <div class="notification-meta">${escapeHtml(alert.message || '')}</div>
        </div>`).join('')
      : '<div class="notification-empty">No alerts yet.</div>';
  }
};

const loadNotifications = async () => {
  try {
    const alerts = await request('/farmer/alerts');
    renderNotifications(alerts);
  } catch (_error) {
    renderNotifications([]);
  }
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
    if (!notificationPanel) return;
    notificationPanel.hidden = !notificationPanel.hidden;
  });
}

const loadDashboard = async () => {
  try {
    const response = await request('/farmer/dashboard');
    renderDashboard(response);
  } catch (error) {
    setText('actionMessage', error.message || 'Unable to load dashboard data.');
  }
};

const submitJson = async (path, payload) => {
  if (!navigator.onLine) {
    queueOperation({ type: path, payload });
    return;
  }
  try {
    await request(path, { method: 'POST', body: JSON.stringify(payload) });
    setText('actionMessage', 'Record saved successfully.');
    await loadDashboard();
  } catch (error) {
    setText('actionMessage', error.message);
  }
};

const loadCommunityPosts = async () => {
  const list = document.getElementById('communityPostList');
  if (!list) return;
  try {
    const posts = await request('/farmer/community');
    const entries = Array.isArray(posts) ? posts : [];
    setText('communityCount', `${entries.length} ${entries.length === 1 ? 'post' : 'posts'}`);
    list.innerHTML = entries.length ? entries.map((post) => {
      const author = post.userId?.name || 'AgriSmart user';
      const location = post.region || post.userId?.location || 'Regional';
      const date = post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Just now';
      return `<article class="alert-item"><div><div class="alert-title">${escapeHtml(post.title)}</div><div class="alert-desc">${escapeHtml(author)} · ${escapeHtml(location)} · ${escapeHtml(date)}</div><p>${escapeHtml(post.content)}</p></div><span class="status-tag blue">${escapeHtml(post.category)}</span></article>`;
    }).join('') : '<p class="message">No community posts yet. Be the first to share an update.</p>';
  } catch (error) {
    list.innerHTML = `<p class="message">${escapeHtml(error.message || 'Unable to load community posts.')}</p>`;
  }
};

const openLeafCamera = () => {
  const imageInput = document.getElementById('leafImageInput');
  if (imageInput) imageInput.click();
};

const bindCameraActions = () => {
  const imageInput = document.getElementById('leafImageInput');
  const imageDataInput = document.getElementById('imageDataInput');
  const captureButton = document.getElementById('captureLeafButton');
  const scanButton = document.getElementById('scanLeafButton');

  if (!imageInput || !imageDataInput) return;

  imageInput.addEventListener('change', () => {
    const image = imageInput.files && imageInput.files[0];
    if (!image) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      imageDataInput.value = reader.result;
      imageDataInput.dispatchEvent(new Event('input', { bubbles: true }));
      setText('diagnosisResult', `${image.name} is ready for analysis.`);
    });
    reader.readAsDataURL(image);
  });

  if (captureButton) captureButton.addEventListener('click', openLeafCamera);
  if (scanButton) scanButton.addEventListener('click', () => {
    const cropNav = document.querySelector('[data-page="crops"]');
    if (cropNav) cropNav.click();
    window.setTimeout(openLeafCamera, 250);
  });
};

const bindFormActions = () => {
  const cropForm = document.getElementById('cropForm');
  if (cropForm) cropForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/crops', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const diagnosisForm = document.getElementById('diagnosisForm');
  if (diagnosisForm) diagnosisForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const diagnosisCategory = formData.diagnosisCategory || 'crop';
    const subjectValue = formData.cropType || '';
    const payload = {
      cropType: diagnosisCategory === 'crop' ? subjectValue : `${diagnosisCategory}: ${subjectValue}`,
      imageData: formData.imageData
    };

    try {
      const result = await request('/farmer/diagnose', { method: 'POST', body: JSON.stringify(payload) });
      if (!result.isAuthenticImage) {
        setText('diagnosisResult', `${result.diseaseName}: ${result.description}`);
      } else {
        const categoryLabel = diagnosisCategory === 'livestock' ? 'livestock' : diagnosisCategory === 'bird' ? 'bird' : 'crop';
        setText('diagnosisResult', `${result.diseaseName}: ${result.severity}. ${result.description} ${result.treatment} (${categoryLabel})`);
      }
    } catch (error) {
      setText('diagnosisResult', error.message);
    }
  });

  const livestockForm = document.getElementById('livestockForm');
  if (livestockForm) livestockForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/livestock', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const pondForm = document.getElementById('pondForm');
  if (pondForm) pondForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/ponds', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const financeForm = document.getElementById('financeForm');
  if (financeForm) financeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/finance', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const supportForm = document.getElementById('supportForm');
  if (supportForm) supportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/support', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const communityPostForm = document.getElementById('communityPostForm');
  if (communityPostForm) communityPostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.getElementById('communityMessage');
    try {
      await request('/farmer/community', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
      });
      event.currentTarget.reset();
      message.textContent = 'Post published to the community feed.';
      await loadCommunityPosts();
    } catch (error) {
      message.textContent = error.message;
    }
  });

  const reportButton = document.getElementById('reportButton');
  if (reportButton) reportButton.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/farmer/reports?format=csv`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Report download failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'agrismart-report.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      setText('actionMessage', error.message);
    }
  });

  const syncButton = document.getElementById('syncButton');
  if (syncButton) syncButton.addEventListener('click', syncOfflineOperations);
};

const bindNavigation = () => {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburgerBtn');
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const showPage = (pageName) => {
    navItems.forEach((item) => item.classList.toggle('active', item.dataset.page === pageName));
    pages.forEach((page) => page.classList.toggle('active', page.id === `page-${pageName}`));
    if (sidebar) sidebar.classList.remove('open');
  };
  navItems.forEach((item) => item.addEventListener('click', () => showPage(item.dataset.page)));
  document.querySelectorAll('[data-page-link]').forEach((item) => item.addEventListener('click', () => showPage(item.dataset.pageLink)));
  if (localStorage.getItem('agrismart.sidebarCollapsed') === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  }
  if (hamburger) hamburger.addEventListener('click', () => {
    if (!sidebar) return;
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('open');
      return;
    }
    const collapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    localStorage.setItem('agrismart.sidebarCollapsed', String(collapsed));
  });
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(pendingKey);
  window.location.href = 'index.html';
};

window.addEventListener('online', syncOfflineOperations);
bindNavigation();
bindCameraActions();
bindFormActions();
loadDashboard();
loadNotifications();
loadCommunityPosts();
syncOfflineOperations();

document.addEventListener('click', (event) => {
  if (!notificationPanel || notificationPanel.hidden) return;
  if (!notificationPanel.contains(event.target) && event.target !== notificationBell) {
    notificationPanel.hidden = true;
  }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
