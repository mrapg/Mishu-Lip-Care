// Vaseline Lip Care 💋 — Firebase Messaging Worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvl579wZu7MKtLmRunfZ0xJgiqpto12C8",
  authDomain: "mishu-lipcare-df5c3.firebaseapp.com",
  projectId: "mishu-lipcare-df5c3",
  storageBucket: "mishu-lipcare-df5c3.firebasestorage.app",
  messagingSenderId: "11302655153",
  appId: "1:11302655153:web:bb5b475d0c153263253e90",
  measurementId: "G-37PV0YQQTL"
};

firebase.initializeApp(FIREBASE_CONFIG);
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
