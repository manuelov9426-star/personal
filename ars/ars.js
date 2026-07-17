/* Ars — la señal que se separa del ruido + tira arrastrable + reveals.
   Vanilla, sin dependencias. Respeta prefers-reduced-motion. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- momento firma: ruido → señal ---------- */
  var svg = document.querySelector(".signal");
  if (svg) {
    var line = svg.querySelector("polyline");
    var caret = svg.querySelector(".caret");
    var W = 1200, N = 120;
    var seed = 20260716;
    function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
    var noisy = [], clean = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);
      var ease = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var y = 84 - 24 * ease;
      clean.push(y);
      noisy.push(y + (rnd() * 2 - 1) * 28 * (1 - t * 0.35));
    }
    var paint = function (k) {
      var pts = "";
      for (var i = 0; i < N; i++) {
        pts += ((i / (N - 1)) * W).toFixed(1) + "," + (clean[i] + (noisy[i] - clean[i]) * k).toFixed(1) + " ";
      }
      line.setAttribute("points", pts);
    };
    var finish = function () {
      caret.setAttribute("x", W - 10);
      caret.setAttribute("y", (clean[N - 1] - 9).toFixed(1));
      caret.classList.add("on");
    };
    var running = false;
    var play = function () {
      if (running) return;
      if (reduce) { paint(0); finish(); return; }
      running = true;
      caret.classList.remove("on");
      var t0 = null, DUR = 1600;
      var frame = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / DUR);
        paint(1 - (1 - Math.pow(1 - p, 3)));
        if (p < 1) { requestAnimationFrame(frame); }
        else { running = false; finish(); }
      };
      setTimeout(function () { requestAnimationFrame(frame); }, 400);
    };
    paint(reduce ? 0 : 1);
    if (reduce) { finish(); } else { play(); }
    var replay = document.querySelector("[data-replay]");
    if (replay) replay.addEventListener("click", play);
  }

  /* ---------- tira de servicios: arrastre con el mouse ---------- */
  document.querySelectorAll(".strip").forEach(function (strip) {
    var down = false, moved = false, startX = 0, startScroll = 0;
    strip.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return; /* táctil ya scrollea nativo */
      down = true; moved = false;
      startX = e.clientX; startScroll = strip.scrollLeft;
      strip.classList.add("dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      strip.scrollLeft = startScroll - dx;
    });
    window.addEventListener("pointerup", function () {
      down = false;
      strip.classList.remove("dragging");
    });
    /* si hubo arrastre, el clic no debe navegar */
    strip.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); moved = false; }
    }, true);
  });

  /* ---------- reveals sutiles ---------- */
  var revealed = document.querySelectorAll(".rv, .strip");
  if (!("IntersectionObserver" in window) || reduce) {
    revealed.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    revealed.forEach(function (el) { io.observe(el); });
  }
})();

/* ---------- campo generativo: señales fluyendo en el hero ----------
   El "video" de la casa sin video: 2D canvas, ~6 curvas, pausado fuera
   de viewport y con prefers-reduced-motion pinta un solo cuadro. */
(function () {
  "use strict";
  var canvas = document.querySelector(".field");
  if (!canvas || !canvas.getContext) return;
  var hero = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var seed = 47;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }

  var LINES = [];
  for (var i = 0; i < 6; i++) {
    LINES.push({
      base: 0.16 + 0.14 * i + rnd() * 0.04,
      a1: 10 + rnd() * 16,
      a2: 4 + rnd() * 7,
      wl: 320 + rnd() * 420,
      sp: (0.12 + rnd() * 0.2) * (rnd() > .5 ? 1 : -1),
      p1: rnd() * 6.28, p2: rnd() * 6.28,
      alpha: 0.07 + rnd() * 0.1,
      amber: i !== 2 /* una línea gris piedra entre las ámbar */
    });
  }

  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.2;
    for (var li = 0; li < LINES.length; li++) {
      var L = LINES[li];
      ctx.strokeStyle = (L.amber ? "rgba(227,168,76," : "rgba(167,158,142,") + L.alpha + ")";
      ctx.beginPath();
      var y0 = L.base * H;
      for (var x = -20; x <= W + 20; x += 14) {
        var y = y0 +
          L.a1 * Math.sin(x / L.wl * 6.28 + t * L.sp + L.p1) +
          L.a2 * Math.sin(x / (L.wl * 0.37) * 6.28 - t * L.sp * 1.6 + L.p2);
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  if (reduce) { draw(2.7); return; }

  var visible = true, running = false;
  function loop(ts) {
    if (!visible || document.hidden) { running = false; return; }
    draw(ts / 1000);
    requestAnimationFrame(loop);
  }
  function ensure() {
    if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(loop); }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting; ensure();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", ensure);
  ensure();
})();

/* ---------- botones magnéticos (un guiño, no un circo) ---------- */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return; /* táctil: no aplica */
  document.querySelectorAll(".btn").forEach(function (btn) {
    var raf = null;
    btn.style.willChange = "transform";
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        btn.style.transform = "translate(" + (dx * 5).toFixed(1) + "px," + (dy * 4).toFixed(1) + "px)";
      });
    });
    btn.addEventListener("pointerleave", function () {
      if (raf) cancelAnimationFrame(raf);
      btn.style.transform = "";
    });
  });
})();
