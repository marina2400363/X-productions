/* =====================================================================
   X-PRODUCTIONS — PAYMENTS SCRIPT  (Member 4)
   Customer side:  checkout.html (InstaPay + screenshot) and confirmation.html
   Admin side:     admin/payments.html (review) and admin/bookings.html (list)
   Each section only runs if its page elements exist.
   Needs data.js, main.js (and admin.js on admin pages).

   PHASE 1 HONESTY: nothing here talks to a bank or server. The payment
   link opens externally; the screenshot is only previewed in the browser
   (never stored — only its file name is kept); approve/reject just change
   a status in this browser. No real transaction is verified.
   ===================================================================== */

/* ---------------------------------------------------------------------
   CONFIGURATION — replace with your real InstaPay payment link.
   It is a placeholder: no payment URL has been invented. Until it starts
   with "https://", the button shows a message instead of opening a page.
   --------------------------------------------------------------------- */
const INSTAPAY_PAYMENT_URL = "YOUR_INSTAPAY_PAYMENT_URL_HERE";

(function () {
  "use strict";

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const el = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fileSize = (bytes) => (bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB");
  const ticketsText = (items) => items.map((i) => `${i.qty} × ${i.name}`).join(", ");
  /* Event names are stored with < > & " ' escaped (safe for innerHTML). The tab title needs plain text. */
  const plainText = (s) => new DOMParser().parseFromString(String(s), "text/html").documentElement.textContent;
  const chip = (status) => { const s = XP.STATUS[status] || XP.STATUS.pending; return `<span class="chip ${s.chip}">${s.label}</span>`; };

  /* =====================  CHECKOUT  ===================== */
  const checkoutGrid = el("checkoutGrid");
  if (checkoutGrid) {
    const user = XP.store.getUser();
    const draft = XP.store.getDraft();
    const event = draft && XP.getEvent(draft.eventId);
    const items = event ? XP.store.buildItems(event, draft.quantities) : [];

    if (!user && items.length) {
      location.replace("login.html?next=checkout.html");
    } else if (!items.length) {
      el("checkoutEmpty").hidden = false;
    } else {
      const total = XP.store.itemsTotal(items);
      checkoutGrid.hidden = false;
      document.title = `Checkout — ${plainText(event.name)} — X-Productions`;

      /* Order summary */
      el("coEvent").innerHTML = `
        <div class="poster summary__thumb">${event.image ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, 300)}" alt="">` : ""}</div>
        <div><div class="summary__name">${event.name}</div>
        <div class="summary__meta">${XP.formatDate(event)} · ${event.time}</div>
        <div class="summary__meta">${event.venue}</div></div>`;
      el("coLines").innerHTML = items.map((i) => `<div class="summary__line"><span>${i.qty} × ${i.name}</span><b>${XP.formatPrice(i.price * i.qty)}</b></div>`).join("");
      el("coTotal").textContent = XP.formatPrice(total);
      el("payAmount").textContent = XP.formatPrice(total);
      el("coCustomer").textContent = `Booking for ${user.name} (${user.email})`;
      el("coEdit").href = `booking.html?id=${encodeURIComponent(event.id)}`;
      XPUI.drawIcons(checkoutGrid);
      XPUI.watchImages(checkoutGrid);

      /* Step 1: open the InstaPay payment link in a NEW tab */
      const payMsg = el("payMsg");
      el("payBtn").addEventListener("click", () => {
        payMsg.classList.remove("step__status--warn");
        if (/^https:\/\//i.test(INSTAPAY_PAYMENT_URL)) {
          window.open(INSTAPAY_PAYMENT_URL, "_blank", "noopener,noreferrer");
          payMsg.textContent = "Payment page opened in a new tab. When you're done, come back here and upload your screenshot below.";
        } else {
          payMsg.classList.add("step__status--warn");
          payMsg.textContent = "Preview mode: the InstaPay link isn't configured yet (set INSTAPAY_PAYMENT_URL in js/payment.js). You can still try the upload step below.";
        }
      });

      /* Step 2: choose / replace / remove the payment screenshot */
      const input = el("proofInput");
      const upload = el("upload");
      const preview = el("proofPreview");
      const errorBox = el("proofError");
      const submit = el("submitProof");
      let selected = null;
      let previewUrl = "";

      /* Show or clear the error text and mark the file input as invalid for assistive technology */
      function setProofError(message) {
        errorBox.textContent = message;
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }

      function clearFile() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = ""; selected = null;
        input.value = "";
        preview.hidden = true;
        upload.classList.remove("has-file");
        submit.disabled = true;
      }

      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) return;                       // user cancelled the file dialog: keep what we had
        setProofError("");
        if (!ALLOWED_TYPES.includes(file.type)) {
          clearFile(); setProofError("Please choose an image file (PNG, JPG or WebP)."); return;
        }
        if (file.size > MAX_FILE_BYTES) {
          clearFile(); setProofError("That image is larger than 5 MB. Please choose a smaller screenshot."); return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        selected = file;
        previewUrl = URL.createObjectURL(file);  // lives only in this page; nothing is saved
        el("proofImg").src = previewUrl;
        el("proofName").textContent = file.name;
        el("proofSize").textContent = fileSize(file.size);
        preview.hidden = false;
        upload.classList.add("has-file");
        submit.disabled = false;
      });
      el("proofRemove").addEventListener("click", () => { setProofError(""); clearFile(); });

      /* Submit: create a demo booking that waits for admin approval */
      let submitting = false;                    // guards against a double click creating two bookings
      submit.addEventListener("click", () => {
        if (submitting) return;
        if (!selected) { setProofError("Please choose your payment screenshot first."); return; }
        submitting = true;
        submit.disabled = true;
        const booking = XP.store.addBooking({
          eventId: event.id,
          eventName: event.name,                 // kept so My Tickets can still name the event if it is later deleted
          customer: { name: user.name, email: user.email },
          items, total,
          status: "pending",                     // Pending Approval — an admin must review it
          proofFileName: selected.name           // only the NAME is kept, never the image
        });
        XP.store.setLastBookingId(booking.id);
        XP.store.clearDraft();
        location.href = "confirmation.html";
      });
    }
  }

  /* =====================  CONFIRMATION  ===================== */
  const confirmBox = el("confirmation");
  if (confirmBox) {
    const booking = XP.store.getBookings().find((b) => b.id === XP.store.getLastBookingId());
    const event = booking && XP.getEvent(booking.eventId);

    if (!event) {
      confirmBox.innerHTML = `
        <div class="confirm__inner">
          <h1>Nothing to confirm</h1>
          <p class="confirm__text">We couldn't find a recent booking.</p>
          <div class="confirm__actions confirm__actions--spaced"><a class="btn btn--primary btn--lg" href="events.html">Browse events</a></div>
        </div>`;
    } else {
      const count = XP.store.ticketCount(booking.items);
      confirmBox.innerHTML = `
        <div class="confirm__inner">
          <div class="confirm__icon">${XPUI.iconSvg("check")}</div>
          <h1>You're All Set!</h1>
          <p class="confirm__text">We've received your payment proof. Your booking is waiting for approval — you'll see it in My Tickets once it's reviewed.</p>
          <div class="card confirm__card">
            <div class="poster confirm__thumb">${event.image ? `<img class="poster__img" data-fallback src="${XP.imageUrl(event.image, 300)}" alt="">` : ""}</div>
            <div>
              <div class="confirm__name">${event.name}</div>
              <div class="confirm__rows">
                <span>${XP.formatDate(event)} · ${event.time}</span>
                <span>${count} ticket${count === 1 ? "" : "s"} · <b>${XP.formatPrice(booking.total)}</b></span>
                <span>Booking <b>${booking.id}</b></span>
                <span class="confirm__status">${chip("pending")}</span>
              </div>
            </div>
          </div>
          <div class="confirm__actions">
            <a class="btn btn--primary btn--lg" href="my-tickets.html">View My Tickets</a>
            <a class="btn btn--ghost btn--lg" href="events.html">Browse More Events</a>
          </div>
        </div>`;
      XPUI.watchImages(confirmBox);
    }
  }

  /* =====================  ADMIN: PAYMENTS  ===================== */
  const paymentList = el("paymentList");
  if (paymentList) {
    const reviewedList = el("reviewedList");
    const dialog = el("rejectDialog");
    let rejectingId = null;

    /* A drawn stand-in for the customer's screenshot. The real image is never stored in Phase 1. */
    function receiptHtml(b) {
      return `
        <div class="receipt" aria-hidden="true">
          <div class="receipt__brand">InstaPay</div>
          <div class="receipt__ok">${XPUI.iconSvg("check")} Transfer sent</div>
          <div class="receipt__amount">${XP.formatPrice(b.total)}</div>
          <div class="receipt__line"></div><div class="receipt__line receipt__line--short"></div>
        </div>
        <p class="receipt__cap">Illustration · file: <b>${escapeHtml(b.proofFileName || "no file")}</b></p>`;
    }

    function cardHtml(b) {
      const event = XP.getEvent(b.eventId);
      return `
        <article class="pay-card" data-id="${b.id}">
          <div class="pay-card__proof">${receiptHtml(b)}</div>
          <div class="pay-card__info">
            <div class="pay-card__code">${b.id}</div>
            <h3 class="pay-card__name">${escapeHtml(b.customer.name)}</h3>
            <div class="pay-card__sub">${escapeHtml(b.customer.email)}</div>
            <dl class="pay-card__list">
              <div><dt>Event</dt><dd>${event ? event.name : b.eventId}${event ? ` · ${XP.formatDate(event)}` : ""}</dd></div>
              <div><dt>Tickets</dt><dd>${ticketsText(b.items)}</dd></div>
              <div><dt>Total</dt><dd class="pay-card__total">${XP.formatPrice(b.total)}</dd></div>
            </dl>
          </div>
          <div class="pay-card__actions">
            <button class="btn btn--ok" type="button" data-action="approve">Approve</button>
            <button class="btn btn--bad" type="button" data-action="reject">Reject</button>
          </div>
        </article>`;
    }

    function render() {
      const all = XP.store.getBookings();
      const pending = all.filter((b) => b.status === "pending");
      const reviewed = all.filter((b) => b.status !== "pending");
      el("pendingCount").textContent = `${pending.length} pending`;
      paymentList.innerHTML = pending.length
        ? pending.map(cardHtml).join("")
        : `<div class="empty-box"><b>All caught up</b><p>There are no payments waiting for review.</p></div>`;
      reviewedList.innerHTML = reviewed.map((b) => {
        const event = XP.getEvent(b.eventId);
        return `<tr><td class="mono">${b.id}</td><td>${escapeHtml(b.customer.name)}</td><td>${event ? event.name : ""}</td><td>${XP.formatPrice(b.total)}</td><td>${chip(b.status)}${b.status === "rejected" && b.note ? ` <small class="muted">${escapeHtml(b.note)}</small>` : ""}</td></tr>`;
      }).join("");
      XPAdmin.refreshBadge();
    }

    paymentList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = btn.closest(".pay-card").dataset.id;
      if (btn.dataset.action === "approve") {
        XP.store.updateBooking(id, { status: "approved", note: "" });
        XPAdmin.toast(`${id} approved (demo — no real payment was verified).`);
        render();
      } else {
        rejectingId = id;
        el("rejectCode").textContent = id;
        dialog.showModal();
      }
    });

    el("rejectForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const reason = el("rejectReason").value;
      XP.store.updateBooking(rejectingId, { status: "rejected", note: reason });
      dialog.close();
      XPAdmin.toast(`${rejectingId} rejected: ${reason}.`);
      render();
    });
    el("rejectCancel").addEventListener("click", () => dialog.close());

    render();
  }

  /* =====================  ADMIN: BOOKINGS  ===================== */
  const bookingRows = el("bookingRows");
  if (bookingRows) {
    const search = el("bookingSearch");
    const statusFilter = el("statusFilter");
    const eventFilter = el("eventFilter");
    XP.EVENTS.forEach((e) => eventFilter.insertAdjacentHTML("beforeend", `<option value="${e.id}">${e.name}</option>`));

    function render() {
      const q = search.value.trim().toLowerCase();
      const list = XP.store.getBookings().filter((b) => {
        const event = XP.getEvent(b.eventId);
        const text = [b.id, b.customer.name, b.customer.email, event ? event.name : ""].join(" ").toLowerCase();
        return (!q || text.includes(q))
          && (!statusFilter.value || b.status === statusFilter.value)
          && (!eventFilter.value || b.eventId === eventFilter.value);
      });
      el("bookingCount").textContent = `${list.length} booking${list.length === 1 ? "" : "s"}`;
      bookingRows.innerHTML = list.length ? list.map((b) => {
        const event = XP.getEvent(b.eventId);
        return `<tr>
          <td class="mono">${b.id}</td>
          <td><b>${escapeHtml(b.customer.name)}</b><br><small class="muted">${escapeHtml(b.customer.email)}</small></td>
          <td>${event ? event.name : b.eventId}<br><small class="muted">${event ? XP.formatDate(event) : ""}</small></td>
          <td>${XP.store.ticketCount(b.items)}<br><small class="muted">${ticketsText(b.items)}</small></td>
          <td>${XP.formatPrice(b.total)}</td>
          <td>${chip(b.status)}</td>
          <td class="muted">${String(b.createdAt).slice(0, 10)}</td></tr>`;
      }).join("") : `<tr><td colspan="7" class="table__empty">No bookings match your filters.</td></tr>`;
    }
    [search, statusFilter, eventFilter].forEach((c) => c.addEventListener("input", render));
    render();
  }
})();
