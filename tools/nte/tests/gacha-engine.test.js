const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "gacha-rules.json"), "utf8"));

test("aturan resmi konsisten", () => {
  // jumlah peluang mendarat (tanpa Slumberland, yang tumpang di atas kotak lain) = 100%
  const sum = Object.entries(rules.landing).filter(([k]) => k !== "slumber").reduce((a, [, v]) => a + v, 0) * 100;
  assert.ok(Math.abs(sum - 99.96) < 0.1, `jumlah landing ${sum}`);

  // rata-rata S per roll: E = sum_{k=1..90} P(belum S sebelum roll k)
  const { baseRate, modifiedRate, modifiedAfter, hardPity } = rules.s;
  let surv = 1, E = 0;
  for (let k = 1; k <= hardPity; k++) {
    E += surv;
    surv *= 1 - (k <= modifiedAfter ? baseRate : modifiedRate);
  }
  assert.ok(Math.abs((1 / E) * 100 - 1.87) < 0.02, `rata-rata S ${(1 / E) * 100}`);

  // peluang Arc B dari isi kotak = 65.33%
  const b = (rules.landing.apprentice * rules.tileContent.apprentice.bArc + rules.landing.hero * rules.tileContent.hero.bArc) * 100;
  assert.ok(Math.abs(b - 65.33) < 0.1, `Arc B ${b}`);
});

// ---------------------------------------------------------------- Task 2: mesin hadiah dan pity
const E = require(path.join(ROOT, "nte", "gacha-engine.js"));
const R = { ...rules, pool: { ...rules.pool, aChars: ["a1", "a2", "a3"], aArcs: ["x1", "x2"], bArcs: ["b1", "b2"] } };
const NEVER = () => 0.999999; // rng yang tak pernah memicu peluang kecil
const TILE = { type: "apprentice" };

// satu roll penuh tanpa papan: pilih hadiah lalu terapkan
function playRoll(state, rng, tile = TILE) {
  const reward = E.decideReward(state, tile, R, rng);
  const out = E.applyRoll(state, reward, R, rng);
  return { reward, ...out };
}

test("rng deterministik dan dalam [0,1)", () => {
  const a = E.createRng(7), b = E.createRng(7);
  for (let i = 0; i < 100; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test("pity keras: roll ke-89 sudah terpaksa dan roll ke-90 pasti S", () => {
  let st = E.newState();
  for (let i = 0; i < 89; i++) {
    assert.equal(E.isForcedS(st, R), false);
    const r = playRoll(st, NEVER);
    assert.notEqual(r.reward.kind, "S");
    st = r.state;
  }
  assert.equal(st.sinceS, 89);
  assert.equal(E.isForcedS(st, R), true);
  const last = playRoll(st, NEVER);
  assert.equal(last.reward.kind, "S");
  assert.equal(last.state.total, 90);
  assert.equal(last.state.pos, st.pos);
});

test("Modified mulai roll ke-71 dan kembali Baseline setelah S", () => {
  let st = E.newState();
  for (let i = 0; i < 70; i++) st = playRoll(st, NEVER).state;
  assert.equal(st.mode, "modified");
  // S di roll ke-71 (rng 0 memicu peluang S)
  const hit = playRoll(st, () => 0);
  assert.equal(hit.reward.kind, "S");
  assert.equal(hit.state.mode, "baseline");
  assert.equal(hit.state.sinceS, 0);
  // S tepat di roll ke-70 tidak pernah masuk Modified
  let s2 = E.newState();
  for (let i = 0; i < 69; i++) s2 = playRoll(s2, NEVER).state;
  assert.equal(s2.mode, "baseline");
  const at70 = playRoll(s2, () => 0);
  assert.equal(at70.reward.kind, "S");
  assert.equal(at70.state.mode, "baseline");
});

test("rata-rata S per roll sekitar 1.87% dan siklus sekitar 53.3 roll", () => {
  const rng = E.createRng(2026);
  let st = E.newState(), s = 0, N = 200000;
  for (let i = 0; i < N; i++) {
    const r = playRoll(st, rng);
    if (r.reward.kind === "S") s++;
    st = r.state;
  }
  const rate = (s / N) * 100;
  assert.ok(Math.abs(rate - 1.87) < 0.1, `rate ${rate}`);
  assert.ok(Math.abs(N / s - 53.3) < 1.5, `siklus ${N / s}`);
});

test("Points Gift tiap 10 roll: 20% karakter A, 80% Arc A", () => {
  const rng = E.createRng(5);
  let st = E.newState(), gifts = 0, chars = 0;
  for (let i = 0; i < 200000; i++) {
    const r = playRoll(st, rng);
    st = r.state;
    assert.equal(r.gift !== null, st.total % 10 === 0);
    if (r.gift) {
      gifts++;
      if (r.gift.kind === "A_CHAR") chars++;
    }
  }
  assert.equal(gifts, 20000);
  assert.ok(Math.abs(chars / gifts - 0.2) < 0.01);
});

test("duplikat S: ke-2 sampai ke-7 = 1 Mind Shard + 40 Warp, ke-8 = 80 Warp", () => {
  let st = E.newState();
  const seen = [];
  for (let i = 0; i < 8; i++) {
    const r = E.applyRoll(st, { kind: "S", id: "elyms" }, R, NEVER);
    st = r.state;
    seen.push(r.reward);
  }
  assert.equal(seen[0].dup, undefined);
  for (let i = 1; i <= 6; i++) assert.deepEqual([seen[i].mindShard, seen[i].warp], [1, 40]);
  assert.deepEqual([seen[7].mindShard, seen[7].warp], [undefined, 80]);
});

test("duplikat A: ke-2 sampai ke-7 = 1 Mind Shard + 6 Warp, ke-8 = 12 Warp", () => {
  let st = E.newState();
  const seen = [];
  for (let i = 0; i < 8; i++) {
    const r = E.applyRoll(st, { kind: "A_CHAR", id: "a1" }, R, NEVER);
    st = r.state;
    seen.push(r.reward);
  }
  for (let i = 1; i <= 6; i++) assert.deepEqual([seen[i].mindShard, seen[i].warp], [1, 6]);
  assert.deepEqual([seen[7].mindShard, seen[7].warp], [undefined, 12]);
});

test("bonus Arc: A = 4 Warp, B = 20 Lost Pieces", () => {
  const a = E.applyRoll(E.newState(), { kind: "A_ARC", id: "x1" }, R, NEVER).reward;
  const b = E.applyRoll(E.newState(), { kind: "B_ARC", id: "b1" }, R, NEVER).reward;
  assert.equal(a.warp, 4);
  assert.equal(b.lost, 20);
});

test("bonus skin saat total roll 50, 120, 200", () => {
  let st = E.newState();
  const got = {};
  for (let i = 1; i <= 200; i++) {
    const r = E.applyRoll(st, { kind: "NONE" }, R, NEVER);
    st = r.state;
    if (r.skinBonus.length) got[i] = r.skinBonus;
  }
  assert.deepEqual(got, { 50: ["glider"], 120: ["livery"], 200: ["outfit"] });
});

test("Roll Again menambah dadu gratis dan total roll", () => {
  const r = E.applyRoll(E.newState(), { kind: "DICE", dice: 1 }, R, NEVER);
  assert.equal(r.state.dice, 1);
  assert.equal(r.state.total, 1);
});
