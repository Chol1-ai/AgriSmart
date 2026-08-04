const registerForm = document.getElementById('authForm');
const registerMessage = document.getElementById('message');

if (registerForm && registerMessage) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    registerMessage.textContent = 'Creating account...';
    const submitButton = registerForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    const firstName = document.getElementById('firstName')?.value?.trim() || '';
    const lastName = document.getElementById('lastName')?.value?.trim() || '';
    const name = document.getElementById('name')?.value?.trim() || `${firstName} ${lastName}`.trim();
    const email = document.getElementById('registerEmail')?.value?.trim() || document.getElementById('email')?.value?.trim() || '';
    const password = document.getElementById('registerPassword')?.value || document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value || '';
    const selectedRoleOption = document.querySelector('.role-option.selected');
    const roleSelect = document.getElementById('role');
    const role = selectedRoleOption?.dataset.role || roleSelect?.value || 'farmer';
    if (roleSelect) roleSelect.value = role;
    const location = document.getElementById('location')?.value?.trim() || '';
    const farmName = document.getElementById('farmName')?.value?.trim() || '';
    const termsAccepted = document.getElementById('terms')?.checked ?? true;

    if (!name || !email || !password) {
      registerMessage.textContent = 'Please complete all required fields.';
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (password.length < 6) {
      registerMessage.textContent = 'Password must be at least 6 characters.';
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (password !== confirmPassword) {
      registerMessage.textContent = 'Passwords do not match.';
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!termsAccepted) {
      registerMessage.textContent = 'Please accept the terms to continue.';
      if (submitButton) submitButton.disabled = false;
      return;
    }

    const payload = {
      name,
      email,
      password,
      role,
      location,
      farmName
    };

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Registration failed (${res.status})`);
      }

      if (!data.token) {
        throw new Error('Invalid server response: no token received');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      registerMessage.textContent = 'Account created successfully. Redirecting...';

      setTimeout(() => {
        const redirectRole = data.user?.role || 'farmer';
        if (redirectRole === 'expert') window.location.href = '../html/expert-dashboard.html';
        else if (redirectRole === 'admin') window.location.href = '../html/admin-dashboard.html';
        else window.location.href = '../html/farmer-dashboard.html';
      }, 500);
    } catch (error) {
      registerMessage.textContent = error.message || 'Unable to create your account. Check that the backend is running.';
      if (submitButton) submitButton.disabled = false;
    }
  });
}
