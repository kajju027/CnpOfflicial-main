/* =====================================================================
   matchdekho — site config
   ---------------------------------------------------------------------
   IMPORTANT (v3.1 fix):
   The section scripts read  cfg.apis.willowLive / cfg.apis.fanCode.
   The old config file only had  willow / fancode, so those two keys
   were "undefined" and the Willow + FanCode sections could never load.
   Both spellings are now kept in sync below, so no script can break.
   ===================================================================== */

window.MATCHDEKHO_CONFIG = {
  siteName: "matchdekho",

  /* Bump this whenever you upload new css/js (see index.html ?v=...).
     It is only documentation — the real cache-buster is the ?v= string
     on the <link>/<script> tags in index.html. */
  assetVersion: "2026-10-06-1",

  heroSlideDuration: 10000,
  maxHeroMatches: 8,
  heroFeedUrl: "",

  apis: {
    /* Willow Cricket feed */
    willow: "https://sonujson-v5.pages.dev/Data/willow.json",
    willowLive: "https://sonujson-v5.pages.dev/Data/willow.json",

    /* FanCode feed */
    fancode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",
    fanCode: "https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json",

    /* World Sports feed */
    worldSports: "https://matchdekho.in/api/world-sports.json"
  },

  /* Where the video player pages live.
     Leave empty ("") when the player is on THIS same site (/az/, /fc/play/).
     Put a full origin (e.g. "https://matchdekho.in") when the players live
     on another domain — then links become https://matchdekho.in/az/?... */
  playerBase: "",

  routes: {
    willowPlayer: "/az/",
    fancodePlayer: "/fc/play/"
  },

  /* Willow watch-link format (pick ONE):
     "stream" → /az/?id=<match-id>&ser=<akamai_server1 stream url>   (v3 documented format)
     "index"  → /az/?<match-id>&ser=1                                (older build behaviour)
     If your /az/ player expects the other one, just change this word. */
  willowPlayerMode: "stream",

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
