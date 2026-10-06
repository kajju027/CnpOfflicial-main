/* =====================================================================
   matchdekho — scroll animations  (v3.1, new file)
   ---------------------------------------------------------------------
   What it does
   1. Reveals sections and match cards with a soft fade + rise as they
      scroll into view (cards inside a row are staggered).
   2. Fades the "SCROLL" hint away as soon as the visitor scrolls.
   3. Slides the hero poster slightly while the top of the page scrolls.

   Safety rules
   * Everything starts hidden only AFTER this file adds .md-anim to <html>.
     If JavaScript is blocked/off, or the file is not loaded, all content
     is visible — the page can never end up blank.
   * If the visitor has "reduce motion" enabled, the file does nothing.
   * Newly injected cards (the three sections render after their feed
     arrives) are picked up by a MutationObserver.
   ===================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;

  function prefersReducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  /* ---------------------------------------------------------------
   * Scroll hint: hide once the page is scrolled (works everywhere,
   * even in old browsers / reduced motion).
   * ------------------------------------------------------------ */
  var hint = document.querySelector('.scroll-hint');
  var lastKnownScroll = 0;
  var ticking = false;

  function updateHint() {
    if (!hint) return;
    if (lastKnownScroll > 40) hint.classList.add('md-hint-out');
    else hint.classList.remove('md-hint-out');
  }

  window.addEventListener('scroll', function () {
    lastKnownScroll = window.pageYOffset || root.scrollTop || 0;
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHint();
      ticking = false;
    });
  }, { passive: true });

  updateHint();

  /* No IntersectionObserver or reduced motion → stop here.
     (No element ever gets hidden, so the page stays fully visible.) */
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

  root.classList.add('md-anim');

  var TARGETS = [
    '.poster-wrapper',
    '.section-hd',
    '.willow-live-section',
    '.fancode-section',
    '.world-sports-section',
    '.md-card'
  ].join(',');

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (!entry.isIntersecting) continue;

      var el    = entry.target;
      var delay = 0;

      /* Stagger the cards of a row: 0 ms, 70 ms, 140 ms ... */
      if (el.classList.contains('md-card') && el.parentElement) {
        var index = Array.prototype.indexOf.call(el.parentElement.children, el);
        delay = Math.min(index, 6) * 70;
      }

      el.style.transitionDelay = delay + 'ms';
      el.classList.add('md-in');

      /* clear the delay afterwards so hover transitions stay snappy */
      window.setTimeout(function (node) {
        return function () { node.style.transitionDelay = ''; };
      }(el), delay + 900);

      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  function register(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.classList.contains('md-reveal')) return;
    el.classList.add('md-reveal');
    io.observe(el);
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches && node.matches(TARGETS)) register(node);
    if (!node.querySelectorAll) return;
    var found = node.querySelectorAll(TARGETS);
    for (var i = 0; i < found.length; i++) register(found[i]);
  }

  scan(document.body || root);

  /* Cards arrive later (feeds are fetched with fetch()). Watch the tracks. */
  ['willowLiveTrack', 'fancodeTrack', 'worldSportsTrack'].forEach(function (id) {
    var track = document.getElementById(id);
    if (!track || !window.MutationObserver) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, scan);
      });
    }).observe(track, { childList: true });
  });

  /* The three sections are lazy-loaded when they scroll into view, so
     their skeletons also arrive late — one extra scan covers them. */
  window.setTimeout(function () { scan(document.body || root); }, 1200);

  /* ---------------------------------------------------------------
   * Very light hero parallax (max 14 px, disabled on small screens)
   * ------------------------------------------------------------ */
  var posterArt = document.querySelector('.poster-art');
  var hero = document.getElementById('posterWrapper');

  if (posterArt && hero && window.innerWidth > 760) {
    var heroTicking = false;
    window.addEventListener('scroll', function () {
      if (heroTicking) return;
      heroTicking = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset || root.scrollTop || 0;
        if (y < window.innerHeight) {
          posterArt.style.transform =
            'translate3d(0,' + (-y * 0.05).toFixed(2) + 'px,0) scale(1.06)';
        }
        heroTicking = false;
      });
    }, { passive: true });
  }
})();
