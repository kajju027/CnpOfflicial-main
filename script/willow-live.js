(function() {
  'use strict';

  const config = window.MATCHDEKHO_CONFIG || {};
  const API_URL = config.apis && config.apis.willow;
  const PLAYER_ROUTE = config.routes && config.routes.willowPlayer || '/az/';
  const SERVER_MAP = [
    { id: 2, key: 'fastly_server1' },
    { id: 1, key: 'akamai_server1' },
    { id: 3, key: 'akamai_server2' }
  ];
  const track = document.getElementById('willowLiveTrack');
  const arrowLeft = document.getElementById('willowLiveArrowLeft');
  const arrowRight = document.getElementById('willowLiveArrowRight');
  const liveCountBadge = document.getElementById('liveCountBadge');
  const updatedLabel = document.getElementById('willowUpdated');
  let isLoading = false;
  let hasLoaded = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function safeHttpUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : '';
    } catch (error) {
      return '';
    }
  }

  function findUrl(value) {
    if (typeof value === 'string') return safeHttpUrl(value);
    if (!value || typeof value !== 'object') return '';

    const direct = value.url || value.src || value.link || value.stream_url || value.href;
    if (direct) {
      const directUrl = safeHttpUrl(direct);
      if (directUrl) return directUrl;
    }

    for (const nested of Object.values(value)) {
      const nestedUrl = findUrl(nested);
      if (nestedUrl) return nestedUrl;
    }

    return '';
  }

  function getStreamCandidate(match) {
    const sources = match.CnpTV && typeof match.CnpTV === 'object' ? match.CnpTV : {};

    for (const server of SERVER_MAP) {
      const value = sources[server.key];
      const url = findUrl(value);
      if (url) return { url: url, serverId: server.id, key: server.key };
    }

    return null;
  }

  function buildPlayerUrl(matchId, streamUrl) {
    const params = new URLSearchParams();
    params.set('id', String(matchId));
    params.set('ser', streamUrl);
    return `${PLAYER_ROUTE}?${params.toString()}`;
  }

  function getEventDetails(eventName) {
    const title = String(eventName || 'Live Match').trim();
    const segments = title.split(/\s+[-–—]\s+/).map(function(segment) {
      return segment.trim();
    }).filter(Boolean);
    const matchupText = segments.length ? segments[segments.length - 1] : title;
    const matchup = matchupText.match(/^(.+?)\s+(?:vs\.?|v\.?|versus)\s+(.+)$/i);
    const competition = segments.length > 1 ? segments.slice(0, -1).join(' · ') : '';

    if (matchup) {
      return {
        home: matchup[1].trim(),
        away: matchup[2].trim(),
        display: `${matchup[1].trim()} vs ${matchup[2].trim()}`,
        competition: competition
      };
    }

    return { home: '', away: '', display: title, competition: competition };
  }

  function statusInfo(value) {
    const status = String(value || 'UPCOMING').toUpperCase();
    if (status === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(status)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(status)) return { label: status, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  function renderSkeleton() {
    if (!track) return;
    track.innerHTML = Array.from({ length: 4 }, function() {
      return `
        <div class="willow-live-card willow-skeleton-card" aria-hidden="true">
          <div class="willow-live-thumb willow-skeleton-thumb"><div class="willow-skeleton-shimmer"></div></div>
          <div class="willow-live-info willow-skeleton-info">
            <div class="willow-skeleton-line willow-skeleton-line-title"></div>
            <div class="willow-skeleton-line willow-skeleton-line-subtitle"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateHeader(data, matches) {
    const liveCount = matches.filter(function(match) {
      return String(match.status || '').toUpperCase() === 'LIVE';
    }).length;
    const upcomingCount = matches.filter(function(match) {
      return String(match.status || '').toUpperCase() === 'UPCOMING';
    }).length;

    if (liveCountBadge) {
      liveCountBadge.textContent = `${liveCount} LIVE · ${upcomingCount} UPCOMING`;
      liveCountBadge.classList.toggle('has-live', liveCount > 0);
      liveCountBadge.classList.toggle('no-live', liveCount === 0);
    }

    if (updatedLabel) {
      updatedLabel.textContent = data.last_updated ? `Updated ${data.last_updated}` : '';
    }
  }

  function renderError(message) {
    if (!track) return;
    track.innerHTML = `
      <div class="willow-error" role="status">
        <strong>Unable to load Willow matches</strong>
        <span>${escapeHtml(message || 'Please try again.')}</span>
        <button class="willow-retry" type="button">Retry</button>
      </div>
    `;
    const retry = track.querySelector('.willow-retry');
    if (retry) retry.addEventListener('click', fetchWillowMatches);
  }

  function renderMatches(matches) {
    if (!track) return;

    if (!matches.length) {
      track.innerHTML = '<div class="willow-loading" role="status">No Willow matches are available right now.</div>';
      return;
    }

    const sortedMatches = matches.slice().sort(function(first, second) {
      const rank = function(match) {
        const status = String(match.status || '').toUpperCase();
        if (status === 'LIVE') return 0;
        if (status === 'UPCOMING') return 1;
        return 2;
      };
      return rank(first) - rank(second);
    });

    track.innerHTML = '';

    sortedMatches.forEach(function(match) {
      const id = String(match.id || '').trim();
      const eventName = String(match.event_name || match.title || 'Live Match');
      const details = getEventDetails(eventName);
      const status = statusInfo(match.status);
      const stream = getStreamCandidate(match);
      const hasStream = Boolean(stream);
      const canOpenPlayer = Boolean(id);
      const image = safeHttpUrl(match.image);
      const time = String(match.time || 'Time to be announced');
      const competition = details.competition || String(match.tournament || 'Willow Cricket');
      const teamMarkup = details.home && details.away
        ? `<span class="willow-live-team">${escapeHtml(details.home)}</span><span class="willow-live-vs">VS</span><span class="willow-live-team">${escapeHtml(details.away)}</span>`
        : `<span class="willow-live-team willow-live-team-full">${escapeHtml(details.display)}</span>`;
      const statusMarkup = `<span class="willow-live-status ${status.className}">${status.label}</span>`;
      const imageMarkup = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(eventName)}" loading="lazy">`
        : '';
      const card = document.createElement(canOpenPlayer ? 'a' : 'article');
      card.className = `willow-live-card${canOpenPlayer ? ' is-watchable' : ' is-unavailable'}`;
      card.setAttribute('aria-label', `${eventName}${canOpenPlayer ? ', open player' : ', player unavailable'}`);

      if (canOpenPlayer) {
        card.href = buildPlayerUrl(id, stream ? stream.url : '');
      } else {
        card.setAttribute('aria-disabled', 'true');
      }

      card.innerHTML = `
        <div class="willow-live-thumb${image ? '' : ' no-image'}">
          ${imageMarkup}
          ${statusMarkup}
          ${canOpenPlayer ? `<span class="willow-live-play-overlay"><span aria-hidden="true">▶</span> ${hasStream ? 'Watch Now' : 'Open Player'}</span>` : ''}
        </div>
        <div class="willow-live-info">
          <div class="willow-live-match-title">${teamMarkup}</div>
          <div class="willow-live-group">${escapeHtml(competition)}</div>
          <div class="willow-live-footer">
            <time class="willow-live-time">${escapeHtml(time)}</time>
            <span class="willow-live-action${canOpenPlayer ? '' : ' unavailable'}">${hasStream ? 'Watch Now ↗' : canOpenPlayer ? 'Open Player ↗' : 'Player unavailable'}</span>
          </div>
        </div>
      `;

      const cardImage = card.querySelector('.willow-live-thumb img');
      if (cardImage) {
        cardImage.addEventListener('error', function() {
          cardImage.hidden = true;
          cardImage.parentElement.classList.add('no-image');
        });
      }

      track.appendChild(card);
    });

    track.scrollLeft = 0;
  }

  async function fetchWillowMatches() {
    if (isLoading || !track || !API_URL) return;
    isLoading = true;
    if (!hasLoaded) renderSkeleton();

    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.message || 'The feed returned an error.');
      const matches = Array.isArray(data.Matches) ? data.Matches : Array.isArray(data.matches) ? data.matches : [];
      updateHeader(data, matches);
      renderMatches(matches);
      hasLoaded = true;
    } catch (error) {
      renderError(error.message);
      hasLoaded = true;
    } finally {
      isLoading = false;
    }
  }

  function scrollAmount() {
    const card = track && track.querySelector('.willow-live-card');
    if (!card) return 640;
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  function init() {
    if (arrowRight) {
      arrowRight.addEventListener('click', function(event) {
        event.stopPropagation();
        if (track) track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      });
    }

    if (arrowLeft) {
      arrowLeft.addEventListener('click', function(event) {
        event.stopPropagation();
        if (track) track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      });
    }

    fetchWillowMatches();
    window.setInterval(fetchWillowMatches, 300000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();