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
let frequencyMins = 30;
let isRunning = false;
let shuffledMessages = [];
let messageIndex = 0;

// ── Partner Sync State ────────────────────────────────────
let currentRole = localStorage.getItem('vaseline-role') || 'Mishu';
let pairCode = localStorage.getItem('vaseline-pair-code') || 'mishu-anand';
let mqttClient = null;
let toastTimeout = null;

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

// Partner Sync Elements
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

// ── Audio Tone Generator (Soft Chime) ─────────────────────
function playCuteChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Cute Major Arpeggio)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + idx * 0.1;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {
    // AudioContext might be blocked until user gesture, ignore safely
  }
}

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

// ── Timer Logic ───────────────────────────────────────────
function startTimer() {
  if (isRunning) {
    stopTimer();
    return;
  }

  requestNotificationPermission();

  isRunning = true;
  totalSeconds = frequencyMins * 60;
  remainingSeconds = totalSeconds;

  // Update UI to running state
  startBtn.classList.add('is-running');
  startBtnText.textContent = 'Stop Reminders';
  startBtn.querySelector('.btn-icon').textContent = '⏹️';
  countdown.classList.add('visible');
  status.classList.add('active');
  statusText.textContent = 'Vaseline reminders active 💧';

  updateCountdownDisplay();

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateCountdownDisplay();

    if (remainingSeconds <= 0) {
      fireReminder();
    }
  }, 1000);

  saveSettings();
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  startBtn.classList.remove('is-running');
  startBtnText.textContent = 'Start Reminders';
  startBtn.querySelector('.btn-icon').textContent = '▶️';
  countdown.classList.remove('visible');
  countdownTime.textContent = '--:--';
  if (progressFill) progressFill.style.width = '100%';
  status.classList.remove('active');
  statusText.textContent = 'Ready to moisturize';
}

function resetTimer() {
  totalSeconds = frequencyMins * 60;
  remainingSeconds = totalSeconds;
  updateCountdownDisplay();
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

// ── Reminder Trigger ──────────────────────────────────────
function fireReminder() {
  const msg = getNextMessage();
  showPopup(msg);
  sendNotification(msg);
  playCuteChime();

  // Haptic feedback for iPhone / mobile
  if ('vibrate' in navigator) {
    navigator.vibrate([120, 60, 120, 60, 150]);
  }
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
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateCountdownDisplay();
      if (remainingSeconds <= 0) {
        fireReminder();
      }
    }, 1000);
  }
}

function snooze() {
  popupOverlay.classList.remove('visible');
  heartsContainer.innerHTML = '';

  // 5-minute snooze
  totalSeconds = 5 * 60;
  remainingSeconds = totalSeconds;
  updateCountdownDisplay();

  if (!timerInterval) {
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateCountdownDisplay();
      if (remainingSeconds <= 0) {
        fireReminder();
      }
    }, 1000);
  }
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

// ── Tactile Physical Vibration & Haptics ──────────────────
function triggerTactileVibration(pattern = [100, 50, 100]) {
  // 1. Native Vibration API (Android, Chrome, and supported mobile browsers)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }

  // 2. Synthesize Physical Haptic Buzz via Web Audio (Vibrates speaker & chassis on iOS)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let delay = 0;
    pattern.forEach((duration, index) => {
      // Vibrate on even indexes
      if (index % 2 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 45Hz sub-bass produces physical tactile rumble in phone housing
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, ctx.currentTime + delay / 1000);

        const startTime = ctx.currentTime + delay / 1000;
        const endTime = startTime + duration / 1000;

        gain.gain.setValueAtTime(0.01, startTime);
        gain.gain.linearRampToValueAtTime(0.7, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      }
      delay += duration;
    });
  } catch (e) {}
}

// ── Interactive Jar Tap Interaction ───────────────────────
function handleJarTap(e) {
  if (e) e.preventDefault();

  // 1. Immediate local vibration
  triggerTactileVibration([90, 40, 90]);

  // 2. Trigger squish animation
  balmWrapper.classList.remove('squish-pop');
  void balmWrapper.offsetWidth;
  balmWrapper.classList.add('squish-pop');

  // 3. Spawn small floating heart / drop above jar
  spawnTapParticle();

  // 4. Broadcast real-time tap to partner's phone
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

// ── Real-Time Partner Sync (MQTT over WebSocket) ──────────
function getMqttTopic() {
  return `vaseline-care/${pairCode.trim().toLowerCase()}/tap`;
}

function initPartnerSync() {
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

function sendPartnerTap() {
  if (!mqttClient || !mqttClient.connected) {
    console.log('MQTT not connected yet, tap saved locally');
    return;
  }

  const payload = JSON.stringify({
    from: currentRole,
    type: 'love-tap',
    timestamp: Date.now()
  });

  const topic = getMqttTopic();
  mqttClient.publish(topic, payload, { qos: 0 }, (err) => {
    if (err) {
      console.error('Error publishing tap:', err);
    } else {
      console.log(`📤 Love tap sent from ${currentRole} to partner!`);
    }
  });
}

function handleIncomingPartnerTap(data) {
  // 1. Long sweet heartbeat vibration pattern on her phone!
  triggerTactileVibration([220, 90, 220, 90, 320]);

  // 2. Play cute chime
  playCuteChime();

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

  // 5. If phone screen is locked / app backgrounded, fire system notification
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`💌 Vaseline Love Tap from ${data.from}!`, {
        body: `${data.from} tapped the Vaseline jar for you! 💋 Keep those lips soft & moisturized!`,
        icon: 'icons/apple-touch-icon.png',
        badge: 'icons/icon-192.png',
        tag: 'partner-love-tap',
        renotify: true
      });
    } catch (e) {}
  }
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

  triggerTactileVibration([70]);
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
  if ('Notification' in window && Notification.permission === 'granted') {
    const cleanText = msg.text.replace(/\n/g, ' ');
    try {
      new Notification('Vaseline Lip Care 💋', {
        body: cleanText,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag: 'vaseline-reminder',
        renotify: true
      });
    } catch (e) {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('Vaseline Lip Care 💋', {
            body: cleanText,
            icon: 'icons/icon-192.png',
            tag: 'vaseline-reminder',
            renotify: true
          });
        });
      }
    }
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
}

function loadSettings() {
  const saved = localStorage.getItem('vaseline-lipcare-freq');
  if (saved) {
    frequencyMins = parseInt(saved);

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
}

// ── Service Worker Registration ───────────────────────────
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => console.log('✅ Vaseline Service Worker registered'))
      .catch((err) => console.log('⚠️ SW registration error:', err));
  }
}

// ── Event Listeners ───────────────────────────────────────
startBtn.addEventListener('click', startTimer);
doneBtn.addEventListener('click', hidePopup);
snoozeBtn.addEventListener('click', snooze);

if (balmStage) {
  balmStage.addEventListener('click', handleJarTap);
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
  initPartnerSync();

  registerServiceWorker();
}

init();
