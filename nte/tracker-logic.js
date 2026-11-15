/* Logika tracker gacha (tanpa DOM): validasi, statistik, ekspor/impor.
 * Pengguna mencatat total pull dan hanya S-Class yang didapat (nama + pity); sisanya dihitung di sini. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteTracker = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const LIM = { esper: { hard: 90, soft: 71 }, arc: { hard: 6, upHard: 8 } };
  const MAX_ENTRIES = 5000, MAX_TOTAL = 1e6, MAX_STR = 64;

  const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const emptyKind = () => ({ total: 0, a: 0, entries: [] });
  const emptyData = () => ({ esper: emptyKind(), arc: emptyKind() });

  function validate(kind, data) {
    const errs = [];
    if (!data || typeof data !== "object") return ["Data kosong."];
    if (!isInt(data.total, 0, MAX_TOTAL)) errs.push("Total pull harus angka bulat 0 sampai 1.000.000.");
    if (!isInt(data.a, 0, MAX_TOTAL)) errs.push("Jumlah A-Class harus angka bulat 0 atau lebih.");
    if (!Array.isArray(data.entries)) return errs.concat("Daftar S-Class tidak valid.");
    const L = LIM[kind];
    let sum = 0;
    data.entries.forEach((e, i) => {
      const row = `S-Class ke-${i + 1}`;
      if (!e || typeof e !== "object") { errs.push(`${row}: tidak valid.`); return; }
      if (kind === "esper" ? typeof e.id !== "string" || !e.id : typeof e.arc !== "string" || !e.arc) errs.push(`${row}: nama belum dipilih.`);
      if (!isInt(e.p, 1, L.hard)) errs.push(`${row}: pity harus 1 sampai ${L.hard}.`);
      else sum += e.p;
      if (kind === "arc" && e.up && !isInt(e.u, 1, L.upHard)) errs.push(`${row}: pity Arc UP harus 1 sampai ${L.upHard}.`);
    });
    if (isInt(data.total, 0, MAX_TOTAL) && sum > data.total) errs.push(`Jumlah pity semua S-Class (${sum}) lebih besar dari total pull (${data.total}).`);
    return errs;
  }

  const median = (nums) => {
    const k = nums.slice().sort((a, b) => a - b);
    if (!k.length) return null;
    return k.length % 2 ? k[(k.length - 1) / 2] : (k[k.length / 2 - 1] + k[k.length / 2]) / 2;
  };

  function compute(kind, data) {
    const L = LIM[kind];
    const errors = validate(kind, data);
    const entries = Array.isArray(data && data.entries) ? data.entries.filter((e) => e && isInt(e.p, 1, L.hard)) : [];
    const total = isInt(data && data.total, 0, MAX_TOTAL) ? data.total : 0;
    let n = 0, lastUp = null;
    const items = entries.map((e) => {
      n += e.p;
      if (e.up) lastUp = n;
      const k = kind === "esper" ? (e.p >= L.hard ? "hard" : e.p >= L.soft ? "soft" : "normal") : e.p >= L.hard ? "hard" : "normal";
      return { ...e, n, kind: k };
    });
    const pities = items.map((i) => i.p);
    const S = items.length;
    const currentPity = Math.max(0, total - n);
    const r = {
      S, items, errors,
      percent: total > 0 ? (S / total) * 100 : null,
      avg: S ? pities.reduce((a, b) => a + b, 0) / S : null,
      min: S ? Math.min(...pities) : null, max: S ? Math.max(...pities) : null, median: median(pities),
      currentPity, toHard: Math.max(0, L.hard - currentPity),
    };
    if (kind === "arc") {
      r.currentUpPity = Math.max(0, total - (lastUp === null ? 0 : lastUp));
      if (currentPity > L.hard) errors.push(`Pity sekarang (${currentPity}) melebihi hard pity ${L.hard}: kemungkinan ada Arc S yang belum dicatat.`);
      if (r.currentUpPity > L.upHard) errors.push(`Pity UP sekarang (${r.currentUpPity}) melebihi hard pity UP ${L.upHard}: kemungkinan ada Arc UP yang belum dicatat.`);
    } else if (currentPity > L.hard) {
      errors.push(`Pity sekarang (${currentPity}) melebihi hard pity ${L.hard}: kemungkinan ada S-Class yang belum dicatat.`);
    }
    return r;
  }

  const str = (v) => String(v).slice(0, MAX_STR);

  function cleanKind(kind, k) {
    if (!k || typeof k !== "object") return null;
    if (!isInt(k.total, 0, MAX_TOTAL) || !isInt(k.a === undefined ? 0 : k.a, 0, MAX_TOTAL) || !Array.isArray(k.entries)) return null;
    const L = LIM[kind];
    const entries = [];
    for (const e of k.entries.slice(0, MAX_ENTRIES)) {
      if (!e || typeof e !== "object" || !isInt(e.p, 1, L.hard)) continue;
      if (kind === "esper") { if (typeof e.id === "string" && e.id) entries.push({ id: str(e.id), p: e.p }); }
      else if (typeof e.arc === "string" && e.arc) {
        const o = { arc: str(e.arc), p: e.p };
        if (e.up === true && isInt(e.u, 1, L.upHard)) { o.up = true; o.u = e.u; }
        entries.push(o);
      }
    }
    return { total: k.total, a: k.a === undefined ? 0 : k.a, entries };
  }

  // Impor berkas tak tepercaya: hanya bidang yang dikenal, jumlah dan panjang dibatasi.
  function normalizeImport(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "Berkas bukan data tracker." };
    if (raw.format !== "nte-tracker") return { error: "Format berkas tidak dikenal (bukan ekspor tracker ini)." };
    if (raw.version !== 1) return { error: "Versi berkas tidak didukung." };
    const esper = cleanKind("esper", raw.esper), arc = cleanKind("arc", raw.arc);
    if (!esper || !arc) return { error: "Isi berkas tidak valid." };
    return { data: { esper, arc } };
  }

  const exportData = (data) => ({ format: "nte-tracker", version: 1, esper: data.esper, arc: data.arc });

  return { LIM, emptyData, validate, compute, normalizeImport, exportData };
});
