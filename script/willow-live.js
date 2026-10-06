(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config — pulled from global config object set by config.js
  // ---------------------------------------------------------------------------
  const API_URL     = window.MATCHDEKHO_CONFIG.apis.willowLive;
  const PLAYER_ROUTE = window.MATCHDEKHO_CONFIG.routes.willowPlayer; // "/az/"
  const DEFAULT_SERVER_KEY = 'akamai_server1';

  const track      = document.getElementById('willowLiveTrack');
  const arrowLeft  = document.getElementById('willowLiveArrowLeft');
  const arrowRight = document.getElementById('willowLiveArrowRight');

  if (!track) return;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Determine the ser value for the redirect URL.
   * ser=1  → akamai_server1 is present (primary server)
   * ser=0  → another server key exists but akamai_server1 is absent
   * Returns -1 if no CnpTV server is found at all (no watch button shown).
   */
  function getServerNumber(match) {
    const cnp = match.CnpTV && typeof match.CnpTV === 'object' ? match.CnpTV : {};
    if (cnp[DEFAULT_SERVER_KEY]) return 1;
    for (const key of Object.keys(cnp)) {
      if (cnp[key]) return 0;
    }
    return -1; // no server available
  }

  /**
   * Build player redirect URL.
   * Format: /az/?<MATCH_ID>&ser=<0|1>
   */
  function buildPlayerUrl(matchId, serNumber) {
    return PLAYER_ROUTE + '?' + String(matchId) + '&ser=' + serNumber;
  }

  /**
   * Parse "Team A vs Team B" or "Team A v Team B" into home/away parts.
   */
  function parseMatchup(eventName) {
    if (!eventName) return null;
    const sep = /\s+vs\.?\s+|\s+v\s+/i;
    const parts = String(eventName).split(sep);
    if (parts.length >= 2) {
      return { home: parts[0].trim(), away: parts[parts.length - 1].trim() };
    }
    return null;
  }

  /**
   * Normalise raw status string into { label, className }.
   * className: 'live' | 'upcoming' | 'ended'
   */
  function statusInfo(raw) {
    const s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(s)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(s)) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  // ---------------------------------------------------------------------------
  // Skeleton loading placeholders
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Render error state
  // ---------------------------------------------------------------------------
  function renderError(msg) {
    track.innerHTML = `<div class="md-error"><strong>Couldn't load matches</strong>${msg ? escapeHtml(msg) : ''}</div>`;
  }

  // ---------------------------------------------------------------------------
  // Render match cards using the unified md-card system
  // ---------------------------------------------------------------------------
  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No matches right now</strong>Check back soon.</div>';
      return;
    }

    const fallbackImg = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' +
      '<defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0">' +
      '<stop offset="0" stop-color="#0b1420"/><stop offset="1" stop-color="#112035"/>' +
      '</linearGradient></defs>' +
      '<rect width="960" height="540" fill="url(#g)"/>' +
      '<circle cx="760" cy="140" r="200" fill="#34d399" opacity=".07"/>' +
      '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle">WILLOW CRICKET</text>' +
      '</svg>'
    );

    let html = '';

    matches.forEach(function (match) {
      const status     = statusInfo(match.status);
      const isUpcoming = status.className === 'upcoming';
      const isEnded    = status.className === 'ended';
      const id         = match.id || match.matchId || match.match_id || '';
      const serNumber  = getServerNumber(match);
      const hasStream  = id && serNumber >= 0;

      // Determine matchup display
      const rawTitle   = match.title || match.event || match.teams || '';
      const matchup    = parseMatchup(rawTitle);
      const tournament = escapeHtml(match.tournament || match.competition || match.category || '');
      const imgSrc     = escapeHtml(match.poster || match.image || match.thumbnail || fallbackImg);
      const imgAlt     = escapeHtml(rawTitle || 'Match poster');

      // Time — shown on all cards
      const time = escapeHtml(match.time || match.date || match.startTime || '');

      // Watch button — only for live matches with a valid stream
      let watchMarkup = '';
      if (!isUpcoming && !isEnded && hasStream) {
        const href = escapeHtml(buildPlayerUrl(id, serNumber));
        watchMarkup = `<a class="md-watch-btn" href="${href}" aria-label="Watch ${imgAlt}">` +
          `<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>WATCH NOW</a>`;
      }

      // Matchup HTML (teams) or fallback event title
      let matchupHtml = '';
      if (matchup) {
        matchupHtml = `<div class="md-matchup">` +
          `<span class="md-team">${escapeHtml(matchup.home)}</span>` +
          `<span class="md-vs">VS</span>` +
          `<span class="md-team away">${escapeHtml(matchup.away)}</span>` +
          `</div>`;
      } else if (rawTitle) {
        matchupHtml = `<div class="md-event-title">${escapeHtml(rawTitle)}</div>`;
      }

      html += `
        <article class="md-card md-${status.className}" data-match-id="${escapeHtml(String(id))}">
          <div class="md-thumb">
            <img src="${imgSrc}" alt="${imgAlt}" loading="lazy"
                 onerror="this.onerror=null;this.src='${fallbackImg}'">
            <span class="md-status md-${status.className}">${escapeHtml(status.label)}</span>
          </div>
          <div class="md-info">
            ${tournament ? `<div class="md-tournament">${tournament}</div>` : ''}
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

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------
  function fetchMatches() {
    renderSkeletons(6);

    fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        const matches = (data.matches || data.events || data || []).slice(0, 20);
        renderMatches(Array.isArray(matches) ? matches : []);
      })
      .catch(function (err) {
        console.error('[Willow] fetch error:', err);
        renderError();
      });
  }

  // ---------------------------------------------------------------------------
  // Arrow scroll helpers
  // ---------------------------------------------------------------------------
  function scrollAmount() {
    const card = track.querySelector('.md-card, .md-skeleton');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(track).gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  if (arrowLeft)  arrowLeft.addEventListener('click',  function (e) { e.stopPropagation(); track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }); });
  if (arrowRight) arrowRight.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }); });

  // ---------------------------------------------------------------------------
  // Lazy-load: trigger fetch when section scrolls into view
  // ---------------------------------------------------------------------------
  const section = document.getElementById('willow-live');
  if ('IntersectionObserver' in window && section) {
    const obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fetchMatches(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    fetchMatches();
  }
})();
