const test = require("node:test");
const assert = require("node:assert/strict");
const DATA = require("../../../nte/data/city.json");
const City = require("../../../nte/city-engine.js");
const E = City.create(DATA);

// papan dalam 9x9; inti 5x5 menempati koordinat 2..6
const L = (items, extra = {}) => ({ core: 5, extras: [], plots: {}, limits: [], items: items.map(([id, x, y, rot = 0]) => ({ id, x, y, rot })), ...extra });
const score = (layout, opt) => E.evaluate(layout, opt).total;
const of = (layout, id, opt) => E.evaluate(layout, opt).items.find((i) => i.id === id);

test("bangunan tanpa pengunjung tidak menghasilkan poin", () => {
  assert.equal(score(L([["OneCafe", 3, 3]])), 0);
});

test("pos sepeda memberi +10 pada bangunan di sekitarnya", () => {
  assert.equal(score(L([["OneCafe", 3, 3], ["BikeStation", 4, 4]])), 10);
});

test("dua kafe bersebelahan mendapat bonus kuliner sendiri-sendiri", () => {
  assert.equal(score(L([["OneCafe", 3, 3], ["OneCafe", 4, 3], ["BikeStation", 3, 4]])), 40);
});

test("metro menjangkau dua petak searah baris dan kolom, tidak tiga", () => {
  assert.equal(of(L([["Metro", 2, 2], ["OneCafe", 4, 2]]), "OneCafe").traffic, 15);
  assert.equal(of(L([["Metro", 2, 2], ["OneCafe", 5, 2]]), "OneCafe").traffic, 0);
  assert.equal(of(L([["Metro", 2, 2], ["OneCafe", 4, 4]]), "OneCafe").traffic, 0);
});

test("gacha berulang tiap 15 pengunjung dan arkade menambah satu hitungan", () => {
  assert.equal(score(L([["Gacha", 4, 2], ["Metro", 2, 2]])), 15);
  const l = L([["Gacha", 4, 2], ["Metro", 2, 2], ["Arcade", 5, 2]]);
  assert.equal(of(l, "Gacha").settles, 2);
  assert.equal(of(l, "Gacha").score, 30);
});

test("taman hiburan: hitungan berikutnya bertambah 3 poin", () => {
  assert.equal(of(L([["ThemePark", 3, 3]]), "ThemePark", { baseTraffic: 60 }).score, 20 + 23 + 26);
});

test("aura konversi tidak menumpuk", () => {
  const l = L([["OneCafe", 4, 4], ["GreenHall", 3, 3], ["GreenHall", 5, 3], ["BikeStation", 4, 5]]);
  assert.equal(of(l, "OneCafe").conv, 1.6);
  assert.equal(of(l, "OneCafe").score, 16);
});

test("aura kapasitas hanya berlaku untuk tetangga sisi, bukan diagonal", () => {
  assert.equal(of(L([["OneCafe", 3, 3], ["RainGarden", 4, 3]]), "OneCafe").cap, 60);
  assert.equal(of(L([["OneCafe", 3, 3], ["RainGarden", 4, 4]]), "OneCafe").cap, 20);
});

test("kelebihan pengunjung dipindah ke tetangga yang belum penuh", () => {
  const r = E.evaluate(L([["LittleGreen", 3, 3], ["LuxuryHall", 4, 3]]), { baseTraffic: 15 });
  assert.deepEqual(r.items.map((i) => i.traffic), [5, 25]);
  assert.equal(r.total, 30);
});

test("pembatasan: pajak, kelebihan kapasitas, ring luar, dan sesama tema", () => {
  const two = [["OneCafe", 3, 3], ["OneCafe", 4, 3], ["BikeStation", 3, 4]];
  assert.equal(score(L(two, { limits: ["tax"] })), 30);
  assert.ok(Math.abs(score(L(two, { limits: ["innerRoll"] })) - 36.8) < 1e-6);
  assert.equal(score(L([["OneCafe", 2, 2], ["BikeStation", 3, 3]], { limits: ["outerDecay"] })), 5);
  assert.equal(score(L([["LittleGreen", 3, 3]], { limits: ["jamZero"] }), { baseTraffic: 15 }), 0);
});

test("petak nilai tinggi menambah pengunjung dan konversi per petak yang ditutupi", () => {
  const it = of(L([["OneCafe", 3, 3]], { plots: { "3,3": "high" } }), "OneCafe");
  assert.equal(it.traffic, 15);
  assert.ok(Math.abs(it.score - 15 * 1.15) < 1e-9);
});

test("monumen menambah 25% dari skor tetangganya", () => {
  assert.equal(score(L([["OneCafe", 3, 3], ["BikeStation", 3, 4]], { plots: { "2,3": "monument" } })), 12.5);
});

test("ruang dispatch hanya aktif bila kedua ujung sudah diberi transportasi", () => {
  // dispatch tegak di (4,3)-(4,4); ujungnya (4,2) dan (4,5)
  const on = L([["CommuHouse", 4, 3], ["OneCafe", 4, 2], ["OneCafe", 4, 5], ["BikeStation", 3, 2], ["BikeStation", 3, 5]]);
  assert.equal(E.evaluate(on).items.filter((i) => i.id === "OneCafe").every((i) => i.conv === 1.5 && i.traffic === 60), true);
  const off = L([["CommuHouse", 4, 3], ["OneCafe", 4, 2], ["OneCafe", 4, 5], ["BikeStation", 3, 2]]);
  assert.equal(E.evaluate(off).items.filter((i) => i.id === "OneCafe").every((i) => i.conv === 1), true);
});

test("canPlace menolak tumpang tindih, keluar papan, dan petak sungai", () => {
  const base = L([["OneCafe", 3, 3]], { plots: { "5,5": "river" } });
  assert.equal(E.canPlace(base, { id: "OneCafe", x: 3, y: 3, rot: 0 }), false);
  assert.equal(E.canPlace(base, { id: "Mcdonald", x: 6, y: 6, rot: 0 }), false);
  assert.equal(E.canPlace(base, { id: "OneCafe", x: 5, y: 5, rot: 0 }), false);
  assert.equal(E.canPlace(base, { id: "Mcdonald", x: 4, y: 3, rot: 1 }), true);
  assert.equal(E.canPlace({ ...base, extras: [[7, 3]] }, { id: "OneCafe", x: 7, y: 3, rot: 0 }), true);
});

test("pengali manual mengalikan total dan item tidak sah diabaikan", () => {
  assert.equal(score(L([["OneCafe", 3, 3], ["BikeStation", 4, 4], ["OneCafe", 0, 0]]), { mult: 2.5 }), 25);
});

test("sanitize: data impor dari pengguna dibersihkan", () => {
  const s = E.sanitize({
    layout: { core: 99, extras: [[1, 1], [50, 1], "x", [1, 1]], plots: { "3,3": "high", "99,0": "high", "4,4": "lava" }, limits: ["tax", "aneh", "tax"],
      items: [{ id: "OneCafe", x: 3, y: 3, rot: 5 }, { id: "<img>", x: 1, y: 1 }, { id: "Metro", x: 2.5, y: 1 }, null] },
    inventory: { OneCafe: 99, Bread: -1, hack: 3 }, mult: "7",
  });
  assert.equal(s.layout.core, 7);
  assert.deepEqual(s.layout.extras, [[1, 1]]);
  assert.deepEqual(s.layout.plots, { "3,3": "high" });
  assert.deepEqual(s.layout.limits, ["tax"]);
  assert.deepEqual(s.layout.items, [{ id: "OneCafe", x: 3, y: 3, rot: 1 }]);
  assert.deepEqual(s.inventory, { OneCafe: 12 });
  assert.equal(s.mult, 1);
});

test("sanitize: masukan kosong atau rusak menjadi papan bawaan", () => {
  for (const raw of [null, 5, "x", {}]) assert.deepEqual(E.sanitize(raw), { layout: { core: 5, extras: [], plots: {}, limits: [], items: [] }, inventory: {}, mult: 1 });
});
