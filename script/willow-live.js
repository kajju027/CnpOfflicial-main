(function () {
  'use strict';

  var cfg          = window.MATCHDEKHO_CONFIG;
  var API_URL      = cfg.apis.willowLive;
  var PLAYER_ROUTE = cfg.routes.willowPlayer; // "/az/"
  var PRIMARY_KEY  = 'akamai_server1';

  var track      = document.getElementById('willowLiveTrack');
  var arrowLeft  = document.getElementById('willowLiveArrowLeft');
  var arrowRight = document.getElementById('willowLiveArrowRight');

  if (!track) return;

  /* -------------------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------------------- */

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Walk common API response wrappers and return the matches array.
   * Handles: plain array, {matches:[...]}, {data:[...]}, {events:[...]},
   *          {data:{matches:[...]}}, {response:{matches:[...]}}, etc.
   */
  function extractMatches(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    var keys = ['matches','events','data','results','list','items','content','response'];
    for (var i = 0; i < keys.length; i++) {
      var v = raw[keys[i]];
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') {
        for (var j = 0; j < keys.length; j++) {
          if (Array.isArray(v[keys[j]])) return v[keys[j]];
        }
      }
    }
    return [];
  }

  /**
   * Build a "Home vs Away" title string from any of the field formats APIs use.
   */
  function buildTitle(m) {
    // Flat title field
    var flat = m.title || m.name || m.event || m.match_name || m.teams || '';
    if (flat) return String(flat);

    // Nested homeTeam / awayTeam objects
    var home = m.homeTeam || m.team1 || m.home_team || {};
    var away = m.awayTeam || m.team2 || m.away_team || {};
    var hn = (typeof home === 'object' ? home.name || home.shortName || home.abbr : home) || m.team_1 || m.home || '';
    var an = (typeof away === 'object' ? away.name || away.shortName || away.abbr : away) || m.team_2 || m.away || '';
    if (hn && an) return hn + ' vs ' + an;
    return hn || an || '';
  }

  /**
   * Split "Team A vs Team B" into home/away.
   */
  function parseMatchup(title) {
    if (!title) return null;
    var parts = String(title).split(/\s+vs\.?\s+|\s+v\s+/i);
    if (parts.length >= 2) return { home: parts[0].trim(), away: parts[parts.length - 1].trim() };
    return null;
  }

  /**
   * Determine the ser parameter value for the player redirect.
   * ser=1 → akamai_server1 present (primary)
   * ser=0 → another server key present
   * ser=-1 → no server found (no watch button)
   */
  function getServerNumber(m) {
    // Check all common casing variants of the CnpTV field
    var cnp = m.CnpTV || m.cnpTV || m.cnptv || m.cnp_tv || m.streams || {};
    if (!cnp || typeof cnp !== 'object') return -1;
    if (cnp[PRIMARY_KEY]) return 1;
    var keys = Object.keys(cnp);
    for (var i = 0; i < keys.length; i++) {
      if (cnp[keys[i]]) return 0;
    }
    return -1;
  }

  /**
   * Build the player redirect URL.
   * Format: /az/?<MATCH_ID>&ser=<0|1>
   */
  function buildPlayerUrl(matchId, ser) {
    return PLAYER_ROUTE + '?' + String(matchId) + '&ser=' + ser;
  }

  /** Normalise raw status → { label, className }. */
  function statusInfo(raw) {
    var s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE')                                    return { label: 'LIVE',     className: 'live'     };
    if (['ENDED','FINISHED','COMPLETED'].indexOf(s) > -1) return { label: 'ENDED',    className: 'ended'    };
    if (['CANCELLED','CANCELED','POSTPONED'].indexOf(s) > -1) return { label: s,     className: 'ended'    };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  /* -------------------------------------------------------------------------
   * Skeleton placeholders
   * ---------------------------------------------------------------------- */
  function renderSkeletons(n) {
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<div class="md-skeleton" aria-hidden="true">' +
        '<div class="md-skeleton-thumb"></div>' +
        '<div class="md-skeleton-info">' +
          '<div class="md-skeleton-line sm"></div>' +
          '<div class="md-skeleton-line lg"></div>' +
          '<div class="md-skeleton-line md"></div>' +
        '</div></div>';
    }
    track.innerHTML = html;
  }

  /* -------------------------------------------------------------------------
   * Render cards using the unified md-card system
   * ---------------------------------------------------------------------- */
  var FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' +
    '<defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0">' +
    '<stop offset="0" stop-color="#0b1420"/><stop offset="1" stop-color="#112035"/>' +
    '</linearGradient></defs>' +
    '<rect width="960" height="540" fill="url(#g)"/>' +
    '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">WILLOW CRICKET</text>' +
    '</svg>'
  );

  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No matches right now</strong>Check back soon.</div>';
      return;
    }

    var html = '';

    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];

      var status     = statusInfo(m.status || m.matchStatus || m.state);
      var isUpcoming = status.className === 'upcoming';
      var isEnded    = status.className === 'ended';

      var id = String(m.id || m.matchId || m.match_id || m.matchID || '');
      var ser = getServerNumber(m);
      var hasStream = id && ser >= 0;

      var rawTitle   = buildTitle(m);
      var matchup    = parseMatchup(rawTitle);
      var tournament = escapeHtml(m.tournament || m.competition || m.series || m.league || m.category || m.sport || '');
      var imgSrc     = escapeHtml(m.poster || m.image || m.thumbnail || m.cover || m.tvgLogo || FALLBACK);
      var imgAlt     = escapeHtml(rawTitle || 'Match');
      var time       = escapeHtml(m.time || m.startTime || m.date || m.matchTime || m.scheduled_time || '');

      // Watch button — live only
      var watchHtml = '';
      if (!isUpcoming && !isEnded && hasStream) {
        var href = escapeHtml(buildPlayerUrl(id, ser));
        watchHtml = '<div class="md-actions">' +
          '<a class="md-watch-btn" href="' + href + '" aria-label="Watch ' + imgAlt + '">' +
          '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>WATCH NOW</a></div>';
      }

      // Teams or event title
      var matchupHtml = '';
      if (matchup) {
        matchupHtml = '<div class="md-matchup">' +
          '<span class="md-team">' + escapeHtml(matchup.home) + '</span>' +
          '<span class="md-vs">VS</span>' +
          '<span class="md-team away">' + escapeHtml(matchup.away) + '</span>' +
          '</div>';
      } else if (rawTitle) {
        matchupHtml = '<div class="md-event-title">' + escapeHtml(rawTitle) + '</div>';
      }

      html += '<article class="md-card md-' + status.className + '" data-match-id="' + escapeHtml(id) + '">' +
        '<div class="md-thumb">' +
          '<img src="' + imgSrc + '" alt="' + imgAlt + '" loading="lazy" ' +
               'onerror="this.onerror=null;this.src=\'' + FALLBACK.replace(/'/g,'\\x27') + '\'">' +
          '<span class="md-status md-' + status.className + '">' + escapeHtml(status.label) + '</span>' +
        '</div>' +
        '<div class="md-info">' +
          (tournament ? '<div class="md-tournament">' + tournament + '</div>' : '') +
          matchupHtml +
          '<div class="md-footer">' +
            (time ? '<time class="md-time">' + time + '</time>' : '<span class="md-time"></span>') +
            watchHtml +
          '</div>' +
        '</div>' +
        '</article>';
    }

    track.innerHTML = html;
  }

  /* -------------------------------------------------------------------------
   * Fetch
   * ---------------------------------------------------------------------- */
  function fetchMatches() {
    renderSkeletons(6);
    fetch(API_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var matches = extractMatches(data).slice(0, 20);
        renderMatches(matches);
      })
      .catch(function (err) {
        console.error('[Willow] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Could not load matches</strong></div>';
      });
  }

  /* -------------------------------------------------------------------------
   * Arrows
   * ---------------------------------------------------------------------- */
  function scrollAmt() {
    var c = track.querySelector('.md-card,.md-skeleton');
    if (!c) return 320;
    return (c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 20)) * 2;
  }
  if (arrowLeft)  arrowLeft.addEventListener('click',  function (e) { e.stopPropagation(); track.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); });
  if (arrowRight) arrowRight.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left:  scrollAmt(), behavior: 'smooth' }); });

  /* -------------------------------------------------------------------------
   * Lazy-load via IntersectionObserver
   * ---------------------------------------------------------------------- */
  var section = document.getElementById('willow-live');
  if ('IntersectionObserver' in window && section) {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fetchMatches(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    fetchMatches();
  }
})();
