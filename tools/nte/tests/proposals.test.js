const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../../../nte/proposals-logic.js");

const ctx = { espers: ["akane-rin", "blackbird", "lacrimosa", "zankou", "sakiri"] };
const ok = { name: "Tim Nova", members: ["akane-rin", "blackbird", "lacrimosa", "zankou"], roles: ["DPS", "", "Sub", "Support"], why: "Reaksi Nova stabil.", credit: { name: "Budi", url: "https://www.facebook.com/budi.santoso" } };

test("sanitizeTeam: tim valid dipertahankan", () => {
  const r = P.sanitizeTeam(ok, ctx, "akane-rin");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.team, ok);
});

test("sanitizeTeam: Esper halaman wajib ada di tim", () => {
  const r = P.sanitizeTeam({ ...ok, members: ["blackbird", "lacrimosa", "zankou"] }, ctx, "akane-rin");
  assert.ok(r.errors.length && r.team === null);
});

test("sanitizeTeam: anggota asing, ganda, atau jumlah salah ditolak", () => {
  for (const members of [["akane-rin"], ["akane-rin", "akane-rin"], ["akane-rin", "bukan-esper"], ["akane-rin", "blackbird", "lacrimosa", "zankou", "sakiri"]]) {
    const r = P.sanitizeTeam({ ...ok, members, roles: [] }, ctx, "akane-rin");
    assert.ok(r.errors.length, JSON.stringify(members));
  }
});

test("sanitizeTeam: nama kosong/terlalu panjang ditolak, teks dirapikan", () => {
  assert.ok(P.sanitizeTeam({ ...ok, name: "   " }, ctx, "akane-rin").errors.length);
  assert.ok(P.sanitizeTeam({ ...ok, name: "x".repeat(41) }, ctx, "akane-rin").errors.length);
  assert.ok(P.sanitizeTeam({ ...ok, credit: { name: "", url: "" } }, ctx, "akane-rin").errors.length);
  const r = P.sanitizeTeam({ ...ok, name: "  Tim\u0000  \n Nova  ", why: "a\nb" }, ctx, "akane-rin");
  assert.equal(r.team.name, "Tim Nova");
  assert.equal(r.team.why, "a b");
});

test("sanitizeTeam: role dan catatan dipotong, role disejajarkan dengan anggota", () => {
  const r = P.sanitizeTeam({ ...ok, roles: ["x".repeat(50)], why: "y".repeat(500) }, ctx, "akane-rin");
  assert.equal(r.team.roles.length, 4);
  assert.equal(r.team.roles[0].length, 24);
  assert.equal(r.team.why.length, 300);
});

test("sanitizeTeam: bukan objek tidak crash", () => {
  for (const bad of [null, undefined, 5, "x", []]) assert.ok(P.sanitizeTeam(bad, ctx, "akane-rin").errors.length);
});

test("sanitizeTeam: link Facebook opsional, tapi bila diisi harus valid", () => {
  const noLink = P.sanitizeTeam({ ...ok, credit: { name: "Budi", url: "" } }, ctx, "akane-rin");
  assert.deepEqual(noLink.errors, []);
  assert.equal(noLink.team.credit.url, "");
  const bad = P.sanitizeTeam({ ...ok, credit: { name: "Budi", url: "https://evil.com/x" } }, ctx, "akane-rin");
  assert.ok(bad.errors.length);
});

test("facebookUrl: host resmi diterima dan dinormalkan", () => {
  assert.equal(P.facebookUrl("https://www.facebook.com/budi.santoso"), "https://www.facebook.com/budi.santoso");
  assert.equal(P.facebookUrl("facebook.com/budi"), "https://facebook.com/budi");
  assert.equal(P.facebookUrl("http://m.facebook.com/profile.php?id=123#x"), "https://m.facebook.com/profile.php?id=123");
  assert.equal(P.facebookUrl("https://fb.com/budi"), "https://fb.com/budi");
  assert.equal(P.facebookUrl("  https://web.facebook.com/budi  "), "https://web.facebook.com/budi");
});

test("facebookUrl: host palsu, skema berbahaya, kredensial, dan jalur kosong ditolak", () => {
  for (const u of ["https://facebook.com.evil.com/x", "https://evilfacebook.com/x", "https://facebook.com@evil.com/x", "https://user:pw@facebook.com/x",
    "javascript:alert(1)", "data:text/html,x", "ftp://facebook.com/x", "https://facebook.com", "https://facebook.com/", "https://facebook.com:8080/x",
    "https://facebооk.com/x", "https://" + "a".repeat(10) + ".com", "", "bukan url", "https://facebook.com/" + "a".repeat(250)])
    assert.equal(P.facebookUrl(u), null, u);
});

test("docId: gabungan uid dan slug, karakter aneh ditolak", () => {
  assert.equal(P.docId("abc123", "akane-rin"), "abc123_akane-rin");
  assert.equal(P.docId("a/b", "x"), null);
  assert.equal(P.docId("abc", "x/../y"), null);
  assert.equal(P.docId("", "x"), null);
});

test("teamKey: urutan anggota tidak berpengaruh, hasil terurut", () => {
  assert.equal(P.teamKey(["zankou", "akane-rin", "blackbird"]), "akane-rin.blackbird.zankou");
  assert.equal(P.teamKey(["blackbird", "zankou", "akane-rin"]), P.teamKey(["akane-rin", "blackbird", "zankou"]));
  assert.equal(P.teamKey([]), "");
});

test("sameTeam: anggota yang sama dianggap tim kembar, apa pun urutan dan perannya", () => {
  assert.equal(P.sameTeam(["a", "b", "c"], ["c", "a", "b"]), true);
  assert.equal(P.sameTeam(["a", "b"], ["a", "b", "c"]), false);
  assert.equal(P.sameTeam(["a", "b", "c"], ["a", "b", "d"]), false);
});

test("duplicateOf: menemukan tim yang sudah tayang dengan anggota sama", () => {
  const list = [{ name: "X", members: ["b", "a"] }, { name: "Y", members: ["a", "c"] }, null, { name: "Z" }];
  assert.equal(P.duplicateOf(["a", "b"], list).name, "X");
  assert.equal(P.duplicateOf(["a", "d"], list), null);
  assert.equal(P.duplicateOf(["a", "b"], undefined), null);
});

// ---- usulan build ----
const bctx = { espers: ["akane-rin", "blackbird", "lacrimosa", "zankou", "sakiri"], arcs: ["crime-and-punishment", "ravenous-blade", "watch-your-heads", "echoes-on-hold", "x5"], sets: ["Suit1", "Suit3", "Suit11"], stats: ["CRIT DMG", "Psyche DMG", "ATK %", "HP %"], sub: ["DMG %", "ATK %", "Cycle Intensity", "CRIT Rate", "DEF"] };
const bok = { name: "Nova Burst", arcs: ["ravenous-blade", "watch-your-heads"], sets: [{ id: "Suit3", pieces: 4 }, { id: "Suit11", pieces: 2 }], stats: ["CRIT DMG", "Psyche DMG"], sub: ["DMG %", "ATK %"], awks: [], skills: [], why: "Cocok untuk boss.", credit: { name: "Budi", url: "https://www.facebook.com/budi" } };

test("sanitizeBuild: build valid dipertahankan", () => {
  const r = P.sanitizeBuild(bok, bctx);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.build, bok);
});

test("sanitizeBuild: nama, kredit, dan link divalidasi seperti tim", () => {
  assert.ok(P.sanitizeBuild({ ...bok, name: " " }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, name: "x".repeat(41) }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, credit: { name: "", url: "" } }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, credit: { name: "B", url: "https://evil.com/x" } }, bctx).errors.length);
  assert.equal(P.sanitizeBuild({ ...bok, credit: { name: "B", url: "" } }, bctx).build.credit.url, "");
});

test("sanitizeBuild: Arc wajib 1 sampai 4, dikenal, tanpa ganda", () => {
  for (const arcs of [[], ["a", "b", "c", "d", "e"], ["tidak-ada"], ["ravenous-blade", "ravenous-blade"], "ravenous-blade"])
    assert.ok(P.sanitizeBuild({ ...bok, arcs }, bctx).errors.length, JSON.stringify(arcs));
  assert.equal(P.sanitizeBuild({ ...bok, arcs: ["crime-and-punishment", "ravenous-blade", "watch-your-heads", "echoes-on-hold"] }, bctx).errors.length, 0);
});

test("sanitizeBuild: set modul maksimal 3, id dikenal, keping hanya 2 atau 4, tanpa ganda", () => {
  const bad = [[{ id: "SuitX", pieces: 4 }], [{ id: "Suit3", pieces: 3 }], [{ id: "Suit3", pieces: 4 }, { id: "Suit3", pieces: 2 }], [{ id: "Suit1", pieces: 2 }, { id: "Suit3", pieces: 2 }, { id: "Suit11", pieces: 2 }, { id: "Suit1", pieces: 4 }], ["Suit3"], null];
  for (const sets of bad) assert.ok(P.sanitizeBuild({ ...bok, sets }, bctx).errors.length, JSON.stringify(sets));
  assert.equal(P.sanitizeBuild({ ...bok, sets: [] }, bctx).errors.length, 0);
});

test("sanitizeBuild: stat utama 1 sampai 3, sub-stat maksimal 4, harus dari daftar", () => {
  assert.ok(P.sanitizeBuild({ ...bok, stats: [] }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, stats: ["CRIT DMG", "Psyche DMG", "ATK %", "HP %"] }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, stats: ["Bukan Stat"] }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, stats: ["CRIT DMG", "CRIT DMG"] }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, sub: ["DMG %", "ATK %", "Cycle Intensity", "CRIT Rate", "DEF"] }, bctx).errors.length);
  assert.ok(P.sanitizeBuild({ ...bok, sub: ["Bukan"] }, bctx).errors.length);
  assert.equal(P.sanitizeBuild({ ...bok, sub: [] }, bctx).errors.length, 0);
});

test("sanitizeBuild: catatan dirapikan dan dipotong; bukan objek tidak crash", () => {
  assert.equal(P.sanitizeBuild({ ...bok, why: "a\nb\u0000" + "y".repeat(400) }, bctx).build.why.length, 300);
  for (const bad of [null, undefined, 5, "x", []]) assert.ok(P.sanitizeBuild(bad, bctx, "akane-rin").errors.length);
});

test("sanitizeBuild: bidang asing dibuang, tidak ikut tersimpan", () => {
  const b = P.sanitizeBuild({ ...bok, evil: "<script>", isAdmin: true }, bctx).build;
  assert.deepEqual(Object.keys(b).sort(), ["arcs", "awks", "credit", "name", "sets", "skills", "stats", "sub", "why"]);
});

test("sanitizeBuild gabungan: tim opsional, bila ada harus valid dan memuat karakter halaman", () => {
  const ok = P.sanitizeBuild({ ...bok, team: { members: ["akane-rin", "blackbird", "zankou"], roles: ["DPS", "", "x".repeat(50)] } }, bctx, "akane-rin");
  assert.deepEqual(ok.errors, []);
  assert.deepEqual(ok.build.team.members, ["akane-rin", "blackbird", "zankou"]);
  assert.equal(ok.build.team.roles.length, 3);
  assert.equal(ok.build.team.roles[2].length, 24);
  assert.equal("team" in P.sanitizeBuild(bok, bctx, "akane-rin").build, false);
  assert.equal("team" in P.sanitizeBuild({ ...bok, team: { members: ["akane-rin"], roles: [""] } }, bctx, "akane-rin").build, false);
  for (const members of [["blackbird", "zankou"], ["akane-rin", "akane-rin"], ["akane-rin", "bukan"], ["akane-rin", "blackbird", "lacrimosa", "zankou", "sakiri"]])
    assert.ok(P.sanitizeBuild({ ...bok, team: { members, roles: [] } }, bctx, "akane-rin").errors.length, JSON.stringify(members));
  assert.ok(P.sanitizeBuild({ ...bok, team: "x" }, bctx, "akane-rin").errors.length);
});

test("sanitizeBuild gabungan: urutan Awakening berupa angka 1 sampai 6 tanpa ganda", () => {
  assert.deepEqual(P.sanitizeBuild({ ...bok, awks: [1, 6, 3] }, bctx, "akane-rin").build.awks, [1, 6, 3]);
  for (const awks of [[7], [0], ["1"], [1, 1], [1, 2, 3, 4, 5, 6, 1], "x", [1.5]])
    assert.ok(P.sanitizeBuild({ ...bok, awks }, bctx, "akane-rin").errors.length, JSON.stringify(awks));
  assert.deepEqual(P.sanitizeBuild(bok, bctx, "akane-rin").build.awks, []);
});

test("sanitizeBuild gabungan: prioritas skill hanya empat grup dikenal tanpa ganda", () => {
  assert.deepEqual(P.sanitizeBuild({ ...bok, skills: ["ultimate", "basic"] }, bctx, "akane-rin").build.skills, ["ultimate", "basic"]);
  for (const skills of [["ulti"], ["basic", "basic"], ["basic", "redirect", "ultimate", "support", "basic"], "basic"])
    assert.ok(P.sanitizeBuild({ ...bok, skills }, bctx, "akane-rin").errors.length, JSON.stringify(skills));
});
