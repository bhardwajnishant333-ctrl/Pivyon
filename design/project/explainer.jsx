(() => {
const { CompositionStage, useComposition, Easing, animate, clamp } = window;
const LIME = '#c8ff3e', INK = '#0b0b0d', PAPER = '#f2f1ec', GREY = '#8d8c86';
const MONO = "'JetBrains Mono', monospace", DISP = "'Archivo', sans-serif";

const MOTION = {
  enter: (T, a, b, from = 0, to = 1) => animate({ from, to, start: a, end: b, ease: Easing.easeOutCubic })(T),
  draw: (T, a, b, from = 0, to = 1) => animate({ from, to, start: a, end: b, ease: Easing.easeInOutQuart })(T),
  pop: (T, a, b, from = 0, to = 1) => animate({ from, to, start: a, end: b, ease: Easing.easeOutBack })(T),
};

function Field() {
  const { T } = useComposition();
  const dots = [];
  for (let y = 0; y < 14; y++) for (let x = 0; x < 25; x++) {
    const ph = Math.sin(x * 0.5 + T * 0.9) * Math.cos(y * 0.6 - T * 0.7);
    dots.push(<div key={x + '-' + y} style={{ position: 'absolute', left: 40 + x * 76, top: 40 + y * 76, width: 3, height: 3, background: PAPER, opacity: 0.06 + Math.max(0, ph) * 0.12 }} />);
  }
  const drift = T * 6;
  return <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-(drift % 76)}px)` }}>{dots}</div>;
}

function Prompt() {
  const { T, CUES } = useComposition();
  const text = 'what if it could be better?';
  const n = Math.floor(clamp(MOTION.enter(T, 0.5, 2.6, 0, text.length), 0, text.length));
  const move = MOTION.draw(T, CUES.Years - 0.2, CUES.Years + 0.6);
  const out = MOTION.enter(T, CUES.Domains - 0.3, CUES.Domains + 0.2);
  const cursorOn = Math.floor(T * 2.4) % 2 === 0 || (T > 0.5 && T < 2.6);
  return (
    <div style={{ position: 'absolute', left: 960 - 760 * move, top: 540 - 430 * move, transform: `translate(${-50 * (1 - move)}%, -50%) scale(${1 - 0.55 * move})`, transformOrigin: 'left center', opacity: MOTION.enter(T, 0.1, 0.5) * (1 - out), font: `500 64px ${MONO}`, color: PAPER, whiteSpace: 'nowrap' }}>
      <span style={{ color: LIME }}>&gt; </span>{text.slice(0, n)}<span style={{ display: 'inline-block', width: 36, height: 64, marginLeft: 6, verticalAlign: -10, background: LIME, opacity: cursorOn ? 1 : 0 }} />
    </div>
  );
}

function Years() {
  const { T, CUES } = useComposition();
  const a = CUES.Years, b = CUES.Domains;
  const lines = ['summarise 40 papers on agent memory', 'design an eval for tool use', 'automate the weekly report pipeline', 'prototype a voice interface', 'stress-test the reasoning chain', 'map failure modes in long context', 'generate UI from a sketch', 'compare model outputs at scale', 'draft a research plan', 'build a self-checking workflow'];
  const vis = MOTION.enter(T, a + 0.2, a + 0.8) * (1 - MOTION.enter(T, b - 0.4, b + 0.1));
  const scroll = (T - a) * 140;
  const count = MOTION.draw(T, a + 0.4, a + 2.6, 0, 3);
  const w = MOTION.draw(T, a + 0.4, a + 2.8, 62, 125);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: vis }}>
      <div style={{ position: 'absolute', right: 120, top: 0, bottom: 0, width: 760, overflow: 'hidden', maskImage: 'linear-gradient(transparent, #000 25%, #000 75%, transparent)', WebkitMaskImage: 'linear-gradient(transparent, #000 25%, #000 75%, transparent)' }}>
        <div style={{ transform: `translateY(${800 - scroll}px)`, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[...lines, ...lines].map((l, i) => <div key={i} style={{ font: `400 28px ${MONO}`, color: i % 4 === 1 ? LIME : GREY }}>&gt; {l}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ font: `800 400px/0.82 ${DISP}`, fontVariationSettings: `'wdth' ${w}`, color: PAPER, letterSpacing: '-0.02em' }}>{count.toFixed(1)}</div>
        <div style={{ font: `800 72px ${DISP}`, fontVariationSettings: `'wdth' 80`, textTransform: 'uppercase', color: LIME, opacity: MOTION.enter(T, a + 1.4, a + 2) }}>years in advanced AI</div>
      </div>
    </div>
  );
}

const DOMAINS = ['AI research', 'Intelligent automation', 'Interactive technologies', 'Next-gen applications'];

function Domains() {
  const { T, CUES } = useComposition();
  const a = CUES.Domains, step = (CUES.Converge - a) / 4, c = CUES.Converge;
  const collapse = MOTION.draw(T, c + 0.8, c + 2.4);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {DOMAINS.map((d, i) => {
        const s = a + i * step;
        const inn = MOTION.pop(T, s, s + 0.5);
        const wd = MOTION.enter(T, s, s + 1.2, 62, 100);
        const outUp = i < 3 ? MOTION.enter(T, s + step - 0.25, s + step + 0.25) : 0;
        const stack = MOTION.draw(T, c - 0.2, c + 0.7);
        const soloY = 540 + (1 - inn) * 200 - outUp * 260;
        const stackY = 290 + i * 170;
        const y = stack > 0 ? stackY * stack + (i === 3 ? soloY : 540) * (1 - stack) : soloY;
        const solo = T < c - 0.2;
        const op = solo ? clamp(inn * 3, 0, 1) * (1 - outUp) : (i === 3 ? 1 : MOTION.enter(T, c + 0.2, c + 0.7));
        const size = 170 - 100 * stack;
        const cy = y + (540 - y) * collapse;
        const bar = MOTION.draw(T, s + 0.15, s + 0.9);
        return (
          <div key={d} style={{ position: 'absolute', left: 960, top: cy, transform: `translate(-50%,-50%) scale(${1 - collapse * 0.96})`, opacity: op * (1 - MOTION.enter(T, c + 2.2, c + 2.6)), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ font: `500 28px ${MONO}`, color: LIME, opacity: 1 - stack }}>0{i + 1} / 04</div>
            <div style={{ font: `800 ${size}px/0.9 ${DISP}`, fontVariationSettings: `'wdth' ${stack ? 100 : wd}`, textTransform: 'uppercase', color: PAPER, letterSpacing: '-0.02em', maxWidth: 1700, textAlign: 'center' }}>{d}</div>
            <div style={{ height: 10, width: 1400 * bar * (1 - stack), background: LIME }} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 960, top: 540, width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: '50%', background: LIME, transform: `scale(${MOTION.pop(T, c + 2.1, c + 2.7)})` }} />
    </div>
  );
}

function Close() {
  const { T, CUES, authoredTotal } = useComposition();
  const a = CUES.Close, end = authoredTotal;
  const line = MOTION.draw(T, a, a + 0.8);
  const words = ['Make', 'things', 'better.'];
  const fade = 1 - MOTION.enter(T, end - 0.7, end - 0.05);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
      <div style={{ position: 'absolute', left: 960 - 840 * line, width: 1680 * line, top: 735, height: 6, background: LIME, opacity: T >= a ? 1 : 0 }} />
      <div style={{ position: 'absolute', left: 120, right: 120, top: 260, display: 'flex', gap: 40, alignItems: 'flex-end' }}>
        {words.map((w, i) => {
          const s = a + 0.5 + i * 0.35;
          const k = MOTION.pop(T, s, s + 0.6);
          const wd = MOTION.enter(T, s, s + 2.6, 95, 72);
          return <div key={w} style={{ font: `800 160px/0.85 ${DISP}`, fontVariationSettings: `'wdth' ${wd}`, textTransform: 'uppercase', color: i === 2 ? LIME : PAPER, opacity: clamp(k * 2, 0, 1), transform: `translateY(${(1 - k) * 120}px)`, letterSpacing: '-0.02em' }}>{w}</div>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 780, display: 'flex', justifyContent: 'space-between', font: `500 32px ${MONO}`, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: MOTION.enter(T, a + 1.8, a + 2.4) }}>
        <span style={{ color: PAPER }}>Your Name</span><span style={{ color: GREY }}>AI · automation · future tech</span>
      </div>
    </div>
  );
}

function Piece() {
  const { T } = useComposition();
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, background: INK, overflow: 'hidden' }}>
      <Field /><Prompt /><Years /><Domains /><Close />
    </div>
  );
}

window.Explainer = function Explainer() {
  return <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={INK}><Piece /></CompositionStage>;
};
})();
