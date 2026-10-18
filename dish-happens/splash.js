(() => {
  'use strict';
  const shell = document.querySelector('.shell');
  const overlay = document.createElement('section');
  overlay.className = 'waiter-welcome';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'waiter-welcome-title');
  overlay.setAttribute('aria-describedby', 'waiter-welcome-description');
  overlay.innerHTML = `
    <button class="welcome-skip" type="button" aria-label="Skip welcome"><span aria-hidden="true">×</span></button>
    <div class="welcome-content">
      <div class="welcome-art" role="img" aria-label="Dish Happens"><canvas aria-hidden="true"></canvas></div>
      <h1 class="welcome-a11y-title" id="waiter-welcome-title">Dish Happens</h1>
      <p class="welcome-description" id="waiter-welcome-description">Your table is ready.<br> <strong>Manny Plates</strong> is on his way.</p>
      <button class="welcome-order" type="button"><span>Place my order</span><span aria-hidden="true">↗</span></button>
    </div>`;
  document.body.append(overlay);

  const order = overlay.querySelector('.welcome-order');
  const canvas = overlay.querySelector('canvas');
  const context = canvas.getContext('2d');
  const logo = new Image();
  logo.src = 'assets/dish-happens-logo-manny-v2.png';
  let previousFocus = null;
  let previousOverflow = '';
  let previousInert = false;
  let previousAriaHidden = null;

  function drawScene() {
    if (overlay.hidden || !context) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(rect.width * density);
    const pixelHeight = Math.round(rect.height * density);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(density, 0, 0, density, 0, 0);
    if (!logo.complete || !logo.naturalWidth) return;
    // Fit the current logo in full and center it within the title block.
    const ratio = logo.naturalWidth / logo.naturalHeight;
    const width = Math.min(rect.width, rect.height * ratio);
    const height = width / ratio;
    context.drawImage(logo, 0, 0, logo.naturalWidth, logo.naturalHeight, (rect.width - width) / 2, (rect.height - height) / 2, width, height);
  }
  logo.addEventListener('load', drawScene);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(drawScene).observe(canvas);
  window.addEventListener('resize', drawScene);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) drawScene(); });

  function open() {
    if (document.body.classList.contains('is-active')) return false;
    if (!overlay.hidden) return true;
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    previousInert = shell ? shell.inert : false;
    previousAriaHidden = shell ? shell.getAttribute('aria-hidden') : null;
    overlay.hidden = false;
    document.body.classList.add('has-splash');
    document.body.style.overflow = 'hidden';
    order.focus({ preventScroll: true });
    if (shell) { shell.inert = true; shell.setAttribute('aria-hidden', 'true'); }
    drawScene();
    window.dispatchEvent(new CustomEvent('waiter-welcome:open'));
    return true;
  }
  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    if (shell) {
      shell.inert = previousInert;
      if (previousAriaHidden === null) shell.removeAttribute('aria-hidden'); else shell.setAttribute('aria-hidden', previousAriaHidden);
    }
    document.body.classList.remove('has-splash');
    document.body.style.overflow = previousOverflow;
    const target = document.getElementById('release') || previousFocus;
    if (target && target.isConnected) target.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent('waiter-welcome:close'));
  }
  order.addEventListener('click', close);
  overlay.querySelector('.welcome-skip').addEventListener('click', close);
  document.addEventListener('click', event => {
    const target = event.target.closest?.('[data-open-welcome]');
    if (!target || document.body.classList.contains('is-active')) return;
    event.preventDefault(); open();
  });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.code === 'Space') event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    else if (event.key === 'Tab') {
      const focusable = Array.from(overlay.querySelectorAll('button:not(:disabled), [href], [tabindex="0"]'));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  }, true);
  document.addEventListener('focusin', event => { if (!overlay.hidden && !overlay.contains(event.target)) order.focus({ preventScroll: true }); });
  window.WaiterSplash = Object.freeze({ open, close, get isOpen() { return !overlay.hidden; } });
  open();
})();
