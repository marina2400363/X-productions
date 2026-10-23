/* =====================================================================
   X-PRODUCTIONS — ADMIN SHELL SCRIPT
   Shared by EVERY admin page: builds the sidebar and top bar, shows the
   "demo preview" lock when nobody is in admin preview mode, and offers
   a small toast message helper. Load order on admin pages:
     data.js → main.js → admin.js → (page script, e.g. payment.js)
   Member 5 extends this file with the dashboard, event management and
   QR scanner logic. Keep the shell (everything above "PAGE LOGIC") as is.
   ===================================================================== */

const XPAdmin = (function () {
  "use strict";

  const body = document.body;
  const ROOT = body.dataset.root || "../";
  const PAGE = body.dataset.page || "";

  const LINKS = [
    { group: "Overview" },
    { key: "dashboard", label: "Dashboard", icon: "grid", href: "dashboard.html" },
    { group: "Manage" },
    { key: "events", label: "Events", icon: "calendar", href: "event.html" },
    { key: "bookings", label: "Users & Bookings", icon: "users", href: "bookings.html" },
    { key: "payments", label: "Payments", icon: "card", href: "payments.html", badge: true },
    { group: "Entry" },
    { key: "qr-scanner", label: "QR Scanner", icon: "qr", href: "qr-scanner.html" }
  ];

  const LOGO_MARK = '<svg width="18" height="18" viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M14 10 86 90" stroke="#F5F3EF" stroke-width="18" stroke-linecap="round"/><path d="M86 10 14 90" stroke="#C6F135" stroke-width="18" stroke-linecap="round"/></svg>';

  function pendingCount() {
    return XP.store.getBookings().filter((b) => b.status === "pending").length;
  }

  function sidebarHtml(user) {
    const nav = LINKS.map((l) => l.group
      ? `<div class="admin__label">${l.group}</div>`
      : `<a class="admin__link" href="${l.href}"${l.key === PAGE ? ' aria-current="page"' : ""}><span data-icon="${l.icon}"></span>${l.label}${l.badge ? `<span class="admin__badge" id="adminBadge">${pendingCount()}</span>` : ""}</a>`).join("");
    return `
      <a class="brand admin__brand" href="dashboard.html"><span class="brand__mark">${LOGO_MARK}</span><span class="brand__name">X-Admin</span></a>
      <nav aria-label="Admin">${nav}</nav>
      <div class="admin__foot">
        <a class="admin__link" href="${ROOT}index.html"><span data-icon="external"></span>View customer site</a>
        <div class="admin__user"><b>${user ? user.name : "Admin"}</b><small>Demo preview · not a real login</small></div>
      </div>`;
  }

  /* ---------- build the shell ---------- */
  const user = XP.store.getUser();
  const isAdmin = !!user && user.role === "admin";
  const sidebar = document.getElementById("adminSidebar");
  const topbar = document.getElementById("adminTopbar");
  const main = document.getElementById("main");

  if (sidebar) sidebar.innerHTML = sidebarHtml(user);
  if (topbar) {
    topbar.innerHTML = `
      <button class="icon-btn admin__burger" id="adminBurger" type="button" aria-label="Open menu" aria-controls="adminSidebar"><span data-icon="menu"></span></button>
      <span class="chip chip--warn">Phase 1 demo data</span>`;
  }

  /* Nobody is in admin preview mode → lock the page (this is a demo shortcut, not real security) */
  if (!isAdmin && main) {
    main.innerHTML = `
      <div class="empty-box">
        <b>Admin Portal preview is locked</b>
        <p>This portal uses simulated data. Open the login page and use "Preview Admin Portal" to review it.</p>
        <a class="btn btn--primary" href="${ROOT}pages/login.html">Go to login</a>
      </div>`;
  }

  /* Mobile sidebar */
  const burger = document.getElementById("adminBurger");
  const scrim = document.getElementById("adminScrim");
  if (burger) {
    burger.addEventListener("click", () => body.classList.toggle("admin-nav-open"));
    if (scrim) scrim.addEventListener("click", () => body.classList.remove("admin-nav-open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") body.classList.remove("admin-nav-open"); });
  }
  XPUI.drawIcons(document);

  /* ---------- helpers for page scripts ---------- */
  let toastTimer;
  function toast(message) {
    let box = document.getElementById("adminToast");
    if (!box) {
      box = document.createElement("div");
      box.id = "adminToast"; box.className = "toast";
      box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite");
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove("toast--show"), 3500);
  }

  function refreshBadge() {
    const badge = document.getElementById("adminBadge");
    if (badge) badge.textContent = pendingCount();
  }

  /* =====================================================================
     PAGE LOGIC — Member 5: dashboard, event management, QR scanner
     Each block only runs when its page's elements exist.
     (Admin → Bookings and Payments live in js/payment.js — Member 4.)
     ===================================================================== */

  const el = (id) => document.getElementById(id);
  /* Admin-typed text is shown with innerHTML on customer pages, so it is stored with < > & " ' escaped */
  const clean = (s) => String(s).trim().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const unclean = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const slug = (s) => unclean(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
  const statusChip = (key) => { const s = XP.STATUS[key] || XP.STATUS.pending; return `<span class="chip ${s.chip}">${s.label}</span>`; };

  /* ---------------------------------------------------------------
     DASHBOARD
     --------------------------------------------------------------- */
  if (isAdmin && el("stats")) {
    const bookings = XP.store.getBookings();
    const approved = bookings.filter((b) => b.status === "approved");
    const pending = bookings.filter((b) => b.status === "pending");
    const rejected = bookings.filter((b) => b.status === "rejected");
    const ticketsSold = approved.reduce((n, b) => n + XP.store.ticketCount(b.items), 0);
    const revenue = approved.reduce((n, b) => n + b.total, 0);
    const hidden = XP.EVENTS.filter((e) => XP.statusOf(e) === "draft").length;

    const stat = (label, value, sub, href) => `
      <${href ? `a href="${href}"` : "div"} class="stat">
        <span class="stat__label">${label}</span><b class="stat__value">${value}</b><span class="stat__sub">${sub}</span>
      </${href ? "a" : "div"}>`;
    el("stats").innerHTML =
      stat("Total events", XP.EVENTS.length, hidden ? `${hidden} hidden from customers` : "All visible", "event.html") +
      stat("Total bookings", bookings.length, `${approved.length} approved`, "bookings.html") +
      stat("Tickets sold", ticketsSold.toLocaleString("en-US"), "From approved bookings") +
      stat("Revenue", XP.formatPrice(revenue), "Approved payments · demo") +
      stat("Pending approvals", pending.length, pending.length ? "Review payments →" : "Nothing waiting", "payments.html");

    /* Revenue by event: horizontal bars drawn with plain HTML/CSS */
    const byEvent = {};
    approved.forEach((b) => { byEvent[b.eventId] = (byEvent[b.eventId] || 0) + b.total; });
    const rows = Object.entries(byEvent).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = rows.length ? rows[0][1] : 1;
    el("revenueChart").innerHTML = rows.length ? rows.map(([id, value], i) => {
      const event = XP.getEvent(id);
      return `<div class="bar">
        <div class="bar__label"><span>${event ? event.name : id}</span><b>${XP.formatPrice(value)}</b></div>
        <div class="bar__track"><div class="bar__fill${i === 0 ? " bar__fill--top" : ""}" style="width:${Math.max(3, (value / max) * 100)}%"></div></div>
      </div>`;
    }).join("") : `<p class="muted">No approved bookings yet.</p>`;

    /* Bookings by status: one stacked bar + legend */
    const parts = [["approved", approved.length], ["pending", pending.length], ["rejected", rejected.length]];
    const total = bookings.length || 1;
    /* colours come from CSS classes; only the data-driven width stays inline */
    el("statusBar").innerHTML = parts.map(([k, n]) => n ? `<span class="segbar__${k}" style="width:${(n / total) * 100}%"></span>` : "").join("");
    el("statusLegend").innerHTML = parts.map(([k, n]) =>
      `<li><i class="legend__${k}"></i>${XP.STATUS[k].label}<b>${n}</b></li>`).join("");

    /* Latest bookings */
    el("latestRows").innerHTML = bookings.slice(0, 5).map((b) => {
      const event = XP.getEvent(b.eventId);
      return `<tr><td class="mono">${b.id}</td><td>${b.customer.name}</td><td>${event ? event.name : b.eventId}</td><td>${XP.formatPrice(b.total)}</td><td>${statusChip(b.status)}</td></tr>`;
    }).join("");
  }

  /* ---------------------------------------------------------------
     EVENT MANAGEMENT
     --------------------------------------------------------------- */
  if (isAdmin && el("eventRows")) {
    const rowsBox = el("eventRows");
    const dialog = el("eventDialog");
    const form = el("eventForm");
    const tierRows = el("tierRows");
    const errorBox = el("eventFormError");
    const CATEGORY_LABEL = { concert: "Concert", festival: "Festival", prom: "Prom", show: "Show", family: "Family", expo: "Expo" };
    let editingId = null;       // null = adding a new event
    let deletingId = null;

    XP.CATEGORIES.forEach((c) => el("fCategory").insertAdjacentHTML("beforeend", `<option value="${c.key}">${CATEGORY_LABEL[c.key]}</option>`));

    /* "8:00 PM" <-> "20:00" (the time input uses 24-hour values) */
    function to24(text) {
      const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(text || "");
      if (!m) return "20:00";
      let h = Number(m[1]) % 12; if (m[3].toUpperCase() === "PM") h += 12;
      return String(h).padStart(2, "0") + ":" + m[2];
    }
    function to12(value) {
      const [h, m] = value.split(":").map(Number);
      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    }

    const availabilityOptions = (current) => [["on-sale", "On sale"], ["sold-out", "Sold out"], ["draft", "Hidden (draft)"]]
      .map(([v, l]) => `<option value="${v}"${v === current ? " selected" : ""}>${l}</option>`).join("");

    function renderTable() {
      rowsBox.innerHTML = XP.EVENTS.map((e) => {
        const left = e.tiers.reduce((n, t) => n + t.remaining, 0);
        return `<tr data-id="${e.id}">
          <td><b>${e.name}</b><br><small class="muted">${e.categoryLabel} · ${e.venue}</small></td>
          <td>${XP.formatDate(e)}<br><small class="muted">${e.time}</small></td>
          <td>${e.tiers.length} categor${e.tiers.length === 1 ? "y" : "ies"} · from ${XP.formatPrice(XP.minPrice(e))}<br><small class="muted">${left.toLocaleString("en-US")} left</small></td>
          <td><label class="sr-only" for="av-${e.id}">Availability of ${e.name}</label>
            <select class="field__input field__input--sm" id="av-${e.id}" data-availability>${availabilityOptions(XP.statusOf(e))}</select></td>
          <td class="row-actions"><button class="btn btn--ghost btn--sm" type="button" data-edit>Edit</button><button class="btn btn--bad btn--sm" type="button" data-delete>Delete</button></td>
        </tr>`;
      }).join("") || `<tr><td colspan="5" class="table__empty">No events yet. Add your first event.</td></tr>`;
    }

    /* ----- tier rows inside the form ----- */
    function addTierRow(tier) {
      const t = tier || { name: "", price: "", remaining: "", note: "" };
      const row = document.createElement("div");
      row.className = "tier-row";
      if (t.id) row.dataset.tierId = t.id;
      row.innerHTML = `
        <input class="field__input" aria-label="Category name" placeholder="Standard" value="${unclean(t.name).replace(/"/g, "&quot;")}" data-f="name">
        <input class="field__input" aria-label="Price in EGP" type="number" min="1" step="1" placeholder="650" value="${t.price}" data-f="price">
        <input class="field__input" aria-label="Tickets available" type="number" min="0" step="1" placeholder="200" value="${t.remaining}" data-f="remaining">
        <input class="field__input" aria-label="Note" placeholder="Reserved seating" value="${unclean(t.note || "").replace(/"/g, "&quot;")}" data-f="note">
        <button class="icon-btn" type="button" aria-label="Remove category" data-remove-tier><span data-icon="close"></span></button>`;
      tierRows.appendChild(row);
      XPUI.drawIcons(row);
    }
    el("addTier").addEventListener("click", () => addTierRow());
    tierRows.addEventListener("click", (e) => {
      if (!e.target.closest("[data-remove-tier]")) return;
      if (tierRows.children.length > 1) e.target.closest(".tier-row").remove();
      else errorBox.textContent = "An event needs at least one ticket category.";
    });

    function openForm(event) {
      editingId = event ? event.id : null;
      errorBox.textContent = "";
      el("eventDialogTitle").textContent = event ? "Edit event" : "Add event";
      form.reset();
      tierRows.innerHTML = "";
      if (event) {
        el("fName").value = unclean(event.name);
        el("fArtist").value = unclean(event.artist || "");
        el("fCategory").value = event.category;
        el("fDate").value = event.date;
        el("fTime").value = to24(event.time);
        el("fCity").value = unclean(event.city);
        el("fVenue").value = unclean(event.venue);
        el("fDescription").value = unclean((event.description || []).join("\n\n"));
        el("fImage").value = unclean(event.image || "");
        el("fStatus").value = XP.statusOf(event);
        event.tiers.forEach(addTierRow);
      } else {
        addTierRow({ name: "Standard", price: "", remaining: "", note: "" });
      }
      dialog.showModal();
      el("fName").focus();
    }

    /* aria-invalid marks the field the error message is about; it clears as soon as the user edits it */
    form.addEventListener("input", (e) => e.target.removeAttribute("aria-invalid"));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
      const f = form.elements;
      const name = f.name.value.trim();
      const venue = f.venue.value.trim();
      if (!name) return fail("Please enter the event name.", f.name);
      if (!f.date.value) return fail("Please choose the event date.", f.date);
      if (!venue) return fail("Please enter the venue.", f.venue);

      const tiers = [];
      const usedIds = new Set();
      for (const row of tierRows.children) {
        const get = (k) => row.querySelector(`[data-f="${k}"]`);
        const tierName = get("name").value.trim();
        const price = Number(get("price").value);
        const remaining = Number(get("remaining").value);
        if (!tierName) return fail("Every ticket category needs a name.", get("name"));
        if (!Number.isInteger(price) || price < 1) return fail(`"${tierName}": enter a price of at least 1 EGP (whole number).`, get("price"));
        if (!Number.isInteger(remaining) || remaining < 0) return fail(`"${tierName}": tickets available must be 0 or more (whole number).`, get("remaining"));
        let id = row.dataset.tierId || slug(tierName);
        while (usedIds.has(id)) id += "-2";
        usedIds.add(id);
        tiers.push({ id, name: clean(tierName), price, remaining, note: clean(get("note").value), low: remaining <= 30 });
      }
      if (!tiers.length) return fail("Add at least one ticket category.");

      const existing = editingId ? XP.getEvent(editingId) : null;
      let id = editingId;
      if (!id) {                                                 // new event: build a unique id from the name
        id = slug(name);
        while (XP.getEvent(id)) id += "-2";
      }
      const paragraphs = f.description.value.split(/\n\s*\n/).map((p) => clean(p)).filter(Boolean);
      const saved = Object.assign({}, existing, {
        id, name: clean(name), artist: clean(f.artist.value),
        category: f.category.value, categoryLabel: CATEGORY_LABEL[f.category.value],
        city: clean(f.city.value) || "Cairo", date: f.date.value, time: to12(f.time.value),
        venue: clean(venue), image: clean(f.image.value),
        description: paragraphs.length ? paragraphs : ["More details coming soon."],
        status: f.status.value, tiers
      });
      /* keep these for events created here, preserve them when editing */
      saved.doorsInfo = existing ? existing.doorsInfo : "";
      saved.venueNote = existing ? existing.venueNote : "";
      saved.program = existing ? existing.program : [];

      const list = XP.EVENTS.slice();
      const at = list.findIndex((x) => x.id === id);
      if (at >= 0) list[at] = saved; else list.push(saved);
      XP.saveEvents(list);
      dialog.close();
      renderTable();
      toast(existing ? `"${unclean(saved.name)}" updated.` : `"${unclean(saved.name)}" added.`);
    });
    function fail(message, field) {
      errorBox.textContent = message;
      if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
    }

    el("eventCancel").addEventListener("click", () => dialog.close());
    el("addEvent").addEventListener("click", () => openForm(null));

    /* ----- table actions: edit, delete, availability ----- */
    rowsBox.addEventListener("click", (e) => {
      const row = e.target.closest("tr[data-id]");
      if (!row) return;
      const event = XP.getEvent(row.dataset.id);
      if (e.target.closest("[data-edit]")) openForm(event);
      if (e.target.closest("[data-delete]")) {
        deletingId = event.id;
        const n = XP.store.getBookings().filter((b) => b.eventId === event.id).length;
        el("deleteText").textContent = `"${unclean(event.name)}" will be removed from the customer site.` +
          (n ? ` It has ${n} booking${n === 1 ? "" : "s"}, which stay in the admin list without event details.` : "");
        el("deleteDialog").showModal();
      }
    });
    rowsBox.addEventListener("change", (e) => {
      const select = e.target.closest("[data-availability]");
      if (!select) return;
      const id = select.closest("tr").dataset.id;
      XP.saveEvents(XP.EVENTS.map((ev) => (ev.id === id ? Object.assign({}, ev, { status: select.value }) : ev)));
      toast(`Availability updated: ${select.options[select.selectedIndex].text}.`);
    });
    el("deleteCancel").addEventListener("click", () => el("deleteDialog").close());
    el("deleteForm").addEventListener("submit", () => {
      XP.saveEvents(XP.EVENTS.filter((ev) => ev.id !== deletingId));
      renderTable();
      toast("Event deleted.");
    });
    el("resetEvents").addEventListener("click", () => {
      if (window.confirm("Replace all events with the original sample list? Your edits will be lost.")) {
        XP.resetEvents(); renderTable(); toast("Events reset to the original list.");
      }
    });

    renderTable();
  }

  /* ---------------------------------------------------------------
     QR SCANNER (simulated — no camera)
     A booking's code is valid once, and only if its payment was approved.
     --------------------------------------------------------------- */
  if (isAdmin && el("scanForm")) {
    const input = el("codeInput");
    const resultBox = el("scanResult");
    const historyBox = el("scanHistory");
    const history = [];

    function verify(raw) {
      const code = raw.trim().toUpperCase();
      if (!code) return { type: "invalid", title: "No code entered", detail: "Type or paste a ticket code first." };
      const booking = XP.store.getBookings().find((b) => b.id === code);
      if (!booking) return { type: "invalid", code, title: "Invalid ticket", detail: "This code doesn't match any booking." };
      const event = XP.getEvent(booking.eventId);
      const info = { code, booking, event };
      if (booking.status !== "approved") {
        return Object.assign(info, { type: "invalid", title: "Invalid ticket",
          detail: booking.status === "pending" ? "Payment is still pending approval — no valid ticket yet." : "Payment was rejected — no ticket was issued." });
      }
      if (booking.checkedInAt) {
        return Object.assign(info, { type: "used", title: "Already used",
          detail: `Checked in on ${new Date(booking.checkedInAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.` });
      }
      XP.store.updateBooking(booking.id, { checkedInAt: new Date().toISOString() });    // first scan: check in
      return Object.assign(info, { type: "valid", title: "Valid ticket", detail: "Guest checked in. Let them through." });
    }

    function showResult(r) {
      const icon = { valid: "check", used: "clock", invalid: "close" }[r.type];
      const who = r.booking ? `
        <dl class="result__list">
          <div><dt>Booking</dt><dd class="mono">${r.booking.id}</dd></div>
          <div><dt>Guest</dt><dd>${r.booking.customer.name}</dd></div>
          <div><dt>Event</dt><dd>${r.event ? r.event.name : r.booking.eventId}</dd></div>
          <div><dt>Admits</dt><dd>${XP.store.ticketCount(r.booking.items)} · ${r.booking.items.map((i) => `${i.qty} × ${i.name}`).join(", ")}</dd></div>
        </dl>` : "";
      resultBox.className = `result result--${r.type}`;
      resultBox.innerHTML = `<div class="result__icon">${XPUI.iconSvg(icon)}</div><h2 class="result__title">${r.title}</h2><p>${r.detail}</p>${who}<p class="result__demo">Simulated result</p>`;
      history.unshift(`<li><span class="mono">${r.code || "—"}</span><span class="chip ${{ valid: "chip--ok", used: "chip--warn", invalid: "chip--bad" }[r.type]}">${r.title}</span></li>`);
      historyBox.innerHTML = history.slice(0, 8).join("");
    }

    el("scanForm").addEventListener("submit", (e) => {
      e.preventDefault();
      showResult(verify(input.value));
      input.select();
    });

    /* Sample buttons fill the field with a suitable code, then scan it */
    el("scanForm").parentElement.querySelector(".samples").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sample]");
      if (!btn) return;
      const all = XP.store.getBookings();
      const pick = {
        valid: () => all.find((b) => b.status === "approved" && !b.checkedInAt),
        used: () => all.find((b) => b.status === "approved" && b.checkedInAt),
        pending: () => all.find((b) => b.status === "pending")
      }[btn.dataset.sample];
      const booking = pick ? pick() : null;
      if (btn.dataset.sample !== "fake" && !booking) { toast("No booking of that kind right now — approve a payment first."); return; }
      input.value = booking ? booking.id : "XP-FAKE-0000";
      showResult(verify(input.value));
    });
  }

  return { toast, refreshBadge, isAdmin };
})();
