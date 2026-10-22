/* =====================================================================
   X-PRODUCTIONS — HOMEPAGE SCRIPT  (Member 1)
   Only runs on index.html. Needs data.js and main.js loaded first.
     1. Renders the three Featured Events from the shared data.
     2. Runs the hero photo slideshow with progress indicators.
   (Extra file: keeps homepage-only code out of the shared main.js.)
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- Featured events ---------- */
  const grid = document.getElementById("featuredGrid");
  if (grid) {
    grid.innerHTML = XP.getFeatured().map((event) => `
      <a class="tile" href="pages/event-details.html?id=${encodeURIComponent(event.id)}" aria-label="${event.name} — view event details">
        <div class="poster tile__poster">
          ${event.image ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, 1000)}" alt="" loading="lazy">` : ""}
        </div>
        <div class="tile__shade"></div>
        <div class="tile__body">
          <div>
            <h3 class="tile__title">${event.name}</h3>
            <div class="tile__meta"><span data-icon="calendar"></span>${XP.formatDate(event)}</div>
            <div class="tile__meta tile__meta--venue"><span data-icon="pin"></span>${event.venue}</div>
          </div>
          <span class="tile__arrow"><span data-icon="arrow-up-right"></span></span>
        </div>
      </a>`).join("");
    XPUI.drawIcons(grid);
    XPUI.watchImages(grid);
  }

  /* ---------- Hero slideshow ---------- */
  const slides = document.querySelectorAll(".hero__slide");
  const dots = document.querySelectorAll(".hero__dots button");
  if (!slides.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SLIDE_MS = 6500;     // must match the progress animation length in home.css
  let current = 0;
  let timer;

  function show(n) {
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => {
      d.classList.remove("is-active");
      void d.offsetWidth;                       // restart the progress animation
      d.classList.toggle("is-active", i === current);
      d.setAttribute("aria-current", i === current ? "true" : "false");
    });
    clearTimeout(timer);
    if (!reduceMotion) timer = setTimeout(() => show(current + 1), SLIDE_MS);
  }

  dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
  show(0);
})();
