var WHATSAPP_LINK = "https://whatsapp.com/channel/0029VaeylYYBPzjVNomWuZ0T";
var viewApiBase = "https://sayan-prime.pages.dev/api";
var DATA_SOURCES = [
  "https://sayan-json-official.pages.dev/loura.json",
  "https://allrounder-live2.pages.dev/id.json"
];

function closePopup() {
  var popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

function joinNow() {
  closePopup();
  window.open(WHATSAPP_LINK, "_blank");
}

function alreadyJoined() {
  closePopup();
}

function updateFooterCount(num) {
  if (!num || isNaN(num) || num <= 0) return false;
  var el = document.getElementById("footerCount");
  if (el) el.textContent = num;
  return true;
}

function extractScCount() {
  var container = document.getElementById("sc-hidden");
  if (!container) return false;

  var img = container.querySelector("img");
  if (img) {
    var alt = (img.getAttribute("alt") || "").trim();
    var n = parseInt(alt, 10);
    if (!isNaN(n) && n > 0) return updateFooterCount(n);

    var src = img.getAttribute("src") || "";
    var m = src.match(/[?&](?:count|c|n|v)=(\d+)/i);
    if (m) {
      var n2 = parseInt(m[1], 10);
      if (!isNaN(n2) && n2 > 0) return updateFooterCount(n2);
    }
  }

  var allImgs = container.querySelectorAll("img");
  for (var i = 0; i < allImgs.length; i++) {
    var txt = (allImgs[i].getAttribute("alt") || "").trim();
    var parsed = parseInt(txt, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
      return updateFooterCount(parsed);
    }
  }

  var spans = container.querySelectorAll("span, b, strong, div, p");
  for (var j = 0; j < spans.length; j++) {
    var raw = (spans[j].textContent || "").trim();
    var val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0 && val < 1000000) {
      return updateFooterCount(val);
    }
  }

  return false;
}

var scAttempts = 0;
var scTimer = setInterval(function () {
  if (extractScCount() || scAttempts++ > 60) {
    clearInterval(scTimer);
  }
}, 500);

setTimeout(function () {
  var el = document.getElementById("footerCount");
  if (el && el.textContent === "--") el.textContent = "...";
}, 32000);

async function initVisitorCounter() {
  try {
    var r = await fetch("https://sayan-json-official.pages.dev/api/ipl-data.json");
    var d = await r.json();
    var tid = null;
    if (d.sections && d.sections.length > 0) {
      var s = d.sections.find(function (x) { return x.slot === "NEW"; });
      if (s) tid = s.id;
    }
    if (!tid) return;
    var key = "IPL-2026_" + tid;
    try { await fetch(viewApiBase + "/hit?key=" + key); } catch (e) {}
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("btnJoinNow").addEventListener("click", joinNow);
  document.getElementById("btnAlreadyJoined").addEventListener("click", alreadyJoined);

  var frame = document.getElementById("videoFrame");
  var wrapper = document.getElementById("videoWrapper");
  var titleEl = document.getElementById("pageTitle");
  var errBox = document.getElementById("errorBox");
  var errorIdEl = document.getElementById("errorId");

  var params = new URLSearchParams(window.location.search);
  var targetId = params.get("id");

  if (!targetId) {
    wrapper.style.display = "none";
    errBox.style.display = "block";
    titleEl.innerText = "STREAM NOT FOUND";
    setTimeout(function () { initVisitorCounter(); }, 600);
    return;
  }

  (async function loadStream() {
    var found = null;
    for (var i = 0; i < DATA_SOURCES.length; i++) {
      if (found) break;
      try {
        var resp = await fetch(DATA_SOURCES[i]);
        var json = await resp.json();
        if (Array.isArray(json.iframes)) {
          found = json.iframes.find(function (x) { return x.id === targetId; });
        }
      } catch (e) {}
    }

    if (found) {
      frame.src = found.iframeSrc;
      titleEl.innerText = found.name;
      document.title = found.name + " â€“ Cricket News Point";
    } else {
      wrapper.style.display = "none";
      errBox.style.display = "block";
      titleEl.innerText = "STREAM NOT FOUND";
      if (errorIdEl) errorIdEl.textContent = '"' + targetId + '"';
    }

    setTimeout(function () { initVisitorCounter(); }, 600);
  })();

  document.getElementById("shareButton").addEventListener("click", async function () {
    var url = window.location.href;
    try { await navigator.clipboard.writeText(url); } catch (e) {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          text: document.title + "\n\nFrom Cricket News Point\n\nWatch Live Cricket Streaming Free in HD !!",
          url: url
        });
      } catch (e) {}
    } else {
      alert("Link Copied to Clipboard !!");
    }
  });

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement && screen.orientation) {
      screen.orientation.lock("landscape").catch(function () {});
    }
  });

});
