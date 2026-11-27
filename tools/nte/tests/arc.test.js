const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../arc_overrides.json");
const ID = require("../../../nte/data/arcs.json");
const EN = require("../../../nte/data/en/arcs.json");

for (const [lang, data] of [["id", ID], ["en", EN]]) {
  test(`arc (${lang}): efek dari layar game dipakai di data situs`, () => {
    for (const [slug, o] of Object.entries(O)) {
      if (slug.startsWith("_")) continue;
      const a = data.find((x) => x.slug === slug);
      assert.equal(a.effect.text, o[lang], slug);
      assert.deepEqual(a.effect.values, o.values, slug);
    }
  });
}

test("arc: tiap tingkat punya nilai untuk semua placeholder di kedua bahasa", () => {
  for (const [slug, o] of Object.entries(O)) {
    if (slug.startsWith("_")) continue;
    assert.equal(o.values.length, 5, slug);
    for (const text of [o.id, o.en]) {
      const need = Math.max(...[...text.matchAll(/\{(\d+)\}/g)].map((m) => +m[1])) + 1;
      for (const v of o.values) assert.equal(v.length, need, slug);
    }
  }
});
