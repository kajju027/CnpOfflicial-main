/* =====================================================================
   Hero slider / header menu  —  v3.1 (fixed)
   ---------------------------------------------------------------------
   * Hero posters are the first thing a visitor sees, so they are now
     loaded eagerly with fetchpriority="high" (before: slide 2+ used
     loading="lazy" and stayed blank until after the slide changed).
   * The autoplay timer no longer advances the slider while the tab is
     in the background, so the first slide is always the one on screen
     when the visitor comes back.
   ===================================================================== */
(function () {
  const config = window.MATCHDEKHO_CONFIG || {};
  let matches = Array.isArray(config.heroMatches) ? config.heroMatches.slice() : [];
  const slidesRoot = document.getElementById("heroSlides");
  const progressRoot = document.getElementById("sliderProgress");
  const posterWrapper = document.getElementById("posterWrapper");
  const arrowLeft = document.getElementById("arrowLeft");
  const arrowRight = document.getElementById("arrowRight");
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  const slideDuration = Number(config.heroSlideDuration) || 10000;
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

  function teamValue(team, key) {
    if (team && typeof team === "object") return team[key] || "";
    return "";
  }

  function normalizeMatch(item) {
    const titleText = String(item.title || item.teams || item.match_name || "");
    const splitTeams = titleText.split(/\s+(?:vs\.?|v\.?|versus)\s+/i);
    const home = item.homeTeam || item.team1 || {};
    const away = item.awayTeam || item.team2 || {};
    const homeName = teamValue(home, "name") || item.team_1 || splitTeams[0] || "Home Team";
    const awayName = teamValue(away, "name") || item.team_2 || splitTeams[1] || "Away Team";
    return {
      tournament: item.tournament || item.league || item.event_name || item.series || item.title || "Live Match",
      homeTeam: {
        name: homeName,
        logo: teamValue(home, "logo") || teamValue(home, "flag") || item.home_logo || item.team_1_logo || ""
      },
      awayTeam: {
        name: awayName,
        logo: teamValue(away, "logo") || teamValue(away, "flag") || item.away_logo || item.team_2_logo || ""
      },
      poster: item.poster || item.backgroundImage || item.thumbnail || item.cover_image || item.src || item.tvgLogo || "",
      posterPosition: item.posterPosition || "",
      posterPositionMobile: item.posterPositionMobile || "",
      watchUrl: item.watchUrl || item.page_url || item.watch_now || "#willow-live"
    };
  }

  function renderMatch(match, index) {
    const normalized = normalizeMatch(match);
    const home = normalized.homeTeam;
    const away = normalized.awayTeam;
    const title = escapeHtml(normalized.tournament);
    const homeName = escapeHtml(home.name);
    const awayName = escapeHtml(away.name);
    const homeLogo = escapeHtml(home.logo);
    const awayLogo = escapeHtml(away.logo);
    const poster = escapeHtml(normalized.poster);
    const watchUrl = escapeHtml(normalized.watchUrl);

    /* Per-poster crop focus — lets a portrait poster (e.g. the India–Uruguay
       FIFA one) sit on the faces instead of the middle. Desktop and mobile
       can point at different heights. */
    const posDesktop = escapeHtml(normalized.posterPosition);
    const posMobile = escapeHtml(normalized.posterPositionMobile);
    const posterStyle = (posDesktop || posMobile)
      ? ` style="--poster-pos:${posDesktop || "center 25%"};--poster-pos-m:${posMobile || posDesktop || "center 40%"};"`
      : "";

    return `
      <section class="poster-section${index === 0 ? " active" : ""}" data-slide="${index}" aria-label="${title}: ${homeName} vs ${awayName}">
        <div class="poster-art">
          <picture>
            <img src="${poster}" alt="${homeName} vs ${awayName}" class="poster-image" loading="eager" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ''}${posterStyle}>
          </picture>
          <div class="gradient-left"></div>
          <div class="gradient-overlay"></div>
        </div>
        <div class="match-details">
          <div class="match-title">${title}</div>
          <div class="teams-row">
            <div class="team">
              ${homeLogo ? `<img src="${homeLogo}" alt="" class="team-flag" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">` : ""}
              <span class="team-name">${homeName}</span>
            </div>
            <span class="vs-label" aria-hidden="true">VS</span>
            <div class="team">
              ${awayLogo ? `<img src="${awayLogo}" alt="" class="team-flag" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">` : ""}
              <span class="team-name">${awayName}</span>
            </div>
          </div>
          <div class="action-buttons">
            <a href="${watchUrl}" class="watch-btn"><span class="icon">▶</span><span>Watch Now</span></a>
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

    slidesRoot.querySelectorAll(".poster-image").forEach(function (image) {
      image.addEventListener("error", function () {
        image.hidden = true;
        image.closest(".poster-art").classList.add("image-fallback");
      });
    });

    slidesRoot.querySelectorAll(".team-flag").forEach(function (image) {
      image.addEventListener("error", function () {
        image.hidden = true;
      });
    });

    if (matches.length < 2) {
      if (arrowLeft) arrowLeft.hidden = true;
      if (arrowRight) arrowRight.hidden = true;
      progressRoot.hidden = true;
    } else {
      if (arrowLeft) arrowLeft.hidden = false;
      if (arrowRight) arrowRight.hidden = false;
      progressRoot.hidden = false;
    }

    currentIndex = 0;
    updateProgressBars();
    restartAutoplay();
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
    if (matches.length < 2 || !slidesRoot) return;
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
    if (document.hidden) return;
    if (matches.length > 1) {
      autoplayTimer = window.setTimeout(function () {
        goToSlide(currentIndex + 1);
      }, slideDuration);
    }
  }

  /* Coming back to the tab → restart the timer so the visitor always sees
     a full slide instead of a half-finished one. */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (autoplayTimer) window.clearTimeout(autoplayTimer);
    } else {
      updateProgressBars();
      restartAutoplay();
    }
  });

  async function loadRemoteHeroFeed() {
    const feedUrl = config.heroFeedUrl;
    if (!feedUrl) return;

    try {
      const response = await fetch(feedUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const remoteMatches = Array.isArray(data) ? data : data.heroMatches || data.matches || data.Matches || data.streams || [];
      if (Array.isArray(remoteMatches) && remoteMatches.length) {
        matches = remoteMatches.slice(0, Number(config.maxHeroMatches) || 8).map(normalizeMatch);
        renderHero();
      }
    } catch (error) {
      console.error("Featured match feed could not be loaded:", error);
    }
  }

  function closeMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  renderHero();
  loadRemoteHeroFeed();

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
    const activeSlide = slidesRoot && slidesRoot.querySelector(".poster-section.active");
    const watchLink = activeSlide && activeSlide.querySelector(".watch-btn");
    if (watchLink) window.location.href = watchLink.href;
  });

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function (event) {
      event.stopPropagation();
      hamburger.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      const isOpen = mobileMenu.classList.contains("active");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
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
