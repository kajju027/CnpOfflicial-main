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

// @@EVENTS:[{"slug":"ind-vs-wi","tournament":"WEST INDIES TOUR OF INDIA - 2ND T20I","homeTeam":{"name":"India","code":"ind","label":"","logo":"https://flagpedia.net/data/flags/w1160/in.webp"},"awayTeam":{"name":"West Indies","code":"wi","label":"","logo":"https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Cricket_West_Indies_flag_2017.svg/1920px-Cricket_West_Indies_flag_2017.svg.png"},"poster":"https://img10.hotstar.com/image/upload/f_auto,q_90,w_1920/sources/r1/cms/prod/9280/1791259109280-i","date":"09 OCT 2026, 07:00 PM","description":"🇮🇳 INDIA vs WEST INDIES 🇯🇲 | 2ND T20I | 9 OCTOBER 2026 🏏🔥 India will face the West Indies in the second T20 International of the five-match series on Friday, 9 October 2026, at the JSCA International Stadium Complex in Ranchi, Jharkhand. The match is scheduled to begin at 7:00 PM IST, with the toss at 6:30 PM IST. India enter this contest with a 1–0 series lead after securing a dominant eight-wicket victory in the opening match at Lucknow on 6 October. The West Indies scored 171 runs before being bowled out, with Shai Hope making 52 and Sherfane Rutherford scoring 56. In reply, India chased down the target in just 14.4 overs, finishing at 172/2, as captain Shreyas Iyer smashed an unbeaten 102 off 43 balls and Ishan Kishan provided valuable support. India will now aim to extend their advantage to 2–0, while the Caribbean side will be desperate to level the series. 🇮🇳🔥\n\nThe Indian squad features Shreyas Iyer (captain), Abhishek Sharma, Vaibhav Sooryavanshi, Ishan Kishan, Sanju Samson, Tilak Varma, Shivam Dube, Axar Patel, Kuldeep Yadav, Ravi Bishnoi, Nitish Kumar Reddy, Arshdeep Singh, Mayank Yadav, Prince Yadav and Naman Dhir. The West Indies squad includes Shai Hope (captain), Jewel Andrew, Amir Jangoo, Roston Chase, Matthew Forde, Shimron Hetmyer, Akeal Hosein, Shamar Joseph, Gudakesh Motie, Keemo Paul, Kamil Pooran, Rovman Powell, Sherfane Rutherford, Quentin Sampson, Romario Shepherd and Shamar Springer. Key players to watch include Shreyas Iyer, Ishan Kishan, Abhishek Sharma, Shai Hope, Shimron Hetmyer and Rovman Powell. In India, the match will be broadcast on the Star Sports Network, with live streaming available on JioHotstar. India have won 21 of the 32 previous T20I meetings between the sides, compared with 10 West Indies victories and one no-result match. With explosive batting, competitive bowling and an important series advantage at stake, the second T20I promises an exciting contest. Who will win today — India or the West Indies? Share your prediction in the comments! 🏆🔥 #INDvsWI #IndiaVsWestIndies #2ndT20I #INDvsWI2026 #TeamIndia #WestIndiesCricket #T20Cricket #CricketNews","channels":[{"name":"Hindi HD","label":"","url":"https://sonucdn-v3.pages.dev/star.html?id=H1HD","external":false},{"name":"English HD","label":"","url":"https://sonucdn-v3.pages.dev/star.html?id=E1HD","external":false}]},{"slug":"afg-vs-ban","tournament":"1ST TEST MATCH 2026","homeTeam":{"name":"Afghanistan","code":"afg","label":"","logo":"https://flagcdn.com/w1160/af.webp"},"awayTeam":{"name":"Bangladesh","code":"bd","label":"","logo":"https://flagcdn.com/w1160/bd.webp"},"poster":"https://ik.imagekit.io/sonuxs/Bangladesh%20vs%20Afghanistan%20test%20match","date":"09 OCT 2026, 11:00 AM","description":"Afghanistan and Bangladesh are facing each other in a one-off Test match at the Zayed Cricket Stadium in Abu Dhabi from October 9 to 13, 2026. Led by Najmul Hossain Shanto, Bangladesh will aim to build a strong first-innings total, while Rahmat Shah’s Afghanistan will look to challenge them with disciplined bowling and spin. With both teams eager to secure victory, batting consistency, bowling performance and adaptability to the conditions will be crucial in deciding the outcome.","channels":[{"name":"Fancode FHD","label":"","url":"https://matchdekho.pages.dev/player/PR?url=https://akamaii.lovable.app/api/public/px/fancode?url=https://in-mc-plive.fancode.com/mumbai/4249693_english_hls_aaca093f3b682701ta-di_h264/1080p.m3u8?hdntl=Expires=1791607022~_GO=Generated~acl=/mumbai/4249693_english_hls_aaca093f3b682701ta-di_h264/*~SessionID=7076612632_watcho_fa6b2595-bff2-43~Signature=AXZsC1C0RXD7c64UuxA1GZDAfjnnJIim-P8PlmYozuqbXfT8yeKiEshsnsJevjBN8IbXKAaD9NME0TpUZlzFY5TA1UJ","external":false},{"name":"Willow","label":"","url":"https://matchdekho.pages.dev/player/drm?url=https://abfjk4haaaaaaaamkitc5445rybm6.bia-cf.live.pv-cdn.net/iad-nitro/live/clients/dash/enc/94oo2jxxp4/out/v1/c6789bc599e54c3bb1f26880531b8531/cenc.mpd&keys=effa45e438d4a21939035abc7cf5d3a4:d2f43abbc17cb5e3c05c5f14fd1e8181","external":false}]}]
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
