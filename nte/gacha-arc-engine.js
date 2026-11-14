/* Mesin gacha Arc (Arc Research Program / Miracle Box), tanpa DOM.
 * Satu Pull = satu kotak berisi 10 Arc. Angka dari nte/data/gacha-arc.json (layar aturan resmi di game).
 * Pity: tiap kotak minimal 1 Arc A ke atas; S dijamin dalam 6 kotak; Arc UP dijamin dalam 8 kotak. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GachaArcEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function newArcState() {
    return { boxes: 0, sinceS: 0, sinceUp: 0, sCount: 0, upCount: 0 };
  }

  const isS = (x) => x === "S" || x === "U";

  // pilih satu posisi acak yang memenuhi `ok`; kalau tak ada, posisi acak mana pun yang bukan S
  function pickSlot(arcs, ok, rng) {
    let idx = [];
    arcs.forEach((a, i) => { if (ok(a)) idx.push(i); });
    if (!idx.length) arcs.forEach((a, i) => { if (!isS(a)) idx.push(i); });
    if (!idx.length) idx = arcs.map((_, i) => i);
    return idx[Math.floor(rng() * idx.length)];
  }

  // Buka satu kotak. Mengembalikan { state, arcs, forced }.
  // arcs[i] = { rarity: "S"|"A"|"B", up: boolean, idx: indeks di banner.pools[rarity], bonus }.
  function openBox(state, rules, banner, rng) {
    const raw = [];
    for (let k = 0; k < rules.perBox; k++) {
      const r = rng();
      if (r < rules.s.base) raw.push(rng() < rules.s.upShare ? "U" : "S");
      else if (r < rules.s.base + rules.a.base) raw.push("A");
      else raw.push(rng() < rules.a.extra ? "A" : "B"); // a.extra = kalibrasi ke angka resmi (perkiraan)
    }
    const forced = { s: false, up: false, a: false };
    const sinceS = state.sinceS + 1, sinceUp = state.sinceUp + 1; // hitungan kotak ini ikut dihitung
    if (sinceUp >= rules.up.pityBoxes && !raw.includes("U")) {
      raw[pickSlot(raw, (a) => a === "B" || a === "A", rng)] = "U";
      forced.up = true;
    } else if (sinceS >= rules.s.pityBoxes && !raw.some(isS)) {
      raw[pickSlot(raw, (a) => a === "B" || a === "A", rng)] = "S";
      forced.s = true;
    }
    if (!raw.some((a) => isS(a) || a === "A")) {
      raw[pickSlot(raw, (a) => a === "B", rng)] = "A";
      forced.a = true;
    }

    const upIdx = banner.pools.S.findIndex((e) => e.up);
    const otherS = banner.pools.S.map((e, i) => i).filter((i) => i !== upIdx);
    const arcs = raw.map((x) => {
      const rarity = isS(x) ? "S" : x;
      const up = x === "U";
      const pool = banner.pools[rarity];
      const idx = up ? upIdx : rarity === "S" ? otherS[Math.floor(rng() * otherS.length)] : Math.floor(rng() * pool.length);
      const arc = { rarity, up, idx, bonus: { ...rules.bonus[rarity] } };
      if (rarity === "S") {
        // pity saat didapat: jumlah Pull sejak S terakhir (dan sejak Arc UP terakhir), termasuk kotak ini
        arc.pity = sinceS;
        arc.upPity = sinceUp;
        arc.hard = up ? forced.up : forced.s;
      }
      return arc;
    });

    const st = { ...state };
    st.boxes += 1;
    st.sinceS = raw.some(isS) ? 0 : sinceS;
    st.sinceUp = raw.includes("U") ? 0 : sinceUp;
    st.sCount += raw.filter(isS).length;
    st.upCount += raw.filter((a) => a === "U").length;
    return { state: st, arcs, forced };
  }

  // Pulihkan keadaan tersimpan; data apa pun yang tidak masuk akal -> keadaan awal.
  function restoreArcState(raw, rules) {
    const fresh = newArcState();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fresh;
    const int = (v, max) => Number.isInteger(v) && v >= 0 && v <= max;
    const ok = int(raw.boxes, 1e7) && int(raw.sinceS, rules.s.pityBoxes - 1) && int(raw.sinceUp, rules.up.pityBoxes - 1)
      && int(raw.sCount, 1e8) && int(raw.upCount, 1e8);
    return ok ? { boxes: raw.boxes, sinceS: raw.sinceS, sinceUp: raw.sinceUp, sCount: raw.sCount, upCount: raw.upCount } : fresh;
  }

  return { newArcState, openBox, restoreArcState };
});
