# Akshat Gada — portfolio

A personal, interactive portfolio for Akshat Gada — developer relations engineer at Polygon,
building agentic payments. Dark and cinematic, with Polygon's visual DNA (PolySans type,
`#6700E5` purple, the chamfered "cut-corner") used as Akshat's aesthetic — the site is about
him, not about Polygon.

**Concept — "Operator":** the site behaves like the console of someone building the
machine-payable web.

**Signature:** a self-running terminal in the hero. It types out commands on its own and
narrates Akshat — `whoami`, `cat focus.txt`, `ls projects/`, `pay --x402` (a live
`GET → 402 → signed payment → 200 OK` handshake), `cat pip-82`, `echo $MISSION` — then loops.
No input, no page navigation; it's an ambient, slow-typing console.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Plain HTML/CSS/JS, no build step, no external dependencies (works offline).

## Interactions

All hand-rolled in vanilla JS, GPU-friendly (transform/opacity), and fully
`prefers-reduced-motion` safe; content is readable with JavaScript disabled.

- Self-running terminal hero (slow-typing loop that narrates Akshat)
- Text-scramble decode on the name at load
- Magnetic buttons/links + a cursor-following hero spotlight (native cursor kept)
- Selected work as a hover-reveal list with a synced, tilting preview panel
- Animated **pixel-art journey panel** beside the About copy: square pixels dissolve
  through a six-scene story — chemistry lab → badminton → coding → graduation → first
  company → agentic payments at Polygon — with a synced caption and progress dots. Pauses
  offscreen; reduced motion shows the final "now" scene as a static frame.
- Infinite stack marquee of the tools Akshat works with
- Site-wide ambient background: a handful (4) of same-size **pixel-art** "agent" bots that
  **peek in from the edges**, patrol with stop-and-go, right-angle, robotic movement (scuttling
  legs, eyes facing travel direction), toss pixel gold coins to each other, then leave — so the
  background is never static or crowded. Flat pixel sprites (no glow), paused when the tab is
  hidden, static under reduced motion.
- Generative "settlement pipeline" canvas (`#focus`): agentic x402 micro-payments stream in as
  chamfered cells, pack into a block being built, which seals (a green sweep) and joins a
  receding onchain block-chain, with a running settled total. Interactive (click injects a
  burst of payments), pauses offscreen, static fallback for reduced motion.
- Scroll progress, staggered scroll reveals, subtle hero parallax, film-grain overlay

## Structure

```
index.html            markup + copy
styles.css            dark theme, components, chamfer shape language, responsive + reduced-motion
colors_and_type.css   Polygon design tokens + PolySans @font-face
app.js                all interactions (one shared rAF loop), reduced-motion + no-JS safe
fonts/                PolySans woff2 (display / body / mono)
assets/               Polygon logos + marks (PNG)
icons/{purple,grey}/  Polygon outline icons
```

## Content notes (confirm / customize)

Everything is from verified public sources or your brief — no fabricated facts.

- **Email** isn't shown (the exact address wasn't verifiable). Add a `mailto:` in the contact
  section of `index.html` if you want one.
- Links wired up: X (`@gada_akshat`), GitHub (`AkshatGada`), LinkedIn, the YouTube talk, and the
  five projects (Agent CLI, x402-rs, agent docs, Agentic Services, AgentConnect).
- Selected work includes PIP-82 (links to the Polygon forum). Experience section covers
  Polygon, Ethereum Protocol Fellowship, Witness Chain, JP Morgan, and BOBDAO. Talks: Polygon
  Tracks 101.
- Tune any wording (role title, the internship line, the playful "nap" copy) in `index.html`.

## Deploy

Static hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages) or Railway — serve the folder
as static files. Keep `fonts/`, `assets/`, `icons/`, and both CSS files alongside `index.html`.
