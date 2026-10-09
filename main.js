(() => {
'use strict';

// ── Site config: replace these placeholders ──────────────────────────────
const SITE = {
  name: 'Pivyon',
  email: 'hello@pivyon.com',
  reactivity: 1, // 0–2: how strongly the dot field reacts to the cursor
};

const BIO = "For three years, I've extensively explored ChatGPT and advanced AI systems, with my engagement informally estimated among the top 0.5% of AI users. I've developed multiple innovative projects across AI research, intelligent automation, interactive technologies, and next-generation applications. I now aim to move and make things better in the AI and upcoming future technologies.";

const PROMPT = 'what if it could be better?';

const FEED = ['summarise 40 papers on agent memory', 'design an eval for tool use', 'automate the weekly report pipeline', 'prototype a voice interface', 'stress-test the reasoning chain', 'map failure modes in long context', 'generate UI from a sketch', 'compare model outputs at scale', 'draft a research plan', 'build a self-checking workflow'];

const DOMAINS = [
  ['AI research', 'Probing how large models reason, fail and can be steered. Experiments, write-ups and evaluations.'],
  ['Intelligent automation', 'Agents and workflows that take repetitive work off people and run it reliably.'],
  ['Interactive technologies', 'Interfaces where AI responds in real time: voice, gesture, generative visuals.'],
  ['Next-gen applications', 'Products designed for what the next generation of models makes possible.'],
];

const LIME = '#c8ff3e', PAPER = '#f2f1ec';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Motion (same curves as the explainer video) ──────────────────────────
const Easing = {
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const tween = (ease) => (t, start, end, from = 0, to = 1) => {
  if (t <= start) return from;
  if (t >= end) return to;
  return from + (to - from) * ease((t - start) / (end - start));
};
const MOTION = {
  enter: tween(Easing.easeOutCubic),
  draw: tween(Easing.easeInOutQuart),
  pop: tween(Easing.easeOutBack),
};

const $ = (id) => document.getElementById(id);
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

// Scroll progress through a pinned scene: 0 when its top reaches the top of
// the viewport, 1 when its pinned viewport is about to scroll away. Values
// outside 0..1 mean the scene is still approaching or already past.
function sceneProgress(el, vh) {
  const r = el.getBoundingClientRect();
  return -r.top / (r.height - vh);
}

document.querySelectorAll('[data-name]').forEach((n) => { n.textContent = SITE.name; });
const emailLink = $('email-link');
emailLink.href = 'mailto:' + SITE.email;
emailLink.textContent = SITE.email;

// ── Build DOM ────────────────────────────────────────────────────────────
const feedList = $('feed-list');
[...FEED, ...FEED].forEach((l, i) => feedList.appendChild(h('div', i % 4 === 1 ? 'hl' : null, '> ' + l)));

const domainsEl = $('domains');
const doms = DOMAINS.map(([title, body], i) => {
  const box = h('div', 'dom');
  const idx = h('div', 'dom-idx', `0${i + 1} / 04`);
  const word = h('div', 'dom-word', title);
  const bar = h('div', 'dom-bar');
  const desc = h('p', 'dom-desc', body);
  box.append(idx, word, bar, desc);
  domainsEl.appendChild(box);
  return { box, idx, word, bar, desc };
});

const closeWords = ['Make', 'things', 'better.'].map((w) => $('close-words').appendChild(h('div', null, w)));

const bio = $('bio');
const bioWords = BIO.split(' ').map((t) => {
  const s = h('span', null, t + ' ');
  bio.appendChild(s);
  return { s, accent: /0\.5%|three|years,/.test(t) };
});

// ── Scene 1 · Prompt ─────────────────────────────────────────────────────
const sPrompt = $('top');
const promptEl = $('prompt');
const typed = $('typed');
const caret = $('caret');
const promptMeta = $('prompt-meta');
const scrollHint = $('scroll-hint');
promptEl.style.left = '0';
promptEl.style.top = '0';

const canvas = $('field');
const ctx = canvas.getContext('2d');
const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
window.addEventListener('pointermove', (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; }, { passive: true });
let cw = 0, ch = 0, dpr = 1;
function resizeCanvas() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cw = canvas.clientWidth; ch = canvas.clientHeight;
  canvas.width = cw * dpr; canvas.height = ch * dpr;
}
new ResizeObserver(resizeCanvas).observe(canvas);
resizeCanvas();

const t0 = performance.now();

function drawField(t) {
  const m = mouse, k = SITE.reactivity;
  m.x += (m.tx - m.x) * 0.12; m.y += (m.ty - m.y) * 0.12;
  const gap = clamp(cw / 25, 40, 76);
  const drift = (t * 6) % gap;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cw, ch);
  for (let yi = 0, y = gap / 2 - drift; y < ch + gap; yi++, y += gap) {
    for (let xi = 0, x = gap / 2; x < cw; xi++, x += gap) {
      const ph = Math.sin(xi * 0.5 + t * 0.9) * Math.cos(yi * 0.6 - t * 0.7);
      const d = Math.hypot(x - m.x, y - m.y);
      const inf = Math.max(0, 1 - d / 240) * k;
      const s = 3 + inf * 5;
      ctx.fillStyle = inf > 0.05 ? `rgba(200,255,62,${0.2 + inf * 0.8})` : `rgba(242,241,236,${0.06 + Math.max(0, ph) * 0.12})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
}

function renderPrompt(t, W, H, p) {
  const n = reduceMotion ? PROMPT.length : Math.floor(clamp(MOTION.enter(t, 0.5, 2.6, 0, PROMPT.length), 0, PROMPT.length));
  if (typed.textContent.length !== n) typed.textContent = PROMPT.slice(0, n);
  caret.style.opacity = (Math.floor(t * 2.4) % 2 === 0 || (t > 0.5 && t < 2.6)) ? 1 : 0;
  // Dock top-left as the scene scrolls, like the video's Prompt → Years move.
  const move = MOTION.draw(p, 0.05, 0.75);
  const gutter = clamp(W * 0.04, 20, 48);
  const x = W / 2 + (gutter - W / 2) * move;
  const y = H / 2 + (Math.min(110, H * 0.14) - H / 2) * move;
  promptEl.style.transform = `translate(${x}px, ${y}px) translate(${-50 * (1 - move)}%, -50%) scale(${1 - 0.5 * move})`;
  promptEl.style.opacity = MOTION.enter(t, 0.1, 0.5);
  const metaOut = 1 - MOTION.enter(p, 0, 0.3);
  promptMeta.style.opacity = metaOut;
  scrollHint.style.opacity = metaOut * MOTION.enter(t, 2.6, 3.2);
}

// ── Scene 2 · Years ──────────────────────────────────────────────────────
const sYears = $('about');
const yearsStick = sYears.querySelector('.stick');
const countEl = $('count');
const yearsLabel = $('years-label');
const tier = $('tier');

function renderYears(H, p) {
  yearsStick.style.opacity = MOTION.enter(p, -0.3, 0.05);
  const q = clamp(p, 0, 1);
  feedList.style.transform = `translateY(${H * 0.85 - q * (feedList.offsetHeight * 0.5 + H * 0.35)}px)`;
  countEl.textContent = MOTION.draw(p, 0, 0.55, 0, 3).toFixed(1);
  countEl.style.fontVariationSettings = `'wdth' ${MOTION.draw(p, 0, 0.6, 62, 125)}`;
  yearsLabel.style.opacity = MOTION.enter(p, 0.3, 0.45);
  tier.style.opacity = MOTION.enter(p, 0.55, 0.7);
}

// ── Scene 3 · Work ───────────────────────────────────────────────────────
// u runs 0 → 5 through the scene: one unit per area, then one to converge.
const sDomains = $('work');
const dot = $('dot');

function renderDomains(W, H, p) {
  const u = clamp(p, 0, 1) * 5;
  const c = 4;
  const stack = MOTION.draw(u, c - 0.15, c + 0.35);
  const collapse = MOTION.draw(u, c + 0.4, c + 0.8);
  const fadeOut = 1 - MOTION.enter(u, c + 0.75, c + 0.9);
  const base = clamp(W * 0.088, 40, 170);
  doms.forEach((d, i) => {
    const s = i;
    const inn = MOTION.pop(u, s, s + 0.3);
    const wd = MOTION.enter(u, s, s + 0.7, 62, 100);
    const outUp = i < 3 ? MOTION.enter(u, s + 0.85, s + 1.1) : 0;
    const soloY = H / 2 + (1 - inn) * H * 0.18 - outUp * H * 0.24;
    const stackY = H * (0.27 + i * 0.157);
    const y = stack > 0 ? stackY * stack + (i === 3 ? soloY : H / 2) * (1 - stack) : soloY;
    const op = u < c - 0.15 ? clamp(inn * 3, 0, 1) * (1 - outUp) : (i === 3 ? 1 : MOTION.enter(u, c, c + 0.3));
    const cy = y + (H / 2 - y) * collapse;
    d.box.style.transform = `translate(-50%, calc(-50% + ${cy - H / 2}px)) scale(${1 - collapse * 0.96})`;
    d.box.style.opacity = op * fadeOut;
    d.idx.style.opacity = 1 - stack;
    d.idx.style.maxHeight = (1 - stack) * 60 + 'px';
    d.word.style.fontSize = base * (1 - 0.59 * stack) + 'px';
    d.word.style.fontVariationSettings = `'wdth' ${stack ? 100 : wd}`;
    d.bar.style.width = W * 0.73 * MOTION.draw(u, s + 0.1, s + 0.5) * (1 - stack) + 'px';
    d.bar.style.opacity = 1 - stack;
    d.desc.style.opacity = MOTION.enter(u, s + 0.3, s + 0.55) * (1 - stack);
    d.desc.style.maxHeight = (1 - stack) * 200 + 'px';
  });
  dot.style.transform = `scale(${MOTION.pop(u, c + 0.7, c + 0.95)})`;
}

// ── Scene 4 · Close ──────────────────────────────────────────────────────
const sClose = document.querySelector('.s-close');
const closeLine = $('close-line');
const closeFoot = $('close-foot');

function renderClose(H) {
  const r = sClose.getBoundingClientRect();
  const q = clamp((H - r.top) / (H * 0.8), 0, 1);
  closeLine.style.width = MOTION.draw(q, 0.2, 0.55) * 100 + '%';
  closeWords.forEach((w, i) => {
    const s = 0.1 + i * 0.1;
    const k = MOTION.pop(q, s, s + 0.2);
    w.style.opacity = clamp(k * 2, 0, 1);
    w.style.transform = `translateY(${(1 - k) * 80}px)`;
    w.style.fontVariationSettings = `'wdth' ${MOTION.enter(q, s, s + 0.7, 95, 72)}`;
  });
  closeFoot.style.opacity = MOTION.enter(q, 0.55, 0.8);
}

// ── Bio: words light up as it scrolls through ────────────────────────────
function renderBio(H) {
  const r = bio.getBoundingClientRect();
  const p = clamp((H * 0.85 - r.top) / (r.height + H * 0.35), 0, 1);
  const lit = Math.round(p * bioWords.length * 1.15);
  bioWords.forEach((w, i) => {
    const color = i < lit ? (w.accent ? LIME : PAPER) : '';
    if (w.s.style.color !== color) w.s.style.color = color;
  });
}

// ── Frame loop: every scene is a pure function of scroll (and load time) ─
const near = (el, H) => { const r = el.getBoundingClientRect(); return r.bottom > -H && r.top < 2 * H; };

function frame(now) {
  const t = (now - t0) / 1000;
  const W = window.innerWidth, H = yearsStick.clientHeight || window.innerHeight;
  if (near(sPrompt, H)) {
    drawField(t);
    renderPrompt(t, W, H, clamp(sceneProgress(sPrompt, H), 0, 1));
  }
  if (near(sYears, H)) renderYears(H, sceneProgress(sYears, H));
  renderBio(H);
  if (near(sDomains, H)) renderDomains(W, H, sceneProgress(sDomains, H));
  if (near(sClose, H)) renderClose(H);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ── Contact ──────────────────────────────────────────────────────────────
// No backend: sending opens the visitor's mail app with the note prefilled.
const form = $('contact-form');
const input = $('msg');
const line = form.querySelector('.contact-line');
const hint = $('hint');
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
  $('sent').hidden = false;
});
})();
