const authTabs = document.querySelectorAll('.auth-tabs [data-tab]');
const authForms = {
  login: document.getElementById('form-login'),
  register: document.getElementById('form-register')
};
const authFooter = document.getElementById('authFooter');

function showAuthForm(tabName) {
  authTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  Object.entries(authForms).forEach(([name, form]) => {
    if (!form) return;
    const isActive = name === tabName;
    form.classList.toggle('active', isActive);
    form.hidden = !isActive;
    form.setAttribute('aria-hidden', String(!isActive));
  });

  if (authFooter) {
    authFooter.innerHTML = tabName === 'login'
      ? 'Don\'t have an account? <button type="button" data-switch="register">Sign up</button>'
      : 'Already have an account? <button type="button" data-switch="login">Sign in</button>';
  }
}

const tablist = document.querySelector('.auth-tabs');
if (tablist) {
  tablist.addEventListener('click', (event) => {
    const clickedTab = event.target.closest('[data-tab]');
    if (clickedTab) {
      showAuthForm(clickedTab.dataset.tab);
    }
  });
}

if (authFooter) {
  authFooter.addEventListener('click', (event) => {
    const switchButton = event.target.closest('[data-switch]');
    if (switchButton) showAuthForm(switchButton.dataset.switch);
  });
}

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    button.querySelector('i').className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });
});

const roleSelect = document.getElementById('role');
document.querySelectorAll('.role-option').forEach((option) => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.role-option').forEach((item) => item.classList.remove('selected'));
    option.classList.add('selected');
    if (roleSelect) roleSelect.value = option.dataset.role;
  });
});

const registerForm = document.getElementById('authForm');
if (registerForm) {
  registerForm.addEventListener('submit', () => {
    const fullNameField = document.getElementById('name');
    const firstNameField = document.getElementById('firstName');
    const lastNameField = document.getElementById('lastName');
    if (fullNameField) {
      fullNameField.value = `${firstNameField?.value || ''} ${lastNameField?.value || ''}`.trim();
    }
  });
}
