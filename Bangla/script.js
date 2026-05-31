'use strict';

var WHATSAPP_LINK = "https://whatsapp.com/channel/0029VaeylYYBPzjVNomWuZ0T";
var VIEW_API_BASE = "https://sayan-prime.pages.dev/api";
var DATA_SOURCES  = [
  "https://sayan-json-4.pages.dev/loura.json",
  "https://allrounderlive.in/id.json"
];
var IPL_DATA_URL  = "https://sayan-json-4.pages.dev/api/ipl-data.json";

/* Prefetch JSON the moment script loads — before DOM is ready */
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
prefetchData(); /* fire immediately */

/* ── POPUP ── */
function closePopup() {
  var el = document.getElementById('popup');
  if (el) el.style.display = 'none';
}
function joinNow()       { closePopup(); window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer'); }
function alreadyJoined() { closePopup(); }

/* ── VISITOR COUNTER ── 
   Strategy: poll SuperCounters iframe every 500ms for up to 30s.
   Fallback: fetch IPL data hit-counter.  */
var _scDone = false;

function updateCount(n) {
  if (_scDone || !n || isNaN(n) || n <= 0 || n > 999999) return false;
  var el = document.getElementById('footerCount');
  if (!el) return false;
  _scDone = true;
  el.textContent = n.toLocaleString();
  return true;
}

function tryExtractSc() {
  var c = document.getElementById('sc-hidden');
  if (!c) return false;
  /* Check all images */
  var imgs = c.querySelectorAll('img');
  for (var i = 0; i < imgs.length; i++) {
    var n = parseInt((imgs[i].getAttribute('alt') || '').trim(), 10);
    if (updateCount(n)) return true;
    var m = (imgs[i].getAttribute('src') || '').match(/[?&](?:count|c|n|v|online)=(\d+)/i);
    if (m && updateCount(parseInt(m[1], 10))) return true;
  }
  /* Check text nodes */
  var nodes = c.querySelectorAll('span,b,strong,div,p,td');
  for (var j = 0; j < nodes.length; j++) {
    var raw = (nodes[j].textContent || '').trim();
    if (/^\d+$/.test(raw) && updateCount(parseInt(raw, 10))) return true;
  }
  return false;
}

/* Also watch for DOM mutations inside sc-hidden */
function watchSc() {
  var c = document.getElementById('sc-hidden');
  if (!c || typeof MutationObserver === 'undefined') return;
  var obs = new MutationObserver(function() {
    if (tryExtractSc()) obs.disconnect();
  });
  obs.observe(c, { childList: true, subtree: true, attributes: true, characterData: true });
}

var _scTries = 0;
var _scTimer = setInterval(function() {
  if (tryExtractSc() || ++_scTries > 70) clearInterval(_scTimer);
}, 450);

/* Fallback after 8s: show visitor count from IPL hit API */
setTimeout(function() {
  if (_scDone) return;
  fetch(IPL_DATA_URL, { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      /* Try to show any meaningful number from IPL data */
      if (d.online && updateCount(parseInt(d.online, 10))) return;
      if (d.viewers && updateCount(parseInt(d.viewers, 10))) return;
    })
    .catch(function() {});
}, 8000);

/* Fallback label after 32s */
setTimeout(function() {
  var el = document.getElementById('footerCount');
  if (el && !_scDone) el.textContent = '1K+';
}, 32000);

/* ── IPL HIT ── */
function initVisitorCounter() {
  fetch(IPL_DATA_URL, { cache: 'no-store' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var s = d.sections && d.sections.find(function(x) { return x.slot === 'NEW'; });
      if (!s) return;
      fetch(VIEW_API_BASE + '/hit?key=' + encodeURIComponent('IPL-2026_' + s.id)).catch(function() {});
    }).catch(function() {});
}

/* ── SHIMMER ── */
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
  s.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,#e2e8f0 25%,#f0f4f8 50%,#e2e8f0 75%);background-size:200% 100%;animation:shimmerSlide 1.4s linear infinite;z-index:2;pointer-events:none';
  w.style.position = 'relative';
  w.insertBefore(s, w.firstChild);
}
function removeShimmer() {
  var s = document.getElementById('iframeShimmer');
  if (s && s.parentNode) s.parentNode.removeChild(s);
}

/* ── LOAD STREAM ── */
function loadStream(targetId) {
  var frame   = document.getElementById('videoFrame');
  var wrapper = document.getElementById('videoWrapper');
  var titleEl = document.getElementById('pageTitle');
  var errBox  = document.getElementById('errorBox');

  if (!targetId || !targetId.trim()) {
    if (wrapper) wrapper.style.display = 'none';
    if (errBox)  errBox.style.display  = 'block';
    if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
    setTimeout(initVisitorCounter, 600);
    return;
  }

  addShimmer();

  prefetchData().then(function(results) {
    var found = null;
    for (var i = 0; i < results.length; i++) {
      if (!results[i] || !Array.isArray(results[i].iframes)) continue;
      var m = results[i].iframes.find(function(x) { return x.id === targetId; });
      if (m) { found = m; break; }
    }
    if (found) {
      var t = setTimeout(removeShimmer, 12000);
      frame.addEventListener('load', function onLoad() {
        frame.removeEventListener('load', onLoad);
        clearTimeout(t); removeShimmer();
      });
      frame.addEventListener('error', function onErr() {
        frame.removeEventListener('error', onErr);
        clearTimeout(t); removeShimmer();
      });
      frame.src = found.iframeSrc;
      if (titleEl) titleEl.innerText = found.name;
      document.title = found.name + ' \u2013 Cricket News Point';
    } else {
      removeShimmer();
      if (wrapper) wrapper.style.display = 'none';
      if (errBox)  errBox.style.display  = 'block';
      if (titleEl) titleEl.innerText = 'STREAM NOT FOUND';
    }
    setTimeout(initVisitorCounter, 600);
  });
}

/* ── TARGET ID ── */
function resolveTargetId() {
  if (typeof TARGET_ID !== 'undefined' && TARGET_ID && TARGET_ID.trim()) return TARGET_ID.trim();
  var parts = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
  var last  = parts[parts.length - 1];
  return last ? decodeURIComponent(last) : '';
}

/* ── SHARE ── */
function initShareButton() {
  var btn = document.getElementById('shareButton');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var url   = window.location.href;
    var title = document.title;
    if (navigator.share) {
      navigator.share({ title: title, text: title + ' — Watch Live Cricket Free in HD!', url: url }).catch(function() {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function() { showToast('Link Copied!'); }).catch(function() { fallbackCopy(url); });
    } else { fallbackCopy(url); }
  });
}
function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); showToast('Link Copied!'); } catch(e) { alert('Link: ' + text); }
  document.body.removeChild(ta);
}
function showToast(msg) {
  var old = document.getElementById('cnpToast');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  var t = document.createElement('div');
  t.id = 'cnpToast'; t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%) translateY(10px);background:rgba(15,23,42,0.93);color:#fff;padding:10px 20px;border-radius:24px;font-size:13px;font-family:inherit;font-weight:500;white-space:nowrap;z-index:99999;opacity:0;transition:opacity .28s,transform .28s;pointer-events:none;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)';
  document.body.appendChild(t);
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; }); });
  setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(10px)'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); },320); }, 2400);
}

/* ── POPUP BUTTONS ── */
function initPopupButtons() {
  var j = document.getElementById('btnJoinNow');
  var a = document.getElementById('btnAlreadyJoined');
  if (j) j.addEventListener('click', joinNow);
  if (a) a.addEventListener('click', alreadyJoined);
}

/* ── FULLSCREEN LANDSCAPE ── */
function initFullscreen() {
  ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(function(ev){
    document.addEventListener(ev, function(){
      var el = document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement||document.msFullscreenElement;
      if(el && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function(){});
    });
  });
}

/* ── ENTRY ── */
document.addEventListener('DOMContentLoaded', function() {
  initPopupButtons();
  initShareButton();
  initFullscreen();
  watchSc();
  loadStream(resolveTargetId());
});
