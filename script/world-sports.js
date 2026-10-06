(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------
  const API_URL = window.MATCHDEKHO_CONFIG.apis.worldSports;

  const track      = document.getElementById('worldSportsTrack');
  const arrowLeft  = document.getElementById('worldSportsArrowLeft');
  const arrowRight = document.getElementById('worldSportsArrowRight');

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

  /** Normalise raw status → { label, className }. */
  function statusInfo(raw) {
    const s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(s)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(s)) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  /** Parse "Team A vs Team B" into home/away parts. */
  function parseMatchup(title) {
    if (!title) return null;
    const parts = String(title).split(/\s+vs\.?\s+|\s+v\s+/i);
    if (parts.length >= 2) {
      return { home: parts[0].trim(), away: parts[parts.length - 1].trim() };
    }
    return null;
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
  // Render match cards using the unified md-card system.
  // World Sports cards are navigatable via the Watch button or the card itself.
  // ---------------------------------------------------------------------------
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

    matches.forEach(function (match) {
      const status     = statusInfo(match.status);
      const isLive     = status.className === 'live';
      const isUpcoming = status.className === 'upcoming';
      const isEnded    = status.className === 'ended';
      const pageUrl    = match.page_url || '';

      const rawTitle   = match.title || match.teams || 'Event';
      const matchup    = parseMatchup(rawTitle);
      const league     = escapeHtml(match.league || match.sport || 'World Sports');
      const imgSrc     = escapeHtml(match.thumbnail || fallbackImg);
      const imgAlt     = escapeHtml(rawTitle);
      const time       = escapeHtml(match.date || match.time || '');
      const safeUrl    = escapeHtml(pageUrl);

      // Watch button — live events with a page URL
      let watchMarkup = '';
      if (!isUpcoming && !isEnded && pageUrl) {
        watchMarkup = `<a class="md-watch-btn" href="${safeUrl}" aria-label="Watch ${imgAlt}">` +
          `<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>WATCH NOW</a>`;
      }

      // Matchup or event title
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

      // Card is navigatable even when not live (whole card click via JS below)
      html += `
        <article class="md-card md-${status.className}" data-href="${safeUrl}"
                 style="${pageUrl ? 'cursor:pointer' : ''}">
          <div class="md-thumb">
            <img src="${imgSrc}" alt="${imgAlt}" loading="lazy"
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

    // Card-level click-through — navigate unless the click was on a button/link
    track.addEventListener('click', function (e) {
      const card = e.target.closest('.md-card');
      if (!card) return;
      if (e.target.closest('a, button')) return; // let the element handle it
      const href = card.dataset.href;
      if (href && href !== '#') window.location.href = href;
    });
  }

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------
  function fetchWorldSports() {
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
        console.error('[WorldSports] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Failed to load events</strong></div>';
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
  const section = document.getElementById('worldSportsSection');
  if ('IntersectionObserver' in window && section) {
    const obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fetchWorldSports(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    fetchWorldSports();
  }
})();
