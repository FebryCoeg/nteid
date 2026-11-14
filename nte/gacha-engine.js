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
  function sRate(state, rules) {
    return state.mode === "modified" ? rules.s.modifiedRate : rules.s.baseRate;
  }

  // `sEvent` (opsional): hasil undian S yang sudah diambil pemanggil (roll() memakainya untuk mengarahkan bidak).
  function decideReward(state, tile, rules, rng, sEvent) {
    const pool = rules.pool || {};
    if (isForcedS(state, rules)) return { kind: "S", id: pool.featuredS, forced: true };
    const hit = sEvent === undefined ? rng() < sRate(state, rules) : sEvent;
    if (hit) return { kind: "S", id: pool.featuredS };
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

  // ---------------------------------------------------------------- gerak di papan
  const S_CAPABLE = { journeyS: 1, hero: 1, apprentice: 1 };

  function index(board) {
    if (board._ix) return board._ix;
    const byId = {}, routeAt = {}, inBlock = {}, blockEnter = {};
    for (const t of board.tiles) byId[t.id] = t;
    board.route.forEach((id, i) => { routeAt[id] = i; });
    board.blocks.forEach((b, bi) => {
      blockEnter[b.enter] = b;
      b.tiles.forEach((id, i) => { inBlock[id] = { block: b, i }; });
    });
    Object.defineProperty(board, "_ix", { value: { byId, routeAt, inBlock, blockEnter }, enumerable: false });
    return board._ix;
  }

  function nextTile(board, id) {
    const ix = index(board);
    const ib = ix.inBlock[id];
    if (ib) return ib.i + 1 < ib.block.tiles.length ? ib.block.tiles[ib.i + 1] : ib.block.exit;
    return board.route[(ix.routeAt[id] + 1) % board.route.length];
  }

  // Bidak berjalan `die` langkah searah rute. Hanya mendarat TEPAT di panah masuk yang memasukkan bidak ke blok:
  //  - "enterFirst": bidak berhenti di kotak pertama blok; roll berikutnya lanjut di dalam blok sampai keluar lewat panah keluar.
  //  - "traverse": bidak melewati seluruh blok dan berhenti di panah keluar.
  function moveToken(board, pos, die, rule) {
    const ix = index(board);
    const path = [];
    let cur = pos;
    for (let i = 0; i < die; i++) {
      cur = nextTile(board, cur);
      path.push(cur);
    }
    const blk = ix.blockEnter[cur];
    if (blk && ix.routeAt[cur] !== undefined) {
      if (rule === "traverse") {
        path.push(...blk.tiles, blk.exit);
        cur = blk.exit;
      } else {
        path.push(blk.tiles[0]);
        cur = blk.tiles[0];
      }
    }
    return { path, landed: cur };
  }

  // Satu roll (satu dadu). Peristiwa S ditentukan lebih dulu; dadu dipilih di antara 1..6 yang mendaratkan bidak
  // di kotak yang masuk akal untuk hasilnya (S: chest atau Journey S; bukan S: bukan Journey S).
  function rollOnce(state, board, rules, rng, rule, ix) {
    const forced = isForcedS(state, rules);
    let die = null, path = [], landed = state.pos, sEvent;
    if (!forced) {
      sEvent = rng() < sRate(state, rules);
      const opts = [1, 2, 3, 4, 5, 6].map((d) => ({ d, m: moveToken(board, state.pos, d, rule) }));
      let cands = opts.filter((o) => {
        const type = ix.byId[o.m.landed].type;
        return sEvent ? S_CAPABLE[type] : type !== "journeyS";
      });
      if (!cands.length) cands = opts;
      const o = cands[Math.floor(rng() * cands.length)];
      die = o.d; path = o.m.path; landed = o.m.landed;
    }
    const tile = ix.byId[landed];
    const reward = decideReward(state, tile, rules, rng, sEvent);
    const out = applyRoll({ ...state, pos: landed }, reward, rules, rng);
    return { n: out.state.total, die, path, landed, reward: out.reward, gift: out.gift, skinBonus: out.skinBonus,
      forced, modeAfter: out.state.mode, extra: [], state: out.state };
  }

  const MAX_FREE_CHAIN = 50;

  // Roll lengkap: satu dadu berbayar, lalu semua dadu gratis yang muncul dijalankan langsung (maks. 50 beruntun).
  function roll(state, board, rules, rng, opts) {
    const rule = (opts && opts.blockRule) || board.blockRule || "enterFirst";
    const ix = index(board);
    const first = rollOnce(state, board, rules, rng, rule, ix);
    let st = first.state;
    const extra = [];
    while (st.dice > 0 && extra.length < MAX_FREE_CHAIN) {
      st = { ...st, dice: st.dice - 1 };
      const r = rollOnce(st, board, rules, rng, rule, ix);
      extra.push(r);
      st = r.state;
    }
    return { ...first, extra, state: st };
  }

  return { createRng, newState, isForcedS, decideReward, applyRoll, moveToken, roll };
});
