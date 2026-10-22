// The pop-out: a small always-on-top window (Document Picture-in-Picture)
// with the bomb, the phase and the time. Clicking it goes back to the tab.
// The user can drag and resize it like any window. Only desktop Chrome and
// Edge have it.
import { bombDrawer, explode } from './bomb.js';

export const miniSupported = 'documentPictureInPicture' in window;

const TEMPLATE = `
  <button class="mini" type="button" title="Back to the timer">
    <span class="mini-info">
      <span class="mini-phase phase-name"></span>
      <span class="mini-time time"></span>
    </span>
  </button>`;

let pip = null;
let bomb = null;
let drawBomb = null;

export const isMiniOpen = () => pip !== null;

export function closeMini() {
  pip?.close();
}

export function explodeMini() {
  if (pip) explode(bomb);
}

// Must be called from a click: browsers only open the window on a user action.
// onTick runs from the mini window, whose timers aren't throttled while the
// page's tab is in the background.
export async function openMini({ onTick, onClose }) {
  pip = await documentPictureInPicture.requestWindow({ width: 280, height: 150 });
  const doc = pip.document;
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const copy = doc.createElement('link');
    copy.rel = 'stylesheet';
    copy.href = link.href;
    doc.head.append(copy);
  }
  doc.title = 'Thinking Time Bomb';
  doc.body.classList.add('mini-body');
  doc.body.innerHTML = TEMPLATE;

  bomb = doc.importNode(document.getElementById('bomb-wrap'), true);
  bomb.removeAttribute('id');
  bomb.classList.remove('boom');
  doc.querySelector('.mini').prepend(bomb);
  drawBomb = bombDrawer(bomb);

  // Focusing the page from the pop-out brings its tab to the front.
  doc.querySelector('.mini').addEventListener('click', () => {
    window.focus();
    closeMini();
  });
  pip.setInterval(onTick, 250);
  pip.addEventListener('pagehide', () => {
    pip = null;
    onClose();
  });
}

// view: { phase, mode, running, finalSeconds, progress, label, time }
export function renderMini(view) {
  if (!pip) return;
  const { body } = pip.document;
  body.dataset.phase = view.phase;
  body.dataset.mode = view.mode;
  body.classList.toggle('running', view.running);
  body.classList.toggle('final-seconds', view.finalSeconds);
  drawBomb(view.progress);
  body.querySelector('.mini-phase').textContent = view.label;
  body.querySelector('.mini-time').textContent = view.time;
}
