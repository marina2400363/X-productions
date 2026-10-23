/* =====================================================================
   X-PRODUCTIONS — TICKET SELECTION SCRIPT  (Member 3)
   pages/booking.html: choose ticket categories and quantities, see the
   total, then continue to checkout. The selection is saved as a "draft"
   (XP.store.setDraft) which checkout.html (Member 4) reads.
   ===================================================================== */

(function () {
  "use strict";

  const root = document.getElementById("booking");
  if (!root) return;

  const MAX_PER_TIER = 8;
  const MAX_TOTAL = 10;

  const params = new URLSearchParams(location.search);
  const draft = XP.store.getDraft();
  const found = XP.getEvent(params.get("id") || (draft && draft.eventId));
  const event = found && XP.statusOf(found) !== "draft" ? found : null;   // hidden events can't be booked

  if (event && XP.statusOf(event) === "sold-out") {
    root.innerHTML = `
      <div class="not-found">
        <h1>${event.name} is sold out</h1>
        <p>All tickets for this event have been taken.</p>
        <a class="btn btn--primary" href="events.html">Browse other events</a>
      </div>`;
    return;
  }

  if (!event) {
    document.title = "Event not found — X-Productions";
    root.innerHTML = `
      <div class="not-found">
        <h1>Choose an event first</h1>
        <p>Pick an event to see its tickets.</p>
        <a class="btn btn--primary" href="events.html">Browse events</a>
      </div>`;
    return;
  }

  /* Quantities per tier id. Reuse the draft if it is for this same event. */
  const quantities = {};
  event.tiers.forEach((t, i) => {
    quantities[t.id] = draft && draft.eventId === event.id ? (draft.quantities[t.id] || 0) : (i === 0 ? 1 : 0);
  });

  const maxFor = (tier) => Math.min(MAX_PER_TIER, tier.remaining);
  const totalTickets = () => Object.values(quantities).reduce((a, b) => a + b, 0);
  const items = () => XP.store.buildItems(event, quantities);

  /* Event names are stored HTML-escaped; convert back to plain text for the tab title */
  document.title = `Tickets for ${new DOMParser().parseFromString(event.name, "text/html").documentElement.textContent} — X-Productions`;

  root.innerHTML = `
    <nav class="crumb" aria-label="Breadcrumb">
      <a href="events.html">Events</a><span aria-hidden="true">/</span>
      <a href="event-details.html?id=${encodeURIComponent(event.id)}">${event.name}</a><span aria-hidden="true">/</span><span>Tickets</span>
    </nav>
    <h1 class="booking__title">Your tickets</h1>
    <ol class="steps" aria-label="Booking steps">
      <li class="steps__item steps__item--on">Your tickets</li><li class="steps__item">Checkout</li><li class="steps__item">All set</li>
    </ol>

    <div class="booking">
      <section aria-labelledby="tiersTitle">
        <h2 class="sr-only" id="tiersTitle">Choose ticket categories</h2>
        <div id="tierList">
          ${event.tiers.map((t) => `
            <div class="tq" data-tier="${t.id}">
              <div class="tq__info">
                <div class="tq__name">${t.name}</div>
                <div class="tq__note">${t.note}</div>
                <div class="tq__left${t.low ? " tq__left--low" : ""}">${t.low ? `Only ${t.remaining} left` : `${t.remaining.toLocaleString("en-US")} left`}</div>
              </div>
              <div class="tq__price">${XP.formatPrice(t.price)}</div>
              <div class="qty" role="group" aria-label="Quantity for ${t.name}">
                <button type="button" data-step="-1" aria-label="Fewer ${t.name} tickets">−</button>
                <output aria-live="polite">0</output>
                <button type="button" data-step="1" aria-label="More ${t.name} tickets">+</button>
              </div>
            </div>`).join("")}
        </div>
        <p class="booking__limit">Up to ${MAX_TOTAL} tickets per booking.</p>
      </section>

      <aside class="summary card" aria-label="Booking summary">
        <div class="summary__event">
          <div class="poster summary__thumb">${event.image ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, 300)}" alt="">` : ""}</div>
          <div>
            <div class="summary__name">${event.name}</div>
            <div class="summary__meta">${XP.formatDate(event)} · ${event.time}</div>
            <div class="summary__meta">${event.venue}</div>
          </div>
        </div>
        <div class="summary__lines" id="summaryLines"></div>
        <div class="summary__total"><span>Total</span><b id="summaryTotal">EGP 0</b></div>
        <button class="btn btn--primary btn--lg" id="continueBtn" type="button">Continue to checkout</button>
        <p class="summary__note" id="summaryNote"></p>
      </aside>
    </div>`;
  XPUI.watchImages(root);

  const continueBtn = document.getElementById("continueBtn");
  const note = document.getElementById("summaryNote");

  function update() {
    // Quantity steppers
    root.querySelectorAll(".tq").forEach((row) => {
      const tier = event.tiers.find((t) => t.id === row.dataset.tier);
      const qty = quantities[tier.id];
      row.classList.toggle("tq--has", qty > 0);
      row.querySelector("output").textContent = qty;
      row.querySelector('[data-step="-1"]').disabled = qty === 0;
      row.querySelector('[data-step="1"]').disabled = qty >= maxFor(tier) || totalTickets() >= MAX_TOTAL;
    });

    // Summary
    const list = items();
    document.getElementById("summaryLines").innerHTML = list.length
      ? list.map((i) => `<div class="summary__line"><span>${i.qty} × ${i.name}</span><b>${XP.formatPrice(i.price * i.qty)}</b></div>`).join("")
      : `<p class="summary__empty">No tickets selected yet.</p>`;
    document.getElementById("summaryTotal").textContent = XP.formatPrice(XP.store.itemsTotal(list));
    continueBtn.disabled = list.length === 0;
    note.textContent = totalTickets() >= MAX_TOTAL ? `You've reached the limit of ${MAX_TOTAL} tickets.` : "";
  }

  document.getElementById("tierList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-step]");
    if (!btn || btn.disabled) return;
    const tier = event.tiers.find((t) => t.id === btn.closest(".tq").dataset.tier);
    quantities[tier.id] = Math.max(0, Math.min(maxFor(tier), quantities[tier.id] + Number(btn.dataset.step)));
    update();
  });

  continueBtn.addEventListener("click", () => {
    if (totalTickets() === 0) return;
    XP.store.setDraft({ eventId: event.id, quantities: Object.assign({}, quantities) });
    // Checkout needs to know who is booking, so ask guests to log in first and bring them back
    location.href = XP.store.getUser() ? "checkout.html" : "login.html?next=checkout.html";
  });

  update();
})();

/* =====================================================================
   MY TICKETS  (pages/my-tickets.html)
   Shows the signed-in customer's demo bookings. Status rules:
     approved → shows the (demo) QR ticket
     pending  → NO usable QR, waiting for admin approval
     rejected → no QR, with the reason
   ===================================================================== */
(function () {
  "use strict";

  const root = document.getElementById("myTickets");
  if (!root) return;

  const STATUS = {
    approved: { label: "Approved", chip: "chip--ok" },
    pending: { label: "Pending Approval", chip: "chip--warn" },
    rejected: { label: "Rejected", chip: "chip--bad" }
  };
  let filter = "all";

  const user = XP.store.getUser();
  if (!user) {
    root.innerHTML = `
      <div class="gate">
        <h2>Log in to see your tickets</h2>
        <p>Your bookings and tickets appear here once you're signed in.</p>
        <a class="btn btn--primary btn--lg" href="login.html?next=my-tickets.html">Log in</a>
        <p>No account yet? <a class="gate__link" href="register.html">Create one</a></p>
      </div>`;
    return;
  }

  function ticketHtml(b) {
    const event = XP.getEvent(b.eventId);        // null when an admin has deleted the event
    const st = STATUS[b.status] || STATUS.pending;
    const count = XP.store.ticketCount(b.items);
    /* A deleted event keeps its booking visible: use the saved name, or build one from the event id */
    const eventName = event ? event.name
      : b.eventName || b.eventId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    let side, message = "";
    if (b.status === "approved") {
      side = `<div class="ticket__qr"><div class="ticket__qr-box">${XPUI.qrSvg(b.id)}</div><div><b class="ticket__code">${b.id}</b><br>Demo QR · show at the gate</div></div>`;
    } else if (b.status === "rejected") {
      side = `<div class="ticket__qr"><div class="ticket__locked">${XPUI.iconSvg("lock")}</div><div>No ticket issued</div></div>`;
      message = `<p class="ticket__msg ticket__msg--bad">Payment not approved${b.note ? `: ${b.note}` : ""}. You can book again with a clearer payment screenshot.</p>`;
    } else {
      side = `<div class="ticket__qr"><div class="ticket__locked">${XPUI.iconSvg("lock")}</div><div>Your QR ticket appears here after approval</div></div>`;
      message = `<p class="ticket__msg">We're reviewing your payment proof. This is not a valid ticket yet.</p>`;
    }

    return `
      <article class="ticket" aria-label="${eventName}, ${st.label}">
        <div class="poster ticket__poster">
          ${event && event.image ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, 500)}" alt="">` : ""}
          <span class="ticket__status"><span class="chip ${st.chip}">${st.label}</span></span>
        </div>
        <div class="ticket__main">
          <h2 class="ticket__name">${event ? `<a href="event-details.html?id=${encodeURIComponent(event.id)}">${eventName}</a>` : eventName}</h2>
          <div class="ticket__rows">
            ${event
              ? `<span>${XP.formatDate(event)} · ${event.time}</span><span>${event.venue}</span>`
              : `<span>Event details are no longer available</span>`}
            <span>${b.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</span>
            <span>Booking <b class="ticket__code">${b.id}</b></span>
          </div>
          <div class="ticket__foot"><span>${count} ticket${count === 1 ? "" : "s"}</span><b>${XP.formatPrice(b.total)}</b></div>
          ${message}
          ${event ? "" : `<p class="ticket__msg">This event has been removed from the site.</p>`}
        </div>
        ${side}
      </article>`;
  }

  function render() {
    const all = XP.store.bookingsFor(user.email);
    const list = all.filter((b) => filter === "all" || b.status === filter);
    const counts = (s) => (s === "all" ? all.length : all.filter((b) => b.status === s).length);

    root.innerHTML = `
      <div class="tickets-head">
        <div><h1>My Tickets</h1><p>${user.name} · ${user.email}</p></div>
        <button class="btn btn--ghost btn--sm" id="signOut" type="button">Sign out</button>
      </div>
      <div class="ticket-filters" role="group" aria-label="Filter by status">
        ${[["all", "All"], ["approved", "Approved"], ["pending", "Pending Approval"], ["rejected", "Rejected"]].map(([k, l]) =>
          `<button type="button" data-filter="${k}" aria-pressed="${k === filter}">${l} (${counts(k)})</button>`).join("")}
      </div>
      ${list.length ? list.map(ticketHtml).join("") : `
        <div class="gate">
          <h2>${all.length ? "Nothing here" : "No tickets yet"}</h2>
          <p>${all.length ? "No bookings with this status." : "Book an event and it will appear here."}</p>
          <a class="btn btn--primary" href="events.html">Browse events</a>
        </div>`}
      <p class="booking__limit">Demo data: tickets, statuses and QR pictures are simulated. The QR is decorative, not scannable.</p>`;

    XPUI.watchImages(root);
    root.querySelector(".ticket-filters").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (btn) { filter = btn.dataset.filter; render(); }
    });
    document.getElementById("signOut").addEventListener("click", () => {
      XP.store.clearUser();
      location.href = "../index.html";
    });
  }

  render();
})();
