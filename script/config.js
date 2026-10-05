window.MATCHDEKHO_CONFIG = {
  siteName: "matchdekho",
  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",
  apis: {
    willow: "https://sonujson-v5.pages.dev/Data/willow.json",
    fancode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    worldSports: "https://matchdekho.in/api/world-sports.json"
  },
  routes: {
    willowPlayer: "/az/",
    fancodePlayer: "/fc/play/"
  },
  heroMatches: [
    {
      tournament: "WI TOUR OF INDIA, 2026",
      homeTeam: {
        name: "India",
        logo: "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      awayTeam: {
        name: "West Indies",
        logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"
      },
      poster: "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/641/1791213070641-i",
      watchUrl: "/live/ind-vs-wi.html"
    }
  ]
};
