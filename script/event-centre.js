/* Generic, player-free destination for Football/Cricket card links. */
(function () {
  'use strict';

  var shell = document.getElementById('eventShell');
  var params = new URLSearchParams(window.location.search);
  var sport = params.get('sport') === 'cricket' ? 'cricket' : 'football';
  var slug = params.get('slug') || '';
  var eventId = params.get('id') || '';
  var endpoint = sport === 'cricket'
    ? 'https://sonujson-v5.pages.dev/Data/events/cricket.json'
    : 'https://sonujson-v5.pages.dev/Data/events/football.json';

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function initials(value) {
    return String(value || 'Team').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part[0]; }).join('').toUpperCase() || 'TM';
  }

  function safeImage(value) {
    if (typeof value !== 'string') return '';
    try {
      var url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch (error) { return ''; }
  }

  function parseIst(value) {
    var match = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    return match ? new Date(match[1] + '-' + match[2] + '-' + match[3] + 'T' + match[4] + ':' + match[5] + ':00+05:30') : null;
  }

  function upcomingTime(value) {
    var match = String(value || '').match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return value || 'Time to be confirmed';
    var hour = Number(match[4]);
    return match[3] + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(match[2]) - 1] + ' · ' + (hour % 12 || 12) + ':' + match[5] + ' ' + (hour >= 12 ? 'PM' : 'AM') + ' IST';
  }

  function elapsed(value) {
    var start = parseIst(value);
    if (!start || Number.isNaN(start.getTime())) return 'Live now';
    var seconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
    return String(Math.floor(seconds / 3600)).padStart(2, '0') + 'h ' + String(Math.floor((seconds % 3600) / 60)).padStart(2, '0') + 'm ' + String(seconds % 60).padStart(2, '0') + 's';
  }

  function stateOf(item) {
    var status = String(item && item.status || 'upcoming').toLowerCase();
    return status === 'live' ? 'live' : ['ended', 'finished', 'completed'].indexOf(status) > -1 ? 'ended' : 'upcoming';
  }

  function team(name, image) {
    var source = safeImage(image);
    return '<div class="event-team"><div class="event-logo' + (source ? ' has-image' : '') + '">' + (source ? '<img src="' + escapeHtml(source) + '" alt="" referrerpolicy="no-referrer">' : '') + '<span>' + escapeHtml(initials(name)) + '</span></div><span class="event-team-name">' + escapeHtml(name) + '</span></div>';
  }

  function render(item) {
    var event = item.event || {};
    var status = stateOf(item);
    var time = event.startTimeIST || '';
    var label = status === 'live' ? 'Live for' : status === 'upcoming' ? 'Upcoming' : 'Event finished';
    var value = status === 'live' ? elapsed(time) : status === 'upcoming' ? upcomingTime(time) : 'Finished';
    var extraClass = status === 'upcoming' ? ' upcoming' : '';

    document.title = (event.name || item.title || 'Event') + ' — CnpTV';
    shell.innerHTML = '<div class="event-hero"><div class="event-topline"><span class="event-sport">' + escapeHtml(event.category || sport) + '</span><span class="event-state ' + status + '">' + escapeHtml(status === 'ended' ? 'Ended' : status) + '</span></div><p class="event-league">' + escapeHtml(item.title || event.name || sport) + '</p><h1 class="event-name">' + escapeHtml(event.name || item.title || 'Sports event') + '</h1><div class="event-teams">' + team(event.teamA || 'Team A', event.teamAFlag) + '<span class="event-versus">VS</span>' + team(event.teamB || 'Team B', event.teamBFlag) + '</div></div><div class="event-status"><div class="status-card"><span class="status-label">' + escapeHtml(label) + '</span><time class="status-time' + extraClass + '" data-event-start="' + escapeHtml(time) + '" data-status="' + status + '">' + escapeHtml(value) + '</time><span class="status-note">Match details refresh automatically from the schedule.</span></div></div>';
  }

  function renderError() {
    shell.innerHTML = '<div class="event-error"><div><strong>Event details are unavailable</strong><span>Please return to the schedule and choose another event.</span><br><a href="/">Back to home</a></div></div>';
  }

  fetch(endpoint, { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
    .then(function (payload) {
      var events = Array.isArray(payload.events) ? payload.events : [];
      var item = events.find(function (entry) { return (slug && entry.slug === slug) || (eventId && String(entry.id) === String(eventId)); });
      if (!item) throw new Error('Event not found');
      render(item);
      window.setInterval(function () {
        var timer = document.querySelector('[data-event-start][data-status="live"]');
        if (timer) timer.textContent = elapsed(timer.getAttribute('data-event-start'));
      }, 1000);
    })
    .catch(renderError);
})();
