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

  const LINK = { donate: "https://trakteer.id/febrycoeg", community: "https://discord.gg/E2am3akPBB",
    // Webhook Discord untuk tombol "Kirim langsung". Kosongkan = tombol hanya menyalin laporan dan membuka Discord.
    // Buat di Discord: Pengaturan Channel > Integrasi > Webhook > Salin URL Webhook, lalu tempel di sini.
    reportWebhook: "" };
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
  const getEnIndex = () => (enIndex ||= fetch(`${BASE}data/en/index.json${ver}`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
  const load = async (name) => {
    const en = typeof LANG !== "undefined" && LANG === "en" && (await getEnIndex()).includes(name);
    const key = (en ? "en/" : "") + name;
    return (cache[key] ||= fetch(`${BASE}data/${key}.json${ver}`).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }));
  };

  // ---------------- header mobile: sembunyi saat scroll turun, muncul saat scroll naik ----------------
  (() => {
    const hd = $("header.top"); if (!hd) return;
    let last = scrollY, tick = false;
    addEventListener("scroll", () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        const y = scrollY, d = y - last;
        if (matchMedia("(max-width: 700px)").matches && Math.abs(d) > 6) hd.classList.toggle("hide", d > 0 && y > 90);
        else if (!matchMedia("(max-width: 700px)").matches) hd.classList.remove("hide");
        last = y; tick = false;
      });
    }, { passive: true });
  })();

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
    [/^\/musuh\/?$/, viewEnemies],
    [/^\/kalkulator\/?$/, viewCalc],
    [/^\/gacha\/?$/, viewGacha],
    [/^\/tracker\/?$/, viewTracker],
    [/^\/usulan\/?$/, viewProposal],
    [/^\/tentang\/?$/, viewAbout],
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
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".nav-grp-btn");
    $$(".nav-group").forEach((g) => { const open = btn && g.contains(btn) ? !g.classList.contains("open") : false; g.classList.toggle("open", open); const b = g.querySelector(".nav-grp-btn"); if (b) b.setAttribute("aria-expanded", String(open)); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".nav-group.open").forEach((g) => g.classList.remove("open")); });

  async function render() {
    const path = location.pathname.replace(/\/index\.html$/, "/") || "/";
    $$(".top-nav a, .drawer-nav a").forEach((a) => {
      const h = a.getAttribute("href");
      a.classList.toggle("active", h === "/" ? path === "/" : path.startsWith(h));
    });
    $$(".nav-group").forEach((g) => { g.classList.toggle("active", !!g.querySelector("a.active")); g.classList.remove("open"); const b = g.querySelector(".nav-grp-btn"); if (b) b.setAttribute("aria-expanded", "false"); });
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
    const picks = ["elyms", "exe", "chaos", "linko", "iroi", "shinku"].map((s) => espers.find((e) => e.slug === s)).filter(Boolean).slice(0, 3);
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
      ["/tierlist", "14", S("Buat Tier List", "Make a Tier List"), S("Buat tier list-mu sendiri, simpan, dan bagikan sebagai gambar", "Make your own tier list, save it and share it as an image"), "", thumbs("esper")],
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
    if (slug === "crimson") slug = "shinku";
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
    const DRAFTS = await load("builds_draft").catch(() => ({}));
    const COMM = await load("teams_community").catch(() => ({}));
    const COMMB = await load("builds_community").catch(() => ({}));
    const FEAT = await load("builds_featured").catch(() => ({}));
    const VOC = await buildVocab().catch(() => null);
    starState.esper = e.slug; starState.mine = new Set(); starState.hydrated = false; starState.counts = {};
    if ((COMMB[e.slug] || []).length) starState.counts = await starCountsRest(e.slug).catch(() => ({}));
    let ssHint = false; try { ssHint = localStorage.getItem("nte_fb") === "1"; } catch (er) {}
    if (ssHint && (COMMB[e.slug] || []).length) fbLoad().then(async (fbm) => { const u = await fbm.whenUser(); if (u && starState.esper === e.slug) { starState.mine = await fbm.myStars(u.uid, e.slug); starState.hydrated = true; paintStars(); } }).catch(() => {});
    const ARCS = await load("arcs");
    const MODS = await load("modules");
    const tabs = [
      ["skill", S("Kemampuan", "Abilities"), e.skills.length],
      ["build", "Build", 1],
      ["awakening", "Awakening", e.awakening.length],
      ["affinity", "Affinity", AF ? 1 : 0],
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
          <button class="build-cta" type="button" id="goBuild"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7"/></svg><span><b>${S("Lihat Build", "View Build")} ${esc(e.name.split(" (")[0])}</b><small>${S("Arc, set modul, stat, awakening, skill", "Arcs, module sets, stats, awakenings, skills")}</small></span></button>
          ${facts.length ? `<dl class="info">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
          ${ST ? levelBox(ST.hp.length, statRow("hp", "HP", "stHp") + statRow("atk", "ATK", "stAtk") + statRow("def", "DEF", "stDef") + statRow("crit", "CRIT Rate", "", Math.round(ST.crit * 100) + "%") + statRow("crit", "CRIT DMG", "", Math.round(ST.critDmg * 100) + "%")) : ""}
          ${ST ? matBox(ST.mats, SD.items, S("MATERIAL ASCENSION · LV.1 → 80", "ASCENSION MATERIALS · LV.1 → 80")) : ""}
          <div class="tabs" role="tablist">${tabs.map(([id, t], i) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${i === 0}">${t}</button>`).join("")}</div>
          <div id="tabBody" class="tab-panel"></div>
        </div>
      </article>`;
    { const gb = $("#goBuild"); if (gb) gb.onclick = () => { const t = $('.tab[data-tab="build"]'); if (t) { t.click(); t.scrollIntoView({ behavior: "smooth", block: "center" }); } }; }
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
        if (e.slug === "exe") return `<div class="af-sec"><div class="empty">${S("Coming soon. Exe belum rilis, jadi build-nya belum ditampilkan.", "Coming soon. Exe has not been released yet, so the build is not shown.")}</div></div>`;
        const manual = BUILDS[e.slug];
        const hasManual = manual && ((manual.arcs || []).length || (manual.sets || []).length || (manual.stats || []).length || (manual.awks || []).length || (manual.skills || []).length);
        const feat = FEAT[e.slug] && window.NteProposals ? window.NteProposals.featuredBuild(FEAT[e.slug]) : null;
        const bd = feat || (hasManual ? manual : (DRAFTS[e.slug] || null));
        const isDraft = !feat && !hasManual;
        let html = "";
        const SRC = (x) => (x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.by)} · ${esc(x.title)} ↗</a>` : esc(x.by + " · " + x.title));
        if (feat) html += `<div class="af-sec bd-feat"><p class="mono">${S("BUILD UTAMA DARI KOMUNITAS", "MAIN BUILD FROM THE COMMUNITY")}</p><p class="txt">${S(`Build ini dipilih dari usulan komunitas dan menggantikan build bawaan: <b>${esc(feat.name)}</b>.`, `This build was picked from community suggestions and replaces the default build: <b>${esc(feat.name)}</b>.`)}</p>${creditHtml(feat.credit, S("DIBUAT OLEH", "MADE BY"))}</div>`;
        if (bd) {
          if (bd.role) html += `<p class="bd-roleline"><b>${esc(bd.role.rank)}-${S("RANK", "RANK")}</b><span>${esc(bd.role.role)}</span>${bd.role.tier ? `<em>${esc(bd.role.tier)}</em>` : ""}</p>`;
          const arcOf = (sl) => ARCS.find((a) => a.slug === sl);
          const WHY = {
            type: S("Tipe Arc cocok", "Arc type match"), rare: S("Bintang 5", "5-star"), element: S(`Bonus ${e.element}`, `${e.element} bonus`), crit: "CRIT", atk: "ATK",
            dot: "DoT", summon: S("Summon", "Summons"), break: "Break", followup: "Follow-up", heal: S("Penyembuhan", "Healing"), shield: S("Perisai", "Shield"), team: S("Bonus tim", "Team bonus"), cycle: "Cycle",
          };
          const SWHY = {
            element: S(`Bonus DMG ${e.element}`, `${e.element} DMG bonus`), atk: S("Tambahan ATK", "ATK boost"), team: S("Menguatkan seluruh tim", "Buffs the whole team"),
            shield: S("Memperkuat perisai", "Stronger shields"), heal: S("Memperkuat penyembuhan", "Stronger healing"), hp: S("Tambahan HP", "HP boost"),
          };
          const rankBadge = (i) => `<i class="bd-rank r${i + 1}">${i + 1}</i>`;
          const fmtPct = (v) => (v == null ? "–" : `${String(Math.round(v * 10) / 10).replace(".", S(",", "."))}%`);
          const pctOf = (p) => (!p ? "" : p.team != null ? `<span class="bd-pct"><b>${fmtPct(p.team)}</b><small>${S("TIM", "TEAM")}</small>${p.solo != null ? `<b class="solo">${fmtPct(p.solo)}</b><small>SOLO</small>` : ""}</span>` : `<span class="bd-pct"><b>${fmtPct(p.m1)}</b><small>M1</small><b class="solo">${fmtPct(p.m5)}</b><small>M5</small></span>`);
          const calcNote = bd.calc ? `<p class="bd-calc"><b>${S("HASIL SIMULASI", "SIMULATION RESULT")}</b> · ${bd.calc.team.map((sl) => { const m = list.find((x) => x.slug === sl); return esc(m ? m.name : sl); }).join(" · ")}<br>${esc(tx(bd.calc.note))}</p>` : "";
          if ((bd.teams || []).length) {
            html += `<div class="af-sec"><h4>${S("Rekomendasi tim", "Team recommendations")}</h4><div class="bd-teams">${bd.teams.map((t, ti) => `<div class="bd-tm${ti === 0 ? " best" : ""}"><div class="bd-tm-head"><b>${esc(tx(t.name))}</b><em>${esc(tx(t.tag))}</em></div>
              <div class="bd-tm-mem">${t.members.map((sl, mi) => { const m = list.find((x) => x.slug === sl); const rl = (t.roles || [])[mi]; return m ? `<a href="/esper/${m.slug}" data-link class="${m.slug === e.slug ? "me" : ""}"><img src="${img(m.icon)}" alt=""><small>${esc(m.name.split(" (")[0])}</small>${rl && tx(rl) ? `<small class="bd-tm-role">${esc(tx(rl))}</small>` : ""}</a>` : ""; }).join("")}</div>
              ${t.metric ? `<p class="bd-tm-metric">${esc(tx(t.metric))}</p>` : ""}${(t.why || []).length ? `<ul class="bd-tm-why">${t.why.map((w) => `<li>${esc(tx(w))}</li>`).join("")}</ul>` : ""}</div>`).join("")}</div></div>`;
          }
          const RX = { blossom: ["Blossom", "Blossom"], remora: ["Remora", "Remora"], charge: ["Charge", "Charge"], hexed: ["Hexed", "Hexed"], nova: ["Nova", "Nova"], scorch: ["Scorch", "Scorch"], stain: ["Stain", "Stain"], discord: ["Discord", "Discord"] };
          if (bd.calc && (bd.calc.members || []).length) {
            const mem = bd.calc.members.map((m) => {
              const me = list.find((x) => x.slug === m.slug); if (!me) return "";
              const ma = ARCS.find((a) => a.slug === m.arc), tg = ((SD.espers[me.id] || {}).tags || []).slice(0, 2);
              return `<a class="bd-mem${m.slug === e.slug ? " me" : ""}" href="/esper/${me.slug}" data-link><img src="${img(me.icon)}" alt=""><span><b>${esc(me.name)}</b><small>${esc(me.element)}${tg.length ? " · " + esc(tg.join(" · ")) : ""}</small>${ma ? `<small class="bd-mem-arc">Arc: ${esc(ma.name)}</small>` : ""}</span><span class="bd-share"><b>${m.share}%</b><small>${S("DAMAGE TIM", "TEAM DMG")}</small></span></a>`;
            }).join("");
            html += `<div class="af-sec"><h4>${S("Tim yang diuji", "Tested team")}</h4><p class="mono">${S("DARI REKAMAN PERTARUNGAN NYATA", "FROM A REAL RECORDED FIGHT")} · ${Math.round(bd.calc.seconds)}s · ${(bd.calc.total / 1e6).toFixed(2)}M DMG</p><div class="bd-team">${mem}</div>
              <div class="bd-rx"><span class="mono">${S("REAKSI ESPER YANG TERBENTUK", "ESPER REACTIONS FORMED")}</span>${(bd.calc.reactions || []).map((r) => `<em>${esc(RX[r] ? S(RX[r][0], RX[r][1]) : r)}</em>`).join("")}${bd.calc.shared ? `<span class="mono bd-rx-note">${S(`+${bd.calc.shared}% DAMAGE BREAK MILIK TIM`, `+${bd.calc.shared}% TEAM BREAK DAMAGE`)}</span>` : ""}</div>
              <p class="txt bd-teamnote">${S("Ini satu susunan tim yang sudah diuji. Rekomendasi susunan tim lain baru bisa dibandingkan setelah ada rekaman pertarungan dengan tim berbeda.", "This is one team that has been tested. Other team compositions can only be compared once recordings of different teams are available.")}</p></div>`;
          }
          const arcStats = SD.arcs || {};
          if ((bd.arcs || []).length) html += `<div class="af-sec"><h4>${S("Arc terbaik", "Best Arcs")}</h4><p class="mono">${S("URUTAN = PRIORITAS · ATK DASAR PADA LV.80", "ORDER = PRIORITY · BASE ATK AT LV.80")}</p>${calcNote}${bd.arcNote ? `<p class="txt bd-arcnote">${esc(tx(bd.arcNote))}</p>` : ""}<div class="bd-arcs">${bd.arcs.map(arcOf).filter(Boolean).map((a, i) => {
            const at = (arcStats[a.slug] || {}).atk, why = bd.role ? [] : (bd.arcWhy || {})[a.slug] || [];
            return `<a class="bd-arc q${a.rarity}" href="/arc/${a.slug}" data-link>${rankBadge(i)}<img src="${img(a.icon)}" alt="" loading="lazy"><span><b>${esc(a.name)}</b><small>${esc(a.type)} · ★${a.rarity}${at ? ` · ATK ${at[at.length - 1]}` : ""}</small>${why.length ? `<span class="bd-why">${why.map((c) => WHY[c] ? `<em>${esc(WHY[c])}</em>` : "").join("")}</span>` : ""}</span>${pctOf((bd.arcPct || {})[a.slug])}</a>`;
          }).join("")}</div></div>`;
          if ((bd.sets || []).length) html += `<div class="af-sec"><h4>${S("Cartridge terbaik", "Best Cartridges")}</h4><p class="mono">${S("SET MODUL BERURUTAN", "MODULE SETS IN ORDER")}</p>${bd.sets.map((x, i) => {
            const st = MODS.sets.find((m) => m.id === x.id); if (!st) return "";
            const bn = st.bonuses.find((b) => b.pieces === x.pieces) || st.bonuses[0];
            const b2 = st.bonuses.find((b) => b.pieces === 2);
            const w = bd.role ? null : (bd.setWhy || {})[x.id];
            return `<div class="bd-set">${rankBadge(i)}${st.icon ? `<img src="${img(st.icon)}" alt="">` : ""}<div><b>${esc(st.name)} <em>${x.pieces}${S(" keping", "-pc")}</em>${w && SWHY[w] ? `<span class="bd-why"><em>${esc(SWHY[w])}</em></span>` : ""}</b>${pctOf((bd.setPct || {})[x.id])}${(bd.setNote || {})[x.id] ? `<p class="txt bd-setnote">${esc(tx(bd.setNote[x.id]))}</p>` : ""}${b2 && x.pieces === 4 ? `<p class="txt"><span class="bd-pc">2</span> ${rich(b2.text)}</p>` : ""}<p class="txt"><span class="bd-pc">${x.pieces}</span> ${rich(bn ? bn.text : "")}</p></div></div>`;
          }).join("")}</div>`;
          if ((bd.stats || []).length || (bd.sub || []).length) html += `<div class="af-sec"><h4>${S("Stat terbaik", "Best Stats")}</h4>${(bd.stats || []).length ? `<p class="mono">${S("STAT UTAMA (URUTAN PRIORITAS)", "MAIN STATS (BY PRIORITY)")}</p><div class="bd-stats">${bd.stats.map((t, i) => `<span><i>${i + 1}</i>${esc(t)}</span>`).join("")}</div>` : ""}${(bd.sub || []).length ? `<p class="mono" style="margin-top:14px">${S("SUB STAT (URUTAN PRIORITAS)", "SUB STATS (BY PRIORITY)")}</p><div class="bd-stats sub">${bd.sub.map((t, i) => `<span><i>${i + 1}</i>${esc(t)}</span>`).join("")}</div>` : ""}${bd.statNote ? `<p class="txt bd-arcnote">${esc(tx(bd.statNote))}</p>` : ""}</div>`;
          if ((bd.awks || []).length) html += `<div class="af-sec"><h4>${S("Awakening yang disarankan", "Recommended Awakenings")}</h4>${(() => {
            const rk = bd.awkRank || (bd.awks ? Object.fromEntries(bd.awks.map((n, i) => [n, i + 1])) : null);
            if (!rk) return "";
            const byRank = {};
            Object.entries(rk).forEach(([n, r]) => { (byRank[r] ||= []).push(+n); });
            const line = Object.keys(byRank).map(Number).sort((x, y) => x - y).map((r) => byRank[r].sort((x, y) => x - y).map((n) => "A" + n).join(" = ")).join(" › ");
            return `<p class="bd-awkorder"><span class="mono">${S("AKTIFKAN BERURUTAN", "ACTIVATE IN THIS ORDER")}</span><b>${line}</b></p>`;
          })()}${bd.awkNote ? `<p class="txt bd-arcnote">${esc(tx(bd.awkNote))}</p>` : ""}<p class="mono">${S("URUTAN TETAP SEPERTI DI GAME · ANGKA = PRIORITAS REKOMENDASI", "GAME ORDER · NUMBER = RECOMMENDED PRIORITY")}</p><div class="bd-awks">${e.awakening.slice(0, 6).map((a, k) => { const r = bd.awkRank ? (bd.awkRank[k + 1] || 0) - 1 : bd.awks.indexOf(k + 1); return `<div class="bd-awk-row${r < 0 ? " nopick" : ""}"><i>${r >= 0 ? r + 1 : "–"}</i>${a.icon ? `<img src="${img(a.icon)}" alt="">` : ""}<span><b>${esc(a.name)}</b><small>AWAKENING ${k + 1}</small>${bd.awkDesc && bd.awkDesc[k + 1] ? `<p class="bd-awk-desc">${LANG === "en" ? rich(a.desc || "") : esc(bd.awkDesc[k + 1])}</p>` : ""}</span></div>`; }).join("")}
</div></div>`;
          if ((bd.skills || []).length) html += `<div class="af-sec"><h4>${S("Prioritas naik level skill", "Skill priority")}</h4>${bd.skillNote ? `<p class="txt bd-skillnote">${esc(tx(bd.skillNote))}</p>` : ""}<div class="bd-skills">${bd.skills.map((g, i) => { const sk = e.skills.find((x) => x.group === g); return sk ? `<div class="bd-skill"><i>${i + 1}</i><span class="skill-ico">${icons[g] ? `<img src="${img(icons[g])}" alt="">` : ""}</span><span><b>${esc(sk.name)}</b><small>${esc(LABEL.group[g] || g)}</small></span></div>` : ""; }).join("")}</div></div>`;
        }
        if (feat && ((feat.rot || []).length || feat.rotation)) html += `<div class="af-sec"><h4>${S("Rotasi tim", "Team rotation")}</h4>${rotHtml(feat.rot, list, { repeat: feat.repeat })}${feat.rotation ? `<p class="bd-tm-metric cb-rot">${esc(feat.rotation)}</p>` : ""}</div>`;
        {
          const ct = ((COMM && COMM[e.slug]) || []).filter((t) => t && Array.isArray(t.members) && t.name);
          if (ct.length) html += `<div class="af-sec"><h4>${S("Tim dari komunitas", "Community teams")}</h4><div class="bd-teams">${ct.map((t) => teamHtml(t, e.slug, list, creditHtml(t.credit))).join("")}</div></div>`;
        }
        if (VOC) {
          const cb = ((COMMB && COMMB[e.slug]) || []).filter((b) => b && b.name && Array.isArray(b.arcs));
          const ranked = window.NteProposals.rankByStars(cb, starState.counts);
          const featPid = FEAT[e.slug] && FEAT[e.slug].pid;
          const detail = (i) => communityDetailHtml(ranked[i], { V: VOC, list, e, icons, atk: (sl) => ((SD.arcs || {})[sl] || {}).atk, featured: !!(featPid && ranked[i].pid === featPid), star: { count: starState.counts[ranked[i].pid] || 0, mine: starState.mine.has(ranked[i].pid) } });
          cbCtx = { ranked, detail, sel: 0 };
          html += `<div class="af-sec"><h4>${S("Build dari komunitas", "Community builds")}</h4><p class="mono">${S("USULAN PEMAIN, BUKAN REKOMENDASI RESMI", "PLAYER SUGGESTIONS, NOT OFFICIAL RECOMMENDATIONS")}</p>${ranked.length ? `<div class="cb-tabs" role="tablist">${ranked.map((b, i) => `<button type="button" class="cb-tab${i === 0 ? " on" : ""}" role="tab" data-cbsel="${i}"><span>${esc(b.name)}</span><em data-tabcount="${esc(b.pid)}">★ ${starState.counts[b.pid] || 0}</em></button>`).join("")}</div><div id="cbDetail">${detail(0)}</div>` : `<p class="txt">${S("Belum ada build dari komunitas.", "No community builds yet.")}</p>`}<p class="mono" style="margin-top:10px"><a class="chip" href="/usulan" data-link>${S("Usulkan build dan tim", "Suggest a build and team")}</a></p></div>`;
        }
        return html;
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
    if (tabs.length) show(tabs.some(([id]) => id === "build") ? "build" : tabs[0][0]);
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
    const DRAFT_ALL = await load("builds_draft").catch(() => ({}));
    const fresh = () => ({ arcs: [], sets: [], stats: [], awks: [], skills: [] });
    const pick = () => { working = Object.assign(fresh(), JSON.parse(JSON.stringify(builds[cur] || {}))); };
    const SKG = ["basic", "redirect", "ultimate", "support"];
    main.innerHTML = `<div id="admQueue"></div><div id="admFeat"></div><div id="admRoot"></div>`;
    const root = $("#admRoot");
    // antrean usulan tim komunitas (Firebase dimuat hanya saat tombol ditekan)
    const qbox = $("#admQueue");
    let fbm = null, qList = null, qMsg = "", qbList = null, VB = null;
    const PX = window.NteProposals;
    const TPATH = "nte/data/teams_community.json";
    const apiT = (method, body) => fetch(`https://api.github.com/repos/${REPO}/contents/${TPATH}${method === "GET" ? "?ref=main&t=" + Date.now() : ""}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, body: body ? JSON.stringify(body) : undefined,
    });
    const knownE = () => es.filter((x) => x.slug !== "exe").map((x) => x.slug);
    const BPATH = "nte/data/builds_community.json";
    async function publishJson(path, p, entry, message) {
      const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
      const call = (method, body) => fetch(url + (method === "GET" ? "?ref=main&t=" + Date.now() : ""), { method, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, body: body ? JSON.stringify(body) : undefined });
      const r = await call("GET"); let data = {}, sha = null;
      if (r.status !== 404) { if (!r.ok) throw new Error("GitHub " + r.status); const j = await r.json(); data = JSON.parse(unb64(j.content) || "{}"); sha = j.sha; }
      const arr = Array.isArray(data[p.esper]) ? data[p.esper] : [];
      const e2 = { ...entry, pid: p.id }, i = arr.findIndex((x) => x && x.pid === p.id);
      if (i >= 0) arr[i] = e2; else arr.push(e2);
      data[p.esper] = arr;
      const body = { message, content: b64(JSON.stringify(data, null, 1) + "\n"), branch: "main" };
      if (sha) body.sha = sha;
      const w = await call("PUT", body);
      if (!w.ok) throw new Error("GitHub " + w.status);
    }
    async function publishTeam(p, team) {
      const r = await apiT("GET"); let data = {}, sha = null;
      if (r.status !== 404) { if (!r.ok) throw new Error("GitHub " + r.status); const j = await r.json(); data = JSON.parse(unb64(j.content) || "{}"); sha = j.sha; }
      const arr = Array.isArray(data[p.esper]) ? data[p.esper] : [];
      const entry = { ...team, pid: p.id }, i = arr.findIndex((x) => x && x.pid === p.id);
      if (i >= 0) arr[i] = entry; else arr.push(entry);
      data[p.esper] = arr;
      const body = { message: `tim komunitas: ${p.esper} · ${team.name}`, content: b64(JSON.stringify(data, null, 1) + "\n"), branch: "main" };
      if (sha) body.sha = sha;
      const w = await apiT("PUT", body);
      if (!w.ok) throw new Error("GitHub " + w.status);
    }
    // Build komunitas yang sudah tayang, jumlah bintang, dan tombol "Jadikan build utama" (menulis builds_featured.json)
    const fbox = $("#admFeat");
    let fData = null, fMsg = "";
    const FEATPATH = "nte/data/builds_featured.json", COMMPATH = "nte/data/builds_community.json";
    async function ghRead(path) {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=main&t=${Date.now()}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } });
      if (r.status === 404) return { data: {}, sha: null };
      if (!r.ok) throw new Error("GitHub " + r.status);
      const j = await r.json(); return { data: JSON.parse(unb64(j.content) || "{}"), sha: j.sha };
    }
    async function ghWrite(path, data, sha, message) {
      const body = { message, content: b64(JSON.stringify(data, null, 1) + "\n"), branch: "main" }; if (sha) body.sha = sha;
      const w = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" }, body: JSON.stringify(body) });
      if (!w.ok) throw new Error("GitHub " + w.status);
    }
    function renderFeat() {
      if (!fData) { fbox.innerHTML = `<div class="adm-box"><label>Build komunitas dan bintang</label><div class="adm-row"><button class="btn" id="fLoad" type="button">Muat build komunitas</button></div>${fMsg ? `<p class="mono adm-note">${esc(fMsg)}</p>` : ""}</div>`; return; }
      const slugs = Object.keys(fData.comm).filter((k) => (fData.comm[k] || []).length);
      fbox.innerHTML = `<div class="adm-box"><label>Build komunitas dan bintang</label><div class="adm-row"><button class="btn ghost" id="fLoad" type="button">Muat ulang</button></div>${fMsg ? `<p class="mono adm-note">${esc(fMsg)}</p>` : ""}
        ${slugs.length ? slugs.map((sl) => { const en = es.find((x) => x.slug === sl) || { name: sl }, cur2 = fData.feat[sl];
          return `<h4 style="margin:14px 0 6px">${esc(en.name)}${cur2 ? ` · <span class="pb-st approved">build utama: ${esc(cur2.name)}</span>` : ""}</h4>${cur2 ? `<div class="adm-row"><button class="btn ghost sm" type="button" data-unfeat="${esc(sl)}">Kembalikan ke build bawaan</button></div>` : ""}
            <ul class="pb-list">${PX.rankByStars(fData.comm[sl], fData.counts).map((b) => `<li>${buildCardHtml(b, VB, creditHtml(b.credit, "USULAN OLEH"), { list: es, esper: sl, star: { count: fData.counts[b.pid] || 0, ro: true }, featured: !!(cur2 && cur2.pid === b.pid) })}${cur2 && cur2.pid === b.pid ? "" : `<button class="btn" type="button" data-feat="${esc(sl)}|${esc(b.pid || "")}">Jadikan build utama</button>`}</li>`).join("")}</ul>`; }).join("") : "<em>Belum ada build komunitas yang tayang.</em>"}</div>`;
    }
    renderFeat();
    fbox.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button"); if (!t) return;
      try {
        if (t.id === "fLoad") {
          if (!token) { fMsg = "Isi token GitHub dulu di atas, lalu coba lagi."; renderFeat(); return; }
          VB = VB || await buildVocab().catch(() => null);
          const [c, f, counts] = await Promise.all([ghRead(COMMPATH), ghRead(FEATPATH), starCountsRest().catch(() => ({}))]);
          fData = { comm: c.data, feat: f.data, counts }; fMsg = ""; renderFeat(); return;
        }
        if (t.dataset.feat) {
          const [sl, pid] = t.dataset.feat.split("|"); const b = ((fData.comm[sl]) || []).find((x) => x.pid === pid); if (!b) return;
          if (!token) { toast("Isi token GitHub dulu di atas."); return; }
          if (!(await ask(`Jadikan "${b.name}" sebagai build utama ${sl}? Build ini menggantikan isi tab Build di halaman karakter, dengan kredit pembuatnya.`, "Jadikan utama", "Batal"))) return;
          t.disabled = true;
          const f = await ghRead(FEATPATH); f.data[sl] = b;
          await ghWrite(FEATPATH, f.data, f.sha, `build utama komunitas: ${sl} · ${b.name}`);
          fData.feat = f.data; fMsg = "Tersimpan ke GitHub. Situs diperbarui sekitar 1 menit."; renderFeat(); toast("Build utama diganti."); return;
        }
        if (t.dataset.unfeat) {
          const sl = t.dataset.unfeat; if (!token) { toast("Isi token GitHub dulu di atas."); return; }
          if (!(await ask(`Kembalikan ${sl} ke build bawaan?`, "Kembalikan", "Batal"))) return;
          t.disabled = true;
          const f = await ghRead(FEATPATH); delete f.data[sl];
          await ghWrite(FEATPATH, f.data, f.sha, `build utama dikembalikan ke bawaan: ${sl}`);
          fData.feat = f.data; fMsg = "Dikembalikan ke build bawaan. Situs diperbarui sekitar 1 menit."; renderFeat(); toast("Dikembalikan."); return;
        }
      } catch (e) { fMsg = /GitHub/.test(String(e && e.message)) ? "Gagal menyimpan ke GitHub: " + e.message + ". Periksa token (izin Contents: Read and write)." : "Terjadi kesalahan: " + String(e && e.message || e); renderFeat(); }
    });
    const baseTitle = document.title.replace(/^\(\d+\)\s*/, "");
    async function loadQueue() {
      VB = await buildVocab().catch(() => null);
      qList = await fbm.pending(); qbList = await fbm.pendingBuilds(); qMsg = ""; renderQueue();
    }
    function renderQueue() {
      const pn = qList ? qList.length + (qbList ? qbList.length : 0) : null;
      document.title = (pn ? `(${pn}) ` : "") + baseTitle;
      const summary = pn === null ? "" : pn ? `<p class="pb-ok"><b>${pn}</b> usulan menunggu persetujuanmu (tim: ${qList.length}, build: ${qbList ? qbList.length : 0}).</p>` : `<p class="pb-ok">Tidak ada usulan yang menunggu.</p>`;
      const bsec = qbList ? `<label style="margin-top:14px;display:block">Usulan build komunitas</label>${qbList.length ? `<ul class="pb-list">${qbList.map((p) => {
        const r = VB ? PX.sanitizeBuild({ ...(p.build || {}), credit: p.credit }, { ...VB.ctx, espers: knownE() }, p.esper) : { build: null, errors: ["Daftar pilihan belum dimuat."] };
        if (!r.build) return `<li><b>Usulan build tidak valid</b> dari ${esc(p.name || "?")}: ${esc(r.errors.join(" "))}<br><button class="btn ghost" type="button" data-qb-reject="${esc(p.id)}">Tolak</button></li>`;
        return `<li>Untuk halaman <b>${esc((es.find((x) => x.slug === p.esper) || { name: p.esper }).name)}</b> · akun Google: ${esc(p.name || "?")}${p.updatedAt ? ` · <b class="pb-st pending">DIEDIT PENGUSUL (menggantikan versi yang tayang)</b>` : ""}${buildCardHtml(r.build, VB, creditHtml(r.build.credit, "USULAN OLEH"), { list: es, esper: p.esper })}<button class="btn" type="button" data-qb-ok="${esc(p.id)}">Setujui dan simpan ke GitHub</button> <button class="btn ghost" type="button" data-qb-reject="${esc(p.id)}">Tolak</button></li>`;
      }).join("")}</ul>` : "<em>Tidak ada usulan build menunggu.</em>"}` : "";
      qbox.innerHTML = `<div class="adm-box"><label>Usulan tim komunitas</label><div class="adm-row"><button class="btn" id="qLoad" type="button">${qList ? "Muat ulang antrean" : "Login Google admin dan muat antrean"}</button></div>${summary}${qMsg ? `<p class="mono adm-note">${esc(qMsg)}</p>` : ""}
        ${qList ? (qList.length ? `<ul class="pb-list">${qList.map((p) => {
          const r = PX.sanitizeTeam({ ...p.team, credit: p.credit }, { espers: knownE() }, p.esper);
          if (!r.team) return `<li><b>Usulan tidak valid</b> dari ${esc(p.name || "?")}: ${esc(r.errors.join(" "))}<br><button class="btn ghost" type="button" data-q-reject="${esc(p.id)}">Tolak</button></li>`;
          return `<li>Untuk halaman <b>${esc((es.find((x) => x.slug === p.esper) || { name: p.esper }).name)}</b> · akun Google: ${esc(p.name || "?")}${teamHtml(r.team, p.esper, es, creditHtml(r.team.credit))}<button class="btn" type="button" data-q-ok="${esc(p.id)}">Setujui dan simpan ke GitHub</button> <button class="btn ghost" type="button" data-q-reject="${esc(p.id)}">Tolak</button></li>`;
        }).join("")}</ul>` : "<em>Tidak ada usulan menunggu.</em>") : ""}${bsec}</div>`;
    }
    renderQueue();
    // Kalau admin sudah pernah login di browser ini, antrean dimuat otomatis tanpa klik (tanpa popup).
    let admHint = false; try { admHint = localStorage.getItem("nte_fb") === "1"; } catch (e) {}
    if (PX && admHint) fbLoad().then(async (f) => { fbm = f; const u = await f.whenUser(); if (u && f.isAdmin(u)) await loadQueue(); }).catch(() => {});
    qbox.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button"); if (!t) return;
      try {
        if (t.id === "qLoad") {
          if (!PX) { qMsg = "Modul usulan gagal dimuat."; renderQueue(); return; }
          fbm = fbm || await fbLoad();
          const u = await fbm.login();
          if (!fbm.isAdmin(u.user)) { await fbm.logout(); qMsg = "Akun ini bukan admin."; qList = null; renderQueue(); return; }
          try { localStorage.setItem("nte_fb", "1"); } catch (e2) {}
          await loadQueue(); return;
        }
        if (t.dataset.qbOk || t.dataset.qbReject) {
          const bid = t.dataset.qbOk || t.dataset.qbReject; const bp = (qbList || []).find((x) => x.id === bid); if (!bp) return;
          if (t.dataset.qbReject) { if (await ask("Tolak build ini?", "Tolak", "Batal")) { await fbm.setBuildStatus(bid, "rejected"); qbList = await fbm.pendingBuilds(); renderQueue(); toast("Build ditolak."); } return; }
          if (!token) { toast("Isi token GitHub dulu di atas, lalu coba lagi."); return; }
          const rb = VB ? PX.sanitizeBuild({ ...(bp.build || {}), credit: bp.credit }, { ...VB.ctx, espers: knownE() }, bp.esper) : { build: null };
          if (!rb.build) { toast("Build tidak valid."); return; }
          if (!(await ask(`Tayangkan build "${rb.build.name}" untuk ${bp.esper}?`, "Tayangkan", "Batal"))) return;
          t.disabled = true;
          await publishJson(BPATH, bp, rb.build, `build komunitas: ${bp.esper} · ${rb.build.name}`);
          await fbm.setBuildStatus(bid, "approved");
          qbList = await fbm.pendingBuilds(); qMsg = "Tersimpan ke GitHub. Situs diperbarui sekitar 1 menit."; renderQueue(); toast("Build ditayangkan.");
          return;
        }
        const id = t.dataset.qOk || t.dataset.qReject; if (!id) return;
        const p = (qList || []).find((x) => x.id === id); if (!p) return;
        if (t.dataset.qReject) { if (await ask("Tolak usulan ini?", "Tolak", "Batal")) { await fbm.setStatus(id, "rejected"); qList = await fbm.pending(); renderQueue(); toast("Usulan ditolak."); } return; }
        if (!token) { toast("Isi token GitHub dulu di atas, lalu coba lagi."); return; }
        const r = PX.sanitizeTeam({ ...p.team, credit: p.credit }, { espers: knownE() }, p.esper);
        if (!r.team) { toast("Usulan tidak valid."); return; }
        if (!(await ask(`Tayangkan tim "${r.team.name}" untuk ${p.esper}?`, "Tayangkan", "Batal"))) return;
        t.disabled = true;
        await publishTeam(p, r.team);
        await fbm.setStatus(id, "approved");
        qList = await fbm.pending(); qMsg = "Tersimpan ke GitHub. Situs diperbarui sekitar 1 menit."; renderQueue(); toast("Tim ditayangkan.");
      } catch (e) { qMsg = /GitHub/.test(String(e && e.message)) ? "Gagal menyimpan ke GitHub: " + e.message + ". Periksa token (izin Contents: Read and write)." : fbErr(e); renderQueue(); }
    });
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
          <div class="adm-row"><button class="btn ghost" id="admDraft" type="button">Mulai dari draf otomatis</button><span class="mono adm-note" style="margin:0">ISI FORM DARI DRAF DATA GAME, LALU RAPIKAN</span></div>
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
      if (t.id === "admDraft") { const d = DRAFT_ALL[cur]; if (!d) { toast("Belum ada draf untuk Esper ini."); return; } working = Object.assign(fresh(), JSON.parse(JSON.stringify(d))); delete working.draft; render("DRAF DIMUAT, KLIK SIMPAN KE GITHUB"); return; }
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

  // ---------------- GAMBAR BAGIKAN GACHA (diagram batang pity ala grafik saham) ----------------
  // o: { title, sub, accent, rows: [{ label, color, total, percent, avg }], items: [{ num, color, hard, gold, src, tag, n, unknown }],
  //      max, ticks, zones: [{ v, color, text }], extra, legend: [{ color, text }], file, emptyText }
  // Satu batang per S-Class yang didapat: makin tinggi pity, makin tinggi batangnya. Ikon di ujung batang. Semua dimuat dalam satu gambar.
  const nfmt = (n) => Number(n).toLocaleString(LANG === "en" ? "en-US" : "id-ID");
  async function pityChartImage(o) {
    const PAD = 40, YA = 64, CW = 58, CHH = 240, ICON = 17, ROWH = 34, GAPR = 18, HEAD = 130, PANH = 40 + CHH + 70;
    const n = o.items.length;
    const W = Math.max(1000, Math.min(1500, PAD * 2 + YA + Math.max(n, 12) * CW));
    const PER = Math.max(1, Math.floor((W - PAD * 2 - YA) / CW));
    const prow = n ? Math.ceil(n / PER) : 0;
    const tableH = ROWH * (o.rows.length + 1) + 16;
    const extraH = o.extra ? 40 : 14;
    const body = n ? prow * (PANH + GAPR) : 50;
    const H0 = HEAD + tableH + extraH + body + 64 + 44;
    const scale = Math.min(1, 14000 / H0); // gambar sangat panjang diperkecil supaya tetap muat di canvas
    const imgs = {};
    await Promise.all([...new Set(o.items.map((i) => i.src).filter(Boolean))].map((src) => new Promise((res) => { const im = new Image(); im.onload = () => { imgs[src] = im; res(); }; im.onerror = res; im.src = img(src); })));
    const cv = document.createElement("canvas"); cv.width = Math.round(W * scale); cv.height = Math.round(H0 * scale);
    const g = cv.getContext("2d"); g.scale(scale, scale);
    const rr = (px, py, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(px, py, w, h, r); else { g.moveTo(px + r, py); g.arcTo(px + w, py, px + w, py + h, r); g.arcTo(px + w, py + h, px, py + h, r); g.arcTo(px, py + h, px, py, r); g.arcTo(px, py, px + w, py, r); g.closePath(); } };
    g.fillStyle = "#121214"; g.fillRect(0, 0, W, H0);
    g.textBaseline = "middle"; g.textAlign = "left";
    g.fillStyle = "#ece6dd"; g.font = "800 34px 'Unbounded', Arial, sans-serif"; g.fillText(o.title, PAD, 52);
    g.fillStyle = o.accent; g.font = "800 22px 'Unbounded', Arial, sans-serif"; g.fillText(o.sub, PAD, 98);
    if (o.stat && o.stat.length) { g.textAlign = "right"; o.stat.forEach((t, i) => { g.fillStyle = i ? "#ffc24d" : "#ece6dd"; g.font = "800 24px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(t, W - PAD, 46 + i * 36); }); g.textAlign = "left"; }
    // tabel ringkasan (Total / Percent / Pity AVG)
    const ty = HEAD - 12;
    g.fillStyle = "#1b1b24"; rr(PAD, ty, W - PAD * 2, tableH, 14); g.fill();
    const cols = [W - PAD - 330, W - PAD - 200, W - PAD - 40];
    g.font = "700 15px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillStyle = "#c9c4bb"; g.textAlign = "right";
    ["Total", "Percent", "Pity AVG"].forEach((t, i) => g.fillText(t, cols[i], ty + 22));
    o.rows.forEach((r, i) => {
      const ry = ty + 22 + ROWH * (i + 1);
      g.strokeStyle = "#ffffff18"; g.lineWidth = 1; g.beginPath(); g.moveTo(PAD + 14, ry - ROWH / 2); g.lineTo(W - PAD - 14, ry - ROWH / 2); g.stroke();
      g.textAlign = "left"; g.fillStyle = r.color; g.font = "800 20px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(r.label, PAD + 20, ry);
      g.textAlign = "right"; g.fillText(String(r.total), cols[0], ry); g.fillText(r.percent, cols[1], ry); g.fillText(r.avg, cols[2], ry);
    });
    let cy = ty + tableH + 10;
    if (o.extra) { g.textAlign = "left"; g.fillStyle = "#c9c4bb"; g.font = "600 15px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(o.extra, PAD, cy + 12); }
    cy += extraH - 10;
    if (!n) { g.textAlign = "left"; g.fillStyle = "#8f8b84"; g.font = "600 16px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(o.emptyText, PAD, cy + 20); }
    // panel diagram: satu panel per baris, tiap batang = satu S-Class
    for (let r = 0; r < prow; r++) {
      const py = cy + r * (PANH + GAPR), x0 = PAD + YA, base = py + 40 + CHH;
      const slice = o.items.slice(r * PER, (r + 1) * PER);
      g.fillStyle = "#16161d"; rr(PAD, py, W - PAD * 2, PANH, 14); g.fill();
      g.font = "600 12px 'JetBrains Mono', monospace"; g.textAlign = "right";
      o.ticks.forEach((t) => { const y = base - (t / o.max) * CHH; g.strokeStyle = "#ffffff12"; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 - 8, y); g.lineTo(W - PAD - 12, y); g.stroke(); if (!o.zones.some((z) => z.v === t)) { g.fillStyle = "#8f8b84"; g.fillText(String(t), x0 - 14, y); } });
      // garis putus-putus soft/hard pity; angkanya ditulis di sumbu kiri (tidak menutupi ikon)
      o.zones.forEach((z) => { const y = base - (z.v / o.max) * CHH; g.save(); g.setLineDash([6, 5]); g.strokeStyle = z.color; g.globalAlpha = 0.7; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0 - 8, y); g.lineTo(W - PAD - 12, y); g.stroke(); g.restore(); g.fillStyle = z.color; g.textAlign = "right"; g.font = "800 12px 'JetBrains Mono', monospace"; g.fillText(String(z.v), x0 - 14, y); });
      const tops = [];
      slice.forEach((it, k) => {
        const cx = x0 + k * CW + CW / 2, h = it.unknown ? 8 : Math.max(8, (it.num / o.max) * CHH), top = base - h;
        tops.push([cx, top]);
        // batang (candle)
        const grad = g.createLinearGradient(0, top, 0, base); grad.addColorStop(0, it.color); grad.addColorStop(1, it.color + "66");
        g.fillStyle = grad; rr(cx - 13, top, 26, h, 6); g.fill();
        g.lineWidth = 1.5; g.strokeStyle = it.color; rr(cx - 13, top, 26, h, 6); g.stroke();
        // label di bawah garis dasar
        g.textAlign = "center"; g.fillStyle = it.color; g.font = "800 15px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(it.unknown ? "?" : String(it.num), cx, base + 17);
        g.fillStyle = "#8f8b84"; g.font = "600 11px 'JetBrains Mono', monospace"; g.fillText("#" + it.n, cx, base + 34);
        if (it.tag) { g.fillStyle = "#ffe27a"; g.font = "700 11px 'Plus Jakarta Sans', Arial, sans-serif"; g.fillText(it.tag, cx, base + 50); }
      });
      // garis tren menyambung ujung batang
      if (tops.length > 1) { g.save(); g.strokeStyle = o.accent; g.globalAlpha = 0.55; g.lineWidth = 2; g.lineJoin = "round"; g.beginPath(); tops.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); }
      // ikon di ujung batang
      slice.forEach((it, k) => {
        const cx = tops[k][0], top = tops[k][1], iy = top - ICON - 6;
        g.save(); g.beginPath(); g.arc(cx, iy, ICON, 0, Math.PI * 2); g.clip();
        g.fillStyle = "#2c2c31"; g.fillRect(cx - ICON, iy - ICON, ICON * 2, ICON * 2);
        if (it.src && imgs[it.src]) g.drawImage(imgs[it.src], cx - ICON, iy - ICON, ICON * 2, ICON * 2);
        g.restore();
        g.lineWidth = it.hard || it.gold ? 3.5 : 2.5; g.strokeStyle = it.gold ? "#ffc24d" : it.hard ? "#fff" : it.color; g.beginPath(); g.arc(cx, iy, ICON, 0, Math.PI * 2); g.stroke();
        if (it.gold && it.hard) { g.lineWidth = 1.5; g.strokeStyle = "#fff"; g.beginPath(); g.arc(cx, iy, ICON + 4, 0, Math.PI * 2); g.stroke(); }
      });
    }
    // legenda warna pity
    let lx = PAD; const ly = H0 - 66;
    g.font = "600 13px 'Plus Jakarta Sans', Arial, sans-serif"; g.textAlign = "left";
    o.legend.forEach((l) => { g.fillStyle = l.color; g.beginPath(); g.arc(lx + 7, ly, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = "#c9c4bb"; g.fillText(l.text, lx + 20, ly + 1); lx += 34 + g.measureText(l.text).width; });
    g.fillStyle = "#8f8b84"; g.font = "600 14px 'JetBrains Mono', monospace"; g.textAlign = "right";
    g.fillText("Hethereau · nteid.site/gacha · simulasi, bukan gacha asli", W - PAD, H0 - 24);
    if (o.preview) return cv;
    cv.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = o.file; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }, "image/png");
  }
  // ringkasan "terendah / tertinggi / median" dari pity yang diketahui
  const pityExtra = (nums) => {
    const k = nums.filter((v) => v > 0).sort((a, b) => a - b);
    if (!k.length) return "";
    const med = k.length % 2 ? k[(k.length - 1) / 2] : (k[k.length / 2 - 1] + k[k.length / 2]) / 2;
    return S(`Terendah ${k[0]} · Median ${med} · Tertinggi ${k[k.length - 1]}`, `Lowest ${k[0]} · Median ${med} · Highest ${k[k.length - 1]}`);
  };
  const PITY_COL = { green: "#4ade80", yellow: "#facc15", orange: "#fb923c", red: "#f87171" };
  // Esper: 1-30 hijau, 31-70 kuning, 71-89 oranye (soft pity, papan Modified), 90 merah (hard pity)
  const pityColorE = (n, hard) => (hard || n >= 90 ? PITY_COL.red : n >= 71 ? PITY_COL.orange : n >= 31 ? PITY_COL.yellow : PITY_COL.green);
  // Arc: S di Pull 1-2 hijau, 3-4 kuning, 5 oranye, 6 merah (hard pity)
  const pityColorA = (n, hard) => (hard || n >= 6 ? PITY_COL.red : n >= 5 ? PITY_COL.orange : n >= 3 ? PITY_COL.yellow : PITY_COL.green);
  const avgTxt = (sum, n, d = 1) => (n ? (sum / n).toFixed(d) : "—");

  // ---------------- SIMULATOR GACHA ----------------
  async function viewGacha() {
    setTitle(S("Simulator Gacha", "Gacha Simulator"));
    const [rules, bannersData, espers, arcs] = await Promise.all([load("gacha-rules"), load("gacha-banners"), load("espers"), load("arcs")]);
    const GE = window.GachaEngine;
    const intro = head(S("GACHA", "GACHA"), S("Simulator Gacha", "Gacha Simulator"), S("Lempar dadu di papan gacha seperti di game. Angka peluang dari layar aturan resmi.", "Roll the dice on the gacha board like in game. Odds come from the official in-game rules screen."), null);
    const fail = (t) => { main.innerHTML = intro + `<p class="txt">${t}</p>`; };
    if (!GE) return fail(S("Mesin gacha gagal dimuat. Muat ulang halaman.", "The gacha engine failed to load. Reload the page."));

    const eMap = Object.fromEntries(espers.map((e) => [e.slug, e]));
    const aMap = Object.fromEntries(arcs.map((a) => [a.slug, a]));
    // papan tiap banner dimuat dari berkas masing-masing; banner yang datanya rusak dilewati
    const boards = {};
    await Promise.all([...new Set(bannersData.banners.map((b) => b.boardFile))].map(async (f) => { boards[f] = await load(f).catch(() => null); }));
    const banners = bannersData.banners.filter((b) => eMap[b.featuredS] && boards[b.boardFile] && boards[b.boardFile].tiles);
    if (!banners.length) return fail(S("Data banner gacha tidak bisa dimuat.", "Gacha banner data could not be loaded."));

    const mkRules = (b) => ({ ...rules, pool: { ...rules.pool, featuredS: b.featuredS,
      aChars: espers.filter((e) => e.rank === "A").map((e) => e.slug),
      aArcs: arcs.filter((a) => a.rarity === 4).map((a) => a.slug),
      bArcs: arcs.filter((a) => a.rarity === 3).map((a) => a.slug) } });

    // ---- penyimpanan lokal (kunci v2: keadaan bersama + posisi per papan, riwayat, statistik, banner aktif)
    const KEY = "nte_gacha_v2";
    let hist = [], slog = [], stats = { S: 0, A: 0, B: 0, pSum: 0, pN: 0 }, st, savedBanner = null;
    let banner = banners.find((b) => b.id === bannersData.default) || banners[0];
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      const first = (raw && banners.find((b) => b.id === raw.banner)) || banner;
      st = GE.restoreState(raw && raw.state, boards[first.boardFile], mkRules(first));
      // susunan id papan berubah: posisi bidak tersimpan dari versi lama dikembalikan ke awal
      if (raw && raw.bv !== (boards[first.boardFile].version || 1)) st = { ...st, pos: boards[first.boardFile].start, positions: {} };
      if (st.total > 0 && raw) {
        savedBanner = first;
        if (Array.isArray(raw.hist)) hist = raw.hist.filter((h) => h && typeof h.kind === "string").slice(0, 200);
        // catatan S-Class permanen (tidak ikut dibatasi seperti riwayat); simpanan lama diisi dari riwayat yang masih ada
        const okS = (e) => e && Number.isInteger(e.n) && typeof e.id === "string" && Number.isInteger(e.p) && e.p >= 0;
        if (Array.isArray(raw.slog)) slog = raw.slog.filter(okS).slice(-5000);
        else slog = hist.filter((h) => h.kind === "S").reverse().map((h) => ({ n: h.n, id: h.id, p: h.pity || 0, k: h.pityKind || "normal" }));
        const sx = raw.stats;
        const ok = (k) => sx && Number.isInteger(sx[k]) && sx[k] >= 0;
        if (["S", "A", "B"].every(ok)) stats = { S: sx.S, A: sx.A, B: sx.B, pSum: ok("pSum") ? sx.pSum : 0, pN: ok("pN") ? sx.pN : 0 };
      }
    } catch (e) { st = GE.restoreState(null, boards[banner.boardFile], mkRules(banner)); }
    if (savedBanner) banner = savedBanner;
    let board = boards[banner.boardFile];
    let R = mkRules(banner);
    if (st.board !== banner.boardId) st = GE.switchBoard(st, banner.boardId, board);
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ state: st, hist, slog, stats, banner: banner.id, bv: board.version || 1 })); } catch (e) {} };

    // ---- papan: kotak, posisi, nama
    let byTile = {}, ax = 0, ay = 0, BW = 1, BH = 1, arrowDir = {};
    const TS = 44;
    const pct = (v, total) => (v / total * 100).toFixed(3) + "%";
    const TNAME = {
      hero: "Hero Chest", apprentice: "Apprentice Chest", lost: "Lost Piece Box", journeyS: "Journey Together (S-Class)", journeyA: "Journey Together (A-Class)",
      arclight: "Arc-light Mystery Box", fashion: "Fashion Center (Glider)", roll1: "Roll Again", roll5: "Multiple Surprises", outfit: "Daily Outfit", livery: "Mod Up! (Livery)",
      arrowIn: S("Pintu masuk blok", "Block entrance"), arrowOut: S("Pintu keluar blok", "Block exit"),
    };
    const LBL = { roll1: "+1", roll5: "+5" };
    const SKIN_LBL = { outfit: S("Outfit karakter", "Character Outfit"), livery: S("Livery kendaraan", "Vehicle Livery"), glider: S("Skin Glider", "Glider Skin") };
    const SKIN_TILE = { outfit: "Daily Outfit", livery: "Mod Up! (Livery)", glider: "Fashion Center" };
    const SKIN_LANDING = { outfit: "outfit", livery: "livery", glider: "fashion" };
    const tileLabel = (t) => (t.type === "lost" ? "×" + (t.amount || 30) : LBL[t.type] || "");
    const tileHtml = (t) => `<div class="gc-t gc-${t.type}${t.slumber ? " gc-slumber" : ""}${arrowDir[t.id] === "◀" ? " gc-arrowLeft" : ""}" style="left:${pct(t.x - ax - TS / 2, BW)};top:${pct(t.y - ay - TS / 2, BH)};width:${pct(TS, BW)};height:${pct(TS, BH)}" title="${esc(TNAME[t.type] || t.type)}"><b>${esc(tileLabel(t))}</b></div>`;
    function setupBoard() {
      byTile = Object.fromEntries(board.tiles.map((t) => [t.id, t]));
      [ax, ay] = board.area; BW = board.area[2] - ax; BH = board.area[3] - ay;
      arrowDir = {};
      board.blocks.forEach((b) => { arrowDir[b.enter] = b.side === "right" ? "▶" : "◀"; arrowDir[b.exit] = b.side === "right" ? "◀" : "▶"; });
    }
    setupBoard();

    // ---- tampilan satu hadiah
    function describe(rw, badge, inline) {
      const ch = (e, tag) => ({ t: e ? e.name.split(" (")[0] : rw.id, ic: e && e.icon, tag });
      let d, src = "";
      if (rw.kind === "S") d = ch(eMap[rw.id], "S");
      else if (rw.kind === "A_CHAR") d = ch(eMap[rw.id], "A");
      else if (rw.kind === "A_ARC") d = ch(aMap[rw.id], "A Arc");
      else if (rw.kind === "B_ARC") d = ch(aMap[rw.id], "B Arc");
      else if (rw.kind === "LOST") d = { t: "Lost Pieces ×" + rw.lost, ic: R.icons && R.icons.lostPieces, tag: "" };
      else if (rw.kind === "DICE") d = { t: S("Dadu gratis ×", "Free dice ×") + rw.dice, ic: R.icons && R.icons.dice, tag: "" };
      else if (rw.skin) {
        // skin karakter featured: nama dan ikon dari data banner; sumbernya (kotak atau bonus roll) selalu ditampilkan
        const sk = (banner.skins || {})[rw.skin] || {};
        d = { t: sk.name || `${SKIN_LBL[rw.skin]} ${eMap[banner.featuredS].name.split(" (")[0]}`, ic: sk.icon, tag: "Skin", note: !sk.name ? (sk.iconOnly ? "" : S("nama belum diketahui", "name not known yet")) : sk.confirmed === false ? S("perkiraan", "estimate") : "" };
        src = rw.claim ? S(`Dari bonus ${R.skin[rw.skin].atRolls} roll papan`, `From the ${R.skin[rw.skin].atRolls}-roll board bonus`) : S("Dari kotak ", "From tile ") + SKIN_TILE[rw.skin];
      } else d = { t: "—", tag: "" };
      const pityTxt = rw.kind === "S" && rw.pity ? `Pity ${rw.pity}${rw.pityKind === "hard" ? " · hard pity" : rw.pityKind === "soft" ? " · soft pity" : ""}` : "";
      const extra = [pityTxt, src, rw.mindShard ? `Mind Shard ×${rw.mindShard}` : "", rw.warp ? `Warp Pieces ×${rw.warp}` : "", rw.lost && rw.kind !== "LOST" ? `Lost Pieces ×${rw.lost}` : ""].filter(Boolean).join(" · ");
      const cls = rw.kind === "S" ? " s" : rw.kind === "A_CHAR" || rw.kind === "A_ARC" ? " a" : "";
      return `<div class="gc-rw${cls}">${badge && !inline ? `<i class="gc-badge">${esc(badge)}</i>` : ""}${d.ic ? `<img src="${esc(img(d.ic))}" alt="" loading="lazy" width="40" height="40">` : `<span class="gc-rwi">${esc(d.tag || "·")}</span>`}<span>${badge && inline ? `<small class="gc-bi">${esc(badge)}</small>` : ""}<b>${esc(d.t)}</b>${d.tag && d.ic ? ` <em>${esc(d.tag)}</em>` : ""}${d.note ? ` <em>${esc(d.note)}</em>` : ""}${rw.dup ? ` <em>${S("duplikat", "duplicate")}</em>` : ""}${extra ? `<small>${esc(extra)}</small>` : ""}</span></div>`;
    }

    const dieIcon = (n) => (R.icons && R.icons.dice ? `<img class="gc-dice-ic" src="${esc(img(R.icons.dice))}" alt="" width="${n}" height="${n}">` : "");
    const dieIdle = () => dieIcon(40) || "🎲";
    const chipsHtml = () => banners.map((b) => `<button type="button" class="chip gc-bn" data-bn="${esc(b.id)}" aria-pressed="${b.id === banner.id}">${esc(b.name)} · ${esc(eMap[b.featuredS].name.split(" (")[0])}</button>`).join("");
    main.innerHTML = intro + `
      <p class="calc-beta gc-wide" id="gcBeta"><b>${S("Ini simulasi, bukan gacha asli.", "This is a simulation, not the real gacha.")}</b> ${S("Angka dari layar aturan di game (papan Android Dreams, dipakai juga untuk papan lain). Masih perkiraan: susunan papan Modified, posisi pintu masuk/keluar blok, jumlah isi sebagian Lost Piece Box, serta daftar karakter dan Arc A/B di papan.", "Odds come from the in-game rules screen (Android Dreams board, also used for other boards). Still estimates: the Modified board layout, block entrance/exit positions, some Lost Piece Box amounts, and the A/B character and Arc pool on the board.")}</p>
      <div class="gc-toolbar">
        <div class="gc-tb" id="gcBannerGroup"><span class="mono gc-lbl">BANNER</span><div class="gc-tabs" id="gcBanners">${chipsHtml()}</div></div>
        <div class="gc-tb"><span class="mono gc-lbl">${S("JENIS", "TYPE")}</span><div class="gc-tabs" role="tablist"><button type="button" class="chip" role="tab" id="gcTabE" aria-pressed="true">Esper</button><button type="button" class="chip" role="tab" id="gcTabA" aria-pressed="false">Arc</button></div></div>
      </div>
      <p class="txt calc-note" id="gcNote" hidden>${S("Susunan papan banner ini masih perkiraan (memakai susunan papan yang sudah diketahui).", "This banner's board layout is still an estimate (it uses the known board layout).")}</p>
      <div class="gc" id="gcEsper">
        <div class="gc-col gc-left">
        <section class="calc-card gc-main" id="gcMain">
          <div class="gc-top"><h3 id="gcTitle"></h3><span class="mono" id="gcMode"></span></div>
          <div class="gc-board" id="gcBoard"></div>
          <div class="gc-bar">
            <div class="gc-die" id="gcDie" aria-live="polite">${dieIdle()}</div>
            <div class="gc-btns"><button type="button" class="chip" id="gcR1" aria-pressed="true">${dieIcon(18)}Roll ×1</button><button type="button" class="chip" id="gcR10" aria-pressed="true">${dieIcon(18)}Roll ×10</button></div>
          </div>
          <div class="gc-pity"><div class="gc-meter"><i id="gcMeter"></i></div><p class="mono" id="gcCount"></p></div>
        </section>
        <section class="calc-card gc-side"><h3>${S("Hasil roll", "Roll results")}</h3><div id="gcOut" class="gc-out gc-res"><p class="txt">${S("Tekan Roll untuk mulai.", "Press Roll to start.")}</p></div></section>
        </div>
        <div class="gc-col gc-right">
          <section class="calc-card gc-side"><h3>Skin Perks</h3><p class="txt calc-note">${S("Skin milik karakter banner ini. Didapat dari kotaknya, atau dari bonus jumlah roll di papan ini.", "Skins of this banner's character. Won from their tile, or from the roll-count bonus on this board.")}</p><div id="gcSkins" class="gc-skins"></div></section>
          <section class="calc-card gc-side"><h3>${S("Statistik", "Stats")}</h3><div id="gcStats" class="gc-stats"></div>
            <div class="gc-btns" style="margin-top:12px"><button type="button" class="chip" id="gcShare" aria-pressed="true">${S("Bagikan hasil", "Share result")}</button><button type="button" class="chip" id="gcReset">Reset</button></div></section>
          <section class="calc-card gc-side"><h3>${S("Riwayat", "History")}</h3><div id="gcHist" class="gc-out gc-hist"></div></section>
        </div>
      </div>
      <div id="gaRoot" hidden></div>`;

    let busy = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let piece = null;
    // gambar ulang papan, bidak, judul, dan aksen untuk banner aktif
    function mountBoard() {
      const featured = eMap[banner.featuredS];
      $("#gcBoard").style.aspectRatio = `${BW}/${BH}`;
      $("#gcBoard").innerHTML = board.tiles.map(tileHtml).join("") + `<div class="gc-piece" id="gcPiece"><img src="${esc(img(featured.icon))}" alt=""></div>`;
      piece = $("#gcPiece");
      $("#gcTitle").innerHTML = `${esc(banner.name)} · <span class="gc-feat">${esc(featured.name.split(" (")[0])}</span>`;
      $(".gc").style.setProperty("--gc-accent", banner.accent);
      $("#gcNote").hidden = banner.boardConfirmed !== false;
      $$("#gcBanners .gc-bn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.bn === banner.id)));
      place(st.pos);
    }
    function place(id) {
      const t = byTile[id] || byTile[board.start];
      piece.style.left = pct(t.x - ax - TS / 2, BW);
      piece.style.top = pct(t.y - ay - TS / 2, BH);
      piece.style.width = pct(TS, BW);
      piece.style.height = pct(TS, BH);
    }
    function counters() {
      const modified = st.mode === "modified";
      $("#gcMode").textContent = modified ? S("PAPAN MODIFIED (peluang naik)", "MODIFIED BOARD (rate up)") : S("PAPAN BASELINE", "BASELINE BOARD");
      $("#gcMode").classList.toggle("on", modified);
      $("#gcCount").textContent = `${S("Roll sejak S-Class terakhir", "Rolls since last S-Class")}: ${st.sinceS}/${R.s.hardPity} · ${S("Modified setelah", "Modified after")} ${R.s.modifiedAfter} · ${S("total roll", "total rolls")}: ${st.total}`;
      $("#gcMeter").style.width = Math.min(100, st.sinceS / R.s.hardPity * 100) + "%";
    }
    async function showDie(n) {
      const die = $("#gcDie");
      for (let i = 0; i < 5; i++) { die.textContent = String(1 + Math.floor(Math.random() * 6)); await sleep(55); }
      die.textContent = String(n);
    }
    async function animate(res, fast) {
      if (res.die == null) { $("#gcDie").textContent = "★"; await sleep(fast ? 120 : 300); }
      else if (!fast) await showDie(res.die);
      else $("#gcDie").textContent = String(res.die);
      for (const id of res.path) { place(id); await sleep(fast ? 55 : 130); }
    }
    function setBusy(v) { busy = v; $("#gcR1").disabled = v; $("#gcR10").disabled = v; $$("#gcBanners .gc-bn").forEach((b) => { b.disabled = v; }); }

    async function doRolls(n) {
      if (busy) return;
      setBusy(true);
      const batch = [];
      try {
        for (let i = 0; i < n; i++) {
          const res = GE.roll(st, board, R, Math.random, { blockRule: board.blockRule });
          st = res.state;
          for (const x of [res, ...res.extra]) { await animate(x, n > 1); batch.push(x); record(x); }
          counters();
          save();
        }
        showBatch(batch);
        renderSide();
      } finally { setBusy(false); }
    }
    function record(x) {
      const add = (rw, gift) => {
        hist.unshift({ n: x.n, gift: !!gift, banner: banner.id, ...rw });
        if (rw.kind === "S") {
          stats.S++;
          if (rw.pity) { stats.pSum += rw.pity; stats.pN++; }
          slog.push({ n: x.n, id: rw.id, p: rw.pity || 0, k: rw.pityKind || "normal" });
          if (slog.length > 5000) slog.shift();
        }
        else if (rw.kind === "A_CHAR" || rw.kind === "A_ARC") stats.A++;
        else if (rw.kind === "B_ARC") stats.B++;
      };
      add(x.reward, false);
      if (x.gift) add(x.gift, true);
      (x.skinClaims || []).forEach((c) => add(c, false));
      if (hist.length > 200) hist.length = 200;
    }
    function showBatch(batch) {
      const cells = [];
      batch.forEach((x) => {
        cells.push(describe(x.reward, "#" + x.n));
        if (x.gift) cells.push(describe(x.gift, "Points Gift"));
        (x.skinClaims || []).forEach((c) => cells.push(describe(c, S("Bonus roll", "Roll bonus"))));
      });
      $("#gcOut").innerHTML = `<ol class="gc-list">${cells.map((c) => `<li>${c}</li>`).join("")}</ol>`;
    }
    function renderSkins() {
      const feat = eMap[banner.featuredS].name.split(" (")[0];
      const rolls = (st.boardRolls || {})[banner.boardId] || 0;
      $("#gcSkins").innerHTML = ["outfit", "livery", "glider"].map((k) => {
        const sk = (banner.skins || {})[k] || {};
        const have = ((st.obtained || {})["skin:" + k + ":" + banner.featuredS] || 0) > 0;
        const note = !sk.name ? (sk.iconOnly ? "" : S("nama belum diketahui", "name not known yet")) : sk.confirmed === false ? S("perkiraan", "estimate") : "";
        const rate = (R.landing[SKIN_LANDING[k]] * 100).toFixed(2);
        return `<div class="gc-sk"><div class="gc-skic">${sk.icon ? `<img src="${esc(img(sk.icon))}" alt="" loading="lazy" width="44" height="44">` : "?"}</div><div class="gc-skt"><b>${esc(sk.name || SKIN_LBL[k] + " " + feat)}</b>${note ? ` <em>${esc(note)}</em>` : ""}<small>${esc(S("Dari kotak ", "From tile ") + SKIN_TILE[k])} (${rate}% ${S("per roll", "per roll")}) · ${S("bonus", "bonus")} ${Math.min(rolls, R.skin[k].atRolls)}/${R.skin[k].atRolls} ${S("roll papan", "board rolls")}</small></div><span class="gc-skst${have ? " on" : ""}">${have ? S("Sudah dapat", "Owned") : S("Belum", "Not yet")}</span></div>`;
      }).join("");
    }
    function renderSide() {
      renderSkins();
      const chip = (a, b, ic) => `<div class="gc-st"><span>${ic ? `<img src="${esc(img(ic))}" alt="" width="16" height="16"> ` : ""}${esc(a)}</span><b>${esc(b)}</b></div>`;
      const avg = stats.S ? ` · ${S("rata-rata", "avg")} ${(st.total / stats.S).toFixed(1)}/S` : "";
      $("#gcStats").innerHTML = chip(S("Total roll", "Total rolls"), String(st.total)) + chip("S-Class", stats.S + avg) + chip("A-Class", String(stats.A)) + chip("B Arc", String(stats.B)) + chip(S("Annulith (perkiraan)", "Annulith (estimate)"), (st.total * R.cost.perRoll).toLocaleString(LANG === "en" ? "en-US" : "id-ID"), R.icons && R.icons.annulith);
      $("#gcHist").innerHTML = hist.length ? `<ol class="gc-list">${hist.slice(0, 40).map((h) => `<li>${describe(h, "#" + h.n + (h.gift ? " · Points Gift" : h.claim ? " · " + S("bonus", "bonus") : ""), true)}</li>`).join("")}</ol>` : `<p class="txt">${S("Belum ada roll.", "No rolls yet.")}</p>`;
    }
    function resetAll() {
      if (busy || !confirm(S("Reset semua hasil simulasi?", "Reset all simulation results?"))) return;
      st = GE.restoreState(null, board, R);
      st = GE.switchBoard(st, banner.boardId, board);
      hist = []; slog = []; stats = { S: 0, A: 0, B: 0, pSum: 0, pN: 0 };
      save(); place(st.pos); counters(); renderSide();
      $("#gcOut").innerHTML = `<p class="txt">${S("Tekan Roll untuk mulai.", "Press Roll to start.")}</p>`;
      $("#gcDie").innerHTML = dieIdle();
    }
    // ganti banner: pity, Modified, dan Points Gift tetap (dipakai bersama); posisi dan bonus skin per papan
    function switchBanner(id) {
      const nb = banners.find((b) => b.id === id);
      if (busy || !nb || nb.id === banner.id) return;
      banner = nb; board = boards[nb.boardFile]; R = mkRules(nb);
      st = GE.switchBoard(st, nb.boardId, board);
      setupBoard(); mountBoard(); counters(); renderSide(); save();
    }
    async function shareImage() {
      if (busy) return;
      const featured = eMap[banner.featuredS];
      const pct = (v) => (st.total ? (v / st.total * 100).toFixed(2) + "%" : "—");
      await pityChartImage({
        title: "Simulator Gacha NTE", sub: banner.name + " · " + featured.name.split(" (")[0], accent: banner.accent,
        rows: [
          { label: "S-Class", color: "#ffc24d", total: stats.S, percent: pct(stats.S), avg: avgTxt(stats.pSum, stats.pN, 2) },
          { label: "A-Class", color: "#c25be8", total: stats.A, percent: pct(stats.A), avg: "—" },
          { label: S("B-Class (Arc)", "B-Class (Arc)"), color: "#5ba8e8", total: stats.B, percent: pct(stats.B), avg: "—" },
        ],
        stat: [nfmt(st.total) + " pull", nfmt(st.total * R.cost.perRoll) + " Annulith"],
        extra: pityExtra(slog.map((e) => e.p)),
        items: slog.map((e) => ({ num: e.p, unknown: !e.p, color: e.p ? pityColorE(e.p, e.k === "hard") : "#8f8b84", hard: e.k === "hard", src: eMap[e.id] ? eMap[e.id].icon : null, n: e.n })),
        max: 90, ticks: [0, 30, 60, 90],
        zones: [{ v: 71, color: PITY_COL.orange, text: "soft pity 71" }, { v: 90, color: PITY_COL.red, text: "hard pity 90" }],
        legend: [{ color: PITY_COL.green, text: S("Awal (1-30)", "Early (1-30)") }, { color: PITY_COL.yellow, text: S("Tengah (31-70)", "Mid (31-70)") }, { color: PITY_COL.orange, text: S("Soft pity (71-89)", "Soft pity (71-89)") }, { color: PITY_COL.red, text: "Hard pity (90)" }],
        file: "gacha-nte.png", emptyText: S("Belum ada S-Class. Terus roll!", "No S-Class yet. Keep rolling!"),
      });
    }

    $("#gcR1").onclick = () => doRolls(1);
    $("#gcR10").onclick = () => doRolls(10);
    $("#gcReset").onclick = resetAll;
    $("#gcShare").onclick = shareImage;
    $("#gcBanners").onclick = (ev) => { const b = ev.target.closest(".gc-bn"); if (b) switchBanner(b.dataset.bn); };
    // tab Esper / Arc (Arc dimuat saat pertama dibuka)
    let arcMounted = false;
    const showTab = (t) => {
      const isArc = t === "arc";
      $("#gcEsper").hidden = isArc; $("#gaRoot").hidden = !isArc; $("#gcBannerGroup").hidden = isArc; $("#gcBeta").hidden = isArc;
      $("#gcNote").hidden = isArc || banner.boardConfirmed !== false;
      $("#gcTabE").setAttribute("aria-pressed", String(!isArc)); $("#gcTabA").setAttribute("aria-pressed", String(isArc));
      if (isArc && !arcMounted) { arcMounted = true; mountGachaArc($("#gaRoot"), arcs); }
    };
    $("#gcTabE").onclick = () => showTab("esper");
    $("#gcTabA").onclick = () => showTab("arc");
    if (new URLSearchParams(location.search).get("t") === "arc") showTab("arc");
    mountBoard();
    counters();
    renderSide();
  }

  // ---------------- GACHA ARC (Miracle Box) ----------------
  // Satu Pull = satu kotak berisi 10 Arc. Aturan dan angka dari nte/data/gacha-arc.json.
  async function mountGachaArc(root, arcs) {
    const AE = window.GachaArcEngine, GE = window.GachaEngine;
    const fail = (t) => { root.innerHTML = `<p class="txt">${t}</p>`; };
    if (!AE || !GE) return fail(S("Mesin gacha Arc gagal dimuat. Muat ulang halaman.", "The Arc gacha engine failed to load. Reload the page."));
    let data;
    try { data = await load("gacha-arc"); } catch (e) { return fail(S("Data gacha Arc tidak bisa dimuat.", "Arc gacha data could not be loaded.")); }
    const aMap = Object.fromEntries(arcs.map((a) => [a.slug, a]));
    const typeIcon = {};
    arcs.forEach((a) => { if (a.typeIcon) typeIcon[a.type] = a.typeIcon; });
    const banners = data.banners.filter((b) => aMap[b.featuredArc] && aMap[b.featuredArc].rarity === 5);
    if (!banners.length) return fail(S("Data banner Arc tidak valid.", "Arc banner data is not valid."));
    let banner = banners.find((b) => b.id === data.default) || banners[0];
    const rules = data.rules;

    // ---- penyimpanan lokal
    const KEY = "nte_gacha_arc_v1";
    let st = AE.newArcState(), hist = [], slog = [], tot = { S: 0, A: 0, B: 0, UP: 0, warp: 0, lost: 0, pSum: 0, pN: 0, uSum: 0, uN: 0 };
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      st = AE.restoreArcState(raw && raw.state, rules);
      if (st.boxes > 0 && raw) {
        if (Array.isArray(raw.hist)) hist = raw.hist.filter((h) => h && Number.isInteger(h.n) && Array.isArray(h.arcs)).slice(0, 60);
        // catatan Arc S permanen (tidak dibatasi 60 Pull seperti riwayat); simpanan lama diisi dari riwayat yang masih ada
        const okA = (e) => e && Number.isInteger(e.n) && Number.isInteger(e.i) && Number.isInteger(e.p) && e.p >= 0;
        if (Array.isArray(raw.slog)) slog = raw.slog.filter(okA).slice(-5000);
        else hist.slice().reverse().forEach((h) => h.arcs.forEach((a) => { if (a.r === "S") slog.push({ n: h.n, i: a.i, up: !!a.up, p: a.p || 0, u: a.u || 0, h: !!a.h }); }));
        const t = raw.tot;
        if (t) Object.keys(tot).forEach((k) => { if (Number.isInteger(t[k]) && t[k] >= 0) tot[k] = t[k]; }); // kunci baru boleh kosong di simpanan lama
        const b = banners.find((x) => x.id === raw.banner);
        if (b) banner = b;
      }
    } catch (e) { st = AE.newArcState(); }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ state: st, hist, slog, tot, banner: banner.id })); } catch (e) {} };

    const numFmt = (n) => Number(n).toLocaleString(LANG === "en" ? "en-US" : "id-ID");
    const featured = () => aMap[banner.featuredArc];
    const entryOf = (rarity, idx) => banner.pools[rarity][idx];
    function cardHtml(a, i) {
      const e = entryOf(a.rarity, a.idx), arc = e.arc ? aMap[e.arc] : null;
      const name = arc ? arc.name : `Arc ${a.rarity} · ${e.type}`;
      const art = arc ? `<img src="${esc(img(arc.icon))}" alt="" width="84" height="84">` : `<div class="ga-gen">${typeIcon[e.type] ? `<img src="${esc(img(typeIcon[e.type]))}" alt="" width="40" height="40">` : ""}<b>${a.rarity}</b></div>`;
      const bonus = (a.rarity === "S" && a.pity ? `Pity ${a.pity}${a.up && a.upPity ? " · UP " + a.upPity : ""}${a.hard ? " · hard" : ""} · ` : "") + (a.bonus.warp ? `+${a.bonus.warp} Warp` : a.bonus.lost ? `+${a.bonus.lost} Lost` : "");
      return `<div class="ga-card ga-${a.rarity.toLowerCase()}${a.up ? " ga-up" : ""}" style="--i:${i}"><div class="ga-art">${art}${a.up ? `<i class="ga-upb">UP</i>` : ""}<span class="ga-r">${a.rarity}</span></div><b>${esc(name)}</b><small>${esc(bonus)}</small></div>`;
    }

    root.innerHTML = `
      <p class="calc-beta gc-wide"><b>${S("Ini simulasi, bukan gacha asli.", "This is a simulation, not the real gacha.")}</b> ${S("Angka dari layar Arc Research Program (Echo Special) di game. Masih perkiraan: daftar Arc A (memakai semua Arc A di database), pembagian A/B di luar jaminan, dan jumlah kunci per Pull.", "Odds come from the Arc Research Program (Echo Special) screen in game. Still estimates: the A-Class Arc list (uses every A-Class Arc in the database), the A/B split outside the guarantee, and keys per Pull.")}</p>
      <div class="gc">
        <div class="gc-col gc-left">
          <section class="calc-card gc-main" id="gaMain">
            <div class="gc-top"><h3>${esc(banner.name)} · <span class="gc-feat">${esc(featured().name)}</span></h3><span class="mono">MIRACLE BOX</span></div>
            <div class="ga-stage" id="gaStage"><div class="ga-hint" id="gaHint">${S("Tekan Pull untuk membuka Miracle Box.", "Press Pull to open the Miracle Box.")}</div><div class="ga-cards" id="gaCards"></div><div class="ga-flash" id="gaFlash"></div></div>
            <div class="gc-bar"><div class="gc-btns"><button type="button" class="chip" id="gaPull" aria-pressed="true">Pull · ${rules.keysPerPull} ${S("kunci", "keys")}</button><button type="button" class="chip" id="gaSkip">${S("Lewati animasi", "Skip animation")}</button></div></div>
            <div class="ga-pities"><div><div class="mono">${S("Pity S-Class", "S-Class pity")}</div><div class="gc-meter"><i id="gaMS"></i></div><p class="mono" id="gaTS"></p></div><div><div class="mono">${S("Pity Arc UP", "UP Arc pity")}</div><div class="gc-meter"><i id="gaMU"></i></div><p class="mono" id="gaTU"></p></div></div>
          </section>
        </div>
        <div class="gc-col gc-right">
          <section class="calc-card gc-side"><h3>${S("Aturan singkat", "Rules in short")}</h3><p class="txt calc-note">${S("Satu Pull membuka satu kotak berisi 10 Arc, minimal 1 Arc A ke atas. S dijamin dalam 6 Pull, Arc UP dijamin dalam 8 Pull. Pity dipakai bersama semua Limited Issue.", "One Pull opens one box of 10 Arcs, at least 1 A-Class or above. S is guaranteed within 6 Pulls, the UP Arc within 8. Pity is shared across all Limited Issues.")}</p></section>
          <section class="calc-card gc-side"><h3>${S("Statistik", "Stats")}</h3><div id="gaStats" class="gc-stats"></div>
            <div class="gc-btns" style="margin-top:12px"><button type="button" class="chip" id="gaShare" aria-pressed="true">${S("Bagikan hasil", "Share result")}</button><button type="button" class="chip" id="gaReset">Reset</button></div></section>
          <section class="calc-card gc-side"><h3>${S("Riwayat", "History")}</h3><div id="gaHist" class="gc-out gc-hist"></div></section>
        </div>
      </div>`;
    root.querySelector("#gaMain").style.setProperty("--gc-accent", banner.accent);

    const $r = (s) => root.querySelector(s);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let busy = false, skip = false;
    const reduce = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    function pity() {
      $r("#gaMS").style.width = (st.sinceS / rules.s.pityBoxes * 100) + "%";
      $r("#gaMU").style.width = (st.sinceUp / rules.up.pityBoxes * 100) + "%";
      $r("#gaTS").textContent = `${st.sinceS}/${rules.s.pityBoxes} · ${S("dijamin di Pull ke-", "guaranteed on Pull ")}${rules.s.pityBoxes}`;
      $r("#gaTU").textContent = `${st.sinceUp}/${rules.up.pityBoxes} · ${S("dijamin di Pull ke-", "guaranteed on Pull ")}${rules.up.pityBoxes}`;
    }
    function side() {
      const chip = (a, b) => `<div class="gc-st"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
      $r("#gaStats").innerHTML = chip(S("Pull dibuka", "Pulls opened"), String(st.boxes)) + chip(S("Kunci terpakai", "Keys used"), numFmt(st.boxes * rules.keysPerPull))
        + chip("S-Class", String(tot.S)) + chip(S("Arc UP", "UP Arc"), String(tot.UP)) + chip("A-Class", String(tot.A)) + chip("B-Class", String(tot.B))
        + chip("Warp Pieces", numFmt(tot.warp)) + chip("Lost Pieces", numFmt(tot.lost));
      $r("#gaHist").innerHTML = hist.length ? `<ol class="gc-list">${hist.map((h) => {
        const c = { S: 0, A: 0, B: 0, UP: 0 };
        h.arcs.forEach((a) => { c[a.r]++; if (a.up) c.UP++; });
        return `<li><div class="gc-rw${c.S ? " s" : c.A ? " a" : ""}"><i class="gc-badge">#${h.n}</i><span><b>S ${c.S}${c.UP ? " (UP " + c.UP + ")" : ""} · A ${c.A} · B ${c.B}</b></span></div></li>`;
      }).join("")}</ol>` : `<p class="txt">${S("Belum ada Pull.", "No Pulls yet.")}</p>`;
    }
    function boom(stage) {
      const flash = $r("#gaFlash");
      flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on");
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 18; i++) {
        const s = document.createElement("i");
        s.className = "ga-shard";
        const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3, d = stage.clientWidth * (0.22 + Math.random() * 0.26);
        s.style.setProperty("--dx", Math.cos(ang) * d + "px");
        s.style.setProperty("--dy", Math.sin(ang) * d + "px");
        s.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
        frag.appendChild(s);
        setTimeout(() => s.remove(), 1000);
      }
      stage.appendChild(frag);
    }
    async function play(res) {
      const stage = $r("#gaStage"), cards = $r("#gaCards"), hint = $r("#gaHint");
      hint.hidden = true; cards.innerHTML = "";
      if (!reduce() && !skip) {
        const box = document.createElement("img");
        box.className = "ga-box"; box.alt = ""; box.src = img("img/gacha/arc-box.svg");
        stage.appendChild(box);
        void box.offsetWidth;
        box.classList.add("in"); await sleep(700);
        if (!skip) { box.classList.remove("in"); box.classList.add("spin"); await sleep(1000); }
        box.classList.remove("spin", "in"); box.classList.add("boom"); boom(stage); await sleep(380);
        box.remove();
      }
      cards.innerHTML = res.arcs.map(cardHtml).join("");
      if (res.arcs.some((a) => a.rarity === "S")) { const f = $r("#gaFlash"); f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); }
    }
    async function pull() {
      if (busy) return;
      busy = true; skip = false; $r("#gaPull").disabled = true;
      try {
        if (innerWidth < 760) $r("#gaStage").scrollIntoView({ block: "center", behavior: reduce() ? "auto" : "smooth" });
        const res = AE.openBox(st, rules, banner, Math.random);
        st = res.state;
        res.arcs.forEach((a) => {
          tot[a.rarity]++; if (a.up) tot.UP++;
          tot.warp += a.bonus.warp || 0; tot.lost += a.bonus.lost || 0;
          if (a.rarity === "S") { tot.pSum += a.pity; tot.pN++; if (a.up) { tot.uSum += a.upPity; tot.uN++; } }
        });
        hist.unshift({ n: st.boxes, arcs: res.arcs.map((a) => ({ r: a.rarity, up: a.up, i: a.idx, p: a.pity, u: a.upPity, h: !!a.hard })) });
        if (hist.length > 60) hist.length = 60;
        res.arcs.forEach((a) => { if (a.rarity === "S") { slog.push({ n: st.boxes, i: a.idx, up: a.up, p: a.pity, u: a.upPity, h: !!a.hard }); if (slog.length > 5000) slog.shift(); } });
        save();
        await play(res);
        pity(); side();
      } finally { busy = false; $r("#gaPull").disabled = false; }
    }
    function resetAll() {
      if (busy || !confirm(S("Reset semua hasil simulasi Arc?", "Reset all Arc simulation results?"))) return;
      st = AE.newArcState(); hist = []; slog = []; tot = { S: 0, A: 0, B: 0, UP: 0, warp: 0, lost: 0, pSum: 0, pN: 0, uSum: 0, uN: 0 };
      save(); pity(); side();
      $r("#gaCards").innerHTML = ""; $r("#gaHint").hidden = false;
    }
    async function shareImage() {
      if (busy) return;
      const pctA = (v) => (st.boxes ? (v / (st.boxes * rules.perBox) * 100).toFixed(2) + "%" : "—");
      await pityChartImage({
        title: "Gacha Arc NTE", sub: banner.name + " · " + featured().name, accent: banner.accent,
        rows: [
          { label: "S-Class", color: "#ffc24d", total: tot.S, percent: pctA(tot.S), avg: avgTxt(tot.pSum, tot.pN, 2) },
          { label: S("Arc UP", "UP Arc"), color: "#ffe27a", total: tot.UP, percent: pctA(tot.UP), avg: avgTxt(tot.uSum, tot.uN, 2) },
          { label: "A-Class", color: "#c25be8", total: tot.A, percent: pctA(tot.A), avg: "—" },
          { label: "B-Class", color: "#5ba8e8", total: tot.B, percent: pctA(tot.B), avg: "—" },
        ],
        stat: [nfmt(st.boxes) + " pull", nfmt(st.boxes * (rules.keysPerPull || 10)) + S(" kunci", " keys")],
        extra: pityExtra(slog.map((e) => e.p)),
        items: slog.map((e) => { const en = entryOf("S", e.i), arc = en && en.arc ? aMap[en.arc] : null; return { num: e.p, unknown: !e.p, color: e.p ? pityColorA(e.p, e.h) : "#8f8b84", hard: !!e.h, gold: !!e.up, src: arc ? arc.icon : null, tag: e.up && e.u ? "UP " + e.u : "", n: e.n }; }),
        max: 6, ticks: [0, 2, 4, 6],
        zones: [{ v: 5, color: PITY_COL.orange, text: S("hampir hard pity 5", "near hard pity 5") }, { v: 6, color: PITY_COL.red, text: "hard pity 6" }],
        legend: [{ color: PITY_COL.green, text: S("Awal (Pull 1-2)", "Early (Pull 1-2)") }, { color: PITY_COL.yellow, text: S("Tengah (3-4)", "Mid (3-4)") }, { color: PITY_COL.orange, text: S("Hampir hard pity (5)", "Near hard pity (5)") }, { color: PITY_COL.red, text: "Hard pity (6)" }, { color: "#ffc24d", text: S("Cincin emas = Arc UP", "Gold ring = UP Arc") }],
        file: "gacha-arc-nte.png", emptyText: S("Belum ada Arc S. Terus Pull!", "No S-Class Arc yet. Keep pulling!"),
      });
    }

    $r("#gaPull").onclick = pull;
    $r("#gaSkip").onclick = () => { skip = true; };
    $r("#gaReset").onclick = resetAll;
    $r("#gaShare").onclick = shareImage;
    // tampilkan hasil Pull terakhir bila ada
    if (hist.length) {
      $r("#gaHint").hidden = true;
      $r("#gaCards").innerHTML = hist[0].arcs.map((a, i) => cardHtml({ rarity: a.r, up: a.up, idx: a.i, bonus: rules.bonus[a.r], pity: a.p, upPity: a.u, hard: a.h }, i)).join("");
    }
    pity(); side();
  }

  // ---------------- TRACKER GACHA ----------------
  // Pengguna mencatat total pull dan hanya S-Class yang didapat (nama + pity); statistik, pity sekarang, dan diagram dihitung otomatis.
  // Data hanya di localStorage browser; tidak ada yang dikirim ke server.
  async function viewTracker() {
    setTitle(S("Tracker Gacha", "Gacha Tracker"));
    const [espers, arcs, arcData] = await Promise.all([load("espers"), load("arcs"), load("gacha-arc").catch(() => null)]);
    const T = window.NteTracker;
    const intro = head(S("TRACKER", "TRACKER"), S("Tracker Gacha", "Gacha Tracker"), S("Catat total pull dan S-Class yang kamu dapat. Pity, statistik, dan diagram dihitung otomatis. Data hanya tersimpan di browsermu.", "Log your total pulls and the S-Class you got. Pity, stats and the chart are calculated for you. Data stays in your browser only."), null);
    if (!T) { main.innerHTML = intro + `<p class="txt">${S("Modul tracker gagal dimuat. Muat ulang halaman.", "The tracker module failed to load. Reload the page.")}</p>`; return; }

    const eMap = Object.fromEntries(espers.map((e) => [e.slug, e]));
    const aMap = Object.fromEntries(arcs.map((a) => [a.slug, a]));
    const featuredArc = arcData && arcData.banners && (arcData.banners.find((b) => b.id === arcData.default) || arcData.banners[0] || {}).featuredArc;
    const sEspers = espers.filter((e) => e.rank === "S").map((e) => ({ id: e.slug, name: e.name.split(" (")[0] })).sort((a, b) => a.name.localeCompare(b.name));
    const sArcs = arcs.filter((a) => a.rarity === 5).map((a) => ({ id: a.slug, name: a.name })).sort((a, b) => (b.id === featuredArc) - (a.id === featuredArc) || a.name.localeCompare(b.name));

    // ---- penyimpanan lokal
    const KEY = "nte_tracker_v1";
    let data = T.emptyData();
    try { const r = T.normalizeImport(JSON.parse(localStorage.getItem(KEY) || "null")); if (r.data) data = r.data; } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(T.exportData(data))); } catch (e) {} };
    let tab = new URLSearchParams(location.search).get("t") === "arc" ? "arc" : "esper";

    const hardOf = () => T.LIM[tab].hard;
    const nameOf = (e) => (tab === "esper" ? (eMap[e.id] ? eMap[e.id].name.split(" (")[0] : e.id) : (aMap[e.arc] ? aMap[e.arc].name : e.arc));
    const iconOf = (e) => (tab === "esper" ? (eMap[e.id] && eMap[e.id].icon) : (aMap[e.arc] && aMap[e.arc].icon));
    const colorOf = (it) => (tab === "esper" ? pityColorE(it.p, it.kind === "hard") : pityColorA(it.p, it.kind === "hard"));
    const numFmt = (n, d = 0) => Number(n).toLocaleString(LANG === "en" ? "en-US" : "id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

    main.innerHTML = intro + `
      <div class="gc-toolbar"><div class="gc-tb"><span class="mono gc-lbl">${S("BANNER", "BANNER")}</span><div class="gc-tabs"><button type="button" class="chip" id="tkTabE" aria-pressed="false">${S("Esper (papan dadu)", "Esper (dice board)")}</button><button type="button" class="chip" id="tkTabA" aria-pressed="false">${S("Arc (Miracle Box)", "Arc (Miracle Box)")}</button></div></div></div>
      <p class="calc-beta gc-wide" id="tkHow"></p>
      <div class="gc">
        <div class="gc-col gc-left">
          <section class="calc-card"><h3>${S("1 · Total pull", "1 · Total pulls")}</h3>
            <div class="calc-grid"><label class="cf"><span id="tkTotalLbl"></span><input id="tkTotal" type="number" min="0" step="1" inputmode="numeric"></label><label class="cf"><span>${S("Jumlah A-Class (opsional)", "A-Class count (optional)")}</span><input id="tkA" type="number" min="0" step="1" inputmode="numeric"></label></div></section>
          <section class="calc-card"><h3>${S("2 · S-Class yang didapat", "2 · S-Class obtained")}</h3>
            <p class="txt calc-note" id="tkAddNote"></p>
            <div class="tk-add" id="tkAdd"></div>
            <div id="tkList" class="tk-listbox"></div></section>
        </div>
        <div class="gc-col gc-right">
          <section class="calc-card"><h3>${S("Statistik", "Stats")}</h3><div id="tkStats" class="gc-stats"></div><div id="tkPity" class="tk-pity"></div><div id="tkWarn"></div></section>
          <section class="calc-card"><h3>${S("Simpan dan bagikan", "Save and share")}</h3>
            <div class="gc-btns"><button type="button" class="chip" id="tkShare" aria-pressed="true">${S("Bagikan gambar", "Share image")}</button><button type="button" class="chip" id="tkExport">${S("Ekspor (.json)", "Export (.json)")}</button><button type="button" class="chip" id="tkImport">${S("Impor (.json)", "Import (.json)")}</button><button type="button" class="chip" id="tkReset">${S("Reset tab ini", "Reset this tab")}</button></div>
            <input type="file" id="tkFile" accept="application/json,.json" hidden>
            <p class="txt calc-note" style="margin-top:10px">${S("Data tersimpan di browser ini saja. Ekspor berkasnya untuk dipindah ke perangkat lain.", "Data is stored in this browser only. Export the file to move it to another device.")}</p></section>
        </div>
      </div>
      <section class="calc-card" style="margin-top:14px"><h3>${S("Diagram pity", "Pity chart")}</h3><div id="tkChart" class="tk-chart"></div></section>`;

    const $t = (s) => main.querySelector(s);
    const kd = () => data[tab];

    // ---- formulir tambah S-Class (dibuat ulang saat ganti tab)
    function buildAdd() {
      const opts = (tab === "esper" ? sEspers : sArcs).map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
      const arcExtra = tab === "arc" ? `<label class="cf tk-up"><span>${S("Arc UP?", "UP Arc?")}</span><select id="tkUpSel"><option value="0">${S("Bukan", "No")}</option><option value="1" ${featuredArc ? "selected" : ""}>${S("Ya (Arc UP)", "Yes (UP Arc)")}</option></select></label><label class="cf tk-up" id="tkUpWrap"><span>${S("Pity UP (1-8)", "UP pity (1-8)")}</span><input id="tkUpP" type="number" min="1" max="${T.LIM.arc.upHard}" step="1" inputmode="numeric"></label>` : "";
      $t("#tkAdd").innerHTML = `<label class="cf"><span>${tab === "esper" ? S("Karakter S-Class", "S-Class character") : S("Arc S-Class", "S-Class Arc")}</span><select id="tkName">${opts}</select></label>
        <label class="cf"><span>${S(`Pity (1-${hardOf()})`, `Pity (1-${hardOf()})`)}</span><input id="tkP" type="number" min="1" max="${hardOf()}" step="1" inputmode="numeric"></label>${arcExtra}
        <button type="button" class="chip" id="tkAddBtn" aria-pressed="true">${S("Tambah", "Add")}</button>`;
      if (tab === "arc") { const sel = $t("#tkUpSel"), wrap = $t("#tkUpWrap"); const sync = () => { wrap.hidden = sel.value !== "1"; }; sel.onchange = sync; sync(); }
      $t("#tkAddBtn").onclick = addEntry;
      $t("#tkP").onkeydown = (ev) => { if (ev.key === "Enter") addEntry(); };
      $t("#tkAddNote").textContent = tab === "esper"
        ? S("Pity = berapa roll sejak S-Class sebelumnya, termasuk roll saat S itu keluar (angka 1 sampai 90). Isi berurutan dari yang paling lama.", "Pity = how many rolls since the previous S-Class, including the roll it dropped on (1 to 90). Add them in order, oldest first.")
        : S("Pity = berapa Pull (kotak) sejak Arc S sebelumnya, termasuk Pull saat S itu keluar (1 sampai 6). Untuk Arc UP isi juga pity UP (1 sampai 8). Isi berurutan dari yang paling lama.", "Pity = how many Pulls (boxes) since the previous S-Class Arc, including the Pull it dropped on (1 to 6). For the UP Arc also enter the UP pity (1 to 8). Add them in order, oldest first.");
      $t("#tkTotalLbl").textContent = tab === "esper" ? S("Total roll di banner Esper", "Total rolls on the Esper banner") : S("Total Pull (kotak) di banner Arc", "Total Pulls (boxes) on the Arc banner");
      $t("#tkHow").innerHTML = `<b>${S("Cukup catat S-Class.", "Just log the S-Class.")}</b> ${S("Dari ratusan pull biasanya hanya belasan yang S. Isi total pull, lalu tambahkan tiap S-Class dengan angka pity-nya; sisanya dihitung otomatis.", "Out of hundreds of pulls only a dozen or so are S. Enter the total pulls, then add each S-Class with its pity; the rest is calculated for you.")}`;
    }

    function addEntry() {
      const p = parseInt($t("#tkP").value, 10), id = $t("#tkName").value;
      if (!id) return toast(S("Pilih nama dulu.", "Pick a name first."));
      if (!(p >= 1 && p <= hardOf())) return toast(S(`Pity harus 1 sampai ${hardOf()}.`, `Pity must be 1 to ${hardOf()}.`));
      let e;
      if (tab === "esper") e = { id, p };
      else {
        e = { arc: id, p };
        if ($t("#tkUpSel").value === "1") {
          const u = parseInt($t("#tkUpP").value, 10);
          if (!(u >= 1 && u <= T.LIM.arc.upHard)) return toast(S(`Pity UP harus 1 sampai ${T.LIM.arc.upHard}.`, `UP pity must be 1 to ${T.LIM.arc.upHard}.`));
          e.up = true; e.u = u;
        }
      }
      kd().entries.push(e);
      $t("#tkP").value = "";
      save(); refresh(); $t("#tkP").focus();
    }

    // ---- tampilan daftar, statistik, dan diagram
    function refresh() {
      const d = kd(), r = T.compute(tab, d);
      $t("#tkTotal").value = d.total || ""; $t("#tkA").value = d.a || "";
      $t("#tkList").innerHTML = d.entries.length ? `<ol class="tk-list">${d.entries.map((e, i) => {
        const it = r.items[i] || { ...e, n: 0, kind: "normal" };
        return `<li class="tk-row"><span class="tk-i">${i + 1}</span>${iconOf(e) ? `<img src="${esc(img(iconOf(e)))}" alt="" width="34" height="34" loading="lazy">` : `<span class="tk-ph"></span>`}<span class="tk-nm"><b>${esc(nameOf(e))}</b>${e.up ? ` <em>UP ${e.u}</em>` : ""}<small>${S("pull ke-", "pull #")}${numFmt(it.n)}${it.kind === "hard" ? " · hard pity" : it.kind === "soft" ? " · soft pity" : ""}</small></span><input class="tk-pin" type="number" min="1" max="${hardOf()}" value="${e.p}" data-i="${i}" aria-label="pity" style="--c:${colorOf(it)}"><span class="tk-act"><button type="button" data-act="up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="naik">↑</button><button type="button" data-act="down" data-i="${i}" ${i === d.entries.length - 1 ? "disabled" : ""} aria-label="turun">↓</button><button type="button" data-act="del" data-i="${i}" aria-label="hapus">✕</button></span></li>`;
      }).join("")}</ol>` : `<p class="txt">${S("Belum ada S-Class. Tambahkan di atas.", "No S-Class yet. Add one above.")}</p>`;

      const chip = (a, b) => `<div class="gc-st"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
      const na = (v, dd) => (v === null || v === undefined ? "—" : numFmt(v, dd));
      $t("#tkStats").innerHTML = chip("S-Class", String(r.S)) + chip("Percent", r.percent === null ? "—" : numFmt(r.percent, 2) + "%") + chip("Pity AVG", na(r.avg, 2))
        + chip(S("Terendah", "Lowest"), na(r.min)) + chip(S("Nilai tengah", "Middle value"), na(r.median, r.median % 1 ? 1 : 0)) + chip(S("Tertinggi", "Highest"), na(r.max));
      const bar = (cur, hard, soft, label) => `<div class="tk-bar"><div class="tk-barh"><span>${esc(label)}</span><b>${cur}/${hard}</b></div><div class="gc-meter"><i style="width:${Math.min(100, cur / hard * 100)}%"></i>${soft ? `<u style="left:${soft / hard * 100}%"></u>` : ""}</div></div>`;
      if (tab === "esper") {
        const L = T.LIM.esper;
        $t("#tkPity").innerHTML = bar(r.currentPity, L.hard, L.soft - 1, S("Pity sekarang", "Current pity"))
          + `<p class="txt calc-note">${r.currentPity >= L.soft ? S("Soft pity aktif (papan Modified, peluang S naik). ", "Soft pity active (Modified board, S rate up). ") : S(`Soft pity mulai setelah ${L.soft - 1} roll tanpa S. `, `Soft pity starts after ${L.soft - 1} rolls without S. `)}${S(`Hard pity dijamin ${r.toHard} roll lagi.`, `Hard pity is guaranteed in ${r.toHard} more rolls.`)}${r.avg !== null ? " " + S(`Rata-rata resmi sekitar 53,5; punyamu ${numFmt(r.avg, 1)}.`, `The official average is about 53.5; yours is ${numFmt(r.avg, 1)}.`) : ""}</p>`;
      } else {
        const L = T.LIM.arc;
        $t("#tkPity").innerHTML = bar(r.currentPity, L.hard, 0, S("Pity S sekarang", "Current S pity")) + bar(r.currentUpPity, L.upHard, 0, S("Pity UP sekarang", "Current UP pity"))
          + `<p class="txt calc-note">${S("S dijamin dalam 6 Pull, Arc UP dijamin dalam 8 Pull.", "S is guaranteed within 6 Pulls, the UP Arc within 8 Pulls.")}</p>`;
      }
      $t("#tkWarn").innerHTML = r.errors.length ? `<ul class="tk-warn">${r.errors.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : "";
      $t("#tkTabE").setAttribute("aria-pressed", String(tab === "esper")); $t("#tkTabA").setAttribute("aria-pressed", String(tab === "arc"));
      drawChart(r);
    }

    const chartOpts = (r, preview) => {
      const d = kd();
      const pctOf = (v) => (d.total > 0 ? numFmt(v / d.total * 100, 2) + "%" : "—");
      if (tab === "esper") {
        return {
          title: "Tracker Gacha NTE", sub: S("Esper · papan dadu", "Esper · dice board"), accent: "#ff5a7a", preview,
          rows: [{ label: "S-Class", color: "#ffc24d", total: r.S, percent: pctOf(r.S), avg: r.avg === null ? "—" : numFmt(r.avg, 2) }, { label: "A-Class", color: "#c25be8", total: d.a, percent: pctOf(d.a), avg: "—" }],
          extra: pityExtra(r.items.map((i) => i.p)),
          items: r.items.map((i) => ({ num: i.p, color: pityColorE(i.p, i.kind === "hard"), hard: i.kind === "hard", src: iconOf(i), n: i.n })),
          max: 90, ticks: [0, 30, 60, 90],
          zones: [{ v: 71, color: PITY_COL.orange, text: "soft pity 71" }, { v: 90, color: PITY_COL.red, text: "hard pity 90" }],
          legend: [{ color: PITY_COL.green, text: S("Awal (1-30)", "Early (1-30)") }, { color: PITY_COL.yellow, text: S("Tengah (31-70)", "Mid (31-70)") }, { color: PITY_COL.orange, text: S("Soft pity (71-89)", "Soft pity (71-89)") }, { color: PITY_COL.red, text: "Hard pity (90)" }],
          file: "tracker-esper-nte.png", emptyText: S("Belum ada S-Class. Tambahkan di tracker.", "No S-Class yet. Add some in the tracker."),
        };
      }
      const arcsN = d.total * 10, pctA = (v) => (arcsN > 0 ? numFmt(v / arcsN * 100, 2) + "%" : "—");
      const ups = r.items.filter((i) => i.up);
      return {
        title: "Tracker Gacha NTE", sub: S("Arc · Miracle Box", "Arc · Miracle Box"), accent: "#ffc24d", preview,
        rows: [{ label: "S-Class", color: "#ffc24d", total: r.S, percent: pctA(r.S), avg: r.avg === null ? "—" : numFmt(r.avg, 2) }, { label: S("Arc UP", "UP Arc"), color: "#ffe27a", total: ups.length, percent: pctA(ups.length), avg: ups.length ? numFmt(ups.reduce((a, i) => a + i.u, 0) / ups.length, 2) : "—" }, { label: "A-Class", color: "#c25be8", total: d.a, percent: pctA(d.a), avg: "—" }],
        extra: pityExtra(r.items.map((i) => i.p)),
        items: r.items.map((i) => ({ num: i.p, color: pityColorA(i.p, i.kind === "hard"), hard: i.kind === "hard", gold: !!i.up, src: iconOf(i), tag: i.up ? "UP " + i.u : "", n: i.n })),
        max: 6, ticks: [0, 2, 4, 6],
        zones: [{ v: 5, color: PITY_COL.orange, text: "5" }, { v: 6, color: PITY_COL.red, text: "6" }],
        legend: [{ color: PITY_COL.green, text: S("Awal (Pull 1-2)", "Early (Pull 1-2)") }, { color: PITY_COL.yellow, text: S("Tengah (3-4)", "Mid (3-4)") }, { color: PITY_COL.orange, text: S("Hampir hard pity (5)", "Near hard pity (5)") }, { color: PITY_COL.red, text: "Hard pity (6)" }, { color: "#ffc24d", text: S("Cincin emas = Arc UP", "Gold ring = UP Arc") }],
        file: "tracker-arc-nte.png", emptyText: S("Belum ada Arc S. Tambahkan di tracker.", "No S-Class Arc yet. Add some in the tracker."),
      };
    };
    let chartTok = 0;
    function drawChart(r) {
      const tok = ++chartTok;
      setTimeout(async () => {
        if (tok !== chartTok) return;
        try {
          const cv = await pityChartImage(chartOpts(r, true));
          if (tok !== chartTok || !cv) return;
          cv.style.cssText = "width:100%;height:auto;border-radius:12px;display:block";
          $t("#tkChart").replaceChildren(cv);
        } catch (e) { $t("#tkChart").textContent = ""; }
      }, 250);
    }

    // ---- interaksi
    $t("#tkTabE").onclick = () => { tab = "esper"; buildAdd(); refresh(); };
    $t("#tkTabA").onclick = () => { tab = "arc"; buildAdd(); refresh(); };
    const intInput = (el, key) => { el.onchange = () => { const v = parseInt(el.value, 10); kd()[key] = Number.isInteger(v) && v >= 0 && v <= 1e6 ? v : 0; save(); refresh(); }; };
    intInput($t("#tkTotal"), "total"); intInput($t("#tkA"), "a");
    $t("#tkList").onclick = (ev) => {
      const b = ev.target.closest("button[data-act]"); if (!b) return;
      const i = +b.dataset.i, arr = kd().entries;
      if (b.dataset.act === "del") arr.splice(i, 1);
      else if (b.dataset.act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      else if (b.dataset.act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
      save(); refresh();
    };
    $t("#tkList").onchange = (ev) => {
      const inp = ev.target.closest(".tk-pin"); if (!inp) return;
      const v = parseInt(inp.value, 10), e = kd().entries[+inp.dataset.i];
      if (e && v >= 1 && v <= hardOf()) { e.p = v; save(); } else toast(S(`Pity harus 1 sampai ${hardOf()}.`, `Pity must be 1 to ${hardOf()}.`));
      refresh();
    };
    $t("#tkShare").onclick = async () => { const r = T.compute(tab, kd()); await pityChartImage(chartOpts(r, false)); };
    $t("#tkExport").onclick = () => {
      const blob = new Blob([JSON.stringify(T.exportData(data), null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "nte-tracker.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    };
    $t("#tkImport").onclick = () => $t("#tkFile").click();
    $t("#tkFile").onchange = (ev) => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = "";
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) return toast(S("Berkas terlalu besar (maks. 2 MB).", "File is too large (max 2 MB)."));
      const rd = new FileReader();
      rd.onload = () => {
        let res;
        try { res = T.normalizeImport(JSON.parse(String(rd.result))); } catch (e) { res = { error: S("Berkas bukan JSON yang valid.", "The file is not valid JSON.") }; }
        if (res.error) return toast(res.error);
        if (!confirm(S("Impor akan menggantikan semua data tracker (Esper dan Arc) di browser ini. Lanjutkan?", "Importing will replace all tracker data (Esper and Arc) in this browser. Continue?"))) return;
        data = res.data; save(); refresh();
        toast(S("Data berhasil diimpor.", "Data imported."));
      };
      rd.onerror = () => toast(S("Gagal membaca berkas.", "Could not read the file."));
      rd.readAsText(f);
    };
    $t("#tkReset").onclick = () => {
      if (!confirm(S("Hapus semua catatan di tab ini?", "Delete all entries in this tab?"))) return;
      data[tab] = { total: 0, a: 0, entries: [] }; save(); refresh();
    };
    buildAdd(); refresh();
  }

  // ---------------- USULAN TIM KOMUNITAS ----------------
  let fbPromise = null;
  const fbLoad = () => (fbPromise ||= import(`${BASE}fb.js${ver}`).catch((e) => { fbPromise = null; throw e; }));
  const fbErr = (e) => {
    const c = e && e.code ? String(e.code) : "";
    if (c.includes("popup-blocked")) return S("Popup login diblokir browser. Izinkan popup untuk situs ini lalu coba lagi.", "The login popup was blocked. Allow popups for this site and try again.");
    if (c.includes("popup-closed") || c.includes("cancelled")) return S("Login dibatalkan.", "Login cancelled.");
    if (c.includes("unauthorized-domain")) return S("Domain situs belum didaftarkan di Firebase (Authorized domains).", "This domain is not in Firebase Authorized domains.");
    if (c.includes("permission-denied")) return S("Ditolak oleh aturan keamanan. Pastikan sudah login dengan email terverifikasi dan isian valid.", "Denied by security rules. Make sure you are signed in with a verified email and the form is valid.");
    return S("Terjadi kesalahan. Coba lagi nanti.", "Something went wrong. Try again later.");
  };
  const teamHtml = (t, byEsper, list, extra) => `<div class="bd-tm"><div class="bd-tm-head"><b>${esc(t.name)}</b></div>
    <div class="bd-tm-mem">${t.members.map((sl, mi) => { const m = list.find((x) => x.slug === sl); const rl = (t.roles || [])[mi]; return m ? `<a href="/esper/${m.slug}" data-link class="${m.slug === byEsper ? "me" : ""}"><img src="${img(m.icon)}" alt=""><small>${esc(m.name.split(" (")[0])}</small>${rl ? `<small class="bd-tm-role">${esc(rl)}</small>` : ""}</a>` : ""; }).join("")}</div>
    ${t.why ? `<p class="bd-tm-metric">${esc(t.why)}</p>` : ""}${extra || ""}</div>`;
  const creditHtml = (c, label) => {
    if (!c || !c.name) return "";
    const url = window.NteProposals ? window.NteProposals.mediaUrl(c.url || "") : null;
    const lnk = url ? ` · <a class="bd-tm-link" href="${esc(url)}" target="_blank" rel="noopener nofollow ugc">${S("Link Media", "Media link")} ↗</a>` : "";
    return `<p class="bd-tm-credit mono">${label || S("SUSUNAN TIM OLEH", "TEAM BY")} ${esc(c.name)}${lnk}</p>`;
  };
  // Kosakata pilihan usulan build: Arc, set modul, stat utama, dan sub-stat dikumpulkan dari data situs.
  let vocabP = null;
  const buildVocab = () => (vocabP ||= (async () => {
    const [arcs, mods, cur] = await Promise.all([load("arcs"), load("modules"), load("builds_curated").catch(() => ({}))]);
    const st = new Set(), sb = new Set();
    Object.values(cur).forEach((v) => { ((v && v.stats) || []).forEach((x) => st.add(x)); ((v && v.sub) || []).forEach((x) => sb.add(x)); });
    sb.delete("Universal DMG %");
    const sets = mods.sets || [];
    return { arcList: arcs, setList: sets, statList: [...st].sort(), subList: [...sb].sort(), ctx: { arcs: arcs.map((a) => a.slug), sets: sets.map((x) => x.id), stats: [...st], sub: [...sb] } };
  })().catch((e) => { vocabP = null; throw e; }));
  // Rotasi tim: deret langkah (karakter + aksi). Aksi: E, Q, klik kiri, tahan klik kiri, Switch.
  const MOUSE = `<svg class="rt-mouse" viewBox="0 0 16 22" width="13" height="18" aria-hidden="true"><path d="M8 1.5V9H1.5V8A6.5 6.5 0 0 1 8 1.5Z" fill="var(--accent,#ff5a7a)"/><rect x="1.5" y="1.5" width="13" height="19" rx="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5V9M1.5 9h13" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
  const rotAct = (a) => ({
    e: { html: `<b class="rt-key">E</b>`, text: S("Tombol E", "E key") },
    q: { html: `<b class="rt-key">Q</b>`, text: S("Tombol Q (ultimate)", "Q key (ultimate)") },
    atk: { html: `${MOUSE}`, text: S("Klik kiri (serangan dasar)", "Left click (basic attack)") },
    hold: { html: `${MOUSE}<small>${S("tahan", "hold")}</small>`, text: S("Tahan klik kiri", "Hold left click") },
    switch: { html: `<b class="rt-key rt-sw">⇄ Switch</b>`, text: S("Switch (ganti ke karakter ini)", "Switch (change to this character)") },
  })[a];
  const rotHtml = (steps, list, o) => {
    o = o || {};
    if (!Array.isArray(steps) || !steps.length) return "";
    const rp = Number.isInteger(o.repeat) && o.repeat >= 0 && o.repeat < steps.length ? o.repeat : null;
    let prev = null;
    const body = steps.map((x, i) => {
      const m = list.find((e) => e.slug === x.c), act = rotAct(x.a); if (!m || !act) return "";
      const nm2 = m.name.split(" (")[0];
      const mark = rp === i ? `<span class="rt-loop start" role="img" aria-label="${S("Rotasi diulang mulai dari langkah ini", "The rotation repeats from this step")}" title="${S("Rotasi diulang mulai dari langkah ini", "The rotation repeats from this step")}">↻</span>` : "";
      const sep = prev && !mark ? `<i class="rt-sep">›</i>` : "";
      prev = x.c;
      const tools = o.edit ? `<span class="rt-tools"><button type="button" data-rot-mv="${i}:-1" aria-label="${S("Geser ke kiri", "Move left")}"${i === 0 ? " disabled" : ""}>‹</button><button type="button" data-rot-mv="${i}:1" aria-label="${S("Geser ke kanan", "Move right")}"${i === steps.length - 1 ? " disabled" : ""}>›</button><button type="button" data-rot-del="${i}" aria-label="${S("Hapus langkah", "Remove step")}">×</button></span><button type="button" class="rt-rp${rp === i ? " on" : ""}" data-rot-repeat="${rp === i ? -1 : i}" aria-label="${rp === i ? S("Titik ulang (klik untuk melepas)", "Repeat point (click to remove)") : S("Ulangi rotasi dari langkah ini", "Repeat the rotation from this step")}" title="${rp === i ? S("Titik ulang (klik untuk melepas)", "Repeat point (click to remove)") : S("Ulangi rotasi dari langkah ini", "Repeat the rotation from this step")}">↻</button>` : "";
      return `${mark}${sep}<span class="rt-step${o.edit ? " edit" : ""}${rp === i ? " rp" : ""}" title="${i + 1}. ${esc(nm2)}: ${esc(act.text)}"><b class="rt-n">${i + 1}</b><img src="${img(m.icon)}" alt="${esc(nm2)}"><small class="rt-name">${esc(nm2)}</small><span class="rt-act">${act.html}</span>${tools}</span>`;
    }).join("");
    const end = rp === null ? "" : `<span class="rt-loop end" role="img" aria-label="${S(`Kembali ke langkah ${rp + 1} dan diulang`, `Loops back to step ${rp + 1}`)}" title="${S(`Kembali ke langkah ${rp + 1} dan diulang`, `Loops back to step ${rp + 1}`)}">↩<b>${rp + 1}</b></span>`;
    return `<div class="rt-seq">${body}${end}</div>`;
  };
  // Bintang: jumlah dibaca publik lewat REST Firestore (tanpa memuat SDK); memberi bintang butuh login (SDK dimuat saat diklik).
  let cfgP = null;
  const fbCfg = () => (cfgP ||= import(`${BASE}fb-config.js${ver}`));
  async function starCountsRest(esper) {
    const { firebaseConfig: c } = await fbCfg();
    const q = { from: [{ collectionId: "buildStars" }] };
    if (esper) q.where = { fieldFilter: { field: { fieldPath: "esper" }, op: "EQUAL", value: { stringValue: esper } } };
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents:runQuery?key=${encodeURIComponent(c.apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: q }) });
    if (!r.ok) throw new Error("stars " + r.status);
    const out = {};
    (await r.json()).forEach((x) => { if (x.document) { const f = x.document.fields || {}, n = Number(f.count && f.count.integerValue); if (Number.isFinite(n)) out[x.document.name.split("/").pop()] = n; } });
    return out;
  }
  const starState = { counts: {}, mine: new Set(), esper: "", hydrated: false };
  const starBtn = (pid, esper, st) => st.ro
    ? `<span class="cb-star ro" title="${S("Jumlah bintang", "Star count")}">★ <b>${st.count}</b></span>`
    : `<button type="button" class="cb-star${st.mine ? " on" : ""}" data-star="${esc(pid)}" data-star-esper="${esc(esper)}" aria-pressed="${st.mine ? "true" : "false"}" title="${S("Beri bintang (perlu login Google)", "Star this build (Google login required)")}">★ <b>${st.count}</b></button>`;
  function paintStars() {
    document.querySelectorAll("[data-star]").forEach((b) => {
      const on = starState.mine.has(b.dataset.star);
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
      const n = b.querySelector("b"); if (n) n.textContent = String(starState.counts[b.dataset.star] || 0);
    });
    document.querySelectorAll("[data-tabcount]").forEach((x) => { x.textContent = "★ " + (starState.counts[x.dataset.tabcount] || 0); });
  }
  document.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-star]"); if (!b || b.disabled) return;
    ev.preventDefault(); b.disabled = true;
    let fbm = null, u = null;
    try {
      fbm = await fbLoad(); u = fbm.current();
      if (!u) { await fbm.login(); u = fbm.current(); }
      if (!u) return;
      try { localStorage.setItem("nte_fb", "1"); } catch (e) {}
      const pid = b.dataset.star, es = b.dataset.starEsper;
      if (!starState.hydrated) { starState.mine = await fbm.myStars(u.uid, es); starState.hydrated = true; }
      const on = !starState.mine.has(pid);
      await fbm.setStar({ uid: u.uid }, pid, es, on);
      if (on) starState.mine.add(pid); else starState.mine.delete(pid);
      starState.counts[pid] = Math.max(0, (starState.counts[pid] || 0) + (on ? 1 : -1));
      paintStars();
    } catch (e) {
      // Status bintang di layar bisa tidak sinkron (mis. bintang dari perangkat lain): segarkan lalu minta coba lagi.
      if (fbm && u && String(e && e.code).includes("permission-denied")) {
        try { starState.mine = await fbm.myStars(u.uid, b.dataset.starEsper); starState.hydrated = true; paintStars(); toast(S("Status bintangmu sudah disegarkan. Coba klik bintang sekali lagi.", "Your star status was refreshed. Click the star once more.")); return; } catch (e2) {}
      }
      toast(fbErr(e));
    } finally { b.disabled = false; }
  });
  // Build komunitas yang dipilih tampil penuh dengan tata letak seperti build resmi (Arc bergambar, cartridge, stat, Awakening, skill, rotasi).
  let cbCtx = null;
  const communityDetailHtml = (b, o) => {
    if (!b) return "";
    const { V, list, e } = o;
    const rank = (i) => `<i class="bd-rank r${i + 1}">${i + 1}</i>`;
    const blk = (label, html) => (html ? `<div class="cb-block"><p class="mono cb-lab">${label}</p>${html}</div>` : "");
    const arcs = (b.arcs || []).map((sl, i) => {
      const a = V.arcList.find((x) => x.slug === sl); if (!a) return "";
      const at = o.atk ? o.atk(sl) : null;
      return `<a class="bd-arc q${a.rarity}" href="/arc/${a.slug}" data-link>${rank(i)}<img src="${img(a.icon)}" alt="" loading="lazy"><span><b>${esc(a.name)}</b><small>${esc(a.type)} · ★${a.rarity}${Array.isArray(at) && at.length ? ` · ATK ${esc(at[at.length - 1])}` : ""}</small></span></a>`;
    }).join("");
    const sets = (b.sets || []).map((x, i) => {
      const st = V.setList.find((m) => m.id === x.id); if (!st) return "";
      const bn = (st.bonuses || []).find((z) => z.pieces === x.pieces);
      return `<div class="bd-set">${rank(i)}${st.icon ? `<img src="${img(st.icon)}" alt="" loading="lazy">` : ""}<div><b>${esc(st.name)} <em>${x.pieces}${S(" keping", "-pc")}</em></b>${bn ? `<p class="cb-bn">${esc(bn.text)}</p>` : ""}</div></div>`;
    }).join("");
    const stats = (b.stats || []).map((t, i) => `<span><i>${i + 1}</i>${esc(t)}</span>`).join("");
    const sub = (b.sub || []).map((t, i) => `<span><i>${i + 1}</i>${esc(t)}</span>`).join("");
    const skillCard = (i, icon, name, small) => `<div class="bd-skill"><i>${i + 1}</i><span class="skill-ico">${icon ? `<img src="${img(icon)}" alt="" loading="lazy">` : ""}</span><span><b>${esc(name)}</b><small>${esc(small)}</small></span></div>`;
    const awks = (b.awks || []).map((n, i) => { const a = (e.awakening || [])[n - 1]; return skillCard(i, a && a.icon, a ? a.name : "A" + n, "A" + n); }).join("");
    const skills = (b.skills || []).map((g, i) => { const k = (e.skills || []).find((x) => x.group === g); return skillCard(i, (o.icons || {})[g], k ? k.name : g, LABEL.group[g] || g); }).join("");
    const team = b.team && Array.isArray(b.team.members) && b.team.members.length > 1
      ? `<div class="cb-block"><p class="mono cb-lab">${S("SUSUNAN TIM", "TEAM LINEUP")}</p><div class="bd-tm-mem">${b.team.members.map((sl, mi) => { const m = list.find((x) => x.slug === sl); const rl = (b.team.roles || [])[mi]; return m ? `<a href="/esper/${m.slug}" data-link class="${m.slug === e.slug ? "me" : ""}"><img src="${img(m.icon)}" alt=""><small>${esc(m.name.split(" (")[0])}</small>${rl ? `<small class="bd-tm-role">${esc(rl)}</small>` : ""}</a>` : ""; }).join("")}</div></div>` : "";
    const rot = (b.rot && b.rot.length) || b.rotation
      ? `<div class="cb-block"><p class="mono cb-lab">${S("ROTASI TIM", "TEAM ROTATION")}</p>${rotHtml(b.rot, list, { repeat: b.repeat })}${b.rotation ? `<p class="bd-tm-metric cb-rot">${esc(b.rotation)}</p>` : ""}</div>` : "";
    return `<div class="cb-detail">
      <div class="cb-head"><div><b class="cb-name">${esc(b.name)}</b>${creditHtml(b.credit, S("USULAN OLEH", "SUGGESTED BY"))}</div><div class="cb-badges">${o.featured ? `<em class="cb-feat">${S("BUILD UTAMA", "MAIN BUILD")}</em>` : ""}${o.star ? starBtn(b.pid, e.slug, o.star) : ""}</div></div>
      ${b.why ? `<p class="bd-tm-metric cb-why">${esc(b.why)}</p>` : ""}${team}
      ${blk(S("ARC (URUTAN = PRIORITAS)", "ARCS (ORDER = PRIORITY)"), arcs ? `<div class="bd-arcs">${arcs}</div>` : "")}
      ${blk(S("CARTRIDGE", "CARTRIDGES"), sets)}
      ${blk(S("STAT UTAMA", "MAIN STATS"), stats ? `<div class="bd-stats">${stats}</div>` : "")}${blk(S("SUB-STAT", "SUB STATS"), sub ? `<div class="bd-stats sub">${sub}</div>` : "")}
      ${blk(S("AWAKENING (URUTAN PRIORITAS)", "AWAKENINGS (PRIORITY ORDER)"), awks ? `<div class="bd-skills">${awks}</div>` : "")}
      ${blk(S("PRIORITAS NAIK LEVEL SKILL", "SKILL LEVEL-UP ORDER"), skills ? `<div class="bd-skills">${skills}</div>` : "")}${rot}
    </div>`;
  };
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-cbsel]"); if (!t || !cbCtx) return;
    const i = +t.dataset.cbsel; if (!cbCtx.ranked[i]) return;
    cbCtx.sel = i;
    document.querySelectorAll("[data-cbsel]").forEach((x) => x.classList.toggle("on", +x.dataset.cbsel === i));
    const box = document.querySelector("#cbDetail"); if (box) box.innerHTML = cbCtx.detail(i);
  });
  // Urutan kartu sama seperti tab Build: tim, Arc, set modul, stat, Awakening, skill, catatan, kredit.
  const buildCardHtml = (b, V, extra, o) => {
    o = o || {};
    const chip = (t, href) => (href ? `<a class="chip" href="${href}" data-link>${t}</a>` : `<span class="chip">${t}</span>`);
    const ce = (o.list || []).find((x) => x.slug === o.esper) || {};
    const team = b.team && Array.isArray(b.team.members) && o.list ? `<p class="mono cb-lab">${S("SUSUNAN TIM", "TEAM LINEUP")}</p><div class="bd-tm-mem">${b.team.members.map((sl, mi) => { const m = o.list.find((x) => x.slug === sl); const rl = (b.team.roles || [])[mi]; return m ? `<a href="/esper/${m.slug}" data-link class="${m.slug === o.esper ? "me" : ""}"><img src="${img(m.icon)}" alt=""><small>${esc(m.name.split(" (")[0])}</small>${rl ? `<small class="bd-tm-role">${esc(rl)}</small>` : ""}</a>` : ""; }).join("")}</div>` : "";
    const arcs = (b.arcs || []).map((sl, i) => { const a = V.arcList.find((x) => x.slug === sl); return a ? chip(`${i + 1}. ${esc(a.name)}`, `/arc/${a.slug}`) : ""; }).join("");
    const sets = (b.sets || []).map((x) => { const st = V.setList.find((m) => m.id === x.id); return st ? chip(`${esc(st.name)} ${x.pieces}${S(" keping", "-pc")}`) : ""; }).join("");
    const stats = (b.stats || []).map((t, i) => chip(`${i + 1}. ${esc(t)}`)).join("");
    const sub = (b.sub || []).map((t, i) => chip(`${i + 1}. ${esc(t)}`)).join("");
    const awks = (b.awks || []).map((n, i) => { const a = (ce.awakening || [])[n - 1]; return chip(`${i + 1}. A${n}${a ? " · " + esc(a.name) : ""}`); }).join("");
    const skills = (b.skills || []).map((g, i) => { const k = (ce.skills || []).find((x) => x.group === g); return chip(`${i + 1}. <b>${esc(LABEL.group[g] || g)}</b>: ${esc(k ? k.name : g)}`); }).join("");
    const row = (label, html) => (html ? `<p class="mono cb-lab">${label}</p><div class="cb-chips">${html}</div>` : "");
    return `<div class="bd-tm"><div class="bd-tm-head"><b>${esc(b.name)}</b>${o.star && b.pid ? starBtn(b.pid, o.esper, o.star) : ""}${o.featured ? `<em class="cb-feat">${S("BUILD UTAMA", "MAIN BUILD")}</em>` : ""}<em>${S("KOMUNITAS", "COMMUNITY")}</em></div>
      ${team}${row(S("ARC (URUTAN = PRIORITAS)", "ARCS (ORDER = PRIORITY)"), arcs)}${row(S("SET MODUL", "MODULE SETS"), sets)}${row(S("STAT UTAMA", "MAIN STATS"), stats)}${row(S("SUB-STAT", "SUB STATS"), sub)}${row(S("AWAKENING (URUTAN PRIORITAS)", "AWAKENINGS (PRIORITY ORDER)"), awks)}${row(S("PRIORITAS NAIK LEVEL SKILL", "SKILL LEVEL-UP ORDER"), skills)}${(b.rot && b.rot.length && o.list) || b.rotation ? `<p class="mono cb-lab">${S("ROTASI TIM", "TEAM ROTATION")}</p>${o.list ? rotHtml(b.rot, o.list, { repeat: b.repeat }) : ""}${b.rotation ? `<p class="bd-tm-metric cb-rot">${esc(b.rotation)}</p>` : ""}` : ""}
      ${b.why ? `<p class="bd-tm-metric">${esc(b.why)}</p>` : ""}${extra || ""}</div>`;
  };

  // Pemilih bergambar (pop-up): items = [{key, img, name, sub, text, used}]. wide = tampilan daftar untuk teks panjang.
  function pickModal(title, items, onPick, wide) {
    const old = document.querySelector(".pb-modal"); if (old) old.remove();
    const el = document.createElement("div");
    el.className = "pb-modal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", title);
    el.innerHTML = `<div class="pb-modal-box"><div class="pb-modal-head"><b>${esc(title)}</b><button type="button" class="btn ghost sm" data-x aria-label="${S("Tutup", "Close")}">×</button></div>
      <div class="pb-modal-grid${wide ? " wide" : ""}">${items.length ? items.map((it) => `<button type="button" class="pb-opt" data-k="${esc(it.key)}"${it.used ? " disabled" : ""}>${it.img ? `<img src="${img(it.img)}" alt="" loading="lazy">` : ""}<span><b>${esc(it.name)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ""}${it.text ? `<small class="pb-opt-tx">${esc(it.text)}</small>` : ""}${it.used ? `<small class="pb-opt-used">${S("Sudah dipilih di slot lain", "Already used in another slot")}</small>` : ""}</span></button>`).join("") : `<p class="txt">${S("Tidak ada pilihan.", "No options.")}</p>`}</div></div>`;
    const close = () => { el.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest("[data-x]")) { close(); return; }
      const b = e.target.closest("[data-k]"); if (b && !b.disabled) { const k = b.dataset.k; close(); onPick(k); }
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(el);
    const first = el.querySelector(".pb-opt:not([disabled])") || el.querySelector("[data-x]"); if (first) first.focus();
  }

  async function viewProposal() {
    setTitle(S("Usulkan Build dan Tim", "Suggest a Build and Team"));
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "robots"; document.head.appendChild(meta); }
    meta.content = "noindex";
    const [es, curated, comm, commB] = await Promise.all([load("espers"), load("builds_curated").catch(() => ({})), load("teams_community").catch(() => ({})), load("builds_community").catch(() => ({}))]);
    const P = window.NteProposals;
    const intro = head("USULAN", S("Usulkan Build dan Tim", "Suggest a Build and Team"), S("Punya build atau susunan tim yang bagus? Login dengan Google, isi formulirnya (tim, Arc, set modul, stat, Awakening, skill), lalu kirim. Kalau disetujui admin, usulanmu tampil di halaman karakter lengkap dengan kreditmu.", "Got a great build or team? Sign in with Google, fill in the form (team, Arcs, module sets, stats, Awakenings, skills) and send it. If the admin approves it, your suggestion appears on the character page with your credit."), null);
    if (!P) { main.innerHTML = intro + `<p class="txt">${S("Modul usulan gagal dimuat. Muat ulang halaman.", "The suggestion module failed to load. Reload the page.")}</p>`; return; }
    main.innerHTML = intro + `<div id="pbRoot"><p class="txt">${S("Memuat…", "Loading…")}</p></div>`;
    const root = $("#pbRoot");
    let fb;
    try { fb = await fbLoad(); } catch (e) { root.innerHTML = `<p class="txt">${S("Layanan login gagal dimuat (mungkin diblokir ekstensi atau offline). Coba lagi nanti.", "The login service failed to load (blocked by an extension or offline). Try again later.")}</p>`; return; }

    const known = es.filter((e) => e.slug !== "exe").map((e) => e.slug);
    const publishedTeams = (sl, skipPid) => [].concat(((curated[sl] || {}).teams) || [], (comm && comm[sl]) || [], ((commB && commB[sl]) || []).filter((b) => b && b.pid !== skipPid).map((b) => b && b.team).filter(Boolean));
    const nm = (sl) => ((es.find((x) => x.slug === sl) || {}).name || sl).split(" (")[0];
    const V = await buildVocab().catch(() => null);
    let user = null, cur = es[0].slug, members = [cur], roles = {}, form = { name: "", why: "", cname: "", url: "" }, mineList = [], mineB = [], msg = "", errs = [];
    const newBf = () => ({ name: "", why: "", arcs: ["", "", "", ""], sets: [{ id: "", pieces: 4 }, { id: "", pieces: 4 }, { id: "", pieces: 4 }], stats: ["", "", ""], sub: ["", "", "", ""], awks: ["", "", "", "", "", ""], skills: ["", "", "", ""], rot: [], repeat: null, rotation: "" });
    let bf = newBf(), editId = null;
    const ROLE_PRESETS = ["DPS", "Sub DPS", "Support", "Healing", "Tank", "Costume"];
    const roleCustom = new Set();
    let rotChar = cur;
    const pruneRot = () => { bf.rot = bf.rot.filter((x) => members.includes(x.c)); if (!members.includes(rotChar)) rotChar = cur; };
    const sentB = (sl) => mineB.find((m) => m.esper === sl) || null;
    function keepB() {
      const g = (id) => { const el = $(id); return el ? el.value : null; };
      const n = g("#pbBName"), w = g("#pbBWhy"), ro = g("#pbRotNote"); if (n !== null) bf.name = n; if (w !== null) bf.why = w; if (ro !== null) bf.rotation = ro;
      document.querySelectorAll("[data-b]").forEach((el) => {
        const m = /^(setp|stat|sub|awk|skl)(\d)$/.exec(el.dataset.b); if (!m) return; const i = +m[2];
        if (m[1] === "setp") bf.sets[i].pieces = +el.value; else if (m[1] === "stat") bf.stats[i] = el.value; else if (m[1] === "awk") bf.awks[i] = el.value; else if (m[1] === "skl") bf.skills[i] = el.value; else bf.sub[i] = el.value;
      });
    }
    const STATUS = () => ({ pending: S("Menunggu", "Pending"), approved: S("Disetujui", "Approved"), rejected: S("Ditolak", "Rejected") });
    const keep = () => { const g = (id) => { const el = $(id); return el ? el.value : null; }; const v = { name: g("#pbName"), why: g("#pbWhy"), cname: g("#pbCname"), url: g("#pbUrl") }; Object.keys(v).forEach((k) => { if (v[k] !== null) form[k] = v[k]; }); members.forEach((sl) => { const el = $(`[data-role="${sl}"]`); if (el) roles[sl] = el.value; }); keepB(); };

    const baseCount = {};
    es.forEach((x) => { const b = x.name.split(" (")[0]; baseCount[b] = (baseCount[b] || 0) + 1; });
    const chipName = (sl) => { const x = es.find((e) => e.slug === sl); if (!x) return sl; const b = x.name.split(" (")[0]; return baseCount[b] > 1 ? x.name : b; };
    const openHelp = new Set();
    const HELP = {
      char: S("Usulanmu akan tampil di halaman karakter yang kamu pilih, di tab Build, bagian \"Build dari komunitas\". Urutan isiannya sama seperti tab Build: tim, Arc, set modul, stat, Awakening, lalu skill.", "Your suggestion will appear on the chosen character's page, in the Build tab, under \"Community builds\". The fields follow the Build tab order: team, Arcs, module sets, stats, Awakenings, then skills."),
      bawk: S("Urutkan Awakening dari yang paling diprioritaskan (slot 1) sampai slot 6. Boleh dikosongkan atau diisi sebagian. Tidak boleh memilih Awakening yang sama dua kali.", "Order the Awakenings from highest priority (slot 1) to slot 6. You can leave it empty or fill part of it. The same Awakening cannot be picked twice."),
      bskl: S("Urutkan skill dari yang paling dulu dinaikkan levelnya (slot 1). Boleh dikosongkan. Tidak boleh memilih skill yang sama dua kali.", "Order the skills from the first one to level up (slot 1). You can leave it empty. The same skill cannot be picked twice."),
      mem: S("Pilih 2 sampai 4 karakter. Karakter halaman otomatis ikut dan tidak bisa dilepas. Klik lagi untuk melepas karakter lain. Angka di chip = urutan anggota.", "Pick 2 to 4 characters. The page's character is always included. Click again to remove another one. The number on a chip is the member order."),
      role: S("Pilih peran tiap anggota dari daftar (DPS, Sub DPS, Support, Healing, Tank, Costume), atau pilih \"Tulis sendiri\" untuk menulis peran lain. Boleh dikosongkan.", "Pick each member's role from the list (DPS, Sub DPS, Support, Healing, Tank, Costume), or choose \"Write your own\" for another role. You can leave it empty."),
      name: S("Nama singkat untuk susunan timmu, misalnya \"Tim Nova\". Maksimal 40 huruf.", "A short name for your team, e.g. \"Nova Team\". Max 40 characters."),
      why: S("Jelaskan singkat kenapa susunan ini bagus: sinergi, reaksi yang terbentuk, atau cara memainkannya. Maksimal 300 huruf. Boleh kosong.", "Briefly explain why this team works: synergy, reactions it forms, or how to play it. Max 300 characters. Optional."),
      cname: S("Nama ini yang tampil di bawah timmu sebagai \"Susunan tim oleh\". Bisa nama asli atau nama panggung, tidak harus sama dengan nama Google.", "This name appears under your team as \"Team by\". It can be a real name or a nickname and does not have to match your Google name."),
      url: S("Kalau diisi, usulanmu menampilkan tulisan \"Link Media\" yang membuka alamat ini. Boleh link Facebook, Instagram, YouTube, TikTok, X, Discord, dan media sosial populer lainnya. Kosongkan kalau tidak mau menampilkan link.", "If filled in, your suggestion shows a \"Media link\" that opens this address. Facebook, Instagram, YouTube, TikTok, X, Discord and other popular social media links are accepted. Leave empty for no link."),
      bname: S("Nama singkat untuk build-mu, misalnya \"Nova Burst untuk boss\". Maksimal 40 huruf.", "A short name for your build, e.g. \"Nova Burst for bosses\". Max 40 characters."),
      barc: S("Klik slot untuk membuka daftar bergambar. Hanya Arc dengan tipe yang cocok dengan karakter ini yang bisa dipilih. Pilih 1 sampai 4 Arc sesuai urutan prioritas: slot 1 yang paling kamu sarankan. Tidak boleh memilih Arc yang sama dua kali.", "Click a slot to open the picture list. Only Arcs of the type this character uses can be picked. Pick 1 to 4 Arcs in priority order: slot 1 is the one you recommend most. The same Arc cannot be picked twice."),
      bset: S("Klik slot untuk membuka daftar set bergambar lengkap dengan efek 2 dan 4 keping. Pilih sampai 3 set beserta jumlah kepingnya (2 atau 4). Boleh dikosongkan.", "Click a slot to open the picture list with the 2-piece and 4-piece effects. Pick up to 3 sets with the piece count (2 or 4). You can leave it empty."),
      brot: S("Susun rotasi langkah demi langkah: pilih karakter aktif, lalu klik aksinya (E, Q, klik kiri, tahan klik kiri, atau Switch). Untuk ganti karakter, pilih karakter tujuan lalu klik Switch, kemudian tambah aksinya. Langkah bisa digeser atau dihapus. Kalau rotasinya berulang, klik tombol ↻ kecil pada langkah tempat rotasi kembali (dari awal atau dari tengah, misalnya setelah rotasi pembuka), lalu rotasi ditandai berulang terus dari titik itu. Maksimal 50 langkah. Boleh dikosongkan.", "Build the rotation step by step: pick the active character, then click the action (E, Q, left click, hold left click or Switch). To switch character, pick the target character and click Switch, then add its actions. Steps can be moved or removed. If the rotation loops, click the small ↻ button on the step it returns to (the start or the middle, e.g. after an opening rotation) and the rotation is marked as repeating from that point. Max 50 steps. Optional."),
      brotn: S("Catatan tambahan untuk rotasi, misalnya syarat atau trik waktunya. Maksimal 500 huruf. Boleh dikosongkan.", "An extra note for the rotation, e.g. requirements or timing tricks. Max 500 characters. Optional."),
      bstat: S("Pilih 1 sampai 3 stat utama sesuai urutan prioritas. Pilihannya diambil dari daftar yang dipakai di situs ini.", "Pick 1 to 3 main stats in priority order. The choices come from the list used on this site."),
      bsub: S("Pilih sampai 4 sub-stat sesuai urutan prioritas. Boleh dikosongkan.", "Pick up to 4 sub stats in priority order. You can leave it empty."),
      bwhy: S("Jelaskan singkat kenapa build ini bagus atau untuk konten apa. Maksimal 300 huruf. Boleh kosong.", "Briefly explain why this build works or what content it is for. Max 300 characters. Optional."),
      mine: S("Menunggu = belum ditinjau admin. Disetujui = sudah tayang di situs. Ditolak = tidak ditayangkan. Tiap karakter hanya bisa kamu usulkan satu kali, tapi usulannya boleh kamu edit kapan saja lewat tombol Edit. Setelah diedit, usulan menunggu persetujuan admin lagi, dan versi yang sudah tayang tetap tampil sampai perubahannya disetujui.", "Pending = not reviewed yet. Approved = live on the site. Rejected = not published. You can suggest once per character, but you may edit it any time with the Edit button. After an edit it waits for admin approval again, and the live version stays until the change is approved."),
      priv: S("Usulan menyimpan ID akun dan nama tampilan Google-mu (hanya dilihat admin). Emailmu tidak ditampilkan. Yang tampil di situs hanya nama kredit dan Link Media yang kamu isi sendiri.", "A suggestion stores your account ID and Google display name (only the admin sees them). Your email is not shown. The site only shows the credit name and Media link you type yourself."),
    };
    const help = (k) => `<button type="button" class="pb-help" data-help="${k}" aria-expanded="${openHelp.has(k)}" aria-label="${S("Penjelasan", "Explanation")}">!</button>`;
    const hint = (k) => `<p class="pb-hint" ${openHelp.has(k) ? "" : "hidden"} data-hint="${k}">${esc(HELP[k])}</p>`;
    const field = (k, label, ctrl, forId) => `<div class="pb-field"><div class="pb-lab"><label${forId ? ` for="${forId}"` : ""}>${label}</label>${help(k)}</div>${hint(k)}${ctrl}</div>`;

    function render() {
      const auth = user
        ? `<div class="pb-user"><span>${S("Masuk sebagai", "Signed in as")} <b>${esc(user.displayName || "")}</b></span><button class="btn ghost sm" id="pbOut" type="button">${S("Keluar", "Sign out")}</button></div>`
        : `<div class="adm-row"><button class="btn" id="pbIn" type="button">${S("Login dengan Google", "Sign in with Google")}</button></div><p class="txt pb-lead">${S("Login dulu supaya usulanmu tercatat atas namamu. Cukup satu klik dengan akun Google.", "Sign in first so your suggestion is recorded under your name. One click with your Google account.")}</p>`;
      let html = `<div class="pb-card">${auth}<div class="pb-lab pb-privacy"><span class="mono">${S("PRIVASI", "PRIVACY")}</span>${help("priv")}</div>${hint("priv")}${msg ? `<p class="pb-ok">${esc(msg)}</p>` : ""}</div>`;
      pruneRot();
      if (user && V) {
        const sel = (key, val, opts, blank) => `<select data-b="${key}"><option value="">${blank}</option>${opts.map(([v, l]) => `<option value="${esc(v)}"${v === val ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
        const empty = S("— kosong —", "— empty —");
        const slot = (n, fn) => Array.from({ length: n }, (_, i) => `<div class="pb-slot"><i>${i + 1}</i>${fn(i)}</div>`).join("");
        const ce = es.find((x) => x.slug === cur) || {};
        const pickBtn = (type, i, it, emptyLabel) => `<button type="button" class="pb-pick${it ? " has" : ""}" data-pick="${type}" data-i="${i}">${it ? `${it.img ? `<img src="${img(it.img)}" alt="">` : ""}<span><b>${esc(it.name)}</b><small>${esc(it.sub || "")}</small></span>` : `<span class="pb-pick-empty">${emptyLabel}</span>`}</button>${it ? `<button type="button" class="btn ghost sm" data-clear="${type}:${i}" aria-label="${S("Kosongkan slot", "Clear slot")}">×</button>` : ""}`;
        const arcItem = (sl) => { const a = sl && V.arcList.find((x) => x.slug === sl); return a ? { img: a.icon, name: a.name, sub: `${a.type} · ★${a.rarity}` } : null; };
        const setItem = (id) => { const st = id && V.setList.find((x) => x.id === id); return st ? { img: st.icon, name: st.name, sub: "" } : null; };
        const awkOpts = (ce.awakening || []).slice(0, 6).map((x, k) => [String(k + 1), `A${k + 1} · ${x.name}`]);
        const sklOpts = ["basic", "redirect", "ultimate", "support"].map((g) => { const k = (ce.skills || []).find((x) => x.group === g); return [g, `${LABEL.group[g] || g}: ${k ? k.name : g}`]; });
        const mineFor = sentB(cur);
        const banner = !mineFor ? "" : editId === mineFor.id
          ? `<div class="pb-card pb-edit"><p><b>${S("Kamu sedang mengedit usulanmu", "You are editing your suggestion")}</b> ${S("untuk", "for")} ${esc(nm(cur))} (${esc(STATUS()[mineFor.status] || mineFor.status)}). ${S("Setelah disimpan, usulan menunggu persetujuan admin lagi. Versi yang sudah tayang tetap tampil sampai perubahan disetujui.", "After saving, it waits for admin approval again. The live version stays until the change is approved.")}</p><div class="adm-row"><button type="button" class="btn ghost sm" data-edit-cancel>${S("Batal edit", "Cancel editing")}</button></div></div>`
          : `<div class="pb-card pb-edit"><p>${S("Kamu sudah punya usulan untuk", "You already have a suggestion for")} <b>${esc(nm(cur))}</b>: ${esc((mineFor.build && mineFor.build.name) || "?")} (${esc(STATUS()[mineFor.status] || mineFor.status)}).</p><div class="adm-row"><button type="button" class="btn" data-edit="${esc(mineFor.id)}">${S("Edit usulan ini", "Edit this suggestion")}</button></div></div>`;
        html += banner + `<div class="pb-card"><h3 class="pb-h"><i>1</i>${S("Karakter dan nama usulan", "Character and suggestion name")}</h3>
          ${field("char", S("Usulan ini untuk halaman karakter", "This suggestion is for the page of"), `<select id="pbEsper">${es.filter((x) => x.slug !== "exe").map((x) => `<option value="${x.slug}"${x.slug === cur ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`, "pbEsper")}
          ${field("bname", S("Nama usulan", "Suggestion name"), `<input type="text" id="pbBName" maxlength="40" value="${esc(bf.name)}" autocomplete="off" placeholder="${S("mis. Nova Burst untuk boss", "e.g. Nova Burst for bosses")}">`, "pbBName")}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>2</i>${S("Susunan tim (opsional)", "Team lineup (optional)")}</h3>
          ${field("mem", `${S("Anggota tim", "Team members")} <small>(${members.length}/4)</small>`, `<div class="adm-chips pb-mem">${known.map((sl) => { const on = members.includes(sl); return `<button type="button" class="${on ? "on" : ""}" data-mem="${sl}"${sl === cur ? " disabled" : ""}>${on ? `<i>${members.indexOf(sl) + 1}</i>` : ""}${esc(chipName(sl))}</button>`; }).join("")}</div>`)}
          ${members.length > 1 ? field("role", S("Peran tiap anggota (opsional)", "Each member's role (optional)"), `<div class="pb-roles">${members.map((sl) => { const v = roles[sl] || "", custom = roleCustom.has(sl) || (v && !ROLE_PRESETS.includes(v)); return `<label class="pb-role"><span>${esc(chipName(sl))}</span><select data-rolesel="${sl}"><option value="">${S("— tanpa peran —", "— no role —")}</option>${ROLE_PRESETS.map((r) => `<option value="${r}"${!custom && v === r ? " selected" : ""}>${r}</option>`).join("")}<option value="__c"${custom ? " selected" : ""}>${S("Tulis sendiri…", "Write your own…")}</option></select>${custom ? `<input type="text" maxlength="24" data-role="${sl}" value="${esc(v)}" placeholder="${S("Tulis perannya", "Write the role")}">` : ""}</label>`; }).join("")}</div>`) : `<p class="pb-lead">${S("Pilih 1 sampai 3 karakter lagi kalau mau menyertakan susunan tim. Boleh dilewati.", "Pick 1 to 3 more characters to include a team lineup. You can skip this.")}</p>`}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>3</i>${S("Arc terbaik", "Best Arcs")}</h3>
          <p class="pb-lead">${S(`Karakter ini memakai Arc tipe <b>${esc(ce.arcType || "?")}</b>, jadi hanya Arc tipe itu yang bisa dipilih.`, `This character uses <b>${esc(ce.arcType || "?")}</b> Arcs, so only that type can be picked.`)}</p>
          ${field("barc", S("Arc prioritas (maks 4)", "Priority Arcs (max 4)"), slot(4, (i) => pickBtn("arc", i, arcItem(bf.arcs[i]), S("Pilih Arc", "Choose Arc"))))}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>4</i>${S("Cartridge terbaik (set modul)", "Best Cartridges (module sets)")}</h3>
          ${field("bset", S("Set modul (maks 3, opsional)", "Module sets (max 3, optional)"), slot(3, (i) => `${pickBtn("set", i, setItem(bf.sets[i].id), S("Pilih set modul", "Choose module set"))}<select data-b="setp${i}" class="pb-pc"><option value="4"${bf.sets[i].pieces === 4 ? " selected" : ""}>4 ${S("keping", "pc")}</option><option value="2"${bf.sets[i].pieces === 2 ? " selected" : ""}>2 ${S("keping", "pc")}</option></select>`))}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>5</i>${S("Stat terbaik", "Best Stats")}</h3>
          ${field("bstat", S("Stat utama (maks 3)", "Main stats (max 3)"), slot(3, (i) => sel("stat" + i, bf.stats[i], V.statList.map((x) => [x, x]), empty)))}
          ${field("bsub", S("Sub-stat (maks 4, opsional)", "Sub stats (max 4, optional)"), slot(4, (i) => sel("sub" + i, bf.sub[i], V.subList.map((x) => [x, x]), empty)))}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>6</i>${S("Awakening yang disarankan", "Recommended Awakenings")}</h3>
          ${field("bawk", S("Urutan prioritas Awakening (opsional)", "Awakening priority order (optional)"), slot(6, (i) => sel("awk" + i, bf.awks[i], awkOpts, empty)))}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>7</i>${S("Prioritas naik level skill", "Skill priority")}</h3>
          ${field("bskl", S("Urutan skill yang dinaikkan (opsional)", "Skill level-up order (optional)"), slot(4, (i) => sel("skl" + i, bf.skills[i], sklOpts, empty)))}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>8</i>${S("Rotasi tim", "Team rotation")}</h3>
          ${field("brot", S("Susun rotasi (opsional)", "Build the rotation (optional)"), `<div class="rt-build">
            <p class="mono cb-lab">${S("1. PILIH KARAKTER AKTIF", "1. PICK THE ACTIVE CHARACTER")}</p>
            <div class="rt-chars">${members.map((sl) => { const m = es.find((x) => x.slug === sl); return m ? `<button type="button" class="${sl === rotChar ? "on" : ""}" data-rot-char="${sl}" title="${esc(m.name)}"><img src="${img(m.icon)}" alt=""><small>${esc(chipName(sl))}</small></button>` : ""; }).join("")}</div>
            <p class="mono cb-lab">${S("2. KLIK AKSINYA", "2. CLICK THE ACTION")}</p>
            <div class="rt-acts">${["e", "q", "atk", "hold", "switch"].map((a2) => `<button type="button" class="chip" data-rot-add="${a2}"${bf.rot.length >= P.MAX.rotSteps ? " disabled" : ""}>${rotAct(a2).html}<span>${esc(rotAct(a2).text)}</span></button>`).join("")}</div>
            <p class="mono cb-lab">${S("RANGKAIAN ROTASI", "ROTATION SEQUENCE")} (${bf.rot.length}/${P.MAX.rotSteps})</p>
            ${bf.rot.length ? rotHtml(bf.rot, es, { edit: true, repeat: bf.repeat }) : `<p class="pb-lead">${S("Belum ada langkah. Pilih karakter lalu klik aksi di atas.", "No steps yet. Pick a character, then click an action above.")}</p>`}
            ${bf.rot.length ? `<p class="pb-lead rt-rp-info">${Number.isInteger(bf.repeat) ? S(`Rotasi diulang terus mulai dari langkah ${bf.repeat + 1}${bf.repeat === 0 ? " (dari awal)" : ""}.`, `The rotation repeats from step ${bf.repeat + 1}${bf.repeat === 0 ? " (from the start)" : ""}.`) : S("Rotasi belum diberi titik ulang. Klik tombol ↻ kecil pada langkah tempat rotasi kembali, atau tombol di bawah untuk mengulang dari awal.", "No repeat point yet. Click the small ↻ button on the step the rotation loops back to, or use the button below to repeat from the start.")}</p><div class="adm-row"><button type="button" class="btn ghost sm" data-rot-repeat="0">↻ ${S("Ulangi dari awal", "Repeat from the start")}</button>${Number.isInteger(bf.repeat) ? `<button type="button" class="btn ghost sm" data-rot-repeat="-1">${S("Tanpa ulang", "No repeat")}</button>` : ""}<button type="button" class="btn ghost sm" data-rot-clear>${S("Hapus semua langkah", "Clear all steps")}</button></div>` : ""}
          </div>`)}
          ${field("brotn", S("Catatan rotasi (opsional)", "Rotation note (optional)"), `<textarea id="pbRotNote" maxlength="500" rows="2">${esc(bf.rotation)}</textarea>`, "pbRotNote")}
        </div>
        <div class="pb-card"><h3 class="pb-h"><i>9</i>${S("Catatan dan kredit", "Notes and credit")}</h3>
          ${field("bwhy", S("Catatan (opsional)", "Notes (optional)"), `<textarea id="pbBWhy" maxlength="300" rows="3">${esc(bf.why)}</textarea>`, "pbBWhy")}
          ${field("cname", S("Nama untuk kredit", "Credit name"), `<input type="text" id="pbCname" maxlength="40" value="${esc(form.cname || user.displayName || "")}" autocomplete="off">`, "pbCname")}
          ${field("url", S("Link Media (opsional)", "Media link (optional)"), `<input type="url" id="pbUrl" maxlength="200" placeholder="https://www.instagram.com/namamu" value="${esc(form.url)}" autocomplete="off">`, "pbUrl")}
          ${errs.length ? `<ul class="tk-warn">${errs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          ${editId && mineFor && editId === mineFor.id ? `<div class="adm-row pb-send"><button class="btn" id="pbSaveB" type="button">${S("Simpan perubahan", "Save changes")}</button></div>` : mineFor ? `<p class="pb-lead">${S("Klik \"Edit usulan ini\" di bagian atas untuk mengubah usulanmu.", "Click \"Edit this suggestion\" at the top to change your suggestion.")}</p>` : `<div class="adm-row pb-send"><button class="btn" id="pbSendB" type="button">${S("Kirim usulan", "Send suggestion")}</button></div>`}
          <p class="pb-foot">${S("Admin meninjau dulu sebelum tayang. Tiap karakter hanya bisa kamu usulkan SATU kali (karakter lain tetap boleh), tapi usulanmu boleh diedit kapan saja. Setelah diedit, usulan menunggu persetujuan admin lagi. Susunan tim yang anggotanya sama dengan tim yang sudah ada akan ditolak. Usulan tampil sebagai Build dari komunitas, terpisah dari rekomendasi resmi.", "The admin reviews it before it goes live. You can suggest ONE per character (other characters are still fine), but you may edit your suggestion any time. After an edit it waits for admin approval again. A team with the same members as an existing one is rejected. It appears as a community build, separate from the official recommendation.")}</p>
        </div>
        <div class="pb-card"><div class="pb-lab"><h3 class="pb-h pb-h2">${S("Usulanku", "My suggestions")}</h3>${help("mine")}</div>${hint("mine")}${mineB.length + mineList.length ? `<ul class="pb-list">${mineB.map((m) => `<li><span><b>${esc((m.build && m.build.name) || "?")}</b><small>${esc(nm(m.esper))} · <em class="pb-st ${esc(m.status)}">${esc(STATUS()[m.status] || m.status)}</em></small></span><button type="button" class="btn ghost sm" data-edit="${esc(m.id)}">${S("Edit", "Edit")}</button></li>`).concat(mineList.map((m) => `<li><span><b>${esc((m.team && m.team.name) || "?")}</b><small>${esc(nm(m.esper))} · ${S("tim", "team")} · <em class="pb-st ${esc(m.status)}">${esc(STATUS()[m.status] || m.status)}</em></small></span></li>`)).join("")}</ul>` : `<p class="txt">${S("Belum ada usulan.", "No suggestions yet.")}</p>`}</div>`;
      }
      root.innerHTML = html;
    }
    function collectBuild() {
      const credit = { name: form.cname || (user.displayName || ""), url: form.url };
      const raw = { name: bf.name, arcs: bf.arcs.filter(Boolean), sets: bf.sets.filter((x) => x.id).map((x) => ({ id: x.id, pieces: +x.pieces })), stats: bf.stats.filter(Boolean), sub: bf.sub.filter(Boolean), awks: bf.awks.filter(Boolean).map(Number), skills: bf.skills.filter(Boolean), rot: bf.rot.map((x) => ({ c: x.c, a: x.a })), repeat: bf.rot.length ? bf.repeat : null, rotation: bf.rotation, why: bf.why, credit };
      if (members.length > 1) raw.team = { members: members.slice(), roles: members.map((sl) => roles[sl] || "") };
      const ceT = (es.find((x) => x.slug === cur) || {}).arcType;
      return P.sanitizeBuild(raw, { ...V.ctx, arcs: V.arcList.filter((a) => a.type === ceT).map((a) => a.slug), espers: known }, cur);
    }
    function loadForEdit(m) {
      const b = m.build || {}, c = m.credit || {}, pad = (arr, n, f) => Array.from({ length: n }, (_, i) => f((arr || [])[i]));
      cur = m.esper; editId = m.id; errs = []; msg = "";
      members = b.team && Array.isArray(b.team.members) && b.team.members.includes(cur) ? b.team.members.slice() : [cur];
      roles = {}; roleCustom.clear();
      if (b.team && Array.isArray(b.team.members)) b.team.members.forEach((sl, i) => { roles[sl] = (b.team.roles || [])[i] || ""; if (roles[sl] && !ROLE_PRESETS.includes(roles[sl])) roleCustom.add(sl); });
      bf = { name: b.name || "", why: b.why || "", arcs: pad(b.arcs, 4, (x) => x || ""), sets: pad(b.sets, 3, (x) => (x ? { id: x.id, pieces: x.pieces } : { id: "", pieces: 4 })), stats: pad(b.stats, 3, (x) => x || ""), sub: pad(b.sub, 4, (x) => x || ""), awks: pad(b.awks, 6, (x) => (x ? String(x) : "")), skills: pad(b.skills, 4, (x) => x || ""), rot: (b.rot || []).map((x) => ({ c: x.c, a: x.a })), repeat: Number.isInteger(b.repeat) ? b.repeat : null, rotation: b.rotation || "" };
      form.cname = c.name || ""; form.url = c.url || ""; rotChar = cur;
    }
    async function loadMine() {
      try { mineList = user ? await fb.mine(user) : []; } catch (e) { mineList = []; }
      try { mineB = user ? await fb.mineBuilds(user) : []; } catch (e) { mineB = []; }
    }

    fb.onUser(async (u) => {
      user = u ? { uid: u.uid, displayName: u.displayName } : null;
      msg = ""; errs = []; await loadMine(); render();
    });
    root.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button"); if (!t) return;
      if (t.dataset.help) { const k = t.dataset.help; if (openHelp.has(k)) openHelp.delete(k); else openHelp.add(k); keep(); render(); return; }
      try {
        if (t.dataset.rotChar) { keep(); rotChar = t.dataset.rotChar; render(); return; }
        if (t.dataset.rotAdd) { keep(); if (bf.rot.length < P.MAX.rotSteps && members.includes(rotChar)) bf.rot.push({ c: rotChar, a: t.dataset.rotAdd }); else if (bf.rot.length >= P.MAX.rotSteps) toast(S("Maksimal 50 langkah.", "Maximum 50 steps.")); render(); return; }
        if (t.dataset.rotRepeat !== undefined) { keep(); const v = +t.dataset.rotRepeat; bf.repeat = v >= 0 && v < bf.rot.length ? v : null; render(); return; }
        if (t.dataset.rotDel !== undefined) {
          keep(); const di = +t.dataset.rotDel; bf.rot.splice(di, 1);
          if (Number.isInteger(bf.repeat)) { if (!bf.rot.length) bf.repeat = null; else if (di < bf.repeat) bf.repeat -= 1; else if (bf.repeat >= bf.rot.length) bf.repeat = bf.rot.length - 1; }
          render(); return;
        }
        if (t.dataset.rotMv) { keep(); const [ix, dx] = t.dataset.rotMv.split(":").map(Number), jx = ix + dx; if (jx >= 0 && jx < bf.rot.length) { const tmp = bf.rot[ix]; bf.rot[ix] = bf.rot[jx]; bf.rot[jx] = tmp; if (bf.repeat === ix) bf.repeat = jx; else if (bf.repeat === jx) bf.repeat = ix; } render(); return; }
        if (t.dataset.rotClear !== undefined) { keep(); bf.rot = []; bf.repeat = null; render(); return; }
        if (t.dataset.clear) { keep(); const [ty, ix] = t.dataset.clear.split(":"); if (ty === "arc") bf.arcs[+ix] = ""; else bf.sets[+ix].id = ""; render(); return; }
        if (t.dataset.pick) {
          keep(); const ty = t.dataset.pick, ix = +t.dataset.i, ce2 = es.find((x) => x.slug === cur) || {};
          if (ty === "arc") {
            const items = V.arcList.filter((a) => a.type === ce2.arcType).sort((x, y) => y.rarity - x.rarity || x.name.localeCompare(y.name)).map((a) => ({ key: a.slug, img: a.icon, name: a.name, sub: `${a.type} · ★${a.rarity}`, text: (a.effect && a.effect.name) || "", used: bf.arcs.some((v, k) => v === a.slug && k !== ix) }));
            pickModal(S(`Pilih Arc tipe ${ce2.arcType}`, `Choose a ${ce2.arcType} Arc`), items, (k) => { bf.arcs[ix] = k; render(); });
          } else {
            const items = V.setList.map((st) => ({ key: st.id, img: st.icon, name: st.name, sub: "", text: (st.bonuses || []).map((b) => `${b.pieces}${S(" keping", "-pc")}: ${b.text}`).join("  ·  "), used: bf.sets.some((v, k) => v.id === st.id && k !== ix) }));
            pickModal(S("Pilih set modul", "Choose a module set"), items, (k) => { bf.sets[ix].id = k; render(); }, true);
          }
          return;
        }
        if (t.dataset.edit) { const m = mineB.find((x) => x.id === t.dataset.edit); if (m) { loadForEdit(m); render(); root.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
        if (t.dataset.editCancel !== undefined) { keep(); editId = null; bf = newBf(); members = [cur]; roles = {}; roleCustom.clear(); rotChar = cur; errs = []; render(); return; }
        if (t.id === "pbSendB" || t.id === "pbSaveB") {
          keep();
          const saving = t.id === "pbSaveB";
          const r = collectBuild();
          errs = r.errors; if (!r.build) { render(); return; }
          const id = P.docId(user.uid, cur);
          if (!id) { toast(S("Data akun tidak valid.", "Invalid account data.")); return; }
          await loadMine();
          const mineNow = sentB(cur);
          if (!saving && mineNow) { errs = [S("Kamu sudah punya usulan untuk karakter ini. Pakai tombol Edit untuk mengubahnya.", "You already have a suggestion for this character. Use the Edit button to change it.")]; render(); return; }
          if (saving && (!mineNow || mineNow.id !== editId)) { errs = [S("Usulan yang diedit tidak ditemukan. Muat ulang halaman.", "The suggestion being edited was not found. Reload the page.")]; render(); return; }
          if (r.build.team && P.duplicateOf(r.build.team.members, publishedTeams(cur, saving ? editId : null))) { errs = [S("Susunan tim dengan anggota yang sama sudah ada, jadi ditolak. Ubah anggota timnya atau kosongkan bagian tim.", "A team with the same members already exists, so it is rejected. Change the members or leave the team empty.")]; render(); return; }
          const q = saving
            ? S("Simpan perubahan? Usulanmu akan menunggu persetujuan admin lagi. Versi yang sudah tayang tetap tampil sampai perubahan disetujui.", "Save changes? Your suggestion will wait for admin approval again. The live version stays until the change is approved.")
            : S("Kirim usulan ini? Karakter ini tidak bisa kamu usulkan lagi, tapi usulannya masih bisa kamu edit nanti.", "Send this suggestion? You cannot suggest for this character again, but you can still edit it later.");
          if (!(await ask(q, saving ? S("Simpan", "Save") : S("Kirim", "Send"), S("Periksa lagi", "Check again")))) return;
          t.disabled = true;
          const { credit: cr, ...core } = r.build;
          if (saving) await fb.updateBuild(editId, core, cr); else await fb.submitBuild(user, cur, core, cr, id);
          await loadMine(); msg = saving ? S("PERUBAHAN TERSIMPAN. MENUNGGU PERSETUJUAN ADMIN.", "CHANGES SAVED. WAITING FOR ADMIN APPROVAL.") : S("USULAN TERKIRIM. MENUNGGU TINJAUAN ADMIN.", "SUGGESTION SENT. WAITING FOR ADMIN REVIEW.");
          editId = null; bf = newBf(); members = [cur]; roles = {}; roleCustom.clear(); rotChar = cur; render(); toast(saving ? S("Perubahan tersimpan.", "Changes saved.") : S("Usulan terkirim. Terima kasih!", "Suggestion sent. Thank you!")); return;
        }
        if (t.id === "pbIn") { await fb.login(); return; }
        if (t.id === "pbOut") { await fb.logout(); return; }
        if (t.dataset.mem) {
          keep(); const sl = t.dataset.mem, i = members.indexOf(sl);
          if (i >= 0) members.splice(i, 1); else if (members.length < P.MAX.members) members.push(sl); else toast(S("Maksimal 4 anggota.", "Maximum 4 members."));
          render(); return;
        }
      } catch (e) { toast(fbErr(e)); render(); }
    });
    root.addEventListener("change", (ev) => {
      const rs = ev.target.dataset && ev.target.dataset.rolesel;
      if (rs) {
        keep(); const v = ev.target.value;
        if (v === "__c") { roleCustom.add(rs); if (ROLE_PRESETS.includes(roles[rs])) roles[rs] = ""; } else { roleCustom.delete(rs); roles[rs] = v; }
        render(); const inp = $(`[data-role="${rs}"]`); if (inp) inp.focus(); return;
      }
      if (ev.target.id === "pbEsper") { keep(); cur = ev.target.value; if (editId) { editId = null; bf = newBf(); members = [cur]; roles = {}; roleCustom.clear(); rotChar = cur; } members = [cur].concat(members.filter((s) => s !== cur)).slice(0, 4); errs = []; const nt = (es.find((x) => x.slug === cur) || {}).arcType; bf.arcs = bf.arcs.map((sl) => { const a = V && V.arcList.find((x) => x.slug === sl); return a && a.type === nt ? sl : ""; }); render(); }
    });
  }

  // ---------------- TENTANG ----------------
  async function viewAbout() {
    setTitle(S("Tentang", "About"));
    const meta = await load("meta").catch(() => ({}));
    const date = meta.sourceDate ? new Date(meta.sourceDate).toLocaleDateString(LANG === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" }) : "";
    const sec = (h, body) => `<div class="af-sec"><h4>${h}</h4>${body}</div>`;
    const p = (t) => `<p class="txt about-p">${t}</p>`;
    const li = (items) => `<ul class="about-list">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
    const a = (href, t) => `<a href="${href}" target="_blank" rel="noopener">${t}</a>`;
    main.innerHTML = head(S("TENTANG", "ABOUT"), S("Tentang Arsip Hethereau", "About Hethereau Archive"), S("Apa situs ini, dari mana datanya, dan bagaimana semuanya dibuat.", "What this site is, where the data comes from, and how it is made."), null) + `
      <div class="about">
        ${sec(S("Tentang situs ini", "About this site"), p(S(
          `Arsip Hethereau adalah database fan-made untuk game <b>Neverness to Everness</b> (NTE) dalam Bahasa Indonesia, dibuat oleh ${a("https://febrycoeg.my.id", "Febry Coeg")}. Isinya Esper, Arc, Modul, Item, Furnitur, Kendaraan, Properti, Cerita, Anomali, Pencapaian, Fashion, Makanan, Versi &amp; Patch, serta Tier List, Kalkulator Damage, dan Simulator Gacha. Efek, deskripsi, dan cerita diterjemahkan ke Bahasa Indonesia; tombol ID/EN mengubah isinya ke Bahasa Inggris aslinya.`,
          `Hethereau Archive is a fan-made database for <b>Neverness to Everness</b> (NTE) in Indonesian, made by ${a("https://febrycoeg.my.id", "Febry Coeg")}. It covers Espers, Arcs, Modules, Items, Furniture, Vehicles, Property, Story, Anomalies, Achievements, Fashion, Food, Versions &amp; Patches, plus a Tier List maker, a Damage Calculator and a Gacha Simulator. Effects, descriptions and story are translated to Indonesian; the ID/EN button switches the content to the original English.`)))}
        ${sec(S("Sumber data dan gambar", "Data and image sources"), p(S(
          `Data dan gambar diolah dari ${a("https://github.com/Waifus-Grace/NTE_Assets", "NTE_Assets")}, hasil ekstrak file game, lalu diubah menjadi JSON dan gambar WebP dengan skrip Python.${meta.sourceVersion ? ` Versi data saat ini: <b>${esc(meta.sourceVersion)}</b>${date ? ` (${esc(date)})` : ""}.` : ""} Nama karakter, item, skill, dan istilah game sengaja tidak diterjemahkan.`,
          `Data and images are processed from ${a("https://github.com/Waifus-Grace/NTE_Assets", "NTE_Assets")}, an extract of the game files, then converted into JSON and WebP images with Python scripts.${meta.sourceVersion ? ` Current data version: <b>${esc(meta.sourceVersion)}</b>${date ? ` (${esc(date)})` : ""}.` : ""} Names of characters, items, skills and game terms are intentionally left untranslated.`)))}
        ${sec(S("Hak cipta dan status", "Copyright and status"), p(S(
          `Neverness to Everness, termasuk semua data, gambar, nama, dan karakternya, adalah hak cipta <b>Hotta Studio / Perfect World</b>. Situs ini adalah fan-site tidak resmi dan <b>tidak berafiliasi</b> dengan Hotta Studio maupun Perfect World. Kalau ada konten yang perlu dihapus atau diperbaiki, hubungi lewat Discord di bawah.`,
          `Neverness to Everness, including all of its data, images, names and characters, is copyright <b>Hotta Studio / Perfect World</b>. This is an unofficial fan site and is <b>not affiliated</b> with Hotta Studio or Perfect World. If any content needs removing or fixing, reach out on Discord below.`)))}
        ${sec(S("Build rekomendasi", "Recommended builds"), p(S(
          "Tab Build di halaman Esper (Arc, set modul, stat, Awakening, skill, dan tim) ditulis sendiri oleh pemilik situs, bukan hasil kutipan dari situs lain. Isinya pendapat dan bisa berubah seiring update game.",
          "The Build tab on Esper pages (Arcs, module sets, stats, Awakenings, skills and teams) is written by the site owner, not copied from other sites. It is opinion and may change with game updates.")))}
        ${sec(S("Kalkulator dan status musuh", "Calculator and enemy stats"), p(S(
          `Rumus damage mengacu pada pembahasan komunitas <b>NGA</b> (forum game Tiongkok), dan hasil hitungannya sudah dicocokkan dengan contoh di sana. Angka musuh (HP, DEF, Resist, dan Break) diambil langsung dari tabel data game, dan HP satu boss Beyond the Rails sudah dicocokkan dengan rekaman pertarungan asli. Efek Awakening, Arc, dan modul belum dihitung otomatis, jadi hasil Kalkulator berupa perkiraan dan bukan angka pasti dari game.`,
          `The damage formula follows discussions in the <b>NGA</b> community (a Chinese gaming forum), and its results have been checked against examples there. Enemy numbers (HP, DEF, Resist and Break) come straight from the game's data tables, and one Beyond the Rails boss's HP was matched against a real recorded fight. Awakening, Arc and module effects are not applied automatically, so Calculator results are estimates, not exact in-game numbers.`)))}
        ${sec(S("Data salah atau masukan?", "Wrong data or feedback?"), p(S(
          `Pakai tombol <b>Laporkan data salah</b> di bagian bawah halaman mana pun, atau bergabung ke ${a(LINK.community, "Febry Coeg Server")}.`,
          `Use the <b>Report wrong data</b> button at the bottom of any page, or join the ${a(LINK.community, "Febry Coeg Server")}.`)) + `<p class="about-btns"><button type="button" class="chip" data-report>${S("Laporkan data salah", "Report wrong data")}</button><a class="chip" href="${LINK.community}" target="_blank" rel="noopener">Discord</a><a class="chip" href="${LINK.donate}" target="_blank" rel="noopener">${S("Dukung lewat Trakteer", "Support via Trakteer")}</a></p>`)}
        ${sec(S("Teknologi", "Technology"), li([
          S("HTML, CSS, dan JavaScript murni tanpa framework", "Plain HTML, CSS and JavaScript, no framework"),
          S("Python untuk mengolah data dan gambar", "Python for processing data and images"),
        ]))}
      </div>`;
  }

  // ---------------- LAPORAN DATA SALAH ----------------
  function openReport() {
    const url = location.href;
    const compose = (note) => `**Laporan data salah · nteid.site**\nHalaman: ${url}\nMasalah: ${note || "(belum diisi)"}`;
    sheet({ name: S("Laporkan data salah", "Report wrong data") }, `<span class="mono">${S("LAPORAN", "REPORT")}</span>`,
      `<p class="txt">${S("Ceritakan apa yang salah (angka, nama, atau terjemahan). Alamat halaman ini ikut dilampirkan, jadi hasil Kalkulator-mu juga ikut terbawa.", "Tell us what is wrong (a number, a name, or a translation). This page's address is attached, so your Calculator result comes with it.")}</p>
       <label class="cf" style="margin-top:12px"><span>${S("Apa yang salah?", "What is wrong?")}</span><textarea id="rpNote" rows="4" class="rp-note" placeholder="${esc(S("Contoh: ATK Arc Echoes on Hold Lv80 di game 580, di sini 570", "Example: Echoes on Hold Lv80 ATK is 580 in game, 570 here"))}"></textarea></label>
       <p class="mono rp-url">${esc(url)}</p>
       <div class="rp-btns">
         ${LINK.reportWebhook ? `<button type="button" class="chip" id="rpSend" aria-pressed="true">${S("Kirim ke Discord", "Send to Discord")}</button>` : ""}
         <button type="button" class="chip" id="rpCopy">${S("Salin laporan", "Copy report")}</button>
         <a class="chip" href="${LINK.community}" target="_blank" rel="noopener">${S("Buka Discord", "Open Discord")}</a>
       </div>
       <p class="txt calc-note" id="rpMsg"></p>`);
    const note = () => ($("#rpNote").value || "").trim().slice(0, 1500);
    const msg = (t) => { $("#rpMsg").textContent = t; };
    $("#rpCopy").onclick = async () => {
      const text = compose(note());
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {}
      msg(ok ? S("Laporan disalin. Tempel di channel Discord.", "Report copied. Paste it in the Discord channel.") : S("Gagal menyalin, salin teksnya secara manual.", "Could not copy, copy the text manually."));
    };
    const send = $("#rpSend");
    if (send) send.onclick = async () => {
      if (!note()) { msg(S("Tulis dulu apa yang salah.", "Write what is wrong first.")); return; }
      send.disabled = true;
      try {
        const r = await fetch(LINK.reportWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "Laporan nteid.site", content: compose(note()).slice(0, 1900), allowed_mentions: { parse: [] } }) });
        msg(r.ok ? S("Terkirim ke Discord. Terima kasih!", "Sent to Discord. Thank you!") : S("Gagal mengirim, gunakan Salin laporan.", "Could not send, use Copy report."));
      } catch (e) { msg(S("Gagal mengirim, gunakan Salin laporan.", "Could not send, use Copy report.")); }
      send.disabled = false;
    };
  }
  document.addEventListener("click", (ev) => { if (ev.target.closest("[data-report]")) { ev.preventDefault(); openReport(); } });

  // ---------------- MUSUH ----------------
  const lvLabel = (v, k) => { if (v && v.kind === "abyss") { const [a, b] = String(k).split("-"); return `${S("Musim", "Season")} ${+a} · Stage ${+b}${String(k).split("-").length > 2 ? "·" + String(k).split("-")[2] : ""}`; } return k; };
  async function viewEnemies() {
    setTitle(S("Status Anomali", "Anomaly Stats"));
    const list = await load("enemies");
    const TYPES = { weekly: S("Boss mingguan", "Weekly boss"), boss: S("Boss", "Boss"), elite: S("Elite", "Elite"), normal: S("Musuh biasa", "Regular") };
    const RES = [["normal", S("Normal", "Normal")], ["cosmos", "Cosmos"], ["nature", "Anima"], ["incantation", "Incantation"], ["chaos", "Chaos"], ["psyche", "Psyche"], ["lakshana", "Lakshana"]];
    const num = (n) => Number(n).toLocaleString(LANG === "en" ? "en-US" : "id-ID");
    const pct = (r) => `${Math.round(r * 1000) / 10}%`;
    main.innerHTML = head(S("STATUS ANOMALI", "ANOMALY STATS"), S("Informasi Status Anomali", "Anomaly Stats Info"), S("Status anomali dan monster di setiap level: HP, ATK, DEF, Resist per elemen, dan Break (Unbal). Angka langsung dari tabel game.", "Anomaly and monster stats at every level: HP, ATK, DEF, per-element Resist and Break (Unbal). Numbers straight from the game tables."), list.length) + `
      <div class="toolbar">${filterBox(S("Cari anomali atau monster…", "Search anomalies or monsters…"))}${chips(Object.entries(TYPES).map(([v, label]) => ({ v, label })), "type", undefined, S("Semua jenis", "All types"))}${chips([{ v: "abyss", label: "Beyond the Rails" }], "mode", undefined, S("Semua mode", "All modes"))}</div>
      <div class="wide-grid" id="grid"></div>`;
    useFilters((st) => {
      const out = list.filter((e) => match(st.q, e.name) && (!st.type || e.type === st.type) && (!st.mode || e.variants.some((v) => v.kind === "abyss")));
      $("#grid").innerHTML = out.map((e) => {
        const lv = e.variants.filter((v) => v.kind !== "abyss").flatMap((v) => Object.keys(v.levels).map(Number));
        const hasAb = e.variants.some((v) => v.kind === "abyss");
        return `<button class="wcard en-card" type="button" data-n="${esc(e.name)}"><div class="wcard-img en-img">${e.image ? `<img src="${img(e.image)}" alt="" loading="lazy">` : `<span class="en-ph">${esc(e.name.charAt(0))}</span>`}</div><div class="wcard-body"><small>${esc(TYPES[e.type] || "")}${hasAb ? " · Beyond the Rails" : ""}</small><b>${esc(e.name)}</b><p>${lv.length ? `Lv ${Math.min(...lv)}–${Math.max(...lv)} · ` : ""}${e.variants.length} ${S("varian", "variants")}</p></div></button>`;
      }).join("") || `<div class="empty">${S("Tidak ada anomali yang cocok.", "No matching entries.")}</div>`;
      setCount(out.length);
    });
    $("#grid").addEventListener("click", (ev) => {
      const b = ev.target.closest(".en-card"); if (!b) return;
      const e = list.find((x) => x.name === b.dataset.n);
      let vi = 0;
      const draw = () => {
        const v = e.variants[vi], lvls = Object.entries(v.levels);
        const hasImm = lvls.some(([, s]) => Object.keys(s.imm || {}).length);
        $("#enBody").innerHTML = `${e.variants.length > 1 ? `<div class="chips en-var">${e.variants.map((x, i) => `<button class="chip" type="button" data-i="${i}" aria-pressed="${i === vi}">${esc(tx(x.label))} · ${Object.keys(x.levels).length} Lv</button>`).join("")}</div>` : ""}
          <p class="mono en-id">${esc(v.ids.join(" · "))}</p>
          <div class="en-wrap"><table class="en-tbl"><thead><tr><th>${v.kind === "abyss" ? S("Musim · Stage", "Season · Stage") : "Lv"}</th><th>HP</th><th>ATK</th><th>DEF</th>${RES.map(([, n]) => `<th>${esc(n)}</th>`).join("")}<th>Break</th></tr></thead><tbody>
          ${lvls.map(([lv, s]) => `<tr><td><b>${lvLabel(v, lv)}</b></td><td>${num(s.hp)}</td><td>${num(s.atk)}</td><td>${num(s.def)}</td>${RES.map(([k]) => `<td>${pct(s.res[k] || 0)}</td>`).join("")}<td>${s.unbal}</td></tr>`).join("")}
          </tbody></table></div>
          ${hasImm ? `<p class="txt en-note">${S("Ada imunitas elemen pada sebagian level (lihat data game).", "Some levels have elemental immunities (see game data).")}</p>` : ""}`;
      };
      sheet({ name: e.name, image: e.image }, `<span class="mono">${esc(TYPES[e.type] || "")}</span>`,
        `<p class="txt en-note">${S("Level mengikuti tabel game (level dunia untuk musuh dunia, level boss untuk boss mingguan). Resist 20% berarti DMG elemen itu dikurangi 20%. Break = batas bar Unbal sebelum musuh jatuh.", "Levels follow the game table (world level for open-world enemies, boss level for weekly bosses). 20% Resist means that element's DMG is reduced by 20%. Break = Unbal bar size before the enemy topples.")}</p><div id="enBody"></div>`);
      draw();
      $("#enBody").addEventListener("click", (ev2) => { const c = ev2.target.closest(".en-var .chip"); if (c) { vi = +c.dataset.i; draw(); } });
    });
  }

  // ---------------- KALKULATOR DAMAGE ----------------
  // Rumus sama dengan tools/nte/dmgformula.py (mengacu pada pembahasan komunitas NGA).
  const BREAK_BASE = [91, 93, 96, 98, 101, 104, 106, 109, 111, 114, 117, 119, 122, 124, 127, 130, 132, 135, 137, 140,
    148, 159, 170, 182, 193, 204, 214, 226, 241, 257, 273, 289, 306, 325, 345, 367, 390, 413, 438, 462,
    488, 517, 548, 581, 621, 663, 707, 752, 800, 854, 897, 942, 990, 1041, 1106, 1168, 1233, 1300, 1370, 1440,
    1515, 1604, 1693, 1788, 1896, 1990, 2083, 2184, 2285, 2384, 2486, 2602, 2707, 2821, 2984, 3135, 3250, 3367, 3484, 3603];
  const defZone = (lc, def, red, ign) => { const k = 600 + 6 * lc, eff = def * (1 - red) * (1 - ign); return k / (eff + k); };
  const resZone = (res, red) => { const e = res - red; return e > 0.6 ? 1 / (6.25 * e - 1.25) : e >= 0 ? 1 - e : 1 - e / (1 - e); };
  const RESKEY = { Cosmos: "cosmos", Chaos: "chaos", Lakshana: "lakshana", Incantation: "incantation", Psyche: "psyche", Anima: "nature", Nature: "nature" };
  // "{0}% + {1}% *4 + {2}%" + nilai per level -> total rasio (%) ; null bila format tidak dikenali
  function ratioOf(f, vals) {
    const e = String(f).split(",")[0].replace(/\{(\d+)\}/g, (_, i) => (vals[+i] ?? "x")).replace(/%/g, "");
    let sum = 0;
    for (const t of e.split("+")) { const m = t.match(/^\s*([\d.]+)\s*(?:\*\s*(\d+))?\s*$/); if (!m) return null; sum += parseFloat(m[1]) * (m[2] ? +m[2] : 1); }
    return sum;
  }

  async function viewCalc() {
    setTitle(S("Kalkulator Damage", "Damage Calculator"));
    const [espers, SD, arcs, enemies, BUILDS] = await Promise.all([load("espers"), load("stats"), load("arcs"), load("enemies"), load("builds_draft").catch(() => ({}))]);
    const list = espers.filter((e) => SD.espers[e.id]);
    const arcList = arcs.filter((a) => SD.arcs[a.slug]);
    const num = (n) => Number(Math.floor(n)).toLocaleString(LANG === "en" ? "en-US" : "id-ID");
    const GROUPS = { basic: S("Serangan Dasar", "Basic Attack"), redirect: "Skill", ultimate: "Ultimate", support: "QTE" };
    const opt = (val, t, sel) => `<option value="${esc(val)}"${sel ? " selected" : ""}>${esc(t)}</option>`;
    const HELP = {
      cL: S("Level karakter kamu. Isi 1 sampai 80.", "Your character's level. Enter 1 to 80."),
      cAL: S("Level Arc yang dipakai. Isi 1 sampai 80.", "Level of the Arc you use. Enter 1 to 80."),
      cSL: S("Level skill yang dipilih. Isi 1 sampai 10.", "Level of the chosen skill. Enter 1 to 10."),
      cB: S("Biarkan ATK. Ganti hanya kalau skill itu menghitung damage dari HP atau DEF.", "Leave it on ATK. Change only if that skill scales with HP or DEF."),
      cEl: S("Elemen serangannya. Sudah otomatis sesuai karakter, tidak perlu diubah.", "The attack's element. Already set from the character, no need to change it."),
      cR: S("Pilih serangan yang mau dihitung, misalnya satu kali pakai skill.", "Pick the attack to calculate, for example one use of the skill."),
      cAP: S("Tambahan ATK dalam persen. Jumlahkan semua yang tertulis \"ATK +…%\" dari modul dan buff. Contoh: +10% dan +20% → isi 30. Tidak ada? Isi 0.", "Extra ATK in percent. Add up every \"ATK +…%\" from modules and buffs. Example: +10% and +20% → enter 30. None? Enter 0."),
      cAF: S("Tambahan ATK berupa angka biasa, tanpa tanda %, misalnya \"ATK +50\". Base ATK karakter dan Arc tidak perlu diisi di sini, sudah otomatis. Tidak ada? Isi 0.", "Extra ATK as a plain number, no % sign, such as \"ATK +50\". Do not enter base ATK here, it is automatic. None? Enter 0."),
      cCR: S("Tulis CRIT Rate persis seperti di status karakter. Contoh: tertulis 45% → isi 45.", "Enter CRIT Rate exactly as shown in the character stats. Example: it shows 45% → enter 45."),
      cCD: S("Tulis CRIT DMG persis seperti di status karakter. Contoh: tertulis 150% → isi 150.", "Enter CRIT DMG exactly as shown in the character stats. Example: it shows 150% → enter 150."),
      cDB: S("Jumlahkan semua bonus damage, misalnya \"Cosmos DMG +20%\" dan \"Ultimate DMG +10%\". Contoh: 20 + 10 → isi 30. Tidak ada? Isi 0.", "Add up all damage bonuses, such as \"Cosmos DMG +20%\" and \"Ultimate DMG +10%\". Example: 20 + 10 → enter 30. None? Enter 0."),
      cFB: S("Hanya untuk efek yang tertulis \"Final DMG\". Kebanyakan build tidak punya, isi 0.", "Only for effects that say \"Final DMG\". Most builds have none, enter 0."),
      cDI: S("Untuk efek \"abaikan X% DEF musuh\". Contoh: Lost Radiance 4 keping → isi 25. Tidak ada? Isi 0.", "For effects like \"ignore X% enemy DEF\". Example: Lost Radiance 4-piece → enter 25. None? Enter 0."),
      cDR: S("Untuk efek yang menurunkan DEF musuh. Kebanyakan build tidak punya, isi 0.", "For effects that lower enemy DEF. Most builds have none, enter 0."),
      cAT: S("Cara paling akurat: buka layar status karakter di game, lalu isi angka ATK yang tertulis (HP atau DEF kalau serangannya berbasis itu). Kalau diisi, kolom ATK % dan ATK flat diabaikan. Kosongkan untuk hitung otomatis.", "The most accurate way: open the character status screen in game and enter the ATK shown (HP or DEF if the attack scales with that). If filled, the ATK % and flat ATK fields are ignored. Leave empty to calculate automatically."),
      cRP: S("Untuk efek \"penetrasi RES\", misalnya buff stage Beyond the Rails \"All Resistance Penetration 25%\" (buff stage bisa beda tiap musim, baca di game). Isi 25. Tidak ada? Isi 0.", "For \"RES penetration\" effects, such as the Beyond the Rails stage buff \"All Resistance Penetration 25%\" (stage buffs differ each season, read it in game). Enter 25. None? Enter 0."),
      cRR: S("Untuk efek yang menurunkan RES musuh. Kebanyakan build tidak punya, isi 0.", "For effects that lower enemy RES. Most builds have none, enter 0."),
      cShare: S("Link ini menyimpan semua isianmu (karakter, Arc, stat, dan musuh). Kirim ke teman atau Discord, dan mereka langsung melihat hasil yang sama. Simpan juga untuk dibuka lagi nanti.", "This link stores everything you entered (character, Arc, stats, and enemy). Send it to a friend or Discord and they see the same result right away. Keep it to reopen later."),
      cBI: S("Angka Break Intensity karakter itu. Tidak tahu? Isi 0.", "That character's Break Intensity number. Not sure? Enter 0."),
      cBB: S("Bonus damage Break dalam persen. Biasanya 0.", "Break damage bonus in percent. Usually 0."),
    };
    const ARCRANK = { 5: "S", 4: "A", 3: "B" };
    const sw = (id, inner) => `<span class="csel"><img class="cth" id="t_${id}" alt="" hidden><select id="${id}">${inner}</select></span>`;
    const hb = (id) => `<button type="button" class="chi" aria-label="${S("Penjelasan", "Help")}" aria-expanded="false">!</button>`;
    const hd = (id) => `<div class="chelp" hidden>${esc(HELP[id] || "")}</div>`;
    const field = (id, label, val, hint) => `<label class="cf"><span>${label}${hint ? ` <em>(${hint})</em>` : ""}${HELP[id] ? hb(id) : ""}</span><input id="${id}" type="number" step="any" value="${val}" inputmode="decimal">${HELP[id] ? hd(id) : ""}</label>`;
    const eso = (sel) => list.map((e) => opt(e.slug, e.name.split(" (")[0], e.slug === sel)).join("");
    const defE = list.find((e) => e.slug === "elyms") || list[0];
    const brk = [0, 1, 2, 3].map((i) => `<div class="cbrk">
        <b>${S("Karakter", "Character")} ${i + 1}</b>
        <label class="cf"><span>Esper</span>${sw("bE" + i, `<option value="">—</option>${eso("")}`)}</label>
        ${field("bL" + i, "Level", 80)}${field("bI" + i, "Break Intensity", 0).replace("</span>", hb() + "</span>").replace("</label>", hd("cBI") + "</label>")}${field("bB" + i, S("Bonus Break (%)", "Break bonus (%)"), 0).replace("</span>", hb() + "</span>").replace("</label>", hd("cBB") + "</label>")}
      </div>`).join("");
    main.innerHTML = head(S("KALKULATOR", "CALCULATOR"), S("Kalkulator Damage", "Damage Calculator"), S("Hitung damage satu serangan karakter ke musuh, dari data base game. Tanpa rotasi: satu karakter, satu skill.", "Calculate one character's damage per hit against an enemy from base game data. No rotation: one character, one skill."), null) + `
      <p class="calc-beta"><b>${S("Masih tahap uji coba.", "Still in testing.")}</b> ${S("Rumusnya sudah dicocokkan dengan pertarungan nyata, tapi belum semua efek dihitung (Awakening, efek Arc dan modul, Stain, damage Mental/True). Anggap hasilnya perkiraan.", "The formula has been checked against a real fight, but not every effect is counted yet (Awakening, Arc and module effects, Stain, Mental/True damage). Treat results as estimates.")}</p>
      <div class="calc">
        <section class="calc-card"><h3>${S("1 · Karakter dan skill", "1 · Character and skill")}</h3>
          <div class="calc-grid">
            <label class="cf"><span>Esper</span>${sw("cE", eso(defE.slug))}</label>
            ${field("cL", S("Level karakter", "Character level"), 80, "1–80")}
            <label class="cf"><span>Arc <em>(${S("sesuai tipe karakter", "matches character type")})</em></span>${sw("cA", "")}</label>
            ${field("cAL", S("Level Arc", "Arc level"), 80, "1–80")}
            <label class="cf"><span>${S("Jenis skill", "Skill type")}</span><select id="cG"></select></label>
            ${field("cSL", S("Level skill", "Skill level"), 10, "1–10")}
            <label class="cf wide"><span>${S("Serangan", "Attack")}${hb()}</span><select id="cR"></select>${hd("cR")}</label>
            <label class="cf"><span>${S("Basis rasio", "Ratio base")}${hb()}</span><select id="cB"><option value="atk">ATK</option><option value="hp">HP</option><option value="def">DEF</option></select>${hd("cB")}</label>
            <label class="cf"><span>${S("Elemen serangan", "Attack element")}${hb()}</span><select id="cEl"></select>${hd("cEl")}</label>
          </div></section>
        <section class="calc-card"><h3>${S("2 · Stat dari modul dan buff", "2 · Stats from modules and buffs")}</h3>
          <p class="txt calc-note">${S("Isi total dari layar karakter di game (persen, tanpa tanda %). Stat dasar karakter dan Arc diambil otomatis.", "Enter totals from the in-game character screen (percent, no % sign). Base character and Arc stats are filled in automatically.")}</p>
          <div class="calc-grid">
            ${field("cAP", S("ATK % dari modul dan buff", "ATK % from modules and buffs"), 0)}${field("cAF", S("ATK flat dari modul/buff", "Flat ATK from modules/buffs"), 0, S("bukan Base ATK", "not Base ATK"))}
            ${field("cAT", S("ATK total dari game", "Total ATK from game"), "", S("opsional", "optional"))}
            ${field("cCR", S("CRIT Rate (%)", "CRIT Rate (%)"), 5, S("angka di status", "as shown in stats"))}${field("cCD", S("CRIT DMG (%)", "CRIT DMG (%)"), 50, S("angka di status", "as shown in stats"))}
            ${field("cDB", S("Bonus DMG total (%)", "Total DMG bonus (%)"), 0, S("elemen + umum + skill", "element + general + skill"))}${field("cFB", S("Bonus Final DMG (%)", "Final DMG bonus (%)"), 0)}
            ${field("cDI", S("Abaikan DEF (%)", "DEF ignore (%)"), 0)}${field("cDR", S("Kurangi DEF musuh (%)", "DEF reduction (%)"), 0)}
            ${field("cRR", S("Kurangi RES musuh (%)", "RES reduction (%)"), 0)}${field("cRP", S("Penetrasi RES (%)", "RES penetration (%)"), 0)}
          </div></section>
        <section class="calc-card"><h3>${S("3 · Musuh", "3 · Enemy")}</h3>
          <div class="calc-grid">
            <label class="cf"><span>${S("Musuh", "Enemy")}</span>${sw("cM", enemies.map((x, i) => opt(i, x.name, x.name === "Morphix")).join(""))}</label>
            <label class="cf"><span>${S("Varian", "Variant")}</span><select id="cV"></select></label>
            <label class="cf"><span>${S("Level musuh / stage", "Enemy level / stage")}</span><select id="cEL"></select></label>
          </div>
          <div class="calc-enemy" id="cEn"></div></section>
        <section class="calc-card calc-out"><div class="calc-outhead"><h3>${S("Hasil damage", "Damage result")}</h3><span class="calc-btns"><button type="button" class="chip" id="cShare">${S("Salin link hasil", "Copy result link")}</button>${hb()}</span>${hd("cShare")}</div><div id="cOut"></div></section>
        <section class="calc-card"><h3>${S("4 · Break tim (4 karakter)", "4 · Team Break (4 characters)")}</h3>
          <p class="txt calc-note">${S("Damage Break dijumlahkan dari semua karakter di tim, jadi pilih 4 karakter. Break Intensity diisi dari layar karakter.", "Break damage is summed over every character on the team, so pick 4 characters. Enter Break Intensity from the character screen.")}</p>
          <div class="cbrk-grid">${brk}</div><div id="bOut"></div></section>
      </div>`;
    const $c = (id) => $("#" + id), val = (id) => parseFloat($c(id).value) || 0;
    const clamp = (x, a, b) => Math.min(b, Math.max(a, Math.round(x) || a));
    const esper = (slug) => list.find((e) => e.slug === slug);
    function fillArc() {
      const e = esper($c("cE").value), want = ((BUILDS[e.slug] || {}).arcs || [])[0];
      $c("cA").innerHTML = opt("", S("Tanpa Arc", "No Arc"), false) + arcList.filter((x) => x.type === e.arcType).sort((x, y) => y.rarity - x.rarity || x.name.localeCompare(y.name)).map((a) => opt(a.slug, `[${ARCRANK[a.rarity] || "?"}] ${a.name}`, a.slug === want)).join("");
      const el = e.element === "Anima" ? "Nature" : e.element;
      $c("cEl").innerHTML = ["Cosmos", "Nature", "Incantation", "Chaos", "Psyche", "Lakshana", "Normal"].map((k) => opt(k, k === "Nature" ? "Anima" : k, k === el)).join("");
      const sk = SD.espers[e.id].skills;
      $c("cG").innerHTML = Object.keys(GROUPS).filter((g) => sk[g] && (sk[g].rows || []).length).map((g) => opt(g, GROUPS[g], g === "redirect")).join("");
      fillRows();
    }
    function fillRows() {
      const e = esper($c("cE").value), g = $c("cG").value, rows = ((SD.espers[e.id].skills[g] || {}).rows || []);
      const ok = rows.map((r, i) => [r, i]).filter(([r]) => /DMG|Rasio/i.test(r.l) && ratioOf(r.f, r.v[0]) != null);
      $c("cR").innerHTML = ok.map(([r, i]) => opt(i, r.l)).join("") || opt("", S("(tidak ada rasio yang bisa dihitung)", "(no calculable ratios)"));
    }
    function fillEnemy() {
      const m = enemies[+$c("cM").value];
      $c("cV").innerHTML = m.variants.map((x, i) => opt(i, `${tx(x.label)} · ${Object.keys(x.levels).length} Lv`)).join("");
      fillLv();
    }
    function fillLv() {
      const m = enemies[+$c("cM").value], x = m.variants[+$c("cV").value || 0], ks = Object.keys(x.levels);
      $c("cEL").innerHTML = ks.map((k, i) => opt(k, x.kind === "abyss" ? lvLabel(x, k) : "Lv " + k, i === ks.length - 1)).join("");
    }
    function enemyStat() { const m = enemies[+$c("cM").value], x = m.variants[+$c("cV").value || 0]; return x.levels[$c("cEL").value] || x.levels[Object.keys(x.levels).pop()]; }
    function thumb(id, src) { const t = $c("t_" + id); if (!t) return; if (src) { t.src = img(src); t.hidden = false; } else t.hidden = true; }
    function thumbs() {
      thumb("cE", (esper($c("cE").value) || {}).icon);
      const a = arcList.find((x) => x.slug === $c("cA").value); thumb("cA", a && a.icon);
      thumb("cM", (enemies[+$c("cM").value] || {}).image);
      [0, 1, 2, 3].forEach((i) => thumb("bE" + i, ($c("bE" + i).value && (esper($c("bE" + i).value) || {}).icon) || ""));
    }
    function calc() {
      thumbs();
      const e = esper($c("cE").value), st = SD.espers[e.id], lc = clamp(val("cL"), 1, 80), s = enemyStat();
      const arc = $c("cA").value ? SD.arcs[$c("cA").value] : null, la = clamp(val("cAL"), 1, 80);
      const base = $c("cB").value, bs = st[base][lc - 1], arcAtk = base === "atk" && arc ? arc.atk[la - 1] : 0;
      const statAuto = (bs + arcAtk) * (1 + val("cAP") / 100) + val("cAF"), useTotal = val("cAT") > 0, stat = useTotal ? val("cAT") : statAuto;
      const resCut = (val("cRR") + val("cRP")) / 100;
      const sk = (st.skills[$c("cG").value] || {}).rows || [], row = sk[+$c("cR").value];
      const lvS = clamp(val("cSL"), 1, 10), ratio = row ? ratioOf(row.f, row.v[Math.min(lvS, row.v.length) - 1]) : null;
      const rk = RESKEY[$c("cEl").value] || "normal";
      const bonus = 1 + val("cDB") / 100, cr = Math.min(1, Math.max(0, val("cCR") / 100)), cd = Math.max(0, val("cCD") / 100);
      const dz = defZone(lc, s.def, val("cDR") / 100, val("cDI") / 100), rz = resZone(s.res[rk] ?? 0.2, resCut), fin = 1 + val("cFB") / 100;
      $c("cEn").innerHTML = `<div class="cen"><span>HP</span><b>${num(s.hp)}</b></div><div class="cen"><span>DEF</span><b>${num(s.def)}</b></div><div class="cen"><span>ATK</span><b>${num(s.atk)}</b></div><div class="cen"><span>Break</span><b>${s.unbal}</b></div>${Object.entries(s.res).map(([k, r]) => `<div class="cen${k === rk ? " on" : ""}"><span>RES ${k === "nature" ? "Anima" : k}</span><b>${Math.round(r * 1000) / 10}%</b></div>`).join("")}`;
      if (ratio == null) { $c("cOut").innerHTML = `<p class="txt">${S("Pilih serangan yang rasionya bisa dihitung.", "Pick an attack with a calculable ratio.")}</p>`; }
      else {
        const noCrit = stat * (ratio / 100) * bonus * dz * rz * fin, crit = noCrit * (1 + cd), avg = noCrit * (1 + cr * cd);
        const hits = Math.ceil(s.hp / Math.max(1, avg)).toLocaleString(LANG === "en" ? "en-US" : "id-ID");
        $c("cOut").innerHTML = `<div class="cres"><div><span>${S("Tanpa CRIT", "Non-crit")}</span><b>${num(noCrit)}</b></div><div><span>CRIT</span><b>${num(crit)}</b></div><div class="avg"><span>${S("Rata-rata", "Average")}</span><b>${num(avg)}</b></div></div>
          <p class="mono calc-eq">${useTotal ? `${base.toUpperCase()} ${S("total dari game", "total from game")} = <b>${num(stat)}</b>` : `Base ${base.toUpperCase()}: ${num(bs)} (${S("karakter", "character")} Lv${lc})${arcAtk ? ` + ${num(arcAtk)} (Arc Lv${la})` : ""} → × (1 + ${val("cAP")}%) + ${num(val("cAF"))} (flat) = <b>${num(stat)}</b>`}</p>
          <p class="mono calc-eq">${num(stat)} ${base.toUpperCase()} × ${ratio}% × ${bonus.toFixed(2)} (DMG) × ${dz.toFixed(3)} (DEF) × ${rz.toFixed(3)} (RES ${esc($c("cEl").value)}) × ${fin.toFixed(2)} (Final) · CR ${Math.round(cr * 100)}% / CD ${Math.round(cd * 100)}%</p>
          <p class="txt calc-note">${S(`Butuh sekitar ${hits} serangan seperti ini untuk menghabiskan HP musuh.`, `About ${hits} hits like this to deplete the enemy's HP.`)}</p>`;
      }
      // Break: jumlah semua karakter (harus 4)
      let tot = 0, rows = "", n = 0, eq = "";
      [0, 1, 2, 3].forEach((i) => {
        const slug = $c("bE" + i).value;
        if (!slug) return; n++;
        const b = esper(slug), L = clamp(val("bL" + i), 1, 80);
        const d = BREAK_BASE[L - 1] * (1 + val("bI" + i) / 300 + val("bB" + i) / 100) * (s.unbal / 3) * defZone(L, s.def, val("cDR") / 100, val("cDI") / 100) * resZone(s.res[RESKEY[b.element] || "normal"] ?? 0.2, resCut);
        tot += d; rows += `<div class="cbr"><span>${esc(b.name.split(" (")[0])} Lv${L}</span><b>${num(d)}</b></div>`; eq = `${BREAK_BASE[L - 1]} × (1 + Intensity/300 + bonus) × (Break musuh ${s.unbal} / 3) × DEF × RES`;
      });
      $c("bOut").innerHTML = n === 4 ? `${rows}<div class="cres"><div class="avg"><span>${S("Total Break tim", "Team Break total")}</span><b>${num(tot)}</b></div></div><p class="mono calc-eq">${eq}</p><p class="txt calc-note">${S("Break musuh, DEF, dan RES diambil dari musuh yang kamu pilih di bagian 3. Pengurangan Break oleh Discord belum dihitung.", "Enemy Break, DEF and RES come from the enemy chosen in section 3. Discord's Break reduction is not included yet.")}</p>` : `<p class="txt calc-note">${S(`Pilih 4 karakter dulu (sekarang ${n}/4).`, `Pick 4 characters first (${n}/4 now).`)}</p>${rows}`;
    }
    $c("cE").addEventListener("change", () => { fillArc(); calc(); });
    $c("cG").addEventListener("change", () => { fillRows(); calc(); });
    $c("cM").addEventListener("change", () => { fillEnemy(); calc(); });
    $c("cV").addEventListener("change", () => { fillLv(); calc(); });
    main.querySelector(".calc").addEventListener("click", (ev) => {
      const b = ev.target.closest(".chi"); if (!b) return;
      ev.preventDefault();
      const box = (b.closest(".cf") || b.closest(".calc-outhead")).querySelector(".chelp"); if (!box) return;
      box.hidden = !box.hidden; b.setAttribute("aria-expanded", String(!box.hidden));
    });
    main.querySelector(".calc").addEventListener("input", calc);
    main.querySelector(".calc").addEventListener("change", calc);
    // ---- link bisa dibagikan: seluruh isian disimpan di alamat halaman (?c=...) ----
    const IDS = ["cE", "cL", "cA", "cAL", "cG", "cSL", "cR", "cB", "cEl", "cAP", "cAF", "cCR", "cCD", "cDB", "cFB", "cDI", "cDR", "cRR", "cRP", "cAT", "cM", "cV", "cEL"]
      .concat([0, 1, 2, 3].flatMap((i) => ["bE" + i, "bL" + i, "bI" + i, "bB" + i]));
    const setVal = (id, value) => {
      const el = $c(id); if (!el || value == null) return;
      if (el.tagName === "SELECT" && ![...el.options].some((o) => o.value === value)) return;   // nilai tidak ada lagi: pakai bawaan
      el.value = value;
    };
    function saveUrl() {
      const q = new URLSearchParams();
      IDS.forEach((id) => { const el = $c(id); if (el && el.value !== "") q.set(id, el.value); });
      try { history.replaceState(history.state, "", location.pathname + "?" + q.toString()); } catch (e) {}
    }
    async function copyText(text) {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {
        const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
        let ok = false; try { ok = document.execCommand("copy"); } catch (e2) {} ta.remove(); return ok;
      }
    }
    $c("cShare").addEventListener("click", async () => { saveUrl(); toast((await copyText(location.href)) ? S("Link hasil disalin.", "Result link copied.") : S("Gagal menyalin, salin dari kolom alamat.", "Could not copy, copy it from the address bar.")); });
    main.querySelector(".calc").addEventListener("input", () => setTimeout(saveUrl, 0));
    main.querySelector(".calc").addEventListener("change", () => setTimeout(saveUrl, 0));
    fillArc(); fillEnemy();
    const qs = new URLSearchParams(location.search);
    if (qs.has("cE")) {
      const g = (id) => qs.get(id);
      setVal("cE", g("cE")); fillArc(); setVal("cA", g("cA")); setVal("cG", g("cG")); fillRows(); setVal("cR", g("cR"));
      setVal("cM", g("cM")); fillEnemy(); setVal("cV", g("cV")); fillLv(); setVal("cEL", g("cEL"));
      IDS.filter((id) => !["cE", "cA", "cG", "cR", "cM", "cV", "cEL"].includes(id)).forEach((id) => setVal(id, g(id)));
    }
    calc();
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
    "Katalog": "Catalog", "Informasi": "Information", "Cerita": "Story", "Anomali": "Anomalies", "Status Anomali": "Anomaly Stats", "Buat Tier List": "Make a Tier List", "Tentang": "About", "Tentang situs ini": "About this site", "Kalkulator": "Calculator", "Istilah": "Glossary", "Pencapaian": "Achievements", "Makanan": "Food", "Versi": "Versions", "Versi & Patch": "Versions & Patches",
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
    setTitle(S("Buat Tier List", "Make a Tier List"));
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

    main.innerHTML = head(S("TIER LIST", "TIER LIST"), S("Buat Tier List", "Make a Tier List"), S("Susun karakter atau Arc favoritmu ke dalam tier. Seret ke tier (di HP: ketuk karakter, lalu ketuk tier). Tersimpan otomatis di browser ini dan bisa diunduh sebagai gambar.", "Rank your favourite characters or Arcs into tiers. Drag them in (on phones: tap a character, then tap a tier). It saves automatically in this browser and can be downloaded as an image."), null) + `
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
