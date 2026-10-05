window.MATCHDEKHO_CONFIG = {
  siteName: "matchdekho",
  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",
  apis: {
    willow: "https://willow-api.sayanwork-studioo.workers.dev/",
    fancode: "https://raw.githubusercontent.com/drmlive/fancode-live-events/refs/heads/main/fancode.json",
    worldSports: "https://matchdekho.in/api/world-sports.json"
  },
  routes: {
    fancodePlayer: "/fc-play.html"
  },
  heroMatches: [
    {
      tournament: "UEFA NATIONS LEAGUE, 2026",
      homeTeam: {
        name: "Portugal",
        logo: "https://flagpedia.net/data/flags/w1160/pt.webp"
      },
      awayTeam: {
        name: "Norway",
        logo: "https://flagpedia.net/data/flags/w1160/no.webp"
      },
      poster: "https://img.tod.tv/resources/images/link/192e0c70-8f63-37a6-82cd-4b8bf2d188a4/6060b852-c1ae-5aac-985e-64478041ec5e/639267051693920000/0:0:1912:1080/1920x1080/3739d37e-1d96-4213-bf70-b7a1b0c68037_wallpaper-169-en.webp",
      watchUrl: "/live/nations-league.html"
    },
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
      poster: "https://img10.hotstar.com/image/upload/f_auto,q_90/sources/r1/cms/prod/3888/1790435993888-i",
      watchUrl: "/live/ind-vs-wi.html"
    }
  ]
};
