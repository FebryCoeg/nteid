/* Logika usulan tim komunitas (tanpa DOM): pembersihan teks, validasi tim, link Facebook, id dokumen.
 * Usulan berasal dari pengguna lain, jadi dianggap tak tepercaya. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteProposals = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const MAX = { name: 40, role: 24, why: 300, credit: 40, url: 200, members: 4, minMembers: 2 };
  const FB_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "mbasic.facebook.com", "fb.com", "www.fb.com"]);

  // Rapikan teks bebas: buang karakter kontrol, ratakan spasi/baris baru, potong.
  const CTRL = new RegExp("[\u0000-\u001f\u007f-\u009f\u2028\u2029]+", "g");
  const clean = (v, max) => (typeof v === "string" ? v.replace(CTRL, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

  // Hanya alamat Facebook resmi (https). Mengembalikan alamat yang sudah dinormalkan, atau null.
  function facebookUrl(input) {
    if (typeof input !== "string") return null;
    let s = input.trim();
    if (!s || s.length > MAX.url + 50) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    let u;
    try { u = new URL(s); } catch (e) { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password || u.port) return null;
    if (!FB_HOSTS.has(u.hostname.toLowerCase())) return null;
    if (u.pathname.length <= 1) return null;
    const out = "https://" + u.hostname.toLowerCase() + u.pathname + u.search;
    return out.length <= MAX.url ? out : null;
  }

  function sanitizeTeam(raw, ctx, pageEsper) {
    const errors = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { team: null, errors: ["Data tim tidak valid."] };
    const known = new Set(ctx.espers);
    const name = clean(raw.name, MAX.name);
    if (!name) errors.push("Nama tim wajib diisi (maksimal " + MAX.name + " huruf).");
    else if (typeof raw.name === "string" && clean(raw.name, 1000).length > MAX.name) errors.push("Nama tim terlalu panjang (maksimal " + MAX.name + " huruf).");
    const mem = Array.isArray(raw.members) ? raw.members : [];
    const members = [];
    let bad = false;
    for (const m of mem) { if (typeof m === "string" && known.has(m) && !members.includes(m)) members.push(m); else bad = true; }
    if (bad) errors.push("Ada anggota tim yang tidak dikenal atau ganda.");
    if (members.length < MAX.minMembers || members.length > MAX.members) errors.push("Tim harus berisi " + MAX.minMembers + " sampai " + MAX.members + " karakter.");
    if (!members.includes(pageEsper)) errors.push("Karakter halaman ini harus ada di dalam tim.");
    const rolesIn = Array.isArray(raw.roles) ? raw.roles : [];
    const roles = members.map((_, i) => clean(rolesIn[i], MAX.role));
    const why = clean(raw.why, MAX.why);
    const c = raw.credit && typeof raw.credit === "object" ? raw.credit : {};
    const cname = clean(c.name, MAX.credit);
    if (!cname) errors.push("Nama pembuat tim (untuk kredit) wajib diisi.");
    let url = "";
    if (typeof c.url === "string" && c.url.trim()) {
      url = facebookUrl(c.url);
      if (!url) { errors.push("Link Facebook tidak valid. Gunakan alamat profil atau halaman di facebook.com."); url = ""; }
    }
    if (errors.length) return { team: null, errors };
    return { team: { name, members, roles, why, credit: { name: cname, url } }, errors };
  }

  // Kunci tim: anggota diurutkan lalu digabung, jadi susunan yang sama selalu punya kunci yang sama.
  const teamKey = (members) => (Array.isArray(members) ? members.slice().sort().join(".") : "");
  const sameTeam = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && teamKey(a) === teamKey(b);
  const duplicateOf = (members, list) => (Array.isArray(list) ? list.find((t) => t && Array.isArray(t.members) && sameTeam(members, t.members)) || null : null);

  const SAFE = /^[A-Za-z0-9_-]{1,128}$/;
  const docId = (uid, esper) => (typeof uid === "string" && typeof esper === "string" && SAFE.test(uid) && SAFE.test(esper) ? uid + "_" + esper : null);

  return { MAX, clean, facebookUrl, sanitizeTeam, docId, teamKey, sameTeam, duplicateOf };
});
