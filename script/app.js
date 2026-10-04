(function () {
  const config = window.MATCHDEKHO_CONFIG || {};
  const matches = Array.isArray(config.heroMatches) ? config.heroMatches : [];
  const posterWrapper = document.getElementById("posterWrapper");
  const slidesRoot = document.getElementById("heroSlides");
  const progressRoot = document.getElementById("sliderProgress");
  const arrowLeft = document.getElementById("arrowLeft");
  const arrowRight = document.getElementById("arrowRight");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const slideDuration = 10000;
  let currentIndex = 0;
  let autoplayTimer = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function badgeClass(label) {
    const key = String(label).toLowerCase();
    const classes = {
      live: "badge-fulltime",
      "4k": "badge-4k",
      hdr: "badge-hdr",
      fanzone: "badge-fanzone"
    };
    return classes[key] || "";
  }

  function renderMatch(match, index) {
    const home = match.homeTeam || {};
    const away = match.awayTeam || {};
    const title = escapeHtml(match.tournament || "Live Match");
    const homeName = escapeHtml(home.name || "Home Team");
    const awayName = escapeHtml(away.name || "Away Team");
    const status = escapeHtml(match.status || "LIVE");
    const poster = escapeHtml(match.posterDesktop || "");
    const mobilePoster = escapeHtml(match.posterMobile || match.posterDesktop || "");
    const watchUrl = escapeHtml(match.watchUrl || "#willow-live");
    const info = [];

    if (match.status) info.push(`<span class="tag">${status}</span>`);
    if (match.date) info.push(`<span class="date">${escapeHtml(match.date)}</span>`);
    if (match.time) info.push(`<span class="time">${escapeHtml(match.time)}</span>`);
    if (match.venue) info.push(`<span class="venue">${escapeHtml(match.venue)}</span>`);

    const matchInfo = info.map(function (item, itemIndex) {
      return `${itemIndex ? '<span class="separator">•</span>' : ""}${item}`;
    }).join("");

    const badges = (Array.isArray(match.badges) ? match.badges : []).map(function (badge) {
      const className = badgeClass(badge);
      return `<span class="badge ${className}">${escapeHtml(badge)}</span>`;
    }).join("");

    return `
      <section class="poster-section${index === 0 ? " active" : ""}" data-slide="${index}" aria-label="${title}">
        <picture>
          <source media="(orientation: portrait) and (max-width: 768px)" srcset="${mobilePoster}">
          <source media="(min-width: 769px)" srcset="${poster}">
          <img src="${poster}" alt="${homeName} vs ${awayName}" class="poster-image" loading="${index === 0 ? "eager" : "lazy"}">
        </picture>
        <div class="gradient-left"></div>
        <div class="gradient-overlay"></div>
        <div class="match-details">
          <div class="match-title">${title}</div>
          <div class="teams-row">
            <div class="team">
              <img src="${escapeHtml(home.flag || "")}" alt="${homeName}" class="team-flag" loading="lazy">
              <span class="team-name">${homeName}</span>
            </div>
            <span class="vs-score">${escapeHtml(match.score || "VS")}</span>
            <div class="team">
              <img src="${escapeHtml(away.flag || "")}" alt="${awayName}" class="team-flag" loading="lazy">
              <span class="team-name">${awayName}</span>
            </div>
          </div>
          <div class="match-info">${matchInfo}</div>
          <div class="badges">${badges}</div>
          <div class="action-buttons">
            <a href="${watchUrl}" class="watch-btn"><span class="icon">▶</span><span>Watch Now</span></a>
            <button type="button" class="btn-mytod">+ My TOD</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderHero() {
    if (!slidesRoot || !progressRoot) return;
    slidesRoot.innerHTML = matches.map(renderMatch).join("");
    progressRoot.innerHTML = matches.map(function (_, index) {
      return `<div class="progress-track" data-track="${index}"><div class="progress-fill"></div></div>`;
    }).join("");

    if (matches.length < 2) {
      if (arrowLeft) arrowLeft.hidden = true;
      if (arrowRight) arrowRight.hidden = true;
      if (progressRoot) progressRoot.hidden = true;
    }
  }

  function updateProgressBars() {
    if (!progressRoot) return;
    Array.from(progressRoot.querySelectorAll(".progress-track")).forEach(function (track, index) {
      const fill = track.querySelector(".progress-fill");
      fill.classList.remove("filling", "filled");
      fill.style.animationDuration = `${slideDuration}ms`;
      fill.style.width = "";
      void fill.offsetWidth;
      if (index < currentIndex) fill.classList.add("filled");
      if (index === currentIndex) fill.classList.add("filling");
    });
  }

  function goToSlide(index) {
    if (matches.length < 2) return;
    const slides = Array.from(slidesRoot.querySelectorAll(".poster-section"));
    const nextIndex = ((index % slides.length) + slides.length) % slides.length;
    slides[currentIndex].classList.remove("active");
    slides[nextIndex].classList.add("active");
    currentIndex = nextIndex;
    updateProgressBars();
    restartAutoplay();
  }

  function restartAutoplay() {
    if (autoplayTimer) window.clearTimeout(autoplayTimer);
    if (matches.length > 1) autoplayTimer = window.setTimeout(function () {
      goToSlide(currentIndex + 1);
    }, slideDuration);
  }

  function closeMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  renderHero();
  updateProgressBars();
  restartAutoplay();

  if (arrowRight) arrowRight.addEventListener("click", function (event) {
    event.stopPropagation();
    goToSlide(currentIndex + 1);
  });

  if (arrowLeft) arrowLeft.addEventListener("click", function (event) {
    event.stopPropagation();
    goToSlide(currentIndex - 1);
  });

  if (posterWrapper) posterWrapper.addEventListener("click", function (event) {
    if (event.target.closest(".action-buttons, .slider-arrow, .slider-progress")) return;
    const activeSlide = slidesRoot.querySelector(".poster-section.active");
    const watchLink = activeSlide && activeSlide.querySelector(".watch-btn");
    if (watchLink) window.location.href = watchLink.href;
  });

  document.querySelectorAll(".btn-mytod").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.alert("Added to My TOD!");
    });
  });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function (event) {
      event.stopPropagation();
      hamburger.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", mobileMenu.classList.contains("active") ? "true" : "false");
      document.body.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : "";
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (mobileMenu.classList.contains("active") && !mobileMenu.contains(event.target) && !hamburger.contains(event.target)) closeMenu();
    });
  }
})();
