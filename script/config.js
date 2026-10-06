var CNPTV_CONF = {
  siteName: "CnpTV",

  build: "9",
  forceScrollAnimation: true,

  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",

  apis: {
    willow: "https://sonujson-v5.pages.dev/Data/willow.json",
    willowLive: "https://sonujson-v5.pages.dev/Data/willow.json",
    willowSnapshot: "api/willow.json",
    fancode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    fanCode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    fancodeSnapshot: "api/fancode.json",
    fanCodeSnapshot: "api/fancode.json",
    worldSports: "https://matchdekho.in/api/world-sports.json",
    worldSportsSnapshot: "api/world-sports.json"
  },

  playerBase: "",

  routes: {
    willowPlayer: "/az/",
    fancodePlayer: "/fc/play/"
  },

  willowPlayerMode: "stream",

  heroMatches: [
    {
      tournament: "MESSI LAST DANCE - 2026",
      homeTeam: {
        name: "Argentina",
        logo: "https://flagpedia.net/data/flags/w1160/ar.webp"
      },
      awayTeam: {
        name: "Benin",
        logo: "https://flagpedia.net/data/flags/w1160/bj.webp"
      },
      poster: "https://akamaividz2.zee5.com/image/upload/w_1280,h_720,c_scale,f_avif,q_auto:eco/resources/0-1-6z51074314/list/00000000019f374a24280a48a8b4ffd65cc5cf07ca.jpg",
      watchUrl: "home/live/arg-vs-ben.html"
    }
  ]
};

window.CNPTV_CONFIG = CNPTV_CONF;
window.MATCHDEKHO_CONFIG = CNPTV_CONF;
