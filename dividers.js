/* Ceremony - animated divider lines.

   Each `.wave-divider` becomes an SVG line with a ripple that travels left to
   right, then loops. Two looks:
     .wave-divider           -> smooth sine ripple
     .wave-divider.spiky     -> jagged, audio-waveform style peaks

   The line is drawn once synchronously so a divider is always visible even if
   requestAnimationFrame never runs (background tab, reduced motion). */
(function () {
  const dividers = [...document.querySelectorAll('.wave-divider')];
  if (!dividers.length) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const AMP = 7;          // peak height of the ripple, px
  const WAVELENGTH = 46;  // smooth mode only
  const SPREAD = 85;      // width of the travelling packet
  const SPEED = 260;      // px per second
  const STEP_SMOOTH = 4;  // fine sampling -> curve
  const STEP_SPIKY = 6;   // coarser sampling -> visible straight segments

  // Colours come from rainbow.css (--rainbow-stops). If that stylesheet isn't
  // linked the variable is empty and the lines keep their plain grey stroke,
  // so removing the <link> still reverts everything.
  const stopsRaw = getComputedStyle(document.documentElement)
    .getPropertyValue('--rainbow-stops').trim();
  const RAINBOW = stopsRaw ? stopsRaw.split(',').map(s => s.trim()).filter(Boolean) : null;

  const CYCLE = 520;                 // px for one full rainbow pass
  const GRAD_SPEED = CYCLE / 2.2;    // matches the 2.2s text animation

  let gradSeq = 0;

  const lines = dividers.map((el, i) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS(SVG_NS, 'path');

    // An SVG stroke can't take a CSS gradient, so build a real <linearGradient>.
    let grad = null;
    if (RAINBOW && RAINBOW.length > 1) {
      const id = 'divider-rainbow-' + (gradSeq++);
      const defs = document.createElementNS(SVG_NS, 'defs');
      grad = document.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', id);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      grad.setAttribute('spreadMethod', 'repeat');   // tile it across any width
      grad.setAttribute('x1', '0');
      grad.setAttribute('y1', '0');
      grad.setAttribute('x2', String(CYCLE));
      grad.setAttribute('y2', '0');
      RAINBOW.forEach((c, idx) => {
        const stop = document.createElementNS(SVG_NS, 'stop');
        stop.setAttribute('offset', (idx / (RAINBOW.length - 1) * 100).toFixed(2) + '%');
        stop.setAttribute('stop-color', c);
        grad.appendChild(stop);
      });
      defs.appendChild(grad);
      svg.appendChild(defs);
      // inline style beats the stylesheet's `stroke: #d8d4ce`
      path.style.stroke = `url(#${id})`;
    }

    svg.appendChild(path);
    el.appendChild(svg);
    return {
      el, svg, path, grad,
      spiky: el.classList.contains('spiky'),
      w: 0, h: 0,
      offset: i * 0.55,   // stagger so dividers don't pulse in lockstep
    };
  });

  function measure() {
    lines.forEach(l => {
      const r = l.el.getBoundingClientRect();
      l.w = Math.max(1, Math.round(r.width));
      l.h = Math.max(1, Math.round(r.height));
      l.svg.setAttribute('viewBox', `0 0 ${l.w} ${l.h}`);
    });
  }

  // Deterministic pseudo-random 0.35..1, stepping over time so the jagged
  // profile keeps changing rather than looking like a frozen sawtooth.
  function spikeMag(i, t) {
    const n = Math.sin(i * 12.9898 + Math.floor(t * 14) * 78.233) * 43758.5453;
    return 0.35 + (n - Math.floor(n)) * 0.65;
  }

  function drawFlat() {
    lines.forEach(l => l.path.setAttribute('d', `M0 ${l.h / 2} L${l.w} ${l.h / 2}`));
  }

  function draw(tSec) {
    lines.forEach(l => {
      const mid = l.h / 2;
      const step = l.spiky ? STEP_SPIKY : STEP_SMOOTH;
      // packet centre sweeps across, wrapping with a gap either side
      const span = l.w + SPREAD * 4;
      const c = ((tSec + l.offset) * SPEED) % span - SPREAD * 2;

      let d = '';
      let i = 0;
      for (let x = 0; x <= l.w; x += step, i++) {
        const dx = x - c;
        const env = Math.exp(-(dx * dx) / (2 * SPREAD * SPREAD));
        const y = l.spiky
          ? mid + (i % 2 ? 1 : -1) * spikeMag(i, tSec) * AMP * env
          : mid + Math.sin((x / WAVELENGTH) * Math.PI * 2 - tSec * 7) * AMP * env;
        d += (x === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(2) + ' ';
      }
      l.path.setAttribute('d', d);

      // Slide the rainbow along the stroke, matching the text animation.
      if (l.grad) {
        const shift = ((tSec + l.offset) * GRAD_SPEED) % CYCLE;
        l.grad.setAttribute('gradientTransform', `translate(${shift.toFixed(1)},0)`);
      }
    });
  }

  let lastT = 0;
  const redraw = () => { measure(); reduced ? drawFlat() : draw(lastT); };

  redraw();   // always leave a visible line, even if rAF never runs

  // The script can run before layout has settled, in which case the divider
  // measures ~0 wide and only one point gets drawn. Re-measure whenever the
  // element actually gets (or changes) its size.
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => redraw());
    lines.forEach(l => ro.observe(l.el));
  }
  window.addEventListener('resize', redraw);
  window.addEventListener('load', redraw);

  if (reduced) { drawFlat(); return; }

  let raf = null;
  const start = performance.now();
  function frame(now) {
    lastT = (now - start) / 1000;
    draw(lastT);
    raf = requestAnimationFrame(frame);
  }
  const play  = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const pause = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

  document.addEventListener('visibilitychange', () => document.hidden ? pause() : play());
  play();
})();
