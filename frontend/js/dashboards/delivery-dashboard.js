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
        <div>${o._id} • ${o.total} • <span class="status">${o.status}</span></div>
        <div>
          <select class="status-select" data-id="${o._id}">
            <option value="picked">Picked</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
          <button class="btn-primary" data-update-id="${o._id}">Update</button>
        </div>
      </div>
    `).join('');
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

document.addEventListener('DOMContentLoaded', () => loadAssigned());
