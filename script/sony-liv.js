(function () {
  "use strict";

  var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis = cfg.apis || {};
  var routes = cfg.routes || {};
  var API_URL = apis.sonyLiv || apis.sony || apis.sonyliv || "";
  var PLAYER_ROUTE = routes.sonyPlayer || "/watch/sliv/";
  var PLAYER_BASE = cfg.playerBase || "";

  var track = document.getElementById("sonyLivTrack");
  var arrowLeft = document.getElementById("sonyLivArrowLeft");
  var arrowRight = document.getElementById("sonyLivArrowRight");

  if (!track) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function cleanTitle(value) {
    return String(value == null ? "" : value)
      .replace(/^\s*(upcoming|live|ended|finished)\s*[-:]\s*/i, "")
      .replace(/\s+/g, " ").trim();
  }

  function isLive(status) {
    return String(status == null ? "" : status).trim().toUpperCase() === "LIVE";
  }

  function statusInfo(raw) {
    var label = String(raw == null ? "UPCOMING" : raw).trim();
    if (isLive(label)) return { label: "LIVE", className: "live" };
    var upper = label.toUpperCase();
    if (upper === "ENDED" || upper === "FINISHED" || upper === "COMPLETED") return { label: "ENDED", className: "ended" };
    if (!label) return { label: "UPCOMING", className: "upcoming" };
    return { label: upper, className: "upcoming" };
  }

  function rank(match) {
    return isLive(match && match.status) ? 0 : 1;
  }

  function playerUrl(id) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var secCfg = (cfgObj.sections || {}).sonyLiv || {};
    var secLink = String(secCfg.link || "");

    if (secLink) {
      var helper = window.CnpTVHelper;
      return helper && id ? helper.buildUrl(secCfg, String(id)) : secLink;
    }

    var route = String(PLAYER_ROUTE || "/watch/sliv/");
    if (route.charAt(0) !== "/" && route.indexOf("://") === -1) route = "/" + route;
    var base = String(PLAYER_BASE || "").replace(/\/+$/, "");
    var join = route.indexOf("?") === -1 ? "?id=" : "&id=";
    return base + route + join + encodeURIComponent(String(id));
  }

  function extractMatches(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== "object") return [];
    if (Array.isArray(raw.matches)) return raw.matches;
    if (Array.isArray(raw.events)) return raw.events;
    if (raw.data && Array.isArray(raw.data.matches)) return raw.data.matches;
    return [];
  }

  function updateSectionStatus(allMatches) {
    var el = document.getElementById("sonyLivStatus");
    if (!el) return;
    var live = 0, upcoming = 0;
    for (var i = 0; i < allMatches.length; i++) {
      var cls = statusInfo(allMatches[i] && allMatches[i].status).className;
      if (cls === "live") live++;
      else if (cls === "upcoming") upcoming++;
    }
    var text;
    if (live) text = live + (live === 1 ? " Event Live" : " Events Live");
    else if (upcoming) text = upcoming + (upcoming === 1 ? " Upcoming Event" : " Upcoming Events");
    else text = "No Events Live";
    el.textContent = text;
  }

  function mdViewAllCard(link, label) {
    return '<a class="md-card md-view-all-card" href="' + escapeHtml(link) + '" aria-label="' + escapeHtml(label) + '">' +
      '<span class="view-all-plus" aria-hidden="true">+</span>' +
      '<span class="view-all-label">' + escapeHtml(label) + '</span>' +
      '</a>';
  }

  var FALLBACK = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'>" +
    "<defs><linearGradient id='g' x1='0' x2='1' y1='1' y2='0'>" +
    "<stop offset='0' stop-color='#101820'/><stop offset='1' stop-color='#1c3348'/>" +
    "</linearGradient></defs><rect width='960' height='540' fill='url(#g)'/>" +
    "<text x='480' y='286' fill='#ffffff' font-family='Arial,sans-serif' font-size='42' font-weight='700' text-anchor='middle'>SONY LIV</text></svg>"
  );

  function renderSkeletons(count) {
    var html = "";
    for (var i = 0; i < count; i++) {
      html += "<div class=\"md-skeleton\" aria-hidden=\"true\">" +
        "<div class=\"md-skeleton-thumb\"></div>" +
        "<div class=\"md-skeleton-info\">" +
        "<div class=\"md-skeleton-line sm\"></div>" +
        "<div class=\"md-skeleton-line lg\"></div>" +
        "<div class=\"md-skeleton-line md\"></div>" +
        "</div></div>";
    }
    track.innerHTML = html;
  }

  function renderMatches(matches) {
    var cfgObj = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var cardLimit = Number(cfgObj.cardLimit) || 10;
    var upcomingClickable = cfgObj.upcomingClickable !== false;
    var labels = cfgObj.labels || {};
    var watchLabel = labels.watchNow || "Watch Now";
    var comingSoonLabel = labels.comingSoon || "Coming Soon";
    var viewAllLabel = labels.viewAll || "View All Events";
    var secCfg = (cfgObj.sections || {}).sonyLiv || {};
    var viewAllLink = secCfg.viewAllLink || "/watch/sliv/";

    updateSectionStatus(matches);

    if (!matches || !matches.length) {
      track.innerHTML = "<div class=\"md-empty\"><strong>No Sony Liv events right now</strong>Check back soon.</div>";
      return;
    }

    var visible = matches.slice(0, cardLimit);
    var html = "";

    for (var index = 0; index < visible.length; index++) {
      var match = visible[index];
      var id = match.match_id || match.id || match.event_id || "";
      var status = statusInfo(match.status);
      var eventName = cleanTitle(match.event_name || match.title || "Sony Liv");
      var matchName = cleanTitle(match.match_name || "");
      var title = matchName || eventName || "Sony Liv";
      var tournament = matchName ? eventName : (match.category || "Sony Liv");
      var channel = String(match.digital_broadcast || "").trim();
      var language = String(match.language || "").trim();
      var meta = [channel, language].filter(Boolean).join("  ·  ");
      var poster = match.poster || match.thumbnail || FALLBACK;
      var safeTitle = escapeHtml(title);
      var safePoster = escapeHtml(poster);

      var isUpcoming = status.className === "upcoming";
      var href = id ? playerUrl(id) : "";
      var safeHref = escapeHtml(href);
      var canClick = href && (!isUpcoming || upcomingClickable);

      var watch = "";
      if (isUpcoming) {
        watch = "<span class=\"md-watch-btn md-coming-soon\">" + escapeHtml(comingSoonLabel) + "</span>";
      } else if (href) {
        watch = "<span class=\"md-watch-btn\" aria-hidden=\"true\">" +
          "<span class=\"md-watch-btn-icon\">&#9654;</span>" + escapeHtml(watchLabel) + "</span>";
      }

      html += (canClick ? "<a class=\"md-card md-" + status.className + "\" href=\"" + safeHref + "\"" : "<article class=\"md-card md-" + status.className + "\"") +
        " aria-label=\"" + safeTitle + "\">" +
        "<div class=\"md-thumb\">" +
        "<img src=\"" + safePoster + "\" alt=\"" + safeTitle + "\" " +
        (index < 4 ? "loading=\"eager\"" : "loading=\"lazy\"") + " decoding=\"async\" " +
        "onerror=\"this.onerror=null;this.src='" + FALLBACK + "'\">" +
        "<span class=\"md-status md-" + status.className + "\">" + escapeHtml(status.label) + "</span>" +
        "</div>" +
        "<div class=\"md-info\">" +
        "<div class=\"md-tournament\">" + escapeHtml(tournament) + "</div>" +
        "<div class=\"md-event-title\">" + safeTitle + "</div>" +
        "<div class=\"md-footer\">" +
        (meta ? "<span class=\"md-time\">" + escapeHtml(meta) + "</span>" : "<span class=\"md-time\"></span>") +
        (watch ? "<div class=\"md-actions\">" + watch + "</div>" : "") +
        "</div></div>" + (canClick ? "</a>" : "</article>");
    }

    html += mdViewAllCard(viewAllLink, viewAllLabel);
    track.innerHTML = html;
  }

  function stamp(url) {
    return url + (url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
  }

  function getJSON(url) {
    return new Promise(function (resolve, reject) {
      var controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
      var options = { cache: "no-store" };
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
        finish(new Error("Request timed out"));
      }, 12000);
      fetch(stamp(url), options)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function (payload) { finish(null, payload); }, function (error) { finish(error); });
    });
  }

  function fetchEvents() {
    if (!API_URL) {
      track.innerHTML = "<div class=\"md-error\"><strong>Sony Liv feed is not configured</strong>Check script/config.js</div>";
      return;
    }
    if (!track.querySelector(".md-card")) renderSkeletons(4);
    getJSON(API_URL)
      .then(function (data) {
        var matches = extractMatches(data).slice();
        matches.sort(function (a, b) { return rank(a) - rank(b); });
        renderMatches(matches.slice(0, 20));
      })
      .catch(function () {
        track.innerHTML = "<div class=\"md-error\"><strong>Could not load Sony Liv</strong>Please refresh in a moment.</div>";
      });
  }

  function scrollAmt() {
    var card = track.querySelector(".md-card, .md-skeleton");
    if (!card) return 320;
    return (card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 20)) * 2;
  }

  if (arrowLeft) {
    arrowLeft.addEventListener("click", function (event) {
      event.preventDefault();
      track.scrollBy({ left: -scrollAmt(), behavior: "smooth" });
    });
  }
  if (arrowRight) {
    arrowRight.addEventListener("click", function (event) {
      event.preventDefault();
      track.scrollBy({ left: scrollAmt(), behavior: "smooth" });
    });
  }

  var loaded = false;
  var timer = null;

  function load() {
    if (loaded) return;
    loaded = true;
    fetchEvents();
    timer = window.setInterval(function () {
      if (!document.hidden) fetchEvents();
    }, 60000);
  }

  load();

  window.addEventListener("beforeunload", function () {
    if (timer) window.clearInterval(timer);
  });
})();
