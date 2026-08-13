// Simple leaderboard widget
async function loadLeaderboard(limit = 10) {
  const container = document.getElementById('leaderboard');
  if (!container) return;
  container.innerHTML = '<p>Loading leaderboard…</p>';
  try {
    const res = await fetch('/api/gamification/leaderboard?limit=' + encodeURIComponent(limit));
    if (!res.ok) throw new Error('Network response was not ok');
    const users = await res.json();
    if (!users || users.length === 0) {
      container.innerHTML = '<p>No leaderboard data yet.</p>';
      return;
    }
    const list = document.createElement('ol');
    users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = `${u.name} — ${u.xp} XP (Lvl ${u.level || 1})`;
      list.appendChild(li);
    });
    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = '<p>Unable to load leaderboard.</p>';
    console.error('Leaderboard error', err);
  }
}

document.addEventListener('DOMContentLoaded', () => loadLeaderboard(10));
