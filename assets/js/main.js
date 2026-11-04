/* Mesh Systems — site scripts. No dependencies. */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  function setMenu(open) {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) mobileMenu.removeAttribute("inert"); else mobileMenu.setAttribute("inert", "");
  }
  if (toggle && mobileMenu) {
    mobileMenu.setAttribute("inert", "");
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1080) setMenu(false);
    });
  }
  document.querySelectorAll(".mm-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sub = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      if (sub) sub.classList.toggle("is-open", open);
    });
  });

  /* ---------- Desktop services dropdown (touch + keyboard) ---------- */
  document.querySelectorAll(".nav__item--has-menu").forEach(function (item) {
    var btn = item.querySelector(".nav__link");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setMenu(false);
    document.querySelectorAll(".nav__item--has-menu.is-open").forEach(function (item) {
      item.classList.remove("is-open");
      var b = item.querySelector(".nav__link");
      b.setAttribute("aria-expanded", "false");
      b.focus();
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.01 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Hero mesh network animation ----------
     The canvas re-measures itself whenever its box changes size (fonts loading,
     text reflowing, phone rotation), so the drawing is never stretched.
     Movement is time-based, so it runs at the same speed on 60Hz and 120Hz screens. */
  var canvas = document.querySelector(".hero__canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var nodes = [], w = 0, h = 0, dpr = 1, link = 150, running = false, raf = 0, last = 0, inView = true;
    var BUCKETS = 6, MAX_ALPHA = 0.36;

    function targetCount() {
      var perNode = w < 700 ? 9500 : 16000;
      return Math.round(Math.min(80, Math.max(20, (w * h) / perNode)));
    }
    function makeNode() {
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14, // px per second
        hub: Math.random() < 0.14, r: Math.random() < 0.14 ? 2.4 : 1.4,
        phase: Math.random() * Math.PI * 2
      };
    }
    function fit() {
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (!cw || !ch || (cw === w && ch === h && ratio === dpr)) return false;
      var sx = w ? cw / w : 1, sy = h ? ch / h : 1;
      w = cw; h = ch; dpr = ratio;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      link = w < 700 ? 135 : 160;
      for (var i = 0; i < nodes.length; i++) { nodes[i].x *= sx; nodes[i].y *= sy; }
      var target = targetCount();
      while (nodes.length < target) nodes.push(makeNode());
      if (nodes.length > target) nodes.length = target;
      return true;
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var link2 = link * link, i, j, a, b, dx, dy, d2, alpha, k;
      // Group lines into a few opacity levels so each level is one stroke call.
      var buckets = [];
      for (k = 0; k < BUCKETS; k++) buckets.push([]);
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; if (dx > link || dx < -link) continue;
          dy = a.y - b.y; if (dy > link || dy < -link) continue;
          d2 = dx * dx + dy * dy;
          if (d2 >= link2) continue;
          alpha = (1 - Math.sqrt(d2) / link) * ((a.hub || b.hub) ? MAX_ALPHA : MAX_ALPHA / 2);
          k = Math.min(BUCKETS - 1, Math.floor((alpha / MAX_ALPHA) * BUCKETS));
          buckets[k].push(a.x, a.y, b.x, b.y);
        }
      }
      ctx.lineWidth = 1;
      for (k = 0; k < BUCKETS; k++) {
        var seg = buckets[k];
        if (!seg.length) continue;
        ctx.strokeStyle = "rgba(143,189,232," + (((k + 0.5) / BUCKETS) * MAX_ALPHA).toFixed(3) + ")";
        ctx.beginPath();
        for (var s = 0; s < seg.length; s += 4) { ctx.moveTo(seg[s], seg[s + 1]); ctx.lineTo(seg[s + 2], seg[s + 3]); }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(200,220,240,0.55)";
      ctx.beginPath();
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (a.hub) continue;
        ctx.moveTo(a.x + a.r, a.y);
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      }
      ctx.fill();
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!a.hub) continue;
        var pulse = (Math.sin(t / 900 + a.phase) + 1) / 2, size = 14 + pulse * 6;
        ctx.fillStyle = "rgba(61,133,198," + (0.12 + pulse * 0.18).toFixed(3) + ")";
        ctx.fillRect(a.x - size / 2, a.y - size / 2, size, size);
        ctx.fillStyle = "#3d85c6";
        ctx.fillRect(a.x - 3, a.y - 3, 6, 6);
      }
    }

    function step(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx * dt; n.y += n.vy * dt;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
      draw(now);
      if (running) raf = requestAnimationFrame(step);
    }
    function start() {
      if (running || reduceMotion || !inView || document.hidden || !w) return;
      running = true; last = 0; raf = requestAnimationFrame(step);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function refit() {
      if (fit()) {
        draw(performance.now());
        canvas.classList.add("is-ready");
        start();
      }
    }

    refit();
    if ("ResizeObserver" in window) {
      new ResizeObserver(refit).observe(canvas);
    } else {
      window.addEventListener("resize", refit);
      window.addEventListener("load", refit);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else stop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ---------- Segmented buttons helper ---------- */
  function pressGroup(buttons, active) {
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === active)); });
  }

  /* ---------- Lighting scenes demo ---------- */
  var SCENES = {
    bright: { main: 1, accent: 1, lamp: 1, screen: 0, wall: 1, room: "#2a3a55", label: "Bright: everything at 100%" },
    relax: { main: 0.25, accent: 0.75, lamp: 1, screen: 0, wall: 0.6, room: "#1c2638", label: "Relax: lamps and wall lights, ceiling down low" },
    film: { main: 0, accent: 0.18, lamp: 0.12, screen: 1, wall: 0, room: "#111826", label: "Film: lights dim, the screen takes over" },
    off: { main: 0, accent: 0, lamp: 0, screen: 0, wall: 0, room: "#0d1420", label: "Off: the whole room, one button" }
  };
  document.querySelectorAll(".light-demo").forEach(function (demo) {
    var buttons = demo.querySelectorAll("[data-scene]");
    var room = demo.querySelector(".l-room");
    var status = demo.querySelector("[data-scene-status]");
    function apply(name, btn) {
      var s = SCENES[name]; if (!s) return;
      ["main", "accent", "lamp", "screen", "wall"].forEach(function (k) { demo.style.setProperty("--" + k, s[k]); });
      if (room) room.setAttribute("fill", s.room);
      if (status) status.textContent = s.label;
      pressGroup(buttons, btn);
    }
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () { apply(btn.getAttribute("data-scene"), btn); });
    });
    apply("relax", demo.querySelector('[data-scene="relax"]'));
  });

  /* ---------- Blinds demo ---------- */
  document.querySelectorAll(".blind-demo").forEach(function (demo) {
    var range = demo.querySelector("input[type=range]");
    var fabric = demo.querySelectorAll("[data-blind]");
    var hem = demo.querySelectorAll("[data-hem]");
    var presets = demo.querySelectorAll("[data-blind-to]");
    var status = demo.querySelector("[data-blind-status]");
    var current = Number(range ? range.value : 35), target = current, anim = 0;
    var MAXH = Number(demo.getAttribute("data-max") || 200);
    var TOP = Number(demo.getAttribute("data-top") || 0);
    function render(v) {
      var hpx = (v / 100) * MAXH;
      fabric.forEach(function (f) { f.setAttribute("height", Math.max(4, hpx).toFixed(1)); });
      hem.forEach(function (r) { r.setAttribute("y", (TOP + Math.max(4, hpx) - 4).toFixed(1)); });
      if (status) status.textContent = v < 3 ? "Fully open" : v > 97 ? "Fully closed" : Math.round(v) + "% closed";
    }
    function animateTo(v) {
      target = v; cancelAnimationFrame(anim);
      if (reduceMotion) { current = v; render(v); return; }
      (function tick() {
        current += (target - current) * 0.12;
        if (Math.abs(target - current) < 0.3) current = target;
        render(current);
        if (current !== target) anim = requestAnimationFrame(tick);
      })();
    }
    if (range) range.addEventListener("input", function () { pressGroup(presets, null); animateTo(Number(range.value)); });
    presets.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = Number(btn.getAttribute("data-blind-to"));
        if (range) range.value = v;
        pressGroup(presets, btn);
        animateTo(v);
      });
    });
    render(current);
  });

  /* ---------- WiFi before/after demo ---------- */
  document.querySelectorAll(".wifi-demo").forEach(function (demo) {
    var buttons = demo.querySelectorAll("[data-wifi]");
    var status = demo.querySelector("[data-wifi-status]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var before = btn.getAttribute("data-wifi") === "before";
        demo.classList.toggle("is-before", before);
        if (status) status.textContent = before
          ? "One router in the corner, plus plug-in boosters: patchy upstairs, dead spots in the garden"
          : "Wired access points placed from a heat-map survey: strong signal in every room";
        pressGroup(buttons, btn);
      });
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var statusBox = document.getElementById("form-status");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setError(field, msg) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("has-error", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      var err = wrap.querySelector(".field__error");
      if (err) err.textContent = msg || "";
    }
    function validate() {
      var ok = true, first = null;
      ["name", "email", "message"].forEach(function (id) {
        var f = form.elements[id]; var v = (f.value || "").trim(); var msg = "";
        if (!v) msg = id === "name" ? "Please tell us your name." : id === "email" ? "Please add your email address." : "Please tell us a little about your project.";
        else if (id === "email" && !emailRe.test(v)) msg = "That email address doesn't look quite right.";
        setError(f, msg);
        if (msg) { ok = false; if (!first) first = f; }
      });
      if (first) first.focus();
      return ok;
    }
    function collect() {
      var services = Array.prototype.slice.call(form.querySelectorAll('input[name="services"]:checked')).map(function (c) { return c.value; });
      return {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        location: form.elements.location.value.trim(),
        stage: form.elements.stage.value,
        services: services.join(", "),
        message: form.elements.message.value.trim()
      };
    }
    function show(kind, html) {
      statusBox.className = "form-status is-visible form-status--" + kind;
      statusBox.innerHTML = html;
      statusBox.focus();
    }
    form.addEventListener("input", function (e) {
      if (e.target.closest(".field.has-error")) setError(e.target, "");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var data = collect();
      var endpoint = form.getAttribute("data-endpoint");

      if (endpoint) {
        // Optional: post to a form service (e.g. Formspree) if one is configured.
        var btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); show("ok", "<strong>Thanks, " + escapeHtml(data.name.split(" ")[0]) + ".</strong> Your message is on its way. We'll be in touch shortly."); })
          .catch(function () { show("err", "Sorry, something went wrong sending that. Please email <a href=\"mailto:info@meshsystems.co.uk\">info@meshsystems.co.uk</a> or call 01737 448049."); })
          .then(function () { btn.disabled = false; });
        return;
      }

      // Default: open the visitor's email app with the enquiry filled in.
      var lines = [
        "Name: " + data.name,
        "Email: " + data.email,
        data.phone ? "Phone: " + data.phone : "",
        data.location ? "Location: " + data.location : "",
        data.stage ? "Project stage: " + data.stage : "",
        data.services ? "Interested in: " + data.services : "",
        "",
        data.message
      ].filter(function (l, i) { return l !== "" || i === 6; });
      var href = "mailto:info@meshsystems.co.uk?subject=" + encodeURIComponent("Website Enquiry") + "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      show("ok", "<strong>Nearly there.</strong> Your email app should open with your message ready to send. If it doesn't, email <a href=\"mailto:info@meshsystems.co.uk\">info@meshsystems.co.uk</a> or call 01737 448049.");
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
})();
