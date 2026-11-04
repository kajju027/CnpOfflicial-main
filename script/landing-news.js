/* Home page news rail: first ten articles, then the /news/ plus card. */
(function () {
  'use strict';

  var NEWS_URL = '/news/data.json';
  var MAX_ITEMS = 10;
  var FALLBACK_IMAGE = '/assets/android-chrome-512x512.png';
  var track = document.getElementById('landingNewsTrack');

  if (!track) return;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      var parsed = new URL(value.trim());
      return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : '';
    } catch (error) {
      return '';
    }
  }

  function relativeTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Latest update';
    var seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr ago';
    return Math.floor(seconds / 86400) + ' days ago';
  }

  function renderArticle(article) {
    var title = escapeHtml(article && article.title || 'Sports update');
    var source = escapeHtml(article && article.source || 'Sports news');
    var image = safeHttpUrl(article && article.image) || FALLBACK_IMAGE;
    var url = safeHttpUrl(article && article.link) || '/news/';
    var target = url === '/news/' ? '' : ' target="_blank" rel="noopener noreferrer"';

    return '' +
      '<a class="news-card-landing" href="' + escapeHtml(url) + '"' + target + '>' +
        '<div class="news-card-media">' +
          '<img class="news-card-img" src="' + escapeHtml(image) + '" alt="" loading="lazy" decoding="async" data-news-image>' +
          '<span class="news-card-source">' + source + '</span>' +
        '</div>' +
        '<div class="news-card-body">' +
          '<h3 class="news-card-title">' + title + '</h3>' +
          '<div class="news-card-time"><span aria-hidden="true">◷</span>' + escapeHtml(relativeTime(article && article.pubDate)) + '</div>' +
        '</div>' +
      '</a>';
  }

  function renderMoreCard() {
    return '' +
      '<a class="news-read-more" href="/news/" aria-label="View all sports news">' +
        '<span class="news-more-icon" aria-hidden="true">+</span>' +
        '<strong>All News</strong>' +
        '<p>Explore every sports update</p>' +
      '</a>';
  }

  function setImageFallbacks() {
    Array.prototype.forEach.call(track.querySelectorAll('[data-news-image]'), function (image) {
      image.addEventListener('error', function () {
        if (image.getAttribute('src') !== FALLBACK_IMAGE) image.setAttribute('src', FALLBACK_IMAGE);
      }, { once: true });
    });
  }

  function renderFailure() {
    track.innerHTML = '<div class="news-feed-message"><strong>News is unavailable right now</strong><span>Please check back in a moment.</span></div>' + renderMoreCard();
  }

  function fetchNewsWithTimeout() {
    return new Promise(function (resolve, reject) {
      var controller = typeof window.AbortController === 'function' ? new window.AbortController() : null;
      var options = { cache: 'no-store', headers: { Accept: 'application/json' } };
      var settled = false;
      var timeout;

      if (controller) options.signal = controller.signal;
      function finish(error, payload) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) reject(error); else resolve(payload);
      }

      timeout = window.setTimeout(function () {
        if (controller) controller.abort();
        finish(new Error('Request timed out'));
      }, 12000);

      fetch(NEWS_URL, options)
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (payload) { finish(null, payload); }, function (error) { finish(error); });
    });
  }

  fetchNewsWithTimeout()
    .then(function (payload) {
      var articles = Array.isArray(payload) ? payload : payload && payload.articles;
      if (!Array.isArray(articles) || !articles.length) {
        renderFailure();
        return;
      }

      // Home page rule: render exactly the first ten API news items at most.
      track.innerHTML = articles.slice(0, MAX_ITEMS).map(renderArticle).join('') + renderMoreCard();
      setImageFallbacks();
    })
    .catch(function (error) {
      if (window.console && console.warn) console.warn('[landing-news] could not load', error);
      renderFailure();
    });
})();
