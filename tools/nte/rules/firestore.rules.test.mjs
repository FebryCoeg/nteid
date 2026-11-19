// Uji aturan Firestore dengan emulator. Jalankan (butuh Java + firebase-tools + @firebase/rules-unit-testing):
//   firebase emulators:exec --only firestore "node firestore.rules.test.mjs"   (salin berkas ini ke folder yang berisi paketnya)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const env = await initializeTestEnvironment({ projectId: "demo-nte", firestore: { rules: readFileSync(process.env.RULES || "firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
const ADMIN = "febririansyah1999@gmail.com";
const ctxOf = (uid, email, verified = true) => env.authenticatedContext(uid, { email, email_verified: verified }).firestore();
const alice = ctxOf("alice", "alice@x.com"), bob = ctxOf("bob", "bob@x.com"), admin = ctxOf("adm", ADMIN), fakeAdmin = ctxOf("evil", ADMIN, false), anon = env.unauthenticatedContext().firestore();
const build = { arcs: ["a"], sets: [{ id: "Suit3", pieces: 4 }], stats: ["ATK %"], awks: [1], skills: ["basic"] };
const mk = (uid, over = {}) => ({ uid, name: "Alice", esper: "akane-rin", build, status: "pending", createdAt: serverTimestamp(), ...over });
const P = (db, id) => doc(db, "proposals", id);
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log("ok  " + name); };

await t("pengguna login boleh membuat usulan sendiri", () => assertSucceeds(setDoc(P(alice, "alice_akane-rin"), mk("alice"))));
await t("tanpa login ditolak", () => assertFails(setDoc(P(anon, "x_akane-rin"), mk("x"))));
await t("email belum terverifikasi ditolak", () => assertFails(setDoc(P(ctxOf("u9", "u9@x.com", false), "u9_akane-rin"), mk("u9"))));
await t("tidak boleh menulis atas nama orang lain (uid)", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("alice"))));
await t("id dokumen harus uid_esper", () => assertFails(setDoc(P(bob, "acak123"), mk("bob"))));
await t("status selain pending ditolak saat membuat", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { status: "approved" }))));
await t("bidang asing ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { isAdmin: true }))));
await t("build dengan bidang asing ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { build: { ...build, evil: 1 } }))));
await t("daftar terlalu panjang ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { build: { ...build, arcs: Array(13).fill("a") } }))));
await t("nama terlalu panjang ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { name: "x".repeat(81) }))));
await t("createdAt palsu ditolak", () => assertFails(setDoc(P(bob, "bob_akane-rin"), mk("bob", { createdAt: new Date("2000-01-01") }))));
await t("pemilik boleh mengganti usulannya", () => assertSucceeds(setDoc(P(alice, "alice_akane-rin"), mk("alice", { name: "Alice B" }))));
await t("pemilik tidak boleh menyetujui usulannya sendiri", () => assertFails(updateDoc(P(alice, "alice_akane-rin"), { status: "approved" })));
await t("pemilik boleh membaca usulannya", () => assertSucceeds(getDoc(P(alice, "alice_akane-rin"))));
await t("orang lain tidak boleh membaca", () => assertFails(getDoc(P(bob, "alice_akane-rin"))));
await t("anonim tidak boleh membaca", () => assertFails(getDoc(P(anon, "alice_akane-rin"))));
await t("daftar usulan milik sendiri boleh", () => assertSucceeds(getDocs(query(collection(alice, "proposals"), where("uid", "==", "alice")))));
await t("daftar semua usulan oleh pengguna biasa ditolak", () => assertFails(getDocs(collection(alice, "proposals"))));
await t("admin boleh membaca antrean pending", () => assertSucceeds(getDocs(query(collection(admin, "proposals"), where("status", "==", "pending")))));
await t("admin boleh mengubah status", () => assertSucceeds(updateDoc(P(admin, "alice_akane-rin"), { status: "approved", reviewedAt: serverTimestamp() })));
await t("admin tidak boleh mengubah isi build", () => assertFails(updateDoc(P(admin, "alice_akane-rin"), { build: { ...build, arcs: [] } })));
await t("admin palsu (email belum terverifikasi) ditolak", () => assertFails(updateDoc(P(fakeAdmin, "alice_akane-rin"), { status: "rejected" })));
await t("koleksi lain tertutup", () => assertFails(setDoc(doc(alice, "lain", "x"), { a: 1 })));
await t("pemilik boleh menghapus usulannya, orang lain tidak", async () => { await assertFails(deleteDoc(P(bob, "alice_akane-rin"))); await assertSucceeds(deleteDoc(P(alice, "alice_akane-rin"))); });
console.log(n + " uji aturan lulus");
await env.cleanup();
