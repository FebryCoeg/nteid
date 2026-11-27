const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../awaken_overrides.json");
const ID = require("../../../nte/data/espers.json");
const EN = require("../../../nte/data/en/espers.json");

for (const [lang, data] of [["id", ID], ["en", EN]]) {
  test(`awakening (${lang}): teks dari layar game dipakai di data situs`, () => {
    for (const [slug, rows] of Object.entries(O)) {
      if (slug.startsWith("_")) continue;
      const e = data.find((x) => x.slug === slug);
      for (const [n, t] of Object.entries(rows)) assert.equal(e.awakening[+n - 1].desc, t[lang], `${slug} ${n}`);
    }
  });
}

test("awakening: terjemahan ID dan EN memuat angka yang sama", () => {
  const nums = (s) => (s.match(/<b>[^<]*<\/b>/g) || []).map((x) => x.replace(",", "."));
  for (const [slug, rows] of Object.entries(O)) {
    if (slug.startsWith("_")) continue;
    for (const [n, t] of Object.entries(rows)) assert.deepEqual(nums(t.id), nums(t.en), `${slug} ${n}`);
  }
});
