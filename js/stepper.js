// Turns <div class="stepper"><input>…</div> into a − value + control.
// Click to step by one, hold to keep stepping, or type / use arrow keys.
const HOLD_DELAY_MS = 400;
const REPEAT_MS = 70;

const ICONS = {
  [-1]: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9"/></svg>',
  [1]: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9"/></svg>',
};

// Returns a function that refreshes the disabled state of the buttons; call
// it after setting the input's value from code.
export function setupStepper(root, { min, max, label }) {
  const input = root.querySelector('input');
  let timer = null;
  let repeated = false;

  const makeButton = (delta) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step';
    button.innerHTML = ICONS[delta];
    button.setAttribute('aria-label', `${delta < 0 ? 'Decrease' : 'Increase'} ${label.toLowerCase()}`);
    return button;
  };
  const down = makeButton(-1);
  const up = makeButton(1);
  root.prepend(down);
  root.append(up);

  function refresh() {
    const value = Number(input.value);
    down.disabled = value <= min;
    up.disabled = value >= max;
  }

  function step(delta) {
    const value = Number(input.value);
    const current = Number.isInteger(value) ? value : min;
    input.value = Math.min(max, Math.max(min, current + delta));
    input.setAttribute('aria-invalid', 'false');
    refresh();
  }

  function stopRepeat() {
    clearTimeout(timer);
  }

  for (const [button, delta] of [[down, -1], [up, 1]]) {
    // Keyboard and quick clicks step once; a held pointer has already stepped.
    button.addEventListener('click', () => {
      if (!repeated) step(delta);
      repeated = false;
    });
    button.addEventListener('pointerdown', () => {
      repeated = false;
      timer = setTimeout(function repeat() {
        repeated = true;
        step(delta);
        if (!button.disabled) timer = setTimeout(repeat, REPEAT_MS);
      }, HOLD_DELAY_MS);
    });
    for (const type of ['pointerup', 'pointerleave', 'pointercancel']) {
      button.addEventListener(type, stopRepeat);
    }
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1);
    }
  });
  input.addEventListener('input', refresh);

  return refresh;
}
