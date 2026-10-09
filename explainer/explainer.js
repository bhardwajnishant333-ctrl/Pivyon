// Explainer video — 1920×1080, 23.5s, looping.
// Every visible property is a pure function of the authored time T, so any
// frame can be seeked and rendered deterministically.
(() => {
'use strict';

// ── Config ────────────────────────────────────────────────────────────────
// Scene list: names, order and playback lengths. CUES are derived from it.
const SCENES = [
  { name: 'Prompt', dur: 3.5, desc: 'A cursor types a question on black' },
  { name: 'Years', dur: 4, desc: 'The prompt docks top-left; a counter runs to 3 years over streaming prompts' },
  { name: 'Domains', dur: 7, desc: 'Four work areas slam in one at a time, widening' },
  { name: 'Converge', dur: 4, desc: 'The four areas stack, then collapse into one lime dot' },
  { name: 'Close', dur: 5, desc: 'The dot becomes a line; Make things better lands with the name' },
];
const PLAYBACK = { mode: 'loop' };
const NAME = new URLSearchParams(location.search).get('name') || 'Pivyon';
const TAGLINE = 'AI · automation · future tech';

const W = 1920, H = 1080;
const LIME = '#c8ff3e', INK = '#0b0b0d', PAPER = '#f2f1ec', GREY = '#8d8c86';
const MONO = "'JetBrains Mono', monospace", DISP = "'Archivo', sans-serif";

// ── Motion ────────────────────────────────────────────────────────────────
const Easing = {
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const tween = (ease) => (T, start, end, from = 0, to = 1) => {
  if (T <= start) return from;
  if (T >= end) return to;
  return from + (to - from) * ease((T - start) / (end - start));
};
const MOTION = {
  enter: tween(Easing.easeOutCubic),
  draw: tween(Easing.easeInOutQuart),
  pop: tween(Easing.easeOutBack),
};

// ── Timeline ──────────────────────────────────────────────────────────────
// Each scene may carry `nat` (its authored length) when its playback `dur`
// has been retimed; the authored slice is then replayed over the new length.
function derive(scenes) {
  let playStart = 0, authStart = 0;
  const sections = [], cues = {};
  for (const s of scenes) {
    const nat = s.nat > 0 ? s.nat : s.dur;
    sections.push({ playStart, dur: s.dur, authStart, nat });
    if (!(s.name in cues)) cues[s.name] = Math.round(authStart * 1000) / 1000;
    playStart += s.dur;
    authStart += nat;
  }
  return { sections, cues, total: Math.round(playStart * 1000) / 1000, authoredTotal: Math.round(authStart * 1000) / 1000 };
}
function warp(d, t) {
  const ss = d.sections;
  let s = ss[ss.length - 1];
  for (const x of ss) if (t < x.playStart + x.dur) { s = x; break; }
  const local = clamp(t - s.playStart, 0, s.dur);
  return Math.min(s.authStart + (s.dur > 0 ? local * (s.nat / s.dur) : 0), d.authoredTotal);
}
const TL = derive(SCENES);
const CUES = TL.cues;

// ── DOM helpers ───────────────────────────────────────────────────────────
function el(parent, style, text) {
  const n = document.createElement('div');
  Object.assign(n.style, style);
  if (text != null) n.textContent = text;
  parent.appendChild(n);
  return n;
}
const ABS_FILL = { position: 'absolute', left: '0', top: '0', right: '0', bottom: '0' };

// ── Scenes ────────────────────────────────────────────────────────────────
function Field(root) {
  const wrap = el(root, ABS_FILL);
  const dots = [];
  for (let y = 0; y < 14; y++) for (let x = 0; x < 25; x++) {
    dots.push({ x, y, n: el(wrap, { position: 'absolute', left: 40 + x * 76 + 'px', top: 40 + y * 76 + 'px', width: '3px', height: '3px', background: PAPER }) });
  }
  return (T) => {
    for (const d of dots) {
      const ph = Math.sin(d.x * 0.5 + T * 0.9) * Math.cos(d.y * 0.6 - T * 0.7);
      d.n.style.opacity = 0.06 + Math.max(0, ph) * 0.12;
    }
    wrap.style.transform = `translateY(${-((T * 6) % 76)}px)`;
  };
}

function Prompt(root) {
  const text = 'what if it could be better?';
  const box = el(root, { position: 'absolute', transformOrigin: 'left center', font: `500 64px ${MONO}`, color: PAPER, whiteSpace: 'nowrap' });
  const caret = document.createElement('span'); caret.style.color = LIME; caret.textContent = '> ';
  const typed = document.createElement('span');
  const cursor = document.createElement('span');
  Object.assign(cursor.style, { display: 'inline-block', width: '36px', height: '64px', marginLeft: '6px', verticalAlign: '-10px', background: LIME });
  box.append(caret, typed, cursor);
  return (T) => {
    const n = Math.floor(clamp(MOTION.enter(T, 0.5, 2.6, 0, text.length), 0, text.length));
    const move = MOTION.draw(T, CUES.Years - 0.2, CUES.Years + 0.6);
    const out = MOTION.enter(T, CUES.Domains - 0.3, CUES.Domains + 0.2);
    const cursorOn = Math.floor(T * 2.4) % 2 === 0 || (T > 0.5 && T < 2.6);
    box.style.left = 960 - 760 * move + 'px';
    box.style.top = 540 - 430 * move + 'px';
    box.style.transform = `translate(${-50 * (1 - move)}%, -50%) scale(${1 - 0.55 * move})`;
    box.style.opacity = MOTION.enter(T, 0.1, 0.5) * (1 - out);
    typed.textContent = text.slice(0, n);
    cursor.style.opacity = cursorOn ? 1 : 0;
  };
}

function Years(root) {
  const lines = ['summarise 40 papers on agent memory', 'design an eval for tool use', 'automate the weekly report pipeline', 'prototype a voice interface', 'stress-test the reasoning chain', 'map failure modes in long context', 'generate UI from a sketch', 'compare model outputs at scale', 'draft a research plan', 'build a self-checking workflow'];
  const wrap = el(root, ABS_FILL);
  const mask = 'linear-gradient(transparent, #000 25%, #000 75%, transparent)';
  const feed = el(wrap, { position: 'absolute', right: '120px', top: '0', bottom: '0', width: '760px', overflow: 'hidden', maskImage: mask, webkitMaskImage: mask });
  const list = el(feed, { display: 'flex', flexDirection: 'column', gap: '28px' });
  [...lines, ...lines].forEach((l, i) => el(list, { font: `400 28px ${MONO}`, color: i % 4 === 1 ? LIME : GREY }, '> ' + l));
  const col = el(wrap, { position: 'absolute', left: '120px', top: '300px', display: 'flex', flexDirection: 'column', gap: '16px' });
  const num = el(col, { font: `800 400px/0.82 ${DISP}`, color: PAPER, letterSpacing: '-0.02em' });
  const label = el(col, { font: `800 72px ${DISP}`, fontVariationSettings: "'wdth' 80", textTransform: 'uppercase', color: LIME }, 'years in advanced AI');
  return (T) => {
    const a = CUES.Years, b = CUES.Domains;
    wrap.style.opacity = MOTION.enter(T, a + 0.2, a + 0.8) * (1 - MOTION.enter(T, b - 0.4, b + 0.1));
    list.style.transform = `translateY(${800 - (T - a) * 140}px)`;
    num.textContent = MOTION.draw(T, a + 0.4, a + 2.6, 0, 3).toFixed(1);
    num.style.fontVariationSettings = `'wdth' ${MOTION.draw(T, a + 0.4, a + 2.8, 62, 125)}`;
    label.style.opacity = MOTION.enter(T, a + 1.4, a + 2);
  };
}

function Domains(root) {
  const names = ['AI research', 'Intelligent automation', 'Interactive technologies', 'Next-gen applications'];
  const wrap = el(root, ABS_FILL);
  const items = names.map((d, i) => {
    const box = el(wrap, { position: 'absolute', left: '960px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' });
    return {
      box,
      idx: el(box, { font: `500 28px ${MONO}`, color: LIME }, `0${i + 1} / 04`),
      word: el(box, { textTransform: 'uppercase', color: PAPER, letterSpacing: '-0.02em', maxWidth: '1700px', textAlign: 'center' }, d),
      bar: el(box, { height: '10px', background: LIME }),
    };
  });
  const dot = el(wrap, { position: 'absolute', left: '960px', top: '540px', width: '40px', height: '40px', marginLeft: '-20px', marginTop: '-20px', borderRadius: '50%', background: LIME });
  return (T) => {
    const a = CUES.Domains, c = CUES.Converge, step = (c - a) / 4;
    const collapse = MOTION.draw(T, c + 0.8, c + 2.4);
    const stack = MOTION.draw(T, c - 0.2, c + 0.7);
    const fadeOut = 1 - MOTION.enter(T, c + 2.2, c + 2.6);
    items.forEach((it, i) => {
      const s = a + i * step;
      const inn = MOTION.pop(T, s, s + 0.5);
      const wd = MOTION.enter(T, s, s + 1.2, 62, 100);
      const outUp = i < 3 ? MOTION.enter(T, s + step - 0.25, s + step + 0.25) : 0;
      const soloY = 540 + (1 - inn) * 200 - outUp * 260;
      const stackY = 290 + i * 170;
      const y = stack > 0 ? stackY * stack + (i === 3 ? soloY : 540) * (1 - stack) : soloY;
      const op = T < c - 0.2 ? clamp(inn * 3, 0, 1) * (1 - outUp) : (i === 3 ? 1 : MOTION.enter(T, c + 0.2, c + 0.7));
      it.box.style.top = y + (540 - y) * collapse + 'px';
      it.box.style.transform = `translate(-50%,-50%) scale(${1 - collapse * 0.96})`;
      it.box.style.opacity = op * fadeOut;
      it.idx.style.opacity = 1 - stack;
      it.word.style.font = `800 ${170 - 100 * stack}px/0.9 ${DISP}`;
      it.word.style.fontVariationSettings = `'wdth' ${stack ? 100 : wd}`;
      it.bar.style.width = 1400 * MOTION.draw(T, s + 0.15, s + 0.9) * (1 - stack) + 'px';
    });
    dot.style.transform = `scale(${MOTION.pop(T, c + 2.1, c + 2.7)})`;
  };
}

function Close(root) {
  const wrap = el(root, ABS_FILL);
  const line = el(wrap, { position: 'absolute', top: '735px', height: '6px', background: LIME });
  const row = el(wrap, { position: 'absolute', left: '120px', right: '120px', top: '260px', display: 'flex', gap: '40px', alignItems: 'flex-end' });
  const words = ['Make', 'things', 'better.'].map((w, i) => el(row, { font: `800 160px/0.85 ${DISP}`, textTransform: 'uppercase', color: i === 2 ? LIME : PAPER, letterSpacing: '-0.02em' }, w));
  const foot = el(wrap, { position: 'absolute', left: '120px', right: '120px', top: '780px', display: 'flex', justifyContent: 'space-between', font: `500 32px ${MONO}`, textTransform: 'uppercase', letterSpacing: '0.06em' });
  el(foot, { color: PAPER }, NAME);
  el(foot, { color: GREY }, TAGLINE);
  return (T) => {
    const a = CUES.Close, end = TL.authoredTotal;
    const l = MOTION.draw(T, a, a + 0.8);
    wrap.style.opacity = 1 - MOTION.enter(T, end - 0.7, end - 0.05);
    line.style.left = 960 - 840 * l + 'px';
    line.style.width = 1680 * l + 'px';
    line.style.opacity = T >= a ? 1 : 0;
    words.forEach((w, i) => {
      const s = a + 0.5 + i * 0.35;
      const k = MOTION.pop(T, s, s + 0.6);
      w.style.fontVariationSettings = `'wdth' ${MOTION.enter(T, s, s + 2.6, 95, 72)}`;
      w.style.opacity = clamp(k * 2, 0, 1);
      w.style.transform = `translateY(${(1 - k) * 120}px)`;
    });
    foot.style.opacity = MOTION.enter(T, a + 1.8, a + 2.4);
  };
}

// ── Stage + player ────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
Object.assign(canvas.style, { width: W + 'px', height: H + 'px', background: INK });
const renderers = [Field, Prompt, Years, Domains, Close].map((f) => f(canvas));
function render(t) {
  const T = warp(TL, t);
  for (const r of renderers) r(T);
}

const area = document.getElementById('area');
function fit() {
  const s = Math.max(0.05, Math.min(area.clientWidth / W, area.clientHeight / H));
  canvas.style.transform = `scale(${s})`;
}
new ResizeObserver(fit).observe(area);
fit();

const duration = TL.total;
const playBtn = document.getElementById('play');
const resetBtn = document.getElementById('reset');
const track = document.getElementById('track');
const fill = document.getElementById('fill');
const knob = document.getElementById('knob');
const curEl = document.getElementById('cur');
document.getElementById('dur').textContent = fmt(duration);

let time = 0, hover = null, playing = true, last = null, dragging = false;

function fmt(t) {
  t = Math.max(0, t);
  const s = Math.floor(t % 60), cs = Math.floor((t * 100) % 100);
  return `${Math.floor(t / 60)}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}
function paint() {
  const t = hover != null ? hover : time;
  render(t);
  const pct = (t / duration) * 100 + '%';
  fill.style.width = pct;
  knob.style.left = pct;
  curEl.textContent = fmt(t);
  playBtn.classList.toggle('playing', playing);
}
function setPlaying(p) { playing = p; last = null; paint(); }
function seek(t) { time = clamp(t, 0, duration); paint(); }

function tick(ts) {
  if (playing) {
    if (last != null) {
      let next = time + (ts - last) / 1000;
      if (next >= duration) {
        if (PLAYBACK.mode === 'loop') next %= duration;
        else { next = duration; playing = false; }
      }
      time = next;
    }
    last = ts;
    paint();
  }
  requestAnimationFrame(tick);
}

playBtn.onclick = () => setPlaying(!playing);
resetBtn.onclick = () => seek(0);
const timeAt = (e) => { const r = track.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * duration; };
track.addEventListener('pointerdown', (e) => { dragging = true; hover = null; track.setPointerCapture(e.pointerId); seek(timeAt(e)); });
track.addEventListener('pointermove', (e) => { if (dragging) seek(timeAt(e)); else if (e.pointerType === 'mouse') { hover = timeAt(e); paint(); } });
track.addEventListener('pointerup', () => { dragging = false; });
track.addEventListener('pointerleave', () => { if (!dragging) { hover = null; paint(); } });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
  else if (e.code === 'ArrowLeft') seek(time - (e.shiftKey ? 1 : 0.1));
  else if (e.code === 'ArrowRight') seek(time + (e.shiftKey ? 1 : 0.1));
  else if (e.key === '0' || e.code === 'Home') seek(0);
});

// Deterministic seek hook for frame-by-frame capture: explainer.seek(seconds).
window.explainer = { duration, seek: (t) => { setPlaying(false); seek(t); }, render };

document.fonts.ready.then(paint);
paint();
requestAnimationFrame(tick);
})();
