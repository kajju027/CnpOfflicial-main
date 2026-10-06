(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const API_URL      = window.MATCHDEKHO_CONFIG.apis.fanCode;
  const PLAYER_ROUTE = window.MATCHDEKHO_CONFIG.routes.fancodePlayer; // "/fc/play/"

  const track      = document.getElementById('fancodeTrack');
  const arrowLeft  = document.getElementById('fancodeArrowLeft');
  const arrowRight = document.getElementById('fancodeArrowRight');

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

  /** Strip language suffix from a match ID (e.g. "12345_eng" → "12345"). */
  function getBaseMatchId(value) {
    return String(value || '').replace(/_[a-z]{2,4}$/i, '');
  }

  /** Normalise a language code/label. */
  const LANG_MAP = {
    eng: 'ENGLISH', en: 'ENGLISH', english: 'ENGLISH',
    hin: 'HINDI',   hi: 'HINDI',   hindi:   'HINDI',
    tam: 'TAMIL',   ta: 'TAMIL',   tamil:   'TAMIL',
    tel: 'TELUGU',  te: 'TELUGU',  telugu:  'TELUGU',
    kan: 'KANNADA', kn: 'KANNADA', kannada: 'KANNADA',
    mal: 'MALAYALAM', ml: 'MALAYALAM', malayalam: 'MALAYALAM',
  };

  function resolveLanguage(raw) {
    const key = String(raw || '').toLowerCase().trim();
    return LANG_MAP[key] || String(raw || '').toUpperCase();
  }

  /**
   * Extract available language streams from a FanCode match object.
   * Returns array of { code, label } objects.
   */
  function getLanguages(match) {
    // Format A: match.languages = [{code:'eng', label:'English'}, ...]
    if (Array.isArray(match.languages)) {
      return match.languages.map(function (l) {
        const code  = String(l.code  || l.key   || l.lang || '');
        const label = resolveLanguage(l.label || l.name || code);
        return { code, label };
      }).filter(function (l) { return l.code; });
    }

    // Format B: match.streams = {eng: 'url', hin: 'url'}
    if (match.streams && typeof match.streams === 'object') {
      return Object.keys(match.streams).map(function (code) {
        return { code, label: resolveLanguage(code) };
      });
    }

    // Format C: match.id ends with _eng / _hin suffix — single stream
    const id = String(match.id || match.matchId || '');
    const suffix = id.match(/_([a-z]{2,4})$/i);
    if (suffix) {
      return [{ code: suffix[1].toLowerCase(), label: resolveLanguage(suffix[1]) }];
    }

    // Default: single English stream with no code suffix
    return [{ code: '', label: 'ENGLISH' }];
  }

  /**
   * Build the FanCode player redirect URL.
   * Format: /fc/play/?id=<baseId>_<languageCode>&s=0
   * IMPORTANT: this format must NOT change.
   */
  function buildPlayerUrl(matchId, languageCode) {
    const baseId = getBaseMatchId(matchId);
    const params = new URLSearchParams();
    params.set('id', languageCode ? baseId + '_' + languageCode : baseId);
    params.set('s', '0');
    return PLAYER_ROUTE + '?' + params.toString();
  }

  /**
   * Parse "Team A vs Team B" into home/away parts.
   */
  function parseMatchup(title) {
    if (!title) return null;
    const parts = String(title).split(/\s+vs\.?\s+|\s+v\s+/i);
    if (parts.length >= 2) {
      return { home: parts[0].trim(), away: parts[parts.length - 1].trim() };
    }
    return null;
  }

  /**
   * Normalise raw status into { label, className }.
   */
  function statusInfo(raw) {
    const s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(s)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(s)) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  // ---------------------------------------------------------------------------
  // Skeleton placeholders
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
  // Render match cards using the unified md-card system
  // ---------------------------------------------------------------------------
  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No FanCode matches right now</strong>Check back soon.</div>';
      return;
    }

    const fallbackImg = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' +
      '<defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0">' +
      '<stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#11203a"/>' +
      '</linearGradient></defs>' +
      '<rect width="960" height="540" fill="url(#g)"/>' +
      '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle">FANCODE</text>' +
      '</svg>'
    );

    let html = '';

    matches.forEach(function (match) {
      const status     = statusInfo(match.status);
      const isLive     = status.className === 'live';
      const isUpcoming = status.className === 'upcoming';
      const isEnded    = status.className === 'ended';
      const id         = String(match.id || match.matchId || match.match_id || '');

      const rawTitle   = match.title || match.name || match.event || match.teams || '';
      const matchup    = parseMatchup(rawTitle);
      const tournament = escapeHtml(match.tournament || match.competition || match.sport || '');
      const imgSrc     = escapeHtml(match.poster || match.image || match.thumbnail || fallbackImg);
      const imgAlt     = escapeHtml(rawTitle || 'FanCode match');
      const time       = escapeHtml(match.time || match.date || match.startTime || '');

      // Build watch buttons — only for live matches
      let watchMarkup = '';
      if (isLive && id) {
        const langs    = getLanguages(match);
        const buttons  = langs.map(function (lang) {
          const href  = escapeHtml(buildPlayerUrl(id, lang.code));
          const label = escapeHtml(lang.label);
          return `<a class="md-watch-btn" href="${href}" aria-label="Watch in ${label}">` +
            `<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>` +
            `WATCH NOW` +
            `<span class="md-watch-btn-sep" aria-hidden="true">&#8226;</span>` +
            `${label}</a>`;
        }).join('');
        if (buttons) watchMarkup = buttons;
      }

      // Matchup HTML
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
        <article class="md-card md-${status.className}" data-match-id="${escapeHtml(id)}">
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
  function fetchFancode() {
    renderSkeletons(6);

    fetch(API_URL)
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
        console.error('[FanCode] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Failed to load FanCode matches</strong></div>';
      });
  }

  // ---------------------------------------------------------------------------
  // Arrow scroll
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
  // Lazy-load
  // ---------------------------------------------------------------------------
  const section = document.getElementById('fancodeSection');
  if ('IntersectionObserver' in window && section) {
    const obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fetchFancode(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    fetchFancode();
  }
})();
