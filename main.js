(() => {
'use strict';

// ── Site config: replace these placeholders ──────────────────────────────
const SITE = {
  name: 'Your Name',
  email: 'you@email.com',
  tickerSeconds: 30,
  reactivity: 1, // 0–2: how strongly the hero reacts to the cursor
};

const BIO = "For three years, I've extensively explored ChatGPT and advanced AI systems, with my engagement informally estimated among the top 0.5% of AI users. I've developed multiple innovative projects across AI research, intelligent automation, interactive technologies, and next-generation applications. I now aim to move and make things better in the AI and upcoming future technologies.";

const DOMAINS = [
  ['AI research', 'Probing how large models reason, fail and can be steered. Experiments, write-ups and evaluations.', 'Research notes / figure'],
  ['Intelligent automation', 'Agents and workflows that take repetitive work off people and run it reliably.', 'Workflow diagram / demo'],
  ['Interactive technologies', 'Interfaces where AI responds in real time: voice, gesture, generative visuals.', 'Interaction capture'],
  ['Next-gen applications', 'Products designed for what the next generation of models makes possible.', 'Product screens'],
];

const LIME = '#c8ff3e', PAPER = '#f2f1ec';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

document.querySelectorAll('[data-name]').forEach((n) => { n.textContent = SITE.name; });
const emailLink = document.getElementById('email-link');
emailLink.href = 'mailto:' + SITE.email;
emailLink.textContent = SITE.email;

// ── Hero headline: one span per character ────────────────────────────────
const headline = document.getElementById('headline');
for (const word of ['Make', 'things', 'better.']) {
  const line = h('span', 'line');
  for (const ch of word) {
    const s = h('span', 'ch', ch);
    s.style.color = ch === '.' ? LIME : PAPER;
    line.appendChild(s);
  }
  headline.appendChild(line);
}
const chars = Array.from(headline.querySelectorAll('.ch'));

// ── Hero field + cursor-reactive type ────────────────────────────────────
const hero = document.getElementById('top');
const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
window.addEventListener('pointermove', (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; }, { passive: true });

let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
}
new ResizeObserver(resize).observe(canvas);
resize();

let heroVisible = true;
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

function frame(now) {
  if (heroVisible) {
    const t = now / 1000, m = mouse, k = SITE.reactivity;
    m.x += (m.tx - m.x) * 0.12; m.y += (m.ty - m.y) * 0.12;
    const hb = hero.getBoundingClientRect(), mx = m.x - hb.left, my = m.y - hb.top;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const gap = 34;
    for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
      const dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy);
      const inf = Math.max(0, 1 - d / 260) * k;
      const a = Math.sin(x * 0.006 + t * 0.6) * Math.cos(y * 0.008 - t * 0.4) * Math.PI + inf * Math.atan2(dy, dx);
      const len = 6 + inf * 18;
      ctx.strokeStyle = inf > 0.05 ? `rgba(200,255,62,${0.25 + inf * 0.75})` : 'rgba(242,241,236,0.13)';
      ctx.lineWidth = 1 + inf * 1.5;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2);
      ctx.lineTo(x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2);
      ctx.stroke();
    }
    for (const s of chars) {
      const r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inf = Math.max(0, 1 - Math.hypot(cx - m.x, cy - m.y) / 380) * k;
      const idle = (Math.sin(t * 1.2 + cx * 0.01) + 1) / 2;
      s.style.fontVariationSettings = `'wdth' ${(62 + idle * 18 + inf * 45).toFixed(1)}, 'wght' ${(500 + idle * 150 + inf * 250).toFixed(0)}`;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ── Ticker ───────────────────────────────────────────────────────────────
const tickerRow = document.getElementById('ticker-row');
const tickerItems = ['AI research', 'Intelligent automation', 'Interactive technologies', 'Next-generation applications'];
for (let i = 0; i < 4; i++) for (const t of tickerItems) {
  const s = h('span', null, t);
  s.appendChild(h('span', 'star', '✦'));
  tickerRow.appendChild(s);
}
if (!reduceMotion) {
  tickerRow.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: SITE.tickerSeconds * 1000, iterations: Infinity });
}

// ── Bio: words light up as it scrolls through ────────────────────────────
const bio = document.getElementById('bio');
const words = BIO.split(' ').map((t) => {
  const s = h('span', null, t + ' ');
  bio.appendChild(s);
  return { s, accent: /0\.5%|three|years,/.test(t) };
});
function onScroll() {
  const r = bio.getBoundingClientRect(), vh = window.innerHeight;
  const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
  const lit = Math.round(p * words.length * 1.15);
  words.forEach((w, i) => { w.s.style.color = i < lit ? (w.accent ? LIME : PAPER) : ''; });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// ── Work accordion ───────────────────────────────────────────────────────
const list = document.getElementById('domains');
const rows = DOMAINS.map(([title, body, ph], i) => {
  const row = h('div', 'domain');
  row.tabIndex = 0;
  row.setAttribute('role', 'button');
  const head = h('div', 'domain-head');
  head.append(h('span', 'domain-n', '0' + (i + 1)), h('span', 'domain-title', title), h('span', 'domain-arrow', '↗'));
  const wrap = h('div', 'domain-body');
  const inner = h('div');
  const grid = h('div', 'domain-grid');
  grid.append(h('p', null, body), h('div', 'domain-ph', ph));
  inner.appendChild(grid);
  wrap.appendChild(inner);
  row.append(head, wrap);
  const open = () => rows.forEach((r, j) => { r.classList.toggle('open', j === i); r.setAttribute('aria-expanded', j === i); });
  row.addEventListener('mouseenter', open);
  row.addEventListener('click', open);
  row.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  list.appendChild(row);
  return row;
});
rows.forEach((r, j) => { r.classList.toggle('open', j === 0); r.setAttribute('aria-expanded', j === 0); });

// ── Contact ──────────────────────────────────────────────────────────────
// No backend: sending opens the visitor's mail app with the note prefilled.
const form = document.getElementById('contact-form');
const input = document.getElementById('msg');
const line = form.querySelector('.contact-line');
const hint = document.getElementById('hint');
function setErr(on) {
  line.classList.toggle('err', on);
  hint.textContent = on ? 'Type a few words first' : 'A short note is enough';
}
input.addEventListener('input', () => setErr(false));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg.length < 3) { setErr(true); return; }
  window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Hello from your site')}&body=${encodeURIComponent(msg)}`;
  form.hidden = true;
  document.getElementById('sent').hidden = false;
});
})();
