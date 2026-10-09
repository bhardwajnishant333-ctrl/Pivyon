(() => {
'use strict';

// ── Site config ──────────────────────────────────────────────────────────
const SITE = {
  name: 'Pivyon',
  email: 'hello@pivyon.com',
  reactivity: 1, // 0–2: how strongly the hero reacts to the cursor
};

const BIO = "For three years, I've extensively explored ChatGPT and advanced AI systems, with my engagement informally estimated among the top 0.5% of AI users. I've developed multiple innovative projects across AI research, intelligent automation, interactive technologies, and next-generation applications. I now aim to move and make things better in the AI and upcoming future technologies.";

const TICKER = ['Evaluation', 'Red-teaming', 'Failure analysis', 'Post-training', 'RLHF · DPO', 'Interpretability', 'Distributed training', 'Inference at scale'];

const ATTN_TOKENS = ['frontier', 'models', 'learn', 'what', 'matters', 'by', 'attending', 'to', 'every', 'token', 'at', 'once'];

const EVAL_ROWS = ['reasoning', 'code', 'math', 'tool use', 'long context', 'safety', 'multilingual', 'agentic'];

const LIME = '#c8ff3e', PAPER = '#f2f1ec', INK = '#0b0b0d', GREY = '#8d8c86', HOT = '#ff5a3c';
const MONO = "'JetBrains Mono', monospace";
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Motion ───────────────────────────────────────────────────────────────
const Easing = {
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, k) => a + (b - a) * k;
const tween = (ease) => (t, start, end, from = 0, to = 1) => {
  if (t <= start) return from;
  if (t >= end) return to;
  return from + (to - from) * ease((t - start) / (end - start));
};
const MOTION = { enter: tween(Easing.easeOutCubic), draw: tween(Easing.easeInOutQuart), pop: tween(Easing.easeOutBack) };

// Deterministic pseudo-random numbers so every visual is stable across frames.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const hash = (a, b, c) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };
function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()); }

const $ = (id) => document.getElementById(id);
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// Canvas sized to its box at device resolution; draw in CSS pixels.
function hiDPI(canvas) {
  const c = { el: canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, dpr: 1 };
  const fit = () => {
    c.dpr = Math.min(2, window.devicePixelRatio || 1);
    c.w = canvas.clientWidth; c.h = canvas.clientHeight;
    canvas.width = Math.max(1, c.w * c.dpr); canvas.height = Math.max(1, c.h * c.dpr);
  };
  new ResizeObserver(fit).observe(canvas);
  fit();
  c.begin = () => { c.ctx.setTransform(c.dpr, 0, 0, c.dpr, 0, 0); c.ctx.clearRect(0, 0, c.w, c.h); return c.ctx; };
  return c;
}

// 0 when a pinned scene's top reaches the viewport top, 1 when it releases.
function sceneProgress(el, vh) { const r = el.getBoundingClientRect(); return -r.top / (r.height - vh); }
const near = (el, vh) => { const r = el.getBoundingClientRect(); return r.bottom > -vh * 0.5 && r.top < vh * 1.5; };

document.querySelectorAll('[data-name]').forEach((n) => { n.textContent = SITE.name; });
const emailLink = $('email-link');
emailLink.href = 'mailto:' + SITE.email;
emailLink.textContent = SITE.email;

const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, nx: 0, ny: 0 };
window.addEventListener('pointermove', (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; }, { passive: true });

// ── Boot ─────────────────────────────────────────────────────────────────
const boot = $('boot');
(function runBoot() {
  const lines = ['> initialising pivyon/frontier-07', '> loading checkpoint · 128 shards', '> compiling eval suite · 8 capabilities', '> attaching optimizer'];
  const box = $('boot-lines'), fill = $('boot-fill');
  if (reduceMotion) { boot.remove(); return; }
  const start = performance.now(), dur = 1500;
  let shown = 0;
  const finish = () => { boot.classList.add('done'); setTimeout(() => boot.remove(), 800); };
  boot.addEventListener('click', finish);
  (function step(now) {
    const k = clamp((now - start) / dur, 0, 1);
    fill.style.width = k * 100 + '%';
    while (shown < lines.length && k > shown / lines.length) box.appendChild(h('div', null, lines[shown++]));
    if (k < 1) requestAnimationFrame(step);
    else { box.appendChild(h('div', 'ok', '> ready')); setTimeout(finish, 250); }
  })(start);
})();

// ── Hero headline: one span per character, reacting to the cursor ────────
const headline = $('headline');
for (const word of ['I make', 'frontier models', 'better.']) {
  const line = h('span', 'line');
  for (const ch of word) {
    const s = h('span', 'ch', ch);
    s.style.color = ch === '.' ? LIME : PAPER;
    line.appendChild(s);
  }
  headline.appendChild(line);
}
const chars = Array.from(headline.querySelectorAll('.ch'));

// ── Hero: loss landscape ─────────────────────────────────────────────────
// A wireframe surface rendered in perspective. A momentum optimizer runs
// real gradient descent on it; the cursor raises a bump the optimizer has
// to route around.
const hero = $('top');
const terrain = hiDPI($('terrain'));
const spark = $('spark').getContext('2d');
const hudStep = $('hud-step'), hudLoss = $('hud-loss'), hudEval = $('hud-eval');
const cursorBump = { x: 9, z: 9, k: 0 };

function height(x, z, t) {
  let y = 0.18 * Math.sin(1.9 * x + t * 0.35) * Math.cos(1.6 * z - t * 0.25)
        + 0.08 * Math.sin(4.3 * x - 2.1 * z + t * 0.6);
  y -= (0.95 + 0.25 * Math.sin(t * 0.21)) * Math.exp(-((x - 0.55) ** 2 + (z + 0.25) ** 2) / 0.09);
  y -= 0.55 * Math.exp(-((x + 0.75) ** 2 + (z - 0.45) ** 2) / 0.13);
  y += 0.6 * Math.exp(-((x + 0.05) ** 2 + (z + 0.7) ** 2) / 0.1);
  y += 0.45 * Math.exp(-((x - 0.2) ** 2 + (z - 0.75) ** 2) / 0.07);
  y += cursorBump.k * 0.55 * Math.exp(-((x - cursorBump.x) ** 2 + (z - cursorBump.z) ** 2) / 0.05);
  return y;
}

const opt = { x: -1.2, z: 0.8, vx: 0, vz: 0, trail: [], step: 0, still: 0, losses: [], best: Infinity };
function resetOptimizer(r) {
  const a = r * Math.PI * 2;
  opt.x = Math.cos(a) * 1.3; opt.z = Math.sin(a) * 0.85; opt.vx = opt.vz = 0; opt.trail = []; opt.still = 0;
}
let restarts = 0;
resetOptimizer(0.62);

function stepOptimizer(t) {
  const e = 0.01;
  const gx = (height(opt.x + e, opt.z, t) - height(opt.x - e, opt.z, t)) / (2 * e);
  const gz = (height(opt.x, opt.z + e, t) - height(opt.x, opt.z - e, t)) / (2 * e);
  opt.vx = opt.vx * 0.9 - gx * 0.0035;
  opt.vz = opt.vz * 0.9 - gz * 0.0035;
  opt.x = clamp(opt.x + opt.vx, -1.6, 1.6);
  opt.z = clamp(opt.z + opt.vz, -1, 1);
  opt.trail.push([opt.x, opt.z]);
  if (opt.trail.length > 140) opt.trail.shift();
  opt.step++;
  const loss = 2.1 + height(opt.x, opt.z, t) * 1.1;
  opt.losses.push(loss);
  if (opt.losses.length > 180) opt.losses.shift();
  opt.best = Math.min(opt.best, loss);
  opt.still = Math.hypot(opt.vx, opt.vz) < 0.0006 ? opt.still + 1 : 0;
  if (opt.still > 140 || opt.trail.length >= 140 && opt.step % 900 === 0) resetOptimizer(hash(++restarts, 3, 7));
  return loss;
}

// Camera: slow orbit, nudged by the cursor.
function projector(c, t) {
  const yaw = t * 0.045 + mouse.nx * 0.35 - 0.5;
  const pitch = 0.62 + mouse.ny * 0.08;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const f = Math.min(c.w * 0.95, c.h * 1.5), dist = 3.1;
  const ox = c.w * (c.w < 760 ? 0.5 : 0.62), oy = c.h * (c.w < 760 ? 0.4 : 0.34);
  return (x, y, z) => {
    const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
    return [ox + (x1 * f) / z2, oy - (y2 * f) / z2, z2];
  };
}

const HEIGHT_BUCKETS = 6, DEPTH_BUCKETS = 3;
function drawTerrain(t) {
  const c = terrain, ctx = c.begin();
  const small = c.w < 760;
  const NX = small ? 34 : 56, NZ = small ? 24 : 38;
  const P = projector(c, t);
  const pts = new Array(NX * NZ), hs = new Array(NX * NZ);
  let zmin = Infinity, zmax = -Infinity;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const x = -1.6 + (3.2 * i) / (NX - 1), z = -1 + (2 * j) / (NZ - 1);
    const y = height(x, z, t);
    const p = P(x, y * 0.55, z);
    pts[j * NX + i] = p; hs[j * NX + i] = y;
    if (p[2] < zmin) zmin = p[2];
    if (p[2] > zmax) zmax = p[2];
  }
  const paths = [];
  for (let k = 0; k < HEIGHT_BUCKETS * DEPTH_BUCKETS; k++) paths.push(new Path2D());
  const seg = (a, b) => {
    const hy = (hs[a] + hs[b]) / 2, dz = (pts[a][2] + pts[b][2]) / 2;
    const hb = clamp(Math.floor(((hy + 1.1) / 1.9) * HEIGHT_BUCKETS), 0, HEIGHT_BUCKETS - 1);
    const db = clamp(Math.floor(((dz - zmin) / (zmax - zmin + 1e-6)) * DEPTH_BUCKETS), 0, DEPTH_BUCKETS - 1);
    const p = paths[hb * DEPTH_BUCKETS + db];
    p.moveTo(pts[a][0], pts[a][1]); p.lineTo(pts[b][0], pts[b][1]);
  };
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = j * NX + i;
    if (i < NX - 1) seg(a, a + 1);
    if (j < NZ - 1) seg(a, a + NX);
  }
  ctx.lineWidth = 1;
  for (let hb = 0; hb < HEIGHT_BUCKETS; hb++) for (let db = 0; db < DEPTH_BUCKETS; db++) {
    const low = 1 - hb / (HEIGHT_BUCKETS - 1); // 1 in the valleys
    const near = 1 - db / (DEPTH_BUCKETS - 1) * 0.65;
    const a = (0.1 + low * 0.5) * near;
    ctx.strokeStyle = low > 0.75 ? `rgba(200,255,62,${a})` : `rgba(242,241,236,${a * 0.55})`;
    ctx.stroke(paths[hb * DEPTH_BUCKETS + db]);
  }
  // Optimizer trail and head.
  const tr = opt.trail;
  if (tr.length > 1) {
    ctx.lineCap = 'round';
    for (let k = 1; k < tr.length; k++) {
      const a = P(tr[k - 1][0], height(tr[k - 1][0], tr[k - 1][1], t) * 0.55 + 0.02, tr[k - 1][1]);
      const b = P(tr[k][0], height(tr[k][0], tr[k][1], t) * 0.55 + 0.02, tr[k][1]);
      ctx.strokeStyle = `rgba(200,255,62,${(k / tr.length) * 0.95})`;
      ctx.lineWidth = 1 + (k / tr.length) * 2.5;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    const hp = P(opt.x, height(opt.x, opt.z, t) * 0.55 + 0.02, opt.z);
    const pulse = (Math.sin(t * 5) + 1) / 2;
    ctx.fillStyle = LIME;
    ctx.beginPath(); ctx.arc(hp[0], hp[1], 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(200,255,62,${0.6 - pulse * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hp[0], hp[1], 9 + pulse * 14, 0, Math.PI * 2); ctx.stroke();
    // Gradient readout next to the head.
    ctx.font = `500 10px ${MONO}`;
    ctx.fillStyle = 'rgba(200,255,62,0.85)';
    ctx.fillText(`∇ ${Math.hypot(opt.vx, opt.vz).toExponential(1)}`, hp[0] + 16, hp[1] - 10);
  }
}

function drawSpark() {
  const L = opt.losses, w = 180, hh = 48;
  spark.clearRect(0, 0, w, hh);
  if (L.length < 2) return;
  let lo = Infinity, hi = -Infinity;
  for (const v of L) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  spark.strokeStyle = LIME; spark.lineWidth = 1.5;
  spark.beginPath();
  L.forEach((v, i) => {
    const x = (i / 179) * w, y = 4 + (1 - (v - lo) / (hi - lo + 1e-6)) * (hh - 8);
    i ? spark.lineTo(x, y) : spark.moveTo(x, y);
  });
  spark.stroke();
}

function renderHero(t) {
  // Map the cursor onto the surface roughly, so the bump follows it.
  const inHero = mouse.y < hero.getBoundingClientRect().bottom;
  cursorBump.k += ((inHero && mouse.x > -1000 ? SITE.reactivity : 0) - cursorBump.k) * 0.06;
  cursorBump.x = lerp(cursorBump.x, mouse.nx * 1.5, 0.15);
  cursorBump.z = lerp(cursorBump.z, -mouse.ny * 0.9, 0.15);
  const loss = stepOptimizer(t);
  drawTerrain(t);
  if (opt.step % 3 === 0) {
    hudStep.textContent = (opt.step * 8 + 12000).toLocaleString('en-US');
    hudLoss.textContent = loss.toFixed(3) + (opt.losses.length > 10 && loss < opt.losses[opt.losses.length - 10] ? ' ↓' : ' ↑');
    hudEval.textContent = clamp(92 - (opt.best - 0.6) * 18, 40, 97.5).toFixed(1);
    drawSpark();
  }
  for (const s of chars) {
    const r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const inf = Math.max(0, 1 - Math.hypot(cx - mouse.x, cy - mouse.y) / 340) * SITE.reactivity;
    const idle = (Math.sin(t * 1.2 + cx * 0.01) + 1) / 2;
    s.style.fontVariationSettings = `'wdth' ${(64 + idle * 14 + inf * 22).toFixed(1)}, 'wght' ${(560 + idle * 140 + inf * 200).toFixed(0)}`;
    s.style.color = s.textContent === '.' ? LIME : (inf > 0.35 ? LIME : PAPER);
  }
}

// ── Ticker ───────────────────────────────────────────────────────────────
const tickerRow = $('ticker-row');
for (let i = 0; i < 4; i++) for (const t of TICKER) {
  const s = h('span', null, t);
  s.appendChild(h('span', 'star', '✦'));
  tickerRow.appendChild(s);
}
if (!reduceMotion) tickerRow.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 40000, iterations: Infinity });

// ── Approach: attention arcs ─────────────────────────────────────────────
const sAttn = $('attention');
const attn = hiDPI($('attn'));
const attnQ = $('attn-q'), attnHead = $('attn-head'), attnCopy = document.querySelector('.attn-copy'), attnMeta = document.querySelector('.attn-meta');
const HEADS = [
  { color: [200, 255, 62], label: 'head 4' },
  { color: [242, 241, 236], label: 'head 9' },
  { color: [141, 140, 134], label: 'head 13' },
];

function attentionWeights(head, q, t) {
  const n = ATTN_TOKENS.length, s = [];
  let max = -Infinity;
  for (let k = 0; k < n; k++) {
    let v = hash(head, q, k) * 3.2 + 0.6 * Math.sin(t * 0.9 + head * 2 + k);
    if (k === q) v -= 1.5;
    if (head === 0 && Math.abs(k - q) === 1) v += 1.6;
    if (head === 1 && k === 0) v += 1.2;
    s.push(v); max = Math.max(max, v);
  }
  const e = s.map((v) => Math.exp((v - max) * 1.6)), sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

function renderAttention(t, p) {
  const c = attn, ctx = c.begin();
  const n = ATTN_TOKENS.length;
  const vertical = c.w < 760;
  const stickTop = c.el.getBoundingClientRect().top;
  const copyBottom = attnCopy.getBoundingClientRect().bottom - stickTop;
  const metaTop = attnMeta.getBoundingClientRect().top - stickTop;
  // On phones the tokens stack between the copy and the footer label;
  // shrink the type until all of them fit in that gap.
  const vTop = copyBottom + 28, vBottom = metaTop - 24;
  const fs = vertical ? clamp((vBottom - vTop) / n / 2.1, 8, 15) : clamp(c.w / 62, 13, 24);
  ctx.font = `500 ${fs}px ${MONO}`;
  const vStep = (vBottom - vTop) / n;
  const padX = fs * 0.7, boxH = vertical ? Math.min(fs * 2, vStep * 0.88) : fs * 2;
  const widths = ATTN_TOKENS.map((w) => ctx.measureText(w).width + padX * 2);
  const pos = [];
  if (!vertical) {
    const gap = fs * 0.6, total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
    let x = (c.w - total) / 2;
    const y = c.h * 0.76;
    widths.forEach((w) => { pos.push([x + w / 2, y, w]); x += w + gap; });
  } else {
    widths.forEach((w, i) => pos.push([c.w * 0.3, vTop + vStep * (i + 0.5), w]));
  }
  // The query token sweeps across the sentence with scroll.
  const qf = clamp(p, 0, 0.999) * n;
  const q = Math.floor(qf);
  const appear = MOTION.enter(p, -0.25, 0.02);
  attnQ.textContent = `query → "${ATTN_TOKENS[q]}"`;
  attnHead.textContent = `layer 23 · ${HEADS.map((hd) => hd.label).join(' · ')}`;

  HEADS.forEach((hd, hi) => {
    const w = attentionWeights(hi, q, t);
    for (let k = 0; k < n; k++) {
      if (k === q || w[k] < 0.02) continue;
      const a = pos[q], b = pos[k];
      const strength = w[k] * appear;
      ctx.strokeStyle = `rgba(${hd.color.join(',')},${0.12 + strength * 0.88})`;
      ctx.lineWidth = 0.6 + strength * (hi === 0 ? 9 : 5);
      ctx.beginPath();
      if (!vertical) {
        const ax = a[0], bx = b[0], y0 = a[1] - boxH / 2 - 4;
        const lift = Math.min(Math.max(40, y0 - copyBottom - 28), 30 + Math.abs(bx - ax) * (0.42 + hi * 0.08));
        ctx.moveTo(ax, y0);
        ctx.bezierCurveTo(ax, y0 - lift, bx, y0 - lift, bx, y0);
      } else {
        const x0 = a[0] + a[2] / 2 + 6, xb = b[0] + b[2] / 2 + 6;
        const reach = 24 + Math.abs(b[1] - a[1]) * (0.55 + hi * 0.12);
        ctx.moveTo(x0, a[1]);
        ctx.bezierCurveTo(Math.max(x0, xb) + reach, a[1], Math.max(x0, xb) + reach, b[1], xb, b[1]);
      }
      ctx.stroke();
    }
  });
  // Token chips, lit by head 4's weights; the query token is filled.
  const w0 = attentionWeights(0, q, t);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  pos.forEach(([x, y, w], k) => {
    const isQ = k === q;
    const lit = isQ ? 1 : clamp(w0[k] * 3, 0, 1);
    ctx.fillStyle = isQ ? LIME : `rgba(200,255,62,${lit * 0.18})`;
    ctx.strokeStyle = isQ ? LIME : `rgba(242,241,236,${0.18 + lit * 0.6})`;
    ctx.lineWidth = 1;
    ctx.fillRect(x - w / 2, y - boxH / 2, w, boxH);
    ctx.strokeRect(x - w / 2 + 0.5, y - boxH / 2 + 0.5, w - 1, boxH - 1);
    ctx.fillStyle = isQ ? INK : `rgba(242,241,236,${0.45 + lit * 0.55})`;
    ctx.fillText(ATTN_TOKENS[k], x, y + 1);
    // Weight bar under each token.
    if (!vertical) {
      ctx.fillStyle = `rgba(200,255,62,${0.35 + lit * 0.65})`;
      ctx.fillRect(x - w / 2, y + boxH / 2 + 10, w * (isQ ? 0 : w0[k]) , 3);
    }
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── Services: four live visuals in one pinned scene ───────────────────────
const sPipe = $('services');
const pipe = hiDPI($('pipe'));
const pipeArticles = Array.from($('pipe-copy').children);
const pipeSteps = Array.from($('pipe-steps').children);

// Precomputed data for each stage.
const evalScores = EVAL_ROWS.map((_, r) => Array.from({ length: 12 }, (_, c) =>
  clamp(0.18 + 0.05 * r * hash(r, 1, 1) + c * (0.045 + 0.03 * hash(r, 2, 2)) + (hash(r, c, 3) - 0.5) * 0.12, 0.05, 0.98)));

const cloud = (() => {
  const r = rng(42), pts = [];
  const centers = [[-0.55, -0.35, 0], [0.1, -0.55, 0], [0.6, -0.2, 0], [-0.35, 0.45, 1], [0.35, 0.45, 2], [0.75, 0.55, 3]];
  for (let i = 0; i < 900; i++) {
    const c = centers[Math.floor(r() * centers.length)];
    const spread = c[2] ? 0.09 : 0.16;
    pts.push({ x: c[0] + gauss(r) * spread, y: c[1] + gauss(r) * spread * 0.8, f: c[2], ph: r() * 6.28, o: r() });
  }
  return { pts, centers };
})();
const FAILURES = ['', 'hallucination', 'refusal drift', 'tool misuse'];

const curves = (() => {
  const r = rng(7), N = 160, before = [], after = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    before.push(0.95 * Math.exp(-2.2 * x) + 0.55 + (r() - 0.5) * 0.05 * (1 - x * 0.5));
    after.push(1.0 * Math.exp(-3.6 * x) + 0.3 + (r() - 0.5) * 0.04 * (1 - x * 0.5));
  }
  return { before, after };
})();

function stageAlpha(lp) { return clamp(Math.min(lp * 7, (1 - lp) * 7), 0, 1); }

function drawEvaluate(ctx, W, H, lp, t) {
  const rows = EVAL_ROWS.length, cols = 12;
  const left = Math.min(130, W * 0.28), top = 54, right = 18, bottom = 30;
  const cw = (W - left - right) / cols, ch = (H - top - bottom) / rows;
  ctx.font = `500 ${clamp(cw * 0.32, 8, 11)}px ${MONO}`;
  ctx.fillStyle = GREY;
  ctx.fillText('CAPABILITY × CHECKPOINT', left, 30);
  for (let c = 0; c < cols; c++) {
    ctx.fillStyle = GREY;
    ctx.fillText('c' + String(c + 1).padStart(2, '0'), left + c * cw + 3, H - 10);
  }
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = PAPER;
    ctx.fillText(EVAL_ROWS[r].toUpperCase(), 14, top + r * ch + ch / 2 + 4);
    for (let c = 0; c < cols; c++) {
      const reveal = clamp((lp * 1.35 - c / cols) * 6 - r * 0.04, 0, 1);
      if (reveal <= 0) continue;
      const s = evalScores[r][c] * reveal;
      const x = left + c * cw + 1.5, y = top + r * ch + 1.5;
      ctx.fillStyle = `rgba(200,255,62,${0.06 + s * 0.9})`;
      ctx.fillRect(x, y, cw - 3, ch - 3);
      if (cw > 34 && ch > 22) {
        ctx.fillStyle = s > 0.55 ? INK : PAPER;
        ctx.fillText(Math.round(s * 100), x + 6, y + ch / 2 + 2);
      }
    }
  }
  // Scan line on the newest column.
  const scan = left + clamp(lp * 1.35, 0, 1) * (W - left - right);
  ctx.fillStyle = `rgba(200,255,62,${0.5 + 0.5 * Math.sin(t * 8)})`;
  ctx.fillRect(scan, top - 6, 2, H - top - bottom + 6);
}

function drawDiagnose(ctx, W, H, lp, t) {
  const cx = W / 2, cy = H / 2 + 10, sx = W * 0.42, sy = H * 0.38;
  const n = Math.floor(clamp(lp * 1.6, 0, 1) * cloud.pts.length);
  const ignite = MOTION.enter(lp, 0.42, 0.62);
  ctx.font = `500 11px ${MONO}`;
  ctx.fillStyle = GREY;
  ctx.fillText(`OUTPUT EMBEDDINGS · n=${(n * 1000).toLocaleString('en-US')}`, 18, 30);
  for (let i = 0; i < n; i++) {
    const p = cloud.pts[i];
    const x = cx + (p.x + Math.sin(t * 0.6 + p.ph) * 0.012) * sx;
    const y = cy + (p.y + Math.cos(t * 0.5 + p.ph) * 0.012) * sy;
    if (p.f && ignite > 0) {
      ctx.fillStyle = `rgba(255,90,60,${0.35 + ignite * 0.65})`;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    } else {
      ctx.fillStyle = `rgba(242,241,236,${0.25 + p.o * 0.35})`;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  cloud.centers.forEach((c) => {
    if (!c[2] || ignite <= 0) return;
    const x = cx + c[0] * sx, y = cy + c[1] * sy, rr = (0.18 * sx) * (0.6 + ignite * 0.4);
    ctx.strokeStyle = `rgba(255,90,60,${ignite})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255,90,60,${ignite})`;
    ctx.fillText(FAILURES[c[2]].toUpperCase(), x - rr, y - rr - 8);
  });
}

function drawImprove(ctx, W, H, lp) {
  const left = 52, right = 20, top = 50, bottom = 40;
  const pw = W - left - right, ph = H - top - bottom;
  ctx.font = `500 11px ${MONO}`;
  ctx.fillStyle = GREY;
  ctx.fillText('EVAL LOSS · BEFORE / AFTER', left, 30);
  ctx.strokeStyle = '#2a2a2c'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) { const y = top + (ph * g) / 4; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + pw, y); ctx.stroke(); }
  ctx.fillText('STEPS →', left + pw - 60, H - 14);
  const plot = (arr, upto, color, width, dash) => {
    const N = arr.length, end = Math.floor(clamp(upto, 0, 1) * (N - 1));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
    ctx.beginPath();
    for (let i = 0; i <= end; i++) {
      const x = left + (i / (N - 1)) * pw, y = top + (1 - (arr[i] - 0.2) / 1.35) * ph;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    return end;
  };
  plot(curves.before, lp * 1.6, 'rgba(141,140,134,0.9)', 1.5, [5, 5]);
  const end = plot(curves.after, (lp - 0.15) * 1.6, LIME, 2.5, []);
  if (lp > 0.15) {
    const x = left + (end / (curves.after.length - 1)) * pw, y = top + (1 - (curves.after[end] - 0.2) / 1.35) * ph;
    ctx.fillStyle = LIME; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = GREY; ctx.fillText('— — BEFORE', left + 10, top + 18);
  ctx.fillStyle = LIME; ctx.fillText('——— AFTER', left + 110, top + 18);
}

function drawScale(ctx, W, H, lp, t) {
  const N = 64, top = 50, bottom = 70;
  const size = Math.min((W - 36) / N, (H - top - bottom) / N);
  const ox = (W - size * N) / 2, oy = top;
  const lit = Math.round(Math.pow(2, clamp(lp * 1.25, 0, 1) * 12));
  ctx.font = `500 11px ${MONO}`;
  ctx.fillStyle = GREY;
  ctx.fillText('ACCELERATOR GRID · 4,096', 18, 30);
  for (let i = 0; i < N * N; i++) {
    const x = ox + (i % N) * size, y = oy + Math.floor(i / N) * size;
    if (i < lit) {
      const fl = 0.55 + 0.45 * Math.sin(t * 6 + hash(i, 5, 9) * 6.28);
      ctx.fillStyle = `rgba(200,255,62,${fl})`;
    } else ctx.fillStyle = 'rgba(242,241,236,0.06)';
    ctx.fillRect(x, y, Math.max(1, size - 1), Math.max(1, size - 1));
  }
  ctx.fillStyle = PAPER;
  ctx.font = `800 ${clamp(W * 0.05, 22, 40)}px 'Archivo'`;
  ctx.fillText(`${lit.toLocaleString('en-US')} GPUs`, 18, H - 22);
  ctx.font = `500 11px ${MONO}`;
  ctx.fillStyle = LIME;
  ctx.textAlign = 'right';
  ctx.fillText(`${(lit * 3.1).toFixed(0)}k tok/s`, W - 18, H - 24);
  ctx.textAlign = 'left';
}

const DRAWERS = [drawEvaluate, drawDiagnose, drawImprove, drawScale];

function renderPipeline(t, p) {
  const u = clamp(p, 0, 0.9999) * 4;
  const stage = Math.floor(u), lp = u - stage;
  pipeArticles.forEach((a, i) => {
    const d = u - (i + 0.5);
    const o = clamp(1 - Math.abs(d) * 2.4 + 0.2, 0, 1);
    a.style.opacity = o;
    a.style.transform = window.innerWidth > 860 ? `translateY(calc(-50% + ${-d * 40}px))` : `translateY(${-d * 24}px)`;
  });
  pipeSteps.forEach((s, i) => s.classList.toggle('on', i === stage));
  const c = pipe, ctx = c.begin();
  ctx.globalAlpha = stageAlpha(lp);
  DRAWERS[stage](ctx, c.w, c.h, lp, t);
  ctx.globalAlpha = 1;
}

// ── Close ────────────────────────────────────────────────────────────────
const sClose = document.querySelector('.s-close');
const closeLine = $('close-line'), closeFoot = $('close-foot');
const closeWords = ['Make', 'things', 'better.'].map((w) => $('close-words').appendChild(h('div', null, w)));
function renderClose(H) {
  const q = clamp((H - sClose.getBoundingClientRect().top) / (H * 0.8), 0, 1);
  closeLine.style.width = MOTION.draw(q, 0.2, 0.55) * 100 + '%';
  closeWords.forEach((w, i) => {
    const s = 0.1 + i * 0.1, k = MOTION.pop(q, s, s + 0.2);
    w.style.opacity = clamp(k * 2, 0, 1);
    w.style.transform = `translateY(${(1 - k) * 80}px)`;
    w.style.fontVariationSettings = `'wdth' ${MOTION.enter(q, s, s + 0.7, 95, 72)}`;
  });
  closeFoot.style.opacity = MOTION.enter(q, 0.55, 0.8);
}

// ── Bio ──────────────────────────────────────────────────────────────────
const bio = $('bio');
const bioWords = BIO.split(' ').map((t) => {
  const s = h('span', null, t + ' ');
  bio.appendChild(s);
  return { s, accent: /0\.5%|three|years,/.test(t) };
});
function renderBio(H) {
  const r = bio.getBoundingClientRect();
  const p = clamp((H * 0.85 - r.top) / (r.height + H * 0.35), 0, 1);
  const lit = Math.round(p * bioWords.length * 1.15);
  bioWords.forEach((w, i) => {
    const color = i < lit ? (w.accent ? LIME : PAPER) : '';
    if (w.s.style.color !== color) w.s.style.color = color;
  });
}

// ── Frame loop ───────────────────────────────────────────────────────────
const t0 = performance.now();
function frame(now) {
  const t = ((now - t0) / 1000) * (reduceMotion ? 0.25 : 1);
  const W = window.innerWidth, H = window.innerHeight;
  mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
  if (mouse.tx > -1000) { mouse.nx = clamp(mouse.x / W * 2 - 1, -1, 1); mouse.ny = clamp(mouse.y / H * 2 - 1, -1, 1); }
  if (near(hero, H)) renderHero(t);
  if (near(sAttn, H)) renderAttention(t, sceneProgress(sAttn, H));
  if (near(sPipe, H)) renderPipeline(t, sceneProgress(sPipe, H));
  if (near(sClose, H)) renderClose(H);
  renderBio(H);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ── Contact ──────────────────────────────────────────────────────────────
// No backend: sending opens the visitor's mail app with the note prefilled.
const form = $('contact-form'), input = $('msg'), hint = $('hint');
const line = form.querySelector('.contact-line');
function setErr(on) { line.classList.toggle('err', on); hint.textContent = on ? 'Type a few words first' : 'A short note is enough'; }
input.addEventListener('input', () => setErr(false));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg.length < 3) { setErr(true); return; }
  window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Hello from pivyon.com')}&body=${encodeURIComponent(msg)}`;
  form.hidden = true;
  $('sent').hidden = false;
});
})();
