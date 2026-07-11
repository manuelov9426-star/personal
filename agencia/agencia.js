/* SIRIO — microinteracciones. Todo degrada bien sin JS y respeta prefers-reduced-motion. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reveal al hacer scroll */
  var revealed = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window) || reduce) {
    revealed.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealed.forEach(function (el) { io.observe(el); });
  }

  /* Efecto "escritura" en los prompts del hero.
     El texto real vive en el HTML (accesible y visible sin JS);
     aquí solo se re-escribe con cadencia de terminal. */
  document.querySelectorAll("[data-typed]").forEach(function (el) {
    if (reduce) return;
    var full = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", full);
    var i = 0;
    (function tick() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        setTimeout(tick, 34 + Math.floor(i % 3) * 22);
      }
    })();
  });

  /* Reloj local en el statusline */
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var paint = function () {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, "0");
      var mm = String(d.getMinutes()).padStart(2, "0");
      clock.textContent = "local " + hh + ":" + mm;
    };
    paint();
    setInterval(paint, 30000);
  }
})();
