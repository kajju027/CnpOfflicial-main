(function() {
  'use strict';

  const API_URL = window.MATCHDEKHO_CONFIG.apis.fancode;
  const SKELETON_COUNT = 6;

  const track = document.getElementById('fancodeTrack');
  const arrowLeft = document.getElementById('fancodeArrowLeft');
  const arrowRight = document.getElementById('fancodeArrowRight');

  let isLoading = false;
  let matches = [];

  function createSkeletonCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="fancode-card fc-skeleton-card">
          <div class="fc-skeleton-thumb"></div>
          <div class="fc-skeleton-info">
            <div class="fc-skeleton-line short"></div>
            <div class="fc-skeleton-line medium"></div>
            <div class="fc-skeleton-teams">
              <div class="fc-skeleton-team-block">
                <div class="fc-skeleton-flag"></div>
                <div class="fc-skeleton-name"></div>
              </div>
              <span class="fc-skeleton-vs">VS</span>
              <div class="fc-skeleton-team-block">
                <div class="fc-skeleton-flag"></div>
                <div class="fc-skeleton-name"></div>
              </div>
            </div>
            <div class="fc-skeleton-meta">
              <div class="fc-skeleton-badge"></div>
              <div class="fc-skeleton-time"></div>
            </div>
          </div>
        </div>
      `;
    }
    return html;
  }

  function getBaseMatchId(matchId) {
    if (!matchId) return '';
    let baseId = String(matchId);

    if (baseId.includes('_')) {
      baseId = baseId.split('_')[0];
    }
    return baseId;
  }

  async function fetchFancodeData() {
    if (isLoading) return;
    isLoading = true;

    try {
      track.innerHTML = createSkeletonCards(SKELETON_COUNT);

      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const allMatches = data.matches || data || [];

      console.log(`Found ${allMatches.length} matches`);

      matches = allMatches.filter(m => {

        if (!m.team_1 || !m.team_2) return false;
        return true;
      });

      console.log(`Filtered to ${matches.length} matches with teams`);

      matches.sort((a, b) => {

        const getPriority = (status) => {
          if (status === 'LIVE') return 0;
          if (status === 'UPCOMING') return 1;
          return 2;
        };

        const aPriority = getPriority(a.status);
        const bPriority = getPriority(b.status);

        if (aPriority !== bPriority) return aPriority - bPriority;

        if (a.startTime && b.startTime) {
          return new Date(a.startTime) - new Date(b.startTime);
        }
        return 0;
      });

      renderMatches(matches);

    } catch (error) {
      console.error('FanCode fetch error:', error);
      track.innerHTML = `
        <div style="color: rgba(255,255,255,0.4); padding: 2rem; text-align: center; width: 100%;">
          ⚠️ Failed to load matches: ${error.message}
        </div>
      `;
    } finally {
      isLoading = false;
    }
  }

  function renderMatches(matchData) {
    if (!matchData || matchData.length === 0) {
      track.innerHTML = `
        <div style="color: rgba(255,255,255,0.3); padding: 2rem; text-align: center; width: 100%;">
          No matches available
        </div>
      `;
      return;
    }

    let html = '';
    matchData.forEach(match => {

      const team1Name = match.team_1 || 'Team 1';
      const team2Name = match.team_2 || 'Team 2';

      const imageUrl = match.src || '';

      let statusText = match.status || 'UPCOMING';
      const isLive = statusText === 'LIVE';
      const isEnded = statusText === 'ENDED' || statusText === 'FINISHED' || statusText === 'COMPLETED';

      statusText = statusText.replace(/_/g, ' ').toLowerCase();
      statusText = statusText.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      let statusClass = 'upcoming';
      if (isLive) statusClass = 'live';
      if (isEnded) statusClass = 'ended';

      const streamUrl = match.dai_url || match.adfree_url || '';
      const hasStream = !!streamUrl;

      const baseMatchId = getBaseMatchId(match.match_id);

      let formattedTime = match.startTime || '';
      if (formattedTime) {
        try {
          const date = new Date(formattedTime);
          if (!isNaN(date)) {
            formattedTime = date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        } catch (e) {

        }
      }

      html += `
        <div class="fancode-card" data-match-id="${baseMatchId}" data-full-match-id="${match.match_id || ''}" data-stream-url="${streamUrl}" data-title="${match.title || match.match_name || 'Live Match'}">
          <div class="fancode-thumb">
            <img
              src="${imageUrl}"
              alt="${team1Name} vs ${team2Name}"
              loading="lazy"
              onerror="this.src='https://via.placeholder.com/400x225/1a1c1e/555?text=No+Image'"
            />
            ${isLive ? '<span class="live-badge">● LIVE</span>' : ''}
          </div>
          <div class="fancode-info">
            <div class="fancode-tournament">${match.event_name || match.title || 'Match'}</div>
            <div class="fancode-teams">
              <div class="fancode-team">
                <span>${team1Name}</span>
              </div>
              <span class="fancode-vs">VS</span>
              <div class="fancode-team">
                <span>${team2Name}</span>
              </div>
            </div>
            <div class="fancode-meta">
              <div class="fancode-meta-left">
                <span class="fancode-status ${statusClass}">${statusText}</span>
              </div>
              <span class="fancode-time">${formattedTime || match.startTime || ''}</span>
            </div>
            ${hasStream ? '<div class="stream-indicator available">▶ CLICK TO PLAY</div>' : '<div class="stream-indicator unavailable">NO STREAM</div>'}
          </div>
        </div>
      `;
    });

    track.innerHTML = html;
  }

  async function playM3U8Stream(matchId, matchTitle, streamUrl) {
    console.log('🔍 Playing stream for:', { matchId, matchTitle, streamUrl });

    if (!matchId) {
      alert('No match ID available');
      return;
    }

    if (streamUrl && streamUrl.includes('m3u8')) {
      console.log('✅ Using provided stream URL:', streamUrl);
      const encodedUrl = encodeURIComponent(streamUrl);
      const matchName = encodeURIComponent(matchTitle || 'Live Match');
      window.location.href = `${window.MATCHDEKHO_CONFIG.routes.fancodePlayer}?url=${encodedUrl}&title=${matchName}&match_id=${matchId}`;
      return;
    }

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const allMatches = data.matches || data || [];

      const baseMatchId = getBaseMatchId(matchId);
      console.log(`🔍 Looking for match with base ID: ${baseMatchId}`);

      let match = allMatches.find(m => {
        const mBaseId = getBaseMatchId(m.match_id);
        return mBaseId === baseMatchId;
      });

      if (match) {
        console.log(`✅ Found match by ID: ${match.match_id}`);
      } else {

        console.log(`🔍 Trying to find by title: "${matchTitle}"`);
        match = allMatches.find(m => {
          const mTitle = (m.match_name || m.title || '').toLowerCase();
          const searchTitle = (matchTitle || '').toLowerCase();
          return mTitle.includes(searchTitle) || searchTitle.includes(mTitle);
        });
        if (match) {
          console.log(`✅ Found match by title: ${match.match_name || match.title}`);
        }
      }

      if (!match) {
        console.error('❌ Match not found in JSON');
        alert('Match data not found. Please try again.');
        return;
      }

      const m3u8Url = match.dai_url || match.adfree_url || null;

      if (!m3u8Url) {
        console.error('❌ No stream URL found for match');
        alert('No stream available for this match');
        return;
      }

      console.log('✅ Found stream URL:', m3u8Url);
      const encodedUrl = encodeURIComponent(m3u8Url);
      const matchName = encodeURIComponent(matchTitle || match.match_name || 'Live Match');

      window.location.href = `${window.MATCHDEKHO_CONFIG.routes.fancodePlayer}?url=${encodedUrl}&title=${matchName}&match_id=${matchId}`;

    } catch (error) {
      console.error('❌ Error playing stream:', error);
      alert('Failed to load stream. Please try again.');
    }
  }

  function scrollAmount() {
    const card = track.querySelector('.fancode-card, .fc-skeleton-card');
    if (!card) return 280;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = 20;
    return (cardWidth + gap) * 2;
  }

  function scrollLeft() {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  }

  function scrollRight() {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  }

  function handleCardClick(e) {
    const card = e.target.closest('.fancode-card');
    if (!card) return;

    const matchId = card.dataset.matchId || card.dataset.fullMatchId;
    const title = card.dataset.title || 'Live Match';
    const streamUrl = card.dataset.streamUrl || '';

    console.log('🖱️ Card clicked:', { matchId, title, streamUrl });

    if (matchId) {
      e.preventDefault();
      e.stopPropagation();
      playM3U8Stream(matchId, title, streamUrl);
    } else {
      e.preventDefault();
      alert('Invalid match');
    }
  }

  function initLazyLoad() {
    const section = document.getElementById('fancodeSection');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      fetchFancodeData();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fetchFancodeData();
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(section);
  }

  function handleKeydown(e) {
    if (e.key === 'ArrowLeft') scrollLeft();
    if (e.key === 'ArrowRight') scrollRight();
  }

  function init() {
    if (arrowLeft) arrowLeft.addEventListener('click', scrollLeft);
    if (arrowRight) arrowRight.addEventListener('click', scrollRight);
    if (track) {
      track.addEventListener('click', handleCardClick);
      track.addEventListener('keydown', handleKeydown);
      track.setAttribute('tabindex', '0');
    }

    initLazyLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
