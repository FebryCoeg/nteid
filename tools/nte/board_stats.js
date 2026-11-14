// Simulasi jalan di papan: persentase mendarat per jenis kotak untuk tiap aturan blok, dibandingkan angka resmi.
// Pemakaian: node tools/nte/board_stats.js [jumlah_roll]
const fs = require("fs");
const path = require("path");
const E = require("../../nte/gacha-engine.js");

const ROOT = path.resolve(__dirname, "..", "..");
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "gacha-rules.json"), "utf8"));
const board = JSON.parse(fs.readFileSync(path.join(ROOT, "nte", "data", "gacha-board.json"), "utf8"));

// peluang mendarat resmi (%), kunci = jenis kotak di papan
const OFFICIAL = {
  apprentice: 45.93, hero: 20.07, lost: 15.47, journeyS: 1.19, journeyA: 9.67, arclight: 3.31,
  fashion: 1.71, roll1: 1.57, roll5: 0.38, outfit: 0.33, livery: 0.33,
};

// Hasil: persentase mendarat per jenis (dari semua roll termasuk dadu gratis).
function landingStats(rule, n, seed = 1) {
  const byId = Object.fromEntries(board.tiles.map((t) => [t.id, t]));
  const rng = E.createRng(seed);
  const count = {};
  let rolls = 0;
  let st = E.newState();
  st.pos = board.start;
  while (rolls < n) {
    const r = E.roll(st, board, rules, rng, { blockRule: rule });
    st = r.state;
    for (const x of [r, ...r.extra]) {
      const type = byId[x.landed].type;
      count[type] = (count[type] || 0) + 1;
      rolls++;
    }
  }
  const pct = {};
  for (const k of Object.keys(count)) pct[k] = (count[k] / rolls) * 100;
  return pct;
}

function report(rule, n) {
  const pct = landingStats(rule, n);
  let sse = 0;
  console.log(`\naturan blok: ${rule}`);
  for (const k of Object.keys(OFFICIAL)) {
    const v = pct[k] || 0;
    sse += (v - OFFICIAL[k]) ** 2;
    console.log(`  ${k.padEnd(11)} resmi ${OFFICIAL[k].toFixed(2).padStart(6)}  simulasi ${v.toFixed(2).padStart(6)}  selisih ${(v - OFFICIAL[k]).toFixed(2).padStart(6)}`);
  }
  for (const k of ["arrowIn", "arrowOut", "start"]) if (pct[k]) console.log(`  ${k.padEnd(11)} (tak ada di angka resmi) ${pct[k].toFixed(2)}`);
  console.log(`  jumlah kuadrat selisih: ${sse.toFixed(2)}`);
  return sse;
}

if (require.main === module) {
  const n = Number(process.argv[2]) || 400000;
  for (const rule of ["enterFirst", "traverse"]) report(rule, n);
}
module.exports = { landingStats, OFFICIAL };
