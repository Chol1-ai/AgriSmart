const CACHE_NAME = 'agrismart-static-v3';
const STATIC_ASSETS = [
    '../html/index.html',
    '../html/login.html',
    '../html/register.html',
    '../html/farmer-dashboard.html',
    '../html/expert-dashboard.html',
    '../html/admin-dashboard.html',
    '../html/profile.html',
    '../css/base.css',
    '../css/auth.css',
    '../css/dashboard.css',
    '../css/components.css',
    '../css/farmer-dashboard.css',
    '../css/expert-dashboard.css',
    '../css/admin-dashboard.css',
    '../js/config/api.js',
    '../js/auth/login.js',
    '../js/auth/register.js',
    '../js/auth/auth-ui.js',
    '../js/dashboards/farmer-dashboard.js',
    '../js/dashboards/expert-dashboard.js',
    '../js/dashboards/admin-dashboard.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then((cached) => cached || caches.match('../html/index.html')))
    );
});
