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
