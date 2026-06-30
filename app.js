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
      if (complete === q.length) { el.textContent = text; if (done) done(); }
      else { frame++; requestAnimationFrame(update); }
    }
    update();
  }
  function startScramble() {
    var spans = $$(".hero-name .scramble");
    spans.forEach(function (el, i) { setTimeout(function () { scrambleEl(el); }, 220 + i * 130); });
  }

  /* ============================================================
     SHARED rAF LOOP — custom cursor + magnetic
     ============================================================ */
  var loopItems = [];        // magnetic elements {el, cx, cy, tx, ty}
  var cursor = { el: $(".cursor"), x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, on: false };
  var pointer = { x: innerWidth / 2, y: innerHeight / 2 };

  if (finePointer && !reduce) {
    document.body.classList.add("cursor-on");
    cursor.on = true;
    window.addEventListener("mousemove", function (e) { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
    // grow cursor over interactive things
    var growSel = "a, button, input, [data-magnetic], .work-item, .term-chips button";
    document.addEventListener("mouseover", function (e) { if (e.target.closest(growSel)) cursor.el.classList.add("grow"); });
    document.addEventListener("mouseout", function (e) { if (e.target.closest(growSel)) cursor.el.classList.remove("grow"); });

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
    if (cursor.on) {
      cursor.x = lerp(cursor.x, pointer.x, 0.2);
      cursor.y = lerp(cursor.y, pointer.y, 0.2);
      cursor.el.style.transform = "translate3d(" + cursor.x + "px," + cursor.y + "px,0)";
    }
    for (var i = 0; i < loopItems.length; i++) {
      var it = loopItems[i];
      it.cx = lerp(it.cx, it.tx, 0.18);
      it.cy = lerp(it.cy, it.ty, 0.18);
      it.el.style.transform = Math.abs(it.cx) < 0.05 && Math.abs(it.cy) < 0.05 && !it.hover ? "" : "translate(" + it.cx + "px," + it.cy + "px)";
    }
    requestAnimationFrame(frame);
  }
  if (finePointer && !reduce) requestAnimationFrame(frame);

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
     MANIFESTO — word-by-word opacity reveal on scroll
     ============================================================ */
  (function () {
    var line = $(".manifesto-line");
    if (!line || reduce) return;
    // wrap words, preserving the .kw element
    var words = [];
    var nodes = Array.prototype.slice.call(line.childNodes);
    line.innerHTML = "";
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (tok.trim() === "") { line.appendChild(document.createTextNode(tok)); return; }
          var s = document.createElement("span"); s.className = "word"; s.textContent = tok;
          line.appendChild(s); words.push(s);
        });
      } else { node.classList && node.classList.add("word"); line.appendChild(node); words.push(node); }
    });
    words.forEach(function (w) { w.style.color = "var(--fg-faint)"; });
    var ticking = false;
    function paint() {
      var r = line.getBoundingClientRect();
      var p = clamp((innerHeight * 0.9 - r.top) / (innerHeight * 0.65), 0, 1);
      var n = words.length, lit = p * n;
      for (var i = 0; i < n; i++) words[i].style.color = i < lit ? "var(--fg)" : "var(--fg-faint)";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(paint); ticking = true; } }, { passive: true });
    paint();
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
    var body = $("#term-body"), input = $("#term-input"), chips = $("#term-chips");
    if (!body) return;

    function scrollToId(id) {
      var t = $(id); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    function el(html, cls) { var d = document.createElement("div"); d.className = cls || ""; d.innerHTML = html; return d; }
    function printPrompt(cmd) { body.appendChild(el('<span class="term-prompt">akshat@polygon ~ %</span> <span class="term-cmd">' + esc(cmd) + "</span>", "term-line")); }
    function printOut(html) { var o = el(html, "term-out"); body.appendChild(o); return o; }
    function esc(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function scrollBody() { body.scrollTop = body.scrollHeight; }

    var COMMANDS = {
      whoami: function () { printOut("Akshat Gada — DevRel engineer at Polygon. I lead agentic payments: giving AI agents a wallet, an identity, and the ability to pay over x402, settling onchain in stablecoins."); },
      help: function () { printOut("commands: <span class='key'>whoami</span> · <span class='key'>ls</span> · <span class='key'>work</span> · <span class='key'>focus</span> · <span class='key'>stack</span> · <span class='key'>pay --x402</span> · <span class='key'>cat about</span> · <span class='key'>socials</span> · <span class='key'>contact</span> · <span class='key'>clear</span><br><span class='hsmall'>↑/↓ history · tab autocompletes</span>"); },
      ls: function () { printOut("<span class='key'>sections/</span> work · focus · about · contact<br><span class='key'>projects/</span> agent-cli · x402-rs · agent-docs · agentic-services · agentconnect"); },
      work: function () { printOut("5 shipped tools: Polygon Agent CLI, x402-rs, agent docs, Agentic Services, AgentConnect. opening the list…"); scrollToId("#work"); },
      focus: function () { printOut("agentic payments — agents that pay per request over x402, no human at checkout. scrolling…"); scrollToId("#focus"); },
      stack: function () { printOut("x402 · ERC-8004 · Rust · TypeScript · Polygon Chain · Agglayer · MCP · USDC · EIP-3009"); },
      "cat about": function () { printOut("DevRel engineer at Polygon. Joined as an intern, full-time since 2025. I build in the open where agents, payments, and cross-chain meet — and write the proposals and tooling that make all three less painful. opening about…"); scrollToId("#about"); },
      cat: function () { printOut("usage: <span class='key'>cat about</span>"); },
      socials: function () { printOut("<a href='https://x.com/gada_akshat' target='_blank' rel='noopener'>x.com/gada_akshat</a> · <a href='https://github.com/AkshatGada' target='_blank' rel='noopener'>github/AkshatGada</a> · <a href='https://www.linkedin.com/in/akshat-gada-719076228/' target='_blank' rel='noopener'>linkedin</a> · <a href='mailto:agada@polygon.technology'>agada@polygon.technology</a>"); },
      contact: function () { printOut("<a href='https://x.com/gada_akshat' target='_blank' rel='noopener'>x.com/gada_akshat</a> · <a href='https://github.com/AkshatGada' target='_blank' rel='noopener'>github/AkshatGada</a> · <a href='https://www.linkedin.com/in/akshat-gada-719076228/' target='_blank' rel='noopener'>linkedin</a>"); scrollToId("#contact"); },
      clear: function () { body.innerHTML = ""; },
      "pay --x402": function () { payFlow(); },
      pay: function () { payFlow(); },
      "sudo nap": function () { printOut("<span class='warn'>nap.exe</span> denied — the agents still need me. soon. 😴"); },
      sudo: function () { printOut("<span class='warn'>nice try.</span> type <span class='key'>sudo nap</span>."); }
    };

    function payFlow() {
      var lines = [
        "<span class='term-prompt'>agent  →</span> GET /v1/inference",
        "<span class='term-prompt'>service→</span> <span class='warn'>402 Payment Required</span> · 0.01 USDC",
        "<span class='term-prompt'>agent  →</span> X-PAYMENT signed · <span class='key'>EIP-3009</span>",
        "<span class='term-prompt'>facilitator</span> verify → settle onchain",
        "<span class='term-prompt'>service→</span> <span class='ok'>200 OK</span> · paid in 0.8s"
      ];
      var o = printOut(""); var i = 0;
      (function next() {
        if (i >= lines.length) return;
        o.innerHTML += (i ? "<br>" : "") + lines[i]; i++; scrollBody();
        setTimeout(next, reduce ? 0 : 360);
      })();
    }

    function run(raw) {
      var cmd = (raw || "").trim();
      if (!cmd) return;
      printPrompt(cmd);
      var fn = COMMANDS[cmd] || COMMANDS[cmd.toLowerCase()];
      if (fn) fn();
      else printOut("command not found: " + esc(cmd) + " — try <span class='key'>help</span>");
      scrollBody();
    }

    // typewriter the initial whoami output (enhancement)
    if (!reduce) {
      var firstOut = body.querySelector(".term-out");
      if (firstOut) {
        var full = firstOut.textContent; firstOut.textContent = ""; var k = 0;
        (function type() {
          firstOut.textContent = full.slice(0, k); k += 2;
          if (k <= full.length) setTimeout(type, 12); else firstOut.textContent = full;
        })();
      }
    }

    if (chips) chips.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cmd]"); if (!b) return; run(b.getAttribute("data-cmd"));
      if (input) input.focus();
    });

    var COMPLETIONS = ["whoami", "ls", "work", "focus", "stack", "pay --x402", "cat about", "socials", "contact", "help", "clear"];
    var history = [], hi = -1;
    if (input) input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var v = input.value.trim();
        if (v) { if (history[history.length - 1] !== v) history.push(v); }
        hi = history.length;
        run(input.value); input.value = "";
      } else if (e.key === "ArrowUp") {
        if (!history.length) return;
        e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi] || "";
        setTimeout(function () { input.setSelectionRange(input.value.length, input.value.length); }, 0);
      } else if (e.key === "ArrowDown") {
        if (!history.length) return;
        e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || "";
      } else if (e.key === "Tab") {
        e.preventDefault();
        var pre = input.value.trim().toLowerCase();
        if (!pre) return;
        var match = COMPLETIONS.filter(function (c) { return c.indexOf(pre) === 0; })[0];
        if (match) input.value = match;
      }
    });
  }
})();
