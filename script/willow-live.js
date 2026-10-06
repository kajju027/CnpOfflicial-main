(function () {
  'use strict';

  var cfg          = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis         = cfg.apis || {};
  var API_URL      = apis.willowLive || apis.willow || '';
  var ROUTES       = cfg.routes || {};
  var PLAYER_ROUTE = ROUTES.willowPlayer || '/az/';
  var PLAYER_BASE  = cfg.playerBase || '';
  var PLAYER_MODE  = cfg.willowPlayerMode === 'index' ? 'index' : 'stream';
  var PRIMARY_KEY  = 'akamai_server1';
  var EAGER_CARDS  = 5;

  var track      = document.getElementById('willowLiveTrack');
  var arrowLeft  = document.getElementById('willowLiveArrowLeft');
  var arrowRight = document.getElementById('willowLiveArrowRight');

  if (!track) return;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pick(obj, names) {
    if (!obj || typeof obj !== 'object') return '';
    var lower = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) lower[String(k).toLowerCase()] = obj[k];
    }
    for (var i = 0; i < names.length; i++) {
      var v = lower[String(names[i]).toLowerCase()];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  }

  function extractMatches(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];

    var wanted = ['matches', 'events', 'data', 'results', 'list', 'items', 'content', 'response', 'streams', 'live'];

    var top = pick(raw, wanted);
    if (Array.isArray(top)) return top;

    for (var key in raw) {
      var v = raw[key];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        var inner = pick(v, wanted);
        if (Array.isArray(inner)) return inner;
      }
    }
    return [];
  }

  function buildTitle(m) {
    var flat = pick(m, ['event_name', 'title', 'name', 'event', 'event_title', 'match_name', 'match_title', 'teams', 'description']);
    if (flat) return String(flat);

    var home = m.homeTeam || m.team1 || m.home_team || {};
    var away = m.awayTeam || m.team2 || m.away_team || {};
    var hn = (typeof home === 'object' ? home.name || home.shortName || home.abbr : home) || m.team_1 || m.home || '';
    var an = (typeof away === 'object' ? away.name || away.shortName || away.abbr : away) || m.team_2 || m.away || '';
    if (hn && an) return hn + ' vs ' + an;
    return hn || an || '';
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

  function tournamentOf(m, rawTitle) {
    var direct = pick(m, ['tournament', 'competition', 'series', 'league', 'category', 'sport', 'sport_display']);
    if (direct) return String(direct);

    var chunks = String(rawTitle || '').split(/\s+[---]\s+/);
    if (chunks.length > 1 && /vs\.?\s/i.test(chunks[chunks.length - 1])) {
      chunks.pop();
      var derived = chunks.join(' - ').trim();
      if (derived) return derived;
    }
    return '';
  }

  function getStreamUrl(m) {
    var cnp = m.CnpTV || m.cnptv || m.cnpTV || m.cnp_tv || m.servers || {};
    if (!cnp || typeof cnp !== 'object' || Array.isArray(cnp)) return '';

    if (cnp[PRIMARY_KEY]) return String(cnp[PRIMARY_KEY]);

    var akamai = Object.keys(cnp).filter(function (k) { return /^akamai_server\d+$/i.test(k) && cnp[k]; })
      .sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    if (akamai.length) return String(cnp[akamai[0]]);

    var keys = Object.keys(cnp);
    for (var i = 0; i < keys.length; i++) {
      if (typeof cnp[keys[i]] === 'string' && cnp[keys[i]]) return cnp[keys[i]];
    }
    return '';
  }

  function buildPlayerUrl(matchId, streamUrl) {
    var base = PLAYER_BASE ? String(PLAYER_BASE).replace(/\/+$/, '') : '';
    var route = PLAYER_ROUTE.charAt(0) === '/' ? PLAYER_ROUTE : '/' + PLAYER_ROUTE;

    if (PLAYER_MODE === 'index') {
      return base + route + '?' + encodeURIComponent(matchId) + '&ser=1';
    }
    return base + route + '?id=' + encodeURIComponent(matchId) + '&ser=' + encodeURIComponent(streamUrl || '');
  }

  function statusInfo(raw) {
    var s = String(raw || 'UPCOMING').trim().toUpperCase();
    if (s === 'LIVE' || s === 'LIVE NOW' || s === 'IN PLAY')       return { label: 'LIVE',  className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED', 'RESULT'].indexOf(s) > -1) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED', 'ABANDONED'].indexOf(s) > -1) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

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

      var status     = statusInfo(pick(m, ['status', 'matchStatus', 'state', 'status_display']));
      var isLive     = status.className === 'live';

      var id         = String(pick(m, ['id', 'matchId', 'match_id', 'matchID', 'stream_id']));
      var streamUrl  = getStreamUrl(m);
      var rawTitle   = buildTitle(m);
      var matchup    = parseMatchup(rawTitle);
      var tournament = escapeHtml(tournamentOf(m, rawTitle));
      var imgSrc     = escapeHtml(pick(m, ['poster', 'image', 'thumbnail', 'cover', 'tvgLogo']) || FALLBACK);
      var imgAlt     = escapeHtml(rawTitle || 'Cricket match');
      var time       = escapeHtml(pick(m, ['time', 'startTime', 'date', 'matchTime', 'scheduled_time', 'start_time']));

      var watchHtml = '';
      if (isLive && id) {
        watchHtml = '<div class="md-actions">' +
          '<a class="md-watch-btn" href="' + escapeHtml(buildPlayerUrl(id, streamUrl)) + '" aria-label="Watch ' + imgAlt + '">' +
          '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>WATCH NOW</a></div>';
      }

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
          '<img src="' + imgSrc + '" alt="' + imgAlt + '" ' +
               (i < EAGER_CARDS ? 'loading="eager"' : 'loading="lazy"') + ' decoding="async" ' +
               'onerror="this.onerror=null;this.src=\'' + FALLBACK.replace(/'/g, '\\x27') + '\'">' +
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

  function fetchMatches() {
    if (!API_URL) {
      console.error('[Willow] No API URL configured (cfgs.apis.willow / willowLive).');
      track.innerHTML = '<div class="md-error"><strong>Willow feed is not configured</strong>Check script/config.js</div>';
      return;
    }

    renderSkeletons(6);

    fetch(API_URL, { cache: 'no-store' })
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
        track.innerHTML = '<div class="md-error"><strong>Could not load matches</strong>Please refresh in a moment.</div>';
      });
  }

  function scrollAmt() {
    var c = track.querySelector('.md-card,.md-skeleton');
    if (!c) return 320;
    return (c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 20)) * 2;
  }
  if (arrowLeft)  arrowLeft.addEventListener('click',  function (e) { e.stopPropagation(); track.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }); });
  if (arrowRight) arrowRight.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left:  scrollAmt(), behavior: 'smooth' }); });

  var section = document.getElementById('willow-live');
  var loaded = false;
  var timer = null;

  function load() {
    if (loaded) return;
    loaded = true;
    fetchMatches();
    timer = window.setInterval(function () {
      if (!document.hidden) fetchMatches();
    }, 60000);
  }

  if ('IntersectionObserver' in window && section) {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { load(); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(section);
  } else {
    load();
  }

  window.addEventListener('beforeunload', function () { if (timer) window.clearInterval(timer); });
})();
