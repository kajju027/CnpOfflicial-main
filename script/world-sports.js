(function() {
  const API_URL = window.MATCHDEKHO_CONFIG.apis.worldSports;
  const fallbackImage = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0" x2="1" y1="1" y2="0"><stop offset="0" stop-color="#0b1723"/><stop offset="1" stop-color="#1b4636"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><circle cx="740" cy="160" r="180" fill="#7dffb3" opacity=".08"/><path d="M0 420h960" stroke="#f5c518" stroke-width="4" opacity=".45"/><text x="480" y="280" fill="#ffffff" font-family="Arial,sans-serif" font-size="42" font-weight="700" text-anchor="middle">LIVE SPORTS</text></svg>');
  const track = document.getElementById('worldSportsTrack');
  const arrowLeft = document.getElementById('worldSportsArrowLeft');
  const arrowRight = document.getElementById('worldSportsArrowRight');

  if (!track) return;

  function renderSkeletons(count = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="ws-skeleton-card">
          <div class="ws-skeleton-thumb"></div>
          <div class="ws-skeleton-info">
            <div class="ws-skeleton-line short"></div>
            <div class="ws-skeleton-line long"></div>
            <div class="ws-skeleton-meta">
              <div class="ws-skeleton-badge"></div>
              <div class="ws-skeleton-time"></div>
            </div>
          </div>
        </div>
      `;
    }
    track.innerHTML = html;
  }

  function renderMatches(matches) {
    if (!matches || matches.length === 0) {
      track.innerHTML = `<div style="color:rgba(255,255,255,0.3);padding:2rem;text-align:center;">No matches available</div>`;
      return;
    }

    let html = '';
    matches.forEach(match => {
      const statusClass = (match.status || '').toLowerCase();
      const statusDisplay = match.status_display || match.status || 'Upcoming';
      const thumbnail = match.thumbnail || fallbackImage;
      const league = match.league || 'World Sports';
      const title = match.title || match.teams || 'Match';
      const dateTime = match.date || '';
      const viewers = match.viewers ? `${match.viewers} watching` : '';

      html += `
        <a href="${match.page_url || '#'}" class="world-sports-card" data-match-id="${match.match_id || ''}">
          <div class="world-sports-thumb">
            <img src="${thumbnail}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}'" />
          </div>
          <div class="world-sports-info">
            <div class="world-sports-league">${league}</div>
            <div class="world-sports-title-text">${title}</div>
            <div class="world-sports-meta">
              <span class="world-sports-status ${statusClass}">${statusDisplay}</span>
              <span class="world-sports-time">${dateTime}</span>
            </div>
            ${viewers ? `<div style="font-size:clamp(0.5rem,0.6vw,0.7rem);color:rgba(255,255,255,0.25);margin-top:2px;">${viewers}</div>` : ''}
          </div>
        </a>
      `;
    });

    track.innerHTML = html;
  }

  function fetchWorldSports() {
    renderSkeletons(6);

    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const matches = data.matches || [];

        const displayMatches = matches.slice(0, 20);
        renderMatches(displayMatches);
      })
      .catch(err => {
        console.error('World Sports fetch error:', err);
        track.innerHTML = `<div style="color:rgba(255,255,255,0.3);padding:2rem;text-align:center;">Failed to load matches</div>`;
      });
  }

  function getScrollAmount() {
    const card = track.querySelector('.world-sports-card, .ws-skeleton-card');
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(track).gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  if (arrowRight) {
    arrowRight.addEventListener('click', function(e) {
      e.stopPropagation();
      track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
  }

  if (arrowLeft) {
    arrowLeft.addEventListener('click', function(e) {
      e.stopPropagation();
      track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
  }

  const section = document.getElementById('worldSportsSection');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fetchWorldSports();
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(section);
  } else {

    fetchWorldSports();
  }
})();
