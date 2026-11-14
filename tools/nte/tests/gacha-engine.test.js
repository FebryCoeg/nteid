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
