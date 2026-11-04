/* ═══════════════════════════════════════════════════════════════════════
   CNP TV — lightweight persistent cache
   ---------------------------------------------------------------------------
   Purpose: when a fan opens a match and then presses "back", the landing
   page must come back exactly as it was — no loading skeletons, no re-fetch
   flash. Every section therefore stores its rendered markup locally and
   re-hydrates from it instantly, then refreshes quietly in the background.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var PREFIX = 'cnptv-cache-v1:';
  var memory = {};

  function readRaw(key) {
    try {
      var value = window.localStorage.getItem(PREFIX + key);
      if (value !== null) return value;
    } catch (error) { /* storage disabled (private mode) — use memory below */ }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
  }

  function writeRaw(key, value) {
    memory[key] = value;
    try { window.localStorage.setItem(PREFIX + key, value); } catch (error) { /* quota */ }
  }

  function dropRaw(key) {
    delete memory[key];
    try { window.localStorage.removeItem(PREFIX + key); } catch (error) { /* ignore */ }
  }

  var Store = {

    /* Read a cached value. maxAgeMs is optional. */
    get: function (key, maxAgeMs) {
      var raw = readRaw(key);
      if (raw === null) return null;
      var separator = raw.indexOf('|');
      var stamp = parseInt(raw.slice(0, separator), 10);
      if (typeof maxAgeMs === 'number' && !isNaN(stamp) && (Date.now() - stamp) > maxAgeMs) {
        dropRaw(key);
        return null;
      }
      return raw.slice(separator + 1);
    },

    set: function (key, value) {
      writeRaw(key, Date.now() + '|' + String(value));
    },

    remove: dropRaw,

    /* Restore a rendered rail from cache. Returns true when markup was restored. */
    hydrate: function (track, key) {
      if (!track) return false;
      if (track.querySelector('.md-card, .event-match-card, .news-card-landing')) return false;
      var html = Store.get(key);
      if (!html || html.length < 40) return false;
      track.innerHTML = html;
      return true;
    },

    /* Store the rendered rail so the next visit is instant. */
    persist: function (track, key) {
      if (!track) return;
      var html = track.innerHTML;
      if (!html || html.length < 40) return;
      if (html.indexOf('md-error') > -1) return;
      if (html.indexOf('md-empty') > -1) return;
      if (html.indexOf('md-skeleton') > -1) return;
      if (html.indexOf('event-match-skeleton') > -1) return;
      if (html.indexOf('news-card-skeleton') > -1) return;
      writeRaw(key, Date.now() + '|' + html);
    }
  };

  window.CNPStore = Store;
})();
