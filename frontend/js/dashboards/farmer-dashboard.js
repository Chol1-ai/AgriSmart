const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const apiHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
const pendingKey = 'agrismart.pendingOperations';
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationPanel = document.getElementById('notificationPanel');

// Role-based visibility: show/hide nav items based on `user.roles` or `user.role`
const applyRoleVisibility = () => {
  const roles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role];
  const isExpert = roles.includes('expert') || roles.includes('admin');
  const isAdmin = roles.includes('admin');
  const expertNav = document.querySelector('.nav-item[data-page="expert"]');
  if (expertNav) expertNav.style.display = isExpert ? '' : 'none';
  // marketplace link is available to all authenticated users; if we wanted to hide for some roles, adjust here
  // add admin dashboard link dynamically for admins
  const sidebar = document.getElementById('sidebar');
  if (isAdmin && sidebar && !sidebar.querySelector('.nav-item.admin-link')) {
    const btn = document.createElement('a');
    btn.className = 'nav-item admin-link';
    btn.href = 'admin-dashboard.html';
    btn.innerHTML = '<i class="fas fa-cog"></i> Admin';
    sidebar.appendChild(btn);
  }
};

// Notifications: allow local dismiss of alert items so users can clear noisy announcements
const DISMISSED_ALERTS_KEY = 'agrismart.dismissedAlerts';
const getDismissedAlerts = () => JSON.parse(localStorage.getItem(DISMISSED_ALERTS_KEY) || '[]');
const dismissAlertLocal = (alertId) => {
  if (!alertId) return;
  const list = getDismissedAlerts();
  if (!list.includes(alertId)) list.push(alertId);
  localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(list));
};

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

let pondsCache = [];

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
};

const setStatusMessage = (id, value, type = 'info') => {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
  element.classList.remove('success', 'error', 'info');
  element.classList.add(type);
};

const toastContainer = document.getElementById('toastContainer');
const showToast = (message, type = 'info') => {
  if (!toastContainer) return;
  const toast = document.createElement('section');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✔️' : type === 'error' ? '⚠️' : 'ℹ️'}</span><div class="toast-body"><span class="toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</span><span class="toast-text"></span></div><button class="close-toast" aria-label="Dismiss notification">×</button>`;
  toast.querySelector('.toast-text').textContent = message;
  toast.querySelector('.close-toast').addEventListener('click', () => {
    toast.remove();
  });
  toastContainer.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
};

// Show a confirmation modal and return a Promise that resolves to true/false
const showConfirmModal = (message, title = 'Confirm action') => new Promise((resolve) => {
  const modal = document.getElementById('confirmModal');
  const msg = document.getElementById('confirmModalMessage');
  const ttl = document.getElementById('confirmModalTitle');
  const ok = document.getElementById('confirmOkBtn');
  const cancel = document.getElementById('confirmCancelBtn');
  if (!modal || !ok || !cancel || !msg || !ttl) {
    // fallback to native confirm when modal not available
    return resolve(confirm(message));
  }
  msg.textContent = message;
  ttl.textContent = title;
  modal.hidden = false;
  const cleanup = () => {
    ok.removeEventListener('click', onOk);
    cancel.removeEventListener('click', onCancel);
    modal.hidden = true;
  };
  const onOk = () => { cleanup(); resolve(true); };
  const onCancel = () => { cleanup(); resolve(false); };
  ok.addEventListener('click', onOk);
  cancel.addEventListener('click', onCancel);
});
// expose shared helper when possible
if (typeof window !== 'undefined') window.showConfirmModal = showConfirmModal;

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
  const pendingSupportQueries = Number(data?.pendingSupportQueries || 0);
  const cropSummary = crops.length
    ? crops.map((crop) => `${crop.cropType || 'Crop'}${crop.variety ? ` (${crop.variety})` : ''}`).join(', ')
    : 'No crop records yet';

  window.dashboardCrops = crops;
  window.dashboardLivestock = livestock;
  window.dashboardPonds = ponds;

  setText('welcome', `Welcome, ${user.name || 'farmer'}!`);
  setText('userName', user.name || 'Farmer');
  setText('userAvatar', (user.name || 'U').slice(0, 2).toUpperCase());
  setText('cropCount', cropSummary);
  setText('livestockCount', `${livestock.length || 0} animal records tracked`);
  setText('pondCount', `${ponds.length || 0} ponds active`);
  setText('pondCountAquaculture', ponds.length || 0);
  setText('pondStockCount', `${ponds.reduce((sum, pond) => sum + Number(pond.fingerlingCount || 0), 0)}`);
  setText('alertCount', pendingSupportQueries);

  populateInventoryFilters(crops, livestock);
  applyInventoryFilters(crops, livestock, ponds);
  renderPondHealthStatus(ponds);

  const supportQueryCard = document.getElementById('supportQueryCard');
  const supportQueryStatus = document.getElementById('supportQueryStatus');
  if (supportQueryCard && supportQueryStatus) {
    if (pendingSupportQueries > 0) {
      supportQueryCard.style.display = '';
      supportQueryStatus.textContent = 'Pending expert review';
    } else {
      supportQueryCard.style.display = 'none';
    }
  }
  renderInventory(crops, livestock, ponds);

  // Gamification display: XP, level, badges
  try {
    const xpVal = Number(data?.xp ?? user?.xp ?? 0);
    const levelVal = Number(data?.level ?? user?.level ?? 1);
    const badgesVal = Array.isArray(data?.badges) ? data.badges : Array.isArray(user?.badges) ? user.badges : [];
    setText('farmerXP', `XP: ${xpVal}`);
    setText('farmerLevel', `Level: ${levelVal}`);
    const badgeEl = document.getElementById('farmerBadges');
    if (badgeEl) badgeEl.innerHTML = badgesVal.length ? `Badges: ${badgesVal.join(', ')}` : 'Badges: <span class="small-text">None yet</span>';
  } catch (e) {
    // silent
  }
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

const formatAge = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'N/A';
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Less than a day';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month';
  if (diffMonths < 12) return `${diffMonths} months`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? '1 year' : `${diffYears} years`;
};

const renderTable = (headers, rows) => {
  const actionHeader = 'Actions';
  const fullHeaders = [...headers, actionHeader];
  return `
    <table class="inventory-table">
      <thead>
        <tr>${fullHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((row) => {
          const id = row && row.id ? row.id : '';
          const cells = row && row.cells ? row.cells : row;
          return `
          <tr data-record-id="${escapeHtml(id)}">${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}<td><button class="btn-secondary btn-edit" data-id="${escapeHtml(id)}">Edit</button> <button class="btn-danger btn-delete" data-id="${escapeHtml(id)}">Delete</button></td></tr>`;
        }).join('') : '<tr><td colspan="' + fullHeaders.length + '">No records available.</td></tr>'}
      </tbody>
    </table>`;
};

const renderInventoryGroup = (containerId, title, headers, rows) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="inventory-group-title">${escapeHtml(title)}</div>${renderTable(headers, rows)}`;
  // mark container with a target page for quick navigation when rows are clicked
  if (['goatInventory', 'cowInventory', 'pigInventory', 'otherLivestockInventory'].includes(containerId)) {
    container.dataset.targetPage = 'livestock';
  } else if (containerId === 'cropInventory') {
    container.dataset.targetPage = 'crops';
  } else if (containerId === 'fishInventory') {
    container.dataset.targetPage = 'aquaculture';
  } else {
    delete container.dataset.targetPage;
  }
};

const getPondStatus = (pond) => {
  const latest = (pond.waterQualityRecords || []).slice(-1)[0];
  const feedCount = (pond.feedRecords || []).length;
  if (latest) {
    return {
      label: 'Ready to monitor',
      dotClass: 'green',
      detail: `Last reading: pH ${escapeHtml(String(latest.pH || 'N/A'))}, ${escapeHtml(String(latest.temperature || 'N/A'))}°C`
    };
  }
  if (feedCount > 0) {
    return {
      label: 'Add water quality reading',
      dotClass: 'yellow',
      detail: `Feed records: ${feedCount}`
    };
  }
  return {
    label: 'Add readings',
    dotClass: 'red',
    detail: 'No pond readings yet'
  };
};

const openPondDetail = (pondId) => {
  const select = document.getElementById('pondSelection');
  if (!select || !pondId) return;
  select.value = pondId;
  showPondSummary(pondId);
};

const renderPondHealthStatus = (ponds) => {
  const list = document.getElementById('pondHealthList');
  if (!list) return;
  const pondItems = Array.isArray(ponds) ? ponds : [];
  list.innerHTML = pondItems.length
    ? pondItems.map((pond) => {
      const status = getPondStatus(pond);
      return `
        <div class="pond-item card-interactive" tabindex="0" data-page-link="aquaculture" data-pond-id="${escapeHtml(pond._id)}">
          <div class="name">${escapeHtml(pond.pondName || 'Unnamed pond')}</div>
          <div class="species">${escapeHtml(pond.species || 'Unknown species')}</div>
          <div class="status"><span class="dot ${status.dotClass}"></span>${escapeHtml(status.label)}</div>
          <div class="alert-desc">${escapeHtml(status.detail)}</div>
        </div>`;
    }).join('')
    : '<div class="message">No pond profiles available yet. Add a pond to get started.</div>';
};

const getInventoryFilters = () => {
  const animalCategory = document.getElementById('inventoryAnimalFilter')?.value || '';
  const cropType = document.getElementById('inventoryCropFilter')?.value || '';
  return { animalCategory, cropType };
};

const applyInventoryFilters = (crops, livestock, ponds) => {
  renderInventory(crops, livestock, ponds, getInventoryFilters());
};

const populateInventoryFilters = (crops, livestock) => {
  const animalFilter = document.getElementById('inventoryAnimalFilter');
  const cropFilter = document.getElementById('inventoryCropFilter');
  if (animalFilter) {
    const categories = [...new Set((Array.isArray(livestock) ? livestock : []).map((item) => item.category || '').filter(Boolean))].sort();
    animalFilter.innerHTML = '<option value="">All animals</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  }
  if (cropFilter) {
    const types = [...new Set((Array.isArray(crops) ? crops : []).map((item) => item.cropType || '').filter(Boolean))].sort();
    cropFilter.innerHTML = '<option value="">All crops</option>' + types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
  }
};

const renderInventory = (crops, livestock, ponds, filters = {}) => {
  const livestockItems = Array.isArray(livestock) ? livestock : [];
  const filteredLivestock = livestockItems.filter((item) => {
    if (filters.animalCategory && item.category !== filters.animalCategory) return false;
    return true;
  });
  const goatRows = filteredLivestock.filter((item) => /goat/i.test(item.category || '')).map((item) => [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)]);
  const cowRows = filteredLivestock.filter((item) => /cow|cattle/i.test(item.category || '')).map((item) => [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)]);
  const pigRows = filteredLivestock.filter((item) => /pig|swine/i.test(item.category || '')).map((item) => [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)]);
  const otherRows = filteredLivestock.filter((item) => !/goat|cow|cattle|pig|swine/i.test(item.category || '')).map((item) => [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)]);

  // attach ids to rows so tables render edit/delete buttons with correct ids
  const goatRowsMeta = filteredLivestock.filter((item) => /goat/i.test(item.category || '')).map((item) => ({ id: item._id, cells: [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)] }));
  const cowRowsMeta = filteredLivestock.filter((item) => /cow|cattle/i.test(item.category || '')).map((item) => ({ id: item._id, cells: [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)] }));
  const pigRowsMeta = filteredLivestock.filter((item) => /pig|swine/i.test(item.category || '')).map((item) => ({ id: item._id, cells: [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)] }));
  const otherRowsMeta = filteredLivestock.filter((item) => !/goat|cow|cattle|pig|swine/i.test(item.category || '')).map((item) => ({ id: item._id, cells: [item.category, item.breed || 'Unknown', String(item.count || 0), formatAge(item.createdAt)] }));

  renderInventoryGroup('goatInventory', 'Goats', ['Category', 'Breed', 'Count', 'Age'], goatRowsMeta);
  renderInventoryGroup('cowInventory', 'Cattle / Cows', ['Category', 'Breed', 'Count', 'Age'], cowRowsMeta);
  renderInventoryGroup('pigInventory', 'Pigs & Swine', ['Category', 'Breed', 'Count', 'Age'], pigRowsMeta);
  renderInventoryGroup('otherLivestockInventory', 'Other Livestock', ['Category', 'Breed', 'Count', 'Age'], otherRowsMeta);

  const cropItems = Array.isArray(crops) ? crops : [];
  const filteredCrops = cropItems.filter((item) => {
    if (filters.cropType && item.cropType !== filters.cropType) return false;
    return true;
  });
  const cropRows = filteredCrops.map((item) => [item.cropType || 'Unknown', item.variety || 'N/A', formatDate(item.plantingDate), formatDate(item.expectedHarvestDate), String(item.expectedYield || 0)]);
  const cropRowsMeta = filteredCrops.map((item) => ({ id: item._id, cells: [item.cropType || 'Unknown', item.variety || 'N/A', formatDate(item.plantingDate), formatDate(item.expectedHarvestDate), String(item.expectedYield || 0)] }));
  renderInventoryGroup('cropInventory', 'Crop inventory', ['Crop type', 'Variety', 'Planted', 'Harvest due', 'Expected yield'], cropRowsMeta);

  const pondItems = Array.isArray(ponds) ? ponds : [];
  const fishRows = pondItems.map((item) => [item.pondName || 'Unnamed pond', item.species || 'Unknown', String(item.fingerlingCount || 0), item.pondType || 'N/A', formatAge(item.createdAt)]);
  const fishRowsMeta = pondItems.map((item) => ({ id: item._id, cells: [item.pondName || 'Unnamed pond', item.species || 'Unknown', String(item.fingerlingCount || 0), item.pondType || 'N/A', formatAge(item.createdAt)] }));
  renderInventoryGroup('fishInventory', 'Pond / Fish inventory', ['Pond name', 'Species', 'Fingerlings', 'Type', 'Registered age'], fishRowsMeta);

  const animalCount = filteredLivestock.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const cropCount = filteredCrops.length;
  const pondCount = pondItems.length;
  const animalCountEl = document.getElementById('inventoryAnimalCount');
  const cropCountEl = document.getElementById('inventoryCropCount');
  const pondCountEl = document.getElementById('inventoryPondCount');
  if (animalCountEl) animalCountEl.textContent = String(animalCount);
  if (cropCountEl) cropCountEl.textContent = String(cropCount);
  if (pondCountEl) pondCountEl.textContent = String(pondCount);
};

const queueOperation = (operation) => {
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  pending.push({ ...operation, id: crypto.randomUUID(), timestamp: new Date().toISOString() });
  localStorage.setItem(pendingKey, JSON.stringify(pending));
  setStatusMessage('actionMessage', 'Saved offline. It will sync when connectivity returns.', 'info');
};

const syncOfflineOperations = async () => {
  const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
  if (!pending.length || !navigator.onLine) return;
  try {
    await request('/farmer/sync', { method: 'POST', body: JSON.stringify({ operations: pending }) });
    await request('/farmer/sync/resolve', { method: 'POST' });
    localStorage.removeItem(pendingKey);
    setStatusMessage('actionMessage', 'Offline records synchronized.', 'success');
  } catch (_error) {
    setStatusMessage('actionMessage', 'Sync will retry when the connection is available.', 'error');
  }
};

const renderNotifications = (data) => {
  const alerts = Array.isArray(data?.alerts) ? data.alerts : [];
  const supportUpdates = Array.isArray(data?.supportUpdates) ? data.supportUpdates : [];
  const dismissed = getDismissedAlerts();
  const visibleAlerts = alerts.filter((a) => !dismissed.includes(String(a._id)));
  const items = [
    ...visibleAlerts.map((alert) => ({ type: 'alert', ...alert })),
    ...supportUpdates.map((update) => ({ type: 'support', ...update }))
  ];

  if (notificationBadge) notificationBadge.textContent = items.length;
  if (notificationPanel) {
    notificationPanel.innerHTML = items.length
      ? `
        <div class="notification-panel-header">
          <span>${items.length} notification${items.length === 1 ? '' : 's'}</span>
          <button class="notification-clear" type="button">Clear all</button>
        </div>` + items.map((item, index) => `
        <div class="notification-item" data-index="${index}" data-type="${item.type}" data-id="${escapeHtml(item._id || '')}">
          <div class="notification-title">${escapeHtml(item.type === 'support' ? item.subject : item.title || 'Alert')}</div>
          <div class="notification-meta">${escapeHtml(item.type === 'support' ? 'Expert response available' : item.region || 'Regional')} • ${escapeHtml(new Date(item.createdAt || Date.now()).toLocaleString())}</div>
          <div class="notification-meta">${escapeHtml(item.type === 'support' ? item.response || 'Your support query has an update.' : item.message || '')}</div>
          <button class="notification-dismiss" type="button">Dismiss</button>
        </div>`).join('')
      : '<div class="notification-empty">No notifications yet.</div>';
  }
};

const clearNotifications = async () => {
  try {
    await request('/farmer/notifications/read', { method: 'POST' });
  } catch (_error) {
    // ignore failures when clearing notifications
  }
  if (!notificationPanel) return;
  notificationPanel.innerHTML = '<div class="notification-empty">No notifications yet.</div>';
  if (notificationBadge) notificationBadge.textContent = '0';
};

const loadNotifications = async () => {
  try {
    const data = await request('/farmer/notifications');
    renderNotifications(data);
  } catch (_error) {
    renderNotifications({ alerts: [], supportUpdates: [] });
  }
};

const renderPonds = (ponds) => {
  pondsCache = Array.isArray(ponds) ? ponds : [];
  const pondList = document.getElementById('pondList');
  if (pondList) {
    pondList.innerHTML = pondsCache.length
      ? pondsCache.map((pond) => `
          <article class="alert-item card-interactive" tabindex="0" data-page-link="aquaculture" data-pond-id="${escapeHtml(pond._id)}">
            <div><div class="alert-title">${escapeHtml(pond.pondName)}</div><div class="alert-desc">${escapeHtml(pond.species)} • ${escapeHtml(pond.pondType)}</div><p>Fingerlings: ${escapeHtml(String(pond.fingerlingCount || 0))} | Records: WQ ${pond.waterQualityRecords?.length || 0}, Feed ${pond.feedRecords?.length || 0}</p></div>
          </article>`).join('')
      : '<p class="message">No pond records yet. Create a pond to begin logging.</p>';
  }
  renderPondHealthStatus(ponds);
};

const populatePondSelection = (ponds) => {
  const select = document.getElementById('pondSelection');
  if (!select) return;
  select.innerHTML = '<option value="">Choose a pond</option>' + (Array.isArray(ponds) ? ponds.map((pond) => `<option value="${escapeHtml(pond._id)}">${escapeHtml(pond.pondName)}</option>`).join('') : '');
};

const showPondSummary = (pondId) => {
  const summary = document.getElementById('pondQualitySummary');
  if (!summary) return;
  const pond = pondsCache.find((item) => item._id === pondId);
  if (!pond) {
    summary.textContent = 'Select a pond to view latest record';
    return;
  }
  const latest = (pond.waterQualityRecords || []).slice(-1)[0];
  summary.textContent = latest
    ? `Latest: pH ${latest.pH}, Temp ${latest.temperature}°C, DO ${latest.dissolvedOxygen} mg/L on ${new Date(latest.date).toLocaleDateString()}`
    : 'No water quality readings logged yet.';
};

const loadPonds = async () => {
  try {
    const ponds = await request('/farmer/ponds');
    renderPonds(ponds);
    populatePondSelection(ponds);
  } catch (error) {
    const pondList = document.getElementById('pondList');
    if (pondList) pondList.innerHTML = `<p class="message">${escapeHtml(error.message || 'Unable to load ponds.')}</p>`;
  }
};

const getSelectedPondId = () => document.getElementById('pondSelection')?.value || '';

const loadSupportHistory = async (onlyUnanswered = false) => {
  const history = document.getElementById('supportHistory');
  if (!history) return;
  try {
    const queries = await request('/farmer/support/queries');
    const entries = Array.isArray(queries) ? queries : [];
    const filtered = onlyUnanswered ? entries.filter((query) => !query.response) : entries;
    history.innerHTML = filtered.length
      ? filtered.map((query) => `
          <div class="support-history-item">
            <div><strong>${escapeHtml(query.subject)}</strong> <span class="status-tag ${query.status === 'pending' ? 'yellow' : query.status === 'resolved' ? 'green' : 'blue'}">${escapeHtml(query.status)}</span></div>
            <div>${escapeHtml(query.category)} • ${escapeHtml(new Date(query.createdAt || Date.now()).toLocaleString())}</div>
            <p>${escapeHtml(query.details)}</p>
            ${query.response ? `<div class="support-response"><strong>Expert response:</strong><p>${escapeHtml(query.response)}</p></div>` : '<div class="support-response"><em>No response yet.</em></div>'}
          </div>`).join('')
      : '<div>No support queries found yet.</div>';
  } catch (error) {
    history.innerHTML = `<div>${escapeHtml(error.message || 'Unable to load support history.')}</div>`;
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

const dismissNotification = async (item) => {
  const type = item.dataset.type;
  markNotificationRead(item);
  if (type === 'support') {
    try {
      await request('/farmer/notifications/read', { method: 'POST' });
    } catch (_error) {
      // ignore dismiss failures
    }
  } else if (type === 'alert') {
    // locally remember dismissed alerts
    const id = item.dataset.id;
    if (id) dismissAlertLocal(id);
  }
};

if (notificationPanel) {
  notificationPanel.addEventListener('click', (event) => {
    const clearButton = event.target.closest('.notification-clear');
    if (clearButton) {
      clearNotifications();
      return;
    }
    const dismissButton = event.target.closest('.notification-dismiss');
    if (dismissButton) {
      const item = dismissButton.closest('.notification-item');
      if (item) dismissNotification(item);
      return;
    }
    const item = event.target.closest('.notification-item');
    if (item) {
      markNotificationRead(item);
    }
  });
}

if (notificationBell) {
  notificationBell.addEventListener('click', async () => {
    if (!notificationPanel) return;
    const shouldShow = notificationPanel.hidden;
    notificationPanel.hidden = !notificationPanel.hidden;
    if (shouldShow) {
      try {
        await request('/farmer/notifications/read', { method: 'POST' });
        await loadNotifications();
      } catch (_error) {
        // keep current notification panel state if marking read fails
      }
    }
  });
}

const loadDashboard = async () => {
  try {
    const response = await request('/farmer/dashboard');
    renderDashboard(response);
  } catch (error) {
    setStatusMessage('actionMessage', error.message || 'Unable to load dashboard data.', 'error');
  }
};

const submitJson = async (path, payload, successMessage = 'Record saved successfully.') => {
  if (!navigator.onLine) {
    queueOperation({ type: path, payload });
    return;
  }
  try {
    await request(path, { method: 'POST', body: JSON.stringify(payload) });
    setStatusMessage('actionMessage', successMessage, 'success');
    showToast(successMessage, 'success');
    await loadDashboard();
    await loadPonds();
  } catch (error) {
    setStatusMessage('actionMessage', error.message, 'error');
    showToast(error.message, 'error');
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
        return `<article class="alert-item" data-page-link="community" data-post-id="${escapeHtml(post._id || '')}"><div><div class="alert-title">${escapeHtml(post.title)}</div><div class="alert-desc">${escapeHtml(author)} · ${escapeHtml(location)} · ${escapeHtml(date)}</div><p>${escapeHtml(post.content)}</p></div><span class="status-tag blue">${escapeHtml(post.category)}</span></article>`;
    }).join('') : '<p class="message">No community posts yet. Be the first to share an update.</p>';
  } catch (error) {
    list.innerHTML = `<p class="message">${escapeHtml(error.message || 'Unable to load community posts.')}</p>`;
    setStatusMessage('communityMessage', error.message || 'Unable to load community posts.', 'error');
    showToast(error.message || 'Unable to load community posts.', 'error');
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
  if (cropForm) {
    const _cropSubmit = (event) => {
      event.preventDefault();
      submitJson('/farmer/crops', Object.fromEntries(new FormData(event.currentTarget)));
    };
    cropForm._submitHandler = _cropSubmit;
    cropForm.addEventListener('submit', _cropSubmit);
  }

  const diagnosisForm = document.getElementById('diagnosisForm');
  if (diagnosisForm) diagnosisForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    const diagnosisCategory = formData.diagnosisCategory || 'crop';
    const subjectValue = formData.cropType || '';
    const payload = {
      diagnosisCategory,
      cropType: subjectValue,
      imageData: formData.imageData
    };

    try {
      const result = await request('/farmer/diagnose', { method: 'POST', body: JSON.stringify(payload) });
      const aiError = result?.aiError;
      const banner = document.getElementById('aiErrorBanner');
      if (aiError && banner) {
        // show banner with dismiss button
        banner.innerHTML = `<span>AI service notice: ${aiError.message || JSON.stringify(aiError)} — using local fallback.</span><button id="dismissAiError" style="margin-left:12px;background:transparent;border:none;color:#9b1c1c;font-weight:bold;cursor:pointer">Dismiss</button>`;
        banner.hidden = false;
        banner.style.display = 'block';
        const dismissed = localStorage.getItem('agrismart.dismissAiError');
        if (dismissed === 'true') {
          banner.hidden = true; banner.style.display = 'none';
        } else {
          const btn = document.getElementById('dismissAiError');
          if (btn) btn.addEventListener('click', () => {
            banner.hidden = true; banner.style.display = 'none';
            localStorage.setItem('agrismart.dismissAiError', 'true');
          });
        }
      } else if (banner) {
        banner.hidden = true;
        banner.style.display = 'none';
        localStorage.removeItem('agrismart.dismissAiError');
      }

      if (!result.isAuthenticImage) {
        let msg = `${result.diseaseName}: ${result.description}`;
        setText('diagnosisResult', msg);
      } else {
        let msg = `${result.classification || diagnosisCategory.toLowerCase()} diagnosis: ${result.diseaseName} (${result.severity}). ${result.description} ${result.treatment}`;
        setText('diagnosisResult', msg);
      }
    } catch (error) {
      setText('diagnosisResult', error.message);
    }
  });

  const livestockForm = document.getElementById('livestockForm');
  if (livestockForm) {
    const _livestockSubmit = (event) => {
      event.preventDefault();
      submitJson('/farmer/livestock', Object.fromEntries(new FormData(event.currentTarget)));
    };
    livestockForm._submitHandler = _livestockSubmit;
    livestockForm.addEventListener('submit', _livestockSubmit);
  }

  const pondForm = document.getElementById('pondForm');
  if (pondForm) {
    const _pondSubmit = (event) => {
      event.preventDefault();
      submitJson('/farmer/ponds', Object.fromEntries(new FormData(event.currentTarget)));
    };
    pondForm._submitHandler = _pondSubmit;
    pondForm.addEventListener('submit', _pondSubmit);
  }

  const pondSelection = document.getElementById('pondSelection');
  if (pondSelection) {
    pondSelection.addEventListener('change', () => showPondSummary(pondSelection.value));
  }

  const waterQualityForm = document.getElementById('waterQualityForm');
  if (waterQualityForm) waterQualityForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pondId = getSelectedPondId();
    if (!pondId) {
      setStatusMessage('pondRecordsMessage', 'Please select a pond before adding readings.', 'error');
      return;
    }
    await submitJson(`/farmer/ponds/${pondId}/water-quality`, Object.fromEntries(new FormData(event.currentTarget)), 'Water quality reading added.');
    showPondSummary(pondId);
  });

  const feedRecordForm = document.getElementById('feedRecordForm');
  if (feedRecordForm) feedRecordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const pondId = getSelectedPondId();
    if (!pondId) {
      setStatusMessage('pondRecordsMessage', 'Please select a pond before adding a feed record.', 'error');
      return;
    }
    await submitJson(`/farmer/ponds/${pondId}/feed-record`, Object.fromEntries(new FormData(event.currentTarget)), 'Feed record added.');
    showPondSummary(pondId);
  });

  const financeForm = document.getElementById('financeForm');
  if (financeForm) financeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitJson('/farmer/finance', Object.fromEntries(new FormData(event.currentTarget)));
  });

  const supportForm = document.getElementById('supportForm');
  if (supportForm) supportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await submitJson('/farmer/support', Object.fromEntries(new FormData(event.currentTarget)), 'Support request sent to admin for review.');
    await loadSupportHistory(document.getElementById('unansweredFilter')?.checked);
    const supportPage = document.querySelector('[data-page="expert"]');
    if (supportPage) supportPage.click();
  });

  const animalFilter = document.getElementById('inventoryAnimalFilter');
  const cropFilter = document.getElementById('inventoryCropFilter');
  const resetFilter = document.getElementById('inventoryFilterReset');
  if (animalFilter) {
    animalFilter.addEventListener('change', () => applyInventoryFilters(window.dashboardCrops || [], window.dashboardLivestock || [], window.dashboardPonds || []));
  }
  if (cropFilter) {
    cropFilter.addEventListener('change', () => applyInventoryFilters(window.dashboardCrops || [], window.dashboardLivestock || [], window.dashboardPonds || []));
  }
  if (resetFilter) {
    resetFilter.addEventListener('click', () => {
      if (animalFilter) animalFilter.value = '';
      if (cropFilter) cropFilter.value = '';
      applyInventoryFilters(window.dashboardCrops || [], window.dashboardLivestock || [], window.dashboardPonds || []);
    });
  }

  const unansweredFilter = document.getElementById('unansweredFilter');
  const refreshSupportHistory = document.getElementById('refreshSupportHistory');
  if (unansweredFilter) {
    unansweredFilter.addEventListener('change', () => {
      loadSupportHistory(unansweredFilter.checked);
    });
  }
  if (refreshSupportHistory) {
    refreshSupportHistory.addEventListener('click', () => {
      loadSupportHistory(unansweredFilter?.checked);
    });
  }

  const communityPostForm = document.getElementById('communityPostForm');
  if (communityPostForm) communityPostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageId = 'communityMessage';
    try {
      await request('/farmer/community', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
      });
      event.currentTarget.reset();
      setStatusMessage(messageId, 'Post published to the community feed.', 'success');
      showToast('Community post published.', 'success');
      await loadCommunityPosts();
    } catch (error) {
      setStatusMessage(messageId, error.message, 'error');
      showToast(error.message, 'error');
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
    if (pageName === 'dashboard') startPondPolling(); else stopPondPolling();
    if (pageName === 'trash') loadTrash();
  };
  let pondPollingId = null;
  const startPondPolling = () => {
    if (pondPollingId) return;
    pondPollingId = setInterval(() => {
      if (document.querySelector('.page.active')?.id === 'page-dashboard') {
        loadPonds().catch(() => {});
        loadDashboard().catch(() => {});
      }
    }, 30000);
  };
  const stopPondPolling = () => {
    if (!pondPollingId) return;
    clearInterval(pondPollingId);
    pondPollingId = null;
  };
  navItems.forEach((item) => item.addEventListener('click', () => showPage(item.dataset.page)));
  const navigateCard = (target) => {
    const pageLink = target.dataset.pageLink;
    const pondId = target.dataset.pondId;
    if (!pageLink) return;
    showPage(pageLink);
    if (pondId) {
      openPondDetail(pondId);
    }
  };
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-page-link]');
    if (target) navigateCard(target);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target.closest('[data-page-link]');
      if (target) {
        event.preventDefault();
        navigateCard(target);
      }
    }
  });
  if (localStorage.getItem('agrismart.sidebarCollapsed') === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  }

  // Gamification quick actions
  const askExpertQuickBtn = document.getElementById('askExpertQuickBtn');
  if (askExpertQuickBtn) askExpertQuickBtn.addEventListener('click', async () => {
    try {
      // open support form prefilled
      document.querySelector('[data-page="expert"]')?.click();
      const form = document.getElementById('supportForm');
      if (!form) return;
      form.elements['subject'].value = 'Quick expert request';
      form.elements['details'].value = 'Please advise on urgent farm issue.';
      form.elements['category'].value = 'crop';
      // optional: submit immediately
      // await submitJson('/farmer/support', Object.fromEntries(new FormData(form)), 'Support request sent.');
    } catch (error) {
      showToast(error.message || 'Unable to open expert form', 'error');
    }
  });

  const viewChallengesBtn = document.getElementById('viewChallengesBtn');
  if (viewChallengesBtn) viewChallengesBtn.addEventListener('click', () => {
    // Navigate to community for now where challenges are listed
    document.querySelector('[data-page="community"]')?.click();
    showToast('Challenges listed in Community Feed.', 'info');
  });
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
// Apply role visibility before binding navigation so nav items reflect user roles
applyRoleVisibility();
bindNavigation();
bindCameraActions();
bindFormActions();
loadDashboard();
loadNotifications();
loadSupportHistory();
loadCommunityPosts();
syncOfflineOperations();

// Navigate to details when clicking inventory rows
document.addEventListener('click', (event) => {
  const row = event.target.closest('.inventory-table tbody tr');
  if (!row) return;
  const container = row.closest('.inventory-group');
  const targetPage = container?.dataset?.targetPage;
  if (targetPage) {
    document.querySelector(`[data-page="${targetPage}"]`)?.click();
  }
});

// Edit / Delete handlers for inventory
document.addEventListener('click', async (event) => {
  const editBtn = event.target.closest('.btn-edit');
  const deleteBtn = event.target.closest('.btn-delete');
  if (editBtn) {
    const id = editBtn.dataset.id;
    handleEditRecord(id);
    return;
  }
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    const confirmed = await showConfirmModal('Delete this record? This action cannot be undone.');
    if (!confirmed) return;
    try {
      // determine type by finding row's closest inventory group
      const row = deleteBtn.closest('tr');
      const container = row.closest('.inventory-group');
      const groupId = container?.id;
      if (groupId === 'cropInventory') {
        await request(`/farmer/crops/${id}`, { method: 'DELETE' });
      } else if (groupId === 'fishInventory') {
        await request(`/farmer/ponds/${id}`, { method: 'DELETE' });
      } else {
        await request(`/farmer/livestock/${id}`, { method: 'DELETE' });
      }
      showToast('Record deleted.', 'success');
      await loadDashboard();
      await loadPonds();
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error');
    }
  }
});

const handleEditRecord = async (id) => {
  // fetch record from dashboard caches and prefill appropriate form
  const crop = (window.dashboardCrops || []).find((c) => c._id === id);
  if (crop) {
    const form = document.getElementById('cropForm');
    if (!form) return;
    form.elements['cropType'].value = crop.cropType || '';
    form.elements['variety'].value = crop.variety || '';
    // The crop form does not include a plantingDate input; populate fields that exist
    form.elements['expectedHarvestDate'].value = crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toISOString().slice(0,10) : '';
    form.elements['expectedYield'].value = crop.expectedYield || '';
    // switch to crops page
    document.querySelector('[data-page="crops"]')?.click();
    // change submit to PUT
    form.dataset.editId = id;
    const _orig = form._submitHandler;
    if (_orig) form.removeEventListener('submit', _orig);
    const _editHandler = async (event) => {
      event.preventDefault();
      try {
        await request(`/farmer/crops/${form.dataset.editId}`, { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        showToast('Crop updated.', 'success');
        delete form.dataset.editId;
        form.reset();
        await loadDashboard();
      } catch (error) {
        showToast(error.message || 'Update failed', 'error');
      } finally {
        form.removeEventListener('submit', _editHandler);
        if (_orig) {
          form._submitHandler = _orig;
          form.addEventListener('submit', _orig);
        }
      }
    };
    form._submitHandler = _editHandler;
    form.addEventListener('submit', _editHandler);
    return;
  }
  const animal = (window.dashboardLivestock || []).find((a) => a._id === id);
  if (animal) {
    const form = document.getElementById('livestockForm');
    if (!form) return;
    form.elements['category'].value = animal.category || '';
    form.elements['breed'].value = animal.breed || '';
    form.elements['count'].value = animal.count || '';
    document.querySelector('[data-page="livestock"]')?.click();
    form.dataset.editId = id;
    const _origLivestock = form._submitHandler;
    if (_origLivestock) form.removeEventListener('submit', _origLivestock);
    const _editLivestock = async (event) => {
      event.preventDefault();
      try {
        await request(`/farmer/livestock/${form.dataset.editId}`, { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        showToast('Livestock updated.', 'success');
        delete form.dataset.editId;
        form.reset();
        await loadDashboard();
      } catch (error) {
        showToast(error.message || 'Update failed', 'error');
      } finally {
        form.removeEventListener('submit', _editLivestock);
        if (_origLivestock) {
          form._submitHandler = _origLivestock;
          form.addEventListener('submit', _origLivestock);
        }
      }
    };
    form._submitHandler = _editLivestock;
    form.addEventListener('submit', _editLivestock);
    return;
  }
  const pond = (window.dashboardPonds || []).find((p) => p._id === id);
  if (pond) {
    const form = document.getElementById('pondForm');
    if (!form) return;
    form.elements['pondName'].value = pond.pondName || '';
    form.elements['pondType'].value = pond.pondType || '';
    form.elements['species'].value = pond.species || '';
    form.elements['fingerlingCount'].value = pond.fingerlingCount || '';
    document.querySelector('[data-page="aquaculture"]')?.click();
    form.dataset.editId = id;
    const _origPond = form._submitHandler;
    if (_origPond) form.removeEventListener('submit', _origPond);
    const _editPond = async (event) => {
      event.preventDefault();
      try {
        await request(`/farmer/ponds/${form.dataset.editId}`, { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        showToast('Pond updated.', 'success');
        delete form.dataset.editId;
        form.reset();
        await loadDashboard();
        await loadPonds();
      } catch (error) {
        showToast(error.message || 'Update failed', 'error');
      } finally {
        form.removeEventListener('submit', _editPond);
        if (_origPond) {
          form._submitHandler = _origPond;
          form.addEventListener('submit', _origPond);
        }
      }
    };
    form._submitHandler = _editPond;
    form.addEventListener('submit', _editPond);
    return;
  }
};

// Load deleted items (Trash) and render restore buttons
const renderDeletedList = (data) => {
  const container = document.getElementById('trashContent');
  if (!container) return;
  const crops = Array.isArray(data?.crops) ? data.crops : [];
  const livestock = Array.isArray(data?.livestock) ? data.livestock : [];
  const ponds = Array.isArray(data?.ponds) ? data.ponds : [];
  const makeRow = (item, type) => `
    <div class="deleted-row">
      <div class="deleted-meta"><strong>${escapeHtml(item.name || item.cropType || item.category || item.pondName || 'Record')}</strong>
        <div class="small-text">${escapeHtml(type)} • Deleted ${escapeHtml(formatAge(item.deletedAt))}</div>
      </div>
      <div class="deleted-actions"><button class="btn-secondary btn-restore" data-type="${escapeHtml(type.toLowerCase())}" data-id="${escapeHtml(item._id)}">Restore</button></div>
    </div>`;

  container.innerHTML = `
    <div class="deleted-section"><h3>Crops</h3>${crops.length ? crops.map((c) => makeRow(c, 'Crop')).join('') : '<p class="message">No deleted crops.</p>'}</div>
    <div class="deleted-section"><h3>Livestock</h3>${livestock.length ? livestock.map((l) => makeRow(l, 'Livestock')).join('') : '<p class="message">No deleted livestock.</p>'}</div>
    <div class="deleted-section"><h3>Ponds</h3>${ponds.length ? ponds.map((p) => makeRow(p, 'Pond')).join('') : '<p class="message">No deleted ponds.</p>'}</div>`;
};

const loadTrash = async () => {
  try {
    const data = await request('/farmer/deleted');
    renderDeletedList(data);
  } catch (error) {
    const container = document.getElementById('trashContent');
    if (container) container.innerHTML = `<p class="message">${escapeHtml(error.message || 'Unable to load deleted items.')}</p>`;
  }
};

// Restore a deleted item
const restoreDeleted = async (type, id, button) => {
  if (!type || !id) return;
  const confirmed = await showConfirmModal('Restore this item?');
  if (!confirmed) return;
  if (button) button.disabled = true;
  try {
    await request(`/farmer/restore/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, { method: 'POST' });
    showToast('Item restored.', 'success');
    await loadDashboard();
    await loadPonds();
    await loadTrash();
  } catch (error) {
    showToast(error.message || 'Restore failed', 'error');
  } finally {
    if (button) button.disabled = false;
  }
};

// delegate restore button clicks
document.addEventListener('click', (event) => {
  const btn = event.target.closest('.btn-restore');
  if (!btn) return;
  const type = btn.dataset.type;
  const id = btn.dataset.id;
  restoreDeleted(type, id, btn);
});

document.addEventListener('click', (event) => {
  if (!notificationPanel || notificationPanel.hidden) return;
  if (!notificationPanel.contains(event.target) && event.target !== notificationBell) {
    notificationPanel.hidden = true;
  }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
