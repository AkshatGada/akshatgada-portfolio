# Akshat Gada — portfolio

A personal, interactive portfolio for Akshat Gada — developer relations engineer at Polygon,
building agentic payments. Dark and cinematic, with Polygon's visual DNA (PolySans type,
`#6700E5` purple, the chamfered "cut-corner") used as Akshat's aesthetic — the site is about
him, not about Polygon.

**Concept — "Operator":** the site behaves like the console of someone building the
machine-payable web.

**Signature:** an interactive terminal in the hero. It boots, and visitors can run real
commands — `whoami`, `work`, `focus`, `pay --x402`, `contact`, `stack`, `help` (try `sudo nap`) —
that print responses and navigate the page. `pay --x402` plays a live
`GET → 402 → signed payment → 200 OK` handshake.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Plain HTML/CSS/JS, no build step, no external dependencies (works offline).

## Interactions

All hand-rolled in vanilla JS, GPU-friendly (transform/opacity), and fully
`prefers-reduced-motion` safe; content is readable with JavaScript disabled.

- Interactive terminal hero (commands navigate + run the x402 handshake)
- Text-scramble decode on the name at load
- Custom blend-mode cursor + magnetic buttons/links
- Selected work as a hover-reveal list with a synced, tilting preview panel
- Word-by-word manifesto reveal, count-up, infinite stack marquee
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
- Featured experiments: PIP-82, E(gg)NS, EggSwap, Polygon Tracks 101.
- Tune any wording (role title, the internship line, the playful "nap" copy) in `index.html`.

## Deploy

Static hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages) or Railway — serve the folder
as static files. Keep `fonts/`, `assets/`, `icons/`, and both CSS files alongside `index.html`.
