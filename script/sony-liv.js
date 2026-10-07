(function () {
  "use strict";

  var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
  var apis = cfg.apis || {};
  var routes = cfg.routes || {};
  var API_URL = apis.sonyLiv || apis.sony || apis.sonyliv || "";
  var PLAYER_ROUTE = routes.sonyPlayer || "/player/sony";
  var PLAYER_BASE = cfg.playerBase || "";

  var track = document.getElementById("sonyLivTrack");
  var arrowLeft = document.getElementById("sonyLivArrowLeft");
  var arrowRight = document.getElementById("sonyLivArrowRight");
  var section = document.getElementById("sonyLivSection");

  if (!track) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cleanTitle(value) {
    return String(value == null ? "" : value)
      .replace(/^\s*(upcoming|live|ended|finished)\s*[-:]\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isLive(status) {
    return String(status == null ? "" : status).trim().toUpperCase() === "LIVE";
  }

  function statusInfo(raw) {
    var label = String(raw == null ? "UPCOMING" : raw).trim();
    if (isLive(label)) return { label: "LIVE", className: "live" };
    var upper = label.toUpperCase();
    if (upper === "ENDED" || upper === "FINISHED" || upper === "COMPLETED") {
      return { label: "ENDED", className: "ended" };
    }
    if (!label) return { label: "UPCOMING", className: "upcoming" };
    return { label: upper, className: "upcoming" };
  }

  function rank(match) {
    return isLive(match && match.status) ? 0 : 1;
  }

  function playerUrl(id) {
    var route = String(PLAYER_ROUTE || "/player/sony");
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

  var FALLBACK = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540' viewBox='0 0 960 540'>" +
    "<defs><linearGradient id='g' x1='0' x2='1' y1='1' y2='0'>" +
    "<stop offset='0' stop-color='#101820'/><stop offset='1' stop-color='#1c3348'/>" +
    "</linearGradient></defs><rect width='960' height='540' fill='url(#g)'/>" +
    "<text x='480' y='286' fill='#ffffff' font-family='Arial,sans-serif' font-size='42' font-weight='700' text-anchor='middle'>SONY LIV</text></svg>"
  );

  function renderSkeletons(count) {
    var html = "";
    var i;
    for (i = 0; i < count; i++) {
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
    if (!matches || !matches.length) {
      track.innerHTML = "<div class=\"md-empty\"><strong>No Sony Liv events right now</strong>Check back soon.</div>";
      return;
    }

    var html = "";
    matches.forEach(function (match, index) {
      var id = match.match_id || match.id || match.event_id || "";
      var href = id === "" ? "" : playerUrl(id);
      var status = statusInfo(match.status);
      var live = status.className === "live";
      var eventName = cleanTitle(match.event_name || match.title || "Sony Liv");
      var matchName = cleanTitle(match.match_name || "");
      var title = matchName || eventName || "Sony Liv";
      var tournament = matchName ? eventName : (match.category || "Sony Liv");
      var channel = String(match.digital_broadcast || "").trim();
      var language = String(match.language || "").trim();
      var meta = [channel, language].filter(Boolean).join("  ·  ");
      var poster = match.poster || match.thumbnail || FALLBACK;
      var safeHref = escapeHtml(href);
      var safeTitle = escapeHtml(title);
      var safePoster = escapeHtml(poster);
      var watch = "";

      if (live && href) {
        watch = "<span class=\"md-watch-btn\" aria-hidden=\"true\">" +
          "<span class=\"md-watch-btn-icon\">&#9654;</span>WATCH NOW</span>";
      }

      html += (href ? "<a class=\"md-card md-" + status.className + "\" href=\"" + safeHref + "\"" : "<article class=\"md-card md-" + status.className + "\"") +
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
        "</div></div>" + (href ? "</a>" : "</article>");
    });

    track.innerHTML = html;
  }

  function stamp(url) {
    return url + (url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
  }

  function fetchEvents() {
    if (!API_URL) {
      track.innerHTML = "<div class=\"md-error\"><strong>Sony Liv feed is not configured</strong>Check script/config.js</div>";
      return;
    }
    if (!track.querySelector(".md-card")) renderSkeletons(4);
    fetch(stamp(API_URL), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
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

  if ("IntersectionObserver" in window && section) {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        load();
        obs.disconnect();
      }
    }, { rootMargin: "240px" });
    obs.observe(section);
  } else {
    load();
  }

  window.addEventListener("beforeunload", function () {
    if (timer) window.clearInterval(timer);
  });
})();
