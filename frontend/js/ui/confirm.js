// Shared confirm modal helper — exposes `window.showConfirmModal(message, title)`
(function () {
  const showConfirmModal = (message, title = 'Confirm action') => new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const msg = document.getElementById('confirmModalMessage');
    const ttl = document.getElementById('confirmModalTitle');
    const ok = document.getElementById('confirmOkBtn');
    const cancel = document.getElementById('confirmCancelBtn');
    if (!modal || !ok || !cancel || !msg || !ttl) {
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
  window.showConfirmModal = showConfirmModal;
})();
