let audioContext = null;

// Must run from a click: browsers block audio the user did not start.
export function unlockSound() {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
  } catch {
    audioContext = null; // no Web Audio: the app works without sound
  }
}

// Sounds are generated, so no audio files are needed.
// Each note: [frequency Hz, start offset s, length s].
const SOUNDS = {
  chime: [[660, 0, 0.5], [880, 0.22, 0.5], [1100, 0.44, 0.6]],
  bell: [[523, 0, 1.6], [1046, 0, 1.2], [784, 0.5, 1.8]],
};

// volume: 0-100
export function playSound(kind, volume) {
  const notes = SOUNDS[kind];
  if (!audioContext || !notes || volume <= 0) return;
  const peak = 0.4 * (volume / 100);
  const now = audioContext.currentTime;
  for (const [frequency, offset, length] of notes) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const t = now + offset;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }
}

export function askNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'ttb-phase', icon: 'assets/favicon.svg' });
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}
