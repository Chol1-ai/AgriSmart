const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = 'login.html';

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const loadAssigned = async () => {
  const el = document.getElementById('assignedDeliveries');
  if (!el) return;
  try {
    const orders = await request('/marketplace/delivery/assigned');
    if (!orders.length) return el.textContent = 'No assigned deliveries.';
    el.innerHTML = orders.map(o => `
      <div class="delivery-item" data-id="${o._id}">
        <div><strong>Order:</strong> ${o._id} • <strong>Total:</strong> ${o.total} • <span class="status">${o.status}</span></div>
        <div>
          <select class="status-select" data-id="${o._id}"></select>
          <button class="btn-primary" data-update-id="${o._id}">Update</button>
          <button class="btn-secondary" data-refresh-id="${o._id}">Refresh</button>
        </div>
        <div class="delivery-details" id="details-${o._id}">
          <small>Address: ${o.deliveryAddress || '—'}</small>
          <div>Items: ${o.items.map(it => `${escapeHtml(it.name)} x${it.quantity}`).join(', ')}</div>
        </div>
      </div>
    `).join('');
    // populate selects with allowed transitions
    const transitions = { assigned: ['picked'], picked: ['in_transit'], in_transit: ['delivered'] };
    orders.forEach((o) => {
      const sel = document.querySelector(`.status-select[data-id="${o._id}"]`);
      if (!sel) return;
      // add current status as disabled option
      const cur = document.createElement('option'); cur.value = o.status; cur.text = `Current: ${o.status}`; cur.selected = true; sel.appendChild(cur);
      const allowed = transitions[o.status] || [];
      allowed.forEach((s) => {
        const opt = document.createElement('option'); opt.value = s; opt.text = s.replace('_', ' ');
        sel.appendChild(opt);
      });
      // disable update if no allowed next status
      const btn = document.querySelector(`[data-update-id="${o._id}"]`);
      if (btn) btn.disabled = allowed.length === 0;
    });
  } catch (err) {
    el.textContent = err.message || 'Unable to load assigned deliveries.';
  }
};

document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-update-id]');
  if (!btn) return;
  const id = btn.dataset.updateId;
  const select = document.querySelector(`.status-select[data-id="${id}"]`);
  if (!select) return alert('Choose a status');
  btn.disabled = true;
  try {
    const status = select.value;
    await request(`/marketplace/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
    alert('Status updated');
    await loadAssigned();
  } catch (err) {
    alert(err.message || 'Unable to update status');
  } finally {
    btn.disabled = false;
  }
});

// support refresh per order
document.addEventListener('click', async (ev) => {
  const rbtn = ev.target.closest('[data-refresh-id]');
  if (!rbtn) return;
  const id = rbtn.dataset.refreshId;
  rbtn.disabled = true;
  try {
    await loadAssigned();
  } catch (_) {}
  rbtn.disabled = false;
});

document.addEventListener('DOMContentLoaded', () => loadAssigned());
