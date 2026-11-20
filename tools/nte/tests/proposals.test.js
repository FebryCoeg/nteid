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

test("mediaUrl: host Facebook diterima dan dinormalkan", () => {
  assert.equal(P.mediaUrl("https://www.facebook.com/budi.santoso"), "https://www.facebook.com/budi.santoso");
  assert.equal(P.mediaUrl("facebook.com/budi"), "https://facebook.com/budi");
  assert.equal(P.mediaUrl("http://m.facebook.com/profile.php?id=123#x"), "https://m.facebook.com/profile.php?id=123");
  assert.equal(P.mediaUrl("https://fb.com/budi"), "https://fb.com/budi");
  assert.equal(P.mediaUrl("  https://web.facebook.com/budi  "), "https://web.facebook.com/budi");
});

test("mediaUrl: host palsu, skema berbahaya, kredensial, dan jalur kosong ditolak", () => {
  for (const u of ["https://facebook.com.evil.com/x", "https://evilfacebook.com/x", "https://facebook.com@evil.com/x", "https://user:pw@facebook.com/x",
    "javascript:alert(1)", "data:text/html,x", "ftp://facebook.com/x", "https://facebook.com", "https://facebook.com/", "https://facebook.com:8080/x",
    "https://facebооk.com/x", "https://" + "a".repeat(10) + ".com", "", "bukan url", "https://facebook.com/" + "a".repeat(250)])
    assert.equal(P.mediaUrl(u), null, u);
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
const bok = { name: "Nova Burst", arcs: ["ravenous-blade", "watch-your-heads"], sets: [{ id: "Suit3", pieces: 4 }, { id: "Suit11", pieces: 2 }], stats: ["CRIT DMG", "Psyche DMG"], sub: ["DMG %", "ATK %"], awks: [], skills: [], rot: [], repeat: null, rotation: "", why: "Cocok untuk boss.", credit: { name: "Budi", url: "https://www.facebook.com/budi" } };

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
  assert.deepEqual(Object.keys(b).sort(), ["arcs", "awks", "credit", "name", "repeat", "rot", "rotation", "sets", "skills", "stats", "sub", "why"]);
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

test("sanitizeBuild: rotasi tim opsional, dirapikan, dipotong 500 huruf, bukan string jadi kosong", () => {
  assert.equal(P.sanitizeBuild({ ...bok, rotation: "Skill A " + String.fromCharCode(10) + "> Ult B" + String.fromCharCode(0) }, bctx, "akane-rin").build.rotation, "Skill A > Ult B");
  assert.equal(P.sanitizeBuild({ ...bok, rotation: "r".repeat(700) }, bctx, "akane-rin").build.rotation.length, 500);
  assert.equal(P.sanitizeBuild(bok, bctx, "akane-rin").build.rotation, "");
  assert.equal(P.sanitizeBuild({ ...bok, rotation: { x: 1 } }, bctx, "akane-rin").build.rotation, "");
});

const rteam = { members: ["akane-rin", "blackbird", "zankou"], roles: [] };
test("sanitizeBuild: rotasi berurutan (karakter + aksi) diterima bila karakter ada di tim", () => {
  const rot = [{ c: "blackbird", a: "e" }, { c: "blackbird", a: "hold" }, { c: "blackbird", a: "q" }, { c: "blackbird", a: "atk" }, { c: "zankou", a: "switch" }];
  const r = P.sanitizeBuild({ ...bok, team: rteam, rot }, bctx, "akane-rin");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.build.rot, rot);
  assert.deepEqual(P.sanitizeBuild(bok, bctx, "akane-rin").build.rot, []);
});

test("sanitizeBuild: rotasi menolak aksi asing, karakter di luar tim, bentuk salah, dan lebih dari 50 langkah", () => {
  const bad = [[{ c: "blackbird", a: "x" }], [{ c: "blackbird", a: "qte" }], [{ c: "lacrimosa", a: "e" }], [{ c: "blackbird" }], ["e"], [null], "e", [{ c: "blackbird", a: "e", evil: 1 }].concat(Array(50).fill({ c: "blackbird", a: "e" }))];
  for (const rot of bad) assert.ok(P.sanitizeBuild({ ...bok, team: rteam, rot }, bctx, "akane-rin").errors.length, JSON.stringify(rot).slice(0, 60));
  assert.equal(P.sanitizeBuild({ ...bok, team: rteam, rot: Array(50).fill({ c: "akane-rin", a: "atk" }) }, bctx, "akane-rin").errors.length, 0);
});

test("sanitizeBuild: tanpa tim, rotasi hanya boleh memakai karakter halaman; bidang asing di langkah dibuang", () => {
  assert.equal(P.sanitizeBuild({ ...bok, rot: [{ c: "akane-rin", a: "q" }] }, bctx, "akane-rin").errors.length, 0);
  assert.ok(P.sanitizeBuild({ ...bok, rot: [{ c: "blackbird", a: "q" }] }, bctx, "akane-rin").errors.length);
  const b = P.sanitizeBuild({ ...bok, rot: [{ c: "akane-rin", a: "q", evil: "<x>" }] }, bctx, "akane-rin");
  assert.deepEqual(b.build.rot, [{ c: "akane-rin", a: "q" }]);
});

test("mediaUrl: media sosial lain (YouTube, Instagram, TikTok, X, dll) diterima dan dinormalkan", () => {
  assert.equal(P.mediaUrl("https://www.youtube.com/@budi"), "https://www.youtube.com/@budi");
  assert.equal(P.mediaUrl("youtu.be/abc123"), "https://youtu.be/abc123");
  assert.equal(P.mediaUrl("instagram.com/budi.santoso"), "https://instagram.com/budi.santoso");
  assert.equal(P.mediaUrl("https://www.tiktok.com/@budi"), "https://www.tiktok.com/@budi");
  assert.equal(P.mediaUrl("https://x.com/budi"), "https://x.com/budi");
  assert.equal(P.mediaUrl("https://twitter.com/budi"), "https://twitter.com/budi");
  assert.equal(P.mediaUrl("https://linktr.ee/budi"), "https://linktr.ee/budi");
  assert.equal(P.mediaUrl("https://discord.gg/abc"), "https://discord.gg/abc");
  assert.equal(P.mediaUrl("https://m.youtube.com/channel/UC123"), "https://m.youtube.com/channel/UC123");
});

test("mediaUrl: situs di luar daftar media dan tipuan host tetap ditolak", () => {
  for (const u of ["https://evil.com/x", "https://youtube.com.evil.com/x", "https://evilyoutube.com/x", "https://instagram.com@evil.com/x", "https://instagram.com", "https://x.com/", "javascript:alert(1)", "https://notx.com/a", "https://tiktok.com:81/a", "https://exam-ple.com/a"])
    assert.equal(P.mediaUrl(u), null, u);
});

test("sanitizeCredit lewat sanitizeTeam: link YouTube diterima", () => {
  const r = P.sanitizeTeam({ ...ok, credit: { name: "Budi", url: "https://www.youtube.com/@budi" } }, ctx, "akane-rin");
  assert.deepEqual(r.errors, []);
  assert.equal(r.team.credit.url, "https://www.youtube.com/@budi");
});

const steps = (n) => Array.from({ length: n }, (_, i) => ({ c: "akane-rin", a: i % 2 ? "atk" : "e" }));
test("sanitizeBuild: titik repeat = nomor langkah (mulai 0) tempat rotasi diulang", () => {
  assert.equal(P.sanitizeBuild({ ...bok, rot: steps(6), repeat: 0 }, bctx, "akane-rin").build.repeat, 0);
  assert.equal(P.sanitizeBuild({ ...bok, rot: steps(6), repeat: 3 }, bctx, "akane-rin").build.repeat, 3);
  assert.equal(P.sanitizeBuild({ ...bok, rot: steps(6), repeat: 5 }, bctx, "akane-rin").build.repeat, 5);
  assert.equal(P.sanitizeBuild({ ...bok, rot: steps(6) }, bctx, "akane-rin").build.repeat, null);
  assert.equal(P.sanitizeBuild({ ...bok, rot: steps(6), repeat: null }, bctx, "akane-rin").build.repeat, null);
});

test("sanitizeBuild: titik repeat di luar rangkaian atau bukan bilangan bulat ditolak; tanpa langkah jadi null", () => {
  for (const repeat of [6, 99, -1, 1.5, "2", true, {}])
    assert.ok(P.sanitizeBuild({ ...bok, rot: steps(6), repeat }, bctx, "akane-rin").errors.length, JSON.stringify(repeat));
  assert.equal(P.sanitizeBuild({ ...bok, rot: [], repeat: 2 }, bctx, "akane-rin").build.repeat, null);
});

test("sanitizeBuild: rotasi 50 langkah dengan repeat di langkah terakhir diterima", () => {
  const r = P.sanitizeBuild({ ...bok, rot: steps(50), repeat: 49 }, bctx, "akane-rin");
  assert.deepEqual(r.errors, []);
  assert.equal(r.build.rot.length, 50);
  assert.equal(r.build.repeat, 49);
});

// ---- bintang dan build utama ----
test("starId: gabungan pid dan uid, karakter aneh ditolak", () => {
  assert.equal(P.starId("abc_akane-rin", "u123"), "abc_akane-rin__u123");
  assert.equal(P.starId("a/b", "u"), null);
  assert.equal(P.starId("abc", ""), null);
  assert.equal(P.starId("abc", "u/../x"), null);
  assert.equal(P.starId(5, "u"), null);
});

test("rankByStars: bintang terbanyak di atas, seri tetap urutan awal, pid tanpa data dianggap 0", () => {
  const list = [{ pid: "a" }, { pid: "b" }, { pid: "c" }, { pid: "d" }];
  const out = P.rankByStars(list, { b: 5, c: 5, d: 1 });
  assert.deepEqual(out.map((x) => x.pid), ["b", "c", "d", "a"]);
  assert.deepEqual(P.rankByStars(list, {}).map((x) => x.pid), ["a", "b", "c", "d"]);
  assert.deepEqual(P.rankByStars(list, null).map((x) => x.pid), ["a", "b", "c", "d"]);
  assert.deepEqual(P.rankByStars(undefined, {}), []);
  assert.equal(list[0].pid, "a");
});

const fb = { name: "Nova Burst", pid: "u1_akane-rin", team: { members: ["akane-rin", "blackbird"], roles: ["DPS", ""] }, arcs: ["real-music"], sets: [{ id: "Suit1", pieces: 4 }], stats: ["ATK"], sub: ["DMG %"], awks: [1, 6], skills: ["ultimate"], rot: [{ c: "akane-rin", a: "e" }], repeat: 0, rotation: "cat", why: "alasan", credit: { name: "Budi", url: "https://www.youtube.com/@budi" } };

test("featuredBuild: membentuk data tab Build dari build komunitas, hanya isi komunitas, dengan kredit", () => {
  const bd = P.featuredBuild(fb);
  assert.deepEqual(bd.arcs, ["real-music"]);
  assert.deepEqual(bd.sets, [{ id: "Suit1", pieces: 4 }]);
  assert.deepEqual(bd.stats, ["ATK"]);
  assert.deepEqual(bd.sub, ["DMG %"]);
  assert.deepEqual(bd.awks, [1, 6]);
  assert.deepEqual(bd.skills, ["ultimate"]);
  assert.equal(bd.teams.length, 1);
  assert.deepEqual(bd.teams[0].members, ["akane-rin", "blackbird"]);
  assert.equal(bd.teams[0].name.id, "Nova Burst");
  assert.equal(bd.teams[0].roles[0].id, "DPS");
  assert.deepEqual(bd.credit, { name: "Budi", url: "https://www.youtube.com/@budi" });
  assert.deepEqual(bd.rot, [{ c: "akane-rin", a: "e" }]);
  assert.equal(bd.repeat, 0);
  assert.equal(bd.rotation, "cat");
  for (const k of ["role", "calc", "arcWhy", "setWhy", "setPct", "arcNote"]) assert.equal(k in bd, false, k);
});

test("featuredBuild: tanpa tim, link tidak sah dibuang, data rusak tidak crash", () => {
  const bd = P.featuredBuild({ ...fb, team: undefined, credit: { name: "S", url: "https://evil.com/x" } });
  assert.deepEqual(bd.teams, []);
  assert.equal(bd.credit.url, "");
  for (const bad of [null, undefined, 5, "x", []]) assert.equal(P.featuredBuild(bad), null);
  const bd2 = P.featuredBuild({ name: "X", arcs: "bukan-list", stats: null });
  assert.deepEqual(bd2.arcs, []);
  assert.deepEqual(bd2.stats, []);
});

// ---- daftar pilihan stat ----
test("statVocab: gabungan stat dari build bawaan, terurut, tanpa duplikat", () => {
  const v = P.statVocab({ a: { stats: ["CRIT DMG", "ATK %"], sub: ["DMG %", "ATK %"] }, b: { stats: ["CRIT DMG", "HP %"], sub: ["CRIT Rate"] }, c: null, d: { stats: "x" } });
  assert.deepEqual(v.stats, v.stats.slice().sort());
  assert.deepEqual(v.sub, v.sub.slice().sort());
  assert.equal(new Set(v.stats).size, v.stats.length);
  for (const s of ["ATK %", "CRIT DMG", "HP %"]) assert.ok(v.stats.includes(s), s);
  for (const s of ["ATK %", "CRIT Rate", "DMG %"]) assert.ok(v.sub.includes(s), s);
});

test("statVocab: Break Intensity selalu ada di stat utama dan sub-stat, walau build bawaan tidak memakainya", () => {
  const v = P.statVocab({ a: { stats: ["CRIT DMG"], sub: ["DMG %"] } });
  assert.ok(v.stats.includes("Break Intensity"));
  assert.ok(v.sub.includes("Break Intensity"));
  const v2 = P.statVocab({});
  assert.ok(v2.stats.includes("Break Intensity") && v2.sub.includes("Break Intensity"));
  assert.ok(P.statVocab(undefined).stats.includes("Break Intensity"));
});

test("statVocab: Universal DMG % dihapus dari sub-stat tetapi Universal DMG tetap", () => {
  const v = P.statVocab({ a: { stats: [], sub: ["Universal DMG", "Universal DMG %"] } });
  assert.ok(v.sub.includes("Universal DMG"));
  assert.equal(v.sub.includes("Universal DMG %"), false);
});

test("sanitizeBuild: Break Intensity diterima sebagai stat utama dan sub-stat bila ada di daftar", () => {
  const v = P.statVocab({});
  const ctx2 = { ...bctx, stats: v.stats, sub: v.sub };
  const r = P.sanitizeBuild({ ...bok, stats: ["Break Intensity", "CRIT DMG"].filter((x) => v.stats.includes(x)), sub: ["Break Intensity"] }, ctx2, "akane-rin");
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.build.stats, ["Break Intensity"].concat(v.stats.includes("CRIT DMG") ? ["CRIT DMG"] : []));
  assert.deepEqual(r.build.sub, ["Break Intensity"]);
});

// ---- bentrok tim saat mengirim atau mengedit ----
test("teamClash: pengiriman baru ditolak bila anggotanya sama dengan tim yang sudah ada", () => {
  const others = [{ name: "A", members: ["b", "a", "c"] }];
  assert.equal(P.teamClash(["a", "b", "c"], null, others).name, "A");
  assert.equal(P.teamClash(["a", "b", "d"], null, others), null);
});

test("teamClash: edit tanpa mengubah anggota tim tidak ditolak, walau ada tim lain yang kembar", () => {
  const others = [{ name: "Milik orang lain", members: ["a", "b", "c"] }];
  assert.equal(P.teamClash(["c", "a", "b"], ["a", "b", "c"], others), null);
});

test("teamClash: edit yang mengubah anggota tetap diperiksa terhadap tim lain", () => {
  const others = [{ name: "Milik orang lain", members: ["a", "b", "d"] }];
  assert.equal(P.teamClash(["a", "b", "d"], ["a", "b", "c"], others).name, "Milik orang lain");
  assert.equal(P.teamClash(["a", "b", "e"], ["a", "b", "c"], others), null);
});

test("teamClash: tanpa tim baru atau data rusak tidak crash", () => {
  assert.equal(P.teamClash(undefined, null, []), null);
  assert.equal(P.teamClash(["a", "b"], "x", undefined), null);
  assert.equal(P.teamClash(["a", "b"], undefined, [null, { members: "x" }]), null);
});
