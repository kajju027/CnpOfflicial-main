var CNPTV_CONF = {
  siteName: "MatchCentral",

  build: "24",
  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",
  eventRefreshMs: 300000,

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
    willow:      { link: "/watch/willow/",     idMode: "param", idKey: "", viewAllLink: "/watch/willow/"    },
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

window.CNPTV_CONFIG      = CNPTV_CONF;
window.MATCHDEKHO_CONFIG = CNPTV_CONF;

window.CnpTVHelper = (function () {
  function buildUrl(sectionCfg, eventId) {
    var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG || {};
    var siteBase = String(cfg.siteBase || "").replace(/\/+$/, "");
    var base = String(sectionCfg && sectionCfg.link || "");
    if (!base) return "";
    var resolved = (base.indexOf("://") === -1 && siteBase) ? (siteBase + base) : base;
    if (!eventId) return resolved;
    var mode = String(sectionCfg.idMode || "param");
    var key  = String(sectionCfg.idKey  || "id");
    if (mode === "path") {
      return resolved.replace(/\/$/, "") + "/" + encodeURIComponent(eventId);
    }
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

if (typeof CNPTV_CONF !== "undefined" && CNPTV_CONF) {
  CNPTV_CONF.heroMatches = [
    {
      "tournament": "WEST INDIES TOUR OF INDIA - 3RD T20I",
      "homeTeam": {
        "name": "India",
        "logo": "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      "awayTeam": {
        "name": "West Indies",
        "logo": "https://upload.wikimedia.org/wikipedia/de/f/f8/West_Indies_Cricket_Board_Logo.svg?utm_source=de.wikipedia.org&utm_campaign=index&utm_content=original"
      },
      "poster": "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i",
      "date": "17 OCT 2026, 07:00 PM",
      "watchUrl": "/home/live/ind-vs-wi.html"
    }
  ];
}

if(typeof CNPTV_CONF!=='undefined'&&CNPTV_CONF){
  CNPTV_CONF.heroMatches = [
    {
      "tournament": "INDIA TOUR OF NEW ZEALAND 2026 - 2ND ODI",
      "homeTeam": {
        "name": "India",
        "logo": "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      "awayTeam": {
        "name": "New Zealand",
        "logo": "https://flagpedia.net/data/flags/w1160/nz.webp"
      },
      "poster": "https://imgh.in/host/l3k0qd",
      "date": "3RD ODI MATCH LIVE - 07 : 00 AM",
      "watchUrl": "/home/live/ind-vs-nz.html"
    },
    {
      "tournament": "ACC MEN'S ASIA CUP 2026",
      "homeTeam": {
        "name": "India",
        "logo": "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      "awayTeam": {
        "name": "Afghanistan",
        "logo": "https://flagpedia.net/data/flags/w1160/af.webp"
      },
      "poster": "https://imgh.in/host/zgw4fb",
      "date": "08 NOV - 14 NOV 2026 - 10:00 AM",
      "watchUrl": "/home/live/acc-asiacup-2026.html"
    },
    {
      "tournament": "Zimbabwe Tour of Afghanistan in UAE, 2026",
      "homeTeam": {
        "name": "Afganistan",
        "logo": "https://flagpedia.net/data/flags/w1160/af.webp"
      },
      "awayTeam": {
        "name": "Zimbabwe",
        "logo": "https://flagpedia.net/data/flags/w1160/zw.webp"
      },
      "poster": "https://images.fancode.com/skillup-uploads/cms-media/AFG-vs-ZIM_Test_fc-app-v2.jpg?hash=eyJrZXkiOiJza2lsbHVwLXVwbG9hZHMvY21zLW1lZGlhL0FGRy12cy1aSU1fVGVzdF9mYy1hcHAtdjIuanBnIiwiZWRpdHMiOnsicmVzaXplIjp7ImZpdCI6ImNvdmVyIiwid2lkdGgiOjgwMCwiaGVpZ2h0IjoxMDAwfSwid2VicCI6eyJxdWFsaXR5Ijo2MCwibG9zc2xlc3MiOmZhbHNlfX0sIm91dHB1dEZvcm1hdCI6IndlYnAifQ==",
      "date": "05 NOVEMBER 2026 - 10:30 AM",
      "watchUrl": "/home/live/afg-vs-zim.html"
    }
  ];
}
