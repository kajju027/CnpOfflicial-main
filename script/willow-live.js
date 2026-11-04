(function () {
  'use strict';

  var cfg          = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis         = cfg.apis || {};
  var API_URL      = apis.willowLive || apis.willow || '';
  var ROUTES       = cfg.routes || {};
  var PLAYER_ROUTE = ROUTES.willowPlayer || '/watch/willow/';
  var PLAYER_BASE  = cfg.playerBase || '';
  var EAGER_CARDS  = 5;

  var DEFAULT_SERVER_ID = 3;

  if (!document.getElementById('willow-default-btn-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'willow-default-btn-style';
    styleEl.textContent =
      '.md-watch-btn.md-watch-btn-default{' +
        'background:linear-gradient(135deg,rgba(255,184,0,.22),rgba(255,136,0,.12));' +
        'border-color:rgba(255,184,0,.6);color:#ffb800;' +
        'box-shadow:0 0 0 1px rgba(255,184,0,.25),0 4px 14px rgba(255,136,0,.22);' +
      '}' +
      '.md-watch-btn.md-watch-btn-default .md-watch-btn-icon,' +
      '.md-watch-btn.md-watch-btn-default .md-watch-language{color:#ffb800;}';
    document.head.appendChild(styleEl);
  }

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

  function numericId(val) {
    return String(val || '').replace(/[^0-9]/g, '');
  }

  function buildPlayerUrl(matchId, serverId) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var secCfg = ((cfgObj.sections || {}).willow) || {};
    var secLink = String(secCfg.link || '');
    var base;
    if (secLink) {
      base = secLink;
    } else {
      var routeBase = PLAYER_BASE ? String(PLAYER_BASE).replace(/\/+$/, '') : '';
      var route = PLAYER_ROUTE.charAt(0) === '/' ? PLAYER_ROUTE : '/' + PLAYER_ROUTE;
      base = routeBase + route;
    }
    var nid = numericId(matchId);
    if (!nid) return base;
    var srv = serverId || DEFAULT_SERVER_ID;
    return base + '?CB' + nid + '&ser=' + srv;
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
      .map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function parseMatchup(title) {
    var t = String(title == null ? '' : title).replace(/\s*\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
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

  function statusInfo(raw) {
    var s = String(raw || 'UPCOMING').trim().toUpperCase();
    if (s === 'LIVE' || s === 'LIVE NOW' || s === 'IN PLAY')         return { label: 'LIVE',     className: 'live'     };
    if (['ENDED', 'FINISHED', 'COMPLETED', 'RESULT'].indexOf(s) > -1)   return { label: 'ENDED',    className: 'ended'    };
    if (['CANCELLED', 'CANCELED', 'POSTPONED', 'ABANDONED'].indexOf(s) > -1) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  function updateSectionStatus(allMatches) {
    var el = document.getElementById('willowStatus');
    if (!el) return;
    var live = 0, upcoming = 0;
    for (var i = 0; i < allMatches.length; i++) {
      var cls = statusInfo(pick(allMatches[i], ['status', 'matchStatus', 'state', 'status_display'])).className;
      if (cls === 'live') live++;
      else if (cls === 'upcoming') upcoming++;
    }
    var text;
    if (live) text = live + (live === 1 ? ' Event Live' : ' Events Live');
    else if (upcoming) text = upcoming + (upcoming === 1 ? ' Upcoming Event' : ' Upcoming Events');
    else text = 'No Events Live';
    el.textContent = text;
  }

  function mdViewAllCard(link, label) {
    return '<a class="md-card md-view-all-card" href="' + escapeHtml(link) + '" aria-label="' + escapeHtml(label) + '">' +
      '<span class="view-all-plus" aria-hidden="true">+</span>' +
      '<span class="view-all-label">' + escapeHtml(label) + '</span>' +
      '</a>';
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
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var cardLimit = Number(cfgObj.cardLimit) || 10;
    var labels = cfgObj.labels || {};
    var comingSoonLabel = labels.comingSoon || 'Coming Soon';
    var viewAllLabel = labels.viewAll || 'View All Events';
    var secCfg = (cfgObj.sections || {}).willow || {};
    var viewAllLink = secCfg.viewAllLink || '/watch/willow/';

    updateSectionStatus(matches);

    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No matches right now</strong>Check back soon.</div>';
      return;
    }

    var visible = matches.slice(0, cardLimit);
    var html = '';

    for (var i = 0; i < visible.length; i++) {
      var m = visible[i];
      var status     = statusInfo(pick(m, ['status', 'matchStatus', 'state', 'status_display']));
      var id         = String(pick(m, ['id', 'matchId', 'match_id', 'matchID', 'stream_id']));
      var rawTitle   = buildTitle(m);
      var matchup    = parseMatchup(rawTitle);
      var tournament = escapeHtml(tournamentOf(m, rawTitle));
      var imgSrc     = escapeHtml(pick(m, ['poster', 'image', 'thumbnail', 'cover', 'tvgLogo']) || FALLBACK);
      var imgAlt     = escapeHtml(rawTitle || 'Cricket match');
      var time       = escapeHtml(pick(m, ['time', 'startTime', 'date', 'matchTime', 'scheduled_time', 'start_time']));

      var isUpcoming = status.className === 'upcoming';
      var watchHtml = '';

      if (isUpcoming) {
        watchHtml = '<div class="md-actions"><a class="md-watch-btn md-coming-soon" href="' +
          escapeHtml(viewAllLink) + '">' + escapeHtml(comingSoonLabel) + '</a></div>';
      } else if (id) {
        var href = escapeHtml(buildPlayerUrl(id, DEFAULT_SERVER_ID));
        watchHtml = '<div class="md-actions"><a class="md-watch-btn md-watch-btn-default" href="' + href + '" ' +
          'aria-label="Watch ' + imgAlt + ' live">' +
          '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>' +
          '<span>Watch Live</span>' +
          '</a></div>';
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

    html += mdViewAllCard(viewAllLink, viewAllLabel);
    track.innerHTML = html;
  }

  var STAMP = String(Date.now());
  var SNAPSHOT_URL = apis.willowSnapshot || '';

  function stamp(url) {
    return url + (url.indexOf('?') > -1 ? '&' : '?') + 't=' + STAMP;
  }

  function getJSON(url) {
    return new Promise(function (resolve, reject) {
      var controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
      var options = { cache: 'no-store' };
      var settled = false;
      var timeout;
      if (controller) options.signal = controller.signal;
      function finish(error, payload) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) reject(error); else resolve(payload);
      }
      timeout = window.setTimeout(function () {
        if (controller) controller.abort();
        finish(new Error('Request timed out'));
      }, 12000);
      fetch(stamp(url), options)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (payload) { finish(null, payload); }, function (error) { finish(error); });
    });
  }

  function fetchMatches() {
    if (!API_URL) {
      console.error('[Willow] No API URL configured (cfg.apis.willow / willowLive).');
      track.innerHTML = '<div class="md-error"><strong>Willow feed is not configured</strong>Check script/config.js</div>';
      return;
    }
    if (!track.querySelector('.md-card')) renderSkeletons(6);
    getJSON(API_URL)
      .catch(function () {
        if (!SNAPSHOT_URL) throw new Error('no snapshot');
        return getJSON(SNAPSHOT_URL);
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

  load();

  window.addEventListener('beforeunload', function () { if (timer) window.clearInterval(timer); });
})();