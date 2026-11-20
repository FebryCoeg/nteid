/* Logika usulan tim komunitas (tanpa DOM): pembersihan teks, validasi tim, link Facebook, id dokumen.
 * Usulan berasal dari pengguna lain, jadi dianggap tak tepercaya. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.NteProposals = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const MAX = { name: 40, role: 24, why: 300, credit: 40, url: 200, members: 4, minMembers: 2, rotation: 500, rotSteps: 50 };
  // Link Media: alamat profil/halaman di media sosial populer (bukan situs sembarang). Subdomain resmi ikut diterima.
  const MEDIA_DOMAINS = ["facebook.com", "fb.com", "instagram.com", "youtube.com", "youtu.be", "tiktok.com", "x.com", "twitter.com", "threads.net", "discord.gg", "discord.com", "twitch.tv", "linktr.ee", "reddit.com", "github.com", "t.me", "saweria.co", "trakteer.id"];
  const mediaHost = (h) => MEDIA_DOMAINS.some((d) => h === d || h.endsWith("." + d));

  // Rapikan teks bebas: buang karakter kontrol, ratakan spasi/baris baru, potong.
  const CTRL = new RegExp("[\u0000-\u001f\u007f-\u009f\u2028\u2029]+", "g");
  const clean = (v, max) => (typeof v === "string" ? v.replace(CTRL, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

  // Hanya alamat https dari daftar media sosial. Mengembalikan alamat yang sudah dinormalkan, atau null.
  function mediaUrl(input) {
    if (typeof input !== "string") return null;
    let s = input.trim();
    if (!s || s.length > MAX.url + 50) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    let u;
    try { u = new URL(s); } catch (e) { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (u.username || u.password || u.port) return null;
    if (!mediaHost(u.hostname.toLowerCase())) return null;
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
      url = mediaUrl(c.url);
      if (!url) { errors.push("Link Media tidak valid. Gunakan alamat profil atau halaman dari media sosial (Facebook, Instagram, YouTube, TikTok, X, dan sejenisnya)."); url = ""; }
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
  // Aksi dalam rotasi: tombol E, tombol Q, klik kiri (serangan dasar), tahan klik kiri, dan Switch (ganti ke karakter itu).
  const ROT_ACTIONS = ["e", "q", "atk", "hold", "switch"];
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
    const rot = [];
    const rin = raw.rot === undefined ? [] : raw.rot;
    if (!Array.isArray(rin) || rin.length > MAX.rotSteps) errors.push("Rotasi: maksimal " + MAX.rotSteps + " langkah.");
    else {
      const who = new Set(team ? team.members : [pageEsper]);
      for (const x of rin) {
        if (x && typeof x === "object" && !Array.isArray(x) && who.has(x.c) && ROT_ACTIONS.includes(x.a)) rot.push({ c: x.c, a: x.a });
        else { errors.push("Rotasi: ada langkah dengan karakter di luar tim atau aksi yang tidak dikenal."); break; }
      }
    }
    // Titik repeat: nomor langkah (mulai 0) tempat rotasi kembali setelah langkah terakhir. null = tidak diulang.
    let repeat = null;
    if (rot.length && raw.repeat !== undefined && raw.repeat !== null) {
      if (Number.isInteger(raw.repeat) && raw.repeat >= 0 && raw.repeat < rot.length) repeat = raw.repeat;
      else errors.push("Rotasi: titik ulang berada di luar rangkaian langkah.");
    }
    const why = clean(raw.why, MAX.why);
    const rotation = clean(raw.rotation, MAX.rotation);
    const credit = sanitizeCredit(raw.credit, errors);
    if (errors.length) return { build: null, errors };
    const build = { name, arcs, sets, stats, sub, awks, skills, rot, repeat, rotation, why, credit };
    if (team) build.team = team;
    return { build, errors };
  }

  // ---- bintang dan build utama ----
  const SAFE_PID = /^[A-Za-z0-9_-]{1,200}$/;
  // id dokumen bintang: "<pid>__<uid>" (satu bintang per pengguna per build)
  const starId = (pid, uid) => (typeof pid === "string" && typeof uid === "string" && SAFE_PID.test(pid) && SAFE_PID.test(uid) ? pid + "__" + uid : null);
  // urut bintang terbanyak dulu; seri mengikuti urutan awal; tidak mengubah larik asli
  const rankByStars = (list, counts) => {
    const c = counts && typeof counts === "object" ? counts : {};
    return (Array.isArray(list) ? list : []).map((x, i) => ({ x, i, n: Number(c[x && x.pid]) || 0 })).sort((a, b) => b.n - a.n || a.i - b.i).map((o) => o.x);
  };
  // Mengubah build komunitas terpilih menjadi data tab Build (hanya isi komunitas, tanpa catatan bawaan build resmi).
  const arr = (v) => (Array.isArray(v) ? v : []);
  function featuredBuild(f) {
    if (!f || typeof f !== "object" || Array.isArray(f)) return null;
    const c = f.credit && typeof f.credit === "object" ? f.credit : {};
    const t = f.team && typeof f.team === "object" && Array.isArray(f.team.members) && f.team.members.length > 1 ? f.team : null;
    const both = (v) => ({ id: String(v || ""), en: String(v || "") });
    return {
      name: clean(f.name, MAX.name),
      arcs: arr(f.arcs), sets: arr(f.sets), stats: arr(f.stats), sub: arr(f.sub), awks: arr(f.awks), skills: arr(f.skills),
      teams: t ? [{ name: both(clean(f.name, MAX.name)), members: t.members.slice(), roles: t.members.map((_, i) => both(arr(t.roles)[i])), tag: { id: "DIPILIH DARI KOMUNITAS", en: "PICKED FROM THE COMMUNITY" }, why: f.why ? [both(clean(f.why, MAX.why))] : [] }] : [],
      rot: arr(f.rot), repeat: Number.isInteger(f.repeat) ? f.repeat : null, rotation: clean(f.rotation, MAX.rotation), why: clean(f.why, MAX.why),
      credit: { name: clean(c.name, MAX.credit), url: mediaUrl(c.url || "") || "" },
    };
  }

  // ---- daftar pilihan stat untuk formulir usulan ----
  // Diambil dari build bawaan, lalu ditambah stat yang pasti ada dan dikurangi yang tidak dipakai.
  const ALWAYS_STAT = ["Break Intensity"];
  const ALWAYS_SUB = ["Break Intensity"];
  const DROP_SUB = ["Universal DMG %"];
  function statVocab(curated) {
    const st = new Set(ALWAYS_STAT), sb = new Set(ALWAYS_SUB);
    Object.values(curated && typeof curated === "object" ? curated : {}).forEach((v) => {
      if (!v || typeof v !== "object") return;
      (Array.isArray(v.stats) ? v.stats : []).forEach((x) => { if (typeof x === "string" && x) st.add(x); });
      (Array.isArray(v.sub) ? v.sub : []).forEach((x) => { if (typeof x === "string" && x) sb.add(x); });
    });
    DROP_SUB.forEach((x) => sb.delete(x));
    return { stats: [...st].sort(), sub: [...sb].sort() };
  }

  // Kunci tim: anggota diurutkan lalu digabung, jadi susunan yang sama selalu punya kunci yang sama.
  const teamKey = (members) => (Array.isArray(members) ? members.slice().sort().join(".") : "");
  const sameTeam = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && teamKey(a) === teamKey(b);
  const duplicateOf = (members, list) => (Array.isArray(list) ? list.find((t) => t && Array.isArray(t.members) && sameTeam(members, t.members)) || null : null);

  // Bentrok tim saat mengirim atau mengedit. Saat mengedit, pemeriksaan hanya berlaku bila anggota tim diubah
  // (usulan lama yang sudah disetujui tidak boleh terkunci karena ada tim lain yang kebetulan sama).
  function teamClash(members, previousMembers, published) {
    if (!Array.isArray(members) || !members.length) return null;
    if (Array.isArray(previousMembers) && sameTeam(members, previousMembers)) return null;
    return duplicateOf(members, published);
  }

  const SAFE = /^[A-Za-z0-9_-]{1,128}$/;
  const docId = (uid, esper) => (typeof uid === "string" && typeof esper === "string" && SAFE.test(uid) && SAFE.test(esper) ? uid + "_" + esper : null);

  return { teamClash, statVocab, starId, rankByStars, featuredBuild, MAX, ROT_ACTIONS, clean, mediaUrl, MEDIA_DOMAINS, sanitizeTeam, sanitizeBuild, docId, teamKey, sameTeam, duplicateOf };
});
