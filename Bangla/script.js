'use strict';

var WHATSAPP_LINK  = "https://whatsapp.com/channel/0029VaeylYYBPzjVNomWuZ0T";
var VIEW_API_BASE  = "https://sayan-prime.pages.dev/api";
var DATA_SOURCES   = [
  "https://sayan-json-4.pages.dev/loura.json",
  "https://allrounderlive.in/id.json"
];
var IPL_DATA_URL   = "https://sayan-json-4.pages.dev/api/ipl-data.json";

var _cachedData    = null;
var _fetchPromise  = null;

function prefetchData() {
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = Promise.all(
    DATA_SOURCES.map(function(url) {
      return fetch(url, { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .catch(function() { return null; });
    })
  ).then(function(results) {
    _cachedData = results;
    return results;
  });
  return _fetchPromise;
}

function closePopup() {
  var popup = document.getElementById('popup');
  if (popup) popup.style.display = 'none';
}
function joinNow() {
  closePopup();
  window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
}
function alreadyJoined() { closePopup(); }

function updateFooterCount(num) {
  if (!num || isNaN(num) || num <= 0) return false;
  var el = document.getElementById('footerCount');
  if (el) el.textContent = num;
  return true;
}

function extractScCount() {
  var container = document.getElementById('sc-hidden');
  if (!container) return false;
  var imgs = container.querySelectorAll('img');
  for (var i = 0; i < imgs.length; i++) {
    var alt = (imgs[i].getAttribute('alt') || '').trim();
    var n   = parseInt(alt, 10);
    if (!isNaN(n) && n > 0 && n < 1000000) return updateFooterCount(n);
    var src = imgs[i].getAttribute('src') || '';
    var m   = src.match(/[?&](?:count|c|n|v)=(\d+)/i);
    if (m) { var n2 = parseInt(m[1], 10); if (!isNaN(n2) && n2 > 0) return updateFooterCount(n2); }
  }
  var els = container.querySelectorAll('span,b,strong,div,p');
  for (var j = 0; j < els.length; j++) {
    var raw = (els[j].textContent || '').trim();
    var val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0 && val < 1000000) return updateFooterCount(val);
  }
  return false;
}

var scAttempts = 0;
var scTimer = setInterval(function() {
  if (extractScCount() || ++scAttempts > 60) clearInterval(scTimer);
}, 500);

setTimeout(function() {
  var el = document.getElementById('footerCount');
  if (el && el.textContent === '--') el.textContent = '...';
}, 32000);

function initVisitorCounter() {
  fetch(IPL_DATA_URL, { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var tid = null;
      if (d.sections && d.sections.length) {
        var s = d.sections.find(function(x) { return x.slot === 'NEW'; });
        if (s) tid = s.id;
      }
      if (!tid) return;
      var key = 'IPL-2026_' + tid;
      fetch(VIEW_API_BASE + '/hit?key=' + encodeURIComponent(key)).catch(function() {});
    })
    .catch(function() {});
}

function addIframeShimmer() {
  var wrapper = document.getElementById('videoWrapper');
  if (!wrapper || document.getElementById('iframeShimmer')) return;
  var shimmer = document.createElement('div');
  shimmer.id = 'iframeShimmer';
  shimmer.setAttribute('aria-hidden', 'true');
  shimmer.style.cssText = [
    'position:absolute', 'inset:0', 'border-radius:inherit',
    'background:linear-gradient(90deg,#e2e8f0 25%,#f0f4f8 50%,#e2e8f0 75%)',
    'background-size:200% 100%',
    'animation:shimmerSlide 1.4s linear infinite',
    'z-index:2', 'pointer-events:none'
  ].join(';');
  if (!document.getElementById('shimmerStyle')) {
    var st = document.createElement('style');
    st.id = 'shimmerStyle';
    st.textContent = '@keyframes shimmerSlide{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(st);
  }
  wrapper.style.position = 'relative';
  wrapper.insertBefore(shimmer, wrapper.firstChild);
}

function removeIframeShimmer() {
  var s = document.getElementById('iframeShimmer');
  if (s && s.parentNode) s.parentNode.removeChild(s);
}

function loadStream(targetId) {
  var frame    = document.getElementById('videoFrame');
  var wrapper  = document.getElementById('videoWrapper');
  var titleEl  = document.getElementById('pageTitle');
  var errBox   = document.getElementById('errorBox');

  if (!targetId || !targetId.trim()) {
    if (wrapper) wrapper.style.display = 'none';
    if (errBox)  errBox.style.display  = 'block';
    if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
    setTimeout(initVisitorCounter, 600);
    return;
  }

  addIframeShimmer();

  var dataPromise = _cachedData ? Promise.resolve(_cachedData) : prefetchData();

  dataPromise.then(function(results) {
    var found = null;
    for (var i = 0; i < results.length; i++) {
      if (!results[i]) continue;
      if (Array.isArray(results[i].iframes)) {
        var match = results[i].iframes.find(function(x) { return x.id === targetId; });
        if (match) { found = match; break; }
      }
    }

    if (found) {
      var shimmerTimeout = setTimeout(removeIframeShimmer, 12000);

      frame.addEventListener('load', function onLoad() {
        frame.removeEventListener('load', onLoad);
        clearTimeout(shimmerTimeout);
        removeIframeShimmer();
      });
      frame.addEventListener('error', function onErr() {
        frame.removeEventListener('error', onErr);
        clearTimeout(shimmerTimeout);
        removeIframeShimmer();
      });

      frame.src = found.iframeSrc;
      if (titleEl) titleEl.innerText = found.name;
      document.title = found.name + ' \u2013 Cricket News Point';
    } else {
      removeIframeShimmer();
      if (wrapper) wrapper.style.display = 'none';
      if (errBox)  errBox.style.display  = 'block';
      if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
    }

    setTimeout(initVisitorCounter, 600);
  });
}

function resolveTargetId() {
  if (typeof TARGET_ID !== 'undefined' && TARGET_ID && TARGET_ID.trim()) return TARGET_ID.trim();
  var parts = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
  var last  = parts[parts.length - 1];
  if (last) return decodeURIComponent(last);
  return '';
}

function initSlidePanel() {
  var bellBtn      = document.getElementById('bellBtn');
  var slidePanel   = document.getElementById('slidePanel');
  var slideOverlay = document.getElementById('slideOverlay');
  var btnClose     = document.getElementById('btnCloseSlide');
  if (!bellBtn || !slidePanel) return;

  function openPanel() {
    slidePanel.classList.add('open');
    if (slideOverlay) slideOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePanel() {
    slidePanel.classList.remove('open');
    if (slideOverlay) slideOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  bellBtn.addEventListener('click', openPanel);
  bellBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); }
  });
  if (btnClose)     btnClose.addEventListener('click', closePanel);
  if (slideOverlay) slideOverlay.addEventListener('click', closePanel);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && slidePanel.classList.contains('open')) closePanel();
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
    } else {
      fallbackCopy(url);
    }
  });
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try {
    document.execCommand('copy');
    showToast('Link Copied to Clipboard !!');
  } catch(e) {
    alert('Link: ' + text);
  }
  document.body.removeChild(ta);
}

function showToast(msg) {
  var old = document.getElementById('cnpToast');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  var toast = document.createElement('div');
  toast.id  = 'cnpToast';
  toast.textContent = msg;
  toast.style.cssText = [
    'position:fixed',
    'bottom:calc(20px + env(safe-area-inset-bottom,0px))',
    'left:50%',
    'transform:translateX(-50%) translateY(10px)',
    'background:rgba(30,41,59,0.92)',
    'color:#fff',
    'padding:10px 20px',
    'border-radius:24px',
    'font-size:13px',
    'font-family:inherit',
    'font-weight:500',
    'white-space:nowrap',
    'z-index:9999',
    'opacity:0',
    'transition:opacity 0.3s,transform 0.3s',
    'pointer-events:none',
    '-webkit-backdrop-filter:blur(8px)',
    'backdrop-filter:blur(8px)'
  ].join(';');
  document.body.appendChild(toast);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });
  setTimeout(function() {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, 2400);
}

function initFullscreenHandler() {
  document.addEventListener('fullscreenchange',       handleFsChange);
  document.addEventListener('webkitfullscreenchange', handleFsChange);
  document.addEventListener('mozfullscreenchange',    handleFsChange);
  document.addEventListener('MSFullscreenChange',     handleFsChange);
}

function handleFsChange() {
  var fsEl = document.fullscreenElement ||
             document.webkitFullscreenElement ||
             document.mozFullScreenElement  ||
             document.msFullscreenElement;
  if (fsEl && screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(function() {});
  }
}

function initPopupButtons() {
  var btnJoin   = document.getElementById('btnJoinNow');
  var btnJoined = document.getElementById('btnAlreadyJoined');
  if (btnJoin)   btnJoin.addEventListener('click', joinNow);
  if (btnJoined) btnJoined.addEventListener('click', alreadyJoined);
}

prefetchData();

document.addEventListener('DOMContentLoaded', function() {
  initPopupButtons();
  initSlidePanel();
  initShareButton();
  initFullscreenHandler();
  var targetId = resolveTargetId();
  loadStream(targetId);
});
