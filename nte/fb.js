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

export async function submit(user, esper, build, id) {
  await F.setDoc(F.doc(db, COL, id), { uid: user.uid, name: String(user.displayName || "Pengguna").slice(0, 80), esper, build, status: "pending", createdAt: F.serverTimestamp() });
}
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
export async function mine(user) { return rows(await F.getDocs(F.query(F.collection(db, COL), F.where("uid", "==", user.uid)))); }
export async function pending() { return rows(await F.getDocs(F.query(F.collection(db, COL), F.where("status", "==", "pending")))); }
export const setStatus = (id, status) => F.updateDoc(F.doc(db, COL, id), { status, reviewedAt: F.serverTimestamp() });
export const remove = (id) => F.deleteDoc(F.doc(db, COL, id));
