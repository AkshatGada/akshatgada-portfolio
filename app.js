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

  /* ============================================================
     SWARM — emergence (#focus)
     Hundreds of agents follow three local rules — separate, align,
     cohere — with no central plan; global order self-organizes and
     value cascades ripple through the proximity network they form.
     The cursor gathers them. Reduced motion shows a settled frame.
     ============================================================ */
  (function () {
    var canvas = document.getElementById("swarm-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var W = 0, H = 0, DPR = 1, running = false, raf = 0, t0 = 0, clock = 0;
    var boids = [], linkBuf = [], mx = 0, my = 0, hasMouse = false;
    var emerge = 0, pulses = [], pulseT = 2.5;

    var PERC2 = 60 * 60, SEP = 24, SEP2 = SEP * SEP, LINK2 = 50 * 50,
        CURR2 = 150 * 150, MAX = 1.9, MIN = 0.7;
    var PURP = ["#4f349e", "#6f4ad6", "#8b6cf0", "#b79bff"];   // node colour by connectivity (no glow)
    var TEAL = ["#2b7fa6", "#39a7d6", "#5cc6f0", "#8fe3ff"];
    function tier(k) { return k >= 6 ? 3 : k >= 4 ? 2 : k >= 2 ? 1 : 0; }

    function rand(a, b) { return a + Math.random() * (b - a); }

    function resize() {
      var r = canvas.getBoundingClientRect(); if (!r.width) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      init();
    }
    function init() {
      var n = Math.round(Math.max(170, Math.min(360, (W * H) / 2600)));
      boids = [];
      for (var i = 0; i < n; i++) {
        var hub = Math.random() < 0.06;
        boids.push({ x: rand(0, W), y: rand(0, H), vx: rand(-1, 1), vy: rand(-1, 1),
          kind: Math.random() < 0.10 ? 1 : 0, hub: hub, size: hub ? rand(30, 38) : rand(15, 22),
          lit: 0, sx: 0, sy: 0, ax: 0, ay: 0, cx: 0, cy: 0, n: 0 });
      }
      emerge = 0; pulses = []; pulseT = 2.5;
    }

    function step(dt) {
      clock += dt;
      emerge = Math.min(1, emerge + dt * 0.28);
      var sf = Math.max(0.5, Math.min(2, dt * 60)), i, j, b, bj, n = boids.length;
      for (i = 0; i < n; i++) { b = boids[i]; b.sx = b.sy = b.ax = b.ay = b.cx = b.cy = 0; b.n = 0; }
      linkBuf.length = 0;
      for (i = 0; i < n; i++) {
        b = boids[i];
        for (j = i + 1; j < n; j++) {
          bj = boids[j];
          var dx = bj.x - b.x, dy = bj.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 > PERC2 || d2 < 0.0001) continue;
          b.ax += bj.vx; b.ay += bj.vy; b.cx += bj.x; b.cy += bj.y; b.n++;
          bj.ax += b.vx; bj.ay += b.vy; bj.cx += b.x; bj.cy += b.y; bj.n++;
          if (d2 < SEP2) { var d = Math.sqrt(d2), f = (SEP - d) / (SEP * d); b.sx -= dx * f; b.sy -= dy * f; bj.sx += dx * f; bj.sy += dy * f; }
          if (d2 < LINK2) { linkBuf.push(i, j, 1 - d2 / LINK2); }
        }
      }
      var cohW = 0.8 + 0.25 * Math.sin(clock * 0.25);          // the economy breathing
      for (i = 0; i < n; i++) {
        b = boids[i]; var fx = 0, fy = 0;
        if (b.n > 0) {
          fx += (b.cx / b.n - b.x) * 0.0003 * cohW * emerge;   // cohesion (light, local texture)
          fy += (b.cy / b.n - b.y) * 0.0003 * cohW * emerge;
          fx += (b.ax / b.n - b.vx) * 0.070 * emerge;          // alignment (flowing currents)
          fy += (b.ay / b.n - b.vy) * 0.070 * emerge;
        }
        fx += b.sx * 0.05; fy += b.sy * 0.05;                  // separation (even spacing)
        var m = 30;                                            // soft walls keep the field spread to the edges
        if (b.x < m) fx += (m - b.x) * 0.0020; else if (b.x > W - m) fx -= (b.x - (W - m)) * 0.0020;
        if (b.y < m) fy += (m - b.y) * 0.0020; else if (b.y > H - m) fy -= (b.y - (H - m)) * 0.0020;
        if (hasMouse) {                                        // cursor: attract + swirl
          var cx = mx - b.x, cy = my - b.y, c2 = cx * cx + cy * cy;
          if (c2 < CURR2 && c2 > 1) { var cd = Math.sqrt(c2); fx += (cx / cd) * 0.09 + (-cy / cd) * 0.07; fy += (cy / cd) * 0.09 + (cx / cd) * 0.07; }
        }
        fx += (Math.random() - 0.5) * 0.05; fy += (Math.random() - 0.5) * 0.05;
        b.vx += fx * sf; b.vy += fy * sf;
        var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (sp > MAX) { b.vx = b.vx / sp * MAX; b.vy = b.vy / sp * MAX; }
        else if (sp < MIN && sp > 0.0001) { b.vx = b.vx / sp * MIN; b.vy = b.vy / sp * MIN; }
        b.x += b.vx * sf; b.y += b.vy * sf; b.lit *= 0.90;
      }
      pulseT -= dt;                                            // value cascades
      if (pulseT <= 0 && n) { pulseT = rand(4.5, 7.5); var s = boids[(Math.random() * n) | 0]; pulses.push({ x: s.x, y: s.y, r: 0 }); }
      var maxR = Math.sqrt(W * W + H * H);
      for (i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i]; p.r += 150 * dt;
        if (p.r > maxR + 30) { pulses.splice(i, 1); continue; }
        for (j = 0; j < n; j++) { b = boids[j]; if (Math.abs(Math.sqrt((b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y)) - p.r) < 12) b.lit = 1; }
      }
    }

    function render() {
      ctx.fillStyle = "#0b0a11"; ctx.fillRect(0, 0, W, H);   // crisp: clear each frame, no glow/trails
      var i, b, bj;
      ctx.lineWidth = 1;                                     // links — flat wireframe mesh
      for (i = 0; i < linkBuf.length; i += 3) {
        b = boids[linkBuf[i]]; bj = boids[linkBuf[i + 1]];
        var li = Math.max(b.lit, bj.lit), a = linkBuf[i + 2] * (0.10 + 0.34 * emerge) + li * 0.55;
        ctx.strokeStyle = li > 0.05 ? "rgba(245,197,66," + Math.min(0.78, a) + ")" : "rgba(124,77,255," + Math.min(0.6, a) + ")";
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(bj.x, bj.y); ctx.stroke();
      }
      for (i = 0; i < boids.length; i++) {                  // nodes — crisp diamonds, brightness by connectivity
        b = boids[i];
        var r = b.hub ? 4.4 : 2.5, c;
        if (b.lit > 0.06) { c = "#ffd877"; r += b.lit * 2.4; }
        else { var t = tier(b.n); c = b.kind ? TEAL[t] : PURP[t]; }
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(b.x, b.y - r); ctx.lineTo(b.x + r, b.y); ctx.lineTo(b.x, b.y + r); ctx.lineTo(b.x - r, b.y); ctx.closePath(); ctx.fill();
      }
    }

    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      step(dt); render(); raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    canvas.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; hasMouse = true; });
    canvas.addEventListener("pointerleave", function () { hasMouse = false; });

    resize();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 160); });

    if (reduce) { emerge = 1; for (var k = 0; k < 480; k++) step(1 / 60); render(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !document.hidden) start(); else stop(); }); }, { threshold: 0.04 }).observe(canvas);
    } else { start(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else { var r = canvas.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) start(); } });
  })();

  /* ============================================================
     JOURNEY — a pixel-art short film (#about)
     A recurring pixel character walks through six life phases —
     chemistry lab, badminton, learning to code, graduation, first
     company, agentic payments at Polygon — performing each, then
     walking on to the next. Fully procedural: walk cycle, held
     props, ambient particles. The world cross-dissolves between
     phases as he walks out of one and into the next.
     ============================================================ */
  (function () {
    var canvas = document.getElementById("journey-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var nameEl = document.getElementById("journey-name");
    var dotsEl = document.getElementById("journey-dots");

    var N = 28;          // grid is N×N
    var GY = 23;         // ground row — character's feet rest here

    var C = {
      skin: "#e6a06e", skinSh: "#c47a4c", eye: "#241726",
      hair: "#4a3320", shoe: "#171019", shadow: "#0c0a12",
      floor: "#181320", floorTop: "#231d31",
      w: "#f3eeff", k: "#0e1726",
      p: "#7c4dff", P: "#b794ff", d: "#43208a",
      g: "#3ddc84", G: "#1d6f49", t: "#34c6ff", t2: "#1f7fa8",
      y: "#f5c542", Y: "#bd8a1c", r: "#ff5a6a",
      s: "#9a98ad", S: "#3a3650", S2: "#2a2740",
      navy: "#2b3350", grey: "#4a4660", brown: "#5a3a1c", brown2: "#7a5226",
      coat: "#eef0f6", sport: "#e9e6f5"
    };

    function blank() { var a = []; for (var y = 0; y < N; y++) a.push(new Array(N).fill(null)); return a; }
    function P(a, x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) a[y][x] = c; }
    function R(a, x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) P(a, x + i, y + j, c); }
    function lerp(a, b, u) { return a + (b - a) * u; }
    function ease(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
    function clone(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

    /* ---- aging: the character grows scene to scene -------------
       One stage per phase (boy → early 20s): taller body + a beard
       that fills in. Every limb/prop anchors off these metrics so
       the props track his real shoulder/hand/head as he grows. */
    var STAGE = [
      { legH: 2, torsoH: 4, beard: 0 },   // 0 small boy
      { legH: 3, torsoH: 4, beard: 0 },   // 1 taller, no beard
      { legH: 4, torsoH: 5, beard: 1 },   // 2 stubble
      { legH: 5, torsoH: 5, beard: 2 },   // 3 short beard
      { legH: 5, torsoH: 6, beard: 3 }    // 4 full beard, early 20s
    ];
    function metrics(s) {
      var st = STAGE[s] || STAGE[STAGE.length - 1];
      var legH = st.legH, torsoH = st.torsoH, shoulder = legH + torsoH, chin = shoulder + 2;
      return {
        legH: legH, torsoH: torsoH, hip: legH, shoulder: shoulder, neck: shoulder + 1,
        chin: chin, eyes: chin + 1, brow: chin + 2, hair1: chin + 3, hair2: chin + 4,
        top: chin + 4, hand: shoulder - 3, beard: st.beard
      };
    }

    /* ---- the character ----------------------------------------
       7 wide, variable height, anchored top-left col `hx`, feet at
       `by`. p.m holds the stage metrics; p: { skin, hair, shirt,
       pants, shoe, robe, hat, arms, step, face, m } */
    function human(a, hx, by, p) {
      hx = Math.round(hx);
      var m = p.m || metrics(0);
      var K = p.skin || C.skin, H = p.hair || C.hair, T = p.shirt || C.coat,
          Pn = p.pants || C.navy, B = p.shoe || C.shoe, E = C.eye,
          robe = p.robe, SLV = robe || T, step = p.step, dy;
      function q(dx, dy, c) { P(a, hx + dx, by - dy, c); }

      if (robe) {                                   // gown: hem + body, no legs
        R(a, hx, by - 1, 7, 2, robe);
        for (dy = 2; dy <= m.shoulder; dy++) R(a, hx + 1, by - dy, 5, 1, robe);
      } else {
        for (dy = 1; dy <= m.hip; dy++) { q(1,dy,Pn); q(2,dy,Pn); q(4,dy,Pn); q(5,dy,Pn); }  // legs (gap at col 3)
        var liftL = step === 1, liftR = step === 0;                                          // walk: lift one foot
        if (liftL) { q(1,1,B); q(2,1,B); } else { q(1,0,B); q(2,0,B); }
        if (liftR) { q(4,1,B); q(5,1,B); } else { q(4,0,B); q(5,0,B); }
        for (dy = m.hip + 1; dy <= m.shoulder; dy++) R(a, hx + 1, by - dy, 5, 1, T);          // torso
      }
      q(3, m.neck, K);                                                          // neck
      for (var dx = 1; dx <= 5; dx++) { q(dx, m.hair2, H); q(dx, m.hair1, H); } // hair
      q(1,m.brow,H); q(2,m.brow,K); q(3,m.brow,K); q(4,m.brow,K); q(5,m.brow,H);// brow line
      q(1,m.eyes,K); q(2,m.eyes,K); q(3,m.eyes,K); q(4,m.eyes,K); q(5,m.eyes,K);// eye row
      var ex = p.face === "right" ? [3, 5] : [2, 4];
      P(a, hx + ex[0], by - m.eyes, E); P(a, hx + ex[1], by - m.eyes, E);
      q(2,m.chin,K); q(3,m.chin,K); q(4,m.chin,K);                              // chin
      if (m.beard >= 1) { q(2,m.chin,H); q(4,m.chin,H); }                       // stubble
      if (m.beard >= 2) { q(3,m.chin,H); q(1,m.eyes,H); q(5,m.eyes,H); }        // short beard
      if (m.beard >= 3) { q(1,m.chin,H); q(5,m.chin,H); q(2,m.eyes,H); q(4,m.eyes,H); }  // full beard

      if (p.hat === "grad") {                             // mortarboard above the hair
        var b = m.hair2 + 1;
        R(a, hx - 1, by - b, 9, 1, C.S2); R(a, hx + 1, by - (b - 1), 5, 1, C.S2);
        P(a, hx + 3, by - (b - 1), C.y);                  // button
        P(a, hx + 6, by - (b - 1), C.y); P(a, hx + 6, by - (b - 2), C.y);
        P(a, hx + 6, by - (b - 3), C.y); P(a, hx + 5, by - (b - 4), C.Y);      // tassel
      }
      var am = p.arms || "down";                          // "none" → scene draws arms
      if (am === "down" || am === "walk") {
        var sh = m.shoulder;
        q(0,sh,SLV); q(0,sh-1,SLV); q(0,sh-2,K); q(0,sh-3,K);
        q(6,sh,SLV); q(6,sh-1,SLV); q(6,sh-2,K); q(6,sh-3,K);
      }
    }

    function armDown(a, hx, by, side, slv, m) {           // a single hanging arm
      var dx = side < 0 ? 0 : 6, sh = m.shoulder;
      P(a, hx + dx, by - sh, slv); P(a, hx + dx, by - (sh - 1), slv);
      P(a, hx + dx, by - (sh - 2), C.skin); P(a, hx + dx, by - (sh - 3), C.skin);
    }

    /* ---- per-phase appearance --------------------------------- */
    /* ---- backgrounds (drawn behind the character) ------------- */
    function tint(a, c) { R(a, 0, 0, N, N, c); }

    function bg0(a) {                                     // chemistry lab
      tint(a, "#0f1a18");
      R(a, 4, 5, 13, 1, C.S2);                            // shelf
      P(a,5,4,C.g); P(a,5,3,C.s); P(a,9,4,C.r); P(a,9,3,C.s); P(a,13,4,C.t); P(a,13,3,C.s);
      R(a, 21, 4, 5, 6, C.S2); R(a, 22, 5, 3, 4, C.t2);  // window
    }
    function bg1(a) {                                     // badminton court
      tint(a, "#101a2c");                                 // brighter court air
      R(a, 1, 6, N - 2, 1, "#1c2c47");                    // back wall line
      R(a, 23, 6, 1, GY - 6, "#5b6f95");                  // net post (right side)
      R(a, 14, 6, 10, 1, C.w);                            // net tape
      for (var x = 14; x < N - 1; x++) for (var y = 8; y <= GY - 1; y += 2) if (x % 2) P(a, x, y, "#2c3e60");
      R(a, 1, GY, N - 2, 1, C.t);                         // bright baseline
      R(a, 13, GY - 6, 1, 6, "#23364f");                  // centre service line
    }
    function bg2(a) {                                     // study / night window
      tint(a, "#100e1a");
      R(a, 2, 3, 7, 6, C.S2);                             // window frame
      R(a, 3, 4, 5, 4, "#16203c");
      P(a,4,5,C.w); P(a,6,6,C.w); P(a,5,4,C.s);           // stars
      R(a, 22, 4, 4, 7, C.S2); R(a, 23, 5, 2, 5, C.d);    // bookshelf
    }
    function bg3(a) {                                     // graduation
      tint(a, "#16101f");
      R(a, 3, 3, 22, 2, C.d); R(a, 3, 3, 22, 1, C.p);     // banner
      for (var x = 5; x <= 23; x += 4) P(a, x, 5, C.y);   // banner studs
    }
    function bg5(a, gt) {                                 // agentic payments · Polygon
      tint(a, "#150c24");
      R(a, 0, GY, N, 1, C.d);                             // purple horizon
      for (var i = 0; i < 5; i++) {                       // drifting data motes
        var mx = (i * 6 + 2 + Math.floor(gt * 1.5 + i)) % N;
        P(a, mx, 5 + (i % 3) * 2, i % 2 ? C.P : C.t2);
      }
    }

    /* ---- per-phase activity (arms + props + particles) -------- */
    function act0(a, hx, by, at, gt, m) {                 // hold a bubbling flask
      var sh = m.shoulder;
      armDown(a, hx, by, -1, C.coat, m);
      P(a,hx+6,by-sh,C.coat); P(a,hx+7,by-(sh+1),C.skin); P(a,hx+8,by-(sh+1),C.skin);  // raised hand
      var fx = hx + 7, fb = sh + 2;                       // Erlenmeyer flask, tapered, above the hand
      R(a, fx - 1, by - fb, 4, 1, C.g);                   // liquid base
      R(a, fx - 1, by - (fb + 1), 4, 1, C.g);             // liquid
      R(a, fx - 1, by - (fb + 2), 4, 1, C.s);             // glass shoulder
      R(a, fx, by - (fb + 3), 2, 1, C.s);                 // neck
      R(a, fx, by - (fb + 4), 2, 1, C.w);                 // lip
      for (var b = 0; b < 3; b++) {                       // bubbles rising
        var ph = (at * 1.5 + b * 0.45) % 1;
        P(a, fx + b, by - (fb + 1) - Math.floor(ph * 3), C.t);
      }
    }
    function racket(a, x, y) {                            // oval head + handle, white frame
      R(a, x, y, 3, 1, C.w);
      P(a, x, y + 1, C.w); P(a, x + 2, y + 1, C.w);
      P(a, x, y + 2, C.w); P(a, x + 2, y + 2, C.w);
      R(a, x, y + 3, 3, 1, C.w);
      P(a, x + 1, y + 1, C.s); P(a, x + 1, y + 2, C.s);  // strings
    }
    function act1(a, hx, by, at, gt, m) {                 // swing a racket, shuttle arcs
      var sh = m.shoulder;
      armDown(a, hx, by, -1, C.sport, m);
      var up = Math.sin(at * 3.0) > 0, rx, ry;
      if (up) {                                          // overhead swing
        P(a,hx+6,by-sh,C.sport); P(a,hx+7,by-(sh+1),C.skin); P(a,hx+8,by-(sh+2),C.skin);
        rx = hx + 7; ry = by - (sh + 5); P(a, hx + 8, by - (sh + 3), C.brown2);  // handle to hand
      } else {                                           // ready, racket out
        P(a,hx+6,by-sh,C.sport); P(a,hx+8,by-sh,C.skin);
        rx = hx + 9; ry = by - (sh + 1); P(a, hx + 10, by - (sh - 1), C.brown2);
      }
      racket(a, rx, ry);
      var u = (at * 0.42) % 1;                            // shuttlecock arcing over the net
      var sx = Math.round(lerp(hx + 9, N - 3, u)), sy = Math.round(by - (m.top + 1) - Math.sin(u * Math.PI) * 4);
      P(a, sx, sy, C.y); P(a, sx, sy + 1, C.Y);          // cork
      P(a, sx - 1, sy - 1, C.w); P(a, sx, sy - 1, C.w); P(a, sx + 1, sy - 1, C.w);
      P(a, sx - 1, sy - 2, C.w); P(a, sx + 1, sy - 2, C.w);  // feathers
    }
    function act2(a, hx, by, at, gt, m) {                 // type at a standing desk
      var sh = m.shoulder, d = m.hip + 1;                 // desk surface dy (waist)
      P(a,hx+0,by-sh,C.grey); P(a,hx+0,by-(sh-1),C.grey); P(a,hx+0,by-(sh-2),C.grey);  // arms down
      P(a,hx+6,by-sh,C.grey); P(a,hx+6,by-(sh-1),C.grey); P(a,hx+6,by-(sh-2),C.grey);
      R(a, hx - 5, by - d, 17, 1, C.S);                   // desk surface
      R(a, hx - 5, by - (d - 1), 17, d, C.S2);            // desk front (hides legs)
      var lx = hx + 1;                                    // laptop sits on the desk
      R(a, lx, by - (d + 5), 7, 5, C.S);                  // screen bezel (below the face)
      R(a, lx + 1, by - (d + 4), 5, 3, C.k);              // screen
      var off = Math.floor(at * 4) % 3, cols = [C.P, C.t, C.g, C.y, C.w];
      for (var rr = 0; rr < 3; rr++) R(a, lx + 1, by - (d + 4) + rr, 2 + ((rr + off) % 3), 1, cols[(rr + off) % cols.length]);
      R(a, lx, by - d, 7, 1, C.k);                        // keyboard deck on the desk
      var tap = Math.floor(at * 9) % 2;                   // tapping hands
      P(a, hx + 1, by - (d + 1) - tap, C.skin); P(a, hx + 5, by - (d + 1) - (1 - tap), C.skin);
    }
    function act3(a, hx, by, at, gt, m) {                 // diploma + confetti
      var rb = C.S2, sh = m.shoulder;
      armDown(a, hx, by, -1, rb, m);
      P(a,hx+6,by-sh,rb); P(a,hx+6,by-(sh-1),rb); P(a,hx+6,by-(sh-2),C.skin);          // right arm
      R(a, hx + 7, by - (sh-1), 2, 1, C.w); R(a, hx + 7, by - (sh-2), 2, 1, C.s); R(a, hx + 7, by - (sh-3), 2, 1, C.w);  // diploma
      var cc = [C.p, C.y, C.g, C.t, C.r, C.P];
      for (var i = 0; i < 11; i++) {                      // confetti rain
        var cx = (i * 5 + 2) % N;
        var cy = Math.floor((at * 7 + i * 2.3) % (GY + 1));
        P(a, cx, cy, cc[i % cc.length]);
      }
    }
    function act5(a, hx, by, at, gt, m) {                 // hand a coin to an agent
      var sh = m.shoulder;
      armDown(a, hx, by, -1, C.p, m);
      P(a,hx+6,by-sh,C.p); P(a,hx+7,by-sh,C.skin); P(a,hx+7,by-(sh+1),C.skin);  // raised hand
      var bob = Math.round(Math.sin(gt * 3) * 1.4);
      var bx = hx + 10, byy = by - m.eyes + bob;         // the agent bot, at head height
      R(a, bx, byy, 5, 4, C.p);
      R(a, bx + 1, byy + 1, 1, 2, C.w); R(a, bx + 3, byy + 1, 1, 2, C.w);
      P(a, bx + 1, byy + 2, C.k); P(a, bx + 3, byy + 2, C.k);
      P(a, bx + 2, byy - 1, C.P);
      P(a, bx + 1, byy + 4, C.d); P(a, bx + 3, byy + 4, C.d);
      var u = (at * 0.7) % 1;                             // coin in flight (x402)
      var coinx = lerp(hx + 8, bx + 1, u), coiny = lerp(by - (sh + 1), byy + 2, u) - Math.sin(u * Math.PI) * 3;
      P(a, coinx, coiny, C.y); P(a, coinx, coiny - 1, C.Y);
    }

    var SCENES = [
      { name: "On the court",               bg: bg1, act: act1, look: { shirt: C.sport, pants: "#3a3647" } },
      { name: "Chemistry lab",              bg: bg0, act: act0, look: { shirt: C.coat,  pants: C.navy } },
      { name: "Learning to code",           bg: bg2, act: act2, look: { shirt: C.grey,  pants: "#26232f" } },
      { name: "Graduation day",             bg: bg3, act: act3, look: { robe: C.S2, hat: "grad" } },
      { name: "Agentic payments · Polygon", bg: bg5, act: act5, look: { shirt: C.p,     pants: "#26232f" } }
    ];

    /* ---- engine ----------------------------------------------- */
    var IN = 1.0, ACT = 3.4, OUT = 1.15;
    var xc = Math.round((N - 7) / 2), xIn = -9, xOut = N + 2;
    var idx = 0, phase = "in", pt = 0, hx = xIn, stride = 0, strideT = 0, thr = null;
    var W = 0, H = 0, DPR = 1, cell = 0, ox = 0, oy = 0, running = false, raf = 0, t0 = 0, clock = 0;

    function genThr() {
      thr = [];
      for (var y = 0; y < N; y++) { thr.push([]); for (var x = 0; x < N; x++) thr[y].push(((x + y) / (2 * N)) * 0.55 + Math.random() * 0.5); }
    }
    function setDots() {
      if (!dotsEl) return; dotsEl.innerHTML = "";
      for (var i = 0; i < SCENES.length; i++) { var d = document.createElement("i"); if (i === idx) d.className = "on"; dotsEl.appendChild(d); }
    }
    function setScene(i) { idx = i; if (nameEl) nameEl.textContent = SCENES[i].name; setDots(); }

    function resize() {
      var r = canvas.getBoundingClientRect(); if (!r.width) return;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.imageSmoothingEnabled = false;
      cell = Math.floor(Math.min(W, H) * 0.96 / N);
      ox = Math.round((W - cell * N) / 2); oy = Math.round((H - cell * N) / 2);
      paint(clock);
    }

    function paint(gt) {
      var a = blank();
      if (phase === "out") {                              // cross-dissolve world A → B
        var ni = (idx + 1) % SCENES.length, ga = blank(), gb = blank();
        SCENES[idx].bg(ga, gt); SCENES[ni].bg(gb, gt);
        var u = Math.min(1, pt / OUT);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) a[y][x] = (u >= (thr ? thr[y][x] : 1)) ? gb[y][x] : ga[y][x];
      } else {
        SCENES[idx].bg(a, gt);
      }
      R(a, 0, GY + 1, N, N - GY - 1, C.floor);            // floor
      R(a, 0, GY + 1, N, 1, C.floorTop);
      R(a, Math.round(hx) + 1, GY + 1, 5, 1, C.shadow);   // foot shadow

      var p = clone(SCENES[idx].look), m = metrics(idx);
      p.m = m;
      if (phase === "act") {
        p.arms = "none";
        p.step = SCENES[idx].march ? stride : null;
        p.face = "front";
        human(a, hx, GY, p);
        SCENES[idx].act(a, Math.round(hx), GY, pt, gt, m);
      } else {
        p.arms = "down"; p.face = "right"; p.step = stride;
        human(a, hx, GY, p);
      }

      ctx.clearRect(0, 0, W, H);
      for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) {
        var c = a[yy][xx]; if (!c) continue;
        ctx.fillStyle = c; ctx.fillRect(ox + xx * cell, oy + yy * cell, cell + 0.6, cell + 0.6);
      }
    }

    function update(dt) {
      strideT += dt; if (strideT > 0.14) { strideT = 0; stride ^= 1; }
      if (phase === "in") {
        pt += dt; hx = lerp(xIn, xc, ease(Math.min(1, pt / IN)));
        if (pt >= IN) { phase = "act"; pt = 0; }
      } else if (phase === "act") {
        pt += dt; hx = xc;
        if (pt >= ACT) { phase = "out"; pt = 0; genThr(); }
      } else {
        pt += dt; hx = lerp(xc, xOut, ease(Math.min(1, pt / OUT)));
        if (pt >= OUT) { setScene((idx + 1) % SCENES.length); phase = "in"; pt = 0; hx = xIn; }
      }
    }
    function frame(now) {
      if (!running) return;
      if (!t0) t0 = now;
      var dt = Math.min(0.05, (now - t0) / 1000); t0 = now; clock += dt;
      update(dt); paint(clock); raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    function paintStatic() {                              // reduced-motion: the "now" phase, frozen
      idx = SCENES.length - 1; setScene(idx);
      phase = "act"; pt = 0.7; hx = xc; stride = 0;
      paint(0.6);
    }

    setScene(0); resize();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 160); });

    if (reduce) { paintStatic(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting && !document.hidden) start(); else stop(); }); }, { threshold: 0.2 }).observe(canvas);
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
