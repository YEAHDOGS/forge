/* Forge landing — panel reveals, parallax-safe, scroll progress.
   transform/opacity only. Honors prefers-reduced-motion. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var panels = document.querySelectorAll('.panel');

  // Staggered clip reveals on panel entry
  if (reduceMotion || !('IntersectionObserver' in window)) {
    panels.forEach(function (p) { p.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    panels.forEach(function (p) { io.observe(p); });
  }

  // Thin scroll progress bar (transform-only)
  var bar = document.querySelector('.progress span');
  var ticking = false;
  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
})();
