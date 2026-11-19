const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../../../nte/proposals-logic.js");

const ctx = { arcs: ["crime-and-punishment", "ravenous-blade"], sets: ["Suit3", "Suit11"], stats: ["ATK %", "CRIT DMG", "CRIT Rate"] };

test("sanitizeBuild: build valid dipertahankan apa adanya", () => {
  const raw = { arcs: ["ravenous-blade"], sets: [{ id: "Suit3", pieces: 4 }], stats: ["CRIT DMG"], awks: [1, 3], skills: ["basic", "ultimate"] };
  const r = P.sanitizeBuild(raw, ctx);
  assert.deepEqual(r.build, raw);
  assert.equal(r.dropped, 0);
});

test("sanitizeBuild: nilai asing dan duplikat dibuang, dihitung", () => {
  const r = P.sanitizeBuild({ arcs: ["ravenous-blade", "ravenous-blade", "bukan-arc"], sets: [{ id: "Suit3", pieces: 3 }, { id: "Xx", pieces: 4 }], stats: ["ATK %", "HACK"], awks: [0, 2, 7, 2], skills: ["basic", "evil"] }, ctx);
  assert.deepEqual(r.build, { arcs: ["ravenous-blade"], sets: [], stats: ["ATK %"], awks: [2], skills: ["basic"] });
  assert.equal(r.dropped, 9);
});

test("sanitizeBuild: bidang tambahan dan bukan objek diabaikan tanpa error", () => {
  assert.deepEqual(P.sanitizeBuild({ arcs: [], sets: [], stats: [], awks: [], skills: [], admin: true, evil: "x" }, ctx).build, { arcs: [], sets: [], stats: [], awks: [], skills: [] });
  for (const bad of [null, undefined, 5, "x", []]) assert.deepEqual(P.sanitizeBuild(bad, ctx).build, { arcs: [], sets: [], stats: [], awks: [], skills: [] });
});

test("sanitizeBuild: jumlah dibatasi (arc 12, set 8, stat 12)", () => {
  const many = Array.from({ length: 30 }, (_, i) => "a" + i);
  const r = P.sanitizeBuild({ arcs: many }, { arcs: many, sets: [], stats: [] });
  assert.equal(r.build.arcs.length, 12);
});

test("isEmpty", () => {
  assert.equal(P.isEmpty({ arcs: [], sets: [], stats: [], awks: [], skills: [] }), true);
  assert.equal(P.isEmpty({ arcs: [], sets: [], stats: ["ATK %"], awks: [], skills: [] }), false);
});

test("diff: hanya bidang yang berubah", () => {
  const a = { arcs: ["x"], sets: [], stats: ["ATK %"], awks: [], skills: [] };
  const b = { arcs: ["x", "y"], sets: [], stats: ["ATK %"], awks: [1], skills: [] };
  assert.deepEqual(P.diff(a, b).map((d) => d.field), ["arcs", "awks"]);
  assert.deepEqual(P.diff(a, a), []);
  assert.deepEqual(P.diff(undefined, a).map((d) => d.field), ["arcs", "stats"]);
});

test("docId: gabungan uid dan slug, karakter aneh ditolak", () => {
  assert.equal(P.docId("abc123", "akane-rin"), "abc123_akane-rin");
  assert.equal(P.docId("a/b", "x"), null);
  assert.equal(P.docId("abc", "x/../y"), null);
  assert.equal(P.docId("", "x"), null);
});
