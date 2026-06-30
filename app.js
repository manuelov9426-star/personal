// Manuel Oviedo — progressive enhancement (reveal, boil, cursor)
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveal (content is visible by default; this only animates it in)
  var items = [].slice.call(document.querySelectorAll('.rv'));
  if (!reduce && 'IntersectionObserver' in window) {
    var seen = function (n) { n.classList.add('in'); };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top < (innerHeight || 800) * 0.95) seen(n); else io.observe(n);
    });
    // failsafe for environments that pause transitions
    setTimeout(function () {
      items.forEach(function (n) {
        n.classList.add('in');
        if (parseFloat(getComputedStyle(n).opacity) < 0.9) { n.style.transition = 'none'; n.style.opacity = '1'; n.style.transform = 'none'; }
      });
    }, 1200);
  } else {
    items.forEach(function (n) { n.classList.add('in'); });
  }

  // "Boil" living-line animation
  if (!reduce) {
    var i = 1;
    setInterval(function () { i = (i % 3) + 1; document.documentElement.dataset.boil = String(i); }, 130);
  } else { document.documentElement.dataset.boil = '1'; }

  // Custom cursor (fine pointers only)
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot); document.body.appendChild(ring);
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; dot.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }, { passive: true });
    (function loop() { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
    var sel = 'a, button, [role=button]';
    addEventListener('pointerover', function (e) { if (e.target.closest(sel)) document.body.dataset.cursor = 'link'; });
    addEventListener('pointerout', function (e) { if (e.target.closest(sel)) delete document.body.dataset.cursor; });
  }
})();
