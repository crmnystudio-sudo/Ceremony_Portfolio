/* Ceremony - custom blend/difference cursor with a pixelated, flickering edge.
   A solid circle follows the pointer with mix-blend-mode: difference, so it
   inverts whatever is beneath it. The interior is solid white; only the rim is
   dithered with per-frame noise on a low-res canvas (upscaled with
   image-rendering: pixelated), so the edge shimmers and breaks into pixels while
   the centre stays a clean inversion.
   Enabled only on fine-pointer, hover-capable devices; touch keeps native behaviour. */
(function () {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;

  // --- styles ---
  const style = document.createElement('style');
  style.textContent = `
    * { cursor: none !important; }

    .cursor-dot {
      position: fixed;
      top: 0;
      left: 0;
      width: 16px;
      height: 16px;
      pointer-events: none;
      z-index: 99999;
      mix-blend-mode: difference;
      transform: translate(-50%, -50%);
      transition: width 0.25s ease, height 0.25s ease, opacity 0.3s ease;
      will-change: transform;
      image-rendering: pixelated;      /* keep the rim blocky when upscaled */
      image-rendering: crisp-edges;
    }

    .cursor-dot.is-hover {
      width: 56px;
      height: 56px;
    }

    .cursor-dot.is-down {
      width: 12px;
      height: 12px;
    }

    .cursor-dot.is-hidden {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);

  // --- element (low-res canvas: solid disc + noisy dithered rim) ---
  const RES = 18;                       // internal pixel grid; scaled up by CSS
  const dot = document.createElement('canvas');
  dot.width = RES;
  dot.height = RES;
  dot.className = 'cursor-dot is-hidden';
  document.body.appendChild(dot);

  const ctx = dot.getContext('2d');
  const img = ctx.createImageData(RES, RES);
  const CENTER = (RES - 1) / 2;
  const MAXR = RES / 2;
  const BAND = 2.6;                      // width of the pixelated edge ring

  function drawEdge() {
    const d = img.data;
    for (let py = 0; py < RES; py++) {
      for (let px = 0; px < RES; px++) {
        const i = (py * RES + px) * 4;
        const dist = Math.hypot(px - CENTER, py - CENTER);
        let a;
        if (dist <= MAXR - BAND) {
          a = 255;                        // solid interior
        } else if (dist <= MAXR) {
          const p = (MAXR - dist) / BAND; // 1 at inner edge → 0 at outer edge
          a = Math.random() < p ? 255 : 0; // dithered, flickering pixels
        } else {
          a = 0;                          // outside the circle
        }
        d[i] = d[i + 1] = d[i + 2] = 255; // white (fully inverts the background)
        d[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  drawEdge();

  // --- follow with smoothing ---
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  const LERP = 0.18;
  let seen = false;

  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!seen) {
      seen = true;
      x = targetX; y = targetY;
      dot.classList.remove('is-hidden');
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => dot.classList.add('is-hidden'));
  document.addEventListener('mouseenter', () => { if (seen) dot.classList.remove('is-hidden'); });

  window.addEventListener('mousedown', () => dot.classList.add('is-down'));
  window.addEventListener('mouseup', () => dot.classList.remove('is-down'));

  // --- grow over interactive targets ---
  const INTERACTIVE = 'a, button, .grid-item, [data-cursor]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) dot.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE) && !(e.relatedTarget && e.relatedTarget.closest(INTERACTIVE))) {
      dot.classList.remove('is-hover');
    }
  });

  let tick = 0;
  function frame() {
    x += (targetX - x) * LERP;
    y += (targetY - y) * LERP;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    if ((tick++ & 1) === 0) drawEdge();   // re-dither the rim ~every other frame
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
