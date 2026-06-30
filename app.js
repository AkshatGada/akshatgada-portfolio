/* ============================================================
   Akshat Gada — portfolio interactions
   Vanilla JS. One shared rAF loop. Reduced-motion + no-JS safe.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- mobile nav ---------------- */
  (function () {
    var toggle = $(".nav-toggle"), menu = $("#nav-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  })();

  /* ---------------- back to top ---------------- */
  var top = $("#to-top");
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------------- reveals (gated; no-JS safe) ---------------- */
  var reveals = $$(".reveal");
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
    window.addEventListener("load", function () {
      setTimeout(function () { reveals.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }); }, 180);
    });
  }

  /* ---------------- page-load orchestration ---------------- */
  function onReady() {
    document.documentElement.classList.add("loaded");
    document.body.classList.add("loaded");
    if (!reduce) startScramble();
    bootTerminal();
  }
  if (document.readyState === "complete") onReady();
  else window.addEventListener("load", onReady);

  /* ---------------- text scramble (hero name) ---------------- */
  var GLYPHS = "!<>-_\\/[]{}=+*^?#________".split("");
  function scrambleEl(el, done) {
    var text = el.getAttribute("data-text") || el.textContent;
    var q = [];
    for (var i = 0; i < text.length; i++) {
      q.push({ from: "", to: text[i], start: Math.floor(Math.random() * 24), end: Math.floor(Math.random() * 24) + 24, ch: null });
    }
    var frame = 0;
    function update() {
      if (el.dataset.done) return;            // resolved (e.g. by the safety net) — stop
      var out = "", complete = 0;
      for (var i = 0; i < q.length; i++) {
        var it = q[i];
        if (frame >= it.end) { complete++; out += it.to; }
        else if (frame >= it.start) {
          if (!it.ch || Math.random() < 0.3) it.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          out += '<span class="dud">' + it.ch + "</span>";
        } else out += it.to === " " ? " " : '<span class="dud">' + (it.to === " " ? " " : "") + "</span>";
      }
      el.innerHTML = out;
      if (complete === q.length) { el.dataset.done = "1"; el.textContent = text; if (done) done(); }
      else { frame++; requestAnimationFrame(update); }
    }
    update();
  }
  function startScramble() {
    var spans = $$(".hero-name .scramble");
    spans.forEach(function (el, i) { setTimeout(function () { scrambleEl(el); }, 220 + i * 130); });
    // safety net: guarantee the name resolves even if rAF is throttled/backgrounded
    setTimeout(function () {
      spans.forEach(function (el) { el.dataset.done = "1"; el.textContent = el.getAttribute("data-text") || el.textContent; });
    }, 2400);
  }

  /* ============================================================
     SHARED rAF LOOP — magnetic elements (native cursor kept)
     ============================================================ */
  var loopItems = [];

  if (finePointer && !reduce) {
    // magnetic
    $$("[data-magnetic]").forEach(function (el) {
      var item = { el: el, tx: 0, ty: 0, cx: 0, cy: 0, hover: false };
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        item.tx = (e.clientX - r.left - r.width / 2) * 0.35;
        item.ty = (e.clientY - r.top - r.height / 2) * 0.35;
        item.hover = true;
      });
      el.addEventListener("mouseleave", function () { item.tx = 0; item.ty = 0; item.hover = false; });
      loopItems.push(item);
    });

    // hero cursor-following spotlight
    var hero = $(".hero");
    if (hero) {
      hero.addEventListener("mousemove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
        hero.style.setProperty("--my", (e.clientY - r.top) + "px");
        hero.classList.add("spot-on");
      });
      hero.addEventListener("mouseleave", function () { hero.classList.remove("spot-on"); });
    }
  }

  /* ---------------- click-to-copy email ---------------- */
  (function () {
    var btn = document.getElementById("email-copy");
    if (!btn) return;
    var state = btn.querySelector(".email-state");
    var orig = state ? state.textContent : "Copy";
    btn.addEventListener("click", function () {
      var email = btn.getAttribute("data-email");
      function done() { btn.classList.add("copied"); if (state) state.textContent = "Copied!"; setTimeout(function () { btn.classList.remove("copied"); if (state) state.textContent = orig; }, 1800); }
      function fallback() {
        var ta = document.createElement("textarea"); ta.value = email; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(email).then(done, fallback);
      else fallback();
    });
  })();

  function frame() {
    for (var i = 0; i < loopItems.length; i++) {
      var it = loopItems[i];
      it.cx = lerp(it.cx, it.tx, 0.18);
      it.cy = lerp(it.cy, it.ty, 0.18);
      it.el.style.transform = Math.abs(it.cx) < 0.05 && Math.abs(it.cy) < 0.05 && !it.hover ? "" : "translate(" + it.cx + "px," + it.cy + "px)";
    }
    requestAnimationFrame(frame);
  }
  if (finePointer && !reduce && loopItems.length) requestAnimationFrame(frame);

  /* ---------------- tilt ---------------- */
  if (finePointer && !reduce) {
    $$("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-py * 7) + "deg) rotateY(" + (px * 7) + "deg)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ============================================================
     WORK — hover-reveal list + synced preview panel
     ============================================================ */
  (function () {
    var items = $$(".work-item");
    var panel = $("#work-preview");
    if (!items.length) return;
    var elIcon = $("#wp-icon"), elKind = $("#wp-kind"), elYear = $("#wp-year"),
        elName = $("#wp-name"), elDesc = $("#wp-desc"), elTech = $("#wp-tech"), inner = $(".wp-inner"), active = null;

    function fill(item) {
      if (panel) {
        elIcon.src = item.dataset.icon || "";
        elKind.textContent = item.dataset.kind || "";
        elYear.textContent = item.dataset.year || "";
        elName.textContent = item.querySelector(".work-name").textContent;
        elDesc.textContent = item.querySelector(".work-desc").textContent;
        elTech.innerHTML = "";
        $$(".work-tech i", item).forEach(function (t) { var li = document.createElement("li"); li.textContent = t.textContent; elTech.appendChild(li); });
      }
    }
    function select(item) {
      if (item === active) return;
      items.forEach(function (x) { x.classList.remove("is-active"); });
      item.classList.add("is-active");
      active = item;
      if (panel && inner && !reduce) {
        inner.classList.add("swap");
        setTimeout(function () { fill(item); inner.classList.remove("swap"); }, 130);
      } else { fill(item); }
    }
    items.forEach(function (item) {
      item.addEventListener("mouseenter", function () { select(item); });
      item.addEventListener("focusin", function () { select(item); });
    });
    // panel click opens active project
    if (panel) panel.addEventListener("click", function () { if (active) window.open(active.href, "_blank", "noopener"); });
    // init
    fill(items[0]); active = items[0];
  })();

  /* ============================================================
     COUNT-UP
     ============================================================ */
  (function () {
    var els = $$(".count");
    if (!els.length || reduce || !("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseFloat(el.dataset.count) || 0, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
        var t0 = null, dur = 1400, ease = function (t) { return 1 - Math.pow(1 - t, 5); };
        function step(now) {
          if (!t0) t0 = now;
          var p = Math.min((now - t0) / dur, 1);
          el.textContent = pre + Math.floor(ease(p) * target) + suf;
          if (p < 1) requestAnimationFrame(step); else el.textContent = pre + target + suf;
        }
        requestAnimationFrame(step); obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { obs.observe(el); });
  })();

  /* ============================================================
     SCROLL PROGRESS + subtle hero parallax
     ============================================================ */
  (function () {
    var bar = $(".progress"), name = $(".hero-name"), glow = $(".hero-glow");
    var ticking = false;
    function paint() {
      var d = document.documentElement;
      var p = d.scrollTop / (d.scrollHeight - d.clientHeight || 1);
      if (bar) bar.style.transform = "scaleX(" + clamp(p, 0, 1) + ")";
      if (!reduce) {
        var y = d.scrollTop;
        if (name) name.style.transform = "translate3d(0," + (y * 0.12) + "px,0)";
        if (glow) glow.style.transform = "translate3d(0," + (y * 0.05) + "px,0)";
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(paint); ticking = true; } }, { passive: true });
    paint();
  })();

  /* ============================================================
     TERMINAL
     ============================================================ */
  /* ============================================================
     AMBIENT BACKGROUND — agent mascots floating, passing coins
     A site-wide fixed canvas behind all content: cute "agent"
     octopus-bots drift around and toss glowing $ coins to each
     other (agents paying agents). Subtle, motion-safe, paused
     when the tab is hidden.
     ============================================================ */
  (function () {
    var canvas = document.getElementById("bgfx");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, DPR = 1, agents = [], coins = [], sparks = [], running = false, raf = 0, t0 = 0, lastCoin = 0;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function cl(v, a, b) { return v < a ? a : (v > b ? b : v); }

    // ── pixel-art sprites (no glow, flat colors) ──
    var A_PAL = { P: "#7c4dff", D: "#4a2596", W: "#f2ecff", K: "#1a0f33", L: "#c9b3ff" };
    // head only (11x9); pupils, blink and tentacles are drawn procedurally so they animate
    var A_HEAD = [
      ".....L.....",
      ".....P.....",
      "...PPPPP...",
      "..PPPPPPP..",
      ".PPPPPPPPP.",
      ".PWWPPPWWP.",
      ".PWWPPPWWP.",
      ".PPPPPPPPP.",
      "..DPPPPPD.."
    ];
    var C_PAL = { Y: "#f5c542", y: "#c2901a", w: "#ffe9a8" };
    var C_FULL = ["..yyy..", ".yYYYy.", "yYwwYYy", "yYYYYYy", "yYYYYYy", ".yYYYy.", "..yyy.."];
    var C_MID = [".yyy.", "yYYYy", "yYwYy", "yYYYy", "yYYYy", "yYYYy", ".yyy."];
    var C_EDGE = [".y.", "yYy", "yYy", "yYy", "yYy", "yYy", ".y."];

    function drawSprite(spr, pal, ox, oy, px, alpha) {
      ctx.globalAlpha = alpha;
      for (var r = 0; r < spr.length; r++) {
        var row = spr[r];
        for (var c = 0; c < row.length; c++) {
          var ch = row.charAt(c); if (ch === ".") continue;
          ctx.fillStyle = pal[ch];
          ctx.fillRect(Math.floor(ox + c * px), Math.floor(oy + r * px), px + 1, px + 1);
        }
      }
      ctx.globalAlpha = 1;
    }
    function pxFill(ox, oy, px, col, row, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.floor(ox + col * px), Math.floor(oy + row * px), w * px + 1, h * px + 1); }

    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
    var SIZE = 46, ALPHA = 0.72, SPD = 1.0, PAD = 72, QTR = Math.PI / 2;
    function makeAgents() {
      var n = W < 520 ? 3 : 4;                                  // 4 total (3 on tiny screens)
      agents = [];
      for (var i = 0; i < n; i++) {
        agents.push({ state: "wait", timer: rnd(0.4, 4.5), x: -200, y: -200, dir: 0, alpha: 0,
          s: SIZE, t: rnd(0, 10), liveT: 0, phase: "pause", phaseT: 0, moving: false,
          blink: 0, blinkT: rnd(2, 6), give: 0, got: 0 });
      }
    }
    function spawnEdge(a) {
      var e = (Math.random() * 4) | 0;
      if (e === 0) { a.x = rnd(PAD, W - PAD); a.y = -40; a.dir = QTR; }          // top, go down
      else if (e === 1) { a.x = W + 40; a.y = rnd(PAD, H - PAD); a.dir = Math.PI; } // right, go left
      else if (e === 2) { a.x = rnd(PAD, W - PAD); a.y = H + 40; a.dir = -QTR; }  // bottom, go up
      else { a.x = -40; a.y = rnd(PAD, H - PAD); a.dir = 0; }                     // left, go right
      a.state = "enter"; a.alpha = 0; a.liveT = rnd(5, 9); a.phase = "move"; a.phaseT = rnd(0.5, 0.9); a.moving = true;
    }
    function aimEdge(a) {
      var dl = a.x, dr = W - a.x, du = a.y, db = H - a.y, m = Math.min(dl, dr, du, db);
      a.dir = m === dl ? Math.PI : (m === dr ? 0 : (m === du ? -QTR : QTR));
    }
    function botMove(a, dt, k, bounded) {        // stop-and-go, right-angle turns (robotic)
      a.phaseT -= dt;
      if (a.phase === "move") {
        a.moving = true;
        var nx = a.x + Math.cos(a.dir) * SPD * k, ny = a.y + Math.sin(a.dir) * SPD * k;
        if (bounded && (nx < PAD || nx > W - PAD || ny < PAD || ny > H - PAD)) {
          a.dir += (Math.random() < 0.5 ? 1 : -1) * QTR; a.phase = "pause"; a.phaseT = rnd(0.25, 0.5); a.moving = false; return;
        }
        a.x = nx; a.y = ny;
        if (a.phaseT <= 0) { a.phase = "pause"; a.phaseT = rnd(0.22, 0.55); a.moving = false; }
      } else {
        a.moving = false;
        if (a.phaseT <= 0) { if (bounded && Math.random() < 0.55) a.dir += (Math.random() < 0.5 ? 1 : -1) * QTR; a.phase = "move"; a.phaseT = rnd(0.5, 1.0); a.moving = true; }
      }
    }
    function emitCoin() {
      var live = [];
      for (var i = 0; i < agents.length; i++) if (agents[i].state === "active") live.push(agents[i]);
      if (live.length < 2 || coins.length > 3) return;
      var A = live[(Math.random() * live.length) | 0], B = null, bd = 1e9;
      for (var j = 0; j < live.length; j++) { if (live[j] === A) continue; var dx = live[j].x - A.x, dy = live[j].y - A.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; B = live[j]; } }
      if (!B) return;
      coins.push({ A: A, B: B, cx: (A.x + B.x) / 2, cy: (A.y + B.y) / 2 - rnd(50, 100), t: 0, dur: rnd(1.4, 2.1), r: 9, spin: rnd(0, 6.28), alpha: 0 });
      A.give = 1;
    }
    function coinPos(c) { var p0 = cl(c.t / c.dur, 0, 1), p = p0 * p0 * (3 - 2 * p0), u = 1 - p; return { x: u * u * c.A.x + 2 * u * p * c.cx + p * p * c.B.x, y: u * u * c.A.y + 2 * u * p * c.cy + p * p * c.B.y }; }

    function step(dt) {
      var k = dt * 60;
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i]; a.t += dt;
        var tgt = (a.state === "enter" || a.state === "active") ? ALPHA : 0;
        a.alpha += (tgt - a.alpha) * Math.min(1, dt * 4.5);     // fade in / out (peek)
        if (a.state === "wait") {
          a.timer -= dt; if (a.timer <= 0) spawnEdge(a);
        } else if (a.state === "enter") {
          botMove(a, dt, k, false);
          if (a.x > PAD && a.x < W - PAD && a.y > PAD && a.y < H - PAD) a.state = "active";
        } else if (a.state === "active") {
          botMove(a, dt, k, true);
          a.liveT -= dt; if (a.liveT <= 0) { a.state = "leaving"; aimEdge(a); a.phase = "move"; a.phaseT = 3; a.moving = true; }
        } else { // leaving
          botMove(a, dt, k, false);
          if (a.x < -70 || a.x > W + 70 || a.y < -70 || a.y > H + 70 || a.alpha < 0.02) { a.state = "wait"; a.timer = rnd(2.5, 6); }
        }
        a.blinkT -= dt; if (a.blinkT <= 0) { a.blink = 0.13; a.blinkT = rnd(3.5, 8); }
        if (a.blink > 0) a.blink -= dt;
        a.give = Math.max(0, a.give - dt * 1.6); a.got = Math.max(0, a.got - dt * 2.4);
      }
      for (var j = coins.length - 1; j >= 0; j--) {
        var c = coins[j]; c.t += dt; c.spin += dt * 7.5;
        var p = c.t / c.dur; c.alpha = p < 0.12 ? p / 0.12 : (p > 0.88 ? Math.max(0, (1 - p) / 0.12) : 1);
        if (p >= 1) {
          c.B.got = 1;
          for (var n = 0; n < 6; n++) sparks.push({ x: c.B.x, y: c.B.y - 2, vx: rnd(-55, 55), vy: rnd(-75, -18), life: 1 });
          coins.splice(j, 1);
        }
      }
      for (var s = sparks.length - 1; s >= 0; s--) {
        var sp = sparks[s]; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 170 * dt; sp.life -= dt * 2.3;
        if (sp.life <= 0) sparks.splice(s, 1);
      }
    }

    function drawAgent(a) {
      if (a.alpha < 0.02) return;
      var cols = 11, rows = 9;
      var px = Math.max(2, Math.round(a.s / 12));
      var hop = (a.got > 0.4 || a.give > 0.4) ? px : 0;               // small hop on give/catch
      var ox = a.x - (cols * px) / 2, oy = a.y - (rows * px) / 2 - hop;   // no float bob
      var al = a.alpha;
      drawSprite(A_HEAD, A_PAL, ox, oy, px, al);
      ctx.globalAlpha = al;
      if (a.blink > 0) {
        pxFill(ox, oy, px, 2, 5, 2, 2, A_PAL.P); pxFill(ox, oy, px, 7, 5, 2, 2, A_PAL.P);
        pxFill(ox, oy, px, 2, 6, 2, 1, A_PAL.K); pxFill(ox, oy, px, 7, 6, 2, 1, A_PAL.K);
      } else {
        var lx = Math.cos(a.dir) >= 0 ? 1 : 0, ly = Math.sin(a.dir) >= 0 ? 1 : 0;           // pupils face travel dir
        pxFill(ox, oy, px, 2 + lx, 5 + ly, 1, 1, A_PAL.K);
        pxFill(ox, oy, px, 7 + lx, 5 + ly, 1, 1, A_PAL.K);
      }
      for (var i = 0; i < 4; i++) {                                                          // legs: scuttle (walk) while moving
        var lc = 2 + i * 2;
        var up = a.moving && ((Math.floor(a.t * 12) + i) % 2 === 1);
        pxFill(ox, oy, px, lc, 9, 1, 1, A_PAL.D);
        if (!up) pxFill(ox, oy, px, lc, 10, 1, 1, A_PAL.D);
      }
      ctx.globalAlpha = 1;
    }
    function drawCoin(c) {
      var pp = coinPos(c);
      var fr = Math.floor((c.spin % (Math.PI * 2)) / (Math.PI / 2));   // 0..3 → coin-flip cycle
      var spr = fr === 0 ? C_FULL : (fr === 2 ? C_EDGE : C_MID);
      var cols = spr[0].length, rows = spr.length;
      var px = Math.max(2, Math.round(c.r / 3));
      var ox = pp.x - (cols * px) / 2, oy = pp.y - (rows * px) / 2;
      drawSprite(spr, C_PAL, ox, oy, px, cl(c.alpha, 0, 1));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < agents.length; i++) drawAgent(agents[i]);
      for (var j = 0; j < coins.length; j++) drawCoin(coins[j]);
      for (var s = 0; s < sparks.length; s++) { ctx.globalAlpha = cl(sparks[s].life, 0, 1); ctx.fillStyle = "#ffd96b"; ctx.fillRect(Math.floor(sparks[s].x), Math.floor(sparks[s].y), 3, 3); }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      if (now - lastCoin > rnd(1500, 3400)) { emitCoin(); lastCoin = now; }
      step(dt); draw(); raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    size(); makeAgents();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); makeAgents(); coins = []; sparks = []; }, 200); });
    if (reduce) {
      for (var q = 0; q < agents.length; q++) {
        var a = agents[q]; a.state = "active"; a.alpha = ALPHA; a.moving = false; a.liveT = 9e9;
        a.x = (0.2 + 0.6 * (q / Math.max(1, agents.length - 1))) * W; a.y = (q % 2 ? 0.32 : 0.62) * H; a.dir = 0;
      }
      draw(); return;
    }
    start();
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  })();

  /* ============================================================
     AGENT ECONOMY — settlement pipeline (#focus)
     Agentic micro-payments stream in over x402, pack into a block
     being built, which seals (settles onchain) and joins the chain.
     Ambient + interactive; reduced-motion shows a static frame.
     ============================================================ */
  (function () {
    var canvas = document.getElementById("econ-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var W = 0, H = 0, DPR = 1, cy = 0;
    var grid = { cols: 5, rows: 5, x: 0, y: 0, cell: 0, gap: 0, size: 0 };
    var slots = [], cells = [], chain = [];
    var state = "filling", stateT = 0, fillIdx = 0, blockNo = 1283, blockAmt = 0, total = 0;
    var spawnAcc = 0, clock = 0, chainHead = 0, chainGap = 0, running = false, raf = 0, t0 = 0;
    var _mono = null;

    function rand(a, b) { return a + Math.random() * (b - a); }
    function clampn(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function monoFont() { if (!_mono) { _mono = (getComputedStyle(canvas).getPropertyValue("--font-mono") || "").trim() || "ui-monospace, monospace"; } return _mono; }
    function cham(x, y, w, h, c) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }

    function resize() {
      var r = canvas.getBoundingClientRect(); if (!r.width) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      layout();
    }
    function layout() {
      cy = H / 2;
      var bw = clampn(Math.min(H * 0.5, W * 0.2), 118, 172);
      grid.gap = Math.max(3, bw * 0.05);
      grid.cell = (bw - grid.gap * (grid.cols + 1)) / grid.cols;
      grid.size = bw;
      grid.x = Math.round(W * 0.38 - bw / 2);
      grid.y = Math.round(cy - bw / 2);
      slots = [];
      for (var r2 = 0; r2 < grid.rows; r2++) for (var c2 = 0; c2 < grid.cols; c2++) {
        slots.push({ x: grid.x + grid.gap + c2 * (grid.cell + grid.gap), y: grid.y + grid.gap + r2 * (grid.cell + grid.gap), filled: false, amt: 0, fx: 0 });
      }
      chainHead = grid.x + bw + clampn(W * 0.06, 46, 86);
      chainGap = clampn((W - chainHead - 24) / 6, 44, 96);
      cells = []; chain = []; blockAmt = 0; state = "filling"; stateT = 0; spawnAcc = 0;
      // pre-seed: a partly-built block + a few sealed blocks on the chain (never blank)
      var pre = Math.floor(rand(0.3, 0.6) * slots.length);
      for (var s = 0; s < pre; s++) { slots[s].filled = true; slots[s].amt = rand(0.001, 0.03); blockAmt += slots[s].amt; }
      fillIdx = pre;
      for (var k = 0; k < 4; k++) chain.push({ x: chainHead + k * chainGap, tx: chainHead + k * chainGap, n: 25, amt: rand(0.2, 0.7), seal: 0 });
    }

    function blockSize(i) { return grid.size * (0.4 - i * 0.045); }

    function spawnCell() {
      if (state !== "filling" || fillIdx >= slots.length) return;
      var slot = slots[fillIdx]; fillIdx++;
      var sx = rand(0.04, 0.22) * W, sy = rand(0.16, 0.84) * H;
      cells.push({ sx: sx, sy: sy, x: sx, y: sy, t: 0, dur: rand(0.55, 1.0), slot: slot, amt: rand(0.001, 0.03) });
    }
    function sealBlock() { chain.unshift({ x: grid.x + grid.size / 2, tx: chainHead, n: slots.length, amt: blockAmt, seal: 1 }); total += blockAmt; blockNo++; }
    function resetBuilder() { for (var i = 0; i < slots.length; i++) { slots[i].filled = false; slots[i].amt = 0; slots[i].fx = 0; } fillIdx = 0; blockAmt = 0; }
    function allFilled() { for (var i = 0; i < slots.length; i++) if (!slots[i].filled) return false; return true; }

    function step(dt) {
      clock += dt;
      if (state === "filling" && fillIdx < slots.length) {
        spawnAcc += dt;
        var breath = (Math.sin(clock * 0.7) + 1) / 2, interval = 0.12 + breath * 0.34;
        if (spawnAcc >= interval) { spawnAcc = 0; spawnCell(); }
      }
      for (var i = cells.length - 1; i >= 0; i--) {
        var c = cells[i]; c.t += dt; var p = ease(Math.min(c.t / c.dur, 1));
        c.x = c.sx + (c.slot.x + grid.cell / 2 - c.sx) * p;
        c.y = c.sy + (c.slot.y + grid.cell / 2 - c.sy) * p;
        if (c.t >= c.dur) { c.slot.filled = true; c.slot.amt = c.amt; c.slot.fx = 1; blockAmt += c.amt; cells.splice(i, 1); }
      }
      for (var f = 0; f < slots.length; f++) if (slots[f].fx > 0) slots[f].fx = Math.max(0, slots[f].fx - dt * 3);
      if (state === "filling" && allFilled()) { state = "sealing"; stateT = 0; }
      else if (state === "sealing") { stateT += dt; if (stateT >= 0.75) { sealBlock(); resetBuilder(); state = "pause"; stateT = 0; } }
      else if (state === "pause") { stateT += dt; if (stateT >= 0.5) state = "filling"; }
      for (var b = 0; b < chain.length; b++) { chain[b].tx = chainHead + b * chainGap; chain[b].x += (chain[b].tx - chain[b].x) * Math.min(1, dt * 4); if (chain[b].seal > 0) chain[b].seal = Math.max(0, chain[b].seal - dt * 1.6); }
      while (chain.length > 7) chain.pop();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "11px " + monoFont();
      // chain rail
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(grid.x + grid.size, cy); ctx.lineTo(W - 12, cy); ctx.stroke();
      // incoming label
      ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.fillText("x402 payments", 14, cy - grid.size / 2 - 9);
      ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillText("incoming", 14, cy - grid.size / 2 + 7);
      // incoming cells
      var cs = Math.max(5, grid.cell * 0.72);
      for (var i = 0; i < cells.length; i++) { var c = cells[i]; cham(c.x - cs / 2, c.y - cs / 2, cs, cs, cs * 0.32); ctx.fillStyle = "rgba(150,110,245,0.55)"; ctx.fill(); }
      // builder frame
      var pad = grid.gap;
      cham(grid.x - pad, grid.y - pad, grid.size + pad * 2, grid.size + pad * 2, 14);
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1; ctx.stroke();
      // slots
      var sealing = state === "sealing", sealP = sealing ? stateT / 0.75 : 0, sweepX = grid.x + sealP * grid.size;
      for (var s = 0; s < slots.length; s++) {
        var sl = slots[s];
        cham(sl.x, sl.y, grid.cell, grid.cell, grid.cell * 0.3);
        if (sl.filled) { ctx.fillStyle = (sealing && sl.x < sweepX) ? "rgba(61,220,132,0.9)" : ("rgba(123,31,255," + (0.68 + sl.fx * 0.32) + ")"); ctx.fill(); }
        else { ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1; ctx.stroke(); }
      }
      if (sealing) { ctx.strokeStyle = "rgba(61,220,132,0.9)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sweepX, grid.y - 4); ctx.lineTo(sweepX, grid.y + grid.size + 4); ctx.stroke(); }
      // builder labels
      var filled = 0; for (var s2 = 0; s2 < slots.length; s2++) if (slots[s2].filled) filled++;
      ctx.textAlign = "center";
      ctx.fillStyle = sealing ? "rgba(61,220,132,0.95)" : "rgba(205,180,255,0.95)"; ctx.font = "11px " + monoFont();
      ctx.fillText(sealing ? "settling onchain" : ("building · block #" + blockNo), grid.x + grid.size / 2, grid.y + grid.size + 22);
      ctx.fillStyle = "rgba(255,255,255,0.34)"; ctx.font = "10px " + monoFont();
      ctx.fillText(sealing ? ("✓ " + blockAmt.toFixed(3) + " USDC · " + slots.length + " tx") : (filled + " / " + slots.length + " payments"), grid.x + grid.size / 2, grid.y + grid.size + 38);
      // chain
      for (var b = chain.length - 1; b >= 0; b--) {
        var blk = chain[b], bs = blockSize(b); if (bs < 4) continue;
        if (b > 0) { var pbs = blockSize(b - 1); ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(chain[b - 1].x + pbs / 2, cy); ctx.lineTo(blk.x - bs / 2, cy); ctx.stroke(); }
        ctx.globalAlpha = clampn(1 - b * 0.14, 0.18, 1);
        cham(blk.x - bs / 2, cy - bs / 2, bs, bs, bs * 0.28); ctx.fillStyle = "rgba(123,31,255,0.32)"; ctx.fill();
        ctx.strokeStyle = blk.seal > 0 ? ("rgba(61,220,132," + blk.seal + ")") : "rgba(139,91,255,0.6)"; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.textAlign = "left";
      ctx.fillText("onchain", chainHead - blockSize(0) / 2, cy - blockSize(0) / 2 - 12);
      // running total
      ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = "11px " + monoFont();
      ctx.fillText("Σ " + total.toFixed(2) + " USDC settled", W - 14, H - 12);
    }

    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      step(dt); draw(); raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    canvas.addEventListener("click", function () { for (var k = 0; k < 6; k++) spawnCell(); });   // inject a burst of payments
    canvas.style.cursor = "pointer";

    resize();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 160); });
    for (var q = 0; q < 5; q++) spawnCell();
    step(0.001); draw();

    if (reduce) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !document.hidden) start(); else stop(); }); }, { threshold: 0.04 }).observe(canvas);
    } else { start(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else { var r = canvas.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) start(); } });
  })();

  function bootTerminal() {
    var body = $("#term-body");
    if (!body) return;

    // A self-running console that narrates Akshat. No input, no navigation.
    var SEQ = [
      { cmd: "whoami", out: "Akshat Gada — developer relations engineer at Polygon, leading agentic payments." },
      { cmd: "cat focus.txt", out: "I build the tools that let AI agents pay: wallets, identity, and onchain settlement over x402." },
      { cmd: "ls projects/", out: "agent-cli   facilitator   agentic-services   agentconnect   agentic-docs" },
      { cmd: "cat agent-cli", out: "One install gives an agent a session wallet, an onchain identity, x402 payments, swaps and bridging. No keys exposed." },
      { cmd: "pay --x402", lines: [
        "<span class='dir'>agent  &rarr;</span> GET /v1/inference",
        "<span class='dir'>service&rarr;</span> <span class='warn'>402 Payment Required</span> &middot; 0.01 USDC",
        "<span class='dir'>agent  &rarr;</span> X-PAYMENT signed &middot; <span class='key'>EIP-3009</span>",
        "<span class='dir'>facilitator</span> verify &rarr; settle onchain",
        "<span class='dir'>service&rarr;</span> <span class='ok'>200 OK</span> &middot; paid in 0.8s"
      ] },
      { cmd: "cat pip-82", out: "Co-authored PIP-82 — up to $1M in gas rebates to scale agentic, x402 transactions on Polygon." },
      { cmd: "uptime", out: "intern → full-time at Polygon since 2025. building in the open." },
      { cmd: "echo $MISSION", out: "Make the machine-payable web real for developers." }
    ];

    function scrollBody() { body.scrollTop = body.scrollHeight; }
    function promptLine() {
      var d = document.createElement("div"); d.className = "term-line";
      d.innerHTML = "<span class='term-prompt'>akshat@polygon ~ %</span> <span class='term-cmd'></span>";
      body.appendChild(d); return d.querySelector(".term-cmd");
    }
    function outLine() { var d = document.createElement("div"); d.className = "term-out"; body.appendChild(d); return d; }

    // Reduced motion / no animation: print a static snapshot, no loop.
    if (reduce) {
      body.innerHTML = "";
      SEQ.slice(0, 4).forEach(function (e) {
        var c = promptLine(); c.textContent = e.cmd;
        var o = outLine(); o.innerHTML = e.lines ? e.lines.join("<br>") : e.out;
      });
      return;
    }

    body.innerHTML = "";

    function typeInto(el, text, speed, cb) {
      el.classList.add("caret"); var i = 0;
      (function step() {
        el.textContent = text.slice(0, i); i++;
        if (i <= text.length) { scrollBody(); setTimeout(step, speed); }
        else { el.classList.remove("caret"); cb && cb(); }
      })();
    }
    function revealLines(lines, i, cb) {
      if (i >= lines.length) { cb && cb(); return; }
      var o = outLine(); o.innerHTML = lines[i]; scrollBody();
      setTimeout(function () { revealLines(lines, i + 1, cb); }, 560);
    }
    function runEntry(e, done) {
      var c = promptLine();
      typeInto(c, e.cmd, 58, function () {            // slow command typing
        setTimeout(function () {
          if (e.lines) revealLines(e.lines, 0, function () { setTimeout(done, 1300); });
          else { var o = outLine(); typeInto(o, e.out, 24, function () { setTimeout(done, 1400); }); }
        }, 520);
      });
    }
    function loop(idx) {
      if (idx >= SEQ.length) {
        setTimeout(function () { body.innerHTML = ""; loop(0); }, 2600);  // clear, then restart
        return;
      }
      runEntry(SEQ[idx], function () { loop(idx + 1); });
    }
    loop(0);
  }
})();
