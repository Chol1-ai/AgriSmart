const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = 'login.html';

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const loadListings = async () => {
  const el = document.getElementById('dealerListings');
  if (!el) return;
  try {
    const products = await request('/marketplace/seller/products');
    el.innerHTML = products.length ? products.map(p => `<div>${p.name} — ${p.price}</div>`).join('') : 'No listings yet.';
  } catch (err) {
    el.textContent = err.message || 'Unable to load listings.';
  }
};

const loadOrders = async () => {
  const el = document.getElementById('dealerOrders');
  if (!el) return;
  try {
    const orders = await request('/marketplace/seller/orders');
    el.innerHTML = orders.length ? orders.map(o => `<div>${o._id} • ${o.total} • ${o.status}</div>`).join('') : 'No orders.';
  } catch (err) {
    el.textContent = err.message || 'Unable to load orders.';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadListings();
  loadOrders();
});
