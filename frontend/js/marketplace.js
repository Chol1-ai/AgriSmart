const storageKey = 'agrismart.marketplaceListings';
const sampleListings = [
  { id: 1, name: 'Purebred Friesian Cow', category: 'cattle', price: 8500000, quantity: '1 animal', breed: 'Friesian', age: 'mature', gender: 'female', description: 'Healthy dairy cow, vaccinated and producing well.', location: 'Mbarara, Uganda', images: [], status: 'active', createdAt: '2026-07-20T10:30:00' },
  { id: 2, name: 'Organic Tomatoes', category: 'crops', price: 3500, quantity: '200 kg', description: 'Freshly picked, pesticide-free tomatoes.', location: 'Kampala, Uganda', images: [], status: 'active', createdAt: '2026-07-21T14:20:00' },
  { id: 3, name: 'Nile Tilapia Fingerlings', category: 'fish', price: 500, quantity: '1,000 fingerlings', breed: 'Nile tilapia', age: 'young', gender: 'mixed', description: 'Healthy fingerlings, ready for stocking.', location: 'Jinja, Uganda', images: [], status: 'pending', createdAt: '2026-07-22T16:45:00' }
];
let listings = JSON.parse(localStorage.getItem(storageKey) || 'null') || sampleListings;
let uploadedImages = []; let editingId = null;
const $ = (id) => document.getElementById(id);
const animalCategories = ['cattle', 'goats', 'sheep', 'poultry', 'fish'];
const icons = { cattle: '🐄', goats: '🐐', sheep: '🐑', poultry: '🐔', crops: '🌾', fish: '🐟', other: '📦' };
const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const save = () => localStorage.setItem(storageKey, JSON.stringify(listings));
const toastContainer = document.getElementById('toastContainer');
const showNotice = (message, type = 'info') => {
  const notice = $('notice');
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
  notice.classList.remove('success', 'error', 'info');
  notice.classList.add(type);
  setTimeout(() => { if (notice) notice.hidden = true; }, 3500);
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
const formatPrice = (price) => `UGX ${Number(price).toLocaleString('en-UG')}`;
const token = localStorage.getItem('token');
const headersWithAuth = (extra = {}) => ({ Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json', ...extra });

const loadProductsFromServer = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/marketplace/products`);
    if (!res.ok) throw new Error('Failed to load listings');
    const data = await res.json();
    listings = (Array.isArray(data) ? data : []).map((p) => ({ id: p._id, name: p.name, category: p.category, price: p.price, quantity: p.quantity, breed: '', age: '', gender: '', description: p.description, location: p.location, images: p.images || [], status: p.status, createdAt: p.createdAt }));
    save();
    renderListings();
  } catch (error) {
    console.warn('Marketplace: server load failed, using local cache', error.message);
    renderListings();
  }
};
function renderListings() {
  const search = $('searchInput').value.toLowerCase(); const category = $('categoryFilter').value; const status = $('statusFilter').value; const sort = $('sortFilter').value;
  const filtered = listings.filter((item) => (category === 'all' || item.category === category) && (status === 'all' || item.status === status) && [item.name,item.description,item.breed,item.location].some((value) => String(value || '').toLowerCase().includes(search)));
  filtered.sort((a,b) => sort === 'price-low' ? a.price-b.price : sort === 'price-high' ? b.price-a.price : new Date(b.createdAt)-new Date(a.createdAt));
  $('emptyState').hidden = filtered.length !== 0;
  $('listingsGrid').innerHTML = filtered.map((item) => `<article class="listing-card"><div class="listing-image">${item.images?.[0] ? `<img src="${item.images[0]}" alt="${escapeHtml(item.name)}">` : icons[item.category] || icons.other}<span class="category-badge">${escapeHtml(item.category)}</span></div><div class="listing-body"><h2>${escapeHtml(item.name)}</h2><div class="price">${formatPrice(item.price)}</div><div class="meta"><i class="fas fa-box"></i> ${escapeHtml(item.quantity)}${item.location ? ` &middot; <i class="fas fa-location-dot"></i> ${escapeHtml(item.location)}` : ''}</div><p class="description">${escapeHtml(item.description)}</p><span class="status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span><div class="card-actions"><button type="button" data-view="${item.id}"><i class="fas fa-eye"></i> View</button><button type="button" class="edit" data-edit="${item.id}"><i class="fas fa-pen"></i> Edit</button><button type="button" class="delete" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.name)}"><i class="fas fa-trash"></i></button></div></div></article>`).join('');
}
function openModal(item) { editingId = item?.id || null; $('listingForm').reset(); uploadedImages = item?.images ? [...item.images] : []; if (item) { ['Name','Category','Price','Quantity','Location','Description'].forEach((field) => { $(`product${field}`).value = item[field.toLowerCase()] || ''; }); $('animalBreed').value=item.breed||''; $('animalAge').value=item.age||''; $('animalGender').value=item.gender||''; } $('modalTitle').innerHTML = `<i class="fas fa-${item ? 'pen' : 'plus-circle'}"></i> ${item ? 'Edit' : 'New'} listing`; $('submitText').textContent = item ? 'Update listing' : 'Publish listing'; $('animalFields').hidden = !animalCategories.includes($('productCategory').value); renderPreviews(); $('modalOverlay').classList.add('active'); $('modalOverlay').setAttribute('aria-hidden','false'); $('productName').focus(); }
function closeModal() { $('modalOverlay').classList.remove('active'); $('modalOverlay').setAttribute('aria-hidden','true'); }
function renderPreviews() { $('imagePreview').innerHTML = uploadedImages.map((image,index) => `<span class="preview"><img src="${image}" alt="Selected upload"><button type="button" data-remove="${index}" aria-label="Remove image">&times;</button></span>`).join(''); }
function readFiles(files) { [...files].forEach((file) => { if (!file.type.startsWith('image/') || file.size > 5*1024*1024) { showNotice(`${file.name} was skipped. Use an image smaller than 5 MB.`, 'error'); return; } const reader = new FileReader(); reader.onload = () => { uploadedImages.push(reader.result); renderPreviews(); }; reader.readAsDataURL(file); }); }
$('openModalButton').onclick = () => openModal(); $('emptyStateButton').onclick = () => openModal(); $('closeModalButton').onclick = closeModal; $('modalOverlay').onclick = (event) => { if (event.target === $('modalOverlay')) closeModal(); }; $('productCategory').onchange = () => { $('animalFields').hidden = !animalCategories.includes($('productCategory').value); }; $('imageUploadArea').onclick = () => $('imageInput').click(); $('imageInput').onchange = (event) => readFiles(event.target.files); $('imageUploadArea').ondragover = (event) => event.preventDefault(); $('imageUploadArea').ondrop = (event) => { event.preventDefault(); readFiles(event.dataTransfer.files); };
['searchInput','categoryFilter','statusFilter','sortFilter'].forEach((id) => $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', renderListings));
$('refreshButton').onclick = async () => { await loadProductsFromServer(); showNotice('Listings refreshed.', 'success'); showToast('Listings refreshed.', 'success'); };
$('imagePreview').onclick = (event) => { const button = event.target.closest('[data-remove]'); if (button) { uploadedImages.splice(Number(button.dataset.remove),1); renderPreviews(); } };

$('listingsGrid').onclick = async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = Number(button.dataset.edit || button.dataset.delete || button.dataset.view);
  const item = listings.find((listing) => listing.id === id);
  if (button.dataset.edit) openModal(item);
  else if (button.dataset.delete && item) {
    const confirmed = await (window.showConfirmModal ? window.showConfirmModal(`Delete “${item.name}”?`) : Promise.resolve(confirm(`Delete “${item.name}”?`)));
    if (!confirmed) return;
    try {
      if (token && String(item.id).length > 8) {
        const res = await fetch(`${API_BASE_URL}/marketplace/products/${item.id}`, { method: 'DELETE', headers: headersWithAuth() });
        if (!res.ok) throw new Error('Delete failed');
        await loadProductsFromServer();
      } else {
        listings = listings.filter((listing) => listing.id !== id);
        save();
        renderListings();
      }
      showNotice('Listing deleted.', 'success');
    } catch (error) {
      showNotice(error.message || 'Unable to delete listing', 'error');
    }
  } else if (button.dataset.view && item) alert(`${item.name}\n\n${formatPrice(item.price)}\nQuantity: ${item.quantity}\nLocation: ${item.location || 'Not specified'}\n\n${item.description}`);
};
$('listingForm').onsubmit = async (event) => {
  event.preventDefault();
  const existing = listings.find((item) => item.id === editingId);
  const payload = { name: $('productName').value.trim(), category: $('productCategory').value, price: Number($('productPrice').value), quantity: $('productQuantity').value.trim(), location: $('productLocation').value.trim(), description: $('productDescription').value.trim(), images: uploadedImages };
  try {
    if (existing && existing.id && String(existing.id).length > 8 && token) {
      const res = await fetch(`${API_BASE_URL}/marketplace/products/${existing.id}`, { method: 'PUT', headers: headersWithAuth(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Update failed');
      await loadProductsFromServer();
      showNotice('Listing updated.', 'success');
      showToast('Listing updated.', 'success');
      closeModal();
      return;
    }
    if (token) {
      const res = await fetch(`${API_BASE_URL}/marketplace/products`, { method: 'POST', headers: headersWithAuth(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Publish failed');
      await loadProductsFromServer();
      showNotice('Listing published.', 'success');
      showToast('Listing published.', 'success');
      closeModal();
      return;
    }
    const listing = { id: editingId || Date.now(), ...payload, status: 'active', createdAt: new Date().toISOString() };
    listings = existing ? listings.map((item) => item.id === editingId ? listing : item) : [listing, ...listings];
    save();
    renderListings();
    closeModal();
    showNotice(existing ? 'Listing updated.' : 'Listing published.', 'success');
    showToast(existing ? 'Listing updated.' : 'Listing published.', 'success');
  } catch (error) {
    showNotice(error.message || 'Unable to publish listing', 'error');
    showToast(error.message || 'Unable to publish listing', 'error');
  }
};
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); }); renderListings();
