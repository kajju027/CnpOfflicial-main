/* =============================================================
   Cricket News Point — script.js
   - No URL ?id= params. Uses TARGET_ID set inline on each page.
   - Path routing: /Hindi  /English  etc.
   - iframe loads fast with loading shimmer
   - Works on all browsers / all screen sizes
   - SuperCounters visitor count extraction
   - Share, Bell panel, WhatsApp popup
   ============================================================= */

'use strict';

/* ── Backend config (edit only here) ── */
var WHATSAPP_LINK  = "https://whatsapp.com/channel/0029VaeylYYBPzjVNomWuZ0T";
var VIEW_API_BASE  = "https://sayan-prime.pages.dev/api";
var DATA_SOURCES   = [
  "https://sayan-json-4.pages.dev/loura.json",
  "https://allrounderlive.in/id.json"
];
var IPL_DATA_URL   = "https://sayan-json-4.pages.dev/api/ipl-data.json";

/* ─────────────────────────────────────────
   1. POPUP
───────────────────────────────────────── */
function closePopup() {
  var popup = document.getElementById('popup');
  if (popup) popup.style.display = 'none';
}
function joinNow() {
  closePopup();
  window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
}
function alreadyJoined() {
  closePopup();
}

/* ─────────────────────────────────────────
   2. FOOTER VISITOR COUNT  (SuperCounters)
───────────────────────────────────────── */
function updateFooterCount(num) {
  if (!num || isNaN(num) || num <= 0) return false;
  var el = document.getElementById('footerCount');
  if (el) el.textContent = num;
  return true;
}

function extractScCount() {
  var container = document.getElementById('sc-hidden');
  if (!container) return false;

  /* Try <img alt="NUMBER"> */
  var imgs = container.querySelectorAll('img');
  for (var i = 0; i < imgs.length; i++) {
    var alt = (imgs[i].getAttribute('alt') || '').trim();
    var n   = parseInt(alt, 10);
    if (!isNaN(n) && n > 0 && n < 1000000) return updateFooterCount(n);

    /* Try src query string  ?count=N  /  ?c=N  etc. */
    var src = imgs[i].getAttribute('src') || '';
    var m   = src.match(/[?&](?:count|c|n|v)=(\d+)/i);
    if (m) {
      var n2 = parseInt(m[1], 10);
      if (!isNaN(n2) && n2 > 0) return updateFooterCount(n2);
    }
  }

  /* Try text nodes inside span / b / strong / div / p */
  var els = container.querySelectorAll('span,b,strong,div,p');
  for (var j = 0; j < els.length; j++) {
    var raw = (els[j].textContent || '').trim();
    var val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0 && val < 1000000) return updateFooterCount(val);
  }

  return false;
}

/* Poll every 500 ms for up to 30 s */
var scAttempts = 0;
var scTimer = setInterval(function () {
  if (extractScCount() || ++scAttempts > 60) clearInterval(scTimer);
}, 500);

/* Fallback: show "..." if still "--" after 32 s */
setTimeout(function () {
  var el = document.getElementById('footerCount');
  if (el && el.textContent === '--') el.textContent = '...';
}, 32000);

/* ─────────────────────────────────────────
   3. VISITOR HIT  (fire-and-forget)
───────────────────────────────────────── */
function initVisitorCounter() {
  fetch(IPL_DATA_URL)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var tid = null;
      if (d.sections && d.sections.length) {
        var s = d.sections.find(function (x) { return x.slot === 'NEW'; });
        if (s) tid = s.id;
      }
      if (!tid) return;
      var key = 'IPL-2026_' + tid;
      fetch(VIEW_API_BASE + '/hit?key=' + encodeURIComponent(key)).catch(function () {});
    })
    .catch(function () {});
}

/* ─────────────────────────────────────────
   4. IFRAME SHIMMER  (loading state)
───────────────────────────────────────── */
function addIframeShimmer() {
  var wrapper = document.getElementById('videoWrapper');
  if (!wrapper) return;

  var shimmer = document.createElement('div');
  shimmer.id = 'iframeShimmer';
  shimmer.setAttribute('aria-hidden', 'true');
  shimmer.style.cssText = [
    'position:absolute',
    'inset:0',
    'border-radius:inherit',
    'background:linear-gradient(90deg,#e2e8f0 25%,#f0f4f8 50%,#e2e8f0 75%)',
    'background-size:200% 100%',
    'animation:shimmerSlide 1.4s linear infinite',
    'z-index:2',
    'pointer-events:none'
  ].join(';');

  if (!document.getElementById('shimmerStyle')) {
    var st = document.createElement('style');
    st.id = 'shimmerStyle';
    st.textContent =
      '@keyframes shimmerSlide{' +
        '0%{background-position:200% 0}' +
        '100%{background-position:-200% 0}' +
      '}';
    document.head.appendChild(st);
  }

  wrapper.style.position = 'relative';
  wrapper.insertBefore(shimmer, wrapper.firstChild);
}

function removeIframeShimmer() {
  var s = document.getElementById('iframeShimmer');
  if (s) s.parentNode.removeChild(s);
}

/* ─────────────────────────────────────────
   5. LOAD STREAM
───────────────────────────────────────── */
function loadStream(targetId) {
  var frame    = document.getElementById('videoFrame');
  var wrapper  = document.getElementById('videoWrapper');
  var titleEl  = document.getElementById('pageTitle');
  var errBox   = document.getElementById('errorBox');
  var errorIdEl= document.getElementById('errorId');

  if (!targetId || !targetId.trim()) {
    wrapper.style.display = 'none';
    errBox.style.display  = 'block';
    if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
    setTimeout(initVisitorCounter, 600);
    return;
  }

  addIframeShimmer();

  /* Fetch both sources concurrently for faster resolution */
  var promises = DATA_SOURCES.map(function (url) {
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function () { return null; });
  });

  Promise.all(promises).then(function (results) {
    var found = null;

    for (var i = 0; i < results.length; i++) {
      if (!results[i]) continue;
      var json = results[i];
      if (Array.isArray(json.iframes)) {
        var match = json.iframes.find(function (x) { return x.id === targetId; });
        if (match) { found = match; break; }
      }
    }

    if (found) {
      /* Attach load/error events before setting src */
      frame.addEventListener('load', function onLoad() {
        frame.removeEventListener('load', onLoad);
        removeIframeShimmer();
      });
      frame.addEventListener('error', function onErr() {
        frame.removeEventListener('error', onErr);
        removeIframeShimmer();
      });

      /* Safety timeout — remove shimmer after 12 s regardless */
      setTimeout(removeIframeShimmer, 12000);

      frame.src = found.iframeSrc;
      if (titleEl) titleEl.innerText = found.name;
      document.title = found.name + ' \u2013 Cricket News Point';
    } else {
      removeIframeShimmer();
      wrapper.style.display = 'none';
      errBox.style.display  = 'block';
      if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
      if (errorIdEl) errorIdEl.textContent = '\u201c' + targetId + '\u201d';
    }

    setTimeout(initVisitorCounter, 600);
  });
}

/* ─────────────────────────────────────────
   6. RESOLVE TARGET ID
   Priority: TARGET_ID  → pathname last segment
───────────────────────────────────────── */
function resolveTargetId() {
  /* TARGET_ID is set inline on every page, e.g.
       <script>var TARGET_ID = "Hindi";</script>
     If it is truthy, use it directly. */
  if (typeof TARGET_ID !== 'undefined' && TARGET_ID && TARGET_ID.trim()) {
    return TARGET_ID.trim();
  }

  /* Fallback: last non-empty path segment
       /Hindi  →  "Hindi"
       /English  →  "English"                */
  var parts = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/');
  var last = parts[parts.length - 1];
  if (last) return decodeURIComponent(last);

  return '';
}

/* ─────────────────────────────────────────
   7. BELL / SLIDE PANEL
───────────────────────────────────────── */
function initSlidePanel() {
  var bellBtn     = document.getElementById('bellBtn');
  var slidePanel  = document.getElementById('slidePanel');
  var slideOverlay= document.getElementById('slideOverlay');
  var btnClose    = document.getElementById('btnCloseSlide');

  if (!bellBtn || !slidePanel) return;

  function openPanel() {
    slidePanel.classList.add('open');
    if (slideOverlay) slideOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanelFn() {
    slidePanel.classList.remove('open');
    if (slideOverlay) slideOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  bellBtn.addEventListener('click', openPanel);
  bellBtn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); }
  });
  if (btnClose)    btnClose.addEventListener('click', closePanelFn);
  if (slideOverlay) slideOverlay.addEventListener('click', closePanelFn);

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanelFn();
  });
}

/* ─────────────────────────────────────────
   8. SHARE BUTTON
───────────────────────────────────────── */
function initShareButton() {
  var btn = document.getElementById('shareButton');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var url  = window.location.href;
    var title= document.title;
    var text = title + '\n\nFrom Cricket News Point\n\nWatch Live Cricket Streaming Free in HD !!';

    /* Try Web Share API first (mobile-native) */
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
      return;
    }

    /* Fallback: clipboard */
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function () { showToast('Link Copied to Clipboard !!'); })
        .catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  });
}

/* execCommand copy for old browsers */
function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Link Copied to Clipboard !!');
  } catch (e) {
    alert('Link: ' + text);
  }
  document.body.removeChild(ta);
}

/* Small toast notification */
function showToast(msg) {
  var old = document.getElementById('cnpToast');
  if (old) old.parentNode.removeChild(old);

  var toast = document.createElement('div');
  toast.id   = 'cnpToast';
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

  /* Trigger transition */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  setTimeout(function () {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }, 2400);
}

/* ─────────────────────────────────────────
   9. FULLSCREEN → LOCK LANDSCAPE
───────────────────────────────────────── */
function initFullscreenHandler() {
  document.addEventListener('fullscreenchange', handleFsChange);
  document.addEventListener('webkitfullscreenchange', handleFsChange);
  document.addEventListener('mozfullscreenchange', handleFsChange);
  document.addEventListener('MSFullscreenChange', handleFsChange);
}

function handleFsChange() {
  var fsEl = document.fullscreenElement ||
             document.webkitFullscreenElement ||
             document.mozFullScreenElement  ||
             document.msFullscreenElement;
  if (fsEl && screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(function () {});
  }
}

/* ─────────────────────────────────────────
   10. POPUP BUTTONS
───────────────────────────────────────── */
function initPopupButtons() {
  var btnJoin    = document.getElementById('btnJoinNow');
  var btnJoined  = document.getElementById('btnAlreadyJoined');
  if (btnJoin)   btnJoin.addEventListener('click', joinNow);
  if (btnJoined) btnJoined.addEventListener('click', alreadyJoined);
}

/* ─────────────────────────────────────────
   11. DOMContentLoaded  — entry point
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initPopupButtons();
  initSlidePanel();
  initShareButton();
  initFullscreenHandler();

  var targetId = resolveTargetId();
  loadStream(targetId);
});
