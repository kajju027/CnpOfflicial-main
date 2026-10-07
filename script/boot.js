(function () {
  "use strict";

  var STAMP = String(Date.now());
  var FILE_MODE = location.protocol === "file:";
  var FILES = ["app.js", "willow-live.js", "sony-liv.js", "fancode.js", "world-sports.js", "scroll-anim.js"];
  var STARTED = false;

  var FALLBACK = {
    siteName: "CnpTV",
    heroSlideDuration: 10000,
    maxHeroMatches: 8,
    heroFeedUrl: "",
    apis: {
      willow: "https://sonujson-v5.pages.dev/Data/willow.json",
      willowLive: "https://sonujson-v5.pages.dev/Data/willow.json",
      willowSnapshot: "",
      fancode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
      fanCode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
      fancodeSnapshot: "",
      fanCodeSnapshot: "",
      worldSports: "https://matchdekho.in/api/world-sports.json",
      worldSportsSnapshot: "",
      sonyLiv: "https://raw.githubusercontent.com/kajju027/SonyLiv-Events-Json/refs/heads/main/sonyliv.json",
      sony: "https://raw.githubusercontent.com/kajju027/SonyLiv-Events-Json/refs/heads/main/sonyliv.json"
    },
    playerBase: "",
    routes: {
      willowPlayer: "/az/",
      fancodePlayer: "/fc/play/",
      sonyPlayer: "/player/sony"
    },
    willowPlayerMode: "stream",
    heroMatches: []
  };

  function load(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function startScripts() {
    if (STARTED) return;
    STARTED = true;
    FILES.forEach(function (name) {
      var s = document.createElement("script");
      s.src = "script/" + name + (FILE_MODE ? "" : "?t=" + STAMP);
      s.async = false;
      document.head.appendChild(s);
    });
  }

  function boot() {
    var cfg = window.CNPTV_CONFIG || window.MATCHDEKHO_CONFIG;
    if (!cfg || typeof cfg !== "object") cfg = FALLBACK;
    window.CNPTV_CONFIG = cfg;
    window.MATCHDEKHO_CONFIG = cfg;
    startScripts();
  }

  load("script/config.js" + (FILE_MODE ? "" : "?t=" + STAMP))
    .then(boot)
    .catch(function () {
      if (window.console && console.warn) console.warn("[boot] config.js did not load, using built-in defaults");
      boot();
    });
})();
