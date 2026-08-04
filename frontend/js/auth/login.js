const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

if (form && message) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Signing in...';

    const email = document.getElementById('loginEmail')?.value?.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';

    if (!email || !password) {
      message.textContent = 'Please enter your email and password.';
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.textContent = 'Signed in successfully.';

      const role = data.user?.role || 'farmer';
      if (role === 'expert') window.location.href = '../html/expert-dashboard.html';
      else if (role === 'admin') window.location.href = '../html/admin-dashboard.html';
      else window.location.href = '../html/farmer-dashboard.html';
    } catch (error) {
      message.textContent = error.message || 'Unable to reach the AgriSmart server.';
    }
  });
}
