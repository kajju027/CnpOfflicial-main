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

  /* -------------------------------------------------------------------
     HERO POSTERS  (slide 1 … slide n)
     Optional per-poster fields:
       posterPosition        -> desktop crop focus, e.g. "center 20%"
       posterPositionMobile  -> mobile crop focus   (hero is 4:3 on phones)
     Portrait posters (like the India-Uruguay FIFA one) only need a focus
     point; the image itself can stay portrait.
     ------------------------------------------------------------------- */
  heroMatches: [
    {
      tournament: "WI TOUR OF INDIA, 2026 \u00b7 1ST T20I",
      homeTeam: {
        name: "India",
        logo: "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      awayTeam: {
        name: "West Indies",
        logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"
      },
      poster: "https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i",
      posterPosition: "center 25%",
      watchUrl: "/live/ind-vs-wi.html"
    },
    {
      tournament: "FIFA FRIENDLY 2026 \u00b7 INDIA VS URUGUAY",
      homeTeam: {
        name: "India",
        logo: "https://flagpedia.net/data/flags/w1160/in.webp"
      },
      awayTeam: {
        name: "Uruguay",
        logo: "https://flagpedia.net/data/flags/w1160/uy.webp"
      },
      /* Portrait poster - the hero window is 16:9, so it is cropped on the
         faces instead of the middle. */
      poster: "https://images.slivcdn.com/videoasset_images/manage_file/1000025899/1791239662533660_IND_vs_URU_tonight_portrait_thumb.jpg",
      posterPosition: "center 0%",
      posterPositionMobile: "center 18%",
      watchUrl: "/live/ind-vs-uru.html"
    }
  ]
};
