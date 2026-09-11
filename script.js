/* Forge landing — reveal on scroll, sticky mobile CTA.
   transform/opacity only. Honors prefers-reduced-motion. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll reveals
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Sticky mobile CTA: show after the hero, hide near the final CTA
  var sticky = document.getElementById('stickyCta');
  var hero = document.querySelector('.hero');
  var finalCta = document.querySelector('.final-cta');
  if (sticky && hero) {
    var link = sticky.querySelector('a');
    var onScroll = function () {
      var pastHero = window.scrollY > hero.offsetHeight - 80;
      var nearEnd = finalCta
        ? (window.scrollY + window.innerHeight > finalCta.offsetTop - 40)
        : false;
      var show = pastHero && !nearEnd;
      sticky.classList.toggle('show', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      link.tabIndex = show ? 0 : -1;
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () { onScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
    onScroll();
  }
})();
