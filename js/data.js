/* =====================================================================
   X-PRODUCTIONS — SHARED EVENT DATA  (single source of truth)
   Every page reads events from here. Do not copy event details into other
   files. All content is fictional sample data for the Phase 1 demo.

   Event shape:
     id, name, artist, category (key), categoryLabel, city, date (YYYY-MM-DD),
     time, doorsInfo, venue, venueNote, image (Unsplash photo id),
     description[], program[{time, title}],
     tiers[{id, name, price (EGP), remaining, note, low}]

   Photos load from Unsplash. To use your own pictures, drop files into
   assets/images/ and change `image` to a path like "assets/images/nile.jpg"
   (see imageUrl() below).
   ===================================================================== */

const XP = (function () {
  const EVENTS = [
    {
      id: "nile-nights-live", name: "Nile Nights Live",
      artist: "Layla Vox & the Cairo Strings",
      category: "concert", categoryLabel: "Concert", city: "Cairo",
      date: "2026-10-30", time: "8:00 PM", doorsInfo: "Doors 7:00 PM · Show 8:00 PM",
      venue: "Grand Arena, New Cairo", venueNote: "New Cairo · about 25 minutes from Downtown.",
      image: "photo-1493225457124-a3eb161ffa5f",
      description: [
        "Layla Vox and the Cairo Strings bring a full-length live concert to the Grand Arena — favourite songs, new orchestral arrangements and a 24-piece string section, with clear sightlines from every section.",
        "Entry is by QR ticket from My Tickets. Ages 12 and up; younger guests must be accompanied by an adult."
      ],
      program: [
        { time: "7:00 PM", title: "Doors open" },
        { time: "8:00 PM", title: "Opening set — Noor Atlas Trio" },
        { time: "8:55 PM", title: "Layla Vox & the Cairo Strings" },
        { time: "10:45 PM", title: "Finale & close" }
      ],
      tiers: [
        { id: "standard", name: "Standard", price: 650, remaining: 412, note: "Reserved seating" },
        { id: "premium", name: "Premium", price: 1200, remaining: 112, note: "Closer view · fast-lane entry" },
        { id: "front-row", name: "Front Row", price: 2500, remaining: 18, note: "First three rows", low: true }
      ]
    },
    {
      id: "golden-gala-prom-2026", name: "Golden Gala Prom 2026",
      artist: "Senior class prom night",
      category: "prom", categoryLabel: "Prom", city: "Cairo",
      date: "2026-11-07", time: "7:00 PM", doorsInfo: "Arrival 7:00 PM · Dinner 8:00 PM",
      venue: "Nile Ballroom, Zamalek", venueNote: "Zamalek · on the Nile, about 10 minutes from Downtown.",
      image: "photo-1492684223066-81342ee5ff30",
      description: [
        "A black-tie evening for graduating classes: a plated dinner, a live band, a DJ set and the crowning ceremony, in a ballroom overlooking the Nile.",
        "Formal dress code. Guests must be 16 or over and bring a valid school ID; tables are assigned when you book."
      ],
      program: [
        { time: "7:00 PM", title: "Arrival & photo wall" },
        { time: "8:00 PM", title: "Dinner is served" },
        { time: "9:30 PM", title: "Live band & dance floor" },
        { time: "11:00 PM", title: "Prom king and queen" },
        { time: "12:00 AM", title: "Close" }
      ],
      tiers: [
        { id: "general", name: "General", price: 1100, remaining: 260, note: "Open seating" },
        { id: "premium-table", name: "Premium Table", price: 1600, remaining: 90, note: "Front tables · welcome drink" },
        { id: "vip-table", name: "VIP Table", price: 2400, remaining: 16, note: "Stage-side tables · priority entry", low: true }
      ]
    },
    {
      id: "sahel-sounds-festival", name: "Sahel Sounds Festival",
      artist: "3 stages · 14 artists",
      category: "festival", categoryLabel: "Festival", city: "North Coast",
      date: "2026-11-13", time: "4:00 PM", doorsInfo: "Gates 3:00 PM · Music from 4:00 PM",
      venue: "Blue Lagoon, North Coast", venueNote: "North Coast · about 2 hours from Cairo by car.",
      image: "photo-1533174072545-7a4b6ad7a6c3",
      description: [
        "A full day of live music by the water: fourteen artists across three stages, with sunset sets on the main stage and food and drink along the lagoon.",
        "Open-air event for ages 16 and up. Bring a valid ID; outside drinks are not allowed."
      ],
      program: [
        { time: "3:00 PM", title: "Gates open" },
        { time: "4:00 PM", title: "Lagoon Stage opens" },
        { time: "6:30 PM", title: "Sunset sets on the Main Stage" },
        { time: "9:00 PM", title: "Headline set" },
        { time: "11:30 PM", title: "Close" }
      ],
      tiers: [
        { id: "general", name: "General", price: 900, remaining: 1240, note: "General admission" },
        { id: "premium", name: "Premium", price: 1600, remaining: 320, note: "Shaded viewing deck" },
        { id: "vip-lounge", name: "VIP Lounge", price: 3200, remaining: 24, note: "Lounge access · private bar", low: true }
      ]
    },
    {
      id: "laugh-out-cairo", name: "Laugh Out Cairo",
      artist: "Stand-up comedy night",
      category: "show", categoryLabel: "Comedy", city: "Cairo",
      date: "2026-11-21", time: "9:00 PM", doorsInfo: "Doors 8:00 PM · Show 9:00 PM",
      venue: "Downtown Theatre, Cairo", venueNote: "Downtown Cairo · a short walk from Tahrir Square.",
      image: "photo-1516450360452-9312f5e86fc7",
      description: [
        "An evening of stand-up from six of Cairo's sharpest comedians, in an intimate theatre where every seat is close to the stage.",
        "Sets are in Arabic and English. Ages 16 and up."
      ],
      program: [
        { time: "8:00 PM", title: "Doors open" },
        { time: "9:00 PM", title: "Opening act" },
        { time: "9:30 PM", title: "Headline comedians" },
        { time: "10:45 PM", title: "Closing set" }
      ],
      tiers: [
        { id: "standard", name: "Standard", price: 450, remaining: 186, note: "Reserved seating" },
        { id: "front-rows", name: "Front Rows", price: 750, remaining: 22, note: "First four rows", low: true }
      ]
    },
    {
      id: "cirque-lumiere", name: "Cirque Lumière",
      artist: "Acrobatic family show",
      category: "show", categoryLabel: "Show", city: "Cairo",
      date: "2026-11-28", time: "6:00 PM", doorsInfo: "Doors 5:00 PM · Show 6:00 PM",
      venue: "Grand Arena, New Cairo", venueNote: "New Cairo · about 25 minutes from Downtown.",
      image: "photo-1524368535928-5b5e00ddc76b",
      description: [
        "A two-hour acrobatic production of aerial silks, hand-balancing and light-and-shadow choreography, performed in the round so every seat has a close view.",
        "Suitable for all ages. Every guest who needs a seat needs a ticket."
      ],
      program: [
        { time: "5:00 PM", title: "Doors open" },
        { time: "6:00 PM", title: "Show, part one" },
        { time: "7:00 PM", title: "Interval" },
        { time: "7:20 PM", title: "Show, part two" },
        { time: "8:15 PM", title: "Close" }
      ],
      tiers: [
        { id: "standard", name: "Standard", price: 800, remaining: 540, note: "Reserved seating" },
        { id: "premium", name: "Premium", price: 1300, remaining: 190, note: "Closer view" },
        { id: "ringside", name: "Ringside", price: 2000, remaining: 30, note: "Front ring, closest to the stage", low: true }
      ]
    },
    {
      id: "winter-food-music-fair", name: "Winter Food & Music Fair",
      artist: "60+ vendors · live bands",
      category: "festival", categoryLabel: "Festival", city: "Cairo",
      date: "2026-12-04", time: "4:00 PM", doorsInfo: "Open 4:00 PM · Close 11:00 PM",
      venue: "Nile Pavilion, Maadi", venueNote: "Maadi · along the Corniche, about 20 minutes from Downtown.",
      image: "photo-1506157786151-b8491531f063",
      description: [
        "More than sixty food and drink vendors, a seasonal market and live bands across two stages at the Nile Pavilion, with heated seating areas.",
        "A ticket covers entry only; food and drinks are paid for at each stall. All ages welcome."
      ],
      program: [
        { time: "4:00 PM", title: "Gates open" },
        { time: "5:00 PM", title: "Live band, Garden Stage" },
        { time: "7:30 PM", title: "Main Stage set" },
        { time: "9:30 PM", title: "Closing act" },
        { time: "11:00 PM", title: "Close" }
      ],
      tiers: [
        { id: "entry", name: "Entry", price: 200, remaining: 2000, note: "General admission" },
        { id: "fast-lane", name: "Fast Lane", price: 350, remaining: 600, note: "Skip the queue · welcome drink" }
      ]
    },
    {
      id: "little-wonders-magic-day", name: "Little Wonders Magic Day",
      artist: "Kids magic & games",
      category: "family", categoryLabel: "Family", city: "Cairo",
      date: "2026-12-12", time: "11:00 AM", doorsInfo: "Doors 10:30 AM · Show 11:00 AM",
      venue: "Heliopolis Club Hall", venueNote: "Heliopolis · near Korba, with on-site parking.",
      image: "",
      description: [
        "A morning of close-up magic, puppet shows and games for children aged 3 to 10, run by a team of family entertainers. Parents are welcome to stay.",
        "Every guest needs a ticket. Recommended for ages 3 to 10."
      ],
      program: [
        { time: "10:30 AM", title: "Doors open" },
        { time: "11:00 AM", title: "Magic show" },
        { time: "12:00 PM", title: "Games & face painting" },
        { time: "1:00 PM", title: "Puppet theatre" },
        { time: "2:00 PM", title: "Close" }
      ],
      tiers: [
        { id: "standard", name: "Standard", price: 350, remaining: 140, note: "Reserved seating" },
        { id: "front-seats", name: "Front Seats", price: 550, remaining: 20, note: "Front rows · photo with the magician", low: true }
      ]
    },
    {
      id: "new-years-eve-live", name: "New Year's Eve Live",
      artist: "Layla Vox · Noor Atlas · Helix",
      category: "concert", categoryLabel: "Concert", city: "Cairo",
      date: "2026-12-31", time: "9:00 PM", doorsInfo: "Doors 8:00 PM · Show 9:00 PM",
      venue: "Grand Arena, New Cairo", venueNote: "New Cairo · about 25 minutes from Downtown.",
      image: "photo-1514525253161-7a46d19cd819",
      description: [
        "See the year out with three headline acts, a full countdown and fireworks over the Grand Arena.",
        "Ages 18 and up. Entry is by QR ticket and doors close at 11:30 PM."
      ],
      program: [
        { time: "8:00 PM", title: "Doors open" },
        { time: "9:00 PM", title: "Helix" },
        { time: "10:15 PM", title: "Noor Atlas" },
        { time: "11:30 PM", title: "Layla Vox" },
        { time: "12:00 AM", title: "Countdown & fireworks" },
        { time: "1:00 AM", title: "Close" }
      ],
      tiers: [
        { id: "general", name: "General", price: 1800, remaining: 900, note: "Standing" },
        { id: "premium", name: "Premium", price: 3200, remaining: 220, note: "Reserved seating" },
        { id: "vip", name: "VIP", price: 5500, remaining: 40, note: "Front section · private bar", low: true }
      ]
    },
    {
      id: "creator-gaming-expo", name: "Creator & Gaming Expo",
      artist: "Two-day expo",
      category: "expo", categoryLabel: "Expo", city: "Cairo",
      date: "2027-01-15", time: "10:00 AM", doorsInfo: "Opens 10:00 AM · Closes 8:00 PM",
      venue: "Cairo Convention Hall, Nasr City", venueNote: "Nasr City · with on-site parking.",
      image: "",
      description: [
        "Two days of creator meet-ups, game demos, tournaments and workshops across three halls. Try upcoming titles and watch the live finals.",
        "All ages. A day pass is valid for the date printed on your ticket."
      ],
      program: [
        { time: "10:00 AM", title: "Doors open" },
        { time: "11:00 AM", title: "Creator talks" },
        { time: "1:00 PM", title: "Tournament qualifiers" },
        { time: "4:00 PM", title: "Workshops" },
        { time: "6:00 PM", title: "Live finals" },
        { time: "8:00 PM", title: "Close" }
      ],
      tiers: [
        { id: "day-pass", name: "Day Pass", price: 250, remaining: 1500, note: "One day" },
        { id: "two-day-pass", name: "Two-Day Pass", price: 400, remaining: 800, note: "Both days" },
        { id: "vip-pass", name: "VIP Pass", price: 900, remaining: 60, note: "Fast entry · creator meet-ups", low: true }
      ]
    }
  ];

  const CATEGORIES = [
    { key: "concert", label: "Concerts" },
    { key: "festival", label: "Festivals" },
    { key: "prom", label: "Proms" },
    { key: "show", label: "Comedy & Shows" },
    { key: "family", label: "Family" },
    { key: "expo", label: "Expos" }
  ];

  /* Events shown in "Featured Events" on the homepage (ids, in order) */
  const FEATURED_IDS = ["nile-nights-live", "golden-gala-prom-2026", "sahel-sounds-festival"];

  /* ---------- helpers ---------- */
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function parseDate(event) {
    const [y, m, d] = event.date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  /* ===================================================================
     DEMO STORE — temporary browser-side mock state (Phase 1 has no backend)
     Keeps the customer journey consistent between pages:
       user      who is "signed in" (name, email, role only — NEVER a password)
       draft     the tickets being selected right now (this tab only)
       bookings  demo bookings; status: "pending" | "approved" | "rejected"
     Payment screenshots are NOT stored — only their file name.
     Booking shape: { id, eventId, customer:{name,email}, items:[{tierId,name,price,qty}],
                      total, status, createdAt, proofFileName?, note? }
     =================================================================== */
  const KEYS = { user: "xp.user", draft: "xp.bookingDraft", bookings: "xp.bookings.v3", last: "xp.lastBooking", events: "xp.events.v1" };
  const DEMO_USER = { name: "Demo Customer", email: "demo@xproductions.test", role: "customer" };

  function read(kind, key, fallback) {
    try { const raw = window[kind].getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function write(kind, key, value) {
    try { window[kind].setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: demo still works within the page */ }
  }

  /* Admin edits (Admin → Events) are saved in this browser and replace the built-in list
     above. Each event may also have  status: "on-sale" (default) | "sold-out" | "draft" (hidden). */
  const DEFAULT_EVENTS = JSON.parse(JSON.stringify(EVENTS));
  const savedEvents = read("localStorage", KEYS.events, null);
  if (Array.isArray(savedEvents) && savedEvents.length) EVENTS.splice(0, EVENTS.length, ...savedEvents);
  const statusOf = (event) => event.status || "on-sale";

  /* Snapshot tier names and prices at booking time: [{tierId, name, price, qty}] */
  function buildItems(event, quantities) {
    return event.tiers
      .filter((t) => (quantities[t.id] || 0) > 0)
      .map((t) => ({ tierId: t.id, name: t.name, price: t.price, qty: quantities[t.id] }));
  }
  function itemsTotal(items) { return items.reduce((sum, i) => sum + i.price * i.qty, 0); }

  function seedBookings() {
    const make = (id, who, eventId, qty, status, extra) => {
      const event = DEFAULT_EVENTS.find((e) => e.id === eventId);
      const items = buildItems(event, qty);
      return Object.assign({ id, eventId, customer: who, items, total: itemsTotal(items),
        status, createdAt: "2026-10-16" }, extra);
    };
    const demo = { name: DEMO_USER.name, email: DEMO_USER.email };
    const person = (name) => ({ name, email: name.toLowerCase().replace(/ /g, ".") + "@example.com" });
    return [
      /* The demo customer's three bookings: one of each status (shown on My Tickets) */
      make("XP-3F9K-0381", demo, "nile-nights-live", { standard: 2 }, "approved", { proofFileName: "instapay-receipt-1.png" }),
      make("XP-8B2N-0380", demo, "golden-gala-prom-2026", { "premium-table": 1 }, "pending", { proofFileName: "instapay-receipt-2.png" }),
      make("XP-4D7L-0379", demo, "sahel-sounds-festival", { general: 3 }, "rejected", { proofFileName: "screenshot.jpg", note: "Screenshot unreadable" }),
      /* Other customers (visible in the admin portal only) */
      make("XP-7QH2-0378", person("Omar Farouk"), "nile-nights-live", { premium: 1, standard: 1 }, "pending", { proofFileName: "IMG_4021.jpg" }),
      make("XP-5MZ8-0377", person("Salma Hassan"), "new-years-eve-live", { general: 2 }, "pending", { proofFileName: "instapay-salma.png" }),
      make("XP-2KT6-0376", person("Youssef Nabil"), "laugh-out-cairo", { standard: 4 }, "pending", { proofFileName: "Screenshot_2026-10-15.png" }),
      make("XP-9RC4-0375", person("Mariam Adel"), "cirque-lumiere", { premium: 2 }, "approved", { proofFileName: "payment.jpg" }),
      make("XP-6WD3-0374", person("Karim Soliman"), "winter-food-music-fair", { entry: 3, "fast-lane": 1 }, "approved", { proofFileName: "receipt.png", checkedInAt: "2026-10-17T19:42:00" }),
      make("XP-1BN5-0373", person("Hana Mostafa"), "golden-gala-prom-2026", { general: 2 }, "rejected", { proofFileName: "blurry.jpg", note: "Amount doesn't match" })
    ];
  }

  const store = {
    DEMO_USER,

    /* --- signed-in user --- */
    getUser() { return read("localStorage", KEYS.user, null); },
    setUser(user) { write("localStorage", KEYS.user, user); },
    clearUser() { try { localStorage.removeItem(KEYS.user); } catch (e) { /* ignore */ } },

    /* --- ticket selection in progress: { eventId, quantities:{tierId:qty} } --- */
    getDraft() { return read("sessionStorage", KEYS.draft, null); },
    setDraft(draft) { write("sessionStorage", KEYS.draft, draft); },
    clearDraft() { try { sessionStorage.removeItem(KEYS.draft); } catch (e) { /* ignore */ } },

    /* --- id of the booking just submitted (for the confirmation page) --- */
    getLastBookingId() { return read("sessionStorage", KEYS.last, null); },
    setLastBookingId(id) { write("sessionStorage", KEYS.last, id); },

    /* --- bookings (demo data is created the first time they are needed) --- */
    getBookings() {
      let list = read("localStorage", KEYS.bookings, null);
      if (!list) { list = seedBookings(); write("localStorage", KEYS.bookings, list); }
      return list;
    },
    saveBookings(list) { write("localStorage", KEYS.bookings, list); },
    bookingsFor(email) { return this.getBookings().filter((b) => b.customer.email === email); },
    addBooking(booking) {
      const list = this.getBookings();
      const full = Object.assign({ id: this.newBookingCode(), status: "pending", createdAt: new Date().toISOString() }, booking);
      list.unshift(full);
      this.saveBookings(list);
      return full;
    },
    updateBooking(id, changes) {
      const list = this.getBookings();
      const found = list.find((b) => b.id === id);
      if (found) { Object.assign(found, changes); this.saveBookings(list); }
      return found || null;
    },
    newBookingCode() {
      const part = () => Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
      return `XP-${part()}-${String(this.getBookings().length + 1).padStart(4, "0")}`;
    },

    buildItems,
    itemsTotal,
    ticketCount(items) { return items.reduce((sum, i) => sum + i.qty, 0); }
  };

  return {
    store,
    /* Booking status → label and chip colour (used by My Tickets and the admin pages) */
    STATUS: {
      approved: { label: "Approved", chip: "chip--ok" },
      pending: { label: "Pending Approval", chip: "chip--warn" },
      rejected: { label: "Rejected", chip: "chip--bad" }
    },
    EVENTS,
    CATEGORIES,
    FEATURED_IDS,

    getEvent(id) { return EVENTS.find((e) => e.id === id) || null; },
    statusOf,
    /* Events customers may see (drafts are hidden) */
    getPublicEvents() { return EVENTS.filter((e) => statusOf(e) !== "draft"); },
    /* The three homepage events; if one was hidden or deleted, the next public events fill in */
    getFeatured() {
      const picked = FEATURED_IDS.map((id) => this.getEvent(id)).filter((e) => e && statusOf(e) !== "draft");
      const fill = this.getPublicEvents().filter((e) => !picked.includes(e));
      return picked.concat(fill).slice(0, 3);
    },

    /* --- admin: save edited events (all pages read XP.EVENTS, so changes show everywhere) --- */
    saveEvents(list) {
      write("localStorage", KEYS.events, list);
      EVENTS.splice(0, EVENTS.length, ...list);
    },
    resetEvents() {
      try { localStorage.removeItem(KEYS.events); } catch (e) { /* ignore */ }
      EVENTS.splice(0, EVENTS.length, ...JSON.parse(JSON.stringify(DEFAULT_EVENTS)));
    },
    minPrice(event) { return Math.min(...event.tiers.map((t) => t.price)); },
    formatPrice(n) { return "EGP " + Number(n).toLocaleString("en-US"); },

    /* "Fri, 30 Oct 2026" */
    formatDate(event) {
      const d = parseDate(event);
      return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    },

    /* Photo URL for an event (supports local file paths too) */
    imageUrl(image, width = 1200) {
      if (!image) return "";
      if (image.includes("/") || image.includes(".")) return image;   // local file
      return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=70`;
    }
  };
})();
