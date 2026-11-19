// Uji aturan Firestore dengan emulator. Jalankan (butuh Java + firebase-tools + @firebase/rules-unit-testing):
//   firebase emulators:exec --only firestore "node firestore.rules.test.mjs"   (salin berkas ini ke folder yang berisi paketnya)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where, writeBatch } from "firebase/firestore";
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
const build = { name: "Nova Burst", arcs: ["ravenous-blade", "watch-your-heads"], sets: [{ id: "Suit3", pieces: 4 }], stats: ["CRIT DMG"], sub: ["DMG %"], why: "Cocok." };
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
await t("build: pemilik tidak boleh mengganti atau menghapus (sekali saja)", async () => { await assertFails(setDoc(B(alice, "alice_akane-rin"), mb("alice", { name: "Lain" }))); await assertFails(deleteDoc(B(alice, "alice_akane-rin"))); });
await t("build: karakter lain untuk pengguna sama boleh", () => assertSucceeds(setDoc(B(alice, "alice_blackbird"), mb("alice", { esper: "blackbird" }))));
await t("build: pemilik dan admin boleh membaca, orang lain tidak", async () => { await assertSucceeds(getDoc(B(alice, "alice_akane-rin"))); await assertSucceeds(getDoc(B(admin, "alice_akane-rin"))); await assertFails(getDoc(B(bob, "alice_akane-rin"))); await assertFails(getDoc(B(anon, "alice_akane-rin"))); });
await t("build: pemilik tidak boleh menyetujui sendiri, admin boleh ubah status saja", async () => { await assertFails(updateDoc(B(alice, "alice_akane-rin"), { status: "approved" })); await assertFails(updateDoc(B(admin, "alice_akane-rin"), { build: { ...build, name: "Lain" } })); await assertSucceeds(updateDoc(B(admin, "alice_akane-rin"), { status: "approved", reviewedAt: serverTimestamp() })); });
await t("build: admin palsu ditolak, daftar milik sendiri boleh, daftar semua ditolak", async () => { await assertFails(updateDoc(B(fakeAdmin, "alice_akane-rin"), { status: "rejected" })); await assertSucceeds(getDocs(query(collection(alice, "buildProposals"), where("uid", "==", "alice")))); await assertFails(getDocs(collection(alice, "buildProposals"))); await assertSucceeds(getDocs(query(collection(admin, "buildProposals"), where("status", "==", "approved")))); });
await t("build: admin boleh menghapus, lalu pengusul boleh mengirim lagi", async () => { await assertSucceeds(deleteDoc(B(admin, "alice_akane-rin"))); await assertSucceeds(setDoc(B(alice, "alice_akane-rin"), mb("alice"))); });
console.log(n + " uji aturan lulus");
await env.cleanup();
