(function () {
  'use strict';

  var cfg         = window.MATCHDEKHO_CONFIG;
  var API_URL     = cfg.apis.fanCode;
  var PLAYER_ROUTE = cfg.routes.fancodePlayer; // "/fc/play/"

  var track      = document.getElementById('fancodeTrack');
  var arrowLeft  = document.getElementById('fancodeArrowLeft');
  var arrowRight = document.getElementById('fancodeArrowRight');

  if (!track) return;

  /* -------------------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------------------- */

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Extract matches array from any common API response wrapper. */
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

  /** Strip language suffix from a match ID: "12345_eng" → "12345". */
  function baseId(val) {
    return String(val || '').replace(/_[a-z]{2,4}$/i, '');
  }

  /** Map a language code/string to a clean uppercase display label. */
  var LANG_MAP = {
    eng:'ENGLISH', en:'ENGLISH', english:'ENGLISH',
    hin:'HINDI',   hi:'HINDI',   hindi:'HINDI',
    tam:'TAMIL',   ta:'TAMIL',   tamil:'TAMIL',
    tel:'TELUGU',  te:'TELUGU',  telugu:'TELUGU',
    kan:'KANNADA', kn:'KANNADA', kannada:'KANNADA',
    mal:'MALAYALAM', ml:'MALAYALAM', malayalam:'MALAYALAM',
    ben:'BENGALI', bn:'BENGALI', bengali:'BENGALI',
  };

  function langLabel(code) {
    return LANG_MAP[String(code).toLowerCase().trim()] || String(code).toUpperCase();
  }

  /**
   * Determine the available language streams for a FanCode match.
   * Returns [{code, label}, ...].
   */
  function getLanguages(m) {
    // Format A: m.languages = [{code, label}, ...]
    if (Array.isArray(m.languages) && m.languages.length) {
      return m.languages.map(function (l) {
        var code  = String(l.code || l.key || l.lang || '').toLowerCase();
        var label = langLabel(l.label || l.name || code);
        return { code: code, label: label };
      }).filter(function (l) { return l.code; });
    }

    // Format B: m.streams = {eng: '...', hin: '...'} (object with language keys)
    if (m.streams && typeof m.streams === 'object' && !Array.isArray(m.streams)) {
      return Object.keys(m.streams).map(function (code) {
        return { code: code.toLowerCase(), label: langLabel(code) };
      });
    }

    // Format C: ID has language suffix — single stream
    var id = String(m.id || m.matchId || m.match_id || '');
    var match = id.match(/_([a-z]{2,4})$/i);
    if (match) return [{ code: match[1].toLowerCase(), label: langLabel(match[1]) }];

    // Format D: m.audio_languages = ['English', 'Hindi']
    if (Array.isArray(m.audio_languages) && m.audio_languages.length) {
      return m.audio_languages.map(function (lang) {
        var key = String(lang).toLowerCase().substring(0,3);
        return { code: key, label: langLabel(lang) };
      });
    }

    // Default: single stream, assume English
    return [{ code: '', label: 'ENGLISH' }];
  }

  /**
   * Build the FanCode player redirect URL.
   * Format: /fc/play/?id=<baseId>_<languageCode>&s=0
   * THIS FORMAT MUST NOT CHANGE.
   */
  function buildPlayerUrl(matchId, langCode) {
    var bid = baseId(matchId);
    var params = new URLSearchParams();
    params.set('id', langCode ? bid + '_' + langCode : bid);
    params.set('s', '0');
    return PLAYER_ROUTE + '?' + params.toString();
  }

  /** Build a display title from any common field format. */
  function buildTitle(m) {
    var flat = m.title || m.name || m.event || m.match_name || m.teams || '';
    if (flat) return String(flat);
    var home = m.homeTeam || m.team1 || m.home_team || {};
    var away = m.awayTeam || m.team2 || m.away_team || {};
    var hn = (typeof home === 'object' ? home.name || home.shortName || '' : home) || m.team_1 || '';
    var an = (typeof away === 'object' ? away.name || away.shortName || '' : away) || m.team_2 || '';
    if (hn && an) return hn + ' vs ' + an;
    return hn || an || '';
  }

  /** Split "Team A vs Team B" into home/away. */
  function parseMatchup(title) {
    if (!title) return null;
    var parts = String(title).split(/\s+vs\.?\s+|\s+v\s+/i);
    if (parts.length >= 2) return { home: parts[0].trim(), away: parts[parts.length - 1].trim() };
    return null;
  }

  /** Normalise raw status → { label, className }. */
  function statusInfo(raw) {
    var s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE')                                      return { label: 'LIVE',    className: 'live'    };
    if (['ENDED','FINISHED','COMPLETED'].indexOf(s) > -1)  return { label: 'ENDED',   className: 'ended'   };
    if (['CANCELLED','CANCELED','POSTPONED'].indexOf(s) > -1) return { label: s,      className: 'ended'   };
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
    '<stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#11203a"/>' +
    '</linearGradient></defs>' +
    '<rect width="960" height="540" fill="url(#g)"/>' +
    '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">FANCODE</text>' +
    '</svg>'
  );

  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No FanCode matches right now</strong>Check back soon.</div>';
      return;
    }

    var html = '';

    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];

      var status     = statusInfo(m.status || m.matchStatus || m.state);
      var isLive     = status.className === 'live';
      var isUpcoming = status.className === 'upcoming';
      var isEnded    = status.className === 'ended';

      var id = String(m.id || m.matchId || m.match_id || m.matchID || '');

      var rawTitle   = buildTitle(m);
      var matchup    = parseMatchup(rawTitle);
      var tournament = escapeHtml(m.tournament || m.competition || m.sport || m.series || m.league || m.category || '');
      var imgSrc     = escapeHtml(m.poster || m.image || m.thumbnail || m.cover || m.tvgLogo || FALLBACK);
      var imgAlt     = escapeHtml(rawTitle || 'FanCode match');
      var time       = escapeHtml(m.time || m.startTime || m.date || m.matchTime || m.scheduled_time || '');

      // Watch buttons — live matches only, one per language
      var watchHtml = '';
      if (isLive && id) {
        var langs   = getLanguages(m);
        var buttons = '';
        for (var j = 0; j < langs.length; j++) {
          var lang = langs[j];
          var href = escapeHtml(buildPlayerUrl(id, lang.code));
          var lbl  = escapeHtml(lang.label);
          buttons += '<a class="md-watch-btn" href="' + href + '" aria-label="Watch in ' + lbl + '">' +
            '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>' +
            'WATCH NOW' +
            '<span class="md-watch-btn-sep" aria-hidden="true"> &bull; </span>' +
            lbl + '</a>';
        }
        if (buttons) watchHtml = '<div class="md-actions">' + buttons + '</div>';
      }

      // Teams row or event title
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
  function fetchFancode() {
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
        console.error('[FanCode] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Could not load FanCode matches</strong></div>';
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
   * Lazy-load
   * ---------------------------------------------------------------------- */
  var section = document.getElementById('fancodeSection');
  if ('IntersectionObserver' in window && section) {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fetchFancode(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    fetchFancode();
  }
})();
