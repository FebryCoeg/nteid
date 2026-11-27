/* Pencari susunan untuk "Penuhi Seluruh Kota": penempatan serakah acak, lalu bongkar sebagian dan susun ulang.
 * Anggaran berupa jumlah evaluasi (bukan waktu) dan benih acak tetap, jadi hasilnya sama di perangkat apa pun.
 * Tidak dijamin optimal. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteCitySolver = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function solve(engine, layout, inventory, opt = {}) {
    const budget = opt.budget || 60000, random = rng(opt.seed || 1);
    const fixed = opt.keep ? engine.evaluate(layout).items.map((i) => ({ ...layout.items[i.index] })) : [];
    const stock = {};
    for (const [id, n] of Object.entries(inventory || {})) if (engine.BY[id] && n > 0) stock[id] = Math.min(12, Math.floor(n));
    fixed.forEach((p) => { if (stock[p.id]) stock[p.id]--; });
    const pool = Object.entries(stock).flatMap(([id, n]) => Array(n).fill(id));

    let used = 0;
    const board = (items) => ({ ...layout, items });
    // nilai = skor, ditambah porsi sangat kecil dari pengunjung terpakai supaya ada arah saat skor masih sama
    const value = (items) => {
      used++;
      const r = engine.evaluate(board(items));
      return { total: r.total, value: r.total + r.items.reduce((s, i) => s + Math.min(i.traffic, i.cap), 0) * 1e-4 };
    };
    const cand = {};
    const spots = (id) => (cand[id] ||= (() => {
      const b = engine.BY[id], out = [];
      for (const rot of b.w === b.h ? [0] : [0, 1])
        for (let y = 0; y < engine.GRID; y++) for (let x = 0; x < engine.GRID; x++) {
          const p = { id, x, y, rot };
          if (engine.canPlace({ ...layout, items: [] }, p)) out.push({ p, cells: engine.footprint(p).map(([a, c]) => a + "," + c) });
        }
      return out;
    })());
    const occupied = (items) => new Set(items.flatMap((p) => engine.footprint(p).map(([a, c]) => a + "," + c)));
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

    // taruh tiap bangunan sisa di tempat terbaiknya; yang tidak menurunkan nilai tetap ditaruh
    function fill(items, rest) {
      let cur = items, now = value(cur);
      for (const id of rest) {
        if (used >= budget) break;
        const occ = occupied(cur);
        let best = null, ties = 0;
        for (const s of spots(id)) {
          if (s.cells.some((c) => occ.has(c))) continue;
          const v = value(cur.concat(s.p));
          if (!best || v.value > best.v.value + 1e-9) { best = { p: s.p, v }; ties = 1; }
          else if (v.value > best.v.value - 1e-9 && random() < 1 / ++ties) best = { p: s.p, v };
        }
        if (best && best.v.value >= now.value - 1e-9) { cur = cur.concat({ ...best.p }); now = best.v; }
      }
      return { items: cur, ...now };
    }
    const missing = (items) => {
      const left = [...pool];
      items.slice(fixed.length).forEach((p) => { const i = left.indexOf(p.id); if (i >= 0) left.splice(i, 1); });
      return left;
    };

    let best = { items: fixed, ...value(fixed) };
    if (pool.length) {
      const weight = (id) => (engine.BY[id].cap ? 0 : 1); // bergantian: transportasi dulu atau bangunan dulu
      let cur = best, stale = 0;
      for (let round = 0; used < budget && round < 4000; round++) {
        let start = cur.items;
        if (round < 4 || stale > 60) { start = fixed; stale = 0; }
        else {
          const loose = start.length - fixed.length;
          const drop = new Set(shuffle(Array.from({ length: loose }, (_, i) => i + fixed.length)).slice(0, 1 + Math.floor(random() * 3)));
          start = start.filter((_, i) => !drop.has(i));
        }
        const order = shuffle(missing(start));
        if (round % 3 === 1) order.sort((a, b) => weight(b) - weight(a));
        if (round % 3 === 2) order.sort((a, b) => weight(a) - weight(b));
        const next = fill(start, order);
        if (next.value > best.value + 1e-9) { best = next; stale = 0; } else stale++;
        if (start === fixed || next.value >= cur.value - 1e-9) cur = next;
      }
    }
    // buang bangunan tambahan yang tidak menyumbang apa pun
    let items = best.items, total = best.total;
    for (let i = items.length - 1; i >= fixed.length; i--) {
      const trial = items.filter((_, k) => k !== i);
      const r = engine.evaluate(board(trial));
      if (r.total >= total - 1e-9) { items = trial; total = r.total; }
    }
    return { layout: board(items), total, evaluations: used };
  }

  return { solve };
});
