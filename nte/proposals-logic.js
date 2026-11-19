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

  // Kredit pembuat: nama wajib, link Facebook opsional. Kesalahan ditambahkan ke errors; mengembalikan {name,url}.
  function sanitizeCredit(raw, errors) {
    const c = raw && typeof raw === "object" ? raw : {};
    const name = clean(c.name, MAX.credit);
    if (!name) errors.push("Nama pembuat (untuk kredit) wajib diisi.");
    let url = "";
    if (typeof c.url === "string" && c.url.trim()) {
      url = facebookUrl(c.url);
      if (!url) { errors.push("Link Facebook tidak valid. Gunakan alamat profil atau halaman di facebook.com."); url = ""; }
    }
    return { name, url };
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
    const cr = sanitizeCredit(raw.credit, errors);
    if (errors.length) return { team: null, errors };
    return { team: { name, members, roles, why, credit: cr }, errors };
  }

  // Usulan build: semua pilihan harus dari daftar yang dikenal (ctx.arcs, ctx.sets, ctx.stats, ctx.sub); teks bebas hanya nama dan catatan.
  const BMAX = { arcs: 4, sets: 3, stats: 3, sub: 4 };
  function pickList(raw, allowed, min, max, label, errors) {
    const ok = new Set(allowed || []);
    const src = Array.isArray(raw) ? raw : [];
    const out = [];
    let bad = !Array.isArray(raw);
    for (const v of src) { if (typeof v === "string" && ok.has(v) && !out.includes(v)) out.push(v); else bad = true; }
    if (bad) errors.push(label + ": ada pilihan yang tidak dikenal atau ganda.");
    else if (out.length < min || out.length > max) errors.push(label + ": pilih " + (min === max ? min : min + " sampai " + max) + ".");
    return out;
  }
  const SKILL_GROUPS = ["basic", "redirect", "ultimate", "support"];
  function sanitizeBuild(raw, ctx, pageEsper) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { build: null, errors: ["Data build tidak valid."] };
    const errors = [];
    const name = clean(raw.name, MAX.name);
    if (!name) errors.push("Nama build wajib diisi (maksimal " + MAX.name + " huruf).");
    else if (typeof raw.name === "string" && clean(raw.name, 1000).length > MAX.name) errors.push("Nama build terlalu panjang (maksimal " + MAX.name + " huruf).");
    const arcs = pickList(raw.arcs, ctx.arcs, 1, BMAX.arcs, "Arc", errors);
    const sets = [];
    const sin = Array.isArray(raw.sets) ? raw.sets : null;
    if (!sin || sin.length > BMAX.sets) errors.push("Set modul: maksimal " + BMAX.sets + " set.");
    else {
      const okSets = new Set(ctx.sets || []);
      for (const x of sin) {
        if (x && typeof x === "object" && okSets.has(x.id) && (x.pieces === 2 || x.pieces === 4) && !sets.some((y) => y.id === x.id)) sets.push({ id: x.id, pieces: x.pieces });
        else { errors.push("Set modul: ada set yang tidak dikenal, ganda, atau jumlah keping bukan 2 atau 4."); break; }
      }
    }
    const stats = pickList(raw.stats, ctx.stats, 1, BMAX.stats, "Stat utama", errors);
    const sub = pickList(raw.sub, ctx.sub, 0, BMAX.sub, "Sub-stat", errors);
    const awks = [];
    const ain = raw.awks === undefined ? [] : raw.awks;
    if (!Array.isArray(ain) || ain.length > 6) errors.push("Awakening: pilih maksimal 6.");
    else for (const n of ain) { if (Number.isInteger(n) && n >= 1 && n <= 6 && !awks.includes(n)) awks.push(n); else { errors.push("Awakening: pilihan tidak valid atau ganda."); break; } }
    const skills = pickList(raw.skills === undefined ? [] : raw.skills, SKILL_GROUPS, 0, SKILL_GROUPS.length, "Skill", errors);
    let team = null;
    if (raw.team !== undefined && raw.team !== null) {
      if (typeof raw.team !== "object" || Array.isArray(raw.team)) errors.push("Data tim tidak valid.");
      else {
        const min = Array.isArray(raw.team.members) ? raw.team.members : [];
        if (min.length > 1 || (min.length === 1 && min[0] !== pageEsper)) {
          const known = new Set(ctx.espers || []);
          const members = []; let bad = false;
          for (const m of min) { if (typeof m === "string" && known.has(m) && !members.includes(m)) members.push(m); else bad = true; }
          if (bad) errors.push("Tim: ada anggota yang tidak dikenal atau ganda.");
          if (members.length < MAX.minMembers || members.length > MAX.members) errors.push("Tim harus berisi " + MAX.minMembers + " sampai " + MAX.members + " karakter.");
          if (!members.includes(pageEsper)) errors.push("Karakter halaman ini harus ada di dalam tim.");
          const rin = Array.isArray(raw.team.roles) ? raw.team.roles : [];
          team = { members, roles: members.map((_, i) => clean(rin[i], MAX.role)) };
        }
      }
    }
    const why = clean(raw.why, MAX.why);
    const credit = sanitizeCredit(raw.credit, errors);
    if (errors.length) return { build: null, errors };
    const build = { name, arcs, sets, stats, sub, awks, skills, why, credit };
    if (team) build.team = team;
    return { build, errors };
  }

  // Kunci tim: anggota diurutkan lalu digabung, jadi susunan yang sama selalu punya kunci yang sama.
  const teamKey = (members) => (Array.isArray(members) ? members.slice().sort().join(".") : "");
  const sameTeam = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && teamKey(a) === teamKey(b);
  const duplicateOf = (members, list) => (Array.isArray(list) ? list.find((t) => t && Array.isArray(t.members) && sameTeam(members, t.members)) || null : null);

  const SAFE = /^[A-Za-z0-9_-]{1,128}$/;
  const docId = (uid, esper) => (typeof uid === "string" && typeof esper === "string" && SAFE.test(uid) && SAFE.test(esper) ? uid + "_" + esper : null);

  return { MAX, clean, facebookUrl, sanitizeTeam, sanitizeBuild, docId, teamKey, sameTeam, duplicateOf };
});
