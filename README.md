# Pivyon

Exploring the frontiers of artificial intelligence through advanced AI experimentation, intelligent systems architecture, autonomous agents, multimodal AI, automation, and next-generation applications. Focused on transforming ambitious ideas into groundbreaking technologies.

A dark, kinetic site for Pivyon's frontier-AI services — frontier evals, red-teaming, post-training data and RL environments. The hero plays the explainer film live, then rests on a real-time loss landscape; services, findings and engagements are all animated in the browser. Plain HTML, CSS and JavaScript — no build step, no dependencies.

- `index.html`, `styles.css`, `main.js` — the portfolio site
- `explainer/` — the explainer video (1920×1080, looping, with a playback bar)
- `design/` — the original Claude Design handoff (prototypes and chat transcript), kept for reference

## Run locally

Serve the folder with any static server, for example:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000 (site) and http://localhost:8000/explainer/ (video).

## Customise

- Name, email and cursor reactivity: `SITE` at the top of `main.js` (the site plays the video's scenes as you scroll)
- Name in the video's closing frame: `NAME` in `explainer/explainer.js`, or `explainer/?name=Your+Name`
- Video scene lengths: `SCENES` at the top of `explainer/explainer.js`
- Work area copy: `DOMAINS` in `main.js` (the striped boxes are image placeholders)

Video controls: space = play/pause, ← / → = step (shift for 1s), 0 = start.

## Deploy

Any static host works. On GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
