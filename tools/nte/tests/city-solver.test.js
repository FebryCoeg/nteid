const test = require("node:test");
const assert = require("node:assert/strict");
const DATA = require("../../../nte/data/city.json");
const City = require("../../../nte/city-engine.js");
const Solver = require("../../../nte/city-solver.js");
const E = City.create(DATA);
const empty = (core = 5, extra = {}) => ({ core, extras: [], plots: {}, limits: [], items: [], ...extra });
const run = (layout, inv, opt) => Solver.solve(E, layout, inv, { budget: 6000, seed: 1, ...opt });
const count = (items) => items.reduce((m, p) => ((m[p.id] = (m[p.id] || 0) + 1), m), {});
const allLegal = (layout) => E.evaluate(layout).items.length === layout.items.length;

test("menemukan susunan terbaik untuk kasus kecil", () => {
  const r = run(empty(3), { OneCafe: 2, BikeStation: 1 });
  assert.equal(r.total, 40);
  assert.equal(E.evaluate(r.layout).total, 40);
});

test("tidak memakai bangunan melebihi jumlah yang dimiliki dan semua letaknya sah", () => {
  const inv = { OneCafe: 3, Bread: 2, Metro: 2, GreenHall: 1, BikeStation: 1, ThemePark: 1 };
  const r = run(empty(), inv);
  for (const [id, n] of Object.entries(count(r.layout.items))) assert.ok(n <= inv[id], `${id} ${n}`);
  assert.ok(allLegal(r.layout));
  assert.ok(r.total > 100, String(r.total));
});

test("hasil sama untuk benih yang sama", () => {
  const inv = { OneCafe: 3, Metro: 1, Gacha: 2, Arcade: 1 };
  assert.deepEqual(run(empty(), inv).layout.items, run(empty(), inv).layout.items);
});

test("mempertahankan bangunan yang sudah ditaruh dan menghitungnya dari jatah", () => {
  const start = empty(5, { items: [{ id: "OneCafe", x: 2, y: 2, rot: 0 }] });
  const r = run(start, { OneCafe: 2, BikeStation: 1 }, { keep: true });
  assert.deepEqual(r.layout.items[0], start.items[0]);
  assert.equal(count(r.layout.items).OneCafe, 2);
  assert.equal(r.total, 40);
});

test("tanpa keep, papan disusun ulang; tanpa jatah, tidak ada yang ditaruh", () => {
  const start = empty(5, { items: [{ id: "LuxuryHall", x: 2, y: 2, rot: 0 }] });
  assert.equal(run(start, { OneCafe: 1, BikeStation: 1 }).layout.items.some((p) => p.id === "LuxuryHall"), false);
  assert.deepEqual(run(empty(), {}).layout.items, []);
});

test("mematuhi petak sungai dan pembatasan", () => {
  const board = empty(3, { plots: { "4,4": "river" }, limits: ["tax"] });
  const r = run(board, { OneCafe: 2, BikeStation: 1 });
  assert.ok(allLegal(r.layout));
  assert.equal(r.total, 30);
});
