// Pembungkus Firebase (Login Google + Firestore). Dimuat malas hanya di /usulan dan halaman admin.
import { firebaseConfig, ADMIN_EMAIL } from "./fb-config.js";
const G = "https://www.gstatic.com/firebasejs/10.14.1/";
const [{ initializeApp }, A, F] = await Promise.all([import(G + "firebase-app.js"), import(G + "firebase-auth.js"), import(G + "firebase-firestore.js")]);
const app = initializeApp(firebaseConfig);
const auth = A.getAuth(app), db = F.getFirestore(app);
const COL = "proposals";

export const isAdmin = (u) => !!u && u.email === ADMIN_EMAIL && u.emailVerified === true;
export const onUser = (cb) => A.onAuthStateChanged(auth, cb);
export const login = () => A.signInWithPopup(auth, new A.GoogleAuthProvider());
export const logout = () => A.signOut(auth);

// Kunci tim ("<esper>__<anggota diurutkan>") dibuat bersama usulan dalam satu batch: tim kembar hanya bisa diusulkan sekali.
export async function submit(user, esper, key, team, credit, id) {
  const batch = F.writeBatch(db);
  batch.set(F.doc(db, "locks", esper + "__" + key), { uid: user.uid, createdAt: F.serverTimestamp() });
  batch.set(F.doc(db, COL, id), { uid: user.uid, name: String(user.displayName || "Pengguna").slice(0, 80), esper, key, team, credit, status: "pending", createdAt: F.serverTimestamp() });
  await batch.commit();
}
export async function lockTaken(esper, key) { return (await F.getDoc(F.doc(db, "locks", esper + "__" + key))).exists(); }
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
export async function mine(user) { return rows(await F.getDocs(F.query(F.collection(db, COL), F.where("uid", "==", user.uid)))); }
export async function pending() { return rows(await F.getDocs(F.query(F.collection(db, COL), F.where("status", "==", "pending")))); }
export const setStatus = (id, status) => F.updateDoc(F.doc(db, COL, id), { status, reviewedAt: F.serverTimestamp() });

// ---- usulan build lengkap (koleksi terpisah, satu per pengguna per karakter) ----
const BCOL = "buildProposals";
export async function submitBuild(user, esper, build, credit, id) {
  await F.setDoc(F.doc(db, BCOL, id), { uid: user.uid, name: String(user.displayName || "Pengguna").slice(0, 80), esper, build, credit, status: "pending", createdAt: F.serverTimestamp() });
}
export async function mineBuilds(user) { return rows(await F.getDocs(F.query(F.collection(db, BCOL), F.where("uid", "==", user.uid)))); }
export async function pendingBuilds() { return rows(await F.getDocs(F.query(F.collection(db, BCOL), F.where("status", "==", "pending")))); }
export const setBuildStatus = (id, status) => F.updateDoc(F.doc(db, BCOL, id), { status, reviewedAt: F.serverTimestamp() });
// Pemilik mengedit usulannya sendiri; status otomatis kembali ke "pending" supaya admin menyetujui ulang.
export const updateBuild = (id, build, credit) => F.updateDoc(F.doc(db, BCOL, id), { build, credit, status: "pending", updatedAt: F.serverTimestamp() });

// ---- bintang untuk build komunitas ----
export const current = () => auth.currentUser;
export const whenUser = () => new Promise((res) => { const un = A.onAuthStateChanged(auth, (u) => { un(); res(u); }); });
export async function myStars(uid, esper) {
  const snap = await F.getDocs(F.query(F.collection(db, "stars"), F.where("uid", "==", uid), F.where("esper", "==", esper)));
  return new Set(snap.docs.map((d) => d.data().pid));
}
// Bintang dan penghitung diubah bersama dalam satu transaksi (aturan Firestore menjaga +1 / -1).
// Yang dibaca hanya penghitung (publik). Dokumen bintang tidak dibaca karena membaca dokumen yang belum ada ditolak aturan;
// status "sudah memberi bintang" berasal dari myStars().
export async function setStar(user, pid, esper, on) {
  const sref = F.doc(db, "stars", pid + "__" + user.uid), cref = F.doc(db, "buildStars", pid);
  await F.runTransaction(db, async (tx) => {
    const c = await tx.get(cref);
    if (on) {
      tx.set(sref, { uid: user.uid, pid, esper, createdAt: F.serverTimestamp() });
      if (c.exists()) tx.update(cref, { count: c.data().count + 1 }); else tx.set(cref, { esper, count: 1 });
    } else {
      if (!c.exists()) return;
      tx.delete(sref);
      tx.update(cref, { count: Math.max(0, c.data().count - 1) });
    }
  });
}
