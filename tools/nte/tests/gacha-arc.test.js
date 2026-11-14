const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "gacha-arc.json"), "utf8"));
const arcsData = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "arcs.json"), "utf8"));
const GE = require(path.join(ROOT, "nte", "gacha-engine.js"));
const AE = require(path.join(ROOT, "nte", "gacha-arc-engine.js"));
const rules = data.rules;
const banner = data.banners.find((b) => b.id === data.default);
const NEVER = () => 0.999999; // tak pernah memicu peluang S/A; semua Arc B

test("satu kotak selalu 10 Arc dan minimal satu A ke atas", () => {
  const rng = GE.createRng(11);
  let st = AE.newArcState();
  for (let i = 0; i < 5000; i++) {
    const r = AE.openBox(st, rules, banner, rng);
    st = r.state;
    assert.equal(r.arcs.length, 10);
    assert.ok(r.arcs.some((a) => a.rarity === "S" || a.rarity === "A"), "kotak tanpa A+");
    for (const a of r.arcs) assert.ok(["S", "A", "B"].includes(a.rarity) && Number.isInteger(a.idx));
  }
});

test("pity: kotak ke-6 pasti memuat S, kotak ke-8 pasti memuat Arc UP, lalu hitungan mulai ulang", () => {
  let st = AE.newArcState();
  const seen = [];
  for (let i = 1; i <= 8; i++) {
    const r = AE.openBox(st, rules, banner, NEVER);
    st = r.state;
    seen.push(r);
    if (i < 6) assert.ok(!r.arcs.some((a) => a.rarity === "S"), `kotak ${i} tak boleh S`);
  }
  assert.equal(seen[5].forced.s, true);
  assert.ok(seen[5].arcs.some((a) => a.rarity === "S" && !a.up));
  assert.equal(seen[6].arcs.some((a) => a.rarity === "S"), false);
  assert.equal(seen[7].forced.up, true);
  assert.ok(seen[7].arcs.some((a) => a.up));
  assert.equal(st.sinceUp, 0);
  assert.equal(st.sinceS, 0);
  assert.equal(st.boxes, 8);
});

test("jaminan A: kotak tanpa A+ mendapat satu A paksa", () => {
  const r = AE.openBox(AE.newArcState(), rules, banner, NEVER);
  assert.equal(r.forced.a, true);
  assert.equal(r.arcs.filter((a) => a.rarity === "A").length, 1);
});

test("peluang keseluruhan cocok angka resmi (S 4,19, A 13,47, UP 1,68 persen)", () => {
  const rng = GE.createRng(2026);
  let st = AE.newArcState(), S = 0, A = 0, B = 0, UP = 0, N = 150000;
  for (let i = 0; i < N; i++) {
    const r = AE.openBox(st, rules, banner, rng);
    st = r.state;
    for (const a of r.arcs) {
      if (a.rarity === "S") S++;
      else if (a.rarity === "A") A++;
      else B++;
      if (a.up) UP++;
    }
  }
  const n = N * 10, pct = (v) => (v / n) * 100;
  assert.ok(Math.abs(pct(S) - 4.19) < 0.15, `S ${pct(S)}`);
  assert.ok(Math.abs(pct(A) - 13.47) < 0.4, `A ${pct(A)}`);
  assert.ok(Math.abs(pct(B) - 82.34) < 0.5, `B ${pct(B)}`);
  assert.ok(Math.abs(pct(UP) - 1.68) < 0.12, `UP ${pct(UP)}`);
});

test("bonus per Arc: S 40 Warp, A 4 Warp, B 20 Lost Pieces", () => {
  const rng = GE.createRng(3);
  let st = AE.newArcState();
  const got = {};
  for (let i = 0; i < 400 && Object.keys(got).length < 3; i++) {
    const r = AE.openBox(st, rules, banner, rng);
    st = r.state;
    for (const a of r.arcs) got[a.rarity] = a.bonus;
  }
  assert.deepEqual(got.S, { warp: 40 });
  assert.deepEqual(got.A, { warp: 4 });
  assert.deepEqual(got.B, { lost: 20 });
});

test("restoreArcState: data rusak kembali ke awal, data wajar dipertahankan", () => {
  const fresh = AE.newArcState();
  const valid = { boxes: 12, sinceS: 3, sinceUp: 5, sCount: 2, upCount: 1 };
  assert.deepEqual(AE.restoreArcState(valid, rules), valid);
  for (const bad of [undefined, null, "x", 5, [], {}, { ...valid, boxes: "a" }, { ...valid, sinceS: -1 }, { ...valid, sinceS: 6 }, { ...valid, sinceUp: 8 }, { ...valid, boxes: 1.5 }]) {
    assert.deepEqual(AE.restoreArcState(bad, rules), fresh, JSON.stringify(bad));
  }
});

test("data Arc: Arc S sesuai daftar pemilik situs; Arc A dan B diambil dari database (bintang 4 dan 3)", () => {
  const bySlug = Object.fromEntries(arcsData.map((x) => [x.slug, x]));
  for (const b of data.banners) {
    const up = bySlug[b.featuredArc];
    assert.ok(up && up.rarity === 5, "featuredArc harus Arc bintang 5 di arcs.json");
    assert.equal(b.pools.S.length, 6);
    assert.equal(b.pools.S.filter((e) => e.up).length, 1);
    assert.equal(b.pools.S.find((e) => e.up).arc, b.featuredArc);
    assert.deepEqual(b.pools.S.map((e) => e.arc).sort(), ["camellia-society", "echoes-on-hold", "good-boy-s-grand-adventure", "raging-flames", "reality-refuge", "youthful-fantasy"]);
    for (const [k, rarity] of [["S", 5], ["A", 4], ["B", 3]]) {
      assert.ok(b.pools[k].length >= 1);
      for (const e of b.pools[k]) {
        assert.ok(e.arc && bySlug[e.arc], `Arc ${k} tak ada di database: ${e.arc}`);
        assert.equal(bySlug[e.arc].rarity, rarity, `${e.arc} bukan bintang ${rarity}`);
        assert.equal(e.type, bySlug[e.arc].type, `jenis ${e.arc}`);
      }
      assert.equal(new Set(b.pools[k].map((e) => e.arc)).size, b.pools[k].length, "Arc ganda di daftar " + k);
    }
    assert.equal(b.pools.B.length, arcsData.filter((x) => x.rarity === 3).length, "B = semua Arc bintang 3");
    assert.equal(b.pools.A.length, arcsData.filter((x) => x.rarity === 4).length, "A = semua Arc bintang 4");
    assert.match(b.accent, /^#[0-9a-fA-F]{6}$/);
  }
  assert.ok(data.banners.some((b) => b.id === data.default));
});

test("pity tercatat per Arc S: S pity di kotak ke-6 = hard pity, UP pity di kotak ke-8 = hard pity", () => {
  let st = AE.newArcState();
  const boxes = [];
  for (let i = 1; i <= 8; i++) { const r = AE.openBox(st, rules, banner, NEVER); st = r.state; boxes.push(r); }
  const s6 = boxes[5].arcs.find((a) => a.rarity === "S");
  assert.deepEqual([s6.pity, s6.hard], [6, true]);
  const up8 = boxes[7].arcs.find((a) => a.up);
  assert.deepEqual([up8.pity, up8.upPity, up8.hard], [2, 8, true]); // S terakhir di kotak ke-6 -> 2 kotak lalu UP
  // S alami di kotak pertama: pity 1, bukan hard
  const lucky = AE.openBox(AE.newArcState(), rules, banner, () => 0);
  const s1 = lucky.arcs.find((a) => a.rarity === "S");
  assert.deepEqual([s1.pity, s1.hard], [1, false]);
});
