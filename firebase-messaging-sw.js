// ╔══════════════════════════════════════════════════════════╗
// ║        Vaseline Lip Care 💋 — Unified Service Worker     ║
// ║        Offline PWA Caching + Native Push Notifications   ║
// ╚══════════════════════════════════════════════════════════╝

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const CACHE_NAME = 'vaseline-care-v25';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './vaseline-model.png',
  './vaseline-model.glb',
  './lib/mqtt.min.js',
  './lib/model-viewer.min.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── Firebase Cloud Messaging Initialization ───────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvl579wZu7MKtLmRunfZ0xJgiqpto12C8",
  authDomain: "mishu-lipcare-df5c3.firebaseapp.com",
  projectId: "mishu-lipcare-df5c3",
  storageBucket: "mishu-lipcare-df5c3.firebasestorage.app",
  messagingSenderId: "11302655153",
  appId: "1:11302655153:web:bb5b475d0c153263253e90",
  measurementId: "G-37PV0YQQTL"
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }
} catch (e) {
  console.log('Firebase worker init note:', e);
}

// ── Single Unified Push Event Listener (No Duplicates) ────
self.addEventListener('push', (event) => {
  let title = 'Vaseline Lip Care 💋';
  let body = 'Time to moisturize those gorgeous lips! 💋';
  let tag = 'partner-love-tap';
  let senderName = null;

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || data.notification?.title || data.data?.title || title;
      body = data.message || data.body || data.notification?.body || data.data?.body || body;
      tag = data.tag || data.data?.tag || tag;
      senderName = data.from || data.data?.from || data.data?.sender || data.sender || null;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: './icons/apple-touch-icon.png',
    badge: './icons/icon-192.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: tag, // Collapses duplicates with identical tag
    renotify: true,
    data: { url: './' }
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (senderName) {
          clients.forEach((c) => c.postMessage({ type: 'PARTNER_TAP', from: senderName }));
        }
      })
    ])
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
