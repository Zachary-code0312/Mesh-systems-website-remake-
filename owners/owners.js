/* Mesh Systems owners area: quotes, price list and settings.
   Everything is saved in this browser (localStorage) on this device only.
   Backups are JSON files the owners save and import themselves. */
(function () {
  "use strict";

  var KEY = "mesh-owners-v1";
  var CATEGORIES = ["WiFi and networks", "Lighting control", "TVs and audio", "Home cinema", "Blinds and curtains",
    "Control systems", "Security", "Cabling and infrastructure", "Labour", "Other"];
  var UNITS = ["each", "pair", "hour", "day", "metre", "set"];
  var STATUS = { draft: "Draft", sent: "Sent", accepted: "Accepted", declined: "Declined" };
  var DEFAULT_SETTINGS = {
    company: {
      name: "Mesh Systems Europe Limited",
      address: "The Long Barn\nCobham Park Road\nCobham, Surrey\nKT11 3NE",
      phone: "Reigate 01737 448049 · Cobham / Weybridge 01932 943052",
      email: "info@meshsystems.co.uk",
      website: "meshsystems.co.uk",
      vatNumber: "",
      companyNumber: ""
    },
    prefix: "Q", nextNumber: 1, vatOn: true, vatRate: 20, validDays: 30, depositPct: 0, terms: ""
  };
  var STARTER_ITEMS = [
    ["Survey and system design", "Other", "each"],
    ["Installation labour", "Labour", "day"],
    ["Programming and commissioning", "Labour", "day"],
    ["Cat6 data point, supplied and installed", "Cabling and infrastructure", "each"],
    ["WiFi access point, supplied and installed", "WiFi and networks", "each"],
    ["In-ceiling speakers, supplied and installed", "TVs and audio", "pair"],
    ["Lighting control keypad", "Lighting control", "each"],
    ["TV wall mounting", "TVs and audio", "each"]
  ];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Storage ---------- */
  var storageOk = true;
  var state = load();

  function blankState() {
    return { version: 1, quotes: [], prices: [], settings: clone(DEFAULT_SETTINGS), lastBackup: null };
  }
  function load() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { storageOk = false; }
    var s = blankState();
    if (data && typeof data === "object") {
      s.quotes = Array.isArray(data.quotes) ? data.quotes.map(normaliseQuote) : [];
      s.prices = Array.isArray(data.prices) ? data.prices.map(normalisePrice) : [];
      s.settings = mergeSettings(data.settings);
      s.lastBackup = data.lastBackup || null;
    }
    return s;
  }
  var pending = false; // true while a change is waiting to be saved
  function save() {
    pending = false;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      if (navigator.storage && navigator.storage.persist && !save.asked) { save.asked = true; navigator.storage.persist().catch(function () {}); }
      return true;
    } catch (e) {
      storageOk = false;
      $("#storage-warning").hidden = false;
      return false;
    }
  }
  try { localStorage.setItem(KEY + "-test", "1"); localStorage.removeItem(KEY + "-test"); } catch (e) { storageOk = false; }

  function mergeSettings(s) {
    var out = clone(DEFAULT_SETTINGS);
    if (!s || typeof s !== "object") return out;
    Object.keys(out).forEach(function (k) {
      if (k === "company") return;
      if (s[k] !== undefined && s[k] !== null) out[k] = s[k];
    });
    if (s.company && typeof s.company === "object") {
      Object.keys(out.company).forEach(function (k) { if (typeof s.company[k] === "string") out.company[k] = s.company[k]; });
    }
    return out;
  }
  function normaliseQuote(q) {
    q = q && typeof q === "object" ? q : {};
    var now = new Date().toISOString();
    return {
      id: str(q.id) || uid(), number: str(q.number), status: STATUS[q.status] ? q.status : "draft",
      created: str(q.created) || now, updated: str(q.updated) || now, date: str(q.date) || today(),
      validDays: num(q.validDays) || 30,
      customer: { name: str(q.customer && q.customer.name), email: str(q.customer && q.customer.email), phone: str(q.customer && q.customer.phone), address: str(q.customer && q.customer.address) },
      title: str(q.title), summary: str(q.summary),
      items: Array.isArray(q.items) ? q.items.map(normaliseItem) : [],
      discountType: ["none", "percent", "amount"].indexOf(q.discountType) > -1 ? q.discountType : "none",
      discount: num(q.discount), vatOn: q.vatOn !== false, vatRate: q.vatRate === undefined ? 20 : num(q.vatRate),
      depositPct: num(q.depositPct), notes: str(q.notes), terms: str(q.terms)
    };
  }
  function normaliseItem(i) {
    i = i && typeof i === "object" ? i : {};
    return { id: str(i.id) || uid(), category: CATEGORIES.indexOf(i.category) > -1 ? i.category : "Other", desc: str(i.desc),
      qty: i.qty === undefined ? 1 : num(i.qty), price: num(i.price), cost: i.cost === "" || i.cost === null || i.cost === undefined ? "" : num(i.cost) };
  }
  function normalisePrice(p) {
    p = p && typeof p === "object" ? p : {};
    return { id: str(p.id) || uid(), name: str(p.name), category: CATEGORIES.indexOf(p.category) > -1 ? p.category : "Other",
      unit: UNITS.indexOf(p.unit) > -1 ? p.unit : "each", price: num(p.price), cost: p.cost === "" || p.cost === undefined || p.cost === null ? "" : num(p.cost),
      updated: str(p.updated) || new Date().toISOString() };
  }

  /* ---------- Helpers ---------- */
  function str(v) { return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v); }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  var gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
  function money(n) { return gbp.format(round2(n || 0)); }
  function pct(n) { return (Math.round(n * 10) / 10).toString().replace(/\.0$/, "") + "%"; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function addDays(iso, days) {
    var p = (iso || today()).split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]); d.setDate(d.getDate() + (days || 0));
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function niceDate(iso) {
    if (!iso) return "";
    var p = iso.slice(0, 10).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function esc(s) {
    return str(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function getPath(obj, path) { return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function setPath(obj, path, value) {
    var keys = path.split("."), last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k] = o[k] || {}; }, obj);
    target[last] = value;
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments; pending = true; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.classList.add("is-visible");
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove("is-visible"); }, 2600);
  }
  function formatNumber(prefix, n) { return (prefix ? prefix + "-" : "") + new Date().getFullYear() + "-" + String(n).padStart(3, "0"); }
  function findQuote(id) { return state.quotes.filter(function (q) { return q.id === id; })[0]; }

  /* ---------- Quote maths ---------- */
  function calc(q) {
    var subtotal = 0, cost = 0, costed = 0, counted = 0;
    var lines = q.items.map(function (it) {
      var total = round2(num(it.qty) * num(it.price));
      subtotal += total;
      if (it.desc || total) {
        counted++;
        if (it.cost !== "" && it.cost !== undefined) { cost += num(it.qty) * num(it.cost); costed++; }
      }
      return total;
    });
    subtotal = round2(subtotal);
    var discount = 0;
    if (q.discountType === "percent") discount = round2(subtotal * Math.min(100, num(q.discount)) / 100);
    else if (q.discountType === "amount") discount = round2(Math.min(subtotal, num(q.discount)));
    var net = round2(subtotal - discount);
    var vat = q.vatOn ? round2(net * num(q.vatRate) / 100) : 0;
    var total = round2(net + vat);
    var deposit = round2(total * Math.min(100, num(q.depositPct)) / 100);
    cost = round2(cost);
    var profit = round2(net - cost);
    return { lines: lines, subtotal: subtotal, discount: discount, net: net, vat: vat, total: total, deposit: deposit,
      cost: cost, costed: costed, counted: counted, profit: profit, margin: net ? (profit / net) * 100 : 0 };
  }

  /* ---------- Routing ---------- */
  var currentId = null;
  function route() {
    var hash = location.hash.replace(/^#/, "") || "quotes";
    var parts = hash.split("/");
    var view = parts[0];
    if (view === "quote" && parts[1] && findQuote(parts[1])) { openEditor(parts[1]); view = "editor"; }
    else if (["quotes", "prices", "settings"].indexOf(view) === -1) view = "quotes";
    $$("[data-view]").forEach(function (s) { s.hidden = s.getAttribute("data-view") !== view; });
    $$("[data-tab]").forEach(function (t) {
      var on = t.getAttribute("data-tab") === (view === "editor" ? "quotes" : view);
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
    if (view === "quotes") renderQuotes();
    if (view === "prices") renderPrices();
    if (view === "settings") fillSettings();
    if (view !== "editor") currentId = null;
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  /* ---------- Quotes list ---------- */
  var filter = "all";
  function renderQuotes() {
    var term = ($("#quote-search").value || "").trim().toLowerCase();
    var stats = { draft: [0, 0], sent: [0, 0], accepted: [0, 0], declined: [0, 0] };
    state.quotes.forEach(function (q) { var t = calc(q).total; stats[q.status][0]++; stats[q.status][1] += t; });
    $("#quote-stats").innerHTML = ["draft", "sent", "accepted", "declined"].map(function (k) {
      return '<div class="o-stat"><small>' + STATUS[k] + '</small><strong>' + money(stats[k][1]) + '</strong><span>' + stats[k][0] + (stats[k][0] === 1 ? " quote" : " quotes") + "</span></div>";
    }).join("");

    var list = state.quotes.slice().sort(function (a, b) { return b.updated.localeCompare(a.updated); }).filter(function (q) {
      if (filter !== "all" && q.status !== filter) return false;
      if (!term) return true;
      return [q.number, q.customer.name, q.customer.email, q.title, q.customer.address].join(" ").toLowerCase().indexOf(term) > -1;
    });
    var box = $("#quote-list");
    if (!state.quotes.length) {
      box.innerHTML = '<div class="o-empty"><h2>No quotes yet</h2><p>Create your first quote. It saves as you type.</p><button class="btn btn--primary" type="button" data-action="new-quote">New quote</button></div>';
    } else if (!list.length) {
      box.innerHTML = '<div class="o-empty"><p>No quotes match that search.</p></div>';
    } else {
      box.innerHTML = list.map(function (q) {
        var c = calc(q);
        return '<a class="o-quote" href="#quote/' + esc(q.id) + '"><span class="o-quote__main"><strong>' + esc(q.customer.name || "No customer yet") + '</strong><span>' +
          esc(q.number) + (q.title ? " · " + esc(q.title) : "") + '</span></span><span class="o-quote__meta"><span class="status status--' + q.status + '">' + STATUS[q.status] +
          "</span><strong>" + money(c.total) + "</strong><small>" + esc(niceDate(q.date)) + "</small></span></a>";
      }).join("");
    }
    var rem = $("#backup-reminder");
    var days = state.lastBackup ? Math.floor((Date.now() - new Date(state.lastBackup).getTime()) / 86400000) : null;
    if (state.quotes.length && (days === null || days >= 14)) {
      rem.hidden = false;
      rem.innerHTML = (days === null ? "You haven't saved a backup yet." : "Your last backup was " + days + " days ago.") +
        ' Quotes are only stored on this device. <a href="#settings">Save a backup</a>.';
    } else rem.hidden = true;
  }
  $("#quote-search").addEventListener("input", renderQuotes);
  $("#quote-filter").addEventListener("click", function (e) {
    var b = e.target.closest("[data-filter]"); if (!b) return;
    filter = b.getAttribute("data-filter");
    $$("#quote-filter [data-filter]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    renderQuotes();
  });

  function newQuote() {
    var s = state.settings, now = new Date().toISOString();
    var q = normaliseQuote({
      id: uid(), number: formatNumber(s.prefix, s.nextNumber), status: "draft", created: now, updated: now, date: today(),
      validDays: s.validDays, items: [{ category: "Other", desc: "", qty: 1, price: 0, cost: "" }],
      vatOn: s.vatOn, vatRate: s.vatRate, depositPct: s.depositPct, terms: s.terms
    });
    s.nextNumber = num(s.nextNumber) + 1;
    state.quotes.push(q);
    save();
    location.hash = "quote/" + q.id;
  }

  /* ---------- Editor ---------- */
  function current() { return findQuote(currentId); }
  function openEditor(id) {
    currentId = id;
    var q = current();
    $$("[data-q]").forEach(function (el) {
      var v = getPath(q, el.getAttribute("data-q"));
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v === undefined || v === null ? "" : v;
    });
    renderItems();
    refresh();
    setSaved(true);
  }
  function refresh() {
    var q = current(); if (!q) return;
    var c = calc(q);
    $('[data-text="number"]').textContent = q.number;
    $('[data-text="customerLine"]').textContent = [q.customer.name, q.title].filter(Boolean).join(" · ") || "New quote";
    $('[data-text="validUntil"]').textContent = niceDate(addDays(q.date, num(q.validDays)));
    $$("[data-line-total]").forEach(function (el) { el.textContent = money(c.lines[Number(el.getAttribute("data-line-total"))] || 0); });
    var rows = [["Subtotal", money(c.subtotal)]];
    if (c.discount) rows.push(["Discount" + (q.discountType === "percent" ? " (" + pct(num(q.discount)) + ")" : ""), "−" + money(c.discount)]);
    if (q.vatOn) rows.push(["VAT (" + pct(num(q.vatRate)) + ")", money(c.vat)]);
    var html = rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("");
    html += '<dt class="is-total">Total</dt><dd class="is-total">' + money(c.total) + "</dd>";
    if (c.deposit) html += "<dt>Deposit (" + pct(num(q.depositPct)) + ")</dt><dd>" + money(c.deposit) + "</dd>";
    $("#totals").innerHTML = html;
    var m = '<strong>Only you see this</strong>';
    if (!c.costed) m += "<p style=\"margin:0\">Add your cost on each line to see your margin.</p>";
    else m += "<dl><dt>Your costs</dt><dd>" + money(c.cost) + "</dd><dt>Profit (before VAT)</dt><dd>" + money(c.profit) + "</dd><dt>Margin</dt><dd>" + pct(c.margin) + "</dd></dl>" +
      (c.costed < c.counted ? '<p style="margin:6px 0 0;font-size:.82rem">Costs entered for ' + c.costed + " of " + c.counted + " lines.</p>" : "");
    $("#margin").innerHTML = m;
  }

  var saveSoon = debounce(function () { save(); setSaved(true); }, 400);
  function changed() {
    var q = current();
    if (q) q.updated = new Date().toISOString();
    setSaved(false); refresh(); saveSoon();
  }
  // Never lose the last few keystrokes when the page is closed or hidden.
  window.addEventListener("pagehide", function () { if (pending) save(); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && pending) save(); });
  // If the owners area is open in another tab, pick up its changes.
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY || pending) return;
    state = load();
    route();
  });
  function setSaved(done) {
    var el = $("#saved-indicator");
    el.textContent = done ? (storageOk ? "Saved" : "Not saved") : "Saving…";
    el.classList.toggle("is-saving", !done);
  }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el.hasAttribute("data-q") && current()) {
      var v = el.type === "checkbox" ? el.checked : el.hasAttribute("data-num") ? num(el.value) : el.value;
      setPath(current(), el.getAttribute("data-q"), v);
      changed();
    } else if (el.hasAttribute("data-item") && current()) {
      var row = el.closest("[data-index]"), item = current().items[Number(row.getAttribute("data-index"))];
      var field = el.getAttribute("data-item");
      if (field === "cost") item.cost = el.value === "" ? "" : num(el.value);
      else item[field] = (field === "qty" || field === "price") ? num(el.value) : el.value;
      if (el.tagName === "TEXTAREA") autosize(el);
      changed();
    } else if (el.hasAttribute("data-s")) {
      var sv = el.type === "checkbox" ? el.checked : el.hasAttribute("data-num") ? num(el.value) : el.value;
      setPath(state.settings, el.getAttribute("data-s"), sv);
      settingsSaveSoon();
    } else if (el.hasAttribute("data-p")) {
      var prow = el.closest("[data-price-id]");
      var p = state.prices.filter(function (x) { return x.id === prow.getAttribute("data-price-id"); })[0];
      if (!p) return;
      var pf = el.getAttribute("data-p");
      if (pf === "cost") p.cost = el.value === "" ? "" : num(el.value);
      else p[pf] = pf === "price" ? num(el.value) : el.value;
      p.updated = new Date().toISOString();
      var mEl = prow.querySelector("[data-margin]"); if (mEl) mEl.textContent = marginText(p);
      pricesSaveSoon();
    }
  });
  // Selects fire "change" on some phones without "input".
  document.addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT" || e.target.type === "checkbox") e.target.dispatchEvent(new Event("input", { bubbles: true }));
  });

  function autosize(t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight + 2, 320) + "px"; }

  function renderItems() {
    var q = current();
    var opts = function (sel) { return CATEGORIES.map(function (c) { return "<option" + (c === sel ? " selected" : "") + ">" + esc(c) + "</option>"; }).join(""); };
    $("#items").innerHTML = q.items.map(function (it, i) {
      return '<div class="o-item" data-index="' + i + '">' +
        '<div class="o-item__top"><select data-item="category" aria-label="Category">' + opts(it.category) + "</select>" +
        '<button class="o-icon-btn" type="button" data-move="-1" aria-label="Move line up"' + (i === 0 ? " disabled" : "") + ">&uarr;</button>" +
        '<button class="o-icon-btn" type="button" data-move="1" aria-label="Move line down"' + (i === q.items.length - 1 ? " disabled" : "") + ">&darr;</button>" +
        '<button class="o-icon-btn" type="button" data-remove aria-label="Remove line">&times;</button></div>' +
        '<textarea data-item="desc" rows="1" placeholder="Description (shown on the quote)" aria-label="Description">' + esc(it.desc) + "</textarea>" +
        '<div class="o-item__nums">' +
        '<label>Qty<input data-item="qty" type="number" min="0" step="any" inputmode="decimal" value="' + esc(it.qty) + '"></label>' +
        '<label>Unit price (£)<input data-item="price" type="number" min="0" step="any" inputmode="decimal" value="' + esc(it.price || "") + '" placeholder="0.00"></label>' +
        '<label class="o-cost">Your cost (£)<input data-item="cost" type="number" min="0" step="any" inputmode="decimal" value="' + esc(it.cost) + '" placeholder="Private"></label>' +
        '<div class="o-item__total">Amount<strong data-line-total="' + i + '"></strong></div></div></div>';
    }).join("") || '<p class="o-hint" style="margin-top:12px">No lines yet.</p>';
    $$("#items textarea").forEach(autosize);
  }
  $("#items").addEventListener("click", function (e) {
    var btn = e.target.closest("button"); if (!btn) return;
    var q = current(), row = btn.closest("[data-index]"), i = Number(row.getAttribute("data-index"));
    if (btn.hasAttribute("data-remove")) {
      var it = q.items[i];
      if ((it.desc || it.price) && !confirm("Remove this line?")) return;
      q.items.splice(i, 1);
    } else if (btn.hasAttribute("data-move")) {
      var j = i + Number(btn.getAttribute("data-move"));
      if (j < 0 || j >= q.items.length) return;
      var tmp = q.items[i]; q.items[i] = q.items[j]; q.items[j] = tmp;
    } else return;
    renderItems(); changed();
  });

  function addLine(item) {
    var q = current();
    var last = q.items[q.items.length - 1];
    q.items.push(normaliseItem(item || { category: last ? last.category : "Other", desc: "", qty: 1, price: 0, cost: "" }));
    renderItems(); changed();
    var rows = $$("#items .o-item"); var r = rows[rows.length - 1];
    if (r && !item) { r.querySelector("textarea").focus(); }
  }

  /* ---------- Price list picker ---------- */
  function renderPicker() {
    var term = ($("#picker-search").value || "").trim().toLowerCase();
    var items = state.prices.filter(function (p) { return p.name && (!term || (p.name + " " + p.category).toLowerCase().indexOf(term) > -1); })
      .sort(function (a, b) { return a.category.localeCompare(b.category) || a.name.localeCompare(b.name); });
    $("#picker-list").innerHTML = items.length ? items.map(function (p) {
      return '<button class="o-picker-item" type="button" data-pick="' + esc(p.id) + '"><span>' + esc(p.name) + "</span><small>" + esc(p.category) + " · per " + esc(p.unit) + "</small><strong>" + money(p.price) + "</strong></button>";
    }).join("") : '<div class="o-empty"><p>' + (state.prices.length ? "Nothing matches that search." : "Your price list is empty.") + '</p><a class="btn btn--outline btn--sm" href="#prices" data-close>Go to price list</a></div>';
  }
  $("#picker-search").addEventListener("input", renderPicker);
  $("#picker-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pick]"); if (!b) return;
    var p = state.prices.filter(function (x) { return x.id === b.getAttribute("data-pick"); })[0];
    if (!p) return;
    var q = current();
    if (q.items.length === 1 && !q.items[0].desc && !q.items[0].price) q.items = [];
    addLine({ category: p.category, desc: p.name, qty: 1, price: p.price, cost: p.cost });
    $("#picker").close();
    toast("Added " + p.name);
  });

  /* ---------- Quote document ---------- */
  function quoteHtml(q) {
    var c = calc(q), co = state.settings.company;
    var groups = [], byCat = {};
    q.items.forEach(function (it, i) {
      if (!it.desc && !c.lines[i]) return;
      if (!byCat[it.category]) { byCat[it.category] = []; groups.push(it.category); }
      byCat[it.category].push([it, c.lines[i]]);
    });
    var rows = groups.map(function (g) {
      var head = groups.length > 1 ? '<tr class="qd-group"><th colspan="4">' + esc(g) + "</th></tr>" : "";
      return head + byCat[g].map(function (pair) {
        var it = pair[0];
        return '<tr><td class="desc">' + esc(it.desc) + '</td><td class="num">' + esc(it.qty) + '</td><td class="num">' + money(it.price) + '</td><td class="num">' + money(pair[1]) + "</td></tr>";
      }).join("");
    }).join("");
    var totals = '<tr><td>Subtotal</td><td>' + money(c.subtotal) + "</td></tr>";
    if (c.discount) totals += "<tr><td>Discount" + (q.discountType === "percent" ? " (" + pct(num(q.discount)) + ")" : "") + "</td><td>−" + money(c.discount) + "</td></tr>";
    if (q.vatOn) totals += "<tr><td>VAT (" + pct(num(q.vatRate)) + ")</td><td>" + money(c.vat) + "</td></tr>";
    totals += '<tr class="grand"><td>Total</td><td>' + money(c.total) + "</td></tr>";
    if (c.deposit) totals += '<tr class="deposit"><td>Deposit due (' + pct(num(q.depositPct)) + ")</td><td>" + money(c.deposit) + "</td></tr>";
    var cust = [q.customer.name, q.customer.address, [q.customer.email, q.customer.phone].filter(Boolean).join(" · ")].filter(Boolean).join("\n");
    var foot = [co.name, co.vatNumber ? "VAT no. " + co.vatNumber : "", co.companyNumber ? "Company no. " + co.companyNumber : "", co.website].filter(Boolean)
      .map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
    return '<article class="qd">' +
      '<header class="qd-head"><div><div class="qd-logo">mesh<span></span></div><div class="qd-company">' +
      esc([co.name, co.address, co.phone, [co.email, co.website].filter(Boolean).join(" · ")].filter(Boolean).join("\n")) + "</div></div>" +
      '<div class="qd-meta"><h1>Quote</h1><dl><dt>Quote no.</dt><dd>' + esc(q.number) + "</dd><dt>Date</dt><dd>" + esc(niceDate(q.date)) +
      "</dd><dt>Valid until</dt><dd>" + esc(niceDate(addDays(q.date, num(q.validDays)))) + "</dd></dl></div></header>" +
      (cust ? '<section class="qd-to"><h2>Prepared for</h2><p>' + esc(cust) + "</p></section>" : "") +
      (q.title || q.summary ? '<section class="qd-project"><h2>Project</h2>' + (q.title ? "<h3>" + esc(q.title) + "</h3>" : "") + (q.summary ? "<p>" + esc(q.summary) + "</p>" : "") + "</section>" : "") +
      '<table class="qd-items"><thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4">No items yet.</td></tr>') + "</tbody></table>" +
      '<table class="qd-totals"><tbody>' + totals + "</tbody></table>" +
      (q.vatOn ? "" : '<p class="qd-block" style="color:#5b6474">Prices shown do not include VAT.</p>') +
      (q.notes ? '<section class="qd-block"><h2>Notes</h2><p>' + esc(q.notes) + "</p></section>" : "") +
      (q.terms ? '<section class="qd-block"><h2>Terms</h2><p>' + esc(q.terms) + "</p></section>" : "") +
      '<footer class="qd-foot">' + foot + "</footer></article>";
  }

  function emailCustomer() {
    var q = current(), c = calc(q);
    if (!q.customer.email) { toast("Add the customer's email first"); $("#c-email").focus(); return; }
    var first = (q.customer.name || "").split(" ")[0];
    var body = [
      "Hi" + (first ? " " + first : "") + ",", "",
      "Thank you for talking to us. Please find attached our quote " + q.number + (q.title ? " for " + q.title : "") + ".", "",
      "Total: " + money(c.total) + (q.vatOn ? " including VAT" : ""),
      c.deposit ? "Deposit: " + money(c.deposit) : null,
      "Valid until: " + niceDate(addDays(q.date, num(q.validDays))), "",
      "If you have any questions, just reply to this email or give us a call.", "",
      "Kind regards,", state.settings.company.name.replace(/ Europe Limited$/, "")
    ].filter(function (l) { return l !== null; }).join("\n");
    location.href = "mailto:" + encodeURIComponent(q.customer.email) + "?subject=" + encodeURIComponent("Your quote from Mesh Systems (" + q.number + ")") + "&body=" + encodeURIComponent(body);
    setTimeout(function () {
      toast("Remember to attach the PDF");
      if (q.status === "draft" && confirm("Mark this quote as sent?")) { q.status = "sent"; $('[data-q="status"]').value = "sent"; changed(); }
    }, 600);
  }

  /* ---------- Price list ---------- */
  function marginText(p) {
    if (p.cost === "" || !p.price) return "–";
    return pct(((p.price - num(p.cost)) / p.price) * 100);
  }
  function renderPrices() {
    var term = ($("#price-search").value || "").trim().toLowerCase();
    var box = $("#price-list");
    if (!state.prices.length) {
      box.innerHTML = '<div class="o-empty"><h2>Your price list is empty</h2><p>Add the items you quote most often. Your prices stay on this device.</p>' +
        '<div class="btn-row" style="justify-content:center"><button class="btn btn--primary" type="button" data-action="add-price">Add item</button>' +
        '<button class="btn btn--outline" type="button" data-action="starter-prices">Add example items to fill in</button></div></div>';
      return;
    }
    var items = state.prices.filter(function (p) { return !term || (p.name + " " + p.category).toLowerCase().indexOf(term) > -1; });
    var groups = {};
    items.forEach(function (p) { (groups[p.category] = groups[p.category] || []).push(p); });
    var cats = CATEGORIES.filter(function (c) { return groups[c]; });
    box.innerHTML = cats.length ? cats.map(function (cat) {
      return '<div class="o-price-group"><h2>' + esc(cat) + "</h2>" + groups[cat].sort(function (a, b) { return a.name.localeCompare(b.name); }).map(priceRow).join("") + "</div>";
    }).join("") : '<div class="o-empty"><p>Nothing matches that search.</p></div>';
  }
  function priceRow(p) {
    var cat = CATEGORIES.map(function (c) { return "<option" + (c === p.category ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("");
    var unit = UNITS.map(function (u) { return "<option" + (u === p.unit ? " selected" : "") + ">" + u + "</option>"; }).join("");
    return '<div class="o-price" data-price-id="' + esc(p.id) + '">' +
      '<label class="p-name">Item<input data-p="name" value="' + esc(p.name) + '" placeholder="Item name, as it should appear on quotes"></label>' +
      "<label>Category<select data-p=\"category\">" + cat + "</select></label>" +
      "<label>Per<select data-p=\"unit\">" + unit + "</select></label>" +
      '<label>Price (£)<input data-p="price" type="number" min="0" step="any" inputmode="decimal" value="' + esc(p.price || "") + '" placeholder="0.00"></label>' +
      '<label>Your cost (£)<input data-p="cost" type="number" min="0" step="any" inputmode="decimal" value="' + esc(p.cost) + '" placeholder="Private"></label>' +
      '<div class="p-margin">Margin<strong data-margin>' + marginText(p) + "</strong></div>" +
      '<button class="o-icon-btn" type="button" data-delete-price aria-label="Delete item">&times;</button></div>';
  }
  var pricesSaveSoon = debounce(function () { save(); }, 400);
  $("#price-search").addEventListener("input", renderPrices);
  $("#price-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-delete-price]"); if (!b) return;
    var id = b.closest("[data-price-id]").getAttribute("data-price-id");
    var p = state.prices.filter(function (x) { return x.id === id; })[0];
    if (p && p.name && !confirm("Delete " + p.name + " from your price list?")) return;
    state.prices = state.prices.filter(function (x) { return x.id !== id; });
    save(); renderPrices();
  });
  function addPrice(fields) {
    var p = normalisePrice(fields || { name: "", category: "Other", unit: "each", price: 0, cost: "" });
    state.prices.push(p); save();
    $("#price-search").value = "";
    renderPrices();
    var row = $('[data-price-id="' + p.id + '"]');
    if (row && !fields) { row.scrollIntoView({ block: "center" }); row.querySelector('[data-p="name"]').focus(); }
  }

  /* ---------- Settings, backup ---------- */
  var settingsSaveSoon = debounce(function () { save(); showNextNumber(); }, 400);
  function fillSettings() {
    $$("[data-s]").forEach(function (el) {
      var v = getPath(state.settings, el.getAttribute("data-s"));
      if (el.type === "checkbox") el.checked = !!v; else el.value = v === undefined ? "" : v;
    });
    showNextNumber();
    $("#last-backup").textContent = state.lastBackup ? "Last backup: " + niceDate(state.lastBackup.slice(0, 10)) + "." : "No backup saved yet.";
  }
  function showNextNumber() {
    $("#next-number-preview").textContent = "Next quote number: " + formatNumber(state.settings.prefix, num(state.settings.nextNumber) || 1);
  }
  function exportData() {
    state.lastBackup = new Date().toISOString(); save();
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mesh-owners-backup-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    fillSettings();
    toast("Backup saved");
  }
  $("#import-file").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (err) { toast("That file isn't a Mesh backup"); return; }
      if (!data || (!Array.isArray(data.quotes) && !Array.isArray(data.prices))) { toast("That file isn't a Mesh backup"); return; }
      var qs = (data.quotes || []).map(normaliseQuote), ps = (data.prices || []).map(normalisePrice);
      if (!confirm("Combine this backup (" + qs.length + " quotes, " + ps.length + " price items) with what's on this device?")) return;
      var added = 0, updated = 0;
      qs.forEach(function (q) {
        var mine = findQuote(q.id);
        if (!mine) { state.quotes.push(q); added++; }
        else if (q.updated > mine.updated) { state.quotes[state.quotes.indexOf(mine)] = q; updated++; }
      });
      ps.forEach(function (p) {
        var idx = -1;
        state.prices.forEach(function (x, i) { if (x.id === p.id) idx = i; });
        if (idx === -1) state.prices.push(p);
        else if (p.updated > state.prices[idx].updated) state.prices[idx] = p;
      });
      if (data.settings) {
        var incoming = mergeSettings(data.settings);
        state.settings.nextNumber = Math.max(num(state.settings.nextNumber), num(incoming.nextNumber));
      }
      save(); fillSettings();
      toast("Imported: " + added + " new, " + updated + " updated");
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  /* ---------- Buttons ---------- */
  document.addEventListener("click", function (e) {
    var closer = e.target.closest("[data-close]");
    if (closer) { var d = closer.closest("dialog"); if (d) d.close(); }
    var b = e.target.closest("[data-action]"); if (!b) return;
    var action = b.getAttribute("data-action"), q = current();
    if (action === "new-quote") newQuote();
    else if (action === "add-line") addLine();
    else if (action === "open-picker") { $("#picker-search").value = ""; renderPicker(); $("#picker").showModal(); }
    else if (action === "preview") { $("#preview-doc").innerHTML = quoteHtml(q); $("#quote-doc").innerHTML = quoteHtml(q); $("#preview").showModal(); }
    else if (action === "print") { $("#quote-doc").innerHTML = quoteHtml(q); window.print(); }
    else if (action === "email") emailCustomer();
    else if (action === "duplicate") {
      var s = state.settings, now = new Date().toISOString();
      var copy = normaliseQuote(clone(q));
      copy.id = uid(); copy.number = formatNumber(s.prefix, s.nextNumber); copy.status = "draft";
      copy.created = now; copy.updated = now; copy.date = today();
      copy.items.forEach(function (it) { it.id = uid(); });
      s.nextNumber = num(s.nextNumber) + 1;
      state.quotes.push(copy); save();
      location.hash = "quote/" + copy.id;
      toast("Copied as " + copy.number);
    }
    else if (action === "delete") {
      if (!confirm("Delete quote " + q.number + "? This can't be undone.")) return;
      state.quotes = state.quotes.filter(function (x) { return x.id !== q.id; });
      save(); location.hash = "quotes"; toast("Quote deleted");
    }
    else if (action === "add-price") addPrice();
    else if (action === "starter-prices") {
      STARTER_ITEMS.forEach(function (s) { state.prices.push(normalisePrice({ name: s[0], category: s[1], unit: s[2], price: 0, cost: "" })); });
      save(); renderPrices(); toast("Added example items. Fill in your prices.");
    }
    else if (action === "export") exportData();
    else if (action === "wipe") {
      if (!confirm("Delete all quotes, prices and settings on this device? Save a backup first if you might need them.")) return;
      if (!confirm("Are you sure? This can't be undone.")) return;
      state = blankState(); save(); fillSettings(); toast("Everything on this device was deleted");
    }
  });
  // Close dialogs when tapping the dark backdrop.
  $$("dialog").forEach(function (d) {
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
  });

  /* ---------- Start ---------- */
  if (!storageOk) $("#storage-warning").hidden = false;
  route();
})();
