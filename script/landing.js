/* ═══════════════════════════════════════════════════════════════════════
   MATCH CENTRAL — landing page behaviour
   Ticker · live clock · counters · scroll reveal · sticky header · dock
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var config = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis = config.apis || {};

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ─────────────────────────────────────────────────────────────
     1. IST live clock
     ───────────────────────────────────────────────────────────── */
  function startClock() {
    var clock = document.getElementById('istClock');
    if (!clock) return;

    function tick() {
      try {
        var now = new Date();
        var parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).formatToParts(now).reduce(function (acc, part) {
          acc[part.type] = part.value;
          return acc;
        }, {});
        clock.textContent = parts.hour + ':' + parts.minute + ':' + parts.second + ' IST';
      } catch (error) {
        clock.textContent = '';
      }
    }

    tick();
    window.setInterval(tick, 1000);
  }

  /* ─────────────────────────────────────────────────────────────
     2. Live scores ticker (cricket + football feeds)
     ───────────────────────────────────────────────────────────── */
  function buildTickerItem(event) {
    var ev = event || {};
    var info = ev.event || {};
    var home = info.teamA || info.home_team || info.team1 || ev.team_1 || '';
    var away = info.teamB || info.away_team || ev.team2 || ev.team_2 || '';
    var league = info.type || info.category || info.name || '';
    var status = String(ev.status || '').toLowerCase();
    var label = status === 'live' ? 'LIVE' : status === 'ended' ? 'FT' : 'UPCOMING';

    if (!home && !away) return '';

    return '' +
      '<span class="ticker-item' + (status === 'live' ? ' ticker-item--live' : '') + '" role="listitem">' +
        (league ? '<span class="ticker-league">' + escapeHtml(league) + '</span>' : '') +
        '<strong>' + escapeHtml(home) + '</strong>' +
        '<span>vs</span>' +
        '<strong>' + escapeHtml(away) + '</strong>' +
        '<span>·</span>' +
        '<span>' + label + '</span>' +
      '</span>';
  }

  function loadTicker() {
    var track = document.getElementById('tickerTrack');
    if (!track) return;

    var sources = [apis.cricket, apis.football].filter(Boolean);
    if (!sources.length) return;

    var fallback = track.innerHTML;

    function extract(payload) {
      if (Array.isArray(payload)) return payload;
      if (!payload || typeof payload !== 'object') return [];
      if (Array.isArray(payload.events)) return payload.events;
      if (Array.isArray(payload.matches)) return payload.matches;
      if (payload.data && Array.isArray(payload.data.events)) return payload.data.events;
      return [];
    }

    Promise.all(sources.map(function (url) {
      return fetch(url, { cache: 'no-store' })
        .then(function (response) { return response.ok ? response.json() : []; })
        .then(extract)
        .catch(function () { return []; });
    })).then(function (lists) {
      var merged = [];
      lists.forEach(function (list) { merged = merged.concat(list); });

      if (!merged.length) {
        track.innerHTML = fallback;
        return;
      }

      var live = merged.filter(function (item) {
        return String(item && item.status || '').toLowerCase() === 'live';
      });
      var rest = merged.filter(function (item) {
        return String(item && item.status || '').toLowerCase() !== 'live';
      });

      var ordered = live.concat(rest).slice(0, 14);
      var markup = ordered.map(buildTickerItem).join('');
      if (!markup) {
        track.innerHTML = fallback;
        return;
      }

      /* Duplicated once so the marquee loops seamlessly (-50% translate). */
      track.innerHTML = markup + markup;
    }).catch(function () {
      track.innerHTML = fallback;
    });
  }

  /* ─────────────────────────────────────────────────────────────
     3. Animated stat counters
     ───────────────────────────────────────────────────────────── */
  function startCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────────
     4. Scroll reveal
     ───────────────────────────────────────────────────────────── */
  function startReveal() {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, index) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = Math.min(index * 70, 280);
        window.setTimeout(function () { el.classList.add('is-visible'); }, delay);
        observer.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ─────────────────────────────────────────────────────────────
     5. Sticky header + back-to-top + mobile dock
     ───────────────────────────────────────────────────────────── */
  function startScrollUi() {
    var header = document.getElementById('siteHeader');
    var toTop = document.getElementById('toTop');
    var dock = $('.mobile-dock');
    var ticking = false;

    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;

      if (header) header.classList.toggle('is-stuck', y > 12);
      if (toTop) toTop.classList.toggle('is-visible', y > 620);
      if (dock) dock.classList.toggle('is-visible', y > 520);

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     6. Dock active state (scroll spy)
     ───────────────────────────────────────────────────────────── */
  function startSpy() {
    var dockItems = $$('.dock-item');
    if (!dockItems.length || !('IntersectionObserver' in window)) return;

    var targets = [];
    dockItems.forEach(function (item) {
      var id = (item.getAttribute('href') || '').replace('#', '');
      if (!id) return;
      var section = document.getElementById(id);
      if (section) targets.push({ item: item, section: section });
    });

    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var match = targets.filter(function (t) { return t.section === entry.target; })[0];
        if (!match) return;
        dockItems.forEach(function (item) { item.classList.remove('is-active'); });
        match.item.classList.add('is-active');
      });
    }, { threshold: 0.05, rootMargin: '-25% 0px -60% 0px' });

    targets.forEach(function (t) { observer.observe(t.section); });
  }

  /* ─────────────────────────────────────────────────────────────
     7. Hero keyboard navigation
     ───────────────────────────────────────────────────────────── */
  function startHeroKeys() {
    var wrapper = document.getElementById('posterWrapper');
    if (!wrapper) return;

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      var button = event.key === 'ArrowLeft' ? document.getElementById('arrowLeft') : document.getElementById('arrowRight');
      if (button && !button.hidden) {
        event.preventDefault();
        button.click();
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     BOOT
     ───────────────────────────────────────────────────────────── */
  function init() {
    startClock();
    loadTicker();
    startCounters();
    startReveal();
    startScrollUi();
    startSpy();
    startHeroKeys();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
