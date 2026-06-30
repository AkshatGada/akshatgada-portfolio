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

  /* ---------------- clock ---------------- */
  function tick() {
    var t = new Date();
    var hh = String(t.getHours()).padStart(2, "0");
    var mm = String(t.getMinutes()).padStart(2, "0");
    var s = hh + ":" + mm + " local";
    var a = $("#clock"), b = $("#clock2");
    if (a) a.textContent = s;
    if (b) b.textContent = s;
  }
  tick(); setInterval(tick, 20000);

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
