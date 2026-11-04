(function () {
  "use strict";

  var STAMP = String(Date.now());
  var FILE_MODE = location.protocol === "file:";

  var FILES = [
    "app.js",
    "live-events.js",
    "willow-live.js",
    "fancode.js",
    "world-sports.js",
    "sony-liv.js",
    "platform-status.js",
    "scroll-anim.js",
    "landing-news.js"
  ];

  var STARTED = false;

  var FALLBACK = {
    siteName: "MatchCentral",
    heroSlideDuration: 10000,
    maxHeroMatches: 8,
    heroFeedUrl: "",
    apis: {
      football:            "https://sonujson-v5.pages.dev/Data/events/football.json",
      cricket:             "https://sonujson-v5.pages.dev/Data/events/cricket.json",
      willow:              "https://sonujson-v5.pages.dev/Data/willow.json",
      willowLive:          "https://sonujson-v5.pages.dev/Data/willow.json",
      willowSnapshot:      "",
      fancode:             "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
      fanCode:             "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
      fancodeSnapshot:     "",
      fanCodeSnapshot:     "",
      worldSports:         "https://matchdekho.in/api/world-sports.json",
      worldSportsSnapshot: "",
      sonyLiv:             "https://raw.githubusercontent.com/kajju027/SonyLiv-Events-Json/refs/heads/main/sonyliv.json",
      sony:                "https://raw.githubusercontent.com/kajju027/SonyLiv-Events-Json/refs/heads/main/sonyliv.json"
    },
    sections: {
      football:    { link: "/watch/football/",   idMode: "param", idKey: "id", viewAllLink: "/watch/football/"  },
      cricket:     { link: "/watch/cricket/",    idMode: "param", idKey: "id", viewAllLink: "/watch/cricket/"   },
      willow:      { link: "/watch/willow/",     idMode: "param", idKey: "id", viewAllLink: "/watch/willow/"    },
      fancode:     { link: "/watch/fancode/pz/", idMode: "param", idKey: "id", viewAllLink: "/watch/fancode/"   },
      worldSports: { link: "/watch/wwsports/",   idMode: "param", idKey: "id", viewAllLink: "/watch/wwsports/"  },
      sonyLiv:     { link: "/watch/sliv/",       idMode: "param", idKey: "id", viewAllLink: "/watch/sliv/"      }
    },
    cardLimit: 10,
    upcomingClickable: true,
    siteBase: "",
    labels: {
      watchNow:   "Watch Now",
      comingSoon: "Coming Soon",
      viewAll:    "View All Events"
    },
    playerBase: "",
    routes: {
      willowPlayer:  "/watch/willow/",
      fancodePlayer: "/watch/fancode/pz/",
      sonyPlayer:    "/watch/sliv/"
    },
    willowPlayerMode: "stream",
    heroMatches: []
  };

  function load(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      var finished = false;
      var timeout;

      function finish(error) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        s.onload  = null;
        s.onerror = null;
        if (error) reject(error); else resolve();
      }

      s.src     = url;
      s.onload  = function () { finish(); };
      s.onerror = function () { finish(new Error("Script failed to load: " + url)); };
      timeout   = window.setTimeout(function () {
        finish(new Error("Script timed out: " + url));
      }, 8000);
      document.head.appendChild(s);
    });
  }

  function startScripts() {
    if (STARTED) return;
    STARTED = true;
    FILES.forEach(function (name) {
      var s   = document.createElement("script");
      s.src   = "script/" + name + (FILE_MODE ? "" : "?t=" + STAMP);
      s.async = false;
      document.head.appendChild(s);
    });
  }

  function boot() {
    var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG;
    if (!cfg || typeof cfg !== "object") cfg = FALLBACK;
    window.CNPTV_CONFIG      = cfg;
    window.MATCHDEKHO_CONFIG = cfg;

    if (!window.CnpTVHelper) {
      window.CnpTVHelper = (function () {
        function buildUrl(sectionCfg, eventId) {
          var c = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
          var siteBase = String(c.siteBase || "").replace(/\/+$/, "");
          var base = String(sectionCfg && sectionCfg.link || "");
          if (!base) return "";
          var resolved = (base.indexOf("://") === -1 && siteBase) ? (siteBase + base) : base;
          if (!eventId) return resolved;
          var mode = String(sectionCfg.idMode || "param");
          var key  = String(sectionCfg.idKey  || "id");
          if (mode === "path") return resolved.replace(/\/$/, "") + "/" + encodeURIComponent(eventId);
          var sep = resolved.indexOf("?") > -1 ? "&" : "?";
          return resolved + sep + encodeURIComponent(key) + "=" + encodeURIComponent(eventId);
        }
        function extractId(item) {
          if (!item || typeof item !== "object") return "";
          return String(item.id || item.matchId || item.match_id || item.matchID || item.stream_id || "");
        }
        function toTitleCase(str) {
          return String(str || "").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        }
        return { buildUrl: buildUrl, extractId: extractId, toTitleCase: toTitleCase };
      })();
    }

    startScripts();
  }

  load("script/config.js" + (FILE_MODE ? "" : "?t=" + STAMP))
    .then(boot)
    .catch(function () {
      if (window.console && console.warn) {
        console.warn("[boot] config.js did not load, using built-in defaults");
      }
      boot();
    });
})();
