/* Ars — un solo momento: la señal que se separa del ruido.
   <1KB, vanilla, sin dependencias. Respeta prefers-reduced-motion. */
(function () {
  "use strict";

  var svg = document.querySelector(".signal");
  if (!svg) return;
  var line = svg.querySelector("polyline");
  var caret = svg.querySelector(".caret");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 1200, H = 120, N = 120;

  /* ruido pseudoaleatorio determinista (LCG con semilla fija):
     la línea siempre nace igual — reproducibilidad, como todo aquí */
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

  function paint(k) { /* k=1 ruido puro → k=0 señal pura */
    var pts = "";
    for (var i = 0; i < N; i++) {
      var x = (i / (N - 1)) * W;
      var y = clean[i] + (noisy[i] - clean[i]) * k;
      pts += x.toFixed(1) + "," + y.toFixed(1) + " ";
    }
    line.setAttribute("points", pts);
  }

  function finish() {
    caret.setAttribute("x", W - 10);
    caret.setAttribute("y", (clean[N - 1] - 9).toFixed(1));
    caret.classList.add("on");
  }

  var running = false;
  function play() {
    if (running) return;
    if (reduce) { paint(0); finish(); return; }
    running = true;
    caret.classList.remove("on");
    var t0 = null, DUR = 1600;
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 3);
      paint(1 - eased);
      if (p < 1) { requestAnimationFrame(frame); }
      else { running = false; finish(); }
    }
    setTimeout(function () { requestAnimationFrame(frame); }, 400);
  }

  paint(reduce ? 0 : 1);
  if (reduce) { finish(); } else { play(); }

  /* easter egg silencioso: clic en el prompt del hero la repite */
  var replay = document.querySelector("[data-replay]");
  if (replay) replay.addEventListener("click", play);
})();
