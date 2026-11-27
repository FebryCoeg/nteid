/* Mesin hitung "Penuhi Seluruh Kota" (mode 铺满全城, 异环 1.5), tanpa DOM, ditulis untuk situs ini.
 * Skor satu hitungan = jumlah min(pengunjung, kapasitas) x konversi tiap bangunan, ditambah efek khusus.
 * Efek yang bergantung pada tindakan dalam permainan (ambil/tukar kartu, perubahan acak, koin) tidak dihitung.
 * Tata letak: { core, extras:[[x,y]], plots:{"x,y":jenis}, limits:[], items:[{id,x,y,rot}] } pada petak 9x9. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteCity = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const GRID = 9;
  const SIDE = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const AROUND = SIDE.concat([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  const NO_BUILD = { river: 1, monument: 1 };
  const PLOTS = ["high", "river", "monument"];
  const LIMITS = ["outerDecay", "innerRoll", "heightCap", "tax", "jamZero", "pollution", "funControl", "foodControl"];
  const AURAS = { auraCap: 1, auraConv: 1, auraGod: 1 };
  const key = (x, y) => x + "," + y;
  const round = (n) => Math.round(n * 1e6) / 1e6;

  function create(data) {
    const BY = Object.fromEntries(data.buildings.map((b) => [b.id, b]));

    function footprint(p) {
      const b = BY[p.id], turned = (p.rot || 0) % 2 === 1;
      const w = turned ? b.h : b.w, h = turned ? b.w : b.h, out = [];
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push([p.x + dx, p.y + dy]);
      return out;
    }

    function activeCells(layout) {
      const core = Math.max(3, Math.min(7, layout.core || 5)), s = Math.floor((GRID - core) / 2), set = new Set();
      for (let y = s; y < s + core; y++) for (let x = s; x < s + core; x++) set.add(key(x, y));
      for (const [x, y] of layout.extras || []) if (x >= 0 && y >= 0 && x < GRID && y < GRID) set.add(key(x, y));
      return set;
    }

    const plotAt = (layout, x, y) => (layout.plots && layout.plots[key(x, y)]) || "normal";

    // susun daftar bangunan yang sah (urutan menentukan siapa yang menang bila bertumpuk)
    function legal(layout, active) {
      const occ = new Map(), list = [];
      (layout.items || []).forEach((p, index) => {
        if (!BY[p.id]) return;
        const cells = footprint(p);
        if (!cells.every(([x, y]) => active.has(key(x, y)) && !NO_BUILD[plotAt(layout, x, y)] && !occ.has(key(x, y)))) return;
        cells.forEach(([x, y]) => occ.set(key(x, y), list.length));
        list.push({ p, index, cells });
      });
      return { occ, list };
    }

    function canPlace(layout, p) {
      if (!BY[p.id]) return false;
      const active = activeCells(layout), { occ } = legal(layout, active);
      return footprint(p).every(([x, y]) => active.has(key(x, y)) && !NO_BUILD[plotAt(layout, x, y)] && !occ.has(key(x, y)));
    }

    function pointsOf(it, traffic) {
      const used = Math.max(0, Math.min(traffic, it.cap));
      const fx = it.fx;
      if (fx.type === "retrigger" || fx.type === "retriggerGrowth") {
        const n = Math.floor(used / fx.every) + it.extraTimes;
        const base = fx.type === "retrigger" ? fx.points * n : fx.first * n + fx.growth * n * (n - 1) / 2;
        return { settles: n, score: n ? (base + it.support * n) * it.finalMult : 0 };
      }
      return { settles: 1, score: (used * it.conv + it.support + it.bonus) * it.finalMult };
    }

    // bagikan `amount` pengunjung satu per satu ke target yang paling menambah skor; kembalikan sisanya
    function pour(amount, targets, onGive) {
      while (amount > 0) {
        let best = null, gain = 1e-9;
        for (const t of targets) {
          if (t.traffic >= t.cap) continue;
          const g = pointsOf(t, t.traffic + 1).score - pointsOf(t, t.traffic).score;
          // bangunan berulang baru bertambah di kelipatan: nilai juga kemajuan menuju hitungan berikutnya
          const step = t.fx.every ? (pointsOf(t, t.traffic + t.fx.every).score - pointsOf(t, t.traffic).score) / t.fx.every : 0;
          const v = Math.max(g, step);
          if (v > gain) { gain = v; best = t; }
        }
        if (!best) break;
        const n = Math.min(1, amount);
        best.traffic += n; amount -= n;
        if (onGive) onGive(best, n);
      }
      return amount;
    }

    function evaluate(layout, options = {}) {
      const base = options.baseTraffic || 0, mult = options.mult == null ? 1 : options.mult;
      const limits = new Set(layout.limits || []);
      const active = activeCells(layout);
      const { occ, list } = legal(layout, active);
      const items = list.map(({ p, index, cells }) => {
        const b = BY[p.id], scoring = b.cap > 0;
        return { id: b.id, index, x: p.x, y: p.y, rot: (p.rot || 0) % 2, cells, b, fx: b.fx, theme: b.theme, scoring,
          cap: b.cap, conv: b.conv, traffic: scoring ? base : 0, fed: 0, bonusConv: 0, support: 0, bonus: 0,
          extraTimes: 0, finalMult: 1, settles: 0, score: 0, notes: [] };
      });
      const neighbours = (i, dirs) => {
        const set = new Set();
        for (const [x, y] of items[i].cells) for (const [dx, dy] of dirs) {
          const j = occ.get(key(x + dx, y + dy));
          if (j !== undefined && j !== i) set.add(j);
        }
        return [...set].map((j) => items[j]);
      };
      const side = items.map((_, i) => neighbours(i, SIDE));
      const around = items.map((_, i) => neighbours(i, AROUND));
      const adj = options.adj8 ? around : side;
      const note = (it, k, v) => it.notes.push({ k, v });
      const isTheme = (it, theme) => it.fx.type === "allTheme" || it.theme === theme;
      const names = (arr) => new Set(arr.map((o) => o.id)).size;
      let pool = 0;

      // 1) pengunjung dari bangunan sendiri dan transportasi
      items.forEach((it, i) => {
        const fx = it.fx;
        if (fx.type === "selfTrafficAdjTheme" && adj[i].some((o) => isTheme(o, fx.theme))) { it.traffic += fx.value; note(it, "adjTheme", fx.value); }
        if (fx.type === "selfTrafficPerAdjName" && adj[i].length) { const v = names(adj[i]) * fx.value; it.traffic += v; note(it, "adjNames", v); }
        if (fx.type === "selfTrafficConvPerAdjThemeName") {
          const n = names(adj[i].filter((o) => isTheme(o, fx.theme)));
          if (n) { it.traffic += n * fx.value; it.bonusConv += n * fx.conv; note(it, "adjThemeNames", n * fx.value); }
        }
        if (fx.type === "trafficLine" || fx.type === "trafficAround") {
          const hit = new Set();
          for (const [x, y] of it.cells) {
            const spots = fx.type === "trafficAround" ? AROUND.map(([dx, dy]) => [x + dx, y + dy])
              : SIDE.flatMap(([dx, dy]) => Array.from({ length: fx.range }, (_, d) => [x + dx * (d + 1), y + dy * (d + 1)]));
            for (const [sx, sy] of spots) { const j = occ.get(key(sx, sy)); if (j !== undefined && items[j].scoring) hit.add(items[j]); }
          }
          hit.forEach((o) => { o.traffic += fx.value; o.fed += fx.value; note(o, fx.type === "trafficLine" ? "metro" : "bike", fx.value); });
        }
        if (fx.type === "pool") pool += fx.value;
      });
      // 2) ruang dispatch: kedua ujung sisi pendek harus sudah diberi transportasi
      items.forEach((it) => {
        if (it.fx.type !== "trafficShortSide") return;
        const w = it.rot ? it.b.h : it.b.w, h = it.rot ? it.b.w : it.b.h;
        const ends = h >= w ? [[it.x, it.y - 1], [it.x, it.y + h]] : [[it.x - 1, it.y], [it.x + w, it.y]];
        const found = ends.map(([x, y]) => items[occ.get(key(x, y))]);
        if (found.every((o) => o && o.scoring && o.fed > 0)) found.forEach((o) => { o.traffic += it.fx.traffic; o.bonusConv += it.fx.conv; note(o, "dispatch", it.fx.traffic); });
      });
      // 3) aura, pembatasan, petak nilai tinggi
      items.forEach((it, i) => {
        if (!it.scoring) return;
        let auraCap = 0, auraConv = 0;
        for (const o of side[i]) {
          if (o.fx.type === "auraCap") auraCap = Math.max(auraCap, o.fx.value);
          if (o.fx.type === "auraConv") auraConv = Math.max(auraConv, o.fx.value);
          if (o.fx.type === "auraGod" && side[i].some((g) => g !== o && g.theme === "green")) { auraCap = Math.max(auraCap, o.fx.cap); auraConv = Math.max(auraConv, o.fx.conv); }
        }
        if (auraCap) note(it, "auraCap", auraCap);
        if (auraConv) note(it, "auraConv", auraConv);
        const half = limits.has("heightCap") && it.cells.length >= 2 ? 0.5 : 1;
        it.cap += auraCap;
        it.conv = (it.b.conv + it.bonusConv) * half + auraConv;
        if (limits.has("pollution")) it.cap = Math.max(0, it.cap - 10);
        if ((limits.has("funControl") && it.theme === "fun") || (limits.has("foodControl") && it.theme === "food")) it.conv *= 0.75;
        const high = it.cells.filter(([x, y]) => plotAt(layout, x, y) === "high").length;
        if (high) { it.traffic += 15 * high; it.conv += 0.15 * high; note(it, "high", 15 * high); }
        it.conv = round(it.conv);
      });
      // 4) efek bergantung tetangga
      items.forEach((it, i) => {
        if (it.fx.type === "firstSettlePerAdjName") it.bonus = names(adj[i]) * it.fx.value;
        if (it.fx.type === "selfFinalPerAdjSame") it.finalMult = 1 + it.fx.per * adj[i].filter((o) => o.id === it.id).length;
        if (it.fx.type === "retrigger" || it.fx.type === "retriggerGrowth") it.extraTimes = adj[i].filter((o) => o.fx.type === "retriggerAdj").reduce((s, o) => s + o.fx.value, 0);
      });
      const cinema = () => {
        items.forEach((o) => { o.support = 0; });
        items.forEach((it, i) => {
          if (it.fx.type !== "supportAround") return;
          const v = Math.floor(it.traffic / it.fx.per) * it.fx.points;
          around[i].forEach((o) => { o.support += v; });
        });
      };
      cinema();
      const scoring = items.filter((it) => it.scoring);
      // 5) pengunjung bebas dari halte
      if (pool > 0) pour(pool, scoring, (t, n) => note(t, "pool", n));
      // 6) kelebihan pindah satu langkah ke tetangga (yang diterima tidak diteruskan)
      const excess = items.map((it) => (it.scoring ? Math.max(0, it.traffic - it.cap) : 0));
      items.forEach((it, i) => {
        if (!excess[i]) return;
        const left = pour(excess[i], adj[i].filter((o) => o.scoring), (t, n) => note(t, "share", n));
        it.traffic -= excess[i] - left;
      });
      // 7) petak sungai: tampung sisa kelebihan (maksimal 80) lalu salurkan
      const touching = (cx, cy) => scoring.filter((it) => it.cells.some(([x, y]) => Math.abs(x - cx) + Math.abs(y - cy) === 1));
      for (const k of Object.keys(layout.plots || {})) {
        if (layout.plots[k] !== "river" || !active.has(k)) continue;
        const [cx, cy] = k.split(",").map(Number), near = touching(cx, cy);
        let store = 0;
        const took = near.map((it) => { const n = Math.min(Math.max(0, it.traffic - it.cap), 80 - store); it.traffic -= n; store += n; return n; });
        store = pour(store, near, (t, n) => note(t, "river", n));
        near.forEach((it, i) => { const back = Math.min(took[i], store); it.traffic += back; store -= back; });
      }
      cinema();
      // 8) skor
      const xs = [...active].map((k) => +k.split(",")[0]), ys = [...active].map((k) => +k.split(",")[1]);
      const edge = ([x, y]) => x === Math.min(...xs) || x === Math.max(...xs) || y === Math.min(...ys) || y === Math.max(...ys);
      let total = 0, jammed = false;
      scoring.forEach((it) => {
        const r = pointsOf(it, it.traffic);
        let k = 1;
        if (limits.has("outerDecay") && it.cells.some(edge)) k *= 0.5;
        if (limits.has("innerRoll")) k *= Math.max(0, 1 - 0.08 * (scoring.filter((o) => o.theme === it.theme).length - 1));
        if (it.traffic > it.cap) jammed = true;
        it.settles = r.settles;
        it.score = round(r.score * k);
        total += it.score;
      });
      let monument = 0;
      for (const k of Object.keys(layout.plots || {})) {
        if (layout.plots[k] !== "monument" || !active.has(k)) continue;
        const [cx, cy] = k.split(",").map(Number);
        monument += 0.25 * touching(cx, cy).reduce((s, it) => s + it.score, 0);
      }
      total += monument;
      if (limits.has("jamZero") && jammed) total = 0;
      if (limits.has("tax")) total *= 0.75;
      return {
        total: round(total * mult), monument: round(monument), jammed,
        used: items.reduce((s, it) => s + it.cells.length, 0), cells: active.size,
        items: items.map((it) => ({ id: it.id, index: it.index, x: it.x, y: it.y, rot: it.rot, cells: it.cells, scoring: it.scoring,
          traffic: it.traffic, cap: it.cap, conv: it.conv, settles: it.settles, score: it.score, notes: it.notes })),
      };
    }

    // data dari penyimpanan lokal atau berkas impor dianggap tak tepercaya
    function sanitize(raw) {
      const o = raw && typeof raw === "object" ? raw : {}, l = o.layout && typeof o.layout === "object" ? o.layout : {};
      const cell = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < GRID && y < GRID;
      const extras = [...new Map((Array.isArray(l.extras) ? l.extras : []).filter((c) => Array.isArray(c) && cell(c[0], c[1])).map((c) => [key(c[0], c[1]), [c[0], c[1]]])).values()];
      const plots = {};
      for (const [k, v] of Object.entries(l.plots && typeof l.plots === "object" ? l.plots : {})) {
        const [x, y] = k.split(",").map(Number);
        if (cell(x, y) && k === key(x, y) && PLOTS.includes(v)) plots[k] = v;
      }
      const limits = [...new Set((Array.isArray(l.limits) ? l.limits : []).filter((x) => LIMITS.includes(x)))];
      const items = (Array.isArray(l.items) ? l.items : []).slice(0, 81)
        .filter((p) => p && Object.prototype.hasOwnProperty.call(BY, p.id) && cell(p.x, p.y))
        .map((p) => ({ id: p.id, x: p.x, y: p.y, rot: Math.abs(p.rot || 0) % 2 === 1 ? 1 : 0 }));
      const inventory = {};
      for (const [id, n] of Object.entries(o.inventory && typeof o.inventory === "object" ? o.inventory : {}))
        if (Object.prototype.hasOwnProperty.call(BY, id) && Number.isInteger(n) && n > 0) inventory[id] = Math.min(12, n);
      const core = Number.isInteger(l.core) ? Math.max(3, Math.min(7, l.core)) : 5;
      const mult = typeof o.mult === "number" && o.mult >= 0 && o.mult <= 100000 ? o.mult : 1;
      return { layout: { core, extras, plots, limits, items }, inventory, mult };
    }

    return { GRID, BY, footprint, activeCells, canPlace, evaluate, sanitize, isAura: (id) => !!AURAS[BY[id].fx.type] };
  }

  return { create, PLOTS, LIMITS };
});
