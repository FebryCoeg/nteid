/* Logika usulan build komunitas (tanpa DOM): pembersihan, perbandingan, id dokumen.
 * Usulan berasal dari pengguna lain, jadi dianggap tak tepercaya. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteProposals = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const MAX = { arcs: 12, sets: 8, stats: 12, awks: 6, skills: 4 };
  const SKILLS = ["basic", "redirect", "ultimate", "support"];
  const FIELDS = ["arcs", "sets", "stats", "awks", "skills"];
  const emptyBuild = () => ({ arcs: [], sets: [], stats: [], awks: [], skills: [] });

  function sanitizeBuild(raw, ctx) {
    const out = emptyBuild();
    let dropped = 0;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { build: out, dropped };
    const arr = (v) => (Array.isArray(v) ? v : []);
    const uniqStr = (list, allowed, max) => {
      const seen = new Set(), res = [];
      for (const v of arr(list)) {
        if (typeof v === "string" && allowed.has(v) && !seen.has(v) && res.length < max) { seen.add(v); res.push(v); } else dropped++;
      }
      return res;
    };
    out.arcs = uniqStr(raw.arcs, new Set(ctx.arcs), MAX.arcs);
    out.stats = uniqStr(raw.stats, new Set(ctx.stats), MAX.stats);
    out.skills = uniqStr(raw.skills, new Set(SKILLS), MAX.skills);
    const setOk = new Set(ctx.sets), seenSet = new Set();
    for (const s of arr(raw.sets)) {
      const k = s && typeof s === "object" ? s.id + "|" + s.pieces : "";
      if (s && typeof s.id === "string" && setOk.has(s.id) && (s.pieces === 2 || s.pieces === 4) && !seenSet.has(k) && out.sets.length < MAX.sets) { seenSet.add(k); out.sets.push({ id: s.id, pieces: s.pieces }); } else dropped++;
    }
    const seenA = new Set();
    for (const n of arr(raw.awks)) {
      if (Number.isInteger(n) && n >= 1 && n <= 6 && !seenA.has(n) && out.awks.length < MAX.awks) { seenA.add(n); out.awks.push(n); } else dropped++;
    }
    return { build: out, dropped };
  }

  const isEmpty = (b) => !b || FIELDS.every((f) => !Array.isArray(b[f]) || !b[f].length);

  function diff(oldB, newB) {
    const a = Object.assign(emptyBuild(), oldB || {}), b = Object.assign(emptyBuild(), newB || {});
    return FIELDS.filter((f) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map((f) => ({ field: f, before: a[f], after: b[f] }));
  }

  const SAFE = /^[A-Za-z0-9_-]{1,128}$/;
  const docId = (uid, esper) => (typeof uid === "string" && typeof esper === "string" && SAFE.test(uid) && SAFE.test(esper) ? uid + "_" + esper : null);

  return { MAX, sanitizeBuild, isEmpty, diff, docId };
});
