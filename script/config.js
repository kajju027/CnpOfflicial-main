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

// @@EVENTS:[{"slug":"ind-vs-wi","tournament":"WEST INDIES TOUR OF INDIA - 2ND T20I","homeTeam":{"name":"India","code":"ind","label":"","logo":"https://flagpedia.net/data/flags/w1160/in.webp"},"awayTeam":{"name":"West Indies","code":"wi","label":"","logo":"https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"},"poster":"https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i","date":"09 OCT 2026, 07:00 PM","description":"India will face the West Indies in the second T20I of the five-match series on 9 October 2026 at the JSCA International Stadium Complex in Ranchi, with the match scheduled to begin at 7:00 PM IST. \n\nIndia lead the series 1–0 after winning the opening match by eight wickets, powered by Shreyas Iyer’s explosive unbeaten century.\n\n Led by Iyer, India will aim to extend their lead, while Shai Hope’s West Indies will look to bounce back and level the series. With explosive batters and competitive bowling attacks on both sides, an exciting contest awaits.","channels":[{"name":"Hindi HD","label":"","url":"https://sonucdn-v3.pages.dev/star.html?id=H1HD","external":false},{"name":"English HD","label":"","url":"https://sonucdn-v3.pages.dev/star.html?id=E1HD","external":false}]},{"slug":"afg-vs-ban","tournament":"1ST TEST MATCH 2026","homeTeam":{"name":"Afghanistan","code":"afg","label":"","logo":"https://flagcdn.com/w1160/af.webp"},"awayTeam":{"name":"Bangladesh","code":"bd","label":"","logo":"https://flagcdn.com/w1160/bd.webp"},"poster":"https://ik.imagekit.io/sonuxs/Bangladesh%20vs%20Afghanistan%20test%20match","date":"09 OCT 2026, 11:00 AM","description":"Afghanistan and Bangladesh are facing each other in a one-off Test match at the Zayed Cricket Stadium in Abu Dhabi from October 9 to 13, 2026. Led by Najmul Hossain Shanto, Bangladesh will aim to build a strong first-innings total, while Rahmat Shah’s Afghanistan will look to challenge them with disciplined bowling and spin. With both teams eager to secure victory, batting consistency, bowling performance and adaptability to the conditions will be crucial in deciding the outcome.","channels":[{"name":"Fancode FHD","label":"","url":"https://matchdekho.pages.dev/player/PR?url=https://akamaii.lovable.app/api/public/px/fancode?url=https://in-mc-plive.fancode.com/mumbai/4249693_english_hls_aaca093f3b682701ta-di_h264/1080p.m3u8?hdntl=Expires=1791607022~_GO=Generated~acl=/mumbai/4249693_english_hls_aaca093f3b682701ta-di_h264/*~SessionID=7076612632_watcho_fa6b2595-bff2-43~Signature=AXZsC1C0RXD7c64UuxA1GZDAfjnnJIim-P8PlmYozuqbXfT8yeKiEshsnsJevjBN8IbXKAaD9NME0TpUZlzFY5TA1UJ","external":false},{"name":"Willow","label":"","url":"https://matchdekho.pages.dev/player/drm?url=https://abfjk4haaaaaaaamkitc5445rybm6.bia-cf.live.pv-cdn.net/iad-nitro/live/clients/dash/enc/94oo2jxxp4/out/v1/c6789bc599e54c3bb1f26880531b8531/cenc.mpd&keys=effa45e438d4a21939035abc7cf5d3a4:d2f43abbc17cb5e3c05c5f14fd1e8181","external":false}]}]
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
      "watchUrl": "/home/live/ind-vs-wi.html"
    },
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
    }
  ];
}
