// Minimal AgriAI chat widget
async function sendAssistantMessage(message) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/ai/assistant', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
  if (!res.ok) throw new Error('Assistant request failed');
  const data = await res.json();
  return data.reply;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('openAssistantBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const msg = prompt('Ask AgriAI (short question):');
    if (!msg) return;
    btn.disabled = true;
    try {
      const reply = await sendAssistantMessage(msg);
      alert('AgriAI reply:\n\n' + reply);
    } catch (err) {
      alert('AgriAI error: ' + (err.message || String(err)));
    } finally { btn.disabled = false; }
  });
});
