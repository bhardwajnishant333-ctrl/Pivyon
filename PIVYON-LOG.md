# Pivyon — build log & decisions

The permanent record of how Pivyon was built (started 9 Oct 2026). If a chat is ever lost, everything needed to continue is here.

**Original conversation:** https://claude.ai/code/session_01Er8ch1eNWTcg9rijvwfmh2 — titled “⭐ PIVYON — website, Probe, brand (main build)”

---

## Links
| What | Where |
|---|---|
| Live site | https://pivyon.com |
| Probe (product 01) | https://pivyon.com/probe/ |
| Explainer film | https://pivyon.com/explainer/ |
| Code (this repo) | https://github.com/bhardwajnishant333-ctrl/Pivyon |
| Brand kit | [`/brand`](brand/) — logo, X avatar & banner, bios |
| Original design (Claude Design) | https://claude.ai/design/p/88a800fe-f2de-454a-9ee5-de92734720f8 |
| Pages settings | https://github.com/bhardwajnishant333-ctrl/Pivyon/settings/pages |
| Repo secrets (API keys go here) | https://github.com/bhardwajnishant333-ctrl/Pivyon/settings/secrets/actions |

## Company
- **Name:** Pivyon · **Line:** We make frontier models better.
- **Services:** frontier evals · red-teaming · post-training data (SFT, RLHF/DPO, reasoning traces) · RL environments.
- **Offers:** The 72-hour Teardown · Eval Sprint (2 weeks) · Frontier Embed (ongoing).
- **Edge:** three years of daily, adversarial use of frontier models; ranked by ChatGPT in its top 0.5% of users.
- **Voice:** “we”. Confident, never boastful. Never invent clients, results or metrics; label simulations.

## Brand
- Colours: ink `#0b0b0d` · paper `#f2f1ec` · lime `#c8ff3e` · grey `#8d8c86` · hot `#ff5a3c`
- Type: Archivo 800 uppercase (headlines) · JetBrains Mono uppercase (labels)
- Logo: lowercase **p** — paper stem + lime dot (the dot everything converges to in the film).
- X bio: *We make frontier models better. Evals · red-teaming · post-training data · RL environments. Book a 72-hour teardown → hello@pivyon.com*

## Infrastructure (done)
- **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/pages.yml`) — every push to `main` deploys in ~1 min.
- **Domain:** pivyon.com at GoDaddy (1 year — turn on auto-renew + domain lock).
  - DNS: A `@` → 185.199.108.153 (plus .109/.110/.111 recommended) · CNAME `www` → bhardwajnishant333-ctrl.github.io
  - TXT `_github-pages-challenge-bhardwajnishant333-ctrl` — verifies the domain with GitHub
  - TXT `@` google-site-verification — verifies with Google
  - MX `@` → smtp.google.com (priority 1)
- **Email:** hello@pivyon.com on Google Workspace.
- **Still to do:** tick *Enforce HTTPS* in Pages settings once the DNS check is green · 2-factor on GitHub, GoDaddy, Google · pick X handle (@pivyonai first choice) · optional pivyonai.com (Porkbun/Cloudflare, not GoDaddy).

## What the site contains
1. **Opening film** (live in the page): typed prompt → 3.0 years → Evaluate · Break · Post-train · Simulate → converge to the lime dot → “We make frontier models better.” → rests on a live loss landscape. Skip / Replay.
2. **00 Build log — Feature 01 of 10+. Loading.** Probe shipped; Frontier Weather in build; Calibrate, Probe multi-turn, Injection Range in design; four unnamed lab slots; 10+.
3. **01 Why Pivyon** · **02 Approach** (attention arcs) · **03 Services** (4 pinned live visuals) · **04 Field notes** (illustrative findings terminal) · **05 Engagements** · **06 Founder** · **07 Film** · **08 Contact**.

## Product 01 — Pivyon Probe v0.1 (shipped)
In-browser: paste a system prompt + a rule → Lens readiness score (10 checks) → 26 attacks across 11 techniques (.jsonl export) → live run against simulated NaiveBot or the visitor's own model (bring-your-own key, OpenAI-compatible), scored by a canary token + detected secrets. Nothing is sent to Pivyon.

## Roadmap
| # | Feature | Status | Notes |
|---|---|---|---|
| 01 | Probe | Shipped | Next: shareable score cards, multi-turn |
| 02 | Frontier Weather | In build | Needs secrets `OPENAI_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `ANTHROPIC_API_KEY` (set spend caps ~$10–20/mo each). Daily GitHub Action runs sycophancy, over-refusal, injection and drift tests; site renders the results. |
| 03 | Calibrate | In design | “Your AI, calibrated to you in 7 days.” Context engineering (instructions, memory, workspaces, prompt chains) + personal evals with before/after score. |
| 04 | Probe multi-turn | Next | |
| 05 | Injection Range | In design | Public arena; every successful attack becomes a test case. |
| — | Pivyon Probe (full) | Later | Spec → attacks → cross-lab jury → report + DPO pairs; needs a small backend (e.g. Cloudflare Workers). |

When something ships: move it to *Shipped* here and in the build log section of `index.html`, and fill the next segment of the loading bar.

## How to continue
1. Start a new **Claude Code** session and select the repo **bhardwajnishant333-ctrl/Pivyon**.
2. Say: *“Read PIVYON-LOG.md and README.md, then [what you want next].”*
3. Changes pushed to `main` go live on pivyon.com automatically.
