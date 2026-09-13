// Vaseline Lip Care 💋 — Service Worker
// Caches app shell & assets for 100% offline use on iPhone

const CACHE_NAME = 'vaseline-care-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './vaseline-model.png',
  './lib/mqtt.min.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
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
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
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

// ── ntfy.sh Background Partner Tap Listener ───────────────
// Receives messages from main app to start/stop background listening
let ntfyReader = null;
let ntfyRole = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'START_NTFY_LISTENER') {
    ntfyRole = data.role;
    const topic = `${data.topic}-lipcare`;
    startNtfyListener(topic, data.role);
  }
});

const CUTE_MESSAGES = [
  '💋 Time to put Vaseline on those gorgeous lips!',
  '🌸 Your lips are whispering "Vaseline please!" 🥰',
  '💙 Keep those lips soft, protected & glowing! ✨',
  '👑 Your lips deserve the royal blue Vaseline treatment!',
  '💧 Soft lips loading… Apply your Vaseline now! ✨',
  '🦋 Butterfly kisses need soft lips! Vaseline time!',
  '😘 A little Vaseline goes a long way! Moisturize! 💋',
  '⭐ Shine bright! Vaseline time, superstar! ⭐',
];

function randomMessage() {
  return CUTE_MESSAGES[Math.floor(Math.random() * CUTE_MESSAGES.length)];
}

async function startNtfyListener(topic, role) {
  // Stop any existing listener
  if (ntfyReader) {
    try { ntfyReader.cancel(); } catch (e) {}
    ntfyReader = null;
  }

  const listen = async () => {
    try {
      const response = await fetch(`https://ntfy.sh/${topic}/sse`, {
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
            // Skip messages sent by self
            if (msg.message.startsWith(`FROM:${role}`)) continue;

            // Extract sender name from message prefix
            let body = msg.message;
            let senderName = 'Your partner';
            const fromMatch = body.match(/^FROM:(\w+) /);
            if (fromMatch) {
              senderName = fromMatch[1];
              body = body.slice(fromMatch[0].length);
            }

            // Show OS-level notification (works even when app is closed)
            await self.registration.showNotification(`💌 ${senderName} tapped the jar for you!`, {
              body: body || randomMessage(),
              icon: './icons/apple-touch-icon.png',
              badge: './icons/icon-192.png',
              vibrate: [300, 100, 300, 100, 400],
              tag: 'partner-love-tap',
              renotify: true,
              requireInteraction: false,
            });

            // Forward to open clients (app windows) so they can animate
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
              client.postMessage({ type: 'PARTNER_TAP', from: senderName });
            }
          } catch (parseErr) {}
        }
      }
    } catch (err) {
      // Network error — reconnect after 5s
    }
    await new Promise(r => setTimeout(r, 5000));
    listen(); // Reconnect
  };

  listen();
}
