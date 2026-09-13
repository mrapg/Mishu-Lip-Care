// ╔══════════════════════════════════════════════════════════╗
// ║        Vaseline Lip Care 💋 — Unified Service Worker     ║
// ║        Offline PWA Caching + Firebase Cloud Messaging    ║
// ╚══════════════════════════════════════════════════════════╝

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const CACHE_NAME = 'vaseline-care-v20';
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

// Fetch — cache-first strategy
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
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Vaseline Lip Care 💋';
    const body = payload.notification?.body || payload.data?.body || 'Time to put Vaseline on those gorgeous lips! 💋';

    const options = {
      body: body,
      icon: './icons/apple-touch-icon.png',
      badge: './icons/icon-192.png',
      vibrate: [300, 100, 300, 100, 400],
      tag: 'partner-love-tap',
      renotify: true,
      data: { url: './' }
    };

    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.log('Firebase worker init note:', e);
}

// ── Native Web Push Event Listener ────────────────────────
self.addEventListener('push', (event) => {
  let title = 'Vaseline Lip Care 💋';
  let body = 'Time to moisturize those gorgeous lips! 💋';
  let tag = 'vaseline-push';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || data.notification?.title || title;
      body = data.message || data.body || data.notification?.body || body;
      tag = data.tag || tag;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: './icons/apple-touch-icon.png',
    badge: './icons/icon-192.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: tag,
    renotify: true,
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
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

// ── Background Partner Tap Listener ───────────────────────
let ntfyReader = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'START_NTFY_LISTENER') {
    const topic = `${data.topic}-lipcare`;
    startNtfyListener(topic, data.role);
  }
});

async function startNtfyListener(topic, role) {
  if (ntfyReader) {
    try { ntfyReader.cancel(); } catch (e) {}
    ntfyReader = null;
  }

  try {
    const response = await fetch(`https://ntfy.sh/${topic}/sse?since=now`, {
      headers: { 'Accept': 'text/event-stream' }
    });

    if (!response.ok) return;
    const reader = response.body.getReader();
    ntfyReader = reader;
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const block of parts) {
        const dataLine = block.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) continue;
        try {
          const msg = JSON.parse(dataLine.slice(5));
          if (!msg || !msg.message) continue;

          if (msg.time && (Date.now() / 1000 - msg.time > 15)) continue;
          if (msg.message.startsWith(`FROM:${role}`)) continue;

          let body = msg.message;
          let senderName = 'Your partner';
          const fromMatch = body.match(/^FROM:(\w+) /);
          if (fromMatch) {
            senderName = fromMatch[1];
            body = body.replace(/^FROM:\w+ /, '');
          }

          const notifTitle = `💌 Vaseline Love Tap from ${senderName}!`;
          self.registration.showNotification(notifTitle, {
            body: body,
            icon: './icons/apple-touch-icon.png',
            badge: './icons/icon-192.png',
            vibrate: [300, 100, 300, 100, 400],
            tag: 'partner-love-tap',
            renotify: true
          });

          self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((c) => c.postMessage({ type: 'PARTNER_TAP', from: senderName }));
          });
        } catch (e) {}
      }
    }
  } catch (err) {}
}
