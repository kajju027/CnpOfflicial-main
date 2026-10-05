(function() {
  'use strict';

  const config = window.MATCHDEKHO_CONFIG || {};
  const API_URL = config.apis && config.apis.fancode;
  const PLAYER_ROUTE = config.routes && config.routes.fancodePlayer || '/fc/play/';
  const LANGUAGE_MAP = {
    eng: 'ENGLISH',
    hin: 'HINDI',
    bang: 'BANGLA',
    ml: 'MALAYALAM',
    tam: 'TAMIL',
    tel: 'TELUGU',
    kan: 'KANNADA',
    mar: 'MARATHI',
    guj: 'GUJARATI',
    pun: 'PUNJABI',
    ori: 'ODIA',
    bho: 'BHOJPURI'
  };
  const track = document.getElementById('fancodeTrack');
  const arrowLeft = document.getElementById('fancodeArrowLeft');
  const arrowRight = document.getElementById('fancodeArrowRight');
  const summary = document.getElementById('fancodeSummary');
  const updated = document.getElementById('fancodeUpdated');
  const SKELETON_COUNT = 5;
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

  function getBaseMatchId(value) {
    return String(value || '').trim().split('_')[0];
  }

  function resolveLanguage(value) {
    const normalized = String(value || '').trim().replace(/^\[|\]$/g, '').toUpperCase();
    if (!normalized) return null;

    for (const [code, label] of Object.entries(LANGUAGE_MAP)) {
      if (normalized === code.toUpperCase() || normalized === label) {
        return { code: code, label: label };
      }
    }

    return null;
  }

  function getLanguages(match) {
    const values = [];
    const autoStreams = match.auto_streams;

    if (autoStreams && typeof autoStreams === 'object' && !Array.isArray(autoStreams)) {
      values.push.apply(values, Object.keys(autoStreams));
    }

    const languages = match.languages || match.available_languages;
    if (Array.isArray(languages)) {
      values.push.apply(values, languages);
    } else if (languages && typeof languages === 'object') {
      values.push.apply(values, Object.keys(languages));
      values.push.apply(values, Object.values(languages));
    } else if (typeof languages === 'string') {
      values.push.apply(values, languages.split(/[,|/]+/));
    }

    if (match.language) values.push.apply(values, String(match.language).split(/[,|/]+/));

    const title = String(match.title || match.event_name || '');
    const titleLanguage = title.match(/\[([^\]]+)\]\s*$/);
    if (titleLanguage) values.push.apply(values, titleLanguage[1].split(/[,|/]+/));

    const options = [];
    const seen = new Set();

    values.forEach(function(value) {
      const language = resolveLanguage(value);
      if (language && !seen.has(language.code)) {
        seen.add(language.code);
        options.push(language);
      }
    });

    return options;
  }

  function buildPlayerUrl(matchId, languageCode) {
    const baseId = getBaseMatchId(matchId);
    const params = new URLSearchParams();
    params.set('id', `${baseId}_${languageCode}`);
    params.set('s', '0');
    return `${PLAYER_ROUTE}?${params.toString()}`;
  }

  function cleanTitle(match) {
    return String(match.title || match.event_name || match.match_name || 'Live Match')
      .replace(/\s*\[[^\]]+\]\s*$/, '')
      .trim();
  }

  function getMatchup(title) {
    const parts = String(title || '').split(/\s+-\s+/);
    const candidate = parts[parts.length - 1];
    const result = candidate.match(/^(.+?)\s+(?:vs\.?|v\.?|versus)\s+(.+)$/i);
    if (!result) return null;
    return { home: result[1].trim(), away: result[2].trim() };
  }

  function getSourceTime(value) {
    return value == null ? '' : String(value);
  }

  function statusInfo(value) {
    const status = String(value || 'UPCOMING').toUpperCase();
    if (status === 'LIVE') return { label: 'LIVE', className: 'live' };
    if (['ENDED', 'FINISHED', 'COMPLETED'].includes(status)) return { label: 'ENDED', className: 'ended' };
    if (['CANCELLED', 'CANCELED', 'POSTPONED'].includes(status)) return { label: status, className: 'ended' };
    return { label: 'UPCOMING', className: 'upcoming' };
  }

  function renderSkeletonCards() {
    if (!track) return;
    track.innerHTML = Array.from({ length: SKELETON_COUNT }, function() {
      return `
        <div class="fancode-card fc-skeleton-card" aria-hidden="true">
          <div class="fc-skeleton-thumb"></div>
          <div class="fc-skeleton-info">
            <div class="fc-skeleton-line short"></div>
            <div class="fc-skeleton-line medium"></div>
            <div class="fc-skeleton-line long"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateSummary(data, matches) {
    const liveCount = matches.filter(function(match) {
      return String(match.status || '').toUpperCase() === 'LIVE';
    }).length;
    const upcomingCount = matches.filter(function(match) {
      return String(match.status || '').toUpperCase() === 'UPCOMING';
    }).length;

    if (summary) {
      summary.textContent = `${liveCount} LIVE · ${upcomingCount} UPCOMING`;
      summary.classList.toggle('has-live', liveCount > 0);
    }

    if (updated) {
      updated.textContent = data.updatedAt ? `Updated ${data.updatedAt}` : '';
    }
  }

  function renderMatches(matches) {
    if (!track) return;

    if (!matches.length) {
      track.innerHTML = '<div class="fancode-empty" role="status">No FanCode matches are available right now.</div>';
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

    track.innerHTML = sortedMatches.map(function(match) {
      const id = getBaseMatchId(match.match_id || match.id);
      const title = cleanTitle(match);
      const matchup = getMatchup(title);
      const tournament = String(match.tournament || match.category || 'FanCode');
      const category = String(match.category || 'SPORTS');
      const image = safeHttpUrl(match.image || match.src);
      const time = getSourceTime(match.startTime || match.time);
      const status = statusInfo(match.status);
      const languages = status.className === 'live' ? getLanguages(match) : [];
      const matchupHtml = matchup
        ? `<div class="fancode-teams"><span class="fancode-team-name">${escapeHtml(matchup.home)}</span><span class="fancode-vs">VS</span><span class="fancode-team-name">${escapeHtml(matchup.away)}</span></div>`
        : `<h3 class="fancode-event-title">${escapeHtml(title)}</h3>`;
      const watchButtons = status.className === 'live' && id && languages.length
        ? `<div class="fancode-actions">${languages.map(function(language) {
            const href = buildPlayerUrl(id, language.code);
            return `<a class="fancode-watch-button" href="${escapeHtml(href)}" aria-label="Watch in ${escapeHtml(language.label)}"><span class="fc-btn-icon" aria-hidden="true">▶</span><span class="fc-btn-label">WATCH NOW <span class="fc-btn-sep" aria-hidden="true">•</span> ${escapeHtml(language.label)}</span></a>`;
          }).join('')}</div>`
        : '';

      return `
        <article class="fancode-card ${status.className}">
          <div class="fancode-thumb${image ? '' : ' no-image'}">
            ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : ''}
            <span class="fancode-category-tag">${escapeHtml(category)}</span>
            <span class="fancode-status-pill ${status.className}">${status.label}</span>
          </div>
          <div class="fancode-info">
            <div class="fancode-tournament">${escapeHtml(tournament)}</div>
            ${matchupHtml}
            ${time ? `<div class="fancode-meta"><time class="fancode-time">${escapeHtml(time)}</time></div>` : ''}
            ${watchButtons}
          </div>
        </article>
      `;
    }).join('');

    track.querySelectorAll('.fancode-thumb img').forEach(function(image) {
      image.addEventListener('error', function() {
        image.hidden = true;
        image.parentElement.classList.add('no-image');
      });
    });
  }

  function renderError(message) {
    if (!track) return;
    track.innerHTML = `
      <div class="fancode-error" role="status">
        <strong>Unable to load FanCode matches</strong>
        <span>${escapeHtml(message || 'Please try again.')}</span>
        <button class="fancode-retry" type="button">Retry</button>
      </div>
    `;
    const retry = track.querySelector('.fancode-retry');
    if (retry) retry.addEventListener('click', fetchFancodeData);
  }

  async function fetchFancodeData() {
    if (isLoading || !track || !API_URL) return;
    isLoading = true;
    if (!hasLoaded) renderSkeletonCards();

    try {
      const response = await fetch(API_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const matches = Array.isArray(data) ? data : Array.isArray(data.matches) ? data.matches : [];
      updateSummary(data, matches);
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
    const card = track && track.querySelector('.fancode-card, .fc-skeleton-card');
    if (!card) return 560;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '20');
    return (card.getBoundingClientRect().width + gap) * 2;
  }

  function scrollByDirection(direction) {
    if (!track) return;
    track.scrollBy({ left: direction * scrollAmount(), behavior: 'smooth' });
  }

  function initLazyLoad() {
    const section = document.getElementById('fancodeSection');
    if (!section) return;
    if (section.getBoundingClientRect().top < window.innerHeight) {
      fetchFancodeData();
      return;
    }

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          fetchFancodeData();
          observer.disconnect();
        }
      });
    }, { rootMargin: '240px' });

    observer.observe(section);
  }

  function init() {
    if (arrowLeft) arrowLeft.addEventListener('click', function() { scrollByDirection(-1); });
    if (arrowRight) arrowRight.addEventListener('click', function() { scrollByDirection(1); });

    if (track) {
      track.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') scrollByDirection(-1);
        if (event.key === 'ArrowRight') scrollByDirection(1);
      });
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