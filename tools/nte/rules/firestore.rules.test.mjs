// Uji aturan Firestore dengan emulator. Jalankan (butuh Java + firebase-tools + @firebase/rules-unit-testing):
//   firebase emulators:exec --only firestore "node firestore.rules.test.mjs"   (salin berkas ini ke folder yang berisi paketnya)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where, writeBatch, runTransaction } from "firebase/firestore";
import { readFileSync } from "node:fs";

const env = await initializeTestEnvironment({ projectId: "demo-nte", firestore: { rules: readFileSync(process.env.RULES || "firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
const ADMIN = "febririansyah1999@gmail.com";
const ctxOf = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const alice = ctxOf("alice", "alice@x.com"), bob = ctxOf("bob", "bob@x.com"), carol = ctxOf("carol", "carol@x.com"), admin = ctxOf("adm", ADMIN), fakeAdmin = ctxOf("evil", ADMIN, false), anon = env.unauthenticatedContext().firestore();
const team = { name: "Tim Nova", members: ["akane-rin", "blackbird"], roles: ["DPS", ""], why: "Stabil." };
const credit = { name: "Budi", url: "https://www.facebook.com/budi" };
const keyOf = (m) => m.slice().sort().join(".");
const mk = (uid, over = {}) => { const o = { uid, name: "Alice", esper: "akane-rin", team, credit, status: "pending", createdAt: serverTimestamp(), ...over }; if (!("key" in over)) o.key = keyOf(o.team.members || []); return o; };
const P = (db, id) => doc(db, "proposals", id);
// kirim = kunci tim + usulan dalam satu batch (seperti di situs)
const send = (db, id, data, o = {}) => { const b = writeBatch(db); b.set(doc(db, "locks", o.lockId ?? (data.esper + "__" + data.key)), { uid: o.lockUid ?? data.uid, createdAt: serverTimestamp() }); b.set(P(db, id), data); return b.commit(); };
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log("ok  " + name); };

await t("pengguna login boleh mengirim usulan sendiri", () => assertSucceeds(send(alice, "alice_akane-rin", mk("alice"))));
await t("usulan tanpa dokumen kunci ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { team: { ...team, members: ["akane-rin", "lacrimosa"] } }))));
await t("tanpa login ditolak", () => assertFails(send(anon, "x_akane-rin", mk("x"))));
await t("email belum terverifikasi ditolak", () => assertFails(send(ctxOf("u9", "u9@x.com", false), "u9_akane-rin", mk("u9"))));
await t("tidak boleh menulis atas nama orang lain (uid)", () => assertFails(send(bob, "bob_akane-rin", mk("alice"))));
await t("id dokumen harus uid_esper", () => assertFails(send(bob, "acak123", mk("bob"))));
await t("status selain pending ditolak saat membuat", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { status: "approved" }))));
await t("bidang asing ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { isAdmin: true }))));
await t("tim dengan bidang asing ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { team: { ...team, evil: 1 } }))));
await t("anggota tim lebih dari 4 ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { team: { ...team, members: ["a", "b", "c", "d", "e"] } }))));
await t("tim satu anggota ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { team: { ...team, members: ["a"] } }))));
await t("catatan tim terlalu panjang ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { team: { ...team, why: "x".repeat(301) } }))));
await t("kredit tanpa link diterima", () => assertSucceeds(send(ctxOf("c1", "c1@x.com"), "c1_akane-rin", mk("c1", { team: { ...team, members: ["akane-rin", "sakiri"] }, credit: { name: "Budi", url: "" } }))));
await t("link bukan Facebook ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { credit: { name: "Budi", url: "https://evil.com/x" } }))));
await t("link Facebook palsu (host menempel) ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { credit: { name: "Budi", url: "https://facebook.com.evil.com/x" } }))));
await t("link javascript ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { credit: { name: "Budi", url: "javascript:alert(1)" } }))));
await t("kredit dengan bidang asing ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { credit: { ...credit, x: 1 } }))));
await t("nama terlalu panjang ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { name: "x".repeat(81) }))));
await t("createdAt palsu ditolak", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { createdAt: new Date("2000-01-01") }))));

// satu kali per karakter
await t("pemilik tidak boleh mengganti usulannya (sekali saja)", () => assertFails(setDoc(P(alice, "alice_akane-rin"), mk("alice", { name: "Alice B" }))));
await t("pemilik tidak boleh mengirim ulang untuk karakter yang sama dengan tim lain", () => assertFails(send(alice, "alice_akane-rin", mk("alice", { team: { ...team, members: ["akane-rin", "linko"] } }))));
await t("pemilik tidak boleh menghapus usulannya lalu mengirim ulang", () => assertFails(deleteDoc(P(alice, "alice_akane-rin"))));
await t("pengguna yang sama boleh mengusulkan untuk karakter lain", () => assertSucceeds(send(alice, "alice_blackbird", mk("alice", { esper: "blackbird", team: { ...team, members: ["blackbird", "linko"] } }))));

// tim kembar
await t("tim dengan anggota sama ditolak, walau urutan dan peran beda", () => assertFails(send(bob, "bob_akane-rin", mk("bob", { team: { name: "Lain", members: ["blackbird", "akane-rin"], roles: ["x", "y"], why: "" }, key: "akane-rin.blackbird" }))));
await t("tim dengan anggota berbeda diterima", () => assertSucceeds(send(bob, "bob_akane-rin", mk("bob", { team: { ...team, members: ["akane-rin", "blackbird", "linko"] } }))));
await t("tim yang sama untuk karakter halaman lain diterima (kunci per karakter)", () => assertSucceeds(send(carol, "carol_blackbird", mk("carol", { esper: "blackbird", team: { ...team, members: ["blackbird", "sakiri"] } }))));
await t("kunci tidak cocok dengan anggota ditolak", () => assertFails(send(carol, "carol_akane-rin", mk("carol", { key: "akane-rin.zankou" }))));
await t("jumlah bagian kunci tidak cocok ditolak", () => assertFails(send(carol, "carol_akane-rin", mk("carol", { team: { ...team, members: ["akane-rin", "blackbird", "sakiri"] }, key: "akane-rin.blackbird" }))));
await t("dokumen kunci atas nama orang lain ditolak", () => assertFails(send(carol, "carol_akane-rin", mk("carol", { team: { ...team, members: ["akane-rin", "zankou"] } }), { lockUid: "alice" })));
await t("dokumen kunci tidak bisa diubah pengguna", () => assertFails(setDoc(doc(alice, "locks", "akane-rin__akane-rin.blackbird"), { uid: "alice", createdAt: serverTimestamp() })));
await t("dokumen kunci tidak bisa dihapus pengguna", () => assertFails(deleteDoc(doc(alice, "locks", "akane-rin__akane-rin.blackbird"))));
await t("pengguna login boleh memeriksa satu kunci", () => assertSucceeds(getDoc(doc(bob, "locks", "akane-rin__akane-rin.blackbird"))));
await t("anonim tidak boleh membaca kunci", () => assertFails(getDoc(doc(anon, "locks", "akane-rin__akane-rin.blackbird"))));
await t("daftar semua kunci ditolak", () => assertFails(getDocs(collection(bob, "locks"))));

// baca dan admin
await t("pemilik boleh membaca usulannya", () => assertSucceeds(getDoc(P(alice, "alice_akane-rin"))));
await t("orang lain tidak boleh membaca", () => assertFails(getDoc(P(bob, "alice_akane-rin"))));
await t("anonim tidak boleh membaca", () => assertFails(getDoc(P(anon, "alice_akane-rin"))));
await t("daftar usulan milik sendiri boleh", () => assertSucceeds(getDocs(query(collection(alice, "proposals"), where("uid", "==", "alice")))));
await t("daftar semua usulan oleh pengguna biasa ditolak", () => assertFails(getDocs(collection(alice, "proposals"))));
await t("pemilik tidak boleh menyetujui usulannya sendiri", () => assertFails(updateDoc(P(alice, "alice_akane-rin"), { status: "approved" })));
await t("admin boleh membaca antrean pending", () => assertSucceeds(getDocs(query(collection(admin, "proposals"), where("status", "==", "pending")))));
await t("admin boleh mengubah status", () => assertSucceeds(updateDoc(P(admin, "alice_akane-rin"), { status: "approved", reviewedAt: serverTimestamp() })));
await t("admin tidak boleh mengubah isi tim", () => assertFails(updateDoc(P(admin, "alice_akane-rin"), { team: { ...team, name: "Lain" } })));
await t("admin palsu (email belum terverifikasi) ditolak", () => assertFails(updateDoc(P(fakeAdmin, "alice_akane-rin"), { status: "rejected" })));
await t("koleksi lain tertutup", () => assertFails(setDoc(doc(alice, "lain", "x"), { a: 1 })));
await t("admin boleh menghapus usulan (supaya pengusul bisa mengulang) dan kuncinya", async () => { await assertSucceeds(deleteDoc(P(admin, "alice_akane-rin"))); await assertSucceeds(deleteDoc(doc(admin, "locks", "akane-rin__akane-rin.blackbird"))); });
await t("setelah admin menghapus, pengusul boleh mengirim lagi", () => assertSucceeds(send(alice, "alice_akane-rin", mk("alice", { name: "Alice C" }))));
// usulan build lengkap
const build = { name: "Nova Burst", arcs: ["ravenous-blade", "watch-your-heads"], sets: [{ id: "Suit3", pieces: 4 }], stats: ["CRIT DMG"], sub: ["DMG %"], awks: [1, 6], skills: ["ultimate"], why: "Cocok." };
const mb = (uid, over = {}) => ({ uid, name: "Alice", esper: "akane-rin", build, credit, status: "pending", createdAt: serverTimestamp(), ...over });
const B = (db, id) => doc(db, "buildProposals", id);
await t("build: pengguna login boleh mengirim build sendiri", () => assertSucceeds(setDoc(B(alice, "alice_akane-rin"), mb("alice"))));
await t("build: tanpa login ditolak", () => assertFails(setDoc(B(anon, "x_akane-rin"), mb("x"))));
await t("build: uid atau id dokumen palsu ditolak", async () => { await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("alice"))); await assertFails(setDoc(B(bob, "acak"), mb("bob"))); });
await t("build: status selain pending dan bidang asing ditolak", async () => { await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { status: "approved" }))); await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { isAdmin: true }))); });
await t("build: isi build tidak valid ditolak", async () => {
  for (const b of [{ ...build, arcs: [] }, { ...build, arcs: ["a", "b", "c", "d", "e"] }, { ...build, stats: [] }, { ...build, sets: [1, 2, 3, 4] }, { ...build, sub: ["a", "b", "c", "d", "e"] }, { ...build, name: "" }, { ...build, why: "x".repeat(301) }, { ...build, evil: 1 }])
    await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { build: b })));
});
await t("build: kredit dengan link bukan Facebook ditolak", () => assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { credit: { name: "B", url: "https://evil.com/x" } }))));
await t("build: pemilik tidak boleh menimpa dengan dokumen baru (createdAt berubah) ataupun menghapus", async () => { await assertFails(setDoc(B(alice, "alice_akane-rin"), mb("alice", { name: "Lain" }))); await assertFails(deleteDoc(B(alice, "alice_akane-rin"))); });
await t("build: karakter lain untuk pengguna sama boleh", () => assertSucceeds(setDoc(B(alice, "alice_blackbird"), mb("alice", { esper: "blackbird" }))));
await t("build: pemilik dan admin boleh membaca, orang lain tidak", async () => { await assertSucceeds(getDoc(B(alice, "alice_akane-rin"))); await assertSucceeds(getDoc(B(admin, "alice_akane-rin"))); await assertFails(getDoc(B(bob, "alice_akane-rin"))); await assertFails(getDoc(B(anon, "alice_akane-rin"))); });
await t("build: pemilik tidak boleh menyetujui sendiri, admin boleh ubah status saja", async () => { await assertFails(updateDoc(B(alice, "alice_akane-rin"), { status: "approved" })); await assertFails(updateDoc(B(admin, "alice_akane-rin"), { build: { ...build, name: "Lain" } })); await assertSucceeds(updateDoc(B(admin, "alice_akane-rin"), { status: "approved", reviewedAt: serverTimestamp() })); });
await t("build: admin palsu ditolak, daftar milik sendiri boleh, daftar semua ditolak", async () => { await assertFails(updateDoc(B(fakeAdmin, "alice_akane-rin"), { status: "rejected" })); await assertSucceeds(getDocs(query(collection(alice, "buildProposals"), where("uid", "==", "alice")))); await assertFails(getDocs(collection(alice, "buildProposals"))); await assertSucceeds(getDocs(query(collection(admin, "buildProposals"), where("status", "==", "approved")))); });
await t("build: admin boleh menghapus, lalu pengusul boleh mengirim lagi", async () => { await assertSucceeds(deleteDoc(B(admin, "alice_akane-rin"))); await assertSucceeds(setDoc(B(alice, "alice_akane-rin"), mb("alice"))); });
await t("gabungan: tim opsional valid diterima, tim tidak valid ditolak", async () => {
  await assertSucceeds(setDoc(B(ctxOf("t1", "t1@x.com"), "t1_akane-rin"), mb("t1", { build: { ...build, team: { members: ["akane-rin", "blackbird"], roles: ["DPS", ""] } } })));
  for (const [i, tm] of [{ members: ["akane-rin"], roles: [] }, { members: ["a", "b", "c", "d", "e"], roles: [] }, { members: ["a", "b"], roles: ["1", "2", "3", "4", "5"] }, { members: ["a", "b"], roles: [], evil: 1 }, "x"].entries())
    await assertFails(setDoc(B(ctxOf("t" + (i + 2), "t@x.com"), "t" + (i + 2) + "_akane-rin"), mb("t" + (i + 2), { build: { ...build, team: tm } })));
});
await t("gabungan: awakening lebih dari 6 atau skill lebih dari 4 ditolak", async () => {
  await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { build: { ...build, awks: [1, 2, 3, 4, 5, 6, 1] } })));
  await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { build: { ...build, skills: ["a", "b", "c", "d", "e"] } })));
  await assertFails(setDoc(B(bob, "bob_akane-rin"), mb("bob", { build: { name: "X", arcs: ["a"], sets: [], stats: ["s"], sub: [], why: "" } })));
});
await t("rotasi tim: opsional, maksimal 500 huruf, harus teks", async () => {
  await assertSucceeds(setDoc(B(ctxOf("r1", "r1@x.com"), "r1_akane-rin"), mb("r1", { build: { ...build, rotation: "Skill A > Ult B" } })));
  await assertFails(setDoc(B(ctxOf("r2", "r2@x.com"), "r2_akane-rin"), mb("r2", { build: { ...build, rotation: "x".repeat(501) } })));
  await assertFails(setDoc(B(ctxOf("r3", "r3@x.com"), "r3_akane-rin"), mb("r3", { build: { ...build, rotation: 5 } })));
});
await t("rotasi berurutan: opsional, maksimal 50 langkah, harus berupa daftar", async () => {
  const step = { c: "akane-rin", a: "e" };
  await assertSucceeds(setDoc(B(ctxOf("o1", "o1@x.com"), "o1_akane-rin"), mb("o1", { build: { ...build, rot: [step, step, ...Array(48).fill(step)] } })));
  await assertFails(setDoc(B(ctxOf("o2", "o2@x.com"), "o2_akane-rin"), mb("o2", { build: { ...build, rot: Array(51).fill(step) } })));
  await assertFails(setDoc(B(ctxOf("o3", "o3@x.com"), "o3_akane-rin"), mb("o3", { build: { ...build, rot: "e" } })));
});
// edit usulan oleh pemilik
const upd = (db, id, over = {}) => updateDoc(B(db, id), { build: { ...build, name: "Diedit" }, credit, status: "pending", updatedAt: serverTimestamp(), ...over });
await t("edit: pemilik boleh mengedit build dan kreditnya sendiri, status tetap pending", () => assertSucceeds(upd(alice, "alice_akane-rin")));
await t("edit: setelah admin menyetujui, edit pemilik mengembalikan status ke pending", async () => {
  await assertSucceeds(updateDoc(B(admin, "alice_akane-rin"), { status: "approved", reviewedAt: serverTimestamp() }));
  await assertSucceeds(upd(alice, "alice_akane-rin", { build: { ...build, name: "Edit kedua" } }));
  const d = await getDoc(B(admin, "alice_akane-rin")); if (d.data().status !== "pending" || d.data().build.name !== "Edit kedua") throw new Error("status atau isi tidak sesuai");
});
await t("edit: pemilik tidak boleh menyetujui diri sendiri lewat edit", () => assertFails(upd(alice, "alice_akane-rin", { status: "approved" })));
await t("edit: orang lain tidak boleh mengedit usulan ini", () => assertFails(upd(bob, "alice_akane-rin")));
await t("edit: tanpa login ditolak", () => assertFails(upd(anon, "alice_akane-rin")));
await t("edit: tidak boleh mengubah karakter, uid, nama, createdAt, atau reviewedAt", async () => {
  for (const o of [{ esper: "blackbird" }, { uid: "bob" }, { name: "Palsu" }, { createdAt: new Date("2000-01-01") }, { reviewedAt: serverTimestamp() }, { isAdmin: true }])
    await assertFails(upd(alice, "alice_akane-rin", o));
});
await t("edit: updatedAt palsu ditolak", () => assertFails(upd(alice, "alice_akane-rin", { updatedAt: new Date("2000-01-01") })));
await t("edit: isi tidak valid ditolak (Arc kosong, link bukan media, catatan terlalu panjang)", async () => {
  await assertFails(upd(alice, "alice_akane-rin", { build: { ...build, arcs: [] } }));
  await assertFails(upd(alice, "alice_akane-rin", { credit: { name: "B", url: "https://evil.com/x" } }));
  await assertFails(upd(alice, "alice_akane-rin", { build: { ...build, why: "x".repeat(301) } }));
});
await t("link media: YouTube, Instagram, TikTok, X diterima; situs lain dan tipuan host ditolak", async () => {
  let i = 0;
  for (const u of ["https://www.youtube.com/@budi", "https://instagram.com/budi", "https://www.tiktok.com/@budi", "https://x.com/budi", "https://linktr.ee/budi", "https://youtu.be/abc"]) { i++; await assertSucceeds(setDoc(B(ctxOf("m" + i, "m@x.com"), "m" + i + "_akane-rin"), mb("m" + i, { credit: { name: "B", url: u } }))); }
  for (const u of ["https://evil.com/x", "https://youtube.com.evil.com/x", "https://instagram.com@evil.com/x", "https://instagram.com", "http://x.com/budi", "https://notx.com/a"]) { i++; await assertFails(setDoc(B(ctxOf("m" + i, "m@x.com"), "m" + i + "_akane-rin"), mb("m" + i, { credit: { name: "B", url: u } }))); }
});
await t("repeat: bilangan bulat 0 sampai 49 atau null diterima; di luar itu atau bukan angka ditolak", async () => {
  const step = { c: "akane-rin", a: "e" };
  let i = 0;
  for (const rp of [0, 3, 49, null]) { i++; await assertSucceeds(setDoc(B(ctxOf("p" + i, "p@x.com"), "p" + i + "_akane-rin"), mb("p" + i, { build: { ...build, rot: [step, step, step, step], repeat: rp } }))); }
  for (const rp of [-1, 50, 1.5, "2", true]) { i++; await assertFails(setDoc(B(ctxOf("p" + i, "p@x.com"), "p" + i + "_akane-rin"), mb("p" + i, { build: { ...build, rot: [step, step], repeat: rp } }))); }
});
// bintang untuk build komunitas
const S1 = (db, id) => doc(db, "stars", id), C1 = (db, id) => doc(db, "buildStars", id);
const starData = (uid, pid, over = {}) => ({ uid, pid, esper: "akane-rin", createdAt: serverTimestamp(), ...over });
const giveStar = (db, uid, pid, o = {}) => { const b = writeBatch(db); b.set(S1(db, o.sid ?? pid + "__" + uid), starData(uid, pid, o.star || {})); if (o.first) b.set(C1(db, pid), { esper: "akane-rin", count: o.count ?? 1 }); else b.update(C1(db, pid), { count: o.count }); return b.commit(); };
const takeStar = (db, uid, pid, count, o = {}) => { const b = writeBatch(db); if (!o.keep) b.delete(S1(db, o.sid ?? pid + "__" + uid)); if (!o.keepCount) b.update(C1(db, pid), { count }); return b.commit(); };
const s1 = ctxOf("s1", "s1@x.com"), s2 = ctxOf("s2", "s2@x.com"), s3 = ctxOf("s3", "s3@x.com"), s4 = ctxOf("s4", "s4@x.com");
await t("bintang: siapkan usulan yang akan diberi bintang", () => assertSucceeds(setDoc(B(s1, "s1_akane-rin"), mb("s1"))));
await t("bintang: pengguna login boleh memberi bintang pertama (bintang dan penghitung satu batch)", () => assertSucceeds(giveStar(s2, "s2", "s1_akane-rin", { first: true, count: 1 })));
await t("bintang: penghitung bisa dibaca tanpa login, juga lewat query per karakter", async () => {
  await assertSucceeds(getDoc(C1(anon, "s1_akane-rin")));
  await assertSucceeds(getDocs(query(collection(anon, "buildStars"), where("esper", "==", "akane-rin"))));
});
await t("bintang: pengguna kedua menambah jumlah menjadi 2", () => assertSucceeds(giveStar(s3, "s3", "s1_akane-rin", { count: 2 })));
await t("bintang: bintang kedua dari pengguna yang sama ditolak", () => assertFails(giveStar(s2, "s2", "s1_akane-rin", { count: 3 })));
await t("bintang: melompat 2 angka ditolak", () => assertFails(giveStar(s4, "s4", "s1_akane-rin", { count: 4 })));
await t("bintang: menambah penghitung tanpa dokumen bintang ditolak", () => assertFails(updateDoc(C1(s4, "s1_akane-rin"), { count: 3 })));
await t("bintang: tanpa login ditolak", () => assertFails(giveStar(anon, "x", "s1_akane-rin", { count: 3 })));
await t("bintang: atas nama orang lain atau id dokumen palsu ditolak", async () => {
  await assertFails(giveStar(s4, "s4", "s1_akane-rin", { count: 3, star: { uid: "s2" } }));
  await assertFails(giveStar(s4, "s4", "s1_akane-rin", { count: 3, sid: "s1_akane-rin__s2" }));
  await assertFails(giveStar(s4, "s4", "s1_akane-rin", { count: 3, star: { createdAt: new Date("2000-01-01") } }));
});
await t("bintang: usulan tidak ada atau karakter tidak cocok ditolak", async () => {
  await assertFails(giveStar(s4, "s4", "tidak-ada_akane-rin", { first: true, count: 1 }));
  await assertFails(giveStar(s4, "s4", "s1_akane-rin", { count: 3, star: { esper: "blackbird" } }));
});
await t("bintang: penghitung tidak bisa dibuat langsung dengan angka besar", () => assertFails(setDoc(C1(s4, "s1_akane-rin__x"), { esper: "akane-rin", count: 99 })));
await t("bintang: bintang tidak bisa dibaca orang lain, pemilik boleh membaca dan memakai query uid", async () => {
  await assertSucceeds(getDoc(S1(s2, "s1_akane-rin__s2")));
  await assertFails(getDoc(S1(s3, "s1_akane-rin__s2")));
  await assertFails(getDoc(S1(anon, "s1_akane-rin__s2")));
  await assertSucceeds(getDocs(query(collection(s2, "stars"), where("uid", "==", "s2"))));
  await assertFails(getDocs(collection(s2, "stars")));
});
await t("bintang: mencabut bintang sendiri menurunkan jumlah satu", () => assertSucceeds(takeStar(s2, "s2", "s1_akane-rin", 1)));
await t("bintang: mencabut tanpa menurunkan penghitung, atau menurunkan tanpa mencabut, ditolak", async () => {
  await assertFails(takeStar(s3, "s3", "s1_akane-rin", 1, { keepCount: true }));
  await assertFails(takeStar(s3, "s3", "s1_akane-rin", 0, { keep: true }));
});
await t("bintang: mencabut bintang orang lain ditolak", () => assertFails(takeStar(s4, "s4", "s1_akane-rin", 0, { sid: "s1_akane-rin__s3" })));
await t("bintang: penghitung tidak bisa dihapus dan jumlah tidak bisa menjadi negatif", async () => {
  await assertFails(deleteDoc(C1(s3, "s1_akane-rin")));
  await assertSucceeds(takeStar(s3, "s3", "s1_akane-rin", 0));
  await assertFails(updateDoc(C1(s3, "s1_akane-rin"), { count: -1 }));
});
await t("bintang: setelah dicabut, pengguna boleh memberi bintang lagi", () => assertSucceeds(giveStar(s2, "s2", "s1_akane-rin", { count: 1 })));
// meniru setStar di nte/fb.js (transaksi seperti yang dipakai situs)
const clientSetStar = (db, uid, pid, esper, on) => runTransaction(db, async (tx) => {
  const sref = doc(db, "stars", pid + "__" + uid), cref = doc(db, "buildStars", pid);
  const c = await tx.get(cref);
  if (on) {
    tx.set(sref, { uid, pid, esper, createdAt: serverTimestamp() });
    if (c.exists()) tx.update(cref, { count: c.data().count + 1 }); else tx.set(cref, { esper, count: 1 });
  } else {
    if (!c.exists()) return;
    tx.delete(sref);
    tx.update(cref, { count: Math.max(0, c.data().count - 1) });
  }
});
const s5 = ctxOf("s5", "s5@x.com"), s6 = ctxOf("s6", "s6@x.com");
await t("bintang (alur situs): proposal siap, bintang pertama lewat transaksi berhasil", async () => { await assertSucceeds(setDoc(B(s5, "s5_akane-rin"), mb("s5"))); await assertSucceeds(clientSetStar(s6, "s6", "s5_akane-rin", "akane-rin", true)); });
await t("bintang (alur situs): bintang kedua dari pengguna lain dan pencabutan lewat transaksi berhasil", async () => { await assertSucceeds(clientSetStar(s1, "s1", "s5_akane-rin", "akane-rin", true)); await assertSucceeds(clientSetStar(s6, "s6", "s5_akane-rin", "akane-rin", false)); const d = await getDoc(C1(anon, "s5_akane-rin")); if (d.data().count !== 1) throw new Error("jumlah seharusnya 1, bukan " + d.data().count); });
await t("bintang (alur situs): query bintang milik sendiri per karakter diizinkan", () => assertSucceeds(getDocs(query(collection(s1, "stars"), where("uid", "==", "s1"), where("esper", "==", "akane-rin")))));
await t("bintang: membaca dokumen bintang yang belum ada ditolak (karena itu klien tidak boleh membacanya, cukup membaca penghitung)", () => assertFails(getDoc(S1(s6, "s5_akane-rin__s6"))));
console.log(n + " uji aturan lulus");
await env.cleanup();
