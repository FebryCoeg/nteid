const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const T = require(path.join(ROOT, "nte", "tracker-logic.js"));
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test("Esper: statistik, nomor pull kumulatif, pity sekarang, hard pity", () => {
  const r = T.compute("esper", { total: 200, a: 20, entries: [{ id: "elyms", p: 64 }, { id: "adler", p: 90 }, { id: "elyms", p: 30 }] });
  assert.equal(r.errors.length, 0);
  assert.equal(r.S, 3);
  near(r.percent, 1.5);
  near(r.avg, 61.33);
  assert.equal(r.median, 64);
  assert.deepEqual([r.min, r.max], [30, 90]);
  assert.deepEqual(r.items.map((i) => i.n), [64, 154, 184]);
  assert.deepEqual(r.items.map((i) => i.kind), ["normal", "hard", "normal"]);
  assert.equal(r.currentPity, 16);
  assert.equal(r.toHard, 74);
});

test("Esper: pity 71 sampai 89 = soft pity, median untuk jumlah genap", () => {
  const r = T.compute("esper", { total: 300, a: 0, entries: [{ id: "a", p: 75 }, { id: "b", p: 71 }, { id: "c", p: 70 }, { id: "d", p: 10 }] });
  assert.deepEqual(r.items.map((i) => i.kind), ["soft", "soft", "normal", "normal"]);
  assert.equal(r.median, (70 + 71) / 2);
});

test("validasi: jumlah pity lebih besar dari total, pity di luar rentang, entri bukan larik", () => {
  assert.ok(T.validate("esper", { total: 100, a: 0, entries: [{ id: "a", p: 60 }, { id: "b", p: 50 }] }).length >= 1);
  assert.ok(T.validate("esper", { total: 500, a: 0, entries: [{ id: "a", p: 0 }] }).length >= 1);
  assert.ok(T.validate("esper", { total: 500, a: 0, entries: [{ id: "a", p: 91 }] }).length >= 1);
  assert.ok(T.validate("arc", { total: 50, a: 0, entries: [{ arc: "x", p: 7 }] }).length >= 1);
  assert.ok(T.validate("arc", { total: 50, a: 0, entries: [{ arc: "x", p: 3, up: true }] }).length >= 1, "UP tanpa pity UP");
  assert.ok(T.validate("esper", { total: 10, a: 0, entries: "x" }).length >= 1);
  assert.deepEqual(T.validate("esper", { total: 500, a: 0, entries: [{ id: "a", p: 60 }] }), []);
});

test("peringatan, bukan error fatal, saat jumlah pity melebihi total; perhitungan tidak crash", () => {
  const r = T.compute("esper", { total: 50, a: 0, entries: [{ id: "a", p: 60 }] });
  assert.ok(r.errors.length >= 1);
  assert.equal(r.currentPity, 0);
  assert.equal(r.S, 1);
});

test("Arc: pity S dan pity UP sekarang", () => {
  const r = T.compute("arc", { total: 20, a: 5, entries: [{ arc: "a", p: 3 }, { arc: "b", p: 2, up: true, u: 5 }] });
  assert.deepEqual(r.items.map((i) => i.n), [3, 5]);
  assert.equal(r.currentPity, 15);
  assert.equal(r.currentUpPity, 15);
  assert.ok(r.errors.some((e) => /melebihi|hard/i.test(e)), "pity sekarang di atas hard pity harus diperingatkan");
  assert.deepEqual(r.items.map((i) => i.kind), ["normal", "normal"]);
  const h = T.compute("arc", { total: 30, a: 0, entries: [{ arc: "a", p: 6 }] });
  assert.equal(h.items[0].kind, "hard");
});

test("impor: berkas valid diterima, format asing ditolak, bidang asing dibuang dan string dipotong", () => {
  const good = { format: "nte-tracker", version: 1, esper: { total: 100, a: 4, entries: [{ id: "elyms", p: 40, evil: "x" }] }, arc: { total: 0, a: 0, entries: [] }, extra: "x" };
  const r = T.normalizeImport(good);
  assert.ok(r.data && !r.error);
  assert.deepEqual(r.data.esper.entries, [{ id: "elyms", p: 40 }]);
  assert.equal(r.data.extra, undefined);
  assert.ok(T.normalizeImport({ format: "lain" }).error);
  assert.ok(T.normalizeImport("bukan objek").error);
  assert.ok(T.normalizeImport(null).error);
  const long = T.normalizeImport({ ...good, esper: { total: 100, a: 0, entries: [{ id: "x".repeat(500), p: 5 }] } });
  assert.ok(long.data.esper.entries[0].id.length <= 64);
  const many = T.normalizeImport({ ...good, esper: { total: 1e6, a: 0, entries: Array.from({ length: 9000 }, () => ({ id: "a", p: 1 })) } });
  assert.ok(many.data.esper.entries.length <= 5000);
  assert.ok(T.normalizeImport({ ...good, esper: { total: "banyak", a: 0, entries: [] } }).error, "total bukan angka ditolak");
});

test("ekspor lalu impor kembali menghasilkan data yang sama", () => {
  const data = { esper: { total: 250, a: 12, entries: [{ id: "elyms", p: 64 }, { id: "adler", p: 90 }] }, arc: { total: 30, a: 6, entries: [{ arc: "echoes-on-hold", p: 4, up: true, u: 6 }] } };
  const json = JSON.parse(JSON.stringify(T.exportData(data)));
  assert.equal(json.format, "nte-tracker");
  assert.deepEqual(T.normalizeImport(json).data, data);
  assert.deepEqual(T.normalizeImport(T.exportData(T.emptyData())).data, T.emptyData());
});
