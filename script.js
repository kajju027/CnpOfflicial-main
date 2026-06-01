'use strict';

var WHATSAPP_LINK = "https://whatsapp.com/channel/0029VaeylYYBPzjVNomWuZ0T";
var VIEW_API_BASE = "https://sayan-prime.pages.dev/api";
var DATA_SOURCES  = [
  "https://sayan-json-4.pages.dev/loura.json",
  "https://allrounderlive.in/id.json"
];
var IPL_DATA_URL  = "https://sayan-json-4.pages.dev/api/ipl-data.json";

var allStreams = [];

var _dataPromise = null;
function prefetchData() {
  if (_dataPromise) return _dataPromise;
  _dataPromise = Promise.all(
    DATA_SOURCES.map(function(url) {
      return fetch(url, { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .catch(function() { return null; });
    })
  );
  return _dataPromise;
}
prefetchData();

function getStreamId() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (id && id.trim()) return id.trim();
  var raw = window.location.search;
  if (raw && raw.length > 1) {
    var noQ = raw.slice(1);
    var eqIdx = noQ.indexOf('=');
    if (eqIdx !== -1) {
      var val = noQ.slice(eqIdx + 1);
      if (val && val.trim()) return decodeURIComponent(val.trim());
    }
    if (noQ && noQ.trim() && noQ.indexOf('=') === -1) {
      return decodeURIComponent(noQ.trim());
    }
  }
  return null;
}

function escHtml(str) {
  var d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function closePopup() {
  var el = document.getElementById('popup');
  if (el) el.classList.remove('visible');
}
function showPopup() {
  var el = document.getElementById('popup');
  if (el) el.classList.add('visible');
}
function joinNow() {
  closePopup();
  window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
}
function alreadyJoined() { closePopup(); }

function initPopupButtons() {
  var j = document.getElementById('popupJoinBtn');
  var a = document.getElementById('popupSkipBtn');
  if (j) j.addEventListener('click', joinNow);
  if (a) a.addEventListener('click', alreadyJoined);
}

function initBell() {
  var btn = document.getElementById('bellBtn');
  var svg = document.getElementById('bellSvg');
  if (!btn || !svg) return;
  function ring() {
    svg.classList.remove('idle', 'ringing');
    void svg.offsetWidth;
    svg.classList.add('ringing');
    setTimeout(function() {
      svg.classList.remove('ringing');
      svg.classList.add('idle');
    }, 700);
  }
  btn.addEventListener('click', ring);
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ring(); }
  });
}

function addShimmer() {
  var w = document.getElementById('videoWrapper');
  if (!w || document.getElementById('iframeShimmer')) return;
  if (!document.getElementById('shimmerStyle')) {
    var st = document.createElement('style');
    st.id = 'shimmerStyle';
    st.textContent = '@keyframes shimmerSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(st);
  }
  var s = document.createElement('div');
  s.id = 'iframeShimmer';
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,#1a1a2e 25%,#252540 50%,#1a1a2e 75%);background-size:200% 100%;animation:shimmerSlide 1.4s linear infinite;z-index:2;pointer-events:none';
  w.style.position = 'relative';
  w.insertBefore(s, w.firstChild);
}

function removeShimmer() {
  var s = document.getElementById('iframeShimmer');
  if (s && s.parentNode) s.parentNode.removeChild(s);
}

function initVisitorCounter() {
  fetch(IPL_DATA_URL, { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var s = d.sections && d.sections.find(function(x) { return x.slot === 'NEW'; });
      if (!s) return;
      fetch(VIEW_API_BASE + '/hit?key=' + encodeURIComponent('IPL-2026_' + s.id)).catch(function() {});
    }).catch(function() {});
}

function renderStream(stream) {
  var wrapper  = document.getElementById('videoWrapper');
  var frame    = document.getElementById('videoFrame');
  var titleEl  = document.getElementById('pageTitle');
  var errBox   = document.getElementById('errorBox');

  if (errBox) errBox.style.display = 'none';
  if (wrapper) wrapper.style.display = 'block';

  addShimmer();

  var t = setTimeout(removeShimmer, 12000);
  frame.addEventListener('load', function onLoad() {
    frame.removeEventListener('load', onLoad);
    clearTimeout(t); removeShimmer();
  });
  frame.addEventListener('error', function onErr() {
    frame.removeEventListener('error', onErr);
    clearTimeout(t); removeShimmer();
  });

  frame.src = stream.iframeSrc;

  if (titleEl) titleEl.innerText = stream.name || 'Cricket News Point';
  document.title = (stream.name || 'Cricket News Point') + ' \u2013 Cricket News Point';

  setTimeout(function() { showPopup(); }, 1200);
  setTimeout(initVisitorCounter, 600);
}

function renderError(id) {
  var wrapper = document.getElementById('videoWrapper');
  var errBox  = document.getElementById('errorBox');
  var errId   = document.getElementById('errorId');
  var titleEl = document.getElementById('pageTitle');

  if (wrapper) wrapper.style.display = 'none';
  if (errBox)  errBox.style.display  = 'block';
  if (errId && id) errId.textContent = '"' + id + '"';
  if (titleEl) titleEl.innerText = 'Stream Not Found';
  document.title = 'Stream Not Found \u2013 Cricket News Point';
  setTimeout(initVisitorCounter, 600);
}

function initApp() {
  var id = getStreamId();

  if (!id) {
    setTimeout(initVisitorCounter, 600);
    return;
  }

  var wrapper = document.getElementById('videoWrapper');
  if (wrapper) wrapper.style.display = 'block';
  addShimmer();

  prefetchData().then(function(results) {
    var found = null;
    for (var i = 0; i < results.length; i++) {
      if (!results[i]) continue;
      var iframes = results[i].iframes;
      if (!Array.isArray(iframes)) continue;
      var match = iframes.find(function(x) { return x.id === id; });
      if (match) { found = match; break; }
    }

    allStreams = [];
    results.forEach(function(r) {
      if (r && Array.isArray(r.iframes)) allStreams = allStreams.concat(r.iframes);
    });

    if (found) {
      renderStream(found);
    } else {
      removeShimmer();
      renderError(id);
    }
  }).catch(function() {
    removeShimmer();
    renderError(id);
  });
}

function initShareButton() {
  var btn = document.getElementById('shareButton');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var url   = window.location.href;
    var title = document.title;
    var text  = title + '\n\nFrom Cricket News Point\n\nWatch Live Cricket Streaming Free in HD !!';
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function() {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function() { showToast('Link Copied to Clipboard !!'); })
        .catch(function() { fallbackCopy(url); });
    } else { fallbackCopy(url); }
  });
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showToast('Link Copied to Clipboard !!'); }
  catch(e) { alert('Link: ' + text); }
  document.body.removeChild(ta);
}

function showToast(msg) {
  var old = document.getElementById('cnpToast');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  var t = document.createElement('div');
  t.id = 'cnpToast'; t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%) translateY(10px);background:rgba(30,41,59,0.92);color:#fff;padding:10px 20px;border-radius:24px;font-size:13px;font-family:inherit;font-weight:500;white-space:nowrap;z-index:99999;opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)';
  document.body.appendChild(t);
  requestAnimationFrame(function() { requestAnimationFrame(function() {
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  }); });
  setTimeout(function() {
    t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
  }, 2400);
}

function initFullscreen() {
  function onFs() {
    var el = document.fullscreenElement || document.webkitFullscreenElement ||
             document.mozFullScreenElement || document.msFullscreenElement;
    if (el && screen.orientation && screen.orientation.lock)
      screen.orientation.lock('landscape').catch(function() {});
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
  document.addEventListener('mozfullscreenchange', onFs);
  document.addEventListener('MSFullscreenChange', onFs);
}

function updateFooterCount(n) {
  if (!n || isNaN(n) || n <= 0) return false;
  var el = document.getElementById('footerCount');
  if (el) el.textContent = n;
  return true;
}

function extractScCount() {
  var c = document.getElementById('sc-hidden');
  if (!c) return false;
  var imgs = c.querySelectorAll('img');
  for (var i = 0; i < imgs.length; i++) {
    var n = parseInt((imgs[i].getAttribute('alt') || '').trim(), 10);
    if (!isNaN(n) && n > 0 && n < 1000000) return updateFooterCount(n);
    var m = (imgs[i].getAttribute('src') || '').match(/[?&](?:count|c|n|v)=(\d+)/i);
    if (m) { var n2 = parseInt(m[1], 10); if (!isNaN(n2) && n2 > 0) return updateFooterCount(n2); }
  }
  var els = c.querySelectorAll('span,b,strong,div,p');
  for (var j = 0; j < els.length; j++) {
    var v = parseInt((els[j].textContent || '').trim(), 10);
    if (!isNaN(v) && v > 0 && v < 1000000) return updateFooterCount(v);
  }
  return false;
}

var _scAttempts = 0;
var _scTimer = setInterval(function() {
  if (extractScCount() || ++_scAttempts > 60) clearInterval(_scTimer);
}, 500);

setTimeout(function() {
  var el = document.getElementById('footerCount');
  if (el && el.textContent === '--') el.textContent = '770';
}, 3500);

var I = {
  lock:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
  doc:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  warn:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
  mail:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
  msg:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
  info:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  dot:'<svg fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>',
  clk:'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-width="2" d="M12 6v6l4 2"/></svg>'
};

function sec(ic, svg, title, body) {
  return '<div class="ls-section"><div class="ls-section-head"><span class="ls-section-icon '+ic+'">'+svg+'</span><span class="ls-section-title">'+title+'</span></div>'+body+'</div>';
}
function kp(t) { return '<div class="ls-kp">'+I.dot+'<span>'+t+'</span></div>'; }
function wn(t) { return '<div class="ls-warn">'+I.warn+'<span>'+t+'</span></div>'; }

var LEGAL = {
  privacy:{
    title:'Privacy Policy', ic:I.lock, icCls:'ic-blue', bg:'#eff6ff',
    html:
      '<span class="ls-top-badge">'+I.clk+' Last updated: June 2026</span>'+
      sec('ic-blue',I.info,'What We Collect',
        '<p>Cricket News Point (CNP) collects minimal data to operate this service — standard server logs including IP address, browser type, and pages visited — plus anonymised usage data via Google Analytics (GA4).</p>')+
      sec('ic-blue',I.info,'Cookies &amp; Analytics',
        '<p>Google Analytics tracks anonymised visit data. A third-party visitor counter widget is also active. You can disable cookies in your browser settings at any time.</p>')+
      sec('ic-blue',I.info,'Third-Party Services',
        '<p>CNP embeds content from third parties who operate under their own privacy policies. We are not responsible for their data practices.</p>')+
      sec('ic-blue',I.info,'Data Sharing',
        '<p>We do not sell, rent, or trade personal information. No targeted advertising is shown on this site.</p>')+
      sec('ic-blue',I.info,'Children &amp; Changes',
        '<p>This site is not directed at children under 13. We may update this policy from time to time. Continued use of CNP constitutes acceptance of the latest version.</p>')
  },
  terms:{
    title:'Terms of Use', ic:I.doc, icCls:'ic-purple', bg:'#f5f3ff',
    html:
      '<span class="ls-top-badge">'+I.dot+' Effective: June 2026</span>'+
      sec('ic-purple',I.doc,'Acceptance',
        '<p>By accessing Cricket News Point (CNP), you agree to these Terms. If you disagree, please stop using the service.</p>')+
      sec('ic-amber',I.warn,'Nature of Service',
        wn('CNP is a stream aggregator. We do not host, upload, encode, or store any video or broadcast content on our servers.')+
        kp('CNP works like a search engine — we index and link to publicly available external content.')+
        kp('All embedded streams belong to their respective rights holders. CNP makes no ownership claim over any broadcast content.'))+
      sec('ic-purple',I.doc,'Permitted Use',
        '<p>You may use CNP for personal, non-commercial purposes only. Scraping or commercially exploiting any part of this site without written consent is not permitted.</p>')+
      sec('ic-purple',I.doc,'Limitation of Liability',
        '<p>CNP is provided as-is with no warranty. We are not liable for stream availability, quality, or content in third-party embedded players.</p>')+
      sec('ic-purple',I.doc,'Governing Law',
        '<p>These terms are governed by the laws of India. Disputes fall under the jurisdiction of courts in West Bengal, India.</p>')
  },
  disclaimer:{
    title:'Disclaimer', ic:I.warn, icCls:'ic-amber', bg:'#fffbeb',
    html:
      '<span class="ls-top-badge">'+I.warn+' Important — Please Read</span>'+
      sec('ic-amber',I.warn,'No Hosted Content',
        wn('Cricket News Point does NOT host, upload, encode, or store any video, audio, or broadcast content on its servers.')+
        kp('CNP is a content aggregator. We surface streams already publicly available on the open internet.')+
        kp('All streams are served directly from third-party servers. CNP has zero control over their availability or content.')+
        kp('Our service functions exactly like a search engine — we index public URLs and display them in a user-friendly format.'))+
      sec('ic-amber',I.warn,'Copyright &amp; DMCA',
        '<p>If you are a copyright owner and believe a link on CNP infringes your rights, contact us immediately. We remove infringing links within 24 hours of a valid notice.</p>')+
      sec('ic-blue',I.info,'No Official Affiliation',
        '<p>CNP is an independent, fan-operated platform. We are not affiliated with the BCCI, ICC, IPL, Star Sports, JioCinema, Disney+ Hotstar, Zee Entertainment, FIFA, or any official broadcaster. All names and logos belong to their respective owners.</p>')+
      sec('ic-blue',I.info,'Social Channels',
        '<p>Our WhatsApp and Telegram channels share publicly available links. Neither the website nor the social channels accept responsibility for content accessed via external links.</p>')
  },
  contact:{
    title:'Contact Us', ic:I.mail, icCls:'ic-green', bg:'#f0fdf4',
    html:
      sec('ic-green',I.mail,'Get In Touch',
        '<p style="margin-bottom:11px;color:#8484a0;font-size:12.5px;">For DMCA / copyright takedown requests, stream issues, or any enquiry. We reply within <strong style="color:#e0e0ec;">48 hours</strong>.</p>'+
        '<a href="mailto:cricketnewspoint.cnp@gmail.com" class="ct-item">'+
          '<span class="ct-icon ic-amber">'+I.mail+'</span>'+
          '<span><span style="display:block;font-weight:700;color:#e0e0ec;">Email</span><span class="ct-sub">cricketnewspoint.cnp@gmail.com</span></span>'+
        '</a>'+
        '<a href="https://cnptv.pages.dev/Feedback" class="ct-item">'+
          '<span class="ct-icon ic-purple">'+I.msg+'</span>'+
          '<span><span style="display:block;font-weight:700;color:#e0e0ec;">Private Message</span><span class="ct-sub">Send via our feedback form</span></span>'+
        '</a>'+
        '<div class="ct-note">'+I.warn+'<span>Having trouble watching? Let us know. For DMCA takedowns, include the exact page URL and proof of ownership. Valid requests actioned within 24 hours.</span></div>')
  }
};

function initLegalSheets() {
  var lsOverlay  = document.getElementById('lsOverlay');
  var lsPanel    = document.getElementById('lsPanel');
  var lsTitleEl  = document.getElementById('lsTitleEl');
  var lsIcon     = document.getElementById('lsIcon');
  var lsBody     = document.getElementById('lsBody');
  var btnCloseLs = document.getElementById('btnCloseLs');

  function openSheet(key) {
    var d = LEGAL[key]; if (!d) return;
    lsTitleEl.textContent   = d.title;
    lsIcon.innerHTML        = d.ic;
    lsIcon.style.background = d.bg;
    lsBody.innerHTML        = d.html;
    lsOverlay.classList.add('open');
    lsPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    lsPanel.scrollTop = 0;
  }
  function closeSheet() {
    lsPanel.classList.remove('open');
    lsOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-sheet]').forEach(function(el) {
    el.addEventListener('click', function() { openSheet(el.getAttribute('data-sheet')); });
  });
  if (btnCloseLs) btnCloseLs.addEventListener('click', closeSheet);
  if (lsOverlay)  lsOverlay.addEventListener('click', closeSheet);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && lsPanel.classList.contains('open')) closeSheet();
  });
  var _sy = 0;
  lsPanel.addEventListener('touchstart', function(e) { _sy = e.touches[0].clientY; }, {passive:true});
  lsPanel.addEventListener('touchend', function(e) {
    if (e.changedTouches[0].clientY - _sy > 72 && lsPanel.scrollTop <= 0) closeSheet();
  }, {passive:true});
}

document.addEventListener('DOMContentLoaded', function() {
  initPopupButtons();
  initBell();
  initShareButton();
  initFullscreen();
  initLegalSheets();
  initApp();
});
