(function () {
  'use strict';

  var cfg          = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis         = cfg.apis || {};
  var API_URL      = apis.fanCode || apis.fancode || '';
  var ROUTES       = cfg.routes || {};
  var PLAYER_ROUTE = ROUTES.fancodePlayer || '/watch/fancode/pz/';
  var PLAYER_BASE  = cfg.playerBase || '';
  var EAGER_CARDS  = 5;

  var track      = document.getElementById('fancodeTrack');
  var arrowLeft  = document.getElementById('fancodeArrowLeft');
  var arrowRight = document.getElementById('fancodeArrowRight');

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
    var wanted = ['matches', 'events', 'data', 'results', 'list', 'items', 'content', 'response'];
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

  function baseId(val) {
    return String(val || '').replace(/_[a-z]{2,12}$/i, '');
  }

  var LANG_MAP = {
    eng: 'ENGLISH', en: 'ENGLISH', english: 'ENGLISH',
    hin: 'HINDI',   hi: 'HINDI',   hindi: 'HINDI',
    tam: 'TAMIL',   ta: 'TAMIL',   tamil: 'TAMIL',
    tel: 'TELUGU',  te: 'TELUGU',  telugu: 'TELUGU',
    kan: 'KANNADA', kn: 'KANNADA', kannada: 'KANNADA',
    mal: 'MALAYALAM', ml: 'MALAYALAM', malayalam: 'MALAYALAM',
    ben: 'BENGALI', bn: 'BENGALI', bengali: 'BENGALI',
    mar: 'MARATHI', mr: 'MARATHI', marathi: 'MARATHI',
    guj: 'GUJARATI', gu: 'GUJARATI', gujarati: 'GUJARATI'
  };

  var LANG_SHORT = {
    english: 'en',  hindi: 'hi',  tamil: 'ta',  telugu: 'te',
    kannada: 'kn',  malayalam: 'ml', bengali: 'bn', marathi: 'mr',
    gujarati: 'gu', punjabi: 'pa',   odia: 'or',    urdu: 'ur',
    assamese: 'as', bhojpuri: 'bh',
    eng: 'en', hin: 'hi', tam: 'ta', tel: 'te', kan: 'kn',
    mal: 'ml', ben: 'bn', mar: 'mr', guj: 'gu'
  };

  function urlLangCode(value) {
    var k = langCode(value);
    return LANG_SHORT[k] || k;
  }

  var NOT_A_LANGUAGE = ['primary', 'backup', 'default', 'main', 'auto', 'hls', 'dash', 'mpd',
    'cdn', 'link', 'links', 'stream', 'streams', 'url', 'server', 'servers'];

  function langLabel(value) {
    var key = String(value == null ? '' : value).toLowerCase().trim();
    return LANG_MAP[key] || key.toUpperCase();
  }

  function langCode(value) {
    return String(value == null ? '' : value).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  function looksLikeLanguage(key) {
    var k = langCode(key);
    if (!k) return false;
    if (NOT_A_LANGUAGE.indexOf(k) > -1) return false;
    if (LANG_MAP[k]) return true;
    if (/_/.test(String(key))) return false;
    return k.length >= 2 && k.length <= 12 && /^[a-z]+$/.test(k);
  }

  function getLanguages(m) {
    var out = [];
    var seen = {};
    function add(value) {
      var code = urlLangCode(value);
      if (!code || seen[code]) return;
      seen[code] = true;
      out.push({ code: code, label: langLabel(value) });
    }
    var auto = pick(m, ['auto_streams', 'autoStreams']);
    if (auto && typeof auto === 'object' && !Array.isArray(auto)) {
      Object.keys(auto).forEach(function (k) { if (looksLikeLanguage(k)) add(k); });
    }
    var langs = m.languages || m.audio_languages;
    if (!out.length && Array.isArray(langs)) {
      langs.forEach(function (l) {
        if (typeof l === 'string') { add(l); return; }
        var v = l && (l.code || l.key || l.lang || l.label || l.name);
        if (v) add(v);
      });
    }
    if (!out.length) {
      var single = pick(m, ['language', 'lang', 'audio', 'audio_language']);
      if (single) add(single);
    }
    if (!out.length && m.streams && typeof m.streams === 'object' && !Array.isArray(m.streams)) {
      Object.keys(m.streams).forEach(function (k) { if (looksLikeLanguage(k)) add(k); });
    }
    if (!out.length) {
      var m2 = String(pick(m, ['id', 'matchId', 'match_id']) || '').match(/_([a-z]{2,12})$/i);
      if (m2) add(m2[1]);
    }
    if (!out.length) add('english');
    return out;
  }

  function buildPlayerUrl(matchId, languageCode) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var secCfg = (cfgObj.sections || {}).fancode || {};
    var secLink = String(secCfg.link || '');
    var base;
    if (secLink) {
      base = secLink;
    } else {
      var routeBase = PLAYER_BASE ? String(PLAYER_BASE).replace(/\/+$/, '') : '';
      var route = PLAYER_ROUTE.charAt(0) === '/' ? PLAYER_ROUTE : '/' + PLAYER_ROUTE;
      base = routeBase + route;
    }
    var bid = baseId(matchId);
    if (!bid) return String(secCfg.viewAllLink || '/watch/fancode/');

    var lc = String(languageCode || 'en').toLowerCase();
    var separator = base.indexOf('?') === -1 ? '?' : '&';

    return base + separator + 'id=' + encodeURIComponent(bid + '_' + lc);
  }

  function buildTitle(m) {
    var flat = pick(m, ['title', 'name', 'event', 'event_name', 'match_name', 'match_title', 'teams']);
    if (flat) return String(flat);
    var home = m.homeTeam || m.team1 || m.home_team || {};
    var away = m.awayTeam || m.team2 || m.away_team || {};
    var hn = (typeof home === 'object' ? home.name || home.shortName : home) || m.team_1 || '';
    var an = (typeof away === 'object' ? away.name || away.shortName : away) || m.team_2 || '';
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

  function statusInfo(raw) {
    var s = String(raw == null ? 'UPCOMING' : raw).trim().toUpperCase();
    if (s === 'LIVE' || s === 'LIVE NOW' || s === 'IN PLAY')          return { label: 'LIVE',  className: 'live'     };
    if (['ENDED', 'FINISHED', 'COMPLETED', 'RESULT'].indexOf(s) > -1) return { label: 'ENDED', className: 'ended'   };
    if (['CANCELLED', 'CANCELED', 'POSTPONED', 'ABANDONED'].indexOf(s) > -1) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  function updateSectionStatus(allMatches) {
    var el = document.getElementById('fancodeStatus');
    if (!el) return;
    var live = 0, upcoming = 0;
    for (var i = 0; i < allMatches.length; i++) {
      var cls = statusInfo(pick(allMatches[i], ['status', 'state'])).className;
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
    '<stop offset="0" stop-color="#0a0e1a"/><stop offset="1" stop-color="#11203a"/>' +
    '</linearGradient></defs>' +
    '<rect width="960" height="540" fill="url(#g)"/>' +
    '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">FANCODE</text>' +
    '</svg>'
  );

  function renderMatches(matches) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var cardLimit = Number(cfgObj.cardLimit) || 10;
    var labels = cfgObj.labels || {};
    var watchLabel = labels.watchNow || 'Watch Now';
    var comingSoonLabel = labels.comingSoon || 'Coming Soon';
    var viewAllLabel = labels.viewAll || 'View All Events';
    var secCfg = (cfgObj.sections || {}).fancode || {};
    var viewAllLink = secCfg.viewAllLink || '/watch/fancode/';

    updateSectionStatus(matches);

    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No FanCode matches right now</strong>Check back soon.</div>';
      return;
    }

    var visible = matches.slice(0, cardLimit);
    var html = '';

    for (var i = 0; i < visible.length; i++) {
      var m = visible[i];
      var status     = statusInfo(pick(m, ['status', 'matchStatus', 'state', 'status_display']));
      var id         = String(pick(m, ['match_id', 'id', 'matchId', 'matchID', 'stream_id']));
      var rawTitle   = buildTitle(m);
      var matchup    = parseMatchup(rawTitle);
      var tournament = escapeHtml(pick(m, ['tournament', 'competition', 'series', 'league', 'sport', 'category']));
      var imgSrc     = escapeHtml(pick(m, ['image', 'poster', 'thumbnail', 'cover', 'tvgLogo']) || FALLBACK);
      var imgAlt     = escapeHtml(rawTitle || 'FanCode match');
      var time       = escapeHtml(pick(m, ['startTime', 'time', 'date', 'matchTime', 'scheduled_time', 'start_time']));

      var isUpcoming = status.className === 'upcoming';
      var watchHtml = '';

      if (id) {
        if (isUpcoming) {
          watchHtml = '<div class="md-actions"><span class="md-watch-btn md-coming-soon">' + escapeHtml(comingSoonLabel) + '</span></div>';
        } else {
          var langs = getLanguages(m);
          var buttons = '';
          for (var j = 0; j < langs.length; j++) {
            var lang = langs[j];
            var href = escapeHtml(buildPlayerUrl(id, lang.code));
            var lbl  = escapeHtml(lang.label);
            buttons += '<a class="md-watch-btn" href="' + href + '" aria-label="Watch ' + lbl + '">' +
              '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span><span>' + escapeHtml(watchLabel) + '</span><span class="md-watch-language">' + lbl + '</span></a>';
          }
          if (buttons) watchHtml = '<div class="md-actions">' + buttons + '</div>';
        }
      }
      if (!watchHtml && !isUpcoming) watchHtml = '<div class="md-actions"><span class="md-soon">Event details soon</span></div>';

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
            (watchHtml || '') +
          '</div>' +
        '</div>' +
        '</article>';
    }

    html += mdViewAllCard(viewAllLink, viewAllLabel);
    track.innerHTML = html;
  }

  var STAMP = String(Date.now());
  var SNAPSHOT_URL = apis.fanCodeSnapshot || apis.fancodeSnapshot || '';

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

  function fetchFancode() {
    if (!API_URL) {
      console.error('[FanCode] No API URL configured (cfg.apis.fancode / fanCode).');
      track.innerHTML = '<div class="md-error"><strong>FanCode feed is not configured</strong>Check script/config.js</div>';
      return;
    }
    if (!track.querySelector('.md-card')) renderSkeletons(6);
    getJSON(API_URL)
      .catch(function () {
        if (!SNAPSHOT_URL) throw new Error('no snapshot');
        return getJSON(SNAPSHOT_URL);
      })
      .then(function (data) {
        var all = extractMatches(data);
        var live = all.filter(function (m) { return statusInfo(pick(m, ['status', 'state'])).className === 'live'; });
        var rest = all.filter(function (m) { return statusInfo(pick(m, ['status', 'state'])).className !== 'live'; });
        renderMatches(live.concat(rest).slice(0, 20));
      })
      .catch(function (err) {
        console.error('[FanCode] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Could not load FanCode matches</strong>Please refresh in a moment.</div>';
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
    fetchFancode();
    timer = window.setInterval(function () {
      if (!document.hidden) fetchFancode();
    }, 60000);
  }

  load();

  window.addEventListener('beforeunload', function () { if (timer) window.clearInterval(timer); });
})();
