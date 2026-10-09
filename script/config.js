var CNPTV_CONF = {
  siteName: "CnpTV",

  build: "12",
  forceScrollAnimation: true,

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

window.CNPTV_CONFIG = CNPTV_CONF;
window.MATCHDEKHO_CONFIG = CNPTV_CONF;


if (typeof CNPTV_CONF !== "undefined" && CNPTV_CONF) {
  CNPTV_CONF.heroMatches = [
    {
      "tournament": "1ST TEST MATCH 2026",
      "homeTeam": {
        "name": "Afghanistan",
        "logo": "https://flagcdn.com/w1160/af.webp"
      },
      "awayTeam": {
        "name": "Bangladesh",
        "logo": "https://flagcdn.com/w1160/bd.webp"
      },
      "poster": "https://ik.imagekit.io/sonuxs/Bangladesh%20vs%20Afghanistan%20test%20match",
      "watchUrl": "/home/live/afg-vs-ban.html"
    },
    {
      "tournament": "WEST INDIES TOUR OF INDIA - 2ND T20I",
      "homeTeam": {
        "name": "India",
        "logo": "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      "awayTeam": {
        "name": "West Indies",
        "logo": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"
      },
      "poster": "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i",
      "watchUrl": "/home/live/ind-vs-wi.html"
    }
  ];
}

if(typeof CNPTV_CONF!=='undefined'&&CNPTV_CONF){
  CNPTV_CONF.heroMatches = [
    {
      "tournament": "WEST INDIES TOUR OF INDIA - 2ND T20I",
      "homeTeam": {
        "name": "India",
        "logo": "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      "awayTeam": {
        "name": "West Indies",
        "logo": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"
      },
      "poster": "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i",
      "date": "09 OCT 2026, 07:00 PM",
      "watchUrl": "/home/live/ind-vs-wi.html"
    }
  ];
}
