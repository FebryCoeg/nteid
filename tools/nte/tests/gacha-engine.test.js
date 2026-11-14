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

// ---------------------------------------------------------------- Task 3: data papan
const board = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "gacha-board.json"), "utf8"));

test("papan: id valid, rute tanpa duplikat, panah berpasangan", () => {
  const ids = new Set(board.tiles.map((t) => t.id));
  assert.equal(ids.size, board.tiles.length, "id kotak ganda");
  for (const id of board.route) assert.ok(ids.has(id), `id rute ${id} tak ada`);
  assert.equal(new Set(board.route).size, board.route.length, "rute berisi id ganda");
  for (const b of board.blocks) {
    assert.ok(ids.has(b.enter) && ids.has(b.exit), "panah blok tak ada");
    for (const id of b.tiles) assert.ok(ids.has(id), `id blok ${id} tak ada`);
    assert.ok(board.route.includes(b.enter) && board.route.includes(b.exit), "panah harus ada di rute utama");
  }
  const types = Object.fromEntries(board.tiles.map((t) => [t.id, t.type]));
  assert.equal(board.blocks.filter((b) => types[b.enter] === "arrowIn" && types[b.exit] === "arrowOut").length, board.blocks.length);
});

test("papan: komposisi kotak rute sebanding dengan peluang mendarat resmi", () => {
  const route = board.route.map((id) => board.tiles.find((t) => t.id === id));
  const share = (type) => (route.filter((t) => t.type === type).length / route.length) * 100;
  assert.ok(Math.abs(share("apprentice") - 45.93) < 8, `apprentice ${share("apprentice")}`);
  assert.ok(Math.abs(share("hero") - 20.07) < 8, `hero ${share("hero")}`);
  assert.ok(Math.abs(share("lost") - 15.47) < 8, `lost ${share("lost")}`);
});

// ---------------------------------------------------------------- Task 4: gerak di papan
// papan kecil: rute 0..7, panah masuk di 3, panah keluar di 5, blok berisi 8,9,10
function mkBoard(types, blocks = [], extra = []) {
  const tiles = types.map((type, id) => ({ id, x: id * 10, y: 0, type }));
  for (const e of extra) tiles.push({ id: tiles.length, x: 0, y: 50, type: e });
  return { tiles, route: types.map((_, i) => i), blocks, start: 0 };
}
const B1 = mkBoard(["lost", "lost", "lost", "arrowIn", "lost", "arrowOut", "lost", "lost"],
  [{ side: "right", enter: 3, exit: 5, tiles: [8, 9, 10] }], ["hero", "hero", "hero"]);
// urutan nilai acak yang diulang
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

test("moveToken: langkah biasa dan melingkar di ujung rute", () => {
  assert.deepEqual(E.moveToken(B1, 0, 2, "enterFirst"), { path: [1, 2], landed: 2 });
  assert.deepEqual(E.moveToken(B1, 6, 3, "enterFirst"), { path: [7, 0, 1], landed: 1 });
});

test("moveToken: mendarat tepat di panah masuk (aturan enterFirst) berhenti di kotak pertama blok", () => {
  assert.deepEqual(E.moveToken(B1, 0, 3, "enterFirst"), { path: [1, 2, 3, 8], landed: 8 });
});

test("moveToken: aturan traverse melewati seluruh blok dan berhenti di panah keluar", () => {
  assert.deepEqual(E.moveToken(B1, 0, 3, "traverse"), { path: [1, 2, 3, 8, 9, 10, 5], landed: 5 });
});

test("moveToken: hanya melewati panah masuk tidak masuk blok", () => {
  assert.deepEqual(E.moveToken(B1, 2, 3, "enterFirst"), { path: [3, 4, 5], landed: 5 });
});

test("moveToken: dari dalam blok lanjut ke kotak berikutnya, keluar lewat panah keluar, kembali ke rute", () => {
  assert.deepEqual(E.moveToken(B1, 9, 2, "enterFirst"), { path: [10, 5], landed: 5 });
  assert.deepEqual(E.moveToken(B1, 9, 3, "enterFirst"), { path: [10, 5, 6], landed: 6 });
});

test("roll paksa pity: bidak tidak bergerak dan hasilnya S", () => {
  const st = { ...E.newState(), sinceS: 89, total: 89, pos: 4 };
  const r = E.roll(st, B1, R, NEVER, { blockRule: "enterFirst" });
  assert.equal(r.die, null);
  assert.deepEqual(r.path, []);
  assert.equal(r.landed, 4);
  assert.equal(r.reward.kind, "S");
  assert.equal(r.forced, true);
  assert.equal(r.state.pos, 4);
  assert.equal(r.state.sinceS, 0);
});

test("roll biasa: bidak berpindah sesuai dadu dan total roll naik", () => {
  const B = mkBoard(["lost", "lost", "lost", "lost", "lost", "lost", "lost", "lost"]);
  const r = E.roll(E.newState(), B, R, seq([0.9, 0.0]), { blockRule: "enterFirst" });
  assert.equal(r.die, 1);
  assert.equal(r.state.pos, 1);
  assert.equal(r.state.total, 1);
  assert.equal(r.n, 1);
});

test("Multiple Surprises: 5 dadu gratis dijalankan langsung dan ikut menambah total roll", () => {
  const B = mkBoard(["lost", "roll5", "lost", "lost", "lost", "lost", "lost", "lost"]);
  const r = E.roll(E.newState(), B, R, seq([0.9, 0.0]), { blockRule: "enterFirst" });
  assert.equal(r.reward.kind, "DICE");
  assert.equal(r.extra.length, 5);
  assert.equal(r.state.total, 6);
  assert.equal(r.state.dice, 0);
});

test("dadu gratis beruntun dibatasi 50 supaya tidak berputar tanpa akhir", () => {
  const B = mkBoard(Array(8).fill("roll5"));
  const r = E.roll(E.newState(), B, R, seq([0.9, 0.0]), { blockRule: "enterFirst" });
  assert.equal(r.extra.length, 50);
  assert.ok(r.state.total <= 51);
});

test("peristiwa S mengarahkan bidak ke kotak yang bisa memberi S bila ada dalam 6 langkah", () => {
  // kotak 1..6: hanya kotak 4 berupa chest; peluang S dipaksa (rng 0 memicu S)
  const B = mkBoard(["lost", "lost", "lost", "lost", "hero", "lost", "lost", "lost"]);
  const r = E.roll(E.newState(), B, R, () => 0, { blockRule: "enterFirst" });
  assert.equal(r.reward.kind, "S");
  assert.equal(r.landed, 4);
  assert.equal(r.die, 4);
});

test("tanpa S, bidak tidak pernah berhenti di kotak Journey Together S", () => {
  const B = mkBoard(["lost", "lost", "journeyS", "lost", "lost", "lost", "lost", "lost"]);
  for (let s = 0; s < 200; s++) {
    const r = E.roll(E.newState(), B, R, E.createRng(s), { blockRule: "enterFirst" });
    if (r.reward.kind !== "S") assert.notEqual(r.landed, 2);
  }
});
