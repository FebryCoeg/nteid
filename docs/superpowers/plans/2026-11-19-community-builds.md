# Usulan Build Komunitas (login Google + persetujuan admin)

> Dikerjakan sendiri di sesi (executing-plans, tanpa subagent). Langkah memakai checkbox.

**Goal:** Pengunjung login dengan Google, mengusulkan perubahan build karakter; hanya admin (satu akun Google) yang menyetujui. Yang disetujui masuk ke `nte/data/builds.json` lewat editor admin yang sudah ada.

**Spec (persetujuan pemilik situs, percakapan 2026-11-19):** Firebase (Auth Google + Firestore, paket Spark gratis); situs tetap di GitHub Pages; build disetujui diekspor ke `builds.json` di GitHub (data utama tetap di repo); admin = `febririansyah1999@gmail.com`; tidak push sebelum "Ya, push".

## Global Constraints
- Situs statis tanpa framework, dwibahasa lewat `S()`, `make_pages.py --bump` setelah ubah aset, rute baru di `PAGES` + menu.
- SDK Firebase dimuat malas dari `gstatic.com` hanya di halaman `/usulan` dan `/admin`; versi dipatok `10.14.1`. Beranda tidak ikut memuat.
- Konfigurasi Firebase bersifat publik (`nte/fb-config.js`); tidak ada kunci rahasia di repo.
- Data usulan tidak tepercaya: dibersihkan di klien (`proposals-logic.js`) dan dibatasi di aturan Firestore (ukuran, kunci, kepemilikan).
- Data pribadi yang disimpan: uid, nama tampilan Google, usulan. Ada catatan privasi di halaman.
- Commit diakhiri `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Format build (`builds.json`)
`{ arcs: string[] (slug Arc), sets: {id, pieces: 2|4}[], stats: string[], awks: number[1..6], skills: ("basic"|"redirect"|"ultimate"|"support")[] }`

## Review Focus
- Usulan berisi slug/id/stat asing atau string raksasa: dibuang/ditolak sebelum dikirim.
- Pengguna mencoba menulis dokumen orang lain, mengubah status sendiri, atau membaca usulan orang lain: ditolak aturan.
- Admin menyetujui usulan untuk Esper yang buildnya sudah berubah: tampil perbandingan, bukan menimpa diam-diam.
- Pengunjung tanpa login atau SDK gagal dimuat (offline/diblokir): pesan jelas, situs lain tak terganggu.
- Popup login diblokir (ponsel): pesan petunjuk.

## Tasks
### Task 1: Logika usulan (TDD) — `nte/proposals-logic.js`, `tools/nte/tests/proposals.test.js`
**Interface:** `NteProposals.sanitizeBuild(raw, ctx: {arcs: string[], sets: string[], stats: string[]}): {build, dropped: number}`; `NteProposals.isEmpty(build): boolean`; `NteProposals.diff(oldB, newB): {field, before, after}[]`; `NteProposals.docId(uid, esper): string`.
- [ ] Tes gagal dulu, implement, lulus, commit.

### Task 2: Aturan Firestore — `docs/firebase/firestore.rules`
- [ ] Tulis aturan (id dokumen = `uid_esper`, pemilik boleh tulis hanya status `pending`, admin boleh ubah status, baca: admin atau pemilik, batas ukuran). Ditinjau manual (tanpa emulator).

### Task 3: Halaman `/usulan` + `nte/fb.js` + `nte/fb-config.js`
- [ ] Login Google, editor build (arc, set, awakening, skill, stat), kirim usulan, daftar "usulanku", catatan privasi; menu + `PAGES`.

### Task 4: Antrean admin di `/admin`
- [ ] Login Google admin, daftar usulan menunggu, perbandingan sebelum/sesudah, Terapkan (memuat ke form admin lalu "Simpan ke GitHub" yang sudah ada, lalu tandai disetujui), Tolak.

### Task 5: Verifikasi
- [ ] Tes lulus, halaman termuat tanpa galat konsol, pesan jika SDK gagal; commit; jangan push.
