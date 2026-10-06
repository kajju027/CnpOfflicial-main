(function () {
  'use strict';

  const CFG      = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  const APIS     = CFG.apis || {};
  const API_URL  = APIS.worldSports || APIS.world_sports || '';

  const track      = document.getElementById('worldSportsTrack');
  const arrowLeft  = document.getElementById('worldSportsArrowLeft');
  const arrowRight = document.getElementById('worldSportsArrowRight');

  if (!track) return;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusInfo(raw) {
    const s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(s)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(s)) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  function splitSeries(part) {
    return String(part == null ? '' : part)
      .split(/\s+[-\u2013\u2014]\s*|\s*[-\u2013\u2014]\s+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function parseMatchup(title) {
    var t = String(title == null ? '' : title)
      .replace(/\s*\[[^\]]*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return null;

    var parts = t.split(/\s+vs\.?\s+/i);
    if (parts.length < 2) return null;

    var homePart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    var awayPart = parts[parts.length - 1];

    var homeSegs = splitSeries(homePart);
    var awaySegs = splitSeries(awayPart);

    var home = homeSegs.length ? homeSegs[homeSegs.length - 1] : String(homePart).trim();
    var away = awaySegs.length ? awaySegs[0] : String(awayPart).trim();

    if (!home || !away || home.length < 2 || away.length < 2) return null;
    return { home: home, away: away };
  }

  function renderSkeletons(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `
        <div class="md-skeleton" aria-hidden="true">
          <div class="md-skeleton-thumb"></div>
          <div class="md-skeleton-info">
            <div class="md-skeleton-line sm"></div>
            <div class="md-skeleton-line lg"></div>
            <div class="md-skeleton-line md"></div>
          </div>
        </div>`;
    }
    track.innerHTML = html;
  }

  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No events right now</strong>Check back soon.</div>';
      return;
    }

    const fallbackImg = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' +
      '<defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0">' +
      '<stop offset="0" stop-color="#0b1723"/><stop offset="1" stop-color="#1b3648"/>' +
      '</linearGradient></defs>' +
      '<rect width="960" height="540" fill="url(#g)"/>' +
      '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle">WORLD SPORTS</text>' +
      '</svg>'
    );

    let html = '';

    matches.forEach(function (match, cardIndex) {
      const status     = statusInfo(match.status);
      const isLive     = status.className === 'live';
      const isUpcoming = status.className === 'upcoming';
      const isEnded    = status.className === 'ended';
      const rawPageUrl = match.page_url || '';
      const pageUrl    = rawPageUrl
        ? ((CFG.playerBase ? String(CFG.playerBase).replace(/\/+$/, '') : '') +
           (rawPageUrl.charAt(0) === '/' ? rawPageUrl : '/' + rawPageUrl))
        : '';

      const rawTitle   = match.title || match.teams || 'Event';
      const matchup    = parseMatchup(rawTitle);
      const league     = escapeHtml(match.league || match.sport || 'World Sports');
      const imgSrc     = escapeHtml(match.thumbnail || fallbackImg);
      const imgAlt     = escapeHtml(rawTitle);
      const time       = escapeHtml(match.date || match.time || '');
      const safeUrl    = escapeHtml(pageUrl);

      let watchMarkup = '';
      if (!isUpcoming && !isEnded && pageUrl) {
        watchMarkup = `<a class="md-watch-btn" href="${safeUrl}" aria-label="Watch ${imgAlt}">` +
          `<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>WATCH NOW</a>`;
      }

      let matchupHtml = '';
      if (matchup) {
        matchupHtml = `<div class="md-matchup">` +
          `<span class="md-team">${escapeHtml(matchup.home)}</span>` +
          `<span class="md-vs">VS</span>` +
          `<span class="md-team away">${escapeHtml(matchup.away)}</span>` +
          `</div>`;
      } else {
        matchupHtml = `<div class="md-event-title">${escapeHtml(rawTitle)}</div>`;
      }

      html += `
        <article class="md-card md-${status.className}" data-href="${safeUrl}"
                 style="${pageUrl ? 'cursor:pointer' : ''}">
          <div class="md-thumb">
            <img src="${imgSrc}" alt="${imgAlt}" ${cardIndex < 5 ? 'loading="eager"' : 'loading="lazy"'} decoding="async"
                 onerror="this.onerror=null;this.src='${fallbackImg}'">
            <span class="md-status md-${status.className}">${escapeHtml(status.label)}</span>
          </div>
          <div class="md-info">
            <div class="md-tournament">${league}</div>
            ${matchupHtml}
            <div class="md-footer">
              ${time ? `<time class="md-time">${time}</time>` : '<span class="md-time"></span>'}
              ${watchMarkup ? `<div class="md-actions">${watchMarkup}</div>` : ''}
            </div>
          </div>
        </article>`;
    });

    track.innerHTML = html;
  }

  track.addEventListener('click', function (e) {
    const card = e.target.closest('.md-card');
    if (!card) return;
    if (e.target.closest('a, button')) return;
    const href = card.dataset.href;
    if (href && href !== '#') window.location.href = href;
  });

  function fetchWorldSports() {
    if (!API_URL) {
      console.error('[WorldSports] No API URL configured (cfg.apis.worldSports).');
      track.innerHTML = '<div class="md-error"><strong>World Sports feed is not configured</strong>Check script/config.js</div>';
      return;
    }

    renderSkeletons(6);

    fetch(API_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const raw     = data.matches || data.events || data || [];
        const matches = (Array.isArray(raw) ? raw : []).slice(0, 20);
        renderMatches(matches);
      })
      .catch(function (err) {
        console.error('[WorldSports] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Failed to load events</strong></div>';
      });
  }

  function scrollAmount() {
    const card = track.querySelector('.md-card, .md-skeleton');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(track).gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  if (arrowLeft)  arrowLeft.addEventListener('click',  function (e) { e.stopPropagation(); track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }); });
  if (arrowRight) arrowRight.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }); });

  const section = document.getElementById('worldSportsSection');
  let loaded = false;
  let timer  = null;

  function load() {
    if (loaded) return;
    loaded = true;
    fetchWorldSports();
    timer = window.setInterval(function () {
      if (!document.hidden) fetchWorldSports();
    }, 60000);
  }

  if ('IntersectionObserver' in window && section) {
    const obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { load(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    load();
  }

  window.addEventListener('beforeunload', function () { if (timer) window.clearInterval(timer); });
})();
