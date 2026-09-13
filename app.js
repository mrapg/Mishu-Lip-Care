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
const balmShadow = document.getElementById('balm-shadow');

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
const enableNotifBtn = document.getElementById('enable-notif-btn');

// ── Shared Audio Context & Auto-Unlock ─────────────────────
let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}
['touchstart', 'touchend', 'pointerdown', 'click'].forEach((evt) => {
  window.addEventListener(evt, unlockAudio, { passive: true });
});

// ── Audio Tone Generator (Soft Chime) ─────────────────────
function playCuteChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

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
  } catch (e) {}
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
function triggerTactileVibration(isRemote = false) {
  // 1. Hardware motor vibration (Android & supporting browsers)
  if ('vibrate' in navigator) {
    try {
      if (isRemote) {
        navigator.vibrate([250, 100, 250, 100, 350]);
      } else {
        const res = navigator.vibrate([100, 50, 100]);
        if (!res) navigator.vibrate(120);
      }
    } catch (e) {}
  }

  // 2. Physical Acoustic Haptic Rumble (Vibrates iPhone & Android speaker housing)
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = isRemote ? 3 : 2;

    for (let i = 0; i < pulses; i++) {
      const startTime = now + i * 0.15;

      // Deep resonant pulse (140Hz -> 75Hz) - within phone speaker passband
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // generates rich odd harmonics for tactile vibration
      osc.frequency.setValueAtTime(140, startTime);
      osc.frequency.exponentialRampToValueAtTime(75, startTime + 0.11);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.9, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.13);

      // Tactile click transient (1500Hz -> 300Hz)
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();

      click.type = 'sine';
      click.frequency.setValueAtTime(1500, startTime);
      click.frequency.exponentialRampToValueAtTime(300, startTime + 0.025);

      clickGain.gain.setValueAtTime(0.35, startTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.025);

      click.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(startTime);
      click.stop(startTime + 0.03);
    }
  } catch (e) {
    console.error('Haptic acoustic error:', e);
  }
}

// ── Fidget Spinner Rotation ────────────────────────────────
(function initFidgetSpinner() {
  if (!balmStage || !balmWrapper) return;

  // Current rotation angles
  let rotX = 0;
  let rotY = 0;

  // Inertia / momentum
  let velX = 0;
  let velY = 0;
  let rafId = null;

  // Drag tracking
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let totalMoveDistance = 0;
  const TAP_THRESHOLD = 10; // px — if drag < this, treat as tap

  let idleTimer = null;

  function stopIdle() {
    if (balmWrapper) balmWrapper.classList.remove('idle-floating');
    if (balmShadow) balmShadow.classList.remove('idle-floating');
    cancelAnimationFrame(rafId);
  }

  function resumeIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (balmWrapper) balmWrapper.classList.add('idle-floating');
      if (balmShadow) balmShadow.classList.add('idle-floating');
      // Smoothly reset rotation
      const easeToZero = () => {
        rotX *= 0.85;
        rotY *= 0.85;
        applyTransform();
        if (Math.abs(rotX) > 0.5 || Math.abs(rotY) > 0.5) {
          requestAnimationFrame(easeToZero);
        } else {
          rotX = 0; rotY = 0;
          balmWrapper.style.transform = '';
        }
      };
      requestAnimationFrame(easeToZero);
    }, 2200);
  }

  function applyTransform() {
    // Clamp vertical tilt for a nice fidget feel
    const clampedX = Math.max(-55, Math.min(55, rotX));
    balmWrapper.style.animation = 'none';
    balmWrapper.style.transform = `rotateX(${clampedX}deg) rotateY(${rotY}deg)`;
  }

  function spinInertia() {
    if (Math.abs(velX) < 0.1 && Math.abs(velY) < 0.1) return;
    rotX += velX;
    rotY += velY;
    velX *= 0.93;
    velY *= 0.93;
    applyTransform();
    rafId = requestAnimationFrame(spinInertia);
  }

  function onPointerDown(e) {
    if (e.type === 'pointerdown') {
      balmStage.setPointerCapture(e.pointerId);
    }

    stopIdle();
    isDragging = true;
    totalMoveDistance = 0;
    cancelAnimationFrame(rafId);

    startX = lastX = e.clientX ?? e.touches?.[0].clientX;
    startY = lastY = e.clientY ?? e.touches?.[0].clientY;

    balmStage.classList.add('is-dragging');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    e.preventDefault();

    const curX = e.clientX ?? e.touches?.[0].clientX;
    const curY = e.clientY ?? e.touches?.[0].clientY;

    const dx = curX - lastX;
    const dy = curY - lastY;

    totalMoveDistance += Math.abs(dx) + Math.abs(dy);

    // Horizontal drag → rotateY (spin), vertical drag → rotateX (tilt)
    velY = dx * 0.9;
    velX = -dy * 0.5;

    rotY += velY;
    rotX += velX;

    applyTransform();

    lastX = curX;
    lastY = curY;
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    balmStage.classList.remove('is-dragging');

    if (totalMoveDistance < TAP_THRESHOLD) {
      // Short movement = it was a tap → fire the love tap!
      rotX = 0; rotY = 0;
      applyTransform();
      handleJarTap(null);
    } else {
      // Long drag = fidget spin → apply momentum inertia
      rafId = requestAnimationFrame(spinInertia);
    }

    resumeIdle();
  }

  // Pointer events (modern, works on mobile & desktop)
  balmStage.addEventListener('pointerdown', onPointerDown, { passive: false });
  balmStage.addEventListener('pointermove', onPointerMove, { passive: false });
  balmStage.addEventListener('pointerup', onPointerUp);
  balmStage.addEventListener('pointercancel', onPointerUp);

  // Touch fallback for older iOS
  balmStage.addEventListener('touchstart', onPointerDown, { passive: false });
  balmStage.addEventListener('touchmove', onPointerMove, { passive: false });
  balmStage.addEventListener('touchend', onPointerUp, { passive: false });
})();

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

  // 5. Fire system notification WITH hardware motor vibration pattern!
  if ('Notification' in window && Notification.permission === 'granted') {
    const notifTitle = `💌 Vaseline Love Tap from ${data.from}!`;
    const notifOptions = {
      body: `${data.from} tapped the Vaseline jar for you! 💋 Keep those lips soft & moisturized!`,
      icon: 'icons/apple-touch-icon.png',
      badge: 'icons/icon-192.png',
      vibrate: [300, 100, 300, 100, 400],
      tag: 'partner-love-tap',
      renotify: true
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(notifTitle, notifOptions);
      });
    } else {
      try {
        new Notification(notifTitle, notifOptions);
      } catch (e) {}
    }
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

  syncWithServiceWorker();
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

  registerServiceWorker();
}

init();
