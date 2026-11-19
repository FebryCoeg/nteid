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
