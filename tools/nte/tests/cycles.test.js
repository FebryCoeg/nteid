const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../../../nte/cycles-logic.js");

const elyms = "<b>Charge Enhancement</b>: Setiap kali karakter aktif mendapat Ultimate Energy, <b>Cosmos DMG</b> naik.\n<b>Remora Enhancement</b>: Setiap kali rekan menerapkan Remora, Elyms ikut menerapkan.";

test("enhancement: mengambil bagian milik siklus yang diminta saja", () => {
  assert.equal(C.enhancement(elyms, "Charge"), "Setiap kali karakter aktif mendapat Ultimate Energy, <b>Cosmos DMG</b> naik.");
  assert.equal(C.enhancement(elyms, "Remora"), "Setiap kali rekan menerapkan Remora, Elyms ikut menerapkan.");
});

test("enhancement: satu penanda tanpa baris lain mengambil sampai akhir teks", () => {
  assert.equal(C.enhancement("<b>Remora Enhancement</b>: Menerapkan Remora tambahan.", "Remora"), "Menerapkan Remora tambahan.");
});

test("enhancement: tanpa penanda siklus itu hasilnya null", () => {
  assert.equal(C.enhancement(elyms, "Nova"), null);
  assert.equal(C.enhancement("", "Nova"), null);
  assert.equal(C.enhancement(null, "Nova"), null);
});

test("enhancement: nama siklus tidak dianggap pola regex", () => {
  assert.equal(C.enhancement("<b>Remora Enhancement</b>: x", ".*"), null);
});

test("durations: angka dari teks Cina game diambil berurutan", () => {
  assert.deepEqual(C.nums("触发后的<NumGreen>5</>秒内，提升<NumGreen>20%</>，<NumGreen>7.5</>"), ["5", "20%", "7.5"]);
  assert.deepEqual(C.nums("tanpa angka"), []);
});

test("fill: placeholder {n} diganti angka sesuai urutan, yang tak ada dibiarkan kosong", () => {
  assert.equal(C.fill("Selama {0} detik, naik {1}.", ["5", "20%"]), "Selama <b>5</b> detik, naik <b>20%</b>.");
  assert.equal(C.fill("Selama {0}, {1}.", ["5"]), "Selama <b>5</b>, .");
});
