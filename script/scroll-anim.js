(function () {
  "use strict";

  var root = document.documentElement;
  var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var FORCE = cfg.forceScrollAnimation !== false;

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  var hint = document.querySelector(".scroll-hint");
  var lastScroll = window.pageYOffset || 0;
  var ticking = false;

  function updateHint() {
    if (!hint) return;
    if (lastScroll > 40) hint.classList.add("md-hint-out");
    else hint.classList.remove("md-hint-out");
  }

  window.addEventListener("scroll", function () {
    lastScroll = window.pageYOffset || root.scrollTop || 0;
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHint();
      ticking = false;
    });
  }, { passive: true });

  updateHint();

  var canObserve = "IntersectionObserver" in window;

  /* Play entrance animations only ONCE per tab session.
     On reload or back-navigation the page renders fully visible
     instantly instead of fading in again (user request). */
  var SEEN_KEY = "mcEntrancePlayed";
  var alreadyPlayed = false;
  try { alreadyPlayed = window.sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { alreadyPlayed = false; }

  var animating = canObserve && (FORCE || !reducedMotion()) && !alreadyPlayed;

  if (!animating) {
    /* Safety net: if the page was restored from the back/forward cache
       mid-animation, make sure every element is visible immediately. */
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      var hidden = document.querySelectorAll(".md-reveal:not(.md-in)");
      for (var i = 0; i < hidden.length; i++) hidden[i].classList.add("md-in");
    });
    return;
  }

  try { window.sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}

  root.classList.add("md-anim");
  if (FORCE && reducedMotion()) root.classList.add("md-anim-forced");

  var TARGETS = [
    ".poster-wrapper",
    ".section-hd",
    ".live-events-section",
    ".news-section",
    ".willow-live-section",
    ".sony-liv-section",
    ".fancode-section",
    ".world-sports-section",
    ".mf-footer",
    ".md-card"
  ].join(",");

  var pending = [];

  function show(el) {
    if (!el || el.classList.contains("md-in")) return;
    var delay = 0;
    if (el.classList.contains("md-card") && el.parentElement) {
      var index = Array.prototype.indexOf.call(el.parentElement.children, el);
      delay = Math.min(index, 6) * 110;
    }
    el.style.transitionDelay = delay + "ms";
    el.classList.add("md-in");
    window.setTimeout(function () {
      el.style.transitionDelay = "";
    }, delay + 1100);
  }

  var io = canObserve ? new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      show(entries[i].target);
      io.unobserve(entries[i].target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }) : null;

  function register(el) {
    if (!el || el.nodeType !== 1 || el.classList.contains("md-reveal")) return;
    el.classList.add("md-reveal");
    pending.push(el);
    if (io) io.observe(el);
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches && node.matches(TARGETS)) register(node);
    if (!node.querySelectorAll) return;
    var found = node.querySelectorAll(TARGETS);
    for (var i = 0; i < found.length; i++) register(found[i]);
  }

  function rescue() {
    var h = window.innerHeight || root.clientHeight || 0;
    for (var i = pending.length - 1; i >= 0; i--) {
      var el = pending[i];
      if (!el.isConnected) { pending.splice(i, 1); continue; }
      if (el.classList.contains("md-in")) { pending.splice(i, 1); continue; }
      var r = el.getBoundingClientRect();
      if (r.top < h * 1.05 && r.bottom > -40) {
        show(el);
        pending.splice(i, 1);
      }
    }
  }

  var rescueTicking = false;
  window.addEventListener("scroll", function () {
    if (rescueTicking) return;
    rescueTicking = true;
    window.requestAnimationFrame(function () {
      rescue();
      rescueTicking = false;
    });
  }, { passive: true });

  scan(document.body || root);

  ["willowLiveTrack", "sonyLivTrack", "fancodeTrack", "worldSportsTrack", "footballTrack", "cricketTrack", "landingNewsTrack"].forEach(function (id) {
    var track = document.getElementById(id);
    if (!track || !window.MutationObserver) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, scan);
      });
      window.requestAnimationFrame(rescue);
    }).observe(track, { childList: true });
  });

  window.setInterval(rescue, 2500);
  window.setTimeout(rescue, 400);
  window.setTimeout(function () { scan(document.body || root); rescue(); }, 1200);
  window.addEventListener("load", function () { window.setTimeout(rescue, 300); });

  var posterArt = document.querySelector(".poster-art");
  var hero = document.getElementById("posterWrapper");

  if (posterArt && hero && window.innerWidth > 760) {
    var heroTicking = false;
    window.addEventListener("scroll", function () {
      if (heroTicking) return;
      heroTicking = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset || root.scrollTop || 0;
        if (y < window.innerHeight) {
          posterArt.style.transform = "translate3d(0," + (-y * 0.05).toFixed(2) + "px,0) scale(1.06)";
        }
        heroTicking = false;
      });
    }, { passive: true });
  }
})();
