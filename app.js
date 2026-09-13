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

// ── Remote Reminder Scheduling via ntfy.sh ─────────────────
function scheduleRemoteReminder(delayMins) {
  if (!pairCode) return;
  const topic = `${pairCode}-lipcare`;
  // Schedules push on ntfy.sh server (delivers even when PWA is completely terminated!)
  fetch(`https://ntfy.sh/${topic}`, {
    method: 'POST',
    headers: {
      'Title': 'Vaseline Lip Care 💋',
      'Priority': 'urgent',
      'Tags': 'kiss,droplet,sparkles',
      'Delay': `${delayMins}m`
    },
    body: 'Time to put Vaseline on those gorgeous lips! 💋'
  }).catch(() => {});
}

// ── Timer Logic (Timestamp-Based & Background Resilient) ───
function startTimer(restoreFromStorage = false) {
  if (isRunning && !restoreFromStorage) {
    stopTimer();
    return;
  }

  requestNotificationPermission();

  isRunning = true;
  if (!restoreFromStorage) {
    totalSeconds = frequencyMins * 60;
    remainingSeconds = totalSeconds;
    targetEndTime = Date.now() + remainingSeconds * 1000;
    scheduleRemoteReminder(frequencyMins);
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
    // Timer expired while app was sleeping or closed!
    fireReminder();
  } else {
    // Sync remaining time with actual clock
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
  scheduleRemoteReminder(frequencyMins);
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
  updateCountdownDisplay();
  scheduleRemoteReminder(5);

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

// ── Tactile Physical Vibration (Android + iOS Support) ────
function triggerTactileVibration(isRemote = false) {
  // 1. Android & browsers supporting standard Vibration API
  if ('vibrate' in navigator) {
    try {
      if (isRemote) {
        navigator.vibrate([250, 100, 250, 100, 350]);
      } else {
        navigator.vibrate([80, 40, 80]);
      }
    } catch (e) {}
  }

  // 2. iOS Safari / PWA haptic motor:
  // Apple disables navigator.vibrate, so Web Notifications with vibrate pattern
  // are the only web mechanism to trigger the iPhone physical vibration motor.
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((reg) => {
      const title = isRemote ? '💌 Love tap received!' : '💋 Vaseline Tap!';
      const body = isRemote ? 'Time to moisturize those gorgeous lips! 💋' : 'Love tap sent to your partner! 💖';
      reg.showNotification(title, {
        body: body,
        icon: 'icons/apple-touch-icon.png',
        badge: 'icons/icon-192.png',
        vibrate: isRemote ? [300, 100, 300, 100, 400] : [100, 50, 100],
        tag: 'partner-love-tap',
        renotify: true,
        silent: false
      }).then(() => {
        if (!isRemote) {
          // Auto close local tap notification after 1.5s so it doesn't linger
          setTimeout(() => {
            reg.getNotifications({ tag: 'partner-love-tap' }).then((notifs) => {
              notifs.forEach(n => n.close());
            });
          }, 1500);
        }
      });
    }).catch(() => {});
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
    }, 2800);
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

function syncWithServiceWorker() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'START_NTFY_LISTENER',
      topic: pairCode.trim().toLowerCase(),
      role: currentRole
    });
  }
}

function sendPartnerTap() {
  const cuteReminder = getNextMessage ? getNextMessage().text : "Time to put Vaseline on those gorgeous lips! 💋";
  const cleanMsg = cuteReminder.replace(/\n/g, ' ');
  const ntfyTopic = `${pairCode.trim().toLowerCase()}-lipcare`;

  // 1. Post to ntfy.sh (fires OS push notifications even when Mishu's app is closed!)
  fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: 'POST',
    body: `FROM:${currentRole} ${cleanMsg}`,
    headers: {
      'Title': `💌 Vaseline Love Tap from ${currentRole}!`,
      'Priority': 'urgent',
      'Tags': 'kiss,sparkles,heart',
      'Click': window.location.href
    }
  }).catch((err) => console.log('ntfy background push error:', err));

  // 2. Broadcast via MQTT WebSocket (instant if open in foreground)
  if (mqttClient && mqttClient.connected) {
    const payload = JSON.stringify({
      from: currentRole,
      type: 'love-tap',
      message: cleanMsg,
      timestamp: Date.now()
    });

    const topic = getMqttTopic();
    mqttClient.publish(topic, payload, { qos: 0 }, (err) => {
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
      // Timer finished while app was closed!
      startTimer(true);
      fireReminder();
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
startBtn.addEventListener('click', startTimer);
doneBtn.addEventListener('click', hidePopup);
snoozeBtn.addEventListener('click', snooze);

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
        triggerTactileVibration(true);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification('💋 Vibrations Enabled!', {
              body: 'Your phone will now buzz when partner taps the jar!',
              icon: 'icons/apple-touch-icon.png',
              vibrate: [200, 100, 200]
            });
          });
        }
      }
    });
  });
}

// Partner Modal Controls
if (openPartnerModalBtn && partnerModal) {
  openPartnerModalBtn.addEventListener('click', () => {
    partnerModal.classList.add('visible');
  });
}
if (closePartnerModalBtn && partnerModal) {
  closePartnerModalBtn.addEventListener('click', () => {
    partnerModal.classList.remove('visible');
  });
}
if (partnerModalDoneBtn && partnerModal) {
  partnerModalDoneBtn.addEventListener('click', () => {
    partnerModal.classList.remove('visible');
  });
}
if (partnerModal) {
  partnerModal.addEventListener('click', (e) => {
    if (e.target === partnerModal) {
      partnerModal.classList.remove('visible');
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
  initPartnerSync();
  setupNotificationButton();

  // 3D fidget spinner on the jar
  initFidgetSpinner();

  registerServiceWorker();
}

init();
