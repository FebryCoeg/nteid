const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const R = path.join(__dirname, "../../..");
const J = (n) => JSON.parse(fs.readFileSync(path.join(R, "nte/data", n + ".json"), "utf8"));
const arcs = new Set(J("arcs").map((a) => a.slug));
const sets = new Set(J("modules").sets.map((s) => s.id));
const espers = new Set(J("espers").map((e) => e.slug));

for (const file of ["builds_draft", "builds_curated"]) {
  const b = J(file).exe;
  test(`${file}: build Exe dari video merujuk data yang ada`, () => {
    assert.deepEqual(b.arcs, ["dotted-horizon", "ready-ready", "fluff-of-fortitude", "raging-flames"]);
    b.arcs.forEach((a) => assert.ok(arcs.has(a), a));
    assert.deepEqual(Object.keys(b.arcPct).sort(), [...b.arcs].sort());
    assert.deepEqual(b.arcPct["dotted-horizon"], { m1: 100, m5: 126 });
    b.sets.forEach((s) => assert.ok(sets.has(s.id), s.id));
    assert.equal(b.sets[0].id, "Suit1");
    b.teams.forEach((t) => t.members.forEach((m) => assert.ok(espers.has(m), m)));
    assert.deepEqual(b.teams[0].members, ["exe", "blackbird", "iroi", "sakiri"]);
    assert.deepEqual(b.skills, ["basic", "redirect", "ultimate", "support"]);
  });
  test(`${file}: urutan Awakening mengikuti peningkatan DPS`, () => {
    assert.deepEqual(b.awks, [4, 3, 1, 2, 5, 6]);
    assert.deepEqual(b.awkGain, { 1: 11.4, 2: 10.9, 3: 13.8, 4: 24, 5: 10 });
    const gains = b.awks.slice(0, 5).map((n) => b.awkGain[n]);
    assert.deepEqual(gains, [...gains].sort((x, y) => y - x));
    assert.equal(Object.keys(b.awkDesc).length, 6);
  });
  test(`${file}: status minimum lengkap`, () => {
    assert.deepEqual(b.minStats.map((s) => s.stat), ["ATK", "CRIT Rate", "CRIT DMG", "Universal DMG"]);
    b.minStats.forEach((s) => { assert.ok(s.min && s.ideal, s.stat); });
  });
}

test("halaman Esper tidak lagi menahan build Exe", () => {
  assert.doesNotMatch(fs.readFileSync(path.join(R, "nte/app.js"), "utf8"), /Exe belum rilis/);
});

for (const file of ["builds_draft", "builds_curated"]) {
  test(`${file}: build Exe menautkan video pemilik situs`, () => {
    assert.equal(J(file).exe.video.url, "https://www.youtube.com/watch?v=fqjASSLXS6c");
  });
}

test("tab Build menampilkan tautan video di tab baru", () => {
  const app = fs.readFileSync(path.join(R, "nte/app.js"), "utf8");
  assert.match(app, /class="bd-video"[^`]*target="_blank" rel="noopener"/);
});
