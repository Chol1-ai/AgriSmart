const API_BASE_URL = (() => {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000/api';
  }

  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000/api';
  }

  if (window.location.hostname.includes('render')) {
    return `${window.location.protocol}//${window.location.hostname.replace('www.', '')}/api`;
  }

  return '/api';
})();
