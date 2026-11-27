/* Halaman "Tycoon's Deck" (铺满全城): papan tata letak, skor, solver, dan katalog. Logika ada di city-engine.js dan city-solver.js. */
(function () {
  const KEY = "nte-city-v1";
  const PLOT_INFO = {
    high: ["Prime Lot", "Prime Lot", "Bangunan penghasil poin: +15 Pengunjung dan konversi +15% per petak yang ditutupi.", "Scoring buildings: +15 Foot Traffic and +15% conversion per covered cell."],
    river: ["Riverfront", "Riverfront", "Tidak bisa dibangun. Menampung sampai 80 Pengunjung berlebih dari tetangga lalu menyalurkannya.", "No building. Stores up to 80 excess Foot Traffic from neighbours and passes it on."],
    monument: ["City Monument", "City Monument", "Tidak bisa dibangun. Menambah 25% dari skor bangunan di sebelahnya.", "No building. Adds 25% of adjacent building scores."],
  };
  const LIMIT_INFO = {
    outerDecay: ["Outer Ring Slump", "Outer Ring Slump", "Bangunan di lingkar terluar papan: skor −50%.", "Buildings on the outermost ring: −50% score."],
    innerRoll: ["Cutthroat Competition", "Cutthroat Competition", "Tiap bangunan lain bertema sama: skor −8%.", "−8% score per other building of the same theme."],
    heightCap: ["Height Restriction", "Height Restriction", "Bangunan 2 petak ke atas: konversi dasar dan bonusnya dibagi dua (aura tetap).", "2+ cell buildings: base and bonus conversion halved (auras unaffected)."],
    tax: ["Business Tax", "Business Tax", "Semua skor −25%.", "All score −25%."],
    jamZero: ["Gridlock Penalty", "Gridlock Penalty", "Bila ada bangunan melebihi kapasitas, skor menjadi 0.", "If any building exceeds capacity, the score is 0."],
    pollution: ["Pollution Alert", "Pollution Alert", "Kapasitas semua bangunan −10.", "All capacities −10."],
    funControl: ["Entertainment Restrictions", "Entertainment Restrictions", "Konversi bangunan Hiburan menjadi 75%.", "Entertainment conversion reduced to 75%."],
    foodControl: ["Dining Restrictions", "Dining Restrictions", "Konversi bangunan Kuliner menjadi 75%.", "Dining conversion reduced to 75%."],
  };
  const NOTE = {
    adjTheme: ["Tetangga kuliner", "Dining neighbour"], adjNames: ["Tetangga beragam", "Varied neighbours"], adjThemeNames: ["Aneka kuliner", "Dining variety"],
    metro: ["Metro", "Metro"], bike: ["Pos sepeda", "Bike station"], dispatch: ["Dispatch", "Dispatch"], pool: ["Halte", "Shuttle"], share: ["Limpahan tetangga", "Shared overflow"],
    river: ["Limpahan sungai", "River overflow"], high: ["Petak nilai tinggi", "High-value plot"], auraCap: ["Aura kapasitas", "Capacity aura"], auraConv: ["Aura konversi", "Conversion aura"],
  };

  window.NteCityView = function (ctx) {
    const { main, data, E, S, esc, img, head, toast, ver } = ctx;
    const BY = E.BY;
    const L = (o) => S(o.id, o.en);
    const nm = (b) => esc(b.name);
    const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString(S("id-ID", "en-US"));
    let state = E.sanitize(null);
    try { state = E.sanitize(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
    let armed = null, mode = "build", paint = "high", theme = "", cardQ = "", cardR = "", worker = null, solving = false, history = [];
    const remember = () => { history.push(JSON.stringify(state.layout)); if (history.length > 40) history.shift(); };

    main.innerHTML = head("TYCOON'S DECK", "Tycoon's Deck",
      S("Alat bantu event Tycoon's Deck (versi 1.5): susun bangunan di papan, lihat skor satu hitungan, atau biarkan solver mencari susunan yang bagus.", "A helper for the 1.5 Tycoon's Deck event: lay out buildings, see the score of one scoring, or let the solver find a good layout.")) + `
      <section class="calc-card ct-guide"><h3>${S("Panduan Tycoon's Deck", "Tycoon's Deck guide")}</h3>
        <p class="txt">${S("Permainan papan roguelike berbasis <b>penyusunan dek</b>. Pakai <b>Building Card</b>, <b>Strategy Card</b>, dan <b>Power Card</b> untuk menata papan, lalu kumpulkan skor lewat beberapa kesempatan hitung. Bangun dekmu, raih skor besar, dan lewati <b>Blind</b> sebanyak mungkin. Datangi lokasi Flash Challenge di kota untuk bermain bersama karakter yang berbeda, atau mainkan Endless Mode sendiri.", "A roguelike board game built around <b>deck-building</b>. Use <b>Building Cards</b>, <b>Strategy Cards</b> and <b>Power Cards</b> to plan your layout and build up your score over several scoring attempts. Build your deck, score big and clear as many <b>Blinds</b> as you can. Visit Flash Challenge locations around the city to play alongside different characters, or take on Endless Mode solo.")}</p>
        <div class="ct-modes">
          <div><b>Flash Mode</b><p class="txt">${S("Mode cepat: bermain dengan karakter berbeda memakai dek yang sudah disiapkan. Blind-nya lebih sedikit, cocok untuk belajar dasar dan mencoba berbagai susunan.", "A faster mode played with different characters and preset decks. With fewer Blinds, it is a good way to learn the basics and try builds.")}</p></div>
          <div><b>Endless Mode</b><p class="txt">${S("Ada <b>11</b> tingkat kesulitan. Tiap tingkat memuat semua syarat tambahan dari tingkat sebelumnya, dan tingkat sebelumnya harus diselesaikan untuk membuka yang berikutnya. Menyelesaikan <b>24</b> Blind sampai Bab <b>8</b> di tingkat mana pun berarti tantangan selesai.", "<b>11</b> difficulty levels. Each includes all extra conditions of the earlier ones, and you must clear a difficulty to unlock the next. Clearing all <b>24</b> Blinds through Chapter <b>8</b> on any difficulty completes the challenge.")}</p></div>
        </div></section>
      <div class="ct">
        <section class="calc-card ct-pal"><h3>${S("Bangunan", "Buildings")}</h3>
          <p class="txt calc-note">${S("Ketuk <b>Taruh</b> lalu ketuk petak. Angka +/− = jumlah yang kamu punya untuk solver.", "Tap <b>Place</b>, then a cell. +/− sets how many you own, for the solver.")}</p>
          <div class="chips" id="ctThemes"></div><div class="ct-list" id="ctList"></div></section>
        <div class="ct-mid">
          <section class="calc-card">
            <div class="ct-bar">
              <label class="cf"><span>${S("Papan inti", "Core board")}</span><select id="ctCore">${[3, 4, 5, 6, 7].map((n) => `<option value="${n}">${n}×${n}</option>`).join("")}</select></label>
              <div class="gc-tabs" role="group" aria-label="${S("Mode papan", "Board mode")}">${[["build", S("Bangun", "Build")], ["extend", S("Perluas", "Extend")], ["plot", S("Petak khusus", "Special plots")]].map(([k, t]) => `<button type="button" class="chip" data-mode="${k}">${t}</button>`).join("")}</div>
              <div class="gc-btns"><button type="button" class="chip" id="ctDrop" hidden></button><button type="button" class="chip" id="ctRot">${S("Putar (R)", "Rotate (R)")}</button><button type="button" class="chip" id="ctUndo">${S("Urungkan", "Undo")}</button><button type="button" class="chip" id="ctClear">${S("Kosongkan", "Clear")}</button></div>
            </div>
            <div class="chips" id="ctPaint" hidden></div>
            <p class="mono ct-hint" id="ctHint" role="status" aria-live="polite"></p>
            <div class="ct-boardwrap"><div class="ct-board" id="ctBoard"></div></div>
          </section>
          <section class="calc-card"><h3>${S("Pembatasan papan", "Board restrictions")}</h3><div class="chips ct-limits" id="ctLimits"></div><ul class="ct-limtext" id="ctLimText"></ul>
            <details class="ct-boss"><summary>${S("Syarat Boss Blind lain (tidak mengubah hitungan di sini)", "Other Boss Blind conditions (not part of this calculation)")}</summary><ul>${data.bossBlinds.filter((x) => !x.limit).map((x) => `<li><b>${esc(x.name)}</b> ${esc(L(x.desc))}</li>`).join("")}</ul></details></section>
        </div>
        <div class="ct-side">
          <section class="calc-card"><h3>${S("Skor satu hitungan", "Score per scoring")}</h3>
            <div class="ct-score"><b id="ctScore">0</b><span class="mono" id="ctSub"></span></div>
            <label class="cf"><span>${S("Pengali dari kartu strategi (isi manual)", "Multiplier from strategy cards (manual)")}</span><input id="ctMult" type="number" min="0" step="0.1" inputmode="decimal"></label></section>
          <section class="calc-card"><h3>${S("Solver otomatis", "Auto solver")}</h3>
            <p class="txt calc-note" id="ctOwned"></p>
            <label class="ct-check"><input type="checkbox" id="ctKeep"> ${S("Pertahankan bangunan yang sudah di papan", "Keep buildings already on the board")}</label>
            <div class="gc-btns"><button type="button" class="chip" id="ctSolve" aria-pressed="true">${S("Cari susunan", "Find a layout")}</button><button type="button" class="chip" id="ctFromBoard">${S("Pakai jumlah dari papan", "Use board counts")}</button><button type="button" class="chip" id="ctInvClear">${S("Nolkan jumlah", "Reset counts")}</button></div>
            <p class="mono ct-hint" id="ctSolveMsg" role="status" aria-live="polite"></p></section>
          <section class="calc-card"><h3>${S("Rincian skor", "Score breakdown")}</h3><div id="ctDetail" class="ct-detail"></div></section>
          <section class="calc-card"><h3>${S("Simpan", "Save")}</h3><div class="gc-btns"><button type="button" class="chip" id="ctExport">${S("Ekspor (.json)", "Export (.json)")}</button><button type="button" class="chip" id="ctImport">${S("Impor (.json)", "Import (.json)")}</button></div><input type="file" id="ctFile" accept="application/json,.json" hidden>
            <p class="txt calc-note">${S("Susunan tersimpan otomatis di browser ini.", "Your layout is saved in this browser.")}</p></section>
        </div>
      </div>
      <section class="calc-card ct-cards"><h3>${S("Katalog kartu strategi", "Strategy card catalogue")} (${data.cards.length})</h3>
        <div class="toolbar"><input class="filter-input" type="search" id="ctCardQ" placeholder="${S("Cari kartu atau efek…", "Search cards or effects…")}" aria-label="${S("Cari kartu", "Search cards")}"><div class="chips" id="ctCardR"></div></div>
        <div class="ct-cardgrid" id="ctCardGrid"></div></section>`;

    const $ = (s) => main.querySelector(s);
    const chip = (v, label, on, attr) => `<button type="button" class="chip" ${attr}="${esc(v)}" aria-pressed="${on}">${label}</button>`;
    const sizeOf = (b) => `${b.w}×${b.h} · ${b.cap ? S("kap.", "cap.") + " " + b.cap : S("pemberi pengunjung", "transit")}`;

    function drawPalette() {
      $("#ctThemes").innerHTML = chip("", S("Semua", "All"), !theme, "data-th") + Object.entries(data.themes).filter(([k]) => k !== "all").map(([k, v]) => chip(k, esc(L(v)), theme === k, "data-th")).join("");
      $("#ctList").innerHTML = data.buildings.filter((b) => !theme || b.theme === theme).map((b) => `<article class="ct-b${armed && armed.id === b.id ? " on" : ""}" style="--c:${data.themes[b.theme].color}">
        <img src="${img(b.icon)}" alt="" loading="lazy" width="52" height="52">
        <div><b>${nm(b)}</b><small>${esc(b.zh)} · ${sizeOf(b)}</small><p class="txt">${esc(L(b.passive))}</p>
          <div class="ct-bact"><button type="button" class="chip" data-arm="${b.id}" aria-pressed="${!!armed && armed.id === b.id}">${S("Taruh", "Place")}</button>
          <span class="ct-count"><button type="button" data-dec="${b.id}" aria-label="${S("Kurangi", "Decrease")} ${nm(b)}">−</button><b>${state.inventory[b.id] || 0}</b><button type="button" data-inc="${b.id}" aria-label="${S("Tambah", "Increase")} ${nm(b)}">+</button></span></div></div></article>`).join("");
    }

    function drawBoard(res) {
      const core = state.layout.core, s = Math.floor((E.GRID - core) / 2);
      const active = E.activeCells(state.layout);
      const xs = [...active].flatMap((k) => k.split(",").map(Number));
      const pad = mode === "extend" ? 1 : 0;
      const lo = Math.max(0, Math.min(s - pad, ...xs)), hi = Math.min(E.GRID - 1, Math.max(s + core - 1 + pad, ...xs));
      const n = hi - lo + 1, board = $("#ctBoard");
      board.style.setProperty("--n", n);
      let html = "";
      for (let y = lo; y <= hi; y++) for (let x = lo; x <= hi; x++) {
        const k = x + "," + y, on = active.has(k), plot = state.layout.plots[k];
        const inCore = x >= s && x < s + core && y >= s && y < s + core;
        const show = on || mode === "extend";
        const label = `${S("Petak", "Cell")} ${x - lo + 1},${y - lo + 1}${on ? "" : " " + S("(belum ada)", "(not unlocked)")}`;
        html += `<button type="button" class="ct-cell${on ? (inCore ? " core" : " ext") : " off"}${plot && on ? " p-" + plot : ""}" style="grid-column:${x - lo + 1};grid-row:${y - lo + 1}" data-x="${x}" data-y="${y}" aria-label="${label}" ${show ? "" : "tabindex=\"-1\" disabled"}>${plot && on ? `<span>${esc(S(PLOT_INFO[plot][0], PLOT_INFO[plot][1]))}</span>` : ""}</button>`;
      }
      const ok = new Map(res.items.map((i) => [i.index, i]));
      state.layout.items.forEach((p, index) => {
        const b = BY[p.id], cells = E.footprint(p), it = ok.get(index);
        if (cells.some(([x, y]) => x < lo || x > hi || y < lo || y > hi)) return;
        const w = Math.max(...cells.map((c) => c[0])) - p.x + 1, h = Math.max(...cells.map((c) => c[1])) - p.y + 1;
        html += `<button type="button" class="ct-it${it ? "" : " bad"}" style="grid-column:${p.x - lo + 1} / span ${w};grid-row:${p.y - lo + 1} / span ${h};--c:${data.themes[b.theme].color}" data-it="${index}" title="${nm(b)}" aria-label="${nm(b)}${it && it.scoring ? ", " + S("skor", "score") + " " + fmt(it.score) : ""}">
          <img src="${img(b.icon)}" alt="">
          ${it && it.scoring ? `<small class="tl">${fmt(it.traffic)}/${it.cap}</small><small class="tr">+${fmt(it.score)}</small><small class="br">${it.settles !== 1 || b.conv === 0 ? "×" + it.settles : Math.round(it.conv * 100) + "%"}</small>` : ""}
          <span>${nm(b)}</span></button>`;
      });
      board.innerHTML = html;
    }

    function drawDetail(res) {
      const rows = res.items.filter((i) => i.scoring).sort((a, b) => b.score - a.score);
      $("#ctDetail").innerHTML = rows.length ? rows.map((i) => {
        const b = BY[i.id];
        return `<div class="ct-row" style="--c:${data.themes[b.theme].color}"><img src="${img(b.icon)}" alt="" width="34" height="34"><div><b>${nm(b)}</b><small>${S("Pengunjung", "Foot Traffic")} ${fmt(i.traffic)}/${i.cap} · ${i.conv ? S("konversi", "conv.") + " " + Math.round(i.conv * 100) + "%" : S("hitungan", "times") + " " + i.settles}${i.notes.length ? " · " + i.notes.map((n) => `${esc(S(...NOTE[n.k]))} +${n.k === "auraConv" ? Math.round(n.v * 100) + "%" : fmt(n.v)}`).join(", ") : ""}</small></div><em>${fmt(i.score)}</em></div>`;
      }).join("") + (res.monument ? `<div class="ct-row"><span></span><div><b>${S("Bonus monumen", "Monument bonus")}</b></div><em>${fmt(res.monument)}</em></div>` : "") : `<p class="txt">${S("Belum ada bangunan penghasil poin di papan.", "No scoring building on the board yet.")}</p>`;
    }

    function drawCards() {
      const q = cardQ.trim().toLowerCase(), R = { common: S("Biasa", "Common"), rare: S("Langka", "Rare"), epic: S("Epik", "Epic") };
      $("#ctCardR").innerHTML = chip("", S("Semua", "All"), !cardR, "data-cr") + Object.entries(R).map(([k, v]) => chip(k, v, cardR === k, "data-cr")).join("");
      const list = data.cards.filter((c) => (!cardR || c.rarity === cardR) && (!q || (c.name + " " + c.zh + " " + L(c.desc)).toLowerCase().includes(q)));
      $("#ctCardGrid").innerHTML = list.length ? list.map((c) => `<article class="ct-c r-${c.rarity}"><img src="${img(c.icon)}" alt="" loading="lazy" width="48" height="48"><div><b>${esc(c.name)}</b><small>#${esc(c.num)} · ${esc(c.zh)} · ${R[c.rarity]} · ${esc(L(data.themes[c.theme]))} · ${c.price} ${S("Koin", "Coins")}</small><p class="txt">${esc(L(c.desc))}</p></div></article>`).join("") : `<p class="txt">${S("Tidak ada yang cocok.", "No matches.")}</p>`;
    }

    function refresh() {
      const res = E.evaluate(state.layout, { mult: state.mult });
      $("#ctCore").value = state.layout.core;
      if (document.activeElement !== $("#ctMult")) $("#ctMult").value = state.mult;
      main.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      $("#ctPaint").hidden = mode !== "plot";
      $("#ctPaint").innerHTML = Object.entries(PLOT_INFO).map(([k, v]) => chip(k, esc(S(v[0], v[1])), paint === k, "data-paint")).join("");
      $("#ctHint").textContent = mode === "extend" ? S("Ketuk petak di luar inti untuk membuka atau menutupnya.", "Tap a cell outside the core to unlock or lock it.")
        : mode === "plot" ? S(PLOT_INFO[paint][2], PLOT_INFO[paint][3]) + " " + S("Ketuk lagi untuk menghapus.", "Tap again to remove.")
        : armed ? (armed.moving ? S(`Memindahkan ${BY[armed.id].name}. Ketuk petak tujuan, atau tekan Buang.`, `Moving ${BY[armed.id].name}. Tap the target cell, or press Remove.`) : S(`Menaruh ${BY[armed.id].name}. Ketuk petak kiri atasnya.`, `Placing ${BY[armed.id].name}. Tap its top-left cell.`))
        : S("Ketuk bangunan di papan untuk memindahkan atau membuangnya.", "Tap a building to move or remove it.");
      $("#ctDrop").hidden = !armed; $("#ctDrop").textContent = armed && armed.moving ? S("Buang", "Remove") : S("Batal", "Cancel");
      drawBoard(res);
      $("#ctScore").textContent = fmt(res.total);
      $("#ctSub").textContent = `${res.items.length} ${S("bangunan", "buildings")} · ${res.used}/${res.cells} ${S("petak", "cells")}${res.jammed ? " · " + S("ada yang melebihi kapasitas", "over capacity") : ""}`;
      $("#ctLimits").innerHTML = Object.entries(LIMIT_INFO).map(([k, v]) => chip(k, esc(S(v[0], v[1])), state.layout.limits.includes(k), "data-limit")).join("");
      $("#ctLimText").innerHTML = state.layout.limits.map((k) => `<li>${esc(S(LIMIT_INFO[k][2], LIMIT_INFO[k][3]))}</li>`).join("");
      const owned = Object.values(state.inventory).reduce((a, b) => a + b, 0);
      $("#ctOwned").textContent = owned ? S(`${owned} bangunan siap disusun (maks. 30).`, `${owned} buildings ready (max 30).`) : S("Isi jumlah bangunanmu dengan tombol + di daftar Bangunan.", "Set how many buildings you own with the + buttons.");
      drawDetail(res);
    }
    const change = (fn) => { remember(); fn(); save(); refresh(); };

    function onCell(x, y) {
      const k = x + "," + y, core = state.layout.core, s = Math.floor((E.GRID - core) / 2);
      if (mode === "extend") {
        if (x >= s && x < s + core && y >= s && y < s + core) return toast(S("Petak inti tidak bisa ditutup.", "Core cells cannot be locked."));
        return change(() => { const i = state.layout.extras.findIndex((c) => c[0] === x && c[1] === y); if (i >= 0) state.layout.extras.splice(i, 1); else state.layout.extras.push([x, y]); });
      }
      if (mode === "plot") return change(() => { if (state.layout.plots[k] === paint) delete state.layout.plots[k]; else state.layout.plots[k] = paint; });
      if (!armed) return;
      const p = { id: armed.id, x, y, rot: armed.rot };
      if (!E.canPlace(state.layout, p)) return toast(S("Tidak muat di sana.", "It does not fit there."));
      change(() => { state.layout.items.push(p); if (armed.moving) armed = null; });
      drawPalette();
    }

    $("#ctBoard").onclick = (ev) => {
      const it = ev.target.closest("[data-it]"), cell = ev.target.closest("[data-x]");
      if (it) {
        const i = +it.dataset.it, p = state.layout.items[i];
        if (mode === "plot") return onCell(p.x, p.y);
        if (mode !== "build") return;
        change(() => { state.layout.items.splice(i, 1); armed = { id: p.id, rot: p.rot, moving: true }; });
        return drawPalette();
      }
      if (cell) onCell(+cell.dataset.x, +cell.dataset.y);
    };
    $("#ctBoard").oncontextmenu = (ev) => { const it = ev.target.closest("[data-it]"); if (!it) return; ev.preventDefault(); change(() => state.layout.items.splice(+it.dataset.it, 1)); };
    const rotate = () => { if (!armed) return toast(S("Pilih bangunan dulu.", "Pick a building first.")); armed.rot = armed.rot ? 0 : 1; toast(armed.rot ? S("Diputar mendatar.", "Rotated.") : S("Posisi semula.", "Original orientation.")); };
    $("#ctRot").onclick = rotate;
    $("#ctDrop").onclick = () => { armed = null; drawPalette(); refresh(); };
    const onKey = (ev) => {
      if (!main.contains($("#ctBoard"))) return document.removeEventListener("keydown", onKey);
      if (/INPUT|SELECT|TEXTAREA/.test((ev.target || {}).tagName)) return;
      if (ev.key === "r" || ev.key === "R") { if (armed) rotate(); }
      else if (ev.key === "Escape" && armed) { armed = null; drawPalette(); refresh(); }
    };
    document.addEventListener("keydown", onKey);
    $("#ctUndo").onclick = () => { const h = history.pop(); if (!h) return toast(S("Tidak ada yang bisa diurungkan.", "Nothing to undo.")); state.layout = JSON.parse(h); save(); refresh(); };
    $("#ctClear").onclick = () => change(() => { state.layout.items = []; armed = null; drawPalette(); });
    $("#ctCore").onchange = (ev) => change(() => { state.layout.core = +ev.target.value; });
    $("#ctMult").oninput = (ev) => { const v = parseFloat(ev.target.value); state.mult = v >= 0 && v <= 100000 ? v : 1; save(); refresh(); };
    main.querySelector(".ct").addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      const d = b.dataset;
      if (d.th !== undefined) { theme = d.th; drawPalette(); }
      else if (d.arm) { armed = armed && armed.id === d.arm ? null : { id: d.arm, rot: 0 }; mode = "build"; drawPalette(); refresh(); if (armed && matchMedia("(max-width: 900px)").matches) $("#ctBoard").scrollIntoView({ behavior: "smooth", block: "center" }); }
      else if (d.inc || d.dec) { const id = d.inc || d.dec; const n = Math.max(0, Math.min(12, (state.inventory[id] || 0) + (d.inc ? 1 : -1))); if (n) state.inventory[id] = n; else delete state.inventory[id]; save(); drawPalette(); refresh(); }
      else if (d.mode) { mode = d.mode; armed = null; drawPalette(); refresh(); }
      else if (d.paint) { paint = d.paint; refresh(); }
      else if (d.limit) change(() => { const l = state.layout.limits, i = l.indexOf(d.limit); if (i >= 0) l.splice(i, 1); else l.push(d.limit); });
    });

    // ---- solver
    function finish(res) {
      solving = false; $("#ctSolve").disabled = false;
      if (!res) { $("#ctSolveMsg").textContent = S("Solver gagal dijalankan. Muat ulang halaman.", "The solver failed. Reload the page."); return; }
      const before = E.evaluate(state.layout, { mult: state.mult }).total;
      change(() => { state.layout.items = res.layout.items; armed = null; });
      drawPalette();
      $("#ctSolveMsg").textContent = S(`Selesai: skor ${fmt(res.total * state.mult)} (sebelumnya ${fmt(before)}). Tekan Urungkan untuk kembali. Hasil tidak dijamin paling tinggi.`, `Done: score ${fmt(res.total * state.mult)} (was ${fmt(before)}). Press Undo to go back. The result is not guaranteed optimal.`);
    }
    $("#ctSolve").onclick = () => {
      if (solving) return;
      const owned = Object.values(state.inventory).reduce((a, b) => a + b, 0);
      if (!owned) return toast(S("Isi dulu jumlah bangunanmu.", "Set your building counts first."));
      if (owned > 30) return toast(S("Maksimal 30 bangunan.", "At most 30 buildings."));
      solving = true; $("#ctSolve").disabled = true; $("#ctSolveMsg").textContent = S("Mencari susunan…", "Searching…");
      const msg = { ver, data: { buildings: data.buildings }, layout: state.layout, inventory: state.inventory, options: { budget: 60000, seed: 1, keep: $("#ctKeep").checked } };
      try {
        worker ||= new Worker("/nte/city-worker.js" + ver);
        worker.onmessage = (ev) => finish(ev.data.result);
        worker.onerror = () => { worker = null; finish(null); };
        worker.postMessage(msg);
      } catch (e) { finish(null); }
    };
    $("#ctFromBoard").onclick = () => { state.inventory = {}; state.layout.items.forEach((p) => { state.inventory[p.id] = Math.min(12, (state.inventory[p.id] || 0) + 1); }); save(); drawPalette(); refresh(); };
    $("#ctInvClear").onclick = () => { state.inventory = {}; save(); drawPalette(); refresh(); };

    // ---- ekspor dan impor
    $("#ctExport").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: "nte-city", version: 1, ...state }, null, 2)], { type: "application/json" }));
      a.download = "nte-tycoons-deck.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    };
    $("#ctImport").onclick = () => $("#ctFile").click();
    $("#ctFile").onchange = async (ev) => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = "";
      if (!f) return;
      if (f.size > 200 * 1024) return toast(S("Berkas terlalu besar.", "File is too large."));
      let raw = null;
      try { raw = JSON.parse(await f.text()); } catch (e) {}
      if (!raw || raw.format !== "nte-city") return toast(S("Bukan berkas susunan dari halaman ini.", "Not a layout file from this page."));
      change(() => { state = E.sanitize(raw); armed = null; });
      drawPalette(); toast(S("Susunan diimpor.", "Layout imported."));
    };

    // ---- katalog kartu
    $("#ctCardQ").oninput = (ev) => { cardQ = ev.target.value; drawCards(); };
    $("#ctCardR").onclick = (ev) => { const b = ev.target.closest("[data-cr]"); if (b) { cardR = b.dataset.cr; drawCards(); } };

    drawPalette(); refresh(); drawCards();
  };
})();
