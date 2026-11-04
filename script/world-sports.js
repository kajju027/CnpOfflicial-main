(function () {
  'use strict';

  var CFG      = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var APIS     = CFG.apis || {};
  var API_URL  = APIS.worldSports || APIS.world_sports || '';

  var track      = document.getElementById('worldSportsTrack');
  var arrowLeft  = document.getElementById('worldSportsArrowLeft');
  var arrowRight = document.getElementById('worldSportsArrowRight');

  if (!track) return;

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function statusInfo(raw) {
    var s = String(raw || 'UPCOMING').toUpperCase();
    if (s === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].indexOf(s) > -1) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].indexOf(s) > -1) return { label: s, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
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

  function updateSectionStatus(allMatches) {
    var el = document.getElementById('worldSportsStatus');
    if (!el) return;
    var live = 0, upcoming = 0;
    for (var i = 0; i < allMatches.length; i++) {
      var cls = statusInfo(allMatches[i].status).className;
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

  function renderMatches(matches) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var cardLimit = Number(cfgObj.cardLimit) || 10;
    var labels = cfgObj.labels || {};
    var watchLabel = labels.watchNow || 'Watch Now';
    var comingSoonLabel = labels.comingSoon || 'Coming Soon';
    var viewAllLabel = labels.viewAll || 'View All Events';
    var secCfg = (cfgObj.sections || {}).worldSports || {};
    var viewAllLink = secCfg.viewAllLink || '/watch/wwsports/';
    var basePath = String(secCfg.link || '/watch/wwsports/');

    updateSectionStatus(matches);

    if (!matches || matches.length === 0) {
      track.innerHTML = '<div class="md-empty"><strong>No events right now</strong>Check back soon.</div>';
      return;
    }

    var fallbackImg = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' +
      '<defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0">' +
      '<stop offset="0" stop-color="#0b1723"/><stop offset="1" stop-color="#1b3648"/>' +
      '</linearGradient></defs>' +
      '<rect width="960" height="540" fill="url(#g)"/>' +
      '<text x="480" y="288" fill="#fff" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle">WORLD SPORTS</text>' +
      '</svg>'
    );

    var visible = matches.slice(0, cardLimit);
    var html = '';

    for (var cardIndex = 0; cardIndex < visible.length; cardIndex++) {
      var match    = visible[cardIndex];
      var status   = statusInfo(match.status);
      var isLive   = status.className === 'live';
      var rawId    = String(match.id || match.matchId || match.match_id || match.stream_id || '').trim();
      var safeMatchId = rawId ? encodeURIComponent(rawId) : '';
      var pageUrl  = (isLive && safeMatchId) ? basePath + '?id=' + safeMatchId : basePath;
      var safeUrl  = escapeHtml(pageUrl);
      var rawTitle = match.title || match.teams || 'Event';
      var matchup  = parseMatchup(rawTitle);
      var league   = escapeHtml(match.league || match.sport || 'World Sports');
      var imgSrc   = escapeHtml(match.thumbnail || fallbackImg);
      var imgAlt   = escapeHtml(rawTitle);
      var time     = escapeHtml(match.date || match.time || '');

      var watchMarkup = '';
      if (isLive && safeMatchId) {
        watchMarkup = '<a class="md-watch-btn" href="' + safeUrl + '" aria-label="Watch ' + imgAlt + '">' +
          '<span class="md-watch-btn-icon" aria-hidden="true">&#9654;</span>' + escapeHtml(watchLabel) + '</a>';
      } else {
        watchMarkup = '<a class="md-watch-btn md-coming-soon" href="' + escapeHtml(basePath) + '">' + escapeHtml(comingSoonLabel) + '</a>';
      }

      var matchupHtml = '';
      if (matchup) {
        matchupHtml = '<div class="md-matchup">' +
          '<span class="md-team">' + escapeHtml(matchup.home) + '</span>' +
          '<span class="md-vs">VS</span>' +
          '<span class="md-team away">' + escapeHtml(matchup.away) + '</span>' +
          '</div>';
      } else {
        matchupHtml = '<div class="md-event-title">' + escapeHtml(rawTitle) + '</div>';
      }

      html += '<article class="md-card md-' + status.className + '" data-href="' + safeUrl + '">' +
        '<div class="md-thumb">' +
          '<img src="' + imgSrc + '" alt="' + imgAlt + '" ' + (cardIndex < 5 ? 'loading="eager"' : 'loading="lazy"') + ' decoding="async"' +
               ' onerror="this.onerror=null;this.src=\'' + fallbackImg + '\'">' +
          '<span class="md-status md-' + status.className + '">' + escapeHtml(status.label) + '</span>' +
        '</div>' +
        '<div class="md-info">' +
          '<div class="md-tournament">' + league + '</div>' +
          matchupHtml +
          '<div class="md-footer">' +
            (time ? '<time class="md-time">' + time + '</time>' : '<span class="md-time"></span>') +
            '<div class="md-actions">' + watchMarkup + '</div>' +
          '</div>' +
        '</div>' +
        '</article>';
    }

    html += mdViewAllCard(viewAllLink, viewAllLabel);
    track.innerHTML = html;
  }

  track.addEventListener('click', function (e) {
    var card = e.target.closest('.md-card');
    if (!card) return;
    if (e.target.closest('a, button')) return;
    var href = card.dataset.href;
    if (href) window.location.assign(href);
  });

  var STAMP = String(Date.now());
  var SNAPSHOT_URL = APIS.worldSportsSnapshot || '';

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

  function fetchWorldSports() {
    if (!API_URL) {
      console.error('[WorldSports] No API URL configured (cfg.apis.worldSports).');
      track.innerHTML = '<div class="md-error"><strong>World Sports feed is not configured</strong>Check script/config.js</div>';
      return;
    }
    if (!track.querySelector('.md-card')) renderSkeletons(6);
    getJSON(API_URL)
      .catch(function () {
        if (!SNAPSHOT_URL) throw new Error('no snapshot');
        return getJSON(SNAPSHOT_URL);
      })
      .then(function (data) {
        var raw = data.matches || data.events || data || [];
        var matches = (Array.isArray(raw) ? raw : []).slice(0, 20);
        renderMatches(matches);
      })
      .catch(function (err) {
        console.error('[WorldSports] fetch error:', err);
        track.innerHTML = '<div class="md-error"><strong>Failed to load events</strong></div>';
      });
  }

  function scrollAmount() {
    var card = track.querySelector('.md-card, .md-skeleton');
    if (!card) return 320;
    var gap = parseFloat(getComputedStyle(track).gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  if (arrowLeft)  arrowLeft.addEventListener('click',  function (e) { e.stopPropagation(); track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }); });
  if (arrowRight) arrowRight.addEventListener('click', function (e) { e.stopPropagation(); track.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }); });

  var loaded = false;
  var timer  = null;

  function load() {
    if (loaded) return;
    loaded = true;
    fetchWorldSports();
    timer = window.setInterval(function () {
      if (!document.hidden) fetchWorldSports();
    }, 60000);
  }

  load();

  window.addEventListener('beforeunload', function () { if (timer) window.clearInterval(timer); });
})();
