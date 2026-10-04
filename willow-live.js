const WILLOW_API_URL = window.MATCHDEKHO_CONFIG.apis.willow;

const willowTrack = document.getElementById('willowLiveTrack');
const willowArrowLeft = document.getElementById('willowLiveArrowLeft');
const willowArrowRight = document.getElementById('willowLiveArrowRight');
const liveCountBadge = document.getElementById('liveCountBadge');

let willowMatches = [];
let liveMatches = [];
let upcomingMatches = [];

function getSafeStreamId(stream) {
  return stream.tvgId || stream.tvgName || stream.title || stream.match_id || '';
}

function renderSkeletonLoader() {
  if (!willowTrack) return;

  const skeletonCount = 4;
  let skeletons = '';

  for (let i = 0; i < skeletonCount; i++) {
    skeletons += `
      <div class="willow-live-card willow-skeleton-card">
        <div class="willow-live-thumb willow-skeleton-thumb">
          <div class="willow-skeleton-shimmer"></div>
        </div>
        <div class="willow-live-info willow-skeleton-info">
          <div class="willow-skeleton-line willow-skeleton-line-title"></div>
          <div class="willow-skeleton-line willow-skeleton-line-subtitle"></div>
        </div>
      </div>
    `;
  }

  willowTrack.innerHTML = skeletons;
}

async function fetchWillowMatches() {
  try {

    renderSkeletonLoader();

    const response = await fetch(WILLOW_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || 'Unknown error');
    }

    if (liveCountBadge) {
      const liveCount = data.Stats?.LiveCount || data.liveCount || 0;
      liveCountBadge.innerHTML = `
        <span class="material-icons" style="font-size: 14px;">fiber_manual_record</span>
        ${liveCount} LIVE
      `;
    }

    willowMatches = data.Matches || data.streams || [];

    liveMatches = willowMatches.filter(m =>
      m.status && m.status.toUpperCase() === 'LIVE'
    );
    upcomingMatches = willowMatches.filter(m =>
      m.status && m.status.toUpperCase() === 'UPCOMING'
    );

    renderWillowMatches();

  } catch (error) {
    console.error('Willow fetch error:', error);
    if (willowTrack) {
      willowTrack.innerHTML = `
        <div class="willow-error">
          ❌ Failed to load matches<br>
          <small>${error.message}</small><br>
          <button onclick="fetchWillowMatches()">Retry</button>
        </div>
      `;
    }
  }
}

function extractTeams(title) {
  if (!title) return 'Live Match';

  let cleaned = title.replace(/^(Live:|LIVE:|HD:|Willow\s*)/i, '').trim();

  const vsMatch = cleaned.match(/(.+?)\s*(?:vs|Vs|VS|v\.?)\s*(.+?)(?:\s*[-–]|$)/i);
  if (vsMatch) {
    let team1 = vsMatch[1].trim();
    let team2 = vsMatch[2].trim();

    const tournMatch = team1.match(/(?:Tour|Series|League|Cup|Trophy|Championship|Premier|World)\s+(?:of\s+)?(.+)$/i);
    if (tournMatch) {
      team1 = tournMatch[1].trim();
    }

    team1 = team1.split(' - ').pop() || team1;
    team2 = team2.split(' - ')[0] || team2;

    team1 = team1.replace(/\s*vs\s*.*$/i, '').trim();
    team2 = team2.replace(/^\s*vs\s*/, '').trim();

    return { team1, team2, display: `${team1} vs ${team2}` };
  }

  const vsMatch2 = cleaned.match(/(.+?)\s+vs\s+(.+?)(?:\s+[–-]|\s*$)/i);
  if (vsMatch2) {
    let team1 = vsMatch2[1].trim();
    let team2 = vsMatch2[2].trim();

    const tournMatch = team1.match(/(?:Tour|Series|League|Cup|Trophy|Championship|Premier|World)\s+(?:of\s+)?(.+)$/i);
    if (tournMatch) {
      team1 = tournMatch[1].trim();
    }

    return { team1, team2, display: `${team1} vs ${team2}` };
  }

  return { team1: cleaned, team2: '', display: cleaned };
}

function extractTournament(title) {
  if (!title) return null;

  const patterns = [
    /^([^,–-]+?(?:League|Series|Tournament|Cup|Trophy|Championship|Premier League|World Cup|Hundred|Tour))/i,
    /^([^,–-]+?(?:Tour|Series|League|Cup|Trophy|Championship|Premier|World))\s+(?:of\s+)?/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function getStreamUrlWithFallback(match) {

  if (match.stream_url_alpha) {
    if (typeof match.stream_url_alpha === 'string' && match.stream_url_alpha) {
      return match.stream_url_alpha;
    }
    if (typeof match.stream_url_alpha === 'object') {

      const servers = Object.values(match.stream_url_alpha);
      for (const url of servers) {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          return url;
        }
      }
    }
  }

  if (match.stream_url_bravo) {
    if (typeof match.stream_url_bravo === 'string' && match.stream_url_bravo) {
      return match.stream_url_bravo;
    }
    if (typeof match.stream_url_bravo === 'object') {
      const servers = Object.values(match.stream_url_bravo);
      for (const url of servers) {
        if (url && typeof url === 'string' && url.startsWith('http')) {
          return url;
        }
      }
    }
  }

  return null;
}

function getDrmKey(match) {
  if (match.drm_key) {
    return match.drm_key;
  }
  return null;
}

function renderWillowMatches() {
  if (!willowTrack) return;

  const allMatches = [...liveMatches, ...upcomingMatches];

  if (!allMatches || allMatches.length === 0) {
    willowTrack.innerHTML = '<div class="willow-loading">No matches available</div>';
    return;
  }

  willowTrack.innerHTML = '';

  allMatches.forEach((match) => {
    const title = match.title || match.tvgName || 'Unknown Match';
    const status = match.status || 'UPCOMING';
    const isLive = status.toUpperCase() === 'LIVE';

    const teams = extractTeams(title);
    const tournament = extractTournament(title);

    let coverImage = match.cover_image || match.tvgLogo || 'https://via.placeholder.com/480x270/14181f/ffffff?text=Willow+Cricket';

    if (coverImage && coverImage.includes('_UR1920,1080_')) {

    }

    const safeId = getSafeStreamId(match);

    const streamUrl = isLive ? getStreamUrlWithFallback(match) : null;
    const hasStream = isLive && streamUrl;

    if (!safeId) {
      console.warn('Skipping match with no usable id:', match);
      return;
    }

    const card = document.createElement('a');
    card.className = `willow-live-card ${!isLive ? 'upcoming' : ''}`;

    if (isLive && hasStream) {
      card.href = `willow-player.html?id=${encodeURIComponent(safeId)}`;
    } else {

      card.href = '#';
      card.style.cursor = 'default';
    }

    card.dataset.matchId = safeId;
    card.dataset.status = status;

    let teamsHTML = '';
    if (teams.team1 && teams.team2) {
      teamsHTML = `
        <span class="willow-live-team">${teams.team1}</span>
        <span class="willow-live-vs">vs</span>
        <span class="willow-live-team">${teams.team2}</span>
      `;
    } else {
      teamsHTML = `<span class="willow-live-team">${teams.display}</span>`;
    }

    let statusBadge = '';
    if (isLive) {
      statusBadge = `
        <div class="willow-live-badge-live">
          <span class="material-icons" style="font-size: 10px;">fiber_manual_record</span>
          LIVE
        </div>
      `;
    } else {

      const timeDisplay = match.time || 'Upcoming';
      statusBadge = `
        <div class="willow-live-badge-upcoming">
          <span class="material-icons" style="font-size: 10px;">schedule</span>
          ${timeDisplay}
        </div>
      `;
    }

    let playOverlay = '';
    if (isLive && hasStream) {
      playOverlay = `
        <div class="willow-live-overlay">
          <span class="willow-live-play-icon">
            <span class="material-icons" style="font-size: 24px;">play_arrow</span>
          </span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="willow-live-thumb">
        <img
          src="${coverImage}"
          alt="${title}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/480x270/14181f/ffffff?text=Willow+Cricket'"
        />
        ${statusBadge}
        ${playOverlay}
      </div>
      <div class="willow-live-info">
        <div class="willow-live-match-title">
          ${teamsHTML}
        </div>
        ${tournament ? `<div class="willow-live-group">${tournament}</div>` : ''}
        ${!isLive ? `<div class="willow-live-upcoming-time">${match.time || 'Upcoming'}</div>` : ''}
      </div>
    `;

    if (!isLive || !hasStream) {
      card.addEventListener('click', function(e) {
        e.preventDefault();

        if (!isLive) {
          alert(`⏰ This match is upcoming: ${match.time || 'Check back later'}`);
        } else {
          alert('📡 Stream not yet available for this match');
        }
      });
    }

    willowTrack.appendChild(card);
  });

  willowTrack.scrollLeft = 0;
}

function getWillowScrollAmount() {
  if (!willowTrack) return 320;
  const card = willowTrack.querySelector('.willow-live-card');
  if (!card) return 320;
  const trackStyles = getComputedStyle(willowTrack);
  const gap = parseFloat(trackStyles.columnGap || trackStyles.gap || '20');
  return (card.getBoundingClientRect().width + gap) * 2;
}

if (willowArrowRight) {
  willowArrowRight.addEventListener('click', function(e) {
    e.stopPropagation();
    if (willowTrack) {
      willowTrack.scrollBy({ left: getWillowScrollAmount(), behavior: 'smooth' });
    }
  });
}

if (willowArrowLeft) {
  willowArrowLeft.addEventListener('click', function(e) {
    e.stopPropagation();
    if (willowTrack) {
      willowTrack.scrollBy({ left: -getWillowScrollAmount(), behavior: 'smooth' });
    }
  });
}

renderSkeletonLoader();
fetchWillowMatches();

setInterval(fetchWillowMatches, 300000);
