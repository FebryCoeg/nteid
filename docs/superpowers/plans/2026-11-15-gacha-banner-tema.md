# Gacha: Banner, Ikon SVG, dan Tema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (dipilih pemilik situs: dikerjakan sendiri di sesi). Langkah memakai checkbox.

**Goal:** (1) papan gacha bertema pasar malam, (2) banner bisa diganti lewat data, (3) setiap kotak berikon SVG buatan sendiri yang mirip game.

**Architecture:** Banner = satu entri di `nte/data/gacha-banners.json` (karakter S-Class, berkas papan, warna). Mesin menyimpan keadaan bersama (pity S, Modified, Points Gift, duplikat, total roll) dan keadaan per papan (posisi, jumlah roll papan untuk bonus skin). Ikon dan latar berupa berkas SVG di `nte/img/gacha/`, dipakai lewat CSS.

**Tech Stack:** JS murni, `node:test`, SVG tulisan tangan. Tanpa dependensi baru.

**Spec:** `docs/superpowers/specs/2026-11-15-gacha-simulator-design.md` dan persetujuan pemilik situs 2026-11-15 (pesan "ya setuju" atas rancangan banner/tema/ikon).

## Global Constraints

- Sama dengan rencana sebelumnya: situs statis, tanpa dependensi baru, dwibahasa lewat `S()`, `localStorage` dibungkus try/catch, `make_pages.py --bump` setelah ubah aset, commit diakhiri `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`, jangan push sebelum pemilik situs bilang "push".
- Pity S-Class, kemajuan Modified, dan Points Gift dipakai bersama antar papan Limited; bonus skin (50/120/200 roll) per papan (aturan resmi, spec "Fakta").
- Gambar ikon dibuat sendiri (terinspirasi game, bukan salinan aset game).
- Penyimpanan lama (`nte_gacha_v1`) tidak dimigrasi; kunci baru `nte_gacha_v2`, mulai dari awal sekali.

## Review Focus

- Ganti banner di tengah siklus pity: pity, mode Modified, dan hitungan Points Gift tetap; posisi bidak dan bonus skin berpisah per papan.
- Banner yang `featuredS`-nya tidak ada di data Esper atau berkas papannya gagal dimuat: halaman menampilkan pesan, tidak error.
- Data `nte_gacha_v2` rusak atau berisi papan yang tak dikenal: kembali ke awal tanpa error.
- Klik ganti banner saat animasi berjalan diabaikan.
- Tiap jenis kotak di papan punya ikon SVG; jenis tanpa ikon tidak membuat halaman kosong.

---

### Task 1: Keadaan bersama vs per papan, dan data banner

**Files:** Create `nte/data/gacha-banners.json`; Modify `nte/gacha-engine.js`; Test `tools/nte/tests/gacha-engine.test.js`

**Interfaces:**
- Produces: `State` ditambah `board: string` (papan aktif, bawaan `"main"`), `positions: {[boardId]: number}`, `boardRolls: {[boardId]: number}`. `applyRoll` menaikkan `boardRolls[state.board]` dan memakai itu (bukan `total`) untuk bonus skin; Points Gift tetap memakai `total`. `switchBoard(state: State, boardId: string, board: Board): State` menyimpan `pos` papan lama di `positions`, mengisi `pos` papan baru dari `positions[boardId]` atau `board.start`, mengganti `board`. `restoreState` memvalidasi bidang baru.
- `gacha-banners.json`: `{ "default": "scarborough-fair", "banners": [{ "id", "name", "featuredS", "boardFile", "boardId", "accent", "boardConfirmed" }] }`.

- [ ] Tes gagal dulu: `switchBoard` menjaga `sinceS/mode/total/obtained` dan memisahkan `pos`; bonus skin per papan (50 roll di papan A lalu pindah ke B tidak memicu bonus glider di B sampai B sendiri 50 roll); `restoreState` menolak `board` bukan string dan `positions` bukan angka; banner: `featuredS` setiap entri ada di `espers.json` dan `boardFile` ada di `nte/data/`.
- [ ] Implement.
- [ ] Jalankan `node --test "tools/nte/tests/*.test.js"` → semua lulus. Commit.

### Task 2: Ikon kotak SVG

**Files:** Create `nte/img/gacha/tile-<jenis>.svg` untuk `hero apprentice lost journeyS journeyA arclight fashion roll1 roll5 outfit livery arrowIn arrowOut` dan `slumber.svg`; Test: berkas ada dan berisi `<svg` dengan `viewBox="0 0 64 64"`.

- [ ] Tes gagal dulu (daftar jenis dari `gacha-board.json`: setiap `type` unik punya berkas, selain `start`).
- [ ] Gambar SVG: alas kotak membulat bergradasi + sorot + tepi berwarna per jenis, ikon di tengah (tas/peti, bidak catur, lencana karakter dengan huruf S atau A, kotak tanda tanya, dadu bertitik, baju, mobil, glider, panah, papan tanda Z).
- [ ] Commit.

### Task 3: Tema latar pasar malam

**Files:** Create `nte/img/gacha/bg-fair.svg`; Modify `nte/app.css`

- [ ] Gambar SVG latar 1305x615 (area peta): langit senja, kincir raksasa di tengah, balon udara, koin bintang, kain harlequin, balok bermotif bintang di pinggir; tidak menutupi area kotak.
- [ ] CSS: `.gc-board` memakai `bg-fair.svg`, kotak memakai ikon SVG sebagai `background-image` (label jumlah tetap teks), aksen banner lewat variabel `--gc-accent`.
- [ ] Commit.

### Task 4: Pilihan banner dan keadaan baru di halaman

**Files:** Modify `nte/app.js` (`viewGacha`)

- [ ] Muat `gacha-banners` dan papan tiap banner; chip pilihan banner di atas papan (diabaikan saat `busy`); `R.pool.featuredS` mengikuti banner; ganti banner memanggil `GachaEngine.switchBoard`, menggambar ulang papan, mengganti nama, aksen, dan bidak.
- [ ] Kunci penyimpanan `nte_gacha_v2`; riwayat mencatat `banner`; gambar bagikan memuat nama banner; banner/papan gagal dimuat → pesan.
- [ ] Catatan halaman: banner yang `boardConfirmed: false` ditandai "susunan papan perkiraan".
- [ ] Jalankan `python tools/nte/make_pages.py --bump`.
- [ ] Commit.

### Task 5: Verifikasi

- [ ] `node --test "tools/nte/tests/*.test.js"` lulus; `node --check nte/app.js nte/gacha-engine.js`.
- [ ] Browser: desktop dan ponsel 375 px; ganti banner (tambah banner percobaan sementara di data, lalu hapus), pity tetap; data rusak; tanpa error di konsol.
- [ ] Commit; jangan push.
