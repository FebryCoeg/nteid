// ============================================================
//  ARSIP HETHEREAU — database Neverness to Everness (Bahasa Indonesia)
//  SPA tanpa framework: router URL bersih, data JSON dari /nte/data/
// ============================================================
(() => {
  "use strict";
  const BASE = "/nte/";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#main");
  // pendengar event pada #main otomatis dilepas saat pindah halaman (mencegah handler ganda)
  let routeCtl = new AbortController();
  const rawAdd = main.addEventListener.bind(main);
  main.addEventListener = (type, fn, opt) => rawAdd(type, fn, { ...(typeof opt === "object" ? opt : { capture: !!opt }), signal: routeCtl.signal });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const img = (p) => (p ? BASE + p : "");
  // teks dari build sudah aman: hanya <b>, <i>, dan entity; tetap disaring sekali lagi
  const rich = (s) => String(s ?? "").replace(/<(?!\/?(b|i)>)/g, "&lt;");
  const elClass = (e) => "el-" + String(e || "").toLowerCase();

  const LINK = { donate: "https://trakteer.id/febrycoeg", community: "https://discord.gg/E2am3akPBB" };
  const QCOLOR = { 1: "Abu-abu", 2: "Hijau", 3: "Biru", 4: "Ungu", 5: "Emas", 6: "Merah" };
  const LABELS = {
    id: {
      element: { Cosmos: "Cosmos", Anima: "Anima", Incantation: "Incantation", Chaos: "Chaos", Psyche: "Psyche", Lakshana: "Lakshana" },
      group: { basic: "Serangan Dasar", reflexive: "Respons Refleks", redirect: "Redirect Skill", ultimate: "Ultimate", support: "Support Skill", passive: "Pasif" },
      rarity: { 1: "Biasa", 2: "Umum", 3: "Langka", 4: "Epik", 5: "Legendaris", 6: "Mitos" },
      vehicleKind: { Car: "Mobil", Motorcycle: "Motor", Bike: "Motor", Boat: "Kapal", Ship: "Kapal", Plane: "Pesawat" },
      source: { Shop: "Toko", Quest: "Misi", Activity: "Event", Gacha: "Gacha", Default: "Bawaan" },
      fstat: { Comfort: "Kenyamanan", Fortune: "Keberuntungan", Love: "Kehangatan", Collect: "Nilai koleksi" },
    },
    en: {
      element: { Cosmos: "Cosmos", Anima: "Anima", Incantation: "Incantation", Chaos: "Chaos", Psyche: "Psyche", Lakshana: "Lakshana" },
      group: { basic: "Basic Attack", reflexive: "Reflexive", redirect: "Redirect Skill", ultimate: "Ultimate", support: "Support Skill", passive: "Passive" },
      rarity: { 1: "Common", 2: "Uncommon", 3: "Rare", 4: "Epic", 5: "Legendary", 6: "Mythic" },
      vehicleKind: { Car: "Car", Motorcycle: "Motorcycle", Bike: "Motorcycle", Boat: "Boat", Ship: "Ship", Plane: "Plane" },
      source: { Shop: "Shop", Quest: "Quest", Activity: "Event", Gacha: "Gacha", Default: "Default" },
      fstat: { Comfort: "Comfort", Fortune: "Fortune", Love: "Warmth", Collect: "Collection value" },
    },
  };
  // LABEL.<jenis> selalu mengikuti bahasa yang sedang dipilih
  const LABEL = new Proxy({}, { get: (_, k) => LABELS[typeof LANG !== "undefined" && LANG === "en" ? "en" : "id"][k] });


  // ---------------- data ----------------
  const cache = {};
  // versi file data mengikuti ?v= pada app.js, supaya data lama di cache browser tidak terpakai
  const DATA_V = (() => { try { return new URL(document.querySelector('script[src*="app.js"]').src).searchParams.get("v") || ""; } catch (e) { return ""; } })();
  const ver = DATA_V ? "?v=" + DATA_V : "";
  let enIndex = null;
  const getEnIndex = () => (enIndex ||= fetch(`${BASE}data/en/_index.json${ver}`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
  const load = async (name) => {
    const en = typeof LANG !== "undefined" && LANG === "en" && (await getEnIndex()).includes(name);
    const key = (en ? "en/" : "") + name;
    return (cache[key] ||= fetch(`${BASE}data/${key}.json${ver}`).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }));
  };

  // ---------------- tema & menu ----------------
  if ($(".theme-toggle")) $(".theme-toggle").onclick = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("nte-theme", root.dataset.theme); } catch (e) {}
  };

  let lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = "hidden";
    const f = el.querySelector("input, [data-close].icon-btn, a, button");
    setTimeout(() => f && f.focus(), 30);
  }
  function closeLayer(el) {
    if (el.hidden) return;
    el.hidden = true;
    if (!$$(".drawer:not([hidden]), .search:not([hidden]), .sheet:not([hidden])").length) document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$(".drawer, .search, .sheet").forEach((el) => el.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeLayer(el); }));
  $(".menu-open").onclick = () => { openLayer($("#drawer")); $(".menu-open").setAttribute("aria-expanded", "true"); };
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { ["#sheet", "#search", "#drawer"].map((s) => $(s)).find((el) => !el.hidden && (closeLayer(el), true)); $(".menu-open").setAttribute("aria-expanded", "false"); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
    if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  const langBtn = $(".lang-toggle");

  // ---------------- router ----------------
  const routes = [
    [/^\/$/, viewHome],
    [/^\/admin\/319bc261be073d2a\/?$/, viewAdmin],
    [/^\/esper\/?$/, viewEsperList],
    [/^\/esper\/([\w-]+)\/?$/, viewEsper],
    [/^\/arc\/?$/, viewArcList],
    [/^\/arc\/([\w-]+)\/?$/, viewArc],
    [/^\/modul\/?$/, viewModules],
    [/^\/item\/?$/, viewItems],
    [/^\/furnitur\/?$/, viewFurniture],
    [/^\/kendaraan\/?$/, viewVehicles],
    [/^\/properti\/?$/, viewProperty],
    [/^\/cerita\/?$/, viewStory],
    [/^\/anomali\/?$/, viewAnomalies],
    [/^\/istilah\/?$/, viewGlossary],
    [/^\/pencapaian\/?$/, viewAchievements],
    [/^\/fashion\/?$/, viewFashion],
    [/^\/makanan\/?$/, viewFood],
    [/^\/tierlist\/?$/, viewTierlist],
    [/^\/versi\/?$/, viewVersions],
    [/^\/versi\/([\w.-]+)\/?$/, viewVersion],
  ];
  function go(url, replace) {
    if (replace) history.replaceState(null, "", url); else history.pushState(null, "", url);
    render();
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link], a[href^='/']");
    if (!a || a.target || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("/nte/")) return;
    e.preventDefault();
    closeLayer($("#drawer")); closeLayer($("#search"));
    if (href !== location.pathname + location.search) go(href);
  });
  addEventListener("popstate", render);

  async function render() {
    const path = location.pathname.replace(/\/index\.html$/, "/") || "/";
    $$(".top-nav a, .drawer-nav a").forEach((a) => {
      const h = a.getAttribute("href");
      a.classList.toggle("active", h === "/" ? path === "/" : path.startsWith(h));
    });
    closeLayer($("#sheet"));
    routeCtl.abort(); routeCtl = new AbortController();
    if (langBtn) langBtn.hidden = false;
    const r = routes.find(([rx]) => rx.test(path));
    main.innerHTML = `<div class="loading">${S("MEMBUKA ARSIP…", "OPENING ARCHIVE…")}</div>`;
    scrollTo(0, 0);
    try {
      if (!r) return notFound();
      await r[1](...path.match(r[0]).slice(1));
    } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="empty">${S("Arsip gagal dimuat. Coba muat ulang halaman.", "Failed to load the archive. Please reload the page.")}</div>`;
    }
    main.focus({ preventScroll: true });
  }
  function setTitle(t) { document.title = t ? `${t} | ${S("Arsip Hethereau", "Hethereau Archive")}` : S("Arsip Hethereau | Database Neverness to Everness Bahasa Indonesia", "Hethereau Archive | Neverness to Everness Database"); }
  function notFound() {
    setTitle(S("Tidak ditemukan", "Not found"));
    main.innerHTML = `<div class="empty"><h2>${S("Arsip tidak ditemukan", "Archive not found")}</h2><p style="margin-top:8px">${S("Halaman yang kamu cari tidak ada.", "The page you are looking for does not exist.")} <a href="/" data-link>${S("Kembali ke beranda", "Back to home")}</a>.</p></div>`;
  }

  // ---------------- dialog & notifikasi buatan sendiri ----------------
  function ask(msg, yes, no) {
    return new Promise((resolve) => {
      const box = document.createElement("div");
      box.className = "dlg";
      box.innerHTML = `<div class="dlg-scrim"></div><div class="dlg-box" role="alertdialog" aria-modal="true"><p>${esc(msg)}</p><div class="dlg-btns"><button type="button" class="btn ghost" data-r="0">${esc(no || S("Batal", "Cancel"))}</button><button type="button" class="btn" data-r="1">${esc(yes || S("Ya", "Yes"))}</button></div></div>`;
      const done = (v) => { box.remove(); document.removeEventListener("keydown", key, true); resolve(v); };
      const key = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(false); } };
      box.addEventListener("click", (e) => { const b = e.target.closest("[data-r]"); if (b) done(b.dataset.r === "1"); else if (e.target.classList.contains("dlg-scrim")) done(false); });
      document.addEventListener("keydown", key, true);
      document.body.appendChild(box);
      box.querySelector('[data-r="1"]').focus();
    });
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2600);
    setTimeout(() => t.remove(), 3100);
  }

  // ---------------- komponen kecil ----------------
  const stars = (n) => `<span class="stars">${"★".repeat(Math.max(1, n))}</span>`;
  const head = (crumb, title, desc, count) => `
    <div class="page-head">
      <div>
        <div class="crumb mono"><a href="/" data-link>${S("ARSIP", "ARCHIVE")}</a><span>/</span><span>${esc(crumb)}</span></div>
        <h1>${esc(title)}</h1>
        ${desc ? `<p>${desc}</p>` : ""}
      </div>
      ${count != null ? `<span class="count-tag" id="countTag">${count} ${S("ENTRI", "ENTRIES")}</span>` : ""}
    </div>`;
  function filterBox(placeholder) {
    return `<input class="filter-input" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" autocomplete="off" />`;
  }
  function chips(list, key, current, all = S("Semua", "All")) {
    return `<div class="chips" data-key="${key}">
      <button class="chip" type="button" data-v="" aria-pressed="${!current}">${all}</button>
      ${list.map((x) => `<button class="chip ${x.cls || ""}" type="button" data-v="${esc(x.v)}" aria-pressed="${current === x.v}">${x.dot ? '<span class="dot"></span>' : ""}${x.icon ? `<img src="${img(x.icon)}" alt="">` : ""}${esc(x.label)}</button>`).join("")}
    </div>`;
  }
  // filter sederhana: state di URL (?q=&el=…) supaya bisa dibagikan
  function useFilters(onChange) {
    const params = new URLSearchParams(location.search);
    const state = Object.fromEntries(params);
    const input = $(".filter-input", main);
    if (input) {
      input.value = state.q || "";
      let t;
      input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = input.value.trim(); sync(); }, 120); });
    }
    $$(".chips", main).forEach((box) => box.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      state[box.dataset.key] = b.dataset.v;
      $$(".chip", box).forEach((c) => c.setAttribute("aria-pressed", c === b));
      sync();
    }));
    function sync() {
      const p = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => v && p.set(k, v));
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
      onChange(state);
    }
    onChange(state);
    return state;
  }
  const match = (q, ...fields) => !q || fields.some((f) => String(f || "").toLowerCase().includes(q.toLowerCase()));
  function setCount(n) { const c = $("#countTag"); if (c) c.textContent = `${n} ${S("ENTRI", "ENTRIES")}`; }

  // ---------------- BERANDA ----------------
  let kvTimer = null;
  async function viewHome() {
    setTitle("");
    const home = await load("home");
    const espers = home.roster, N = home.counts;
    const picks = ["elyms", "exe", "chaos", "linko", "iroi", "crimson"].map((s) => espers.find((e) => e.slug === s)).filter(Boolean).slice(0, 3);
    while (picks.length < 3 && espers[picks.length]) picks.push(espers[picks.length]);
    const thumbs = (k) => (home.thumbs[k] || []).map((x) => `<img src="${img(x)}" alt="" loading="lazy">`).join("");
    const cats = [
      ["/esper", "01", S("Esper", "Espers"), S("Karakter, skill, awakening, dan arsip cerita", "Characters, skills, awakenings & lore"), N.esper, thumbs("esper")],
      ["/arc", "02", S("Arc", "Arcs"), S("Efek per tingkat bintang ★1–★5", "Effects across ★1–★5 stars"), N.arc, thumbs("arc")],
      ["/modul", "03", S("Modul", "Modules"), S("Set modul dan bonus 2/4 keping", "Module sets & 2/4-piece set bonuses"), N.modul, thumbs("modul")],
      ["/item", "04", S("Item", "Items"), S("Material, hadiah, koleksi, dan lainnya", "Materials, gifts, collectibles & more"), N.item, thumbs("item")],
      ["/furnitur", "05", S("Furnitur", "Furniture"), S("Isi rumahmu di Hethereau", "Decorate your home in Hethereau"), N.furnitur, thumbs("furnitur")],
      ["/kendaraan", "06", S("Kendaraan", "Vehicles"), S("Mobil dan motor beserta mereknya", "Cars & bikes by brand"), N.kendaraan, thumbs("kendaraan")],
      ["/properti", "07", S("Properti", "Property"), S("Apartemen dan rumah yang bisa dibeli", "Buyable apartments & houses"), N.properti, thumbs("properti")],
      ["/cerita", "08", S("Cerita", "Story"), S("Ringkasan bab utama dan spinoff", "Main story & spinoff recaps"), N.cerita, thumbs("cerita")],
      ["/anomali", "09", S("Anomali", "Anomalies"), S("Arsip Anomaly, monster, dan boss", "Anomaly files, monsters & bosses"), N.anomali, thumbs("anomali")],
      ["/istilah", "10", S("Istilah", "Glossary"), S("Istilah resmi dunia NTE", "Official NTE terminology"), N.istilah, ""],
      ["/pencapaian", "11", S("Pencapaian", "Achievements"), S("Medali, syarat, hadiah, dan penanda progres", "Medals, requirements, rewards & progress tracker"), N.pencapaian, thumbs("pencapaian")],
      ["/fashion", "12", "Fashion", S("Kostum Esper dan ilustrasinya", "Esper outfits & illustrations"), N.fashion, thumbs("fashion")],
      ["/makanan", "13", S("Makanan", "Food"), S("Makanan, efek buff, dan bahan masak", "Dishes, buffs & ingredients"), N.makanan, thumbs("makanan")],
      ["/versi", "15", S("Versi & Patch", "Versions & Patches"), S("Isi tiap update: Esper, Arc, event, dan perbaikan", "What each update adds: Espers, Arcs, events & fixes"), "", ""],
      ["/tierlist", "14", "Tier List", S("Buat tier list-mu sendiri, simpan, dan bagikan sebagai gambar", "Make your own tier list, save it and share it as an image"), "", thumbs("esper")],
    ];
    const bgs = (home && home.bg) || [];
    main.innerHTML = `
      <section class="kv">
        <div class="kv-bg">${bgs.map((b, i) => `<img src="${img(b)}" alt="" class="${i === 0 ? "on" : ""}" ${i ? 'loading="lazy"' : ""}>`).join("")}</div>
        <div class="kv-fx" aria-hidden="true"></div>
        <div class="kv-inner">
          <span class="kv-tag">${S("DATABASE FAN-MADE", "FAN-MADE DATABASE")} · NEVERNESS TO EVERNESS</span>
          <h1 class="glitch" data-text="HETHEREAU"><span>HETHEREAU</span></h1>
          <p>${S("Esper, Arc, Modul, Item, Cerita, Anomali, Pencapaian, sampai Makanan. Semua data langsung dari file game, lengkap dalam Bahasa Indonesia.", "Espers, Arcs, Modules, Items, Story, Anomalies, Achievements and Food, straight from the game files.")}</p>
          <div class="kv-btns">
            <a class="kbtn cyan" href="/esper" data-link><b>${S("Jelajahi Database", "Explore Database")}</b><small>ESPER · ARC · ITEM</small></a>
            <a class="kbtn violet" href="${LINK.community}" target="_blank" rel="noopener"><b>${S("Join Komunitas", "Join Community")}</b><small>DISCORD NTE INDONESIA</small></a>
            <a class="kbtn pink" href="${LINK.donate}" target="_blank" rel="noopener"><b>Donate</b><small>TRAKTEER</small></a>
          </div>
          <div class="home-stats">
            <div><b>${N.esper}</b><span>Esper</span></div>
            <div><b>${N.arc}</b><span>Arc</span></div>
            <div><b>${home.stats.anomali}</b><span>${S("Anomali", "Anomalies")}</span></div>
            <div><b>${N.pencapaian}</b><span>${S("Pencapaian", "Achievements")}</span></div>
          </div>
        </div>
      </section>

      <section class="roster" id="showcase">
        <div class="ro-deco" aria-hidden="true"><span>NEVERNESS TO EVERNESS</span><span>ESPER FILES</span><span>HETHEREAU</span></div>
        ${bgs[1] ? `<div class="ro-band" aria-hidden="true"><img src="${img(bgs[1])}" alt="" loading="lazy"></div>` : ""}
        <div class="ro-glyph" id="roGlyph" aria-hidden="true"></div>
        <div class="ro-rail">
          <button class="ro-arrow" type="button" data-dir="-1" aria-label="${S("Esper sebelumnya", "Previous Esper")}"><svg viewBox="0 0 24 24"><path d="M12 19V6M6 11l6-6 6 6"/></svg></button>
          <div class="ro-list" id="scList">${espers.map((e, i) => `<button type="button" data-i="${i}" class="${elClass(e.element)}" aria-label="${esc(e.name)}"><img src="${img(e.icon)}" alt="" loading="lazy"></button>`).join("")}</div>
          <button class="ro-arrow" type="button" data-dir="1" aria-label="${S("Esper berikutnya", "Next Esper")}"><svg viewBox="0 0 24 24"><path d="M12 5v13M6 13l6 6 6-6"/></svg></button>
        </div>
        <div class="ro-info">
          <div class="ro-name"><span class="ro-rank" id="scRank"><b></b><small>RANK</small></span><h2 id="scName"></h2><img id="scType" alt=""></div>
          <div class="ro-line"><i></i></div>
          <p class="ro-quote" id="scQuote"></p>
          <div class="ro-desc txt" id="scDesc"></div>
          <div class="ro-meta"><div class="tags" id="scTags"></div><a class="btn" id="scLink" data-link>${S("Buka berkas →", "Open file →")}</a></div>
        </div>
        <div class="ro-art"><img id="scImg" alt=""></div>
      </section>

      <div class="section-title"><h2>${S("Indeks arsip", "Archive index")}</h2><span class="mono">${cats.length} ${S("KATEGORI", "CATEGORIES")}</span></div>
      <div class="cat-grid">
        ${cats.map(([href, n, t, d, c, th]) => `<a class="cat-card" href="${href}" data-link><i>${n}</i><div class="cat-thumbs">${th}</div><h3>${t}</h3><p>${d}</p><span class="num">${c}</span></a>`).join("")}
      </div>

      <section class="cta-band">
        <div>
          <h2>${S("Dukung Arsip Hethereau", "Support Hethereau Archive")}</h2>
          <p>${S("Arsip ini dibuat dan diterjemahkan secara sukarela. Dukunganmu membantu arsip terus diperbarui setiap ada versi baru. Ngobrol dan berbagi tips bareng pemain lain di komunitas NTE Indonesia.", "This archive is built and translated voluntarily. Your support keeps it updated with every new version. Chat and share tips with other players in the NTE Indonesia community.")}</p>
        </div>
        <div class="kv-btns">
          <a class="kbtn pink" href="${LINK.donate}" target="_blank" rel="noopener"><b>Donate</b><small>TRAKTEER</small></a>
          <a class="kbtn violet" href="${LINK.community}" target="_blank" rel="noopener"><b>${S("Join Komunitas", "Join Community")}</b><small>DISCORD</small></a>
        </div>
      </section>`;

    // latar berganti seperti layar loading game
    clearInterval(kvTimer);
    const slides = $$(".kv-bg img", main);
    if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let k = 0;
      kvTimer = setInterval(() => {
        if (!document.body.contains(slides[0])) return clearInterval(kvTimer);
        slides[k].classList.remove("on"); k = (k + 1) % slides.length; slides[k].classList.add("on");
      }, 6000);
    }
    // etalase Esper (rail ikon bulat + panah, seperti halaman karakter situs resmi)
    let cur = 0;
    const pick = (i) => {
      cur = (i + espers.length) % espers.length;
      const e = espers[cur];
      const art = $("#scImg");
      art.classList.remove("in"); void art.offsetWidth;
      art.src = img(e.portrait || e.icon); art.alt = e.name; art.classList.add("in");
      $("#scName").textContent = e.name;
      $("#scRank b").textContent = e.rank;
      $("#scRank").className = `ro-rank rank-${e.rank}`;
      $("#scType").src = e.arcTypeIcon ? img(e.arcTypeIcon) : ""; $("#scType").hidden = !e.arcTypeIcon;
      $("#roGlyph").textContent = e.name.toUpperCase();
      $("#scQuote").innerHTML = rich(e.intro || e.title || "");
      $("#scDesc").innerHTML = rich(e.desc || "").split("\n").filter(Boolean).map((t) => `<p>${t}</p>`).join("");
      $("#scDesc").scrollTop = 0;
      $("#scTags").innerHTML = `<span class="tag"><span class="dot"></span>${esc(e.element)}</span><span class="tag">${e.arcTypeIcon ? `<img src="${img(e.arcTypeIcon)}" alt="">` : ""}Arc ${esc(e.arcType)}</span>`;
      $("#scLink").setAttribute("href", `/esper/${e.slug}`);
      $("#showcase").className = `roster ${elClass(e.element)}`;
      $$("#scList button").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.i === cur));
      const btn = $(`#scList button[data-i="${cur}"]`), list = $("#scList");
      if (btn) {
        const vertical = list.scrollHeight > list.clientHeight + 4;
        if (vertical) list.scrollTo({ top: btn.offsetTop - list.clientHeight / 2 + btn.offsetHeight / 2, behavior: "smooth" });
        else list.scrollTo({ left: btn.offsetLeft - list.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
      }
    };
    $("#scList").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) pick(+b.dataset.i); });
    $$(".ro-arrow", main).forEach((b) => (b.onclick = () => pick(cur + +b.dataset.dir)));
    pick(Math.max(0, espers.findIndex((e) => e.slug === (picks[0] || {}).slug)));
  }

  // ---------------- ESPER ----------------
  function esperCard(e) {
    return `<a class="esper-card ${elClass(e.element)}" href="/esper/${e.slug}" data-link>
      <div class="esper-art">
        <span class="stamp rank-${e.rank}">${e.rank}</span>
        <img src="${img(e.portrait || e.icon)}" alt="" loading="lazy">
      </div>
      <div class="esper-meta"><b>${esc(e.name)}</b><small><span class="dot"></span>${esc(e.element)} · ${esc(e.arcType)}</small></div>
    </a>`;
  }
  async function viewEsperList() {
    setTitle(S("Esper", "Espers"));
    const list = await load("espers");
    const els = [...new Set(list.map((e) => e.element))];
    const types = [...new Map(list.map((e) => [e.arcType, e.arcTypeIcon])).entries()].filter(([t]) => t);
    main.innerHTML = head(S("ESPER", "ESPERS"), S("Esper", "Espers"), S("Semua karakter yang bisa dimainkan. Pilih satu untuk membuka berkasnya: skill, awakening, profil, dan cerita.", "Every playable character. Pick one to open its file: skills, awakenings, profile and story."), list.length) + `
      <div class="toolbar">
        ${filterBox(S("Cari nama Esper…", "Search Esper names…"))}
        ${chips(els.map((x) => ({ v: x, label: x, dot: true, cls: elClass(x) })), "el")}
        <span class="chip-sep"></span>
        ${chips([{ v: "S", label: "Rank S" }, { v: "A", label: "Rank A" }], "rank")}
        <span class="chip-sep"></span>
        ${chips(types.map(([t, i]) => ({ v: t, label: t, icon: i })), "type", undefined, S("Semua tipe", "All types"))}
      </div>
      <div class="esper-grid" id="grid"></div>`;
    useFilters((s) => {
      const out = list.filter((e) => match(s.q, e.name, e.title) && (!s.el || e.element === s.el) && (!s.rank || e.rank === s.rank) && (!s.type || e.arcType === s.type));
      $("#grid").innerHTML = out.length ? out.map(esperCard).join("") : `<div class="empty">${S("Tidak ada Esper yang cocok.", "No matching Espers.")}</div>`;
      setCount(out.length);
    });
  }
  const ICO = {
    hp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z"/></svg>',
    atk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-8 7 8M5 20l7-8 7 8"/></svg>',
    def: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l7 2.6v5.6c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6.1z"/></svg>',
    crit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 6.2 6.4.6-4.9 4.3 1.5 6.4L12 17l-5.6 3.5 1.5-6.4L3 9.8l6.4-.6z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z"/></svg>',
  };
  const accordion = (cards) => cards.map((c, i) => `<section class="skillcard pf${c.open ? " open" : ""}">
        <button class="skill-top" type="button" aria-expanded="${!!c.open}">
          <span class="skill-ico">${c.icon || ICO.chat}</span>
          <span class="skill-title"><b>${esc(c.title)}</b>${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</span>
          <span class="skill-chev">${ICO.chev}</span>
        </button>
        <div class="skill-body">${c.body}</div>
      </section>`).join("");
  const nf = (n) => Number(n).toLocaleString("id-ID");
  const statRow = (k, label, id, val) => `<div class="srow"><i>${ICO[k]}</i><span>${label}</span><b${id ? ` id="${id}"` : ""}>${val === undefined ? "" : val}</b></div>`;
  function levelBox(len, rows) {
    return `<div class="statbox">
      <div class="stat-lv"><span class="mono">LEVEL</span><b id="lvNum">${len}</b><input type="range" id="lvRange" min="1" max="${len}" value="${len}" aria-label="Level"></div>
      <div class="srows">${rows}</div></div>`;
  }
  function matTiles(list, items) {
    return `<div class="matrow">${list.filter(([id]) => items[id]).map(([id, n]) => {
      const it = items[id];
      return `<div class="mat q${it.rarity || 1}" title="${esc(it.name)}"><img src="${img(it.icon)}" alt="${esc(it.name)}" loading="lazy"><small>${esc(it.name)}</small><b>${nf(n)}</b></div>`;
    }).join("")}</div>`;
  }
  function matBox(mats, items, title) {
    const list = (mats || []).filter(([id]) => items[id]);
    if (!list.length) return "";
    return `<div class="matbox"><span class="mono">${title}</span><div class="matrow">${list.map(([id, n]) => {
      const it = items[id];
      return `<div class="mat q${it.rarity || 1}" title="${esc(it.name)}"><img src="${img(it.icon)}" alt="${esc(it.name)}" loading="lazy"><small>${esc(it.name)}</small><b>${nf(n)}</b></div>`;
    }).join("")}</div></div>`;
  }

  async function viewEsper(slug) {
    const list = await load("espers");
    const e = list.find((x) => x.slug === slug);
    if (!e) return notFound();
    setTitle(e.name);
    const p = e.profile || {};
    const SD = await load("stats");
    const ST = SD.espers[e.id];
    const outfits = (await load("fashion")).filter((f) => f.char === e.name);
    const facts = [[S("Faksi", "Faction"), p.faction], [S("Ulang tahun", "Birthday"), p.birthday], [S("Kemampuan Esper", "Esper Ability"), p.esperAbility], [S("Pekerjaan", "Occupation"), p.occupation], [S("Kesukaan", "Favorite"), p.food]].filter(([, v]) => v);
    const looks = outfits.map((f) => ({ name: tx(f.name), src: f.image || f.fallback })).filter((l) => l.src);
    const heroSrc = e.portrait || e.icon;
    if (!looks.some((l) => l.src === heroSrc)) looks.unshift({ name: S("Kostum awal", "Default outfit"), src: heroSrc });
    let lookIdx = Math.max(0, looks.findIndex((l) => l.src === heroSrc));
    const AF = ST && ST.affinity;
    const BUILDS = await load("builds").catch(() => ({}));
    const ARCS = await load("arcs");
    const MODS = await load("modules");
    const tabs = [
      ["skill", S("Kemampuan", "Abilities"), e.skills.length],
      ["awakening", "Awakening", e.awakening.length],
      ["affinity", "Affinity", AF ? 1 : 0],
      ["build", "Build", e.console.length],
      ["kosmetik", S("Kostum", "Outfits"), outfits.length],
      ["profil", S("Profil", "Profile"), p.intro || p.impression || (p.stories || []).length ? 1 : 0],
    ].filter(([, , n]) => n);
    main.innerHTML = `
      <div class="crumb mono"><a href="/" data-link>${S("ARSIP", "ARCHIVE")}</a><span>/</span><a href="/esper" data-link>${S("ESPER", "ESPERS")}</a><span>/</span><span>${esc(e.name.toUpperCase())}</span></div>
      <article class="dossier ${elClass(e.element)}">
        <div class="dossier-art">
          <span class="stamp rank-${e.rank}">${e.rank}</span>
          <img id="heroImg" src="${img(heroSrc)}" alt="${esc(e.name)}">
          ${looks.length > 1 ? `<div class="outfit-bar"><span id="lookName"></span><button type="button" id="lookPrev" aria-label="${S("Kostum sebelumnya", "Previous outfit")}">‹</button><button type="button" id="lookNext" aria-label="${S("Kostum berikutnya", "Next outfit")}">›</button></div>` : ""}
        </div>
        <div>
          <div class="dossier-head">
            <span class="mono">${esc(e.title || "Esper")}</span>
            <h1>${esc(e.name)}</h1>
          </div>
          <div class="tags">
            <span class="tag"><span class="dot"></span>${esc(e.element)}</span>
            <span class="tag">${e.arcTypeIcon ? `<img src="${img(e.arcTypeIcon)}" alt="">` : ""}Arc ${esc(e.arcType)}</span>
            <span class="tag">Rank ${e.rank}</span>
          </div>
          ${e.desc ? `<p class="lede txt">${rich(e.desc)}</p>` : ""}
          ${ST && ST.tags.length ? `<div class="roles"><span class="mono">PERAN TEMPUR</span>${ST.tags.map((t) => `<b>${esc(t)}</b>`).join("")}</div>` : ""}
          ${facts.length ? `<dl class="info">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
          ${ST ? levelBox(ST.hp.length, statRow("hp", "HP", "stHp") + statRow("atk", "ATK", "stAtk") + statRow("def", "DEF", "stDef") + statRow("crit", "CRIT Rate", "", Math.round(ST.crit * 100) + "%") + statRow("crit", "CRIT DMG", "", Math.round(ST.critDmg * 100) + "%")) : ""}
          ${ST ? matBox(ST.mats, SD.items, S("MATERIAL ASCENSION · LV.1 → 80", "ASCENSION MATERIALS · LV.1 → 80")) : ""}
          <div class="tabs" role="tablist">${tabs.map(([id, t], i) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${i === 0}">${t}</button>`).join("")}</div>
          <div id="tabBody" class="tab-panel"></div>
        </div>
      </article>`;
    const icons = (ST && ST.icons) || {};
    const skillCards = () => {
      const order = [];
      e.skills.filter((s) => !/^Deskripsi /.test(s.desc)).forEach((s) => {
        let g = order.find((x) => x.k === s.group);
        if (!g) order.push((g = { k: s.group, list: [] }));
        g.list.push(s);
      });
      const cards = [];
      const SK = (ST && ST.skills) || {};
      order.forEach((g) => {
        const type = LABEL.group[g.k] || g.k;
        if (g.k === "passive") {
          g.list.forEach((s, i) => cards.push({ icon: (icons.passive || [])[i], name: s.name, type, body: [s] , single: true }));
          return;
        }
        const first = g.list[0];
        const sum = g.list.length > 1 && /^[^\n]{1,48}:/.test(first.desc) && first.desc.includes("\n");
        const lv = SK[g.k];
        if (sum) cards.push({ g: g.k, lv, icon: icons[g.k], name: first.name, type, body: g.list.slice(1) });
        else if (g.list.length === 1) cards.push({ g: g.k, lv, icon: icons[g.k], name: first.name, type, body: [first], single: true });
        else cards.push({ g: g.k, lv, icon: icons[g.k], name: first.name, type, body: g.list });
      });
      return cards.map((c, i) => `<section class="skillcard${i === 0 ? " open" : ""}">
        <button class="skill-top" type="button" aria-expanded="${i === 0}">
          <span class="skill-ico">${c.icon ? `<img src="${img(c.icon)}" alt="" loading="lazy">` : ""}</span>
          <span class="skill-title"><b>${esc(c.name)}</b><small>${esc(c.type)}</small></span>
          <span class="skill-chev">${ICO.chev}</span>
        </button>
        <div class="skill-body">${c.body.map((s) => `<div class="sk">${c.single ? "" : `<h5>${esc(s.name)}</h5>`}<p class="txt">${rich(s.desc)}</p>${s.quote ? `<p class="quote">${rich(s.quote)}</p>` : ""}</div>`).join("")}${c.lv ? `<button type="button" class="sklv-toggle" aria-expanded="false"><span>${S("Tampilkan skala DMG & material", "Show DMG scaling & materials")}</span>${ICO.chev}</button><div class="sklv" data-g="${c.g}" hidden>
          <div class="sklv-top"><span class="mono">${S("LEVEL SKILL", "SKILL LEVEL")}</span><b class="sklv-num"></b><input type="range" min="1" max="${c.lv.cost.length + 1}" value="${c.lv.cost.length + 1}" aria-label="Level skill"><em class="sklv-max">MAX</em></div>
          <div class="sklv-mats"></div>
          <div class="sklv-rows"></div></div>` : ""}</div>
      </section>`).join("");
    };
    const panels = {
      skill: skillCards,
      kosmetik: () => `<div class="outfit-grid">${outfits.map((f, i) => `<figure class="outfit" data-i="${looks.findIndex((l) => l.src === (f.image || f.fallback))}" tabindex="0"><img src="${img(f.image || f.fallback)}" alt="" loading="lazy"><figcaption><b>${esc(tx(f.name))}</b><small>${esc(strip(tx(f.desc)))}</small></figcaption></figure>`).join("")}</div>`,
      affinity: () => {
        const it = (id) => SD.items[id];
        const price = (id) => {
          const pr = (SD.prices || {})[id]; if (!pr || !pr.length) return `<span class="mat-price none" title="${esc(S("Tidak dijual di toko, biasanya hadiah event atau misi", "Not sold in shops, usually an event or quest reward"))}">${S("Tidak dijual", "Not sold")}</span>`;
          const [cur, v] = pr[0], c = (SD.currencies || {})[cur] || { name: cur, icon: "" };
          if (c.event) return `<span class="mat-price event" title="${esc(S("Didapat dari event / mode khusus", "From an event / special mode"))}">${S("Dari event", "From event")}</span>`;
          return `<span class="mat-price" title="${esc(S("Harga di toko: ", "Shop price: ") + nf(v) + " " + c.name)}">${c.icon ? `<img src="${img(c.icon)}" alt="">` : ""}${nf(v)}<em>${esc(c.name)}</em></span>`;
        };
        const tile = (id, n, heart) => it(id) ? `<div class="mat q${it(id).rarity || 1}" title="${esc(it(id).name)}"><img src="${img(it(id).icon)}" alt="${esc(it(id).name)}" loading="lazy"><small>${esc(it(id).name)}</small><b>${heart ? ICO.heart : ""}${nf(n)}</b>${heart ? price(id) : ""}</div>` : "";
        return `${AF.bonus.length ? `<div class="af-bonus"><span class="mono">${S("BONUS AFFINITY", "AFFINITY BONUS")}</span>${AF.bonus.map(([k, v]) => `<b>${esc(k)} +${v}%</b>`).join("")}</div>` : ""}
          ${AF.gifts.length ? `<div class="af-sec"><h4>${S("Hadiah favorit", "Favorite gifts")}</h4><p class="mono">${S("Poin Affinity yang didapat per hadiah", "Affinity points per gift")}</p><div class="matrow gift-row">${AF.gifts.map(([id, n]) => tile(id, n, true)).join("")}</div></div>` : ""}
          <div class="af-sec"><h4>${S("Level Affinity", "Affinity levels")}</h4>
          ${AF.levels.map((l, i) => `<div class="af-lv"><div class="af-no"><i>${i + 1}</i><small>${nf(l.max)} ${S("poin", "pts")}</small></div><div class="matrow">${l.items.map(([id, n]) => tile(id, n, false)).join("")}</div></div>`).join("")}</div>`;
      },
      build: () => {
        const bd = BUILDS[e.slug];
        let html = "";
        if (bd && (bd.arcs.length || bd.sets.length || bd.stats.length || (bd.awks || []).length || (bd.skills || []).length)) {
          const arcOf = (sl) => ARCS.find((a) => a.slug === sl);
          html += `<div class="af-sec"><h4>${S("Build rekomendasi", "Recommended build")}</h4>
            ${bd.arcs.length ? `<p class="mono">${S("ARC (URUTAN PRIORITAS)", "ARC (BY PRIORITY)")}</p><div class="tile-grid">${bd.arcs.map(arcOf).filter(Boolean).map(arcTile).join("")}</div>` : ""}
            ${bd.sets.length ? `<p class="mono" style="margin-top:14px">${S("SET MODUL", "MODULE SETS")}</p>${bd.sets.map((x) => {
              const st = MODS.sets.find((m) => m.id === x.id); if (!st) return "";
              const bn = st.bonuses.find((b) => b.pieces === x.pieces) || st.bonuses[0];
              return `<div class="bd-set">${st.icon ? `<img src="${img(st.icon)}" alt="">` : ""}<div><b>${esc(st.name)} <em>${x.pieces}${S(" keping", "-pc")}</em></b><p class="txt">${rich(bn ? bn.text : "")}</p></div></div>`;
            }).join("")}` : ""}
            ${(bd.awks || []).length ? `<p class="mono" style="margin-top:14px">${S("AWAKENING YANG DISARANKAN (URUTAN PRIORITAS)", "RECOMMENDED AWAKENINGS (BY PRIORITY)")}</p><div class="bd-awks">${bd.awks.map((n, i) => { const a = e.awakening[n - 1]; return a ? `<div class="bd-awk-row"><i>${i + 1}</i>${a.icon ? `<img src="${img(a.icon)}" alt="">` : ""}<span><b>${esc(a.name)}</b><small>AWAKENING ${n}</small></span></div>` : ""; }).join("")}
              ${[3, 6].map((need, i) => bd.awks.length >= need && e.awakening[6 + i] ? `<div class="bd-awk-row extra"><i>✦</i>${e.awakening[6 + i].icon ? `<img src="${img(e.awakening[6 + i].icon)}" alt="">` : ""}<span><b>${esc(e.awakening[6 + i].name)}</b><small>${S("BONUS", "BONUS:")} ${need} ${S("AWAKENING AKTIF", "AWAKENINGS ACTIVE")}</small></span></div>` : "").join("")}</div>` : ""}
            ${(bd.skills || []).length ? `<p class="mono" style="margin-top:14px">${S("URUTAN NAIK LEVEL SKILL", "SKILL UPGRADE ORDER")}</p><div class="bd-skills">${bd.skills.map((g, i) => { const sk = e.skills.find((x) => x.group === g); return sk ? `<div class="bd-skill"><i>${i + 1}</i><span class="skill-ico">${icons[g] ? `<img src="${img(icons[g])}" alt="">` : ""}</span><span><b>${esc(sk.name)}</b><small>${esc(LABEL.group[g] || g)}</small></span></div>` : ""; }).join("")}</div>` : ""}
            ${bd.stats.length ? `<p class="mono" style="margin-top:14px">${S("STAT PRIORITAS", "PRIORITY STATS")}</p><div class="bd-stats">${bd.stats.map((t, i) => `<span><i>${i + 1}</i>${esc(t)}</span>`).join("")}</div>` : ""}
          </div>`;
        }
        return html + `<div class="af-sec"><h4>${S("Efek Console", "Console effects")}</h4><p class="mono" style="margin-bottom:10px">${S("Efek tambahan yang terbuka lewat Console (空幕)", "Extra effects unlocked through the Console (空幕)")}</p>` + e.console.map((a) => `<div class="entry"><h4>${esc(a.name)}</h4><p class="txt">${rich(a.desc)}</p></div>`).join("") + `</div>`;
      },
      awakening: () => {
        const main6 = e.awakening.slice(0, 6), bonus = e.awakening.slice(6);
        const need = [3, 6];
        const card = (a, i, bn) => `<section class="skillcard awk${bn ? " extra locked" : ""}" data-i="${i}">
          <button class="skill-top" type="button" aria-expanded="false">
            <span class="skill-ico">${a.icon ? `<img src="${img(a.icon)}" alt="" loading="lazy">` : ""}</span>
            <span class="skill-title"><b>${esc(a.name)}</b><small>${bn ? S(`BONUS ${need[i - 6]} AWAKENING AKTIF`, `BONUS: ${need[i - 6]} AWAKENINGS ACTIVE`) : `AWAKENING ${i + 1}`}</small></span>
            ${bn ? `<span class="awk-lock mono"></span>` : `<span class="awk-pick" role="checkbox" aria-checked="false" aria-label="${S("Aktifkan", "Activate")}"></span>`}
            <span class="skill-chev">${ICO.chev}</span>
          </button>
          <div class="skill-body"><div class="sk"><p class="txt">${rich(a.desc)}</p></div></div>
        </section>`;
        return `<div class="awk-head"><p class="txt">${S("Di game ini ada 6 Awakening yang boleh kamu aktifkan dalam urutan bebas. Aktifkan 3 Awakening untuk membuka Bonus 3 Awakening Aktif, dan 6 untuk membuka Bonus 6 Awakening Aktif. Coba klik lingkaran di kanan tiap kartu.", "There are 6 Awakenings you can activate in any order. Activate 3 to unlock the 3-Awakening bonus and 6 for the 6-Awakening bonus. Try the circle on each card.")}</p>
          <div class="awk-count"><b id="awkN">0</b><span>/ 6 ${S("aktif", "active")}</span></div></div>
          ${main6.map((a, i) => card(a, i, false)).join("")}
          <div class="group-label">${S("Bonus Awakening", "Awakening bonus")}</div>
          ${bonus.map((a, i) => card(a, 6 + i, true)).join("")}`;
      },
      profil: () => {
        const cards = [];
        if (p.intro || p.quote) cards.push({ title: S("Ringkasan", "Summary"), sub: S("PROFIL", "PROFILE"), open: true, body: `${p.quote ? `<p class="lede txt" style="font-style:italic">${rich(p.quote)}</p>` : ""}${p.intro ? `<p class="txt" style="margin-top:10px">${rich(p.intro)}</p>` : ""}` });
        if (p.impression) cards.push({ title: S("Kesan pertama", "First impression"), sub: S("PROFIL", "PROFILE"), body: `<p class="txt">${rich(p.impression)}</p>` });
        (p.stories || []).forEach((st, i) => cards.push({ title: st.title || "Intel", sub: `${S("ARSIP", "FILE")} ${String(i + 1).padStart(2, "0")}`, body: `<p class="txt prose">${rich(st.text)}</p>` }));
        return accordion(cards);
      },
    };
    const show = (id) => {
      $$(".tab", main).forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === id));
      $("#tabBody").innerHTML = panels[id]();
    };
    $(".tabs", main).addEventListener("click", (ev) => { const t = ev.target.closest(".tab"); if (t) show(t.dataset.tab); });
    const setLook = () => {
      const l = looks[lookIdx];
      $("#heroImg").src = img(l.src);
      const nm = $("#lookName"); if (nm) nm.textContent = l.name;
    };
    if (looks.length > 1) {
      $("#lookPrev").onclick = () => { lookIdx = (lookIdx - 1 + looks.length) % looks.length; setLook(); };
      $("#lookNext").onclick = () => { lookIdx = (lookIdx + 1) % looks.length; setLook(); };
    }
    setLook();
    const drawSk = (box) => {
      const lv = ((ST && ST.skills) || {})[box.dataset.g]; if (!lv) return;
      const inp = $("input", box), L = +inp.value, max = lv.cost.length + 1;
      $(".sklv-num", box).textContent = L;
      $(".sklv-max", box).style.visibility = L === max ? "visible" : "hidden";
      const tot = {};
      lv.cost.slice(0, L - 1).forEach((c) => Object.entries(c).forEach(([k, v]) => { tot[k] = (tot[k] || 0) + v; }));
      const mats = Object.entries(tot).sort((a, b) => (a[0] === "gold") - (b[0] === "gold") || (a[0] > b[0] ? 1 : -1));
      $(".sklv-mats", box).innerHTML = mats.length ? matTiles(mats, SD.items) : `<p class="mono sklv-none">${S("Level 1: tanpa material.", "Level 1: no materials.")}</p>`;
      $(".sklv-rows", box).innerHTML = lv.rows.map((r) => `<div class="ratio"><span>${esc(r.l)}</span><b>${esc(r.f.replace(/\{(\d+)\}/g, (_, i) => (r.v[L - 1] || r.v[r.v.length - 1])[+i] ?? ""))}</b></div>`).join("");
    };
    const initSk = () => $$(".sklv", main).forEach(drawSk);
    $("#tabBody").addEventListener("input", (ev) => { const box = ev.target.closest(".sklv"); if (box) drawSk(box); });
    $(".tabs", main).addEventListener("click", () => setTimeout(initSk, 0));
    $("#tabBody").addEventListener("click", (ev) => {
      const pk = ev.target.closest(".awk-pick");
      if (pk) {
        ev.stopPropagation();
        const on = pk.getAttribute("aria-checked") !== "true";
        pk.setAttribute("aria-checked", on); pk.closest(".skillcard").classList.toggle("active", on);
        const n = $$(".awk-pick[aria-checked=true]", main).length;
        $("#awkN").textContent = n;
        $$(".skillcard.extra", main).forEach((c, i) => { const ok = n >= [3, 6][i]; c.classList.toggle("locked", !ok); c.classList.toggle("active", ok); });
        return;
      }
      const tg = ev.target.closest(".sklv-toggle");
      if (tg) {
        const box = tg.nextElementSibling, open = box.hidden;
        box.hidden = !open; tg.setAttribute("aria-expanded", open);
        tg.firstElementChild.textContent = open ? S("Sembunyikan skala DMG & material", "Hide DMG scaling & materials") : S("Tampilkan skala DMG & material", "Show DMG scaling & materials");
        return;
      }
      const fig = ev.target.closest(".outfit[data-i]");
      if (fig) { lookIdx = +fig.dataset.i; setLook(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const b = ev.target.closest(".skill-top"); if (!b) return;
      const c = b.closest(".skillcard"); c.classList.toggle("open"); b.setAttribute("aria-expanded", c.classList.contains("open"));
    });
    if (tabs.length) show(tabs[0][0]);
    initSk();
    if (ST) {
      const upd = () => {
        const i = +$("#lvRange").value - 1;
        $("#lvNum").textContent = i + 1;
        $("#stHp").textContent = nf(ST.hp[i]); $("#stAtk").textContent = nf(ST.atk[i]); $("#stDef").textContent = nf(ST.def[i]);
      };
      $("#lvRange").addEventListener("input", upd);
      upd();
    }
  }

  // ---------------- ARC ----------------
  function arcTile(a) {
    return `<a class="tile q${a.rarity}" href="/arc/${a.slug}" data-link>
      <div class="tile-img"><img src="${img(a.icon)}" alt="" loading="lazy"></div>
      <div class="tile-body"><b>${esc(a.name)}</b><small>${stars(a.rarity)} · ${esc(a.type)}</small></div>
    </a>`;
  }
  async function viewArcList() {
    setTitle(S("Arc", "Arcs"));
    const list = await load("arcs");
    const types = [...new Map(list.map((a) => [a.type, a.typeIcon])).entries()].filter(([t]) => t);
    const rar = [...new Set(list.map((a) => a.rarity))].sort((a, b) => b - a);
    main.innerHTML = head(S("ARC", "ARCS"), S("Arc", "Arcs"), S("Senjata para Esper. Buka satu Arc untuk melihat efeknya di setiap tingkat bintang.", "The Espers' weapons. Open an Arc to see its effect at every star level."), list.length) + `
      <div class="toolbar">
        ${filterBox(S("Cari nama Arc…", "Search Arc names…"))}
        ${chips(rar.map((r) => ({ v: String(r), label: "★".repeat(r) })), "r")}
        <span class="chip-sep"></span>
        ${chips(types.map(([t, i]) => ({ v: t, label: t, icon: i })), "type", undefined, S("Semua tipe", "All types"))}
      </div>
      <div class="tile-grid" id="grid"></div>`;
    useFilters((s) => {
      const out = list.filter((a) => match(s.q, a.name) && (!s.r || String(a.rarity) === s.r) && (!s.type || a.type === s.type));
      $("#grid").innerHTML = out.length ? out.map(arcTile).join("") : `<div class="empty">${S("Tidak ada Arc yang cocok.", "No matching Arcs.")}</div>`;
      setCount(out.length);
    });
  }
  async function viewArc(slug) {
    const list = await load("arcs");
    const a = list.find((x) => x.slug === slug);
    if (!a) return notFound();
    setTitle(a.name);
    const espers = (await load("espers")).filter((e) => e.arcType === a.type);
    const SD = await load("stats");
    const AS = SD.arcs[a.slug];
    const similar = list.filter((x) => x.type === a.type && x.rarity === a.rarity && x.slug !== a.slug).slice(0, 8);
    main.innerHTML = `
      <div class="crumb mono"><a href="/" data-link>${S("ARSIP", "ARCHIVE")}</a><span>/</span><a href="/arc" data-link>${S("ARC", "ARCS")}</a><span>/</span><span>${esc(a.name.toUpperCase())}</span></div>
      <article class="arc-detail q${a.rarity}">
        <div class="arc-card-img art"><img src="${img(a.icon || a.card)}" alt="${esc(a.name)}"></div>
        <div>
          <span class="mono">ARC · ${esc(LABEL.rarity[a.rarity] || "")}</span>
          <div class="dossier-head"><h1>${esc(a.name)}</h1></div>
          <div class="tags">
            <span class="tag">${stars(a.rarity)}</span>
            <span class="tag">${a.typeIcon ? `<img src="${img(a.typeIcon)}" alt="">` : ""}${esc(a.type)}</span>
          </div>
          ${a.desc ? `<p class="lede txt" style="font-style:italic">${rich(a.desc)}</p>` : ""}
          ${AS ? levelBox(AS.atk.length, statRow("atk", "ATK", "stAtk") + statRow("atk", "ATK %", "stUp")) : ""}
          ${AS ? matBox(AS.mats, SD.items, S("MATERIAL ASCENSION · LV.1 → " + AS.atk.length, "ASCENSION MATERIALS · LV.1 → " + AS.atk.length)) : ""}
          ${a.effect ? `
            <div class="group-label">${S("Efek Arc", "Arc Effect")}</div>
            <div class="entry">
              <h4>${esc(a.effect.name)}</h4>
              <div class="mono" style="margin:4px 0 8px">${S("TINGKAT BINTANG (MIXING)", "STAR LEVEL (MIXING)")}</div>
              <div class="star-pick" role="group" aria-label="${S("Tingkat bintang", "Star level")}">${a.effect.values.map((_, i) => `<button type="button" data-s="${i}" aria-pressed="${i === 0}">★${i + 1}</button>`).join("")}</div>
              <p class="txt" id="arcFx"></p>
            </div>` : ""}
          ${similar.length ? `<div class="group-label">${S("Arc sejenis", "Similar Arcs")} (${esc(a.type)} · ${esc(LABEL.rarity[a.rarity] || "")})</div><div class="tile-grid">${similar.map(arcTile).join("")}</div>` : ""}
          ${espers.length ? `<div class="group-label">${S("Bisa dipakai oleh", "Usable by")} (Arc ${esc(a.type)})</div><div class="esper-grid">${espers.map(esperCard).join("")}</div>` : ""}
        </div>
      </article>`;
    if (a.effect) {
      const put = (i) => {
        $("#arcFx").innerHTML = rich(a.effect.text).replace(/\{(\d+)\}/g, (_, n) => `<span class="val">${esc(a.effect.values[i][n] ?? "?")}</span>`);
        $$(".star-pick button", main).forEach((b) => b.setAttribute("aria-pressed", b.dataset.s == i));
      };
      $(".star-pick", main).addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) put(+b.dataset.s); });
      put(0);
    }
    if (AS) {
      const upd = () => {
        const i = +$("#lvRange").value - 1;
        $("#lvNum").textContent = i + 1;
        $("#stAtk").textContent = nf(AS.atk[i]);
        $("#stUp").textContent = `${+(AS.up[i] * 100).toFixed(1)}%`;
      };
      $("#lvRange").addEventListener("input", upd);
      upd();
    }
  }

  // ---------------- VERSI & PATCH ----------------
  async function viewVersion(id) {
    const data = await load("versions");
    const list = data.versions;
    const idx = list.findIndex((x) => x.id === id);
    if (idx < 0) return notFound();
    const v = list[idx];
    setTitle(`${S("Versi", "Version")} ${v.id}: ${v.title}`);
    const SI = {
      esper: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-4 3.4-6 7-6s6.4 2 7 6"/></svg>',
      arc: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.4"/></svg>',
      cerita: '<svg viewBox="0 0 24 24"><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 9h6M9 13h6"/></svg>',
      fitur: '<svg viewBox="0 0 24 24"><path d="M12 3l2.2 5.6 5.8.4-4.5 3.7 1.5 5.7L12 15l-5 3.4 1.5-5.7L4 8.9l5.8-.3z"/></svg>',
      kosmetik: '<svg viewBox="0 0 24 24"><path d="M4 15l2-6h12l2 6v3H4z"/><circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/></svg>',
      event: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
      qol: '<svg viewBox="0 0 24 24"><path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/></svg>',
      bug: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="8" height="11" rx="4"/><path d="M12 8V5M4 11h4M16 11h4M4 18h4M16 18h4M9 5l-2-2M15 5l2-2"/></svg>',
      update: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/></svg>',
    };
    const pics = (x) => (x.img && x.img.length ? `<div class="vi-pics n${Math.min(x.img.length, 3)}">${x.img.map((m) => `<figure class="vi-pic ${esc(m.k || "ico")}"><img src="${img(m.s)}" alt="${esc(m.n || "")}" title="${esc(m.n || "")}" loading="lazy"></figure>`).join("")}</div>` : "");
    const item = (x) => `<div class="vi${x.img && x.img.length ? " has-pic" : ""}${x.img && x.img.length > 1 ? " multi" : ""}${x.img && x.img.length === 1 && x.img[0].k === "wide" ? " has-wide" : ""}${x.big ? " is-big" : ""}">${pics(x)}<div class="vi-main">
        <div class="vi-h">${x.link ? `<a href="${esc(x.link)}" data-link><b>${esc(x.t)}</b></a>` : `<b>${esc(x.t)}</b>`}${x.tag ? `<span class="vi-tag">${esc(x.tag)}</span>` : ""}${x.date ? `<span class="vi-date">${esc(x.date)}</span>` : ""}</div>
        <p class="txt">${esc(x.d)}</p></div></div>`;
    const cards = v.sections.map((sc) => ({
      title: sc.title, sub: `${sc.items.length} ${S("butir", "items")}`, open: !!sc.open,
      icon: `<span class="vi-ico">${SI[sc.id] || ICO.chat}</span>`,
      body: sc.items.map(item).join(""),
    }));
    const adj = (x, dir) => (x ? `<a class="ver-adj ${dir}" href="/versi/${esc(x.id)}" data-link><span class="mono">${dir === "prev" ? S("← VERSI SEBELUMNYA", "← PREVIOUS VERSION") : S("VERSI BERIKUTNYA →", "NEXT VERSION →")}</span><b>${esc(x.id)} · ${esc(x.title)}</b></a>` : "<span></span>");
    main.innerHTML = `<div id="verRoot">` + `
      <div class="crumb mono"><a href="/" data-link>${S("ARSIP", "ARCHIVE")}</a><span>/</span><a href="/versi" data-link>VERSI</a><span>/</span><span>${esc(v.id)}</span></div>
      ${LANG === "en" ? `<p class="ver-note">This article is written in Indonesian. An English version is not available yet.</p>` : ""}
      <p class="ver-meta mono">${S("ARTIKEL VERSI", "VERSION ARTICLE")} ${esc(v.id)}${v.published ? ` · ${S("DITERBITKAN", "PUBLISHED")} ${esc(v.published)}` : ""}</p>
      <section class="ver-hero${v.art ? " has-art" : ""}">
        <div class="ver-num"><span class="mono">${S("VERSI", "VERSION")}</span><b>${esc(v.id)}</b></div>
        <div class="ver-info">
          <h2>${esc(v.title)}</h2>
          <p class="mono">${S("RILIS", "RELEASE")} ${esc(v.released)} · ${S("SAMPAI", "UNTIL")} ${esc(v.end)}</p>
          <p class="txt">${esc(v.lead)}</p>
          <div class="ver-phases">${v.phases.map((f) => `<div><span class="mono">${esc(f.n)}</span><b>${esc(f.range)}</b><small>${esc(f.note)}</small></div>`).join("")}</div>
        </div>
        ${v.art ? `<figure class="ver-art"><img src="${img(v.art.s)}" alt="${esc(v.art.n || "")}"><figcaption>${esc(v.art.n || "")}</figcaption></figure>` : ""}
      </section>
      ${v.note ? `<p class="ver-note">${esc(v.note)}</p>` : ""}
      <div class="ver-list">${accordion(cards)}</div>
      <div class="ver-src"><span class="mono">${S("SUMBER", "SOURCES")}</span>${v.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)} ↗</a>`).join("")}</div>
      <nav class="ver-nav" aria-label="${S("Versi lain", "Other versions")}">${adj(list[idx + 1], "prev")}${adj(list[idx - 1], "next")}</nav>
      <p class="ver-all"><a href="/versi" data-link>${S("Lihat semua versi", "See all versions")}</a></p></div>`;
    $("#verRoot").addEventListener("click", (ev) => {
      const b = ev.target.closest(".skill-top");
      if (b) { const c = b.closest(".skillcard"); c.classList.toggle("open"); b.setAttribute("aria-expanded", c.classList.contains("open")); }
    });
  }

  // ---------------- VERSI: daftar artikel ----------------
  async function viewVersions() {
    const legacy = new URLSearchParams(location.search).get("v");
    if (legacy) return go(`/versi/${encodeURIComponent(legacy)}`, true);
    const list = (await load("versions")).versions;
    setTitle(S("Versi & Patch", "Versions & Patches"));
    main.innerHTML = head(S("VERSI", "VERSIONS"), S("Versi & Patch", "Versions & Patches"),
      S("Rangkuman tiap update Neverness to Everness dalam bahasa Indonesia. Setiap versi punya artikelnya sendiri yang bisa dibuka kapan saja.", "A write-up of every Neverness to Everness update. Each version has its own article you can reopen any time."), list.length) + `
      ${LANG === "en" ? `<p class="ver-note">Version articles are written in Indonesian for now.</p>` : ""}
      <div class="ver-cards">${list.map((v, i) => `<a class="ver-card${i === 0 ? " latest" : ""}" href="/versi/${esc(v.id)}" data-link>
        <figure>${v.cover ? `<img src="${img(v.cover.s)}" alt="" loading="lazy">` : ""}${i === 0 ? `<span class="ver-badge">${S("TERBARU", "LATEST")}</span>` : ""}</figure>
        <div class="ver-card-body">
          <span class="mono">${S("VERSI", "VERSION")} ${esc(v.id)}</span>
          <h3>${esc(v.title)}</h3>
          <p class="mono">${esc(v.released)} – ${esc(v.end)}</p>
          <p class="txt">${esc(v.lead)}</p>
          <span class="ver-read">${S("Baca artikel", "Read article")} →</span>
        </div></a>`).join("")}</div>`;
  }

  // ---------------- ADMIN BUILD (link rahasia) ----------------
  async function viewAdmin() {
    setTitle("Admin Build");
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "robots"; document.head.appendChild(meta); }
    meta.content = "noindex,nofollow";
    const [es, arcs, mods] = await Promise.all([load("espers"), load("arcs"), load("modules")]);
    const REPO = "FebryCoeg/nteid", PATH = "nte/data/builds.json";
    const KEY = "nte-admin-token";
    let token = ""; try { token = localStorage.getItem(KEY) || ""; } catch (e) {}
    let builds = {}, sha = null, cur = es[0].slug, working = null, showAllArcs = false, diag = "";
    const STATS = ["ATK %", "HP %", "DEF %", "CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK", "HP", "DEF", "Energy Regen", "Healing Bonus", "Break"];
    const api = (method, body) => fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}${method === "GET" ? "?ref=main&t=" + Date.now() : ""}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, body: body ? JSON.stringify(body) : undefined,
    });
    const b64 = (str) => btoa(unescape(encodeURIComponent(str)));
    const unb64 = (b) => decodeURIComponent(escape(atob(b.replace(/\n/g, ""))));
    async function pull() {
      if (!token) { builds = await (await fetch(`${BASE}data/builds.json?t=${Date.now()}`)).json().catch(() => ({})); sha = null; return "view"; }
      const r = await api("GET");
      if (r.status === 404) { builds = {}; sha = null; return "ok"; }
      if (!r.ok) return r.status;
      const j = await r.json(); builds = JSON.parse(unb64(j.content) || "{}"); sha = j.sha; return "ok";
    }
    const SD = await load("stats");
    const fresh = () => ({ arcs: [], sets: [], stats: [], awks: [], skills: [] });
    const pick = () => { working = Object.assign(fresh(), JSON.parse(JSON.stringify(builds[cur] || {}))); };
    const SKG = ["basic", "redirect", "ultimate", "support"];
    main.innerHTML = `<div id="admRoot"></div>`;
    const root = $("#admRoot");
    function render(msg) {
      const e = es.find((x) => x.slug === cur);
      root.innerHTML = `
        <div class="crumb mono"><span>ADMIN</span><span>/</span><span>BUILD</span></div>
        <h1 class="adm-h">Admin Build</h1>
        <p class="mono adm-note">${token ? "TOKEN TERSIMPAN DI BROWSER INI" : "TANPA TOKEN: HANYA BISA MELIHAT"}${msg ? " · " + esc(msg) : ""}</p>
        <div class="adm-box">
          <label>Token GitHub (fine-grained, akses Contents: Read and write hanya ke repo ${REPO})</label>
          <div class="adm-row"><input type="password" id="admTok" placeholder="github_pat_..." value="${esc(token)}" autocomplete="off"><button class="btn" id="admSaveTok" type="button">Simpan token</button><button class="btn ghost" id="admClrTok" type="button">Hapus token</button><button class="btn ghost" id="admCheck" type="button">Cek token</button></div>
          ${diag ? `<pre class="adm-diag">${esc(diag)}</pre>` : ""}
        </div>
        <div class="adm-box">
          <label>Esper</label>
          <select id="admEsper">${es.map((x) => `<option value="${x.slug}"${x.slug === cur ? " selected" : ""}>${esc(x.name)}${builds[x.slug] ? " ✓" : ""}</option>`).join("")}</select>
          <label>Arc (klik untuk menambah, urutan = prioritas)</label>
          <div class="adm-fit"><span><img src="${img(e.arcTypeIcon || "")}" alt="" ${e.arcTypeIcon ? "" : "hidden"}>${esc(e.name)} memakai Arc <b>${esc(e.arcType)}</b>: <b>${arcs.filter((a) => a.type === e.arcType).length}</b> Arc cocok</span>
            <label class="adm-chk"><input type="checkbox" id="admAllArcs"${showAllArcs ? " checked" : ""}> Tampilkan semua tipe</label></div>
          <div class="adm-chips" id="admArcSel">${working.arcs.map((sl, i) => { const a = arcs.find((x) => x.slug === sl); return a ? `<button type="button" class="adm-arc on q${a.rarity}" data-rm-arc="${i}"><img src="${img(a.icon)}" alt=""><span><i>${i + 1}</i>${esc(a.name)}<small>${esc(a.type)} · ★${a.rarity} · klik untuk hapus</small></span></button>` : ""; }).join("") || '<em>Belum ada</em>'}</div>
          <input type="search" id="admArcQ" placeholder="Cari Arc…" autocomplete="off">
          <div class="adm-chips" id="admArcList"></div>
          <label>Set modul</label>
          <div class="adm-chips">${working.sets.map((x, i) => { const st = mods.sets.find((m) => m.id === x.id); return st ? `<button type="button" class="on" data-rm-set="${i}">${esc(st.name)} · ${x.pieces} ✕</button>` : ""; }).join("") || '<em>Belum ada</em>'}</div>
          <div class="adm-row"><select id="admSet">${mods.sets.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join("")}</select>
            <select id="admPcs"><option value="4">4 keping</option><option value="2">2 keping</option></select><button class="btn" id="admAddSet" type="button">Tambah set</button></div>
          <label>Awakening yang disarankan (bebas pilih, klik berurutan sesuai prioritas)</label>
          <div class="adm-chips adm-awks">${e.awakening.slice(0, 6).map((a, i) => { const k = working.awks.indexOf(i + 1); return `<button type="button" class="adm-sk ${k >= 0 ? "on" : ""}" data-awk="${i + 1}"><span class="skill-ico">${a.icon ? `<img src="${img(a.icon)}" alt="">` : ""}</span><span>${k >= 0 ? `<i>${k + 1}</i>` : ""}${esc(a.name)}<small>Awakening ${i + 1}</small></span></button>`; }).join("")}</div>
          <p class="mono adm-note" style="margin:4px 0 0">${working.awks.length >= 6 ? "BONUS 3 DAN BONUS 6 AWAKENING AKTIF TERBUKA" : working.awks.length >= 3 ? "BONUS 3 AWAKENING AKTIF TERBUKA · BUTUH 6 AWAKENING UNTUK BONUS 6" : "PILIH 3 AWAKENING UNTUK BONUS 3 AWAKENING AKTIF, 6 UNTUK BONUS 6"}</p>
          <label>Urutan naik level skill (klik berurutan, klik lagi untuk mencabut)</label>
          <div class="adm-chips adm-skills">${SKG.filter((g) => e.skills.some((x) => x.group === g)).map((g) => { const i = working.skills.indexOf(g); const sk = e.skills.find((x) => x.group === g); const ic = ((SD.espers[e.id] || {}).icons || {})[g]; return `<button type="button" class="adm-sk ${i >= 0 ? "on" : ""}" data-skill="${g}"><span class="skill-ico">${ic ? `<img src="${img(ic)}" alt="">` : ""}</span><span>${i >= 0 ? `<i>${i + 1}</i>` : ""}${esc(sk.name)}<small>${esc(LABEL.group[g] || g)}</small></span></button>`; }).join("")}</div>
          <label>Stat prioritas (klik berurutan, klik lagi untuk mencabut)</label>
          <div class="adm-chips" id="admStats">${STATS.map((t) => { const i = working.stats.indexOf(t); return `<button type="button" class="${i >= 0 ? "on" : ""}" data-stat="${esc(t)}">${i >= 0 ? `<i>${i + 1}</i>` : ""}${esc(t)}</button>`; }).join("")}</div>
          <div class="adm-row" style="margin-top:16px"><button class="btn" id="admSave" type="button"${token ? "" : " disabled"}>Simpan ke GitHub</button><button class="btn ghost" id="admDel" type="button"${token && builds[cur] ? "" : " disabled"}>Hapus build ${esc(e.name)}</button></div>
          <p class="mono adm-note">Build tampil untuk semua pengunjung di tab Build tiap Esper setelah situs diperbarui (sekitar 1 menit).</p>
        </div>`;
      const drawArcs = () => {
        const q = ($("#admArcQ").value || "").toLowerCase();
        $("#admArcList").innerHTML = arcs.filter((a) => (showAllArcs || a.type === e.arcType) && !working.arcs.includes(a.slug) && (!q || a.name.toLowerCase().includes(q))).sort((x, y) => y.rarity - x.rarity || x.name.localeCompare(y.name)).slice(0, 60).map((a) => `<button type="button" class="adm-arc q${a.rarity}" data-add-arc="${a.slug}"><img src="${img(a.icon)}" alt="" loading="lazy"><span>${esc(a.name)}<small>${esc(a.type)} · ★${a.rarity}</small></span></button>`).join("");
      };
      drawArcs();
      $("#admArcQ").oninput = drawArcs;
    }
    async function checkToken() {
      if (!token) { diag = "Belum ada token. Tempel token lalu klik Simpan token."; render(); return; }
      const H = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
      const kind = token.startsWith("github_pat_") ? "token halus (fine-grained)" : token.startsWith("ghp_") ? "token klasik" : "jenis token tidak dikenal";
      const lines = [`Jenis: ${kind}, panjang ${token.length} karakter`];
      const call = async (label, url, opt) => {
        try {
          const r = await fetch(url, { headers: H, ...(opt || {}) });
          const j = await r.json().catch(() => ({}));
          const scopes = r.headers.get("x-oauth-scopes");
          lines.push(`${r.ok ? "OK " : "GAGAL "} ${label}: ${r.status}${j.message ? " · " + j.message : ""}${j.login ? " · akun " + j.login : ""}${scopes ? " · scope: " + scopes : ""}`);
          return r;
        } catch (e) { lines.push(`GAGAL ${label}: tidak bisa terhubung`); }
      };
      await call("Token dikenali", "https://api.github.com/user");
      await call(`Repo ${REPO} terlihat`, `https://api.github.com/repos/${REPO}`);
      await call("Izin tulis (uji aman: membuat blob kosong tanpa mengubah repo)", `https://api.github.com/repos/${REPO}/git/blobs`, { method: "POST", body: JSON.stringify({ content: "cek izin", encoding: "utf-8" }) });
      diag = lines.join("\n");
      render();
    }
    async function save(next, label) {
      const copy = { ...builds };
      if (next) copy[cur] = next; else delete copy[cur];
      const body = { message: `build: ${label} ${cur}`, content: b64(JSON.stringify(copy, null, 1) + "\n"), branch: "main" };
      if (sha) body.sha = sha;
      const r = await api("PUT", body);
      if (r.status === 409 || r.status === 422) { await pull(); toast("Data berubah di GitHub, muat ulang lalu simpan lagi."); pick(); render(); return; }
      if (!r.ok) {
        const info = await r.json().catch(() => ({}));
        const gh = info && info.message ? ` GitHub: "${info.message}"` : "";
        let why = `Gagal menyimpan (${r.status}).`;
        if (r.status === 401) why = "Token salah atau sudah kedaluwarsa (401). Buat token baru lalu simpan lagi.";
        else if (r.status === 403) why = /rate limit/i.test(info.message || "") ? "Terlalu banyak permintaan ke GitHub, coba lagi beberapa menit lagi (403)." : "Token tidak punya izin tulis ke repo nteid (403). Di pengaturan token: pilih repo nteid dan atur Contents ke Read and write.";
        else if (r.status === 404) why = "Repo nteid tidak terlihat oleh token ini (404). Pastikan repo nteid dipilih di Repository access.";
        toast(why);
        render("GAGAL " + r.status + (info && info.message ? " · " + info.message.toUpperCase().slice(0, 80) : ""));
        return;
      }
      const j = await r.json(); sha = j.content.sha; builds = copy; pick(); render("TERSIMPAN"); toast("Tersimpan. Situs diperbarui sekitar 1 menit.");
    }
    const st = await pull();
    pick(); render(st === "ok" || st === "view" ? "" : "GAGAL MEMUAT (" + st + ")");
    root.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button"); if (!t) return;
      if (t.id === "admSaveTok") { token = $("#admTok").value.trim(); try { localStorage.setItem(KEY, token); } catch (e) {} const r = await pull(); pick(); render(r === "ok" ? "TOKEN TERBACA (IZIN TULIS DIUJI SAAT MENYIMPAN)" : "TOKEN GAGAL (" + r + ")"); return; }
      if (t.id === "admCheck") { token = $("#admTok").value.trim() || token; await checkToken(); return; }
      if (t.id === "admClrTok") { token = ""; try { localStorage.removeItem(KEY); } catch (e) {} await pull(); pick(); render("TOKEN DIHAPUS"); return; }
      if (t.dataset.addArc) { working.arcs.push(t.dataset.addArc); render(); return; }
      if (t.dataset.rmArc) { working.arcs.splice(+t.dataset.rmArc, 1); render(); return; }
      if (t.id === "admAddSet") { working.sets.push({ id: $("#admSet").value, pieces: +$("#admPcs").value }); render(); return; }
      if (t.dataset.rmSet) { working.sets.splice(+t.dataset.rmSet, 1); render(); return; }
      if (t.dataset.awk) { const n = +t.dataset.awk, i = working.awks.indexOf(n); if (i >= 0) working.awks.splice(i, 1); else working.awks.push(n); render(); return; }
      if (t.dataset.skill) { const i = working.skills.indexOf(t.dataset.skill); if (i >= 0) working.skills.splice(i, 1); else working.skills.push(t.dataset.skill); render(); return; }
      if (t.dataset.stat) { const i = working.stats.indexOf(t.dataset.stat); if (i >= 0) working.stats.splice(i, 1); else working.stats.push(t.dataset.stat); render(); return; }
      if (t.id === "admSave") { await save(working.arcs.length || working.sets.length || working.stats.length || working.awks.length || working.skills.length ? working : null, "perbarui"); return; }
      if (t.id === "admDel") { if (await ask("Hapus build ini?", "Hapus", "Batal")) await save(null, "hapus"); }
    });
    root.addEventListener("change", (ev) => {
      if (ev.target.id === "admEsper") { cur = ev.target.value; pick(); render(); }
      if (ev.target.id === "admAllArcs") { showAllArcs = ev.target.checked; render(); }
    });
  }

  // ---------------- MODUL ----------------
  async function viewModules() {
    setTitle(S("Modul", "Modules"));
    const d = await load("modules");
    main.innerHTML = head(S("MODUL", "MODULES"), S("Modul", "Modules"), S("Modul dipasang ke Console (空幕) Esper. Kumpulkan 2 atau 4 keping dari set yang sama untuk bonus tambahan.", "Modules are fitted to an Esper's Console (空幕). Collect 2 or 4 pieces of the same set for extra bonuses."), d.modules.length) + `
      <div class="section-title"><h2>${S("Set modul", "Module sets")}</h2><span class="mono">${d.sets.length} ${S("SET", "SETS")}</span></div>
      <div class="set-grid">${d.sets.map((s) => `
        <div class="set-card">
          <header>${s.icon ? `<img src="${img(s.icon)}" alt="">` : ""}<div><h3>${esc(s.name)}</h3><span class="mono">${s.modules.length} ${S("MODUL", "MODULES")}</span></div></header>
          ${s.bonuses.map((b) => `<div class="bonus"><i>${b.pieces} ${S("KEPING", "PIECES")}</i><p class="txt">${rich(b.text)}</p></div>`).join("")}
        </div>`).join("")}
      </div>
      <div class="section-title"><h2>${S("Semua modul", "All modules")}</h2></div>
      <div class="toolbar">${filterBox(S("Cari modul…", "Search modules…"))}${chips([...new Set(d.modules.map((m) => m.set).filter(Boolean))].map((x) => ({ v: x, label: x })), "set", undefined, S("Semua set", "All sets"))}</div>
      <div class="tile-grid" id="grid"></div>`;
    useFilters((s) => {
      const out = d.modules.filter((m) => match(s.q, m.name, m.set) && (!s.set || m.set === s.set));
      $("#grid").innerHTML = out.map((m) => `<button class="tile q${m.rarity}" type="button" data-id="${esc(m.id)}">
        <div class="tile-img"><img src="${img(m.icon)}" alt="" loading="lazy"></div>
        <div class="tile-body"><b>${esc(m.name)}</b><small>${m.set ? esc(m.set) : esc(m.kind || S("Modul", "Module"))}${m.core ? S(" · Inti", " · Core") : ""}</small></div></button>`).join("") || `<div class="empty">${S("Tidak ada modul yang cocok.", "No matching modules.")}</div>`;
      setCount(out.length);
    });
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".tile"); if (!b) return;
      const m = d.modules.find((x) => x.id === b.dataset.id);
      const set = d.sets.find((x) => x.name === m.set);
      sheet(m, `<span class="mono">${S("MODUL", "MODULE")} · ${esc(LABEL.rarity[m.rarity] || "")}${m.slots ? ` · ${esc(m.slots)} ${S("PETAK", "SLOTS")}` : ""}</span>`,
        `${m.desc ? `<p class="txt">${rich(m.desc)}</p>` : ""}${set ? `<div class="group-label">${S("Set", "Set")} ${esc(set.name)}</div>${set.bonuses.map((x) => `<div class="bonus"><i>${x.pieces} ${S("KEPING", "PIECES")}</i><p class="txt">${rich(x.text)}</p></div>`).join("")}` : ""}`);
    });
  }

  // ---------------- panel detail ----------------
  function sheet(x, kicker, body, cover) {
    const mode = cover === true ? " cover" : cover ? " " + cover : "";
    $("#sheetBody").innerHTML = `
      <div class="sheet-hero q${x.rarity || 1}${mode}">${(x.icon || x.image) ? `<img src="${img(x.image || x.icon)}" alt="">` : ""}</div>
      <div class="sheet-body q${x.rarity || 1}">
        ${kicker}
        <h2>${esc(x.name)}</h2>
        ${x.rarity ? `<div style="margin-top:6px">${stars(x.rarity)}</div>` : ""}
        ${body}
      </div>`;
    openLayer($("#sheet"));
  }

  // ---------------- ITEM ----------------
  async function viewItems() {
    setTitle(S("Item", "Items"));
    const d = await load("items");
    const counts = {};
    d.items.forEach((i) => (counts[i.cat] = (counts[i.cat] || 0) + 1));
    const cats = d.categories.filter((c) => counts[c.id]);
    const params = new URLSearchParams(location.search);
    let cat = params.get("kat") || "";
    main.innerHTML = head(S("ITEM", "ITEMS"), S("Item", "Items"), S("Semua barang di tas: material pengembangan, hadiah, koleksi, kostum, dan lainnya.", "Everything in your bag: development materials, gifts, collectibles, outfits and more."), d.items.length) + `
      <div class="item-layout">
        <div class="cat-side" id="cats">
          <button type="button" data-c="" aria-pressed="${!cat}">${S("Semua", "All")}<span>${d.items.length}</span></button>
          ${cats.map((c) => `<button type="button" data-c="${c.id}" aria-pressed="${cat === c.id}">${esc(c.name)}<span>${counts[c.id]}</span></button>`).join("")}
        </div>
        <div>
          <div class="toolbar">${filterBox(S("Cari item…", "Search items…"))}${chips([5, 4, 3, 2, 1].map((r) => ({ v: String(r), label: "★".repeat(r) })), "r")}</div>
          <div class="tile-grid" id="grid"></div>
          <div class="more"><button class="btn ghost" type="button" id="more" hidden>${S("Tampilkan lebih banyak", "Show more")}</button></div>
        </div>
      </div>`;
    let state = {}, limit = 120;
    const draw = () => {
      const out = d.items.filter((i) => (!cat || i.cat === cat) && match(state.q, i.name, i.desc) && (!state.r || String(i.rarity) === state.r));
      $("#grid").innerHTML = out.slice(0, limit).map((i) => `<button class="tile q${i.rarity}" type="button" data-id="${esc(i.id)}">
        <div class="tile-img"><img src="${img(i.icon)}" alt="" loading="lazy"></div>
        <div class="tile-body"><b>${esc(i.name)}</b></div></button>`).join("") || `<div class="empty">${S("Tidak ada item yang cocok.", "No matching items.")}</div>`;
      $("#more").hidden = out.length <= limit;
      setCount(out.length);
    };
    state = useFilters((s) => { state = s; limit = 120; draw(); });
    $("#cats").addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      cat = b.dataset.c; limit = 120;
      $$("#cats button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const p = new URLSearchParams(location.search); cat ? p.set("kat", cat) : p.delete("kat");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
      draw();
    });
    $("#more").onclick = () => { limit += 120; draw(); };
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".tile"); if (!b) return;
      const i = d.items.find((x) => x.id === b.dataset.id);
      const c = d.categories.find((x) => x.id === i.cat);
      sheet(i, `<span class="mono">${S("ITEM", "ITEM")} · ${esc(c ? c.name : "")}</span>`,
        `${i.use ? `<div class="use txt">${rich(i.use)}</div>` : ""}${i.desc ? `<p class="txt">${rich(i.desc)}</p>` : ""}`);
    });
  }

  // ---------------- FURNITUR ----------------
  async function viewFurniture() {
    setTitle(S("Furnitur", "Furniture"));
    const list = await load("furniture");
    main.innerHTML = head(S("FURNITUR", "FURNITURE"), S("Furnitur", "Furniture"), S("Perabot untuk mengisi rumahmu. Tiap furnitur punya nilai kenyamanan, keberuntungan, kehangatan, dan koleksi.", "Furnishings for your home. Each piece has comfort, fortune, warmth and collection values."), list.length) + `
      <div class="toolbar">${filterBox(S("Cari furnitur…", "Search furniture…"))}${chips([5, 4, 3, 2].map((r) => ({ v: String(r), label: "★".repeat(r) })), "r")}</div>
      <div class="tile-grid" id="grid"></div>
      <div class="more"><button class="btn ghost" type="button" id="more" hidden>${S("Tampilkan lebih banyak", "Show more")}</button></div>`;
    let state = {}, limit = 120;
    const draw = () => {
      const out = list.filter((i) => match(state.q, i.name, i.desc) && (!state.r || String(i.rarity) === state.r));
      $("#grid").innerHTML = out.slice(0, limit).map((i) => `<button class="tile q${i.rarity}" type="button" data-id="${esc(i.id)}">
        <div class="tile-img"><img src="${img(i.icon)}" alt="" loading="lazy"></div>
        <div class="tile-body"><b>${esc(i.name)}</b>${i.stats && i.stats.Comfort ? `<small>${S("Kenyamanan", "Comfort")} +${i.stats.Comfort}</small>` : ""}</div></button>`).join("") || `<div class="empty">${S("Tidak ada furnitur yang cocok.", "No matching furniture.")}</div>`;
      $("#more").hidden = out.length <= limit;
      setCount(out.length);
    };
    useFilters((s) => { state = s; limit = 120; draw(); });
    $("#more").onclick = () => { limit += 120; draw(); };
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".tile"); if (!b) return;
      const i = list.find((x) => x.id === b.dataset.id);
      const st = Object.entries(i.stats || {}).filter(([, v]) => v);
      sheet(i, `<span class="mono">${S("FURNITUR", "FURNITURE")}</span>`,
        `${st.length ? `<div class="stat-row">${st.map(([k, v]) => `<div class="fact"><span>${LABEL.fstat[k] || k}</span><b>+${v}</b></div>`).join("")}</div>` : ""}
         ${i.use ? `<div class="use txt">${rich(i.use)}</div>` : ""}${i.desc ? `<p class="txt">${rich(i.desc)}</p>` : ""}`);
    });
  }

  // ---------------- KENDARAAN ----------------
  async function viewVehicles() {
    setTitle(S("Kendaraan", "Vehicles"));
    const list = await load("vehicles");
    const brands = [...new Set(list.map((v) => v.brand).filter(Boolean))].sort();
    main.innerHTML = head(S("KENDARAAN", "VEHICLES"), S("Kendaraan", "Vehicles"), S("Mobil dan motor yang bisa kamu kendarai keliling Hethereau.", "Cars and bikes you can ride around Hethereau."), list.length) + `
      <div class="toolbar">${filterBox(S("Cari kendaraan…", "Search vehicles…"))}${chips(brands.map((b) => ({ v: b, label: b })), "brand", undefined, S("Semua merek", "All brands"))}</div>
      <div class="wide-grid" id="grid"></div>`;
    useFilters((s) => {
      const out = list.filter((v) => match(s.q, v.name, v.brand) && (!s.brand || v.brand === s.brand));
      $("#grid").innerHTML = out.map((v) => `<button class="wcard" type="button" data-id="${esc(v.id)}">
        <div class="wcard-img">${v.icon ? `<img src="${img(v.icon)}" alt="" loading="lazy">` : ""}</div>
        <div class="wcard-body"><small>${esc(v.brand || "")}</small><b>${esc(v.name)}</b><p>${rich(v.desc).replace(/<[^>]+>/g, "")}</p></div></button>`).join("") || `<div class="empty">${S("Tidak ada kendaraan yang cocok.", "No matching vehicles.")}</div>`;
      setCount(out.length);
    });
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".wcard"); if (!b) return;
      const v = list.find((x) => x.id === b.dataset.id);
      sheet(v, `<span class="mono">${S("KENDARAAN", "VEHICLE")} · ${esc(v.brand || "")}</span>`,
        `<div class="stat-row">${v.kind ? `<div class="fact"><span>${S("Jenis", "Type")}</span><b>${esc(LABEL.vehicleKind[v.kind] || v.kind)}</b></div>` : ""}${v.source ? `<div class="fact"><span>${S("Didapat dari", "Obtained from")}</span><b>${esc(LABEL.source[v.source] || v.source)}</b></div>` : ""}</div>
         <p class="txt">${rich(v.desc)}</p>`);
    });
  }

  // ---------------- PROPERTI ----------------
  async function viewProperty() {
    setTitle(S("Properti", "Property"));
    const list = await load("property");
    main.innerHTML = head(S("PROPERTI", "PROPERTY"), S("Properti", "Property"), S("Apartemen dan hunian yang bisa kamu beli di Hethereau.", "Apartments and homes you can buy in Hethereau."), list.length) + `
      <div class="wide-grid">${list.map((p) => `
        <button class="wcard" type="button" data-id="${esc(p.id)}">
          <div class="wcard-img">${p.image ? `<img src="${img(p.image)}" alt="" loading="lazy">` : ""}</div>
          <div class="wcard-body"><small>${esc(p.area)}</small><b>${esc(p.name)}</b><p>${rich(p.slogan)}</p></div>
        </button>`).join("")}
      </div>`;
    main.querySelector(".wide-grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".wcard"); if (!b) return;
      const p = list.find((x) => x.id === b.dataset.id);
      sheet(p, `<span class="mono">${S("PROPERTI", "PROPERTY")} · ${esc(p.area)}</span>`,
        `${p.slogan ? `<p class="lede txt" style="margin-top:12px">${rich(p.slogan)}</p>` : ""}
         ${p.address ? `<div class="use"><b>${S("Alamat", "Address")}:</b> ${esc(p.address)}</div>` : ""}
         ${p.desc ? `<p class="txt">${rich(p.desc)}</p>` : ""}`);
    });
  }

  // ---------------- BAHASA (ID / EN) untuk kategori data game ----------------
  let LANG = (() => { try { return localStorage.getItem("nte-lang") === "en" ? "en" : "id"; } catch (e) { return "id"; } })();
  const tx = (o) => (o ? o[LANG] || o.en || "" : "");
  const S = (id, en) => (LANG === "en" ? en : id);
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, "");
  const paras = (s) => rich(s).split(/\n+/).filter(Boolean).map((p) => `<p class="txt" style="margin-top:10px">${p}</p>`).join("");

  // ---------------- teks statis di index.html mengikuti bahasa ----------------
  const ST_TEXT = {
    "Lewati ke konten": "Skip to content", "Database NTE": "NTE Database", "Beranda": "Home",
    "Esper": "Espers", "Arc": "Arcs", "Modul": "Modules", "Item": "Items", "Furnitur": "Furniture", "Kendaraan": "Vehicles", "Properti": "Property",
    "Cerita": "Story", "Anomali": "Anomalies", "Istilah": "Glossary", "Pencapaian": "Achievements", "Makanan": "Food", "Versi": "Versions", "Versi & Patch": "Versions & Patches",
    "MENU · INDEKS ARSIP": "MENU · ARCHIVE INDEX", "LAINNYA": "MORE",
    "Portofolio Febry Coeg": "Febry Coeg's Portfolio", "Profil, sosial media, game, dan video YouTube": "Profile, socials, games and YouTube videos",
    "Join Discord NTE Indonesia ↗": "Join the NTE Indonesia Discord ↗", "Donate lewat Trakteer ↗": "Donate via Trakteer ↗",
    "Guide NTE di YouTube ↗": "NTE guides on YouTube ↗", "Top up di Febry Store ↗": "Top up at Febry Store ↗",
    "Arsip Hethereau": "Hethereau Archive",
    "Fan-site tidak resmi, dibuat oleh": "Unofficial fan site, made by",
    ". Tidak berafiliasi dengan Hotta Studio atau Perfect World.": ". Not affiliated with Hotta Studio or Perfect World.",
    "Data dan gambar bersumber dari": "Data and images sourced from",
    ". Hak cipta Neverness to Everness milik Hotta Studio / Perfect World.": ". Neverness to Everness is © Hotta Studio / Perfect World.",
    "Data & gambar game © Hotta Studio / Perfect World.": "Game data & images © Hotta Studio / Perfect World.",
  };
  const ST_ATTR = {
    "Kategori": "Categories", "Cari (Ctrl+K)": "Search (Ctrl+K)", "Donate lewat Trakteer": "Donate via Trakteer", "Buka menu": "Open menu",
    "Tutup menu": "Close menu", "Menu utama": "Main menu", "Pencarian": "Search", "Cari Esper, Arc, Item, Kendaraan…": "Search Espers, Arcs, Items, Vehicles…",
    "Detail": "Details", "Tutup": "Close",
  };
  const stOrig = new WeakMap();
  function applyStatic() {
    const en = LANG === "en";
    const roots = $$(".skip, header.top, .drawer, .search-box, footer.foot");
    roots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (nd) => (nd.parentElement && nd.parentElement.closest("#searchResults") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      let n;
      while ((n = walker.nextNode())) {
        const raw = n.nodeValue, key = raw.replace(/\s+/g, " ").trim();
        if (!stOrig.has(n)) { if (ST_TEXT[key]) stOrig.set(n, raw); else continue; }
        const orig = stOrig.get(n), k = orig.replace(/\s+/g, " ").trim();
        n.nodeValue = en && ST_TEXT[k] ? orig.replace(k, ST_TEXT[k]) : orig;
      }
      [root, ...root.querySelectorAll("[aria-label],[placeholder]")].forEach((el) => {
        ["aria-label", "placeholder"].forEach((at) => {
          const v = el.getAttribute(at); if (v == null) return;
          const store = (el.__stAttr ||= {});
          if (!(at in store)) { if (ST_ATTR[v]) store[at] = v; else return; }
          el.setAttribute(at, en && ST_ATTR[store[at]] ? ST_ATTR[store[at]] : store[at]);
        });
      });
    });
    const nav = $(".top-nav"); if (nav) nav.setAttribute("aria-label", en ? "Categories" : "Kategori");
  }
  const syncLangBtn = () => { if (langBtn) { langBtn.textContent = LANG.toUpperCase(); langBtn.setAttribute("aria-label", S("Ganti bahasa (sekarang Indonesia)", "Switch language (now English)")); } document.documentElement.lang = LANG; applyStatic(); };
  if (langBtn) langBtn.onclick = () => {
    LANG = LANG === "id" ? "en" : "id";
    try { localStorage.setItem("nte-lang", LANG); } catch (e) {}
    index = null; syncLangBtn(); render();
  };

  // halaman daftar teks generik (cerita, anomali, istilah, pencapaian, fashion, makanan)
  function textPage(o) {
    setTitle(o.title);
    const rows = o.list.map((x, n) => ({ x, n }));
    main.innerHTML = head(o.crumb, o.title, o.desc, rows.length) + `
      <div class="toolbar">${filterBox(o.placeholder)}${o.chipDefs && o.chipDefs.length ? chips(o.chipDefs, "c", undefined, S("Semua", "All")) : ""}</div>
      <div class="${o.gridClass || "wide-grid"}" id="grid"></div>
      <div class="more"><button class="btn ghost" type="button" id="more" hidden>${S("Tampilkan lebih banyak", "Show more")}</button></div>`;
    const step = o.limit || 90;
    let state = {}, limit = step;
    const draw = () => {
      const out = rows.filter(({ x }) => match(state.q, ...o.search(x)) && (!state.c || o.chipOf(x) === state.c));
      $("#grid").innerHTML = out.slice(0, limit).map(({ x, n }) => {
        if (o.item) return o.item(x, n);
        const c = o.card(x);
        return `<button class="wcard" type="button" data-n="${n}"><div class="wcard-body"><small>${esc(c.k || "")}</small><b>${esc(c.t)}</b>${c.p ? `<p>${esc(c.p)}</p>` : ""}</div></button>`;
      }).join("") || `<div class="empty">${S("Tidak ada entri yang cocok.", "No matching entries.")}</div>`;
      $("#more").hidden = out.length <= limit;
      setCount(out.length);
    };
    useFilters((s) => { state = s; limit = step; draw(); });
    $("#more").onclick = () => { limit += step; draw(); };
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-n]"); if (!b) return;
      const d = o.open(o.list[+b.dataset.n]);
      sheet({ name: d.name, image: d.image, rarity: d.rarity }, `<span class="mono">${esc(d.kicker)}</span>`, d.body, d.mode);
    });
  }
  const fact = (k, v) => (v ? `<div class="fact"><span>${esc(k)}</span><b>${esc(v)}</b></div>` : "");
  const CLS = (l, n) => `${l} · ${S("Sumber: arsip teks game Global", "Source: Global game text")}${n ? ` · ${n}` : ""}`;

  async function viewStory() {
    const list = await load("story");
    const grp = { utama: S("Cerita Utama", "Main Story"), spinoff: "Spinoff" };
    textPage({
      crumb: S("CERITA", "STORY"), title: S("Cerita & Quest", "Story & Quests"),
      desc: S("Ringkasan resmi setiap bab cerita utama dan spinoff karakter, langsung dari teks game.", "Official chapter recaps for the main story and character spinoffs, straight from the game text."),
      placeholder: S("Cari bab atau karakter…", "Search chapters or characters…"),
      list, search: (x) => [tx(x.title), tx(x.summary)],
      chipDefs: Object.entries(grp).map(([v, label]) => ({ v, label })), chipOf: (x) => x.group,
      gridClass: "story-grid",
      item: (x, n) => `<button class="chapter" type="button" data-n="${n}">
        ${x.image ? `<img src="${img(x.image)}" alt="" loading="lazy">` : ""}
        <span class="no">${x.group === "utama" ? esc(x.chapter ? tx(x.chapter) : grp.utama) : "Spinoff"}</span>
        ${x.roleIcon ? `<span class="role"><img src="${img(x.roleIcon)}" alt="${esc(x.role || "")}"></span>` : ""}
        <span class="cap"><small>${grp[x.group]}</small><b>${esc(tx(x.title))}</b></span></button>`,
      open: (x) => ({ name: tx(x.title), image: x.image, mode: true, kicker: `${grp[x.group].toUpperCase()}${x.chapter ? " · " + tx(x.chapter).toUpperCase() : ""}${x.role ? " · " + x.role.toUpperCase() : ""}`, body: paras(tx(x.summary)) }),
    });
  }

  async function viewAnomalies() {
    const d = await load("anomalies");
    const list = [
      ...d.anomalies.map((a) => ({ t: "a", ...a })),
      ...d.monsters.map((m) => ({ t: "m", ...m })),
    ];
    const kind = { a: S("Anomali", "Anomaly"), m: S("Monster & Boss", "Monsters & Bosses") };
    const monName = (x) => x.name || `${x.kind} #${x.id.split("_")[1]}`;
    textPage({
      crumb: S("ANOMALI", "ANOMALIES"), title: S("Anomali & Monster", "Anomalies & Monsters"),
      desc: S("Arsip anomali Hethereau beserta kode, kutipan, dan kisahnya, plus catatan monster dan boss.", "The Hethereau anomaly archive with codes, quotes and stories, plus monster and boss notes."),
      placeholder: S("Cari anomali atau monster…", "Search anomalies or monsters…"),
      list, search: (x) => [x.name, x.code, x.place, tx(x.quote), tx(x.story), tx(x.desc)],
      chipDefs: Object.entries(kind).map(([v, label]) => ({ v, label })), chipOf: (x) => x.t,
      gridClass: "archive-grid", limit: 60,
      item: (x, n) => x.t === "a"
        ? `<button class="archive" type="button" data-n="${n}"><span class="ph">${x.image ? `<img src="${img(x.image)}" alt="" loading="lazy">` : ""}${x.level ? `<span class="lvl">${esc(x.level)}</span>` : ""}</span><span class="cap"><span class="code">${esc(x.code)}</span><b>${esc(x.name)}</b></span></button>`
        : `<button class="archive mon" type="button" data-n="${n}"><span class="ph">${x.image ? `<img src="${img(x.image)}" alt="" loading="lazy">` : ""}</span><span class="cap"><span class="code">${esc(x.kind.toUpperCase())}${x.place ? " · " + esc(x.place) : ""}</span><b>${esc(monName(x))}</b></span></button>`,
      open: (x) => x.t === "a"
        ? { name: x.name, image: x.image, mode: "photo", kicker: `${S("ANOMALI", "ANOMALY")} · ${x.code}`,
            body: `<div class="sheet-tags">${[x.level && `Class ${x.level}`, x.cate, x.access].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div><p class="lede txt" style="margin-top:14px">${rich(tx(x.quote))}</p>${x.story ? `<div class="group-label">${S("Arsip", "File")}</div>${paras(tx(x.story))}` : ""}` }
        : { name: monName(x), image: x.image, kicker: `${x.kind.toUpperCase()}${x.place ? " · " + x.place.toUpperCase() : ""}`, body: paras(tx(x.desc)) },
    });
  }

  async function viewGlossary() {
    const list = await load("glossary");
    textPage({
      crumb: S("ISTILAH", "GLOSSARY"), title: S("Istilah Dunia NTE", "NTE Glossary"),
      desc: S("Arti istilah yang dipakai di dunia Neverness to Everness, dari buku panduan dalam game.", "Meanings of terms used in the world of Neverness to Everness, from the in-game manual."),
      placeholder: S("Cari istilah…", "Search terms…"),
      list, search: (x) => [tx(x.name), tx(x.desc)], chipDefs: [], chipOf: () => "",
      card: (x) => ({ k: S("Istilah", "Term"), t: x.name.en, p: strip(tx(x.desc)) }),
      open: (x) => ({ name: S(x.name.id, x.name.en), kicker: S("ISTILAH", "TERM"), body: paras(tx(x.desc)) }),
    });
  }

  async function viewAchievements() {
    const d = await load("achievements");
    setTitle(S("Pencapaian", "Achievements"));
    const CE = { Social: "Social", Play: "Activities", Explore: "Exploration", Interest: "Hobbies", Develop: "Development", Fight: "Combat", Quest: "Quests", City: "City" };
    const cn = (c) => S(c.name, CE[c.id] || c.id);
    const MEDAL = [S("Perunggu", "Bronze"), S("Perak", "Silver"), S("Emas", "Gold")];
    const counts = {};
    d.items.forEach((x) => (counts[x.cat] = (counts[x.cat] || 0) + 1));
    const cats = d.categories.filter((c) => counts[c.id]);
    let cat = new URLSearchParams(location.search).get("kat") || "";
    const KEY = "nte-achievements";
    let done = new Set();
    try { done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch (e) {} };
    main.innerHTML = head(S("PENCAPAIAN", "ACHIEVEMENTS"), S("Pencapaian", "Achievements"),
      S("Semua achievement di game beserta syarat dan hadiahnya. Medali perunggu, perak, dan emas menunjukkan tingkat kesulitannya.", "Every in-game achievement with its requirement and reward. Bronze, silver and gold medals show how hard each one is."), d.items.length) + `
      <div class="ach-layout">
        <div class="ach-rail" id="rail">
          <button type="button" data-c="" aria-pressed="${!cat}" aria-label="${S("Semua", "All")}"><i class="all">${S("SEMUA", "ALL")}</i><span>${S("Semua", "All")}</span></button>
          ${cats.map((c) => `<button type="button" data-c="${c.id}" aria-pressed="${cat === c.id}" aria-label="${esc(cn(c))}"><img class="off" src="${img(c.icon)}" alt=""><img class="on" src="${img(c.iconOn || c.icon)}" alt=""><span>${esc(cn(c))}</span></button>`).join("")}
        </div>
        <div>
          <div class="ach-progress">
            <div class="ach-bar"><i id="achFill"></i></div>
            <b id="achPct"></b>
            <div class="ach-tools">
              <button class="chip" type="button" id="achExport">${S("Ekspor JSON", "Export JSON")}</button>
              <label class="chip" for="achImport">${S("Impor JSON", "Import JSON")}</label><input id="achImport" type="file" accept="application/json,.json" hidden>
              <button class="chip" type="button" id="achReset">${S("Reset", "Reset")}</button>
            </div>
            <p class="mono">${S("Tanda selesai tersimpan otomatis di browser ini. Ekspor ke file JSON untuk cadangan atau pindah perangkat.", "Progress saves automatically in this browser. Export to a JSON file to back it up or move devices.")}</p>
          </div>
          <div class="toolbar">${filterBox(S("Cari pencapaian…", "Search achievements…"))}${chips(MEDAL.map((label, i) => ({ v: String(i + 1), label })), "m")}<span class="chip-sep"></span>${chips([{ v: "belum", label: S("Belum", "To do") }, { v: "selesai", label: S("Selesai", "Done") }], "s")}</div>
          <div class="ach-head"><h2 id="achTitle"></h2><div class="tally" id="tally"></div></div>
          <div class="ach-list" id="grid"></div>
          <div class="more"><button class="btn ghost" type="button" id="more" hidden>${S("Tampilkan lebih banyak", "Show more")}</button></div>
        </div>
      </div>`;
    let state = {}, limit = 80;
    const draw = () => {
      const c = cats.find((x) => x.id === cat);
      $("#achTitle").textContent = c ? cn(c) : S("Semua kategori", "All categories");
      const base = d.items.filter((x) => !cat || x.cat === cat);
      $("#tally").innerHTML = [1, 2, 3].map((q) => `<span class="medal-${q}" title="${MEDAL[q - 1]}"><i></i>${base.filter((x) => x.q === q).length}</span>`).join("");
      const fin = base.filter((x) => done.has(x.id)).length;
      $("#achFill").style.width = `${base.length ? (fin / base.length) * 100 : 0}%`;
      $("#achPct").textContent = `${fin} / ${base.length} ${S("selesai", "done")} (${base.length ? Math.round((fin / base.length) * 100) : 0}%)`;
      const out = base.filter((x) => match(state.q, tx(x.title), x.title.en, tx(x.desc)) && (!state.m || String(x.q) === state.m)
        && (!state.s || (state.s === "selesai") === done.has(x.id)));
      $("#grid").innerHTML = out.slice(0, limit).map((x) => `
        <div class="ach-row${done.has(x.id) ? " done" : ""}" data-id="${esc(x.id)}">
          <span class="medal">${x.icon ? `<img src="${img(x.icon)}" alt="${MEDAL[x.q - 1]}" loading="lazy">` : ""}</span>
          <span><b>${esc(tx(x.title))}</b><p>${rich(tx(x.desc))}</p></span>
          ${x.rewards.length ? `<span class="reward">${x.rewards.slice(0, 2).map((r) => `${r.icon ? `<img src="${img(r.icon)}" alt="">` : ""}<span>×${esc(r.amount)}<small>${esc(r.name)}</small></span>`).join("")}</span>` : "<span></span>"}
          <button class="ach-check" type="button" aria-pressed="${done.has(x.id)}" aria-label="${S("Tandai selesai", "Mark as done")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
        </div>`).join("") || `<div class="empty">${S("Tidak ada pencapaian yang cocok.", "No matching achievements.")}</div>`;
      $("#more").hidden = out.length <= limit;
      setCount(out.length);
    };
    useFilters((s) => { state = s; limit = 80; draw(); });
    $("#rail").addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      cat = b.dataset.c; limit = 80;
      $$("#rail button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const p = new URLSearchParams(location.search); cat ? p.set("kat", cat) : p.delete("kat");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
      draw();
    });
    $("#more").onclick = () => { limit += 80; draw(); };
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".ach-check"); if (!b) return;
      const id = b.closest(".ach-row").dataset.id;
      done.has(id) ? done.delete(id) : done.add(id);
      save(); draw();
    });
    $("#achExport").onclick = () => {
      const blob = new Blob([JSON.stringify({ app: "arsip-hethereau", type: "achievements", saved: new Date().toISOString(), done: [...done] }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "pencapaian-nte.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#achImport").onchange = async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        const ids = Array.isArray(j) ? j : j.done;
        if (!Array.isArray(ids)) throw new Error("format");
        const known = new Set(d.items.map((x) => x.id));
        done = new Set(ids.filter((i) => known.has(i)));
        save(); draw();
        toast(S(`Berhasil memuat ${done.size} pencapaian.`, `Loaded ${done.size} achievements.`));
      } catch (e) { toast(S("File JSON tidak valid.", "Invalid JSON file.")); }
      ev.target.value = "";
    };
    $("#achReset").onclick = async () => {
      if (!done.size) return toast(S("Belum ada yang ditandai.", "Nothing is marked yet."));
      if (!(await ask(S("Hapus semua tanda selesai di browser ini?", "Clear all progress in this browser?"), S("Hapus", "Clear")))) return;
      done.clear(); save(); draw(); toast(S("Progres dihapus.", "Progress cleared."));
    };
  }

  async function viewFashion() {
    const list = await load("fashion");
    const chars = [...new Set(list.map((f) => f.char))].filter((c) => isNaN(+c)).sort();
    textPage({
      crumb: "FASHION", title: S("Fashion & Penampilan", "Fashion & Appearance"),
      desc: S("Kostum dan penampilan Esper lengkap dengan ilustrasi dan deskripsinya.", "Esper outfits with their illustrations and descriptions."),
      placeholder: S("Cari kostum atau karakter…", "Search outfits or characters…"),
      list, search: (x) => [tx(x.name), x.name.en, x.char, tx(x.desc)],
      chipDefs: chars.map((c) => ({ v: c, label: c })), chipOf: (x) => x.char,
      gridClass: "fashion-grid", limit: 48,
      item: (x, n) => `<button class="fcard q${x.rarity || 1}" type="button" data-n="${n}">
        <span class="fart">${(x.image || x.fallback) ? `<img src="${img(x.image || x.fallback)}" alt="" loading="lazy">` : ""}${x.head ? `<span class="fhead"><img src="${img(x.head)}" alt=""></span>` : ""}</span>
        <span class="fmeta"><small>${esc(x.char)}</small><b>${esc(tx(x.name))}</b></span></button>`,
      open: (x) => ({ name: tx(x.name), image: x.image || x.fallback, rarity: x.rarity, mode: "art", kicker: `FASHION · ${x.char}`,
        body: `${x.image ? "" : `<p class="mono" style="margin-top:10px">${S("Ilustrasi kostum ini belum ada di file game, ditampilkan potret karakternya.", "This outfit's art isn't in the game files yet; showing the character portrait.")}</p>`}${x.desc ? paras(tx(x.desc)) : ""}` }),
    });
  }

  async function viewFood() {
    const list = await load("food");
    const kind = { food: S("Makanan", "Food"), material: S("Bahan Masak", "Ingredients") };
    textPage({
      crumb: S("MAKANAN", "FOOD"), title: S("Makanan & Bahan", "Food & Ingredients"),
      desc: S("Makanan, efeknya, dan bahan masak yang ada di game.", "Dishes, their effects, and cooking ingredients in the game."),
      placeholder: S("Cari makanan atau bahan…", "Search food or ingredients…"),
      list, search: (x) => [tx(x.name), x.name.en, tx(x.desc), tx(x.effect)],
      chipDefs: Object.entries(kind).map(([v, label]) => ({ v, label })), chipOf: (x) => x.kind,
      gridClass: "icon-grid",
      item: (x, n) => `<button class="icard q${x.rarity || 1}" type="button" data-n="${n}"><span class="ic">${x.icon ? `<img src="${img(x.icon)}" alt="" loading="lazy">` : ""}</span><span><small>${kind[x.kind]}</small><b>${esc(tx(x.name))}</b><p>${esc(strip(tx(x.effect) || tx(x.desc)))}</p></span></button>`,
      open: (x) => ({ name: tx(x.name), image: x.icon, rarity: x.rarity, kicker: kind[x.kind].toUpperCase(), body: `${x.effect ? `<div class="use txt"><b>${S("Efek", "Effect")}:</b> ${rich(tx(x.effect))}</div>` : ""}${x.desc ? paras(tx(x.desc)) : ""}` }),
    });
  }
  syncLangBtn();

  // ---------------- TIER LIST (buatan pengunjung, tersimpan di browser) ----------------
  let tlAbort = null;
  async function viewTierlist() {
    setTitle("Tier List");
    const [home, arcs] = await Promise.all([load("home"), load("arcs")]);
    const SETS = {
      esper: home.roster.map((e) => ({ id: e.slug, name: e.name, icon: e.icon, cls: elClass(e.element), tag: e.element })),
      arc: arcs.map((a) => ({ id: a.slug, name: a.name, icon: a.icon, cls: "q" + a.rarity, tag: a.type })),
    };
    const KEY = "nte-tierlist";
    let uid = 0;
    const mkTiers = () => [["S", "#ff5a7a"], ["A", "#ff9a3d"], ["B", "#f1c044"], ["C", "#5fcf8a"], ["D", "#4aa3ff"]].map(([label, color]) => ({ id: "t" + Date.now().toString(36) + uid++, label, color, items: [] }));
    const fresh = (m) => ({ title: m === "esper" ? S("Tier List Esper-ku", "My Esper Tier List") : S("Tier List Arc-ku", "My Arc Tier List"), tiers: mkTiers() });
    let st = { mode: "esper", esper: fresh("esper"), arc: fresh("arc") };
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && raw.esper && raw.arc && Array.isArray(raw.esper.tiers) && Array.isArray(raw.arc.tiers)) st = { ...st, ...raw };
    } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    const cur = () => st[st.mode];
    const items = () => SETS[st.mode];
    const byId = () => Object.fromEntries(items().map((i) => [i.id, i]));
    let q = "", sel = null, justDragged = false;

    main.innerHTML = head("TIER LIST", "Tier List", S("Susun karakter atau Arc favoritmu ke dalam tier. Seret ke tier (di HP: ketuk karakter, lalu ketuk tier). Tersimpan otomatis di browser ini dan bisa diunduh sebagai gambar.", "Rank your favourite characters or Arcs into tiers. Drag them in (on phones: tap a character, then tap a tier). It saves automatically in this browser and can be downloaded as an image."), null) + `
      <div class="tl-bar">
        <div class="chips" id="tlMode"></div>
        <input class="filter-input" id="tlTitle" type="text" maxlength="60" aria-label="${S("Judul tier list", "Tier list title")}">
        <div class="tl-tools">
          <button class="chip" type="button" id="tlPng">${S("Unduh gambar", "Download image")}</button>
          <button class="chip" type="button" id="tlExp">${S("Ekspor JSON", "Export JSON")}</button>
          <label class="chip" for="tlImp">${S("Impor JSON", "Import JSON")}</label><input id="tlImp" type="file" accept="application/json,.json" hidden>
          <button class="chip" type="button" id="tlAdd">${S("+ Tier", "+ Tier")}</button>
          <button class="chip" type="button" id="tlReset">${S("Reset", "Reset")}</button>
        </div>
      </div>
      <div class="tl-hint" id="tlHint"></div>
      <div class="tl-board" id="tlBoard"></div>
      <div class="section-title"><h2>${S("Belum ditempatkan", "Unranked")}</h2><span class="mono" id="tlLeft"></span></div>
      <div class="toolbar tl-search"><input class="filter-input" id="tlQ" type="search" placeholder="${S("Cari nama…", "Search name…")}" autocomplete="off"></div>
      <div class="tl-pool tl-zone" id="tlPool" data-tier="pool"></div>`;

    const tile = (i) => `<div class="tl-item ${i.cls}${sel === i.id ? " sel" : ""}" data-id="${esc(i.id)}" title="${esc(i.name)}"><img src="${img(i.icon)}" alt="" draggable="false" loading="lazy"><span>${esc(i.name)}</span></div>`;
    function draw() {
      const c = cur(), map = byId();
      $("#tlMode").innerHTML = [["esper", "Esper"], ["arc", "Arc"]].map(([k, l]) => `<button class="chip" type="button" data-m="${k}" aria-pressed="${st.mode === k}">${l}</button>`).join("");
      const t = $("#tlTitle"); if (document.activeElement !== t) t.value = c.title;
      const placed = new Set(c.tiers.flatMap((x) => x.items));
      $("#tlBoard").innerHTML = c.tiers.map((t, n) => `
        <div class="tl-row" data-row="${t.id}">
          <div class="tl-label" style="background:${esc(t.color)}"><input class="tl-name" value="${esc(t.label)}" maxlength="14" aria-label="${S("Nama tier", "Tier name")}" data-t="${t.id}"></div>
          <div class="tl-zone" data-tier="${t.id}">${t.items.filter((id) => map[id]).map((id) => tile(map[id])).join("")}</div>
          <div class="tl-ctl">
            <input type="color" value="${esc(t.color)}" data-c="${t.id}" aria-label="${S("Warna tier", "Tier colour")}">
            <button type="button" data-up="${t.id}" aria-label="${S("Naikkan", "Move up")}" ${n === 0 ? "disabled" : ""}>▲</button>
            <button type="button" data-down="${t.id}" aria-label="${S("Turunkan", "Move down")}" ${n === c.tiers.length - 1 ? "disabled" : ""}>▼</button>
            <button type="button" data-del="${t.id}" aria-label="${S("Hapus tier", "Delete tier")}">✕</button>
          </div>
        </div>`).join("");
      const left = items().filter((i) => !placed.has(i.id) && (!q || i.name.toLowerCase().includes(q) || i.tag.toLowerCase().includes(q)));
      $("#tlPool").innerHTML = left.map(tile).join("") || `<p class="hint">${S("Semua sudah ditempatkan.", "Everything is ranked.")}</p>`;
      $("#tlLeft").textContent = `${items().length - placed.size} / ${items().length}`;
      const m = sel && map[sel];
      $("#tlHint").hidden = !m;
      if (m) $("#tlHint").innerHTML = `<b>${esc(m.name)}</b> ${S("dipilih. Ketuk sebuah tier (atau area di bawah) untuk menaruhnya.", "selected. Tap a tier (or the area below) to place it.")}`;
    }
    function move(id, zone, beforeId) {
      const c = cur();
      c.tiers.forEach((t) => (t.items = t.items.filter((x) => x !== id)));
      if (zone !== "pool") {
        const t = c.tiers.find((x) => x.id === zone); if (!t) return;
        const at = beforeId ? t.items.indexOf(beforeId) : -1;
        at >= 0 ? t.items.splice(at, 0, id) : t.items.push(id);
      }
      sel = null; save(); draw();
    }

    if (tlAbort) tlAbort.abort();
    tlAbort = new AbortController();
    const sig = { signal: tlAbort.signal };
    let drag = null, ghost = null, over = null;
    const zoneAt = (x, y) => { const el = document.elementFromPoint(x, y); return el ? el.closest(".tl-zone") : null; };
    main.addEventListener("pointerdown", (e) => {
      const it = e.target.closest(".tl-item");
      if (!it || e.button !== 0 || e.pointerType === "touch") return;
      drag = { id: it.dataset.id, x: e.clientX, y: e.clientY };
    }, sig);
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!ghost) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
        const src = $(`.tl-item[data-id="${CSS.escape(drag.id)}"]`, main);
        ghost = src.cloneNode(true); ghost.className += " ghost"; document.body.appendChild(ghost);
        src.classList.add("lift");
      }
      ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
      const z = zoneAt(e.clientX, e.clientY);
      if (over && over !== z) over.classList.remove("over");
      over = z; if (z) z.classList.add("over");
    }, sig);
    window.addEventListener("pointerup", (e) => {
      if (!drag) return;
      if (ghost) {
        const z = zoneAt(e.clientX, e.clientY);
        ghost.remove(); ghost = null; justDragged = true; setTimeout(() => (justDragged = false), 0);
        if (over) over.classList.remove("over"); over = null;
        if (z) {
          let before = null;
          const el = document.elementFromPoint(e.clientX, e.clientY), tgt = el && el.closest(".tl-item");
          if (tgt && tgt.dataset.id !== drag.id) {
            const r = tgt.getBoundingClientRect();
            const kids = [...z.querySelectorAll(".tl-item")], k = kids.indexOf(tgt);
            before = e.clientX < r.left + r.width / 2 ? tgt.dataset.id : (kids[k + 1] || {}).dataset ? kids[k + 1].dataset.id : null;
          }
          move(drag.id, z.dataset.tier, before);
        } else draw();
      }
      drag = null;
    }, sig);

    main.addEventListener("click", async (e) => {
      if (justDragged) return;
      const t = e.target;
      const modeBtn = t.closest("#tlMode .chip");
      if (modeBtn) { st.mode = modeBtn.dataset.m; sel = null; save(); draw(); return; }
      const up = t.closest("[data-up]"), dn = t.closest("[data-down]"), del = t.closest("[data-del]");
      const c = cur();
      if (up || dn) {
        const id = (up || dn).dataset.up || (up || dn).dataset.down, i = c.tiers.findIndex((x) => x.id === id), j = i + (up ? -1 : 1);
        if (c.tiers[j]) { [c.tiers[i], c.tiers[j]] = [c.tiers[j], c.tiers[i]]; save(); draw(); }
        return;
      }
      if (del) {
        const tr = c.tiers.find((x) => x.id === del.dataset.del);
        if (tr.items.length && !(await ask(S("Hapus tier ini? Isinya kembali ke daftar belum ditempatkan.", "Delete this tier? Its contents go back to unranked."), S("Hapus", "Delete")))) return;
        c.tiers = c.tiers.filter((x) => x !== tr); save(); draw(); return;
      }
      const it = t.closest(".tl-item");
      if (it) { sel = sel === it.dataset.id ? null : it.dataset.id; draw(); return; }
      const zone = t.closest(".tl-zone");
      if (zone && sel) move(sel, zone.dataset.tier);
    }, sig);

    main.addEventListener("input", (e) => {
      const c = cur(), t = e.target;
      if (t.id === "tlTitle") { c.title = t.value; save(); }
      else if (t.id === "tlQ") { q = t.value.trim().toLowerCase(); draw(); }
      else if (t.dataset.t) { const x = c.tiers.find((y) => y.id === t.dataset.t); if (x) { x.label = t.value; save(); } }
      else if (t.dataset.c) { const x = c.tiers.find((y) => y.id === t.dataset.c); if (x) { x.color = t.value; $(`.tl-row[data-row="${x.id}"] .tl-label`, main).style.background = t.value; save(); } }
    }, sig);

    $("#tlAdd").onclick = () => { cur().tiers.push({ id: "t" + Date.now().toString(36) + uid++, label: "?", color: "#a978ff", items: [] }); save(); draw(); };
    $("#tlReset").onclick = async () => {
      if (!(await ask(S("Reset tier list ini ke awal? Semua penempatan dan nama tier akan dihapus.", "Reset this tier list? All placements and tier names will be cleared."), "Reset"))) return;
      st[st.mode] = fresh(st.mode); sel = null; save(); draw(); toast(S("Tier list di-reset.", "Tier list reset."));
    };
    $("#tlExp").onclick = () => {
      const blob = new Blob([JSON.stringify({ app: "hethereau", type: "tierlist", ...st }, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "tierlist-nte.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#tlImp").onchange = async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        if (!j.esper || !j.arc || !Array.isArray(j.esper.tiers) || !Array.isArray(j.arc.tiers)) throw new Error("format");
        const clean = (m) => {
          const ok = new Set(SETS[m].map((i) => i.id));
          return { title: String(j[m].title || ""), tiers: j[m].tiers.map((t) => ({ id: "t" + Date.now().toString(36) + uid++, label: String(t.label || "").slice(0, 14), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : "#a978ff", items: (t.items || []).filter((x) => ok.has(x)) })) };
        };
        st = { mode: j.mode === "arc" ? "arc" : "esper", esper: clean("esper"), arc: clean("arc") };
        save(); draw();
      } catch (e) { toast(S("File JSON tidak valid.", "Invalid JSON file.")); }
      ev.target.value = "";
    };
    $("#tlPng").onclick = async () => {
      const c = cur(), map = byId();
      const W = 1100, LW = 130, CELL = 84, PAD = 14, perRow = Math.floor((W - LW - PAD * 2) / CELL), HEAD = 92, FOOT = 46;
      const rows = c.tiers.map((t) => { const ids = t.items.filter((id) => map[id]); return { t, ids, h: Math.max(1, Math.ceil(ids.length / perRow)) * CELL + 16 }; });
      const H = HEAD + rows.reduce((a, r) => a + r.h + 6, 0) + FOOT;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const g = cv.getContext("2d");
      const imgs = {};
      await Promise.all([...new Set(rows.flatMap((r) => r.ids.map((id) => map[id].icon)))].map((src) => new Promise((res) => { const im = new Image(); im.onload = () => { imgs[src] = im; res(); }; im.onerror = res; im.src = img(src); })));
      g.fillStyle = "#121214"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#ece6dd"; g.font = "800 38px 'Unbounded', Arial, sans-serif"; g.textBaseline = "middle"; g.textAlign = "left";
      g.fillText(c.title.slice(0, 40) || "Tier List", PAD + 6, HEAD / 2);
      let y = HEAD;
      rows.forEach(({ t, ids, h }) => {
        g.fillStyle = "#050506"; g.fillRect(0, y, W, h);
        g.fillStyle = t.color; g.fillRect(0, y, LW, h);
        g.fillStyle = "#17171a"; g.textAlign = "center"; g.font = "800 30px 'Unbounded', Arial, sans-serif";
        const words = (t.label || "").split(/\s+/).filter(Boolean), lines = words.length > 1 && t.label.length > 6 ? words : [t.label];
        lines.slice(0, 3).forEach((ln, i, arr) => g.fillText(ln.slice(0, 8), LW / 2, y + h / 2 + (i - (arr.length - 1) / 2) * 34));
        ids.forEach((id, i) => {
          const it = map[id], cx = LW + PAD + (i % perRow) * CELL + CELL / 2, cy = y + 8 + Math.floor(i / perRow) * CELL + 36;
          g.save(); g.beginPath(); g.arc(cx, cy, 31, 0, Math.PI * 2); g.clip();
          g.fillStyle = "#2c2c31"; g.fillRect(cx - 31, cy - 31, 62, 62);
          if (imgs[it.icon]) g.drawImage(imgs[it.icon], cx - 31, cy - 31, 62, 62);
          g.restore();
          g.lineWidth = 3; g.strokeStyle = "#050506"; g.beginPath(); g.arc(cx, cy, 31, 0, Math.PI * 2); g.stroke();
          g.fillStyle = "#c9c4bb"; g.font = "600 11px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(it.name.length > 13 ? it.name.slice(0, 12) + "…" : it.name, cx, cy + 44);
        });
        y += h + 6;
      });
      g.fillStyle = "#8f8b84"; g.font = "600 14px 'JetBrains Mono', monospace"; g.textAlign = "right";
      g.fillText("Hethereau · nteid.site/tierlist", W - PAD - 6, H - FOOT / 2);
      cv.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "tierlist-nte.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }, "image/png");
    };
    draw();
  }

  // ---------------- PENCARIAN GLOBAL ----------------
  let index = null;
  async function buildIndex() {
    if (index) return index;
    const [es, ar, md, it, fu, ve, st, an, gl, ac, fa, fo] = await Promise.all(["espers", "arcs", "modules", "items", "furniture", "vehicles", "story", "anomalies", "glossary", "achievements", "fashion", "food"].map(load));
    index = [
      ...es.map((x) => ({ g: S("Esper", "Esper"), n: x.name, s: `${x.element} · Rank ${x.rank}`, i: x.icon, href: `/esper/${x.slug}` })),
      ...ar.map((x) => ({ g: "Arc", n: x.name, s: x.type, i: x.icon, href: `/arc/${x.slug}` })),
      ...md.modules.map((x) => ({ g: S("Modul", "Module"), n: x.name, s: x.set || S("Modul", "Module"), i: x.icon, href: `/modul?q=${encodeURIComponent(x.name)}` })),
      ...it.items.map((x) => ({ g: "Item", n: x.name, s: (it.categories.find((c) => c.id === x.cat) || {}).name, i: x.icon, href: `/item?q=${encodeURIComponent(x.name)}` })),
      ...fu.map((x) => ({ g: S("Furnitur", "Furniture"), n: x.name, s: S("Furnitur", "Furniture"), i: x.icon, href: `/furnitur?q=${encodeURIComponent(x.name)}` })),
      ...ve.map((x) => ({ g: S("Kendaraan", "Vehicle"), n: x.name, s: x.brand, i: x.icon, href: `/kendaraan?q=${encodeURIComponent(x.name)}` })),
      ...st.map((x) => ({ g: S("Cerita", "Story"), n: tx(x.title), s: x.chapter ? tx(x.chapter) : "Spinoff", href: `/cerita?q=${encodeURIComponent(tx(x.title))}` })),
      ...an.anomalies.map((x) => ({ g: S("Anomali", "Anomaly"), n: x.name, s: x.code, href: `/anomali?q=${encodeURIComponent(x.name)}` })),
      ...gl.map((x) => ({ g: S("Istilah", "Glossary"), n: tx(x.name), s: "", href: `/istilah?q=${encodeURIComponent(x.name.en)}` })),
      ...ac.items.map((x) => ({ g: S("Pencapaian", "Achievement"), n: tx(x.title), s: tx(x.desc), href: `/pencapaian?q=${encodeURIComponent(x.title.en)}` })),
      ...fa.map((x) => ({ g: "Fashion", n: tx(x.name), s: x.char, href: `/fashion?q=${encodeURIComponent(x.name.en)}` })),
      ...fo.map((x) => ({ g: S("Makanan", "Food"), n: tx(x.name), s: "", href: `/makanan?q=${encodeURIComponent(x.name.en)}` })),
    ];
    return index;
  }
  function openSearch() {
    openLayer($("#search"));
    const inp = $("#searchInput");
    inp.value = "";
    $("#searchResults").innerHTML = `<p class="hint">${S("Ketik nama Esper, Arc, item, furnitur, atau kendaraan.", "Type the name of an Esper, Arc, item, furniture or vehicle.")}</p>`;
    buildIndex();
  }
  $(".search-open").onclick = openSearch;
  let sel = 0;
  $("#searchInput").addEventListener("input", async (e) => {
    const q = e.target.value.trim().toLowerCase();
    const box = $("#searchResults");
    if (!q) { box.innerHTML = `<p class="hint">${S("Ketik nama Esper, Arc, item, furnitur, atau kendaraan.", "Type the name of an Esper, Arc, item, furniture or vehicle.")}</p>`; return; }
    const idx = await buildIndex();
    const hits = idx.filter((x) => x.n.toLowerCase().includes(q)).sort((a, b) => a.n.toLowerCase().indexOf(q) - b.n.toLowerCase().indexOf(q)).slice(0, 40);
    if (!hits.length) { box.innerHTML = `<p class="hint">${S("Tidak ada hasil untuk", "No results for")} "${esc(q)}".</p>`; return; }
    const groups = {};
    hits.forEach((h) => (groups[h.g] ||= []).push(h));
    sel = 0;
    box.innerHTML = Object.entries(groups).map(([g, arr]) => `<div class="sr-group mono">${g}</div>` + arr.map((h) => `
      <a class="sr-item" href="${h.href}" data-link>${h.i ? `<img src="${img(h.i)}" alt="">` : `<span style="width:38px"></span>`}<span><b>${esc(h.n)}</b><small>${esc(h.s || "")}</small></span></a>`).join("")).join("");
    markSel();
  });
  function markSel() { $$("#searchResults .sr-item").forEach((a, i) => a.classList.toggle("sel", i === sel)); }
  $("#searchInput").addEventListener("keydown", (e) => {
    const items = $$("#searchResults .sr-item");
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % items.length; markSel(); items[sel].scrollIntoView({ block: "nearest" }); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; markSel(); items[sel].scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter") { e.preventDefault(); items[sel].click(); }
  });

  // ---------------- penghitung kunjungan (footer) ----------------
  // dihitung sekali per sesi browser; angka diambil dari layanan penghitung gratis Abacus
  (() => {
    const box = $("#visits");
    if (!box) return;
    let seen = false;
    try { seen = sessionStorage.getItem("nte-visit") === "1"; } catch (e) {}
    fetch(`https://abacus.jasoncameron.dev/${seen ? "get" : "hit"}/arsip-hethereau-nte/kunjungan`)
      .then((r) => r.json())
      .then((j) => {
        if (typeof j.value !== "number") return;
        box.textContent = `${j.value.toLocaleString("id-ID")} ${S("kunjungan", "visits")}`;
        box.hidden = false;
        try { sessionStorage.setItem("nte-visit", "1"); } catch (e) {}
      })
      .catch(() => {});
  })();

  render();
})();
