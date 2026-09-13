/* ╔══════════════════════════════════════════════════════════╗
   ║        Vaseline Lip Care 💋 — Application Logic          ║
   ╚══════════════════════════════════════════════════════════╝ */

// ── Cute Vaseline & Lip Care Messages for Mishu ──────────
const MESSAGES = [
  { emoji: '💋', text: 'Hey Mishu! Time for a swipe of\nVaseline on those lovely lips!' },
  { emoji: '💙', text: 'Vaseline time, Mishu! Keep those cute\nlips soft, protected & glowing! ✨' },
  { emoji: '🫦', text: 'Skin protecting jelly alert!\nMoisturize those beautiful lips, Mishu!' },
  { emoji: '🌸', text: 'Mishu’s lips called...\nthey want their favorite blue jar! 💕' },
  { emoji: '✨', text: 'Soft lips loading...\nApply your Vaseline now, Mishu! 💧' },
  { emoji: '💖', text: "Reminder: Mishu is stunning!\nNow let's protect that smile!" },
  { emoji: '👑', text: 'Mishu’s lips deserve the royal blue\nVaseline treatment!' },
  { emoji: '🌹', text: "Roses are red, Vaseline is blue,\nsoft healthy lips\nlook amazing on Mishu! 🌹" },
  { emoji: '🤫', text: "Psst Mishu... your lips are whispering\n'Vaseline please!' 🥰" },
  { emoji: '🦋', text: 'Butterfly kisses need soft lips!\nTime for your jelly, Mishu!' },
  { emoji: '⭐', text: 'Shine bright like your smile!\nVaseline time, superstar Mishu! ⭐' },
  { emoji: '💧', text: 'Self-care check for Mishu ✓\nWater ✓ Vaseline on lips... let’s do it!' },
  { emoji: '🧸', text: 'Your future self says thanks for\nkeeping your lips so smooth, Mishu! 🥰' },
  { emoji: '🍬', text: 'Keep those lips as sweet and soft\nas you are, Mishu! 💋' },
  { emoji: '😘', text: 'A little Vaseline goes a long way!\nYour lips will thank you, Mishu!' },
  { emoji: '🌈', text: 'You glow differently when your lips\nare hydrated & protected, Mishu! ✨' }
];

// ── State Variables ───────────────────────────────────────
let timerInterval = null;
let totalSeconds = 30 * 60;
let remainingSeconds = 30 * 60;
let targetEndTime = null;
let frequencyMins = 30;
let isRunning = false;
let shuffledMessages = [];
let messageIndex = 0;

// ── Partner Sync State ────────────────────────────────────
let currentRole = localStorage.getItem('vaseline-role') || 'Mishu';
let pairCode = localStorage.getItem('vaseline-pair-code') || 'mishu-anand';
let mqttClient = null;
let toastTimeout = null;

// ── Firebase Configuration & State ────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCvl579wZu7MKtLmRunfZ0xJgiqpto12C8",
  authDomain: "mishu-lipcare-df5c3.firebaseapp.com",
  projectId: "mishu-lipcare-df5c3",
  storageBucket: "mishu-lipcare-df5c3.firebasestorage.app",
  messagingSenderId: "11302655153",
  appId: "1:11302655153:web:bb5b475d0c153263253e90",
  measurementId: "G-37PV0YQQTL"
};
const VAPID_KEY = "BA1XF2x6Wvb41hE_Xiw5UbX7WDRhV5Sb9caF7cBfkkcc1sig3nkDN3PpX6v6uJNTu7TvWEEOEmJRUdaN52twIyM";
const RELAY_URL = "https://mishu-lipcare-relay.anandprakash2274.workers.dev";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let firebaseApp = null;
let firebaseDb = null;
let firebaseMessaging = null;
let fcmToken = null;

// ── DOM Elements ──────────────────────────────────────────
const startBtn = document.getElementById('start-btn');
const startBtnText = document.getElementById('start-btn-text');
const countdown = document.getElementById('countdown');
const countdownTime = document.getElementById('countdown-time');
const progressFill = document.getElementById('progress-fill');
const status = document.getElementById('status');
const statusText = document.getElementById('status-text');
const freqButtons = document.querySelectorAll('.btn-freq');
const customInput = document.getElementById('custom-input');
const popupOverlay = document.getElementById('popup-overlay');
const popupMessage = document.getElementById('popup-message');
const popupEmojiBig = document.getElementById('popup-emoji-big');
const doneBtn = document.getElementById('done-btn');
const snoozeBtn = document.getElementById('snooze-btn');
const heartsContainer = document.getElementById('hearts-container');
const balmStage = document.getElementById('balm-stage');
const balmWrapper = document.getElementById('balm-wrapper');
const balmShadow = document.getElementById('balm-shadow');

// Partner Sync Elements & Modal
const partnerToast = document.getElementById('partner-toast');
const toastTitle = document.getElementById('toast-title');
const toastMsg = document.getElementById('toast-msg');
const toastEmoji = document.getElementById('toast-emoji');
const syncDot = document.getElementById('sync-dot');
const syncStatusText = document.getElementById('sync-status-text');
const roleMishuBtn = document.getElementById('role-mishu');
const roleAnandBtn = document.getElementById('role-anand');
const pairCodeInput = document.getElementById('pair-code-input');
const savePairBtn = document.getElementById('save-pair-btn');
const enableNotifBtn = document.getElementById('enable-notif-btn');

const openPartnerModalBtn = document.getElementById('open-partner-modal-btn');
const closePartnerModalBtn = document.getElementById('close-partner-modal-btn');
const partnerModalDoneBtn = document.getElementById('partner-modal-done-btn');
const partnerModal = document.getElementById('partner-modal');
const partnerFrontRole = document.getElementById('partner-front-role');



// ── Fisher-Yates Message Shuffler ─────────────────────────
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getNextMessage() {
  if (messageIndex >= shuffledMessages.length) {
    shuffledMessages = shuffleArray(MESSAGES);
    messageIndex = 0;
  }
  return shuffledMessages[messageIndex++];
}

// ── Remote Reminder Sync via Firebase & Push ─────────
function syncReminderWithFirebase(active, targetEndTime, intervalMins) {
  if (!pairCode) return;
  const cleanPair = pairCode.trim().toLowerCase().replace(/\s+/g, '-');
  if (firebaseDb) {
    try {
      firebaseDb.ref(`pairs/${cleanPair}/${currentRole}/reminder`).set({
        active: active,
        intervalMins: intervalMins || frequencyMins,
        targetTime: targetEndTime || 0,
        updatedAt: Date.now()
      });
      console.log(`⏰ Remote reminder synced: active=${active}, interval=${intervalMins}m, target=${targetEndTime}`);
    } catch (e) {
      console.log('Firebase reminder sync note:', e);
    }
  }
}

// ── Timer Logic (Timestamp-Based & Cloud-Scheduled) ───
function startTimer(restoreFromStorage = false) {
  const isRestore = restoreFromStorage === true;
  if (isRunning && !isRestore) {
    stopTimer();
    return;
  }

  requestNotificationPermission();

  isRunning = true;
  if (!restoreFromStorage) {
    totalSeconds = frequencyMins * 60;
    remainingSeconds = totalSeconds;
    targetEndTime = Date.now() + remainingSeconds * 1000;
    syncReminderWithFirebase(true, targetEndTime, frequencyMins);
  }

  // Update UI to running state
  startBtn.classList.add('is-running');
  startBtnText.textContent = 'Stop Reminders';
  startBtn.querySelector('.btn-icon').textContent = '⏹️';
  countdown.classList.add('visible');
  status.classList.add('active');
  statusText.textContent = 'Vaseline reminders active 💧';

  updateCountdownDisplay();

  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);

  saveSettings();
}

function tickTimer() {
  if (!isRunning || !targetEndTime) return;

  const now = Date.now();
  remainingSeconds = Math.max(0, Math.round((targetEndTime - now) / 1000));
  updateCountdownDisplay();

  if (remainingSeconds <= 0) {
    fireReminder();
  }
}

function stopTimer() {
  isRunning = false;
  targetEndTime = null;
  clearInterval(timerInterval);
  timerInterval = null;

  syncReminderWithFirebase(false, 0, frequencyMins);

  startBtn.classList.remove('is-running');
  startBtnText.textContent = 'Start Reminders';
  startBtn.querySelector('.btn-icon').textContent = '▶️';
  countdown.classList.remove('visible');
  countdownTime.textContent = '--:--';
  if (progressFill) progressFill.style.width = '100%';
  status.classList.remove('active');
  statusText.textContent = 'Ready to moisturize';

  saveSettings();
}

function resetTimer() {
  totalSeconds = frequencyMins * 60;
  remainingSeconds = totalSeconds;
  targetEndTime = Date.now() + remainingSeconds * 1000;
  syncReminderWithFirebase(true, targetEndTime, frequencyMins);
  updateCountdownDisplay();
  saveSettings();
}

function updateCountdownDisplay() {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  countdownTime.textContent =
    String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  // Update progress bar
  if (progressFill && totalSeconds > 0) {
    const pct = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
    progressFill.style.width = pct + '%';
  }
}

// ── Check Timer On App Resume / Visibility ────────────────
function checkBackgroundTimer() {
  if (!isRunning || !targetEndTime) return;

  const now = Date.now();
  if (now >= targetEndTime) {
    const intervalMs = frequencyMins * 60 * 1000;
    while (targetEndTime <= now) {
      targetEndTime += intervalMs;
    }
    remainingSeconds = Math.max(0, Math.round((targetEndTime - now) / 1000));
    updateCountdownDisplay();
    syncReminderWithFirebase(true, targetEndTime, frequencyMins);
    saveSettings();
    const msg = getNextMessage();
    showPopup(msg);
  } else {
    remainingSeconds = Math.max(0, Math.round((targetEndTime - now) / 1000));
    updateCountdownDisplay();
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) checkBackgroundTimer();
});
window.addEventListener('pageshow', checkBackgroundTimer);
window.addEventListener('focus', checkBackgroundTimer);

// ── Reminder Trigger ──────────────────────────────────────
function fireReminder() {
  const msg = getNextMessage();
  showPopup(msg);
  sendNotification(msg);
  triggerTactileVibration(false);

  // Automatically queue next interval
  totalSeconds = frequencyMins * 60;
  remainingSeconds = totalSeconds;
  targetEndTime = Date.now() + remainingSeconds * 1000;
  syncReminderWithFirebase(true, targetEndTime, frequencyMins);
  saveSettings();
}

// ── Popup Modal ───────────────────────────────────────────
function showPopup(msg) {
  popupEmojiBig.textContent = msg.emoji;
  popupMessage.textContent = msg.text;
  popupOverlay.classList.add('visible');
  createHeartsBurst();

  // Pause interval while popup is active
  clearInterval(timerInterval);
  timerInterval = null;
}

function hidePopup() {
  popupOverlay.classList.remove('visible');
  heartsContainer.innerHTML = '';

  // Resume countdown
  if (isRunning) {
    resetTimer();
    clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
  }
}

function snooze() {
  popupOverlay.classList.remove('visible');
  heartsContainer.innerHTML = '';

  // 5-minute snooze
  totalSeconds = 5 * 60;
  remainingSeconds = totalSeconds;
  targetEndTime = Date.now() + totalSeconds * 1000;
  syncReminderWithFirebase(true, targetEndTime, 5);
  updateCountdownDisplay();

  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
  saveSettings();
}

// ── Particle Effects (Hearts, Sparkles, Drops) ────────────
function createHeartsBurst() {
  heartsContainer.innerHTML = '';
  const emojis = ['💙', '💖', '✨', '💋', '💧', '🌸', '🩷', '🫧', '⭐'];

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('span');
    particle.className = 'heart-particle';
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    particle.style.left = (8 + Math.random() * 84) + '%';
    particle.style.bottom = '12%';
    particle.style.setProperty('--delay', (Math.random() * 0.5) + 's');
    particle.style.setProperty('--duration', (1.2 + Math.random() * 0.9) + 's');
    particle.style.setProperty('--rot', (Math.random() * 70 - 35) + 'deg');
    heartsContainer.appendChild(particle);
  }
}

// ── Tactile Physical Vibration ────────────────────────────
function triggerTactileVibration(isRemote = false) {
  // Android & devices supporting standard Vibration API
  if ('vibrate' in navigator) {
    try {
      if (isRemote) {
        navigator.vibrate([250, 100, 250, 100, 350]);
      } else {
        navigator.vibrate([60, 30, 60]);
      }
    } catch (e) {}
  }
}

// ── 3D Model Viewer Interactions & Fidget Controls ────────
function initFidgetSpinner() {
  const mv = document.getElementById('balm-model-viewer');
  if (!mv) {
    console.log('⚠️ balm-model-viewer element not found');
    return;
  }
  console.log('🌀 3D GLB Model Viewer initialized');

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isPointerDown = false;
  let idleTimer = null;

  function stopFloat() {
    clearTimeout(idleTimer);
    if (balmWrapper) balmWrapper.classList.remove('idle-floating');
    if (balmShadow) balmShadow.classList.remove('idle-floating');
  }

  function scheduleFloat() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (balmWrapper) balmWrapper.classList.add('idle-floating');
      if (balmShadow) balmShadow.classList.add('idle-floating');
    }, 4200);
  }

  // Pointer down on model-viewer
  mv.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    stopFloat();
  });

  // Camera change event from model-viewer (fires when orbiting/spinning)
  mv.addEventListener('camera-change', (e) => {
    if (e.detail && e.detail.source === 'user-interaction') {
      stopFloat();
    }
  });

  // Pointer up on model-viewer
  mv.addEventListener('pointerup', (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.hypot(dx, dy);
    const duration = Date.now() - startTime;

    // If movement < 12px and time < 350ms, it's a Tap!
    if (dist < 12 && duration < 350) {
      handleJarTap(e);
    } else if (dist >= 18) {
      // User spun or flicked the jar — trigger soft haptic tick for fidget feel
      if ('vibrate' in navigator) {
        try { navigator.vibrate(12); } catch (_) {}
      }
    }

    scheduleFloat();
  });

  mv.addEventListener('pointercancel', () => {
    isPointerDown = false;
    scheduleFloat();
  });

  // Fallback click listener
  mv.addEventListener('click', (e) => {
    const duration = Date.now() - startTime;
    if (duration < 350) {
      handleJarTap(e);
    }
  });
}

// ── Tap Action (vibrate + squish + broadcast) ─────────────
let lastTapTime = 0;

function handleJarTap(e) {
  if (e && e.cancelable) e.preventDefault();

  const now = Date.now();
  if (now - lastTapTime < 180) return; // Debounce duplicate events
  lastTapTime = now;

  // 1. Vibrate phone
  triggerTactileVibration(false);

  // 2. Squish-pop animation
  if (balmWrapper) {
    balmWrapper.classList.remove('squish-pop');
    void balmWrapper.offsetWidth;
    balmWrapper.classList.add('squish-pop');
  }

  // 3. Floating heart particles
  spawnTapParticle();

  // 4. Send partner love tap
  sendPartnerTap();
}

function spawnTapParticle(emojis = ['💖', '💙', '💋', '✨', '💧']) {
  const scene = document.querySelector('.balm-scene');
  if (!scene) return;

  const particle = document.createElement('span');
  particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  particle.style.position = 'absolute';
  particle.style.top = '40%';
  particle.style.left = (35 + Math.random() * 30) + '%';
  particle.style.fontSize = '2rem';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '10';
  particle.style.transition = 'all 0.85s cubic-bezier(0.2, 0.9, 0.3, 1)';
  particle.style.transform = 'translateY(0) scale(0.5)';
  particle.style.opacity = '1';

  scene.appendChild(particle);

  requestAnimationFrame(() => {
    particle.style.transform = `translateY(-85px) translateX(${Math.random() * 50 - 25}px) scale(1.4) rotate(${Math.random() * 40 - 20}deg)`;
    particle.style.opacity = '0';
  });

  setTimeout(() => {
    particle.remove();
  }, 900);
}

// ── Firebase Realtime & FCM Native Push Sync ─────────────
function initFirebase() {
  if (typeof firebase === 'undefined') {
    setTimeout(initFirebase, 800);
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }
    firebaseDb = firebase.database();
    console.log('🔥 Firebase Realtime Database connected');

    const cleanPair = pairCode.trim().toLowerCase().replace(/\s+/g, '-');
    const tapRef = firebaseDb.ref(`pairs/${cleanPair}/tap`);

    // Real-time listener for partner love taps
    tapRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.timestamp) return;

      // Ignore old events or self-sent events
      if (Date.now() - data.timestamp > 8000) return;
      if (data.from && data.from === currentRole) return;

      handleIncomingPartnerTap(data);
    });

    // Check Firebase Messaging (Native Web Push)
    if (typeof firebase.messaging === 'function' && firebase.messaging.isSupported()) {
      firebaseMessaging = firebase.messaging();

      firebaseMessaging.onMessage((payload) => {
        const from = payload.data?.from || (currentRole === 'Mishu' ? 'Anand' : 'Mishu');
        handleIncomingPartnerTap({ from: from });
      });

      if (Notification.permission === 'granted') {
        requestFcmToken();
      }
    }
  } catch (err) {
    console.log('Firebase init error:', err);
  }
}

async function requestFcmToken() {
  const cleanPair = pairCode.trim().toLowerCase().replace(/\s+/g, '-');

  // 1. Native WebPush subscription for Apple APNs
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const swReg = await navigator.serviceWorker.ready;
      let sub = await swReg.pushManager.getSubscription();
      if (!sub) {
        sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        });
      }
      if (sub && firebaseDb) {
        firebaseDb.ref(`pairs/${cleanPair}/${currentRole}/subscription`).set(sub.toJSON());
        console.log('✅ Apple APNs PushSubscription registered in Firebase');
      }
    } catch (e) {
      console.log('Native push subscription note:', e);
    }
  }

  // 2. Firebase FCM Token
  if (firebaseMessaging) {
    try {
      const swReg = await navigator.serviceWorker.ready;
      const token = await firebaseMessaging.getToken({
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg
      });

      if (token) {
        fcmToken = token;
        console.log('✅ Native Apple/FCM Push Token registered:', token);

        if (firebaseDb) {
          firebaseDb.ref(`pairs/${cleanPair}/${currentRole}/fcmToken`).set(token);
        }

        const fcmStatusText = document.getElementById('fcm-status-text');
        if (fcmStatusText) {
          fcmStatusText.textContent = 'Firebase Native Push Active ⚡';
        }
      }
    } catch (err) {
      console.log('FCM token request note:', err);
    }
  }
}

// ── Real-Time Partner Sync (MQTT over WebSocket) ──────────
function getMqttTopic() {
  return `vaseline-care/${pairCode.trim().toLowerCase()}/tap`;
}

function initPartnerSync() {
  initFirebase();

  if (typeof mqtt === 'undefined') {
    console.log('⚠️ MQTT library not loaded, retrying...');
    setTimeout(initPartnerSync, 1000);
    return;
  }

  updateSyncUI('connecting');

  // Connect to high-availability free WebSocket broker
  const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
  const clientId = 'lipcare_' + Math.random().toString(16).substr(2, 8);

  try {
    mqttClient = mqtt.connect(brokerUrl, {
      clientId: clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000
    });

    mqttClient.on('connect', () => {
      console.log('✅ Partner sync connected to broker!');
      updateSyncUI('connected');
      const topic = getMqttTopic();
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log(`📡 Subscribed to partner topic: ${topic}`);
        }
      });
    });

    mqttClient.on('reconnect', () => {
      updateSyncUI('connecting');
    });

    mqttClient.on('close', () => {
      updateSyncUI('offline');
    });

    mqttClient.on('error', (err) => {
      console.log('MQTT error:', err);
      updateSyncUI('offline');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        // Only react if the message came from partner (not self)
        if (data && data.from && data.from !== currentRole) {
          handleIncomingPartnerTap(data);
        }
      } catch (e) {
        console.error('Failed to parse partner tap:', e);
      }
    });
  } catch (e) {
    console.error('MQTT connection failed:', e);
    updateSyncUI('offline');
  }
}

function syncWithServiceWorker() {
  // Service worker unified push active
}

function sendPartnerTap() {
  const cuteReminder = getNextMessage ? getNextMessage().text : "Time to put Vaseline on those gorgeous lips! 💋";
  const cleanMsg = cuteReminder.replace(/\n/g, ' ');
  const cleanPair = pairCode.trim().toLowerCase().replace(/\s+/g, '-');
  const now = Date.now();

  // 1. Write to Firebase Realtime Database (instant real-time sync for open app)
  if (firebaseDb) {
    try {
      firebaseDb.ref(`pairs/${cleanPair}/tap`).set({
        from: currentRole,
        type: 'love-tap',
        message: cleanMsg,
        timestamp: now
      });
    } catch (e) {}
  }

  // 2. Post via Cloudflare Push Relay (delivers single clean FCM push notification)
  fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pairCode: cleanPair,
      from: currentRole,
      message: cleanMsg,
      title: `💌 Vaseline Love Tap from ${currentRole}!`
    })
  }).catch(() => {});

  // 3. Broadcast via MQTT WebSocket (instant if open in foreground)
  if (mqttClient && mqttClient.connected) {
    const payload = JSON.stringify({
      from: currentRole,
      type: 'love-tap',
      message: cleanMsg,
      timestamp: now
    });

    const mqttTopic = getMqttTopic();
    mqttClient.publish(mqttTopic, payload, { qos: 0 }, (err) => {
      if (!err) {
        console.log(`📤 Love tap sent from ${currentRole} to partner!`);
      }
    });
  }
}

function handleIncomingPartnerTap(data) {
  // 1. Long sweet heartbeat vibration pattern on her phone!
  triggerTactileVibration(true);

  // 3. Jar squish bounce & particle burst
  if (balmWrapper) {
    balmWrapper.classList.remove('squish-pop');
    void balmWrapper.offsetWidth;
    balmWrapper.classList.add('squish-pop');
  }

  // Shower of particles
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      spawnTapParticle(['💖', '💋', '💙', '✨', '💧']);
    }, i * 120);
  }

  // 4. Slide in Partner Toast Banner
  showPartnerToast(data.from);
}

function showPartnerToast(senderName) {
  if (!partnerToast) return;

  toastTitle.textContent = `💌 Love Tap from ${senderName}!`;
  toastMsg.textContent = `${senderName} tapped the Vaseline jar for you! 💋 Time to moisturize!`;
  toastEmoji.textContent = senderName === 'Anand' ? '💙' : '🌸';

  partnerToast.classList.add('visible');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    partnerToast.classList.remove('visible');
  }, 4800);
}

function updateSyncUI(state) {
  if (!syncDot || !syncStatusText) return;

  if (state === 'connected') {
    syncDot.className = 'sync-dot';
    syncStatusText.textContent = 'Connected';
  } else if (state === 'connecting') {
    syncDot.className = 'sync-dot connecting';
    syncStatusText.textContent = 'Connecting...';
  } else {
    syncDot.className = 'sync-dot offline';
    syncStatusText.textContent = 'Offline';
  }
}

function setRole(role) {
  currentRole = role;
  localStorage.setItem('vaseline-role', role);

  if (roleMishuBtn && roleAnandBtn) {
    roleMishuBtn.classList.toggle('active', role === 'Mishu');
    roleAnandBtn.classList.toggle('active', role === 'Anand');
  }

  if (partnerFrontRole) {
    partnerFrontRole.textContent = role;
  }

  syncWithServiceWorker();
  triggerTactileVibration(false);
}

function updateNtfyLink() {
  const link = document.getElementById('ntfy-ios-link');
  if (link && pairCode) {
    link.href = `https://ntfy.sh/${pairCode.trim().toLowerCase()}-lipcare`;
  }
}

function savePairCode() {
  if (!pairCodeInput) return;
  const newCode = pairCodeInput.value.trim().toLowerCase();
  if (newCode) {
    pairCode = newCode;
    localStorage.setItem('vaseline-pair-code', pairCode);

    // Re-subscribe if connected
    if (mqttClient && mqttClient.connected) {
      mqttClient.subscribe(getMqttTopic());
    }

    syncWithServiceWorker();
    updateNtfyLink();
    triggerTactileVibration([60, 40, 60]);
    if (savePairBtn) {
      savePairBtn.textContent = '✓ Saved';
      setTimeout(() => {
        savePairBtn.textContent = 'Save';
      }, 1500);
    }
  }
}

// ── Notifications ─────────────────────────────────────────
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(msg) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
    return;
  }

  const cleanText = (typeof msg === 'string' ? msg : msg?.text || 'Time to put Vaseline on those gorgeous lips! 💋').replace(/\n/g, ' ');
  const title = 'Vaseline Lip Care 💋';
  const options = {
    body: cleanText,
    icon: 'icons/apple-touch-icon.png',
    badge: 'icons/icon-192.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: 'vaseline-reminder',
    renotify: true,
    data: { url: './' }
  };

  // 1. Primary: Service Worker Registration showNotification (iOS Safari PWA & Chrome standard)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg && reg.showNotification) {
        reg.showNotification(title, options).catch(() => {});
      }
    }).catch(() => {});
  } else {
    // 2. Fallback: Standard window Notification constructor
    try {
      new Notification(title, options);
    } catch (e) {}
  }
}

// ── Frequency Selection ───────────────────────────────────
function setFrequency(mins) {
  frequencyMins = mins;
  customInput.value = '';

  freqButtons.forEach((btn) => {
    btn.classList.toggle('active', parseInt(btn.dataset.mins) === mins);
  });

  if (isRunning) {
    resetTimer();
  }

  saveSettings();
}

// ── Settings Persistence ──────────────────────────────────
function saveSettings() {
  localStorage.setItem('vaseline-lipcare-freq', frequencyMins);
  localStorage.setItem('vaseline-lipcare-running', isRunning ? 'true' : 'false');
  if (targetEndTime && isRunning) {
    localStorage.setItem('vaseline-lipcare-target-end', targetEndTime);
    localStorage.setItem('vaseline-lipcare-total', totalSeconds);
  } else {
    localStorage.removeItem('vaseline-lipcare-target-end');
    localStorage.removeItem('vaseline-lipcare-total');
  }
}

function loadSettings() {
  const savedFreq = localStorage.getItem('vaseline-lipcare-freq');
  if (savedFreq) {
    frequencyMins = parseInt(savedFreq);

    let foundPreset = false;
    freqButtons.forEach((btn) => {
      const isActive = parseInt(btn.dataset.mins) === frequencyMins;
      btn.classList.toggle('active', isActive);
      if (isActive) foundPreset = true;
    });

    if (!foundPreset) {
      customInput.value = frequencyMins;
      freqButtons.forEach((btn) => btn.classList.remove('active'));
    }
  }

  // Restore running timer state if it was active when app was closed/backgrounded
  const savedRunning = localStorage.getItem('vaseline-lipcare-running') === 'true';
  const savedEnd = localStorage.getItem('vaseline-lipcare-target-end');
  const savedTotal = localStorage.getItem('vaseline-lipcare-total');

  if (savedRunning && savedEnd) {
    targetEndTime = parseInt(savedEnd);
    totalSeconds = savedTotal ? parseInt(savedTotal) : frequencyMins * 60;
    const now = Date.now();

    if (now >= targetEndTime) {
      const intervalMs = frequencyMins * 60 * 1000;
      while (targetEndTime <= now) {
        targetEndTime += intervalMs;
      }
      remainingSeconds = Math.max(0, Math.round((targetEndTime - now) / 1000));
      startTimer(true);
      syncReminderWithFirebase(true, targetEndTime, frequencyMins);
      const msg = getNextMessage();
      showPopup(msg);
    } else {
      // Resume running seamlessly with accurate remaining seconds
      remainingSeconds = Math.max(0, Math.round((targetEndTime - now) / 1000));
      startTimer(true);
    }
  }
}

// ── Service Worker Registration ───────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('✅ Vaseline Service Worker registered');
        if (navigator.serviceWorker.controller) {
          syncWithServiceWorker();
        }
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          syncWithServiceWorker();
        });
      })
      .catch((err) => console.log('⚠️ SW registration error:', err));

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PARTNER_TAP') {
        if (event.data.from !== currentRole) {
          handleIncomingPartnerTap({ from: event.data.from });
        }
      }
    });
  }
}

// ── Event Listeners ───────────────────────────────────────
if (startBtn) {
  startBtn.addEventListener('click', (e) => {
    if (e && e.cancelable) e.preventDefault();
    if (isRunning) {
      stopTimer();
    } else {
      startTimer(false);
    }
  });
}

if (doneBtn) doneBtn.addEventListener('click', hidePopup);
if (snoozeBtn) snoozeBtn.addEventListener('click', snooze);

// Balm stage interaction is handled by the Fidget Spinner IIFE above

// Notification Permission Helper
function setupNotificationButton() {
  if (!enableNotifBtn) return;

  function updateBtnStatus() {
    if (!('Notification' in window)) {
      enableNotifBtn.style.display = 'none';
      return;
    }
    if (Notification.permission === 'granted') {
      enableNotifBtn.textContent = '✓ Remote Vibrations Active 🔔';
      enableNotifBtn.classList.add('granted');
    } else {
      enableNotifBtn.textContent = '🔔 Allow Remote Vibrations & Alerts';
      enableNotifBtn.classList.remove('granted');
    }
  }

  updateBtnStatus();

  enableNotifBtn.addEventListener('click', () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }

    // Trigger test vibration
    triggerTactileVibration(false);

    Notification.requestPermission().then((permission) => {
      updateBtnStatus();
      if (permission === 'granted') {
        requestFcmToken();
        triggerTactileVibration(false);
      }
    });
  });
}

// Partner Modal Controls
function openPartnerModal(e) {
  if (e && e.cancelable) e.preventDefault();
  if (partnerModal) {
    partnerModal.classList.add('visible');
  }
}

function closePartnerModal(e) {
  if (e && e.cancelable) e.preventDefault();
  if (partnerModal) {
    partnerModal.classList.remove('visible');
  }
}

if (openPartnerModalBtn) {
  openPartnerModalBtn.addEventListener('click', openPartnerModal);
}
if (closePartnerModalBtn) {
  closePartnerModalBtn.addEventListener('click', closePartnerModal);
}
if (partnerModalDoneBtn) {
  partnerModalDoneBtn.addEventListener('click', closePartnerModal);
}
if (partnerModal) {
  partnerModal.addEventListener('click', (e) => {
    if (e.target === partnerModal) {
      closePartnerModal(e);
    }
  });
}

// Partner Role Selection
if (roleMishuBtn) {
  roleMishuBtn.addEventListener('click', () => setRole('Mishu'));
}
if (roleAnandBtn) {
  roleAnandBtn.addEventListener('click', () => setRole('Anand'));
}

// Partner Pair Code Save
if (savePairBtn) {
  savePairBtn.addEventListener('click', savePairCode);
}
if (pairCodeInput) {
  pairCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePairCode();
  });
}

freqButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setFrequency(parseInt(btn.dataset.mins));
  });
});

customInput.addEventListener('input', () => {
  const val = parseInt(customInput.value);
  if (val && val > 0 && val <= 480) {
    frequencyMins = val;
    freqButtons.forEach((btn) => btn.classList.remove('active'));
    if (isRunning) resetTimer();
    saveSettings();
  }
});

// ── Initialize App ────────────────────────────────────────
function init() {
  shuffledMessages = shuffleArray(MESSAGES);
  loadSettings();

  // Load saved partner settings
  if (pairCodeInput) pairCodeInput.value = pairCode;
  setRole(currentRole);
  updateNtfyLink();
  initPartnerSync();
  setupNotificationButton();

  // 3D fidget spinner on the jar
  initFidgetSpinner();

  registerServiceWorker();
}

init();
