/* ═══════════════════════════════════════════════════
   Cricket News Point — Stream Player v2.0
   ═══════════════════════════════════════════════════ */


/* ─────────────────────────────────────────
   LOADER
   Fades out and hides the loading screen
   ───────────────────────────────────────── */
function hideLoader() {
    var loader = document.getElementById("loadingScreen");
    if (loader) {
        loader.style.opacity = "0";
        loader.style.transition = "0.3s";
        setTimeout(function() { loader.style.display = "none"; }, 300);
    }
}


/* ─────────────────────────────────────────
   POPUP — WhatsApp Join Logic
   - Saves join state to localStorage
   - Forces join after 3 skips
   ───────────────────────────────────────── */
function joinNow() {
    localStorage.setItem('hasJoined', 'true');
    window.open("https://t.me/+dxIv8TLRVhU3OGQ1", "_blank");
    document.getElementById("popup").style.display = "none";
}

function closePopup() {
    var hasJoined = localStorage.getItem('hasJoined');
    if (hasJoined === 'true') {
        document.getElementById("popup").style.display = "none";
        return;
    }
    var skipCount = parseInt(localStorage.getItem('skipCount')) || 0;
    skipCount++;
    localStorage.setItem('skipCount', skipCount);
    if (skipCount >= 3) {
        joinNow();
    } else {
        document.getElementById("popup").style.display = "none";
    }
}

function showPopup() {
    document.getElementById("popup").classList.add("show");
}


/* ─────────────────────────────────────────
   ORIENTATION LOCK
   Locks landscape on fullscreen, CSS rotate fallback
   ───────────────────────────────────────── */
function lockLandscape() {
    try {
        if ('orientation' in screen && screen.orientation && screen.orientation.lock) {
            return screen.orientation.lock("landscape").then(function() {
                return { locked: true };
            });
        } else if (window.screen && window.screen.lockOrientation) {
            return { locked: !!window.screen.lockOrientation('landscape') };
        }
        return { locked: false, reason: 'no-api' };
    } catch (e) {
        return { locked: false, error: e };
    }
}

function unlockOrientation() {
    try {
        if ('orientation' in screen && screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        } else if (window.screen && window.screen.unlockOrientation) {
            window.screen.unlockOrientation();
        }
    } catch (e) { /* silent */ }
}

function applyRotateCssFallback() {
    var pc = document.getElementById('player-container');
    if (pc) pc.classList.add('player-rotated');
    var notice = document.querySelector('.rotate-fallback-notice');
    if (notice) notice.style.display = 'block';
}

function removeRotateCssFallback() {
    var pc = document.getElementById('player-container');
    if (pc) pc.classList.remove('player-rotated');
    var notice = document.querySelector('.rotate-fallback-notice');
    if (notice) notice.style.display = 'none';
}

function onFullScreenChange() {
    var fs = document.fullscreenElement ||
             document.webkitFullscreenElement ||
             document.msFullscreenElement;
    if (fs) {
        lockLandscape().then(function(res) {
            if (!res.locked) applyRotateCssFallback();
        });
    } else {
        unlockOrientation();
        removeRotateCssFallback();
    }
}

document.addEventListener('fullscreenchange', onFullScreenChange);
document.addEventListener('webkitfullscreenchange', onFullScreenChange);
document.addEventListener('msfullscreenchange', onFullScreenChange);


/* ─────────────────────────────────────────
   APP INITIALIZATION
   Fetches stream data from two JSON sources,
   matches by ID, renders appropriate UI
   ───────────────────────────────────────── */
async function initializeApp() {
    try {
        var jsonUrl1 = 'https://sayan-json-official.pages.dev/loura.json';
        var jsonUrl2 = 'https://allrounderid2.pages.dev/id.json';

        var results = await Promise.allSettled([
            fetch(jsonUrl1),
            fetch(jsonUrl2)
        ]);

        var data1 = [];
        var data2 = [];

        if (results[0].status === 'fulfilled' && results[0].value.ok) {
            var json1 = await results[0].value.json();
            data1 = json1.iframes || [];
        }
        if (results[1].status === 'fulfilled' && results[1].value.ok) {
            var json2 = await results[1].value.json();
            data2 = json2.iframes || [];
        }

        var params = new URLSearchParams(window.location.search);
        var streamId = params.get('id');

        var streamData = data1.find(function(item) { return item.id === streamId; }) ||
                         data2.find(function(item) { return item.id === streamId; });

        if (streamData) {
            renderIframeUI(streamData);
            setTimeout(showPopup, 1000);
        } else {
            renderErrorUI();
        }
    } catch (err) {
        console.error(err);
        renderErrorUI();
    }

    /* Start Supercounters extraction */
    startCounterExtraction();

    hideLoader();
}


/* ─────────────────────────────────────────
   RENDER: Stream Player Page
   Header → Player → WhatsApp Card → Share Card
   ───────────────────────────────────────── */
function renderIframeUI(data) {
    var content = document.getElementById('stream-content');

    content.innerHTML =
        '<div class="stream-header">' +
            '<h1>' + data.name + '</h1>' +
            '<div class="live-badge"><i class="fa-solid fa-circle"></i> LIVE</div>' +
        '</div>' +

        '<div id="player-container">' +
            '<iframe src="' + data.iframeSrc + '" style="width:100%;height:100%;border:0;" allow="encrypted-media; autoplay; fullscreen" allowfullscreen></iframe>' +
            '<div class="view-counter">' +
                '<div class="name" id="viewChannelName">' + data.name + '</div>' +
                '<div class="views" id="viewCount">...</div>' +
            '</div>' +
            '<div class="rotate-fallback-notice" id="rotateNotice">Rotation active — tap exit to return</div>' +
        '</div>' +

        '<div class="info-card">' +
            '<div class="action-title">' +
                '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#5b8def;width:14px;height:14px;">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>' +
                '</svg>' +
                '<span style="font-weight:500;color:#6c7594;font-size:.78rem;">Follow for Updates</span>' +
            '</div>' +
            '<a href="https://t.me/+dxIv8TLRVhU3OGQ1" target="_blank" rel="noopener" class="action-button">' +
                '<span style="font-weight:500;">Join WhatsApp Channel</span>' +
            '</a>' +
        '</div>' +

        '<div class="info-card">' +
            '<div class="action-title">' +
                '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:#5b8def;width:14px;height:14px;">' +
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>' +
                '</svg>' +
                '<span style="font-weight:500;color:#6c7594;font-size:.78rem;">Share With Friends</span>' +
            '</div>' +
            '<button class="action-button" id="shareButton">' +
                '<span style="font-weight:500;">Share This Stream</span>' +
            '</button>' +
        '</div>';

    /* Share button logic */
    var shareBtn = document.getElementById('shareButton');
    shareBtn.addEventListener('click', function() {
        var shareData = {
            title: data.name,
            text: data.name + '\n\nFrom Cricket News Point\n\nWatch Live Cricket Streaming Free in HD!',
            url: window.location.href
        };
        if (navigator.share) {
            navigator.share(shareData).then(function() {
                setShareFeedback(shareBtn, 'Shared Successfully');
            }).catch(function() {
                fallbackCopy(data.name, shareBtn);
            });
        } else {
            fallbackCopy(data.name, shareBtn);
        }
    });

    function fallbackCopy(name, btn) {
        var text = name + '\n\nFrom Cricket News Point\n\n' + window.location.href;
        navigator.clipboard.writeText(text).then(function() {
            setShareFeedback(btn, 'Link Copied');
        });
    }

    function setShareFeedback(btn, msg) {
        btn.innerHTML = '<span style="font-weight:500;">' + msg + '</span>';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.innerHTML = '<span style="font-weight:500;">Share This Stream</span>';
            btn.classList.remove('copied');
        }, 2000);
    }

    startViewCounter(data.id);
}


/* ─────────────────────────────────────────
   RENDER: Error Page
   No-signal icon + 2×2 action card grid
   ───────────────────────────────────────── */
function renderErrorUI() {
    var content = document.getElementById('stream-content');
    document.title = "Signal Lost";

    content.innerHTML =
        '<div class="error-container">' +
            '<div class="err-icon-wrap">' +
                '<svg viewBox="0 0 24 24">' +
                    '<line x1="1" y1="1" x2="23" y2="23"/>' +
                    '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>' +
                    '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>' +
                    '<path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>' +
                    '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>' +
                    '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
                    '<line x1="12" y1="20" x2="12.01" y2="20" stroke-width="3" stroke-linecap="round"/>' +
                '</svg>' +
            '</div>' +
            '<h1 class="err-title">Signal Lost</h1>' +
            '<p class="err-desc">' +
                'We couldn\'t connect to the requested stream. ' +
                'The ID might be invalid, expired, or the broadcast has ended.' +
            '</p>' +
            '<div class="error-grid">' +

                '<a href="#" class="error-card">' +
                    '<div class="error-card-icon">' +
                        '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' +
                    '</div>' +
                    '<span class="error-card-label">All Streams</span>' +
                '</a>' +

                '<a href="#" class="error-card">' +
                    '<div class="error-card-icon">' +
                        '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>' +
                    '</div>' +
                    '<span class="error-card-label">Scorecard</span>' +
                '</a>' +

                '<a href="#" class="error-card">' +
                    '<div class="error-card-icon">' +
                        '<svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>' +
                    '</div>' +
                    '<span class="error-card-label">Contact Us</span>' +
                '</a>' +

                '<a href="#" class="error-card">' +
                    '<div class="error-card-icon">' +
                        '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
                    '</div>' +
                    '<span class="error-card-label">Terms & Privacy</span>' +
                '</a>' +

            '</div>' +
        '</div>';
}


/* ─────────────────────────────────────────
   SUPERCOUNTERS EXTRACTION
   Hidden div → poll → extract number → display
   Falls back to "770" if blocked/unavailable
   ───────────────────────────────────────── */

/* Extracts the count from hidden Supercounters DOM */
function extractCounter() {
    var hidden = document.getElementById('sc-hidden');
    if (!hidden) return null;

    /* Step 1: Check <img> alt attribute */
    var img = hidden.querySelector('img');
    if (img && img.alt) {
        var num = parseInt(img.alt, 10);
        if (!isNaN(num) && num > 0) return num;
    }

    /* Step 2: Check <span> textContent */
    var span = hidden.querySelector('span');
    if (span && span.textContent) {
        var num2 = parseInt(span.textContent, 10);
        if (!isNaN(num2) && num2 > 0) return num2;
    }

    /* Step 3: Scan all children for any valid number */
    var children = hidden.querySelectorAll('*');
    for (var i = 0; i < children.length; i++) {
        var text = (children[i].alt || children[i].textContent || '').trim();
        var num3 = parseInt(text, 10);
        if (!isNaN(num3) && num3 > 0) return num3;
    }

    return null;
}

/* Polls hidden div every 500ms, max 15 attempts */
function startCounterExtraction() {
    var attempts = 0;
    var maxAttempts = 15;
    var found = false;

    var poll = setInterval(function() {
        attempts++;
        var count = extractCounter();

        if (count !== null) {
            clearInterval(poll);
            found = true;
            displayCounter(count);
        }

        if (attempts >= maxAttempts) {
            clearInterval(poll);
        }
    }, 500);

    /* Fallback: show 770 after 3.5s if extraction never succeeded */
    setTimeout(function() {
        var el = document.getElementById('footerCount');
        if (el && el.textContent === '--') {
            displayCounter(770);
        }
    }, 3500);
}

/* Injects extracted number into footer display */
function displayCounter(num) {
    var el = document.getElementById('footerCount');
    if (el) el.textContent = num;
}


/* ─────────────────────────────────────────
   VIEW COUNTER
   Fetches from API, formats K/M, blue toggle
   ───────────────────────────────────────── */
var globalRawViews = 0;
var isMillionCycleState = false;

/* Toggles between K and M display for large numbers */
function startMillionToggleCycle() {
    (function runCycle() {
        isMillionCycleState = false;
        updateDisplay();
        setTimeout(function() {
            isMillionCycleState = true;
            updateDisplay();
            setTimeout(runCycle, 6000);
        }, 25000);
    })();
}

/* Formats the raw number and updates the DOM */
function updateDisplay() {
    var el = document.getElementById("viewCount");
    if (!el) return;

    if (globalRawViews === 0 || isNaN(globalRawViews)) {
        el.innerText = "0 Views";
        el.style.color = "#ffffff";
        return;
    }

    var str = "";
    var isBlue = false;

    if (globalRawViews < 10000) {
        str = globalRawViews + " Views";
    } else if (globalRawViews < 1500000) {
        str = (globalRawViews / 1000).toFixed(1) + "K Views";
    } else if (globalRawViews < 100000000) {
        if (isMillionCycleState) {
            str = (globalRawViews / 1000000).toFixed(2) + "M Views";
            isBlue = true;
        } else {
            str = (globalRawViews / 1000).toFixed(1) + "K Views";
        }
    } else {
        str = (globalRawViews / 1000000).toFixed(2) + "M Views";
        isBlue = true;
    }

    el.innerText = str;
    el.style.color = isBlue ? "#5b8def" : "#ffffff";
}

/* Fetches current view count from API */
async function fetchViews(streamId) {
    try {
        var res = await fetch('https://sayan-prime.pages.dev/api/get?key=' + streamId, {
            method: 'GET',
            credentials: 'omit'
        });
        if (!res.ok) throw new Error('Network error');
        var json = await res.json();
        if (json.total) globalRawViews = parseInt(json.total, 10);
    } catch (err) {
        if (globalRawViews === 0) {
            var el = document.getElementById("viewCount");
            if (el) el.innerText = "N/A";
        }
    }
    updateDisplay();
}

/* Registers a hit, fetches initial count, starts polling */
async function startViewCounter(streamId) {
    try {
        await fetch('https://sayan-prime.pages.dev/api/hit?key=' + streamId + '&unique=1', {
            credentials: 'omit'
        });
    } catch (e) { /* silent */ }

    await fetchViews(streamId);
    setInterval(function() { fetchViews(streamId); }, 100000);
    startMillionToggleCycle();
}


/* ─────────────────────────────────────────
   BOOT
   ───────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", initializeApp);
