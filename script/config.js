window.CNPTV_CONFIG = {
  siteName: "CnpTV",

  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",

  apis: {
    willow: "https://sonujson-v5.pages.dev/Data/willow.json",
    willowLive: "https://sonujson-v5.pages.dev/Data/willow.json",
    fancode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    fanCode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    worldSports: "https://matchdekho.in/api/world-sports.json"
  },

  playerBase: "",

  routes: {
    willowPlayer: "/az/",
    fancodePlayer: "/fc/play/"
  },

  willowPlayerMode: "stream",

  heroMatches: [
    {
      tournament: "WI TOUR OF INDIA, 2026 - 1ST T20I",
      homeTeam: {
        name: "India",
        logo: "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      awayTeam: {
        name: "West Indies",
        logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"
      },
      poster: "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i",
      watchUrl: "/live/ind-vs-wi.html"
    },
    {
      tournament: "FIFA FRIENDLY 2026 - INDIA VS URUGUAY",
      homeTeam: {
        name: "India",
        logo: "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      awayTeam: {
        name: "Uruguay",
        logo: "https://flagpedia.net/data/flags/w1160/uy.webp"
      },
      poster: "https://origin-staticv2.sonyliv.com/videoasset_images/manage_file/1000025899/1791239612288660_IND_vs_URU_tonight_landscape_thumb.jpg",
      watchUrl: "/live/ind-vs-uru.html"
    }
  ]
};
