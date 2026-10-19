/* =====================================================================
   X-PRODUCTIONS — SHARED UI SCRIPT  (Member 1 owns this file)
   Loaded on every page AFTER data.js. It:
     1. builds the navbar, mobile menu and footer (so they are written once),
     2. draws inline SVG icons for every  <span data-icon="name">,
     3. handles the see-through -> solid navbar on scroll,
     4. falls back gracefully when a photograph fails to load.

   How a page uses it:
     <body data-page="home" data-root="">          (root is "../" inside /pages and /admin)
       <div id="site-header"></div> ... <div id="site-footer"></div>
   ===================================================================== */

(function () {
  "use strict";

  const body = document.body;
  const ROOT = body.dataset.root || "";          // path prefix back to the project root
  const PAGE = body.dataset.page || "";          // which nav link is "current"

  /* ---------- 1. Icons (simple inline SVG, no icon library) ---------- */
  const ICONS = {
    "arrow-up-right": '<path d="M7 17 17 7M8 7h9v9"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    "chevron-right": '<path d="m9 6 6 6-6 6"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .6 3.5 2.3 3.5 5.2"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
    qr: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    upload: '<path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ticket: '<path d="M3.5 8.5a2 2 0 0 0 0 7v2.5h17v-2.5a2 2 0 0 1 0-7V6h-17z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.3 2.4 1.9 4 4.5 4.2"/>',
    facebook: '<path d="M14 21v-8h2.7l.5-3.3H14V7.6c0-1 .5-1.8 1.9-1.8h1.4V3.1C16.9 3 16 3 15 3c-2.5 0-4 1.5-4 4.2v2.5H8.3V13H11v8"/>'
  };

  function iconSvg(name) {
    const paths = ICONS[name];
    if (!paths) return "";
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  /* Replace every <span data-icon="..."> inside `scope` with its SVG. Also used by home.js after it renders cards. */
  function drawIcons(scope) {
    (scope || document).querySelectorAll("[data-icon]").forEach((el) => {
      el.innerHTML = iconSvg(el.dataset.icon);
      el.removeAttribute("data-icon");
    });
  }

  /* ---------- 2. Shared markup ---------- */
  const LOGO_MARK = '<svg width="18" height="18" viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M14 10 86 90" stroke="#F5F3EF" stroke-width="18" stroke-linecap="round"/><path d="M86 10 14 90" stroke="#C6F135" stroke-width="18" stroke-linecap="round"/></svg>';

  const NAV_LINKS = [
    { key: "home",    label: "Home",       href: ROOT + "index.html" },
    { key: "events",  label: "Events",     href: ROOT + "pages/events.html" },
    { key: "about",   label: "About",      href: ROOT + "index.html#about" },
    { key: "tickets", label: "My Tickets", href: ROOT + "pages/my-tickets.html" }
  ];

  function brandHtml() {
    return `<a class="brand" href="${ROOT}index.html" aria-label="X-Productions home">
      <span class="brand__mark">${LOGO_MARK}</span><span class="brand__name">X-Productions</span></a>`;
  }

  function headerHtml() {
    const links = NAV_LINKS.map((l) =>
      `<a class="navbar__link" href="${l.href}"${l.key === PAGE ? ' aria-current="page"' : ""}>${l.label}</a>`).join("");
    const drawerLinks = NAV_LINKS.concat([{ label: "Login / Register", href: ROOT + "pages/login.html" }]).map((l) =>
      `<a class="drawer__link" href="${l.href}">${l.label}<span data-icon="chevron-right"></span></a>`).join("");

    return `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="navbar" id="navbar">
        <div class="container navbar__inner">
          ${brandHtml()}
          <nav class="navbar__links" aria-label="Main">${links}</nav>
          <div class="navbar__actions">
            <a class="btn btn--primary btn--sm btn--pill navbar__cta" href="${ROOT}pages/events.html">Explore Events</a>
            <a class="icon-btn" href="${ROOT}pages/login.html" aria-label="Login or register" title="Login / Register"><span data-icon="person"></span></a>
            <button class="icon-btn navbar__menu-btn" id="menuOpen" type="button" aria-label="Open menu" aria-controls="drawer" aria-expanded="false"><span data-icon="menu"></span></button>
          </div>
        </div>
      </header>
      <div class="drawer-scrim" id="drawerScrim"></div>
      <aside class="drawer" id="drawer" aria-label="Menu">
        <div class="drawer__head">
          <span class="brand__name">X-Productions</span>
          <button class="icon-btn" id="menuClose" type="button" aria-label="Close menu"><span data-icon="close"></span></button>
        </div>
        <nav>${drawerLinks}</nav>
        <a class="btn btn--primary btn--lg btn--pill drawer__cta" href="${ROOT}pages/events.html">Explore Events</a>
      </aside>`;
  }

  function footerHtml() {
    return `
      <footer class="footer">
        <div class="container">
          <div class="footer__row">
            ${brandHtml()}
            <nav class="footer__links" aria-label="Footer">
              <a href="${ROOT}pages/events.html">Events</a>
              <a href="${ROOT}index.html#about">About</a>
              <a href="${ROOT}pages/my-tickets.html">My Tickets</a>
              <a href="${ROOT}pages/login.html">Sign in</a>
            </nav>
            <div class="social">
              <a href="${ROOT}index.html#about" aria-label="Instagram"><span data-icon="instagram"></span></a>
              <a href="${ROOT}index.html#about" aria-label="TikTok"><span data-icon="tiktok"></span></a>
              <a href="${ROOT}index.html#about" aria-label="Facebook"><span data-icon="facebook"></span></a>
            </div>
          </div>
          <div class="footer__bottom">
            <div>© 2026 X-Productions. University project — Phase 1 frontend demo.</div>
          </div>
        </div>
      </footer>`;
  }

  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.innerHTML = headerHtml();
  if (footerSlot) footerSlot.innerHTML = footerHtml();

  /* ---------- 3. Mobile drawer ---------- */
  const menuOpen = document.getElementById("menuOpen");
  const menuClose = document.getElementById("menuClose");
  const scrim = document.getElementById("drawerScrim");

  function setDrawer(open) {
    body.classList.toggle("drawer-open", open);
    if (menuOpen) menuOpen.setAttribute("aria-expanded", String(open));
    (open ? menuClose : menuOpen)?.focus();
  }
  if (menuOpen) {
    menuOpen.addEventListener("click", () => setDrawer(true));
    menuClose.addEventListener("click", () => setDrawer(false));
    scrim.addEventListener("click", () => setDrawer(false));
    document.getElementById("drawer").addEventListener("click", (e) => {
      if (e.target.closest("a")) body.classList.remove("drawer-open");   // navigating: just close
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("drawer-open")) setDrawer(false);
    });
  }

  /* ---------- 4. Navbar turns solid after scrolling ---------- */
  const navbar = document.getElementById("navbar");
  function updateNavbar() { if (navbar) navbar.classList.toggle("navbar--solid", window.scrollY > 40); }
  window.addEventListener("scroll", updateNavbar, { passive: true });
  updateNavbar();

  /* ---------- 5. Photo fallback ---------- */
  /* Any <img data-fallback> that fails to load is removed so the dark gradient behind it shows instead. */
  function watchImages(scope) {
    (scope || document).querySelectorAll("img[data-fallback]").forEach((img) => {
      const drop = () => img.remove();
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) drop();
      else img.addEventListener("error", drop, { once: true });
    });
  }

  /* ---------- 6. Demo QR picture ---------- */
  /* DECORATIVE ONLY: a QR-looking pattern generated from the ticket code. It is not a real,
     scannable QR code (no QR library allowed in Phase 1). The admin scanner demo uses the printed code. */
  function qrSvg(code) {
    let seed = 0;
    for (const ch of String(code)) seed = (seed * 31 + ch.charCodeAt(0)) % 233280;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const n = 25;
    let cells = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
        if (!inFinder && rand() > 0.5) cells += `M${x} ${y}h1v1h-1z`;
      }
    }
    const finder = (x, y) => `<path fill-rule="evenodd" d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return `<svg viewBox="-1 -1 27 27" fill="currentColor" shape-rendering="crispEdges" role="img" aria-label="Demo QR code for ${code}"><path d="${cells}"/>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  }

  /* If someone is "signed in", say so on the account button */
  const signedIn = window.XP && XP.store.getUser();
  const accountBtn = document.querySelector(".navbar__actions .icon-btn[href$='login.html']");
  if (signedIn && accountBtn) accountBtn.title = `Signed in as ${signedIn.name}`;

  drawIcons(document);
  watchImages(document);

  /* Small public API for other scripts (home.js, events.js, ...) */
  window.XPUI = { drawIcons, watchImages, iconSvg, qrSvg };
})();
