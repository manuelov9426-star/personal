// Manuel Oviedo — progressive enhancement (reveal, count-up, boil, cursor)
(function () {
  window.__revealArmed = true; // tells the head guard that JS is alive
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Auto-stagger: cascade .rv children inside grid-like groups ---
  var groups = '.svc-grid, .why-grid, .proceso, .galeria, .amores-grid, .toolbox-grid, .notes-grid, .story-list, .stats, .quien-fotos';
  [].forEach.call(document.querySelectorAll(groups), function (group) {
    var kids = [].slice.call(group.children), n = 0;
    kids.forEach(function (kid) {
      var el = kid.classList.contains('rv') ? kid : null;
      if (el) { el.style.transitionDelay = Math.min(n * 0.09, 0.6) + 's'; n++; }
    });
  });

  // --- Scroll reveal (content visible by default; this only animates it in).
  // Uses a scroll listener (more reliable than IntersectionObserver inside
  // embeds/iframes). Below-the-fold items reveal as they enter the viewport. ---
  function countUp(el) {
    if (el.__counted) return; el.__counted = true;
    var raw = el.getAttribute('data-value') || el.textContent;
    var m = raw.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) return;
    var prefix = m[1], numStr = m[2], suffix = m[3];
    var target = parseFloat(numStr.replace(/,/g, ''));
    var decimals = (numStr.split('.')[1] || '').length;
    if (!isFinite(target)) return;
    if (reduce) { el.textContent = prefix + numStr + suffix; return; }
    var dur = 1400, start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = (target * eased).toFixed(decimals);
      el.textContent = prefix + Number(val).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = prefix + numStr + suffix;
    }
    requestAnimationFrame(frame);
  }
  [].forEach.call(document.querySelectorAll('.stat-value'), function (el) {
    el.setAttribute('data-value', el.textContent);
  });

  var items = [].slice.call(document.querySelectorAll('.rv'));
  if (reduce) {
    items.forEach(function (n) { n.classList.add('in'); });
  } else {
    var pending = items.slice();
    function revealNow(n) {
      n.classList.add('in');
      [].forEach.call(n.querySelectorAll('.stat-value'), countUp);
      if (n.classList.contains('stat')) [].forEach.call(n.querySelectorAll('.stat-value'), countUp);
    }
    function reveal() {
      var h = innerHeight || 800;
      pending = pending.filter(function (n) {
        var r = n.getBoundingClientRect();
        if (r.top < h * 0.9 && r.bottom > -60) { revealNow(n); return false; }
        return true;
      });
      if (!pending.length) { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); }
    }
    var raf = 0;
    function onScroll() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; reveal(); }); }
    reveal();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    // Second, independent trigger for reliability across browsers/embeds.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { revealNow(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      items.forEach(function (n) { io.observe(n); });
    }
    // Rescue: if transitions are paused (capture tools) an .in item can stay at
    // opacity 0 — force it visible. Untouched items still reveal on scroll.
    setTimeout(function () {
      items.forEach(function (n) {
        if (n.classList.contains('in') && parseFloat(getComputedStyle(n).opacity) < 0.9) {
          n.style.transition = 'none'; n.style.opacity = '1'; n.style.transform = 'none';
        }
      });
    }, 1600);
  }

  // --- "Boil" living-line animation ---
  if (!reduce) {
    var i = 1;
    setInterval(function () { i = (i % 3) + 1; document.documentElement.dataset.boil = String(i); }, 130);
  } else { document.documentElement.dataset.boil = '1'; }

  // --- Subtle parallax drift on hero portrait (fine pointers, desktop) ---
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    var portrait = document.querySelector('.hero-portrait, .hero-figure figure');
    if (portrait) {
      addEventListener('pointermove', function (e) {
        var dx = (e.clientX / innerWidth - .5) * 10, dy = (e.clientY / innerHeight - .5) * 10;
        portrait.style.setProperty('--drift', 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)');
      }, { passive: true });
    }
  }

  // --- Custom cursor (fine pointers only) ---
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
