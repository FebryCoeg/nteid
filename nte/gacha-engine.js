/* Mesin simulator gacha papan dadu (tanpa DOM). Dipakai halaman /gacha dan `node --test`.
 * Semua angka berasal dari nte/data/gacha-rules.json (layar aturan resmi di game). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GachaEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // RNG deterministik (mulberry32): angka acak di [0, 1)
  function createRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newState() {
    return { total: 0, sinceS: 0, mode: "baseline", pos: 0, dice: 0, obtained: {}, sCount: 0 };
  }

  // 89 roll tanpa S-Class: roll berikutnya (ke-90) dipaksa S-Class featured
  function isForcedS(state, rules) {
    return state.sinceS >= rules.s.hardPity - 1;
  }

  function pick(list, rng, fallback) {
    const arr = list && list.length ? list : [fallback];
    return arr[Math.floor(rng() * arr.length)];
  }

  // Hadiah satu roll. Peluang S-Class mengikuti keadaan papan (Baseline/Modified) dan pity;
  // hadiah selain S ditentukan jenis kotak tempat bidak mendarat.
  function decideReward(state, tile, rules, rng) {
    const pool = rules.pool || {};
    if (isForcedS(state, rules)) return { kind: "S", id: pool.featuredS, forced: true };
    const rate = state.mode === "modified" ? rules.s.modifiedRate : rules.s.baseRate;
    if (rng() < rate) return { kind: "S", id: pool.featuredS };
    switch (tile.type) {
      case "apprentice":
        return { kind: "B_ARC", id: pick(pool.bArcs, rng, "b-arc") };
      case "hero":
        return { kind: "B_ARC", id: pick(pool.bArcs, rng, "b-arc"), warp: rules.tileContent.hero.warp };
      case "lost":
        return { kind: "LOST", lost: tile.amount ?? 30 };
      case "journeyA":
      case "journeyS": // S tanpa peristiwa S tidak seharusnya terjadi; diperlakukan sebagai karakter A
        return { kind: "A_CHAR", id: pick(pool.aChars, rng, "a-char") };
      case "arclight":
        return { kind: "A_ARC", id: pick(pool.aArcs, rng, "a-arc") };
      case "fashion":
        return { kind: "GLIDER" };
      case "outfit":
        return { kind: "OUTFIT" };
      case "livery":
        return { kind: "LIVERY" };
      case "roll1":
        return { kind: "DICE", dice: tile.amount ?? 1 };
      case "roll5":
        return { kind: "DICE", dice: tile.amount ?? 5 };
      default:
        return { kind: "NONE" };
    }
  }

  // Konversi duplikat dan bonus per jenis hadiah; mengubah `st.obtained`.
  function finalize(st, reward, rules) {
    const r = { ...reward };
    const d = rules.dup;
    if (r.kind === "S" || r.kind === "A_CHAR") {
      const n = (st.obtained[r.id] || 0) + 1;
      st.obtained[r.id] = n;
      if (n >= 2) {
        r.dup = n - 1;
        const s = r.kind === "S";
        if (n >= d.lateFrom) r.warp = s ? d.sWarpLate : d.aWarpLate;
        else {
          r.mindShard = s ? d.sMindShard : d.aMindShard;
          r.warp = s ? d.sWarp : d.aWarp;
        }
      }
    } else if (r.kind === "A_ARC") {
      r.warp = (r.warp || 0) + d.aArcBonusWarp;
    } else if (r.kind === "B_ARC") {
      r.lost = (r.lost || 0) + d.bArcBonusLost;
    }
    return r;
  }

  // Terapkan satu roll ke keadaan. Mengembalikan { state, reward, gift, skinBonus }.
  function applyRoll(state, reward, rules, rng) {
    const st = { ...state, obtained: { ...state.obtained } };
    st.total += 1;
    if (reward.kind === "S") {
      st.sinceS = 0;
      st.mode = "baseline";
      st.sCount += 1;
    } else {
      st.sinceS += 1;
      st.mode = st.sinceS >= rules.s.modifiedAfter ? "modified" : "baseline";
    }
    const out = finalize(st, reward, rules);
    if (out.kind === "DICE") st.dice += out.dice;

    let gift = null;
    if (st.total % rules.gift.every === 0) {
      const pool = rules.pool || {};
      const isChar = rng() < rules.gift.aChar;
      gift = finalize(st, isChar ? { kind: "A_CHAR", id: pick(pool.aChars, rng, "a-char") } : { kind: "A_ARC", id: pick(pool.aArcs, rng, "a-arc") }, rules);
    }
    const skinBonus = Object.entries(rules.skin)
      .filter(([, v]) => v.atRolls === st.total)
      .map(([k]) => k);
    return { state: st, reward: out, gift, skinBonus };
  }

  return { createRng, newState, isForcedS, decideReward, applyRoll };
});
