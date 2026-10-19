/* =====================================================================
   X-PRODUCTIONS — EVENTS SCRIPT  (Member 2)
   Runs on pages/events.html (listing, search, filters, sorting) and
   pages/event-details.html (the event chosen via ?id=...).
   Needs data.js and main.js loaded first. All event info comes from XP.
   ===================================================================== */

(function () {
  "use strict";

  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function eventDate(event) {
    const [y, m, d] = event.date.split("-").map(Number);
    return { day: String(d).padStart(2, "0"), month: MONTHS[m - 1], key: y * 10000 + m * 100 + d };
  }

  /* Poster with a photograph; the gradient shows if the photo is missing or fails */
  function posterHtml(event, width, extraClass) {
    const img = event.image
      ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, width)}" alt="" loading="lazy">`
      : "";
    return `<div class="poster ${extraClass}">${img}`;
  }

  /* =====================  EVENTS LISTING  ===================== */
  const grid = document.getElementById("eventGrid");
  if (grid) {
    const searchInput = document.getElementById("searchInput");
    const cityInput = document.getElementById("cityInput");
    const sortInput = document.getElementById("sortInput");
    const pillsBox = document.getElementById("categoryPills");
    const countEl = document.getElementById("eventCount");
    const emptyEl = document.getElementById("emptyState");

    let activeCategory = new URLSearchParams(location.search).get("category") || "all";
    if (activeCategory !== "all" && !XP.CATEGORIES.some((c) => c.key === activeCategory)) activeCategory = "all";

    // City dropdown comes from the data, so new cities appear automatically
    [...new Set(XP.getPublicEvents().map((e) => e.city))].sort().forEach((city) => {
      cityInput.insertAdjacentHTML("beforeend", `<option value="${city}">${city}</option>`);
    });

    function renderPills() {
      const pills = [{ key: "all", label: "All events" }, ...XP.CATEGORIES];
      pillsBox.innerHTML = pills.map((p) =>
        `<button class="pill" type="button" data-category="${p.key}" aria-pressed="${p.key === activeCategory}">${p.label}</button>`).join("");
    }

    function getVisibleEvents() {
      const q = searchInput.value.trim().toLowerCase();
      const list = XP.getPublicEvents().filter((e) => {
        const text = [e.name, e.artist, e.categoryLabel, e.venue, e.city].join(" ").toLowerCase();
        return (activeCategory === "all" || e.category === activeCategory)
          && (!cityInput.value || e.city === cityInput.value)
          && (!q || text.includes(q));
      });
      const sort = sortInput.value;
      list.sort((a, b) => {
        if (sort === "price-asc") return XP.minPrice(a) - XP.minPrice(b);
        if (sort === "price-desc") return XP.minPrice(b) - XP.minPrice(a);
        return eventDate(a).key - eventDate(b).key;
      });
      return list;
    }

    function cardHtml(event) {
      const d = eventDate(event);
      return `
        <a class="event-card" href="event-details.html?id=${encodeURIComponent(event.id)}" aria-label="${event.name} — view details">
          ${posterHtml(event, 800, "event-card__poster")}
            <span class="event-card__date"><b>${d.day}</b>${d.month}</span>
            ${XP.statusOf(event) === "sold-out" ? '<span class="event-card__soldout">Sold out</span>' : ""}
          </div>
          <div class="event-card__body">
            <div class="event-card__cat">${event.categoryLabel}</div>
            <h2 class="event-card__title">${event.name}</h2>
            <div class="event-card__venue"><span data-icon="pin"></span>${event.venue}</div>
            <div class="event-card__foot">
              <span class="price">From <b>${XP.formatPrice(XP.minPrice(event))}</b></span>
              <span class="event-card__go"><span data-icon="arrow-up-right"></span></span>
            </div>
          </div>
        </a>`;
    }

    function render() {
      const list = getVisibleEvents();
      grid.innerHTML = list.map(cardHtml).join("");
      XPUI.drawIcons(grid);
      XPUI.watchImages(grid);
      countEl.textContent = `${list.length} event${list.length === 1 ? "" : "s"}`;
      emptyEl.hidden = list.length > 0;
      pillsBox.querySelectorAll(".pill").forEach((p) =>
        p.setAttribute("aria-pressed", String(p.dataset.category === activeCategory)));
    }

    pillsBox.addEventListener("click", (e) => {
      const pill = e.target.closest(".pill");
      if (!pill) return;
      activeCategory = pill.dataset.category;
      render();
    });
    [searchInput, cityInput, sortInput].forEach((el) => el.addEventListener("input", render));
    document.getElementById("clearFilters").addEventListener("click", () => {
      searchInput.value = ""; cityInput.value = ""; sortInput.value = "date"; activeCategory = "all";
      render();
    });

    renderPills();
    render();
  }

  /* =====================  EVENT DETAILS  ===================== */
  const detailBox = document.getElementById("eventDetails");
  if (detailBox) {
    const id = new URLSearchParams(location.search).get("id");
    const found = XP.getEvent(id);
    const event = found && XP.statusOf(found) !== "draft" ? found : null;   // hidden (draft) events act as missing
    const soldOut = !!event && XP.statusOf(event) === "sold-out";

    if (!event) {
      document.title = "Event not found — X-Productions";
      detailBox.innerHTML = `
        <div class="not-found">
          <h1>Event not found</h1>
          <p>We couldn't find that event. It may have been removed.</p>
          <a class="btn btn--primary" href="events.html">Browse all events</a>
        </div>`;
    } else {
      document.title = `${event.name} — X-Productions`;
      const tiers = event.tiers.map((t) => `
        <div class="tier">
          <div>
            <div class="tier__name">${t.name}</div>
            <div class="tier__note">${t.note}</div>
            <div class="tier__left${t.low ? " tier__left--low" : ""}">${t.low ? `Only ${t.remaining} left` : `${t.remaining.toLocaleString("en-US")} left`}</div>
          </div>
          <div class="tier__price">${XP.formatPrice(t.price)}</div>
        </div>`).join("");

      detailBox.innerHTML = `
        <nav class="crumb" aria-label="Breadcrumb">
          <a href="events.html">Events</a><span aria-hidden="true">/</span><span>${event.name}</span>
        </nav>
        <div class="detail">
          <article>
            ${posterHtml(event, 1600, "detail__banner")}</div>
            <div class="detail__cat"><span class="chip">${event.categoryLabel}</span></div>
            <h1 class="detail__title">${event.name}</h1>
            <p class="detail__artist">${event.artist}</p>

            <div class="meta">
              <div class="meta__item"><span class="meta__icon" data-icon="calendar"></span><div><small>Date</small><b>${XP.formatDate(event)}</b></div></div>
              <div class="meta__item"><span class="meta__icon" data-icon="clock"></span><div><small>Time</small><b>${event.time}</b></div></div>
              <div class="meta__item"><span class="meta__icon" data-icon="pin"></span><div><small>Venue</small><b>${event.venue}</b></div></div>
            </div>

            <section class="detail__section">
              <h2>About this event</h2>
              ${event.description.map((p) => `<p>${p}</p>`).join("")}
            </section>
            ${event.doorsInfo || (event.program && event.program.length) ? `
            <section class="detail__section">
              <h2>Schedule</h2>
              ${event.doorsInfo ? `<p>${event.doorsInfo}</p>` : ""}
              <div>${(event.program || []).map((r) => `<div class="program__row"><span class="program__time">${r.time}</span><span>${r.title}</span></div>`).join("")}</div>
            </section>` : ""}
            <section class="detail__section">
              <h2>Venue</h2>
              <p><b>${event.venue}</b></p>
              ${event.venueNote ? `<p>${event.venueNote}</p>` : ""}
            </section>
          </article>

          <aside class="tickets card" aria-label="Tickets">
            <h2 class="tickets__title">Tickets</h2>
            ${tiers}
            <div class="tickets__from"><span>From</span><b>${XP.formatPrice(XP.minPrice(event))}</b></div>
            ${soldOut
              ? '<button class="btn btn--primary btn--lg" type="button" disabled>Sold out</button>'
              : `<a class="btn btn--primary btn--lg" href="booking.html?id=${encodeURIComponent(event.id)}"><span data-icon="ticket"></span>Book Now</a>`}
            <p class="tickets__demo">Demo data — no real tickets are sold.</p>
          </aside>
        </div>`;
      XPUI.drawIcons(detailBox);
      XPUI.watchImages(detailBox);
    }
  }
})();
