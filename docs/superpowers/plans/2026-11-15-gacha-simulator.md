# Simulator Gacha Papan Dadu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halaman `/gacha` di nteid.site berisi simulator papan dadu Esper (papan Scarborough Fair, S-Class featured Elyms) dengan angka resmi dari game; tab Arc ditutup sampai aturannya ada.

**Architecture:** Mesin murni tanpa DOM (`nte/gacha-engine.js`, bisa dipakai browser dan `node --test`) membaca dua berkas data: aturan resmi (`gacha-rules.json`) dan papan (`gacha-board.json`, dihasilkan skrip Python dari screenshot). Tampilan (`viewGacha` di `nte/app.js`) hanya menggambar papan dan memanggil mesin.

**Tech Stack:** JavaScript murni tanpa framework, `node:test` bawaan Node (tanpa instal paket), Python + Pillow untuk skrip data (sudah dipakai proyek).

**Spec:** `docs/superpowers/specs/2026-11-15-gacha-simulator-design.md`

## Global Constraints

- Situs statis tanpa framework, di GitHub Pages; tanpa dependensi baru (jangan `npm install` atau `pip install`).
- Halaman baru `/gacha`: tambah rute di `nte/app.js`, tautan menu di `index.html` dan `404.html` (identik), entri di `PAGES` pada `tools/nte/make_pages.py`; setelah itu `python tools/nte/make_pages.py --bump`.
- Dwibahasa: semua teks lewat `S("indonesia", "english")`; teks menu statis dipetakan di `ST_TEXT`.
- Penyimpanan hanya `localStorage`, tiap baca/tulis dibungkus try/catch; halaman harus jalan tanpanya.
- Gambar Esper/Arc memakai yang ada di `nte/img`; tidak menyalin aset game lain ke situs. Screenshot papan hanya dibaca skrip dan tidak masuk repo.
- Angka resmi hanya dari spec bagian "Fakta"; hal yang tidak diketahui ditandai "perkiraan" di halaman dan di data (`"confirmed": false`).
- Pesan commit diakhiri `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Jangan `git push` sebelum pemilik situs menyatakan "push".

## Review Focus

- Rangkaian dadu gratis (Roll Again, Multiple Surprises) di tengah Roll 10x: roll tambahan jalan langsung setelah roll yang memicunya, ikut menambah hitungan pity dan total roll, dan tidak membuat loop tak berhingga.
- Roll ke-89 tanpa S-Class: roll berikutnya bidak tidak bergerak dan hasilnya S-Class featured, juga bila roll itu adalah dadu gratis.
- Batas Modified: S-Class di roll ke-70 → papan kembali Baseline; tanpa S di roll ke-70 → roll ke-71 sudah Modified.
- `localStorage` rusak atau berisi data lama/ngawur: halaman memulai dari keadaan awal tanpa error.
- Klik Roll berkali-cepat saat animasi: tidak ada roll ganda dan keadaan tidak rusak (tombol terkunci sampai animasi selesai).

---

## File Structure

- Create `nte/data/gacha-rules.json`: semua angka resmi dan pool, tiap blok punya `source` dan `confirmed`.
- Create `nte/gacha-engine.js`: mesin murni (RNG, keadaan, pity, hadiah, gerak di papan).
- Create `tools/nte/tests/gacha-engine.test.js`: uji mesin dengan `node --test`.
- Create `tools/nte/extract_board.py`: baca screenshot peta → `nte/data/gacha-board.json` + gambar periksa.
- Create `tools/nte/board_stats.py`: simulasi jalan di papan, bandingkan dengan angka resmi.
- Create `nte/data/gacha-board.json`: kotak, rute, blok.
- Modify `nte/app.js`: rute `/gacha`, `viewGacha`, `ST_TEXT`.
- Modify `nte/app.css`: gaya `.gc-*`.
- Modify `index.html`, `404.html`, `tools/nte/make_pages.py`: menu, halaman statis, `<script>` mesin sebelum `app.js`.

---

### Task 1: Data aturan resmi

**Files:**
- Create: `nte/data/gacha-rules.json`
- Test: `tools/nte/tests/gacha-engine.test.js`

**Interfaces:**
- Produces: `rules` dengan kunci `s` {`baseRate: 0.0099`, `modifiedRate: 0.1959`, `modifiedAfter: 70`, `hardPity: 90`}, `landing` (peta jenis kotak → peluang mendarat), `tileContent` (isi Apprentice/Hero/Journey), `gift` {`every: 10`, `aChar: 0.2`, `aArc: 0.8`}, `dup` {`sMindShard: 1`, `sWarp: 40`, `sWarpLate: 80`, `lateFrom: 8`, `aWarp: 6`, `aWarpLate: 12`, `aArcBonusWarp: 4`, `bArcBonusLost: 20`}, `skin` {`outfit: {atRolls: 200, dupWarp: 16}`, `livery: {atRolls: 120, dupWarp: 16}`, `glider: {atRolls: 50, dupWarp: 4}`}, `cost` {`perRoll: 160`}, `pool` {`featuredS: "elyms"`, `confirmed: false`, `note`}.
- Jenis kotak (`type`): `hero`, `apprentice`, `lost`, `journeyS`, `journeyA`, `arclight`, `fashion`, `roll1`, `roll5`, `outfit`, `livery`, `slumber`, `arrowIn`, `arrowOut`, `start`.

- [ ] **Step 1: Write the failing test** — di `gacha-engine.test.js`, `test("aturan resmi konsisten", ...)`: muat `nte/data/gacha-rules.json`; assert jumlah `landing` tanpa `slumber` ada di 99.96 ± 0.1 (persen); assert `0.0099` dan `0.1959` dengan `modifiedAfter 70` dan `hardPity 90` menghasilkan rata-rata S per roll 1.87% ± 0.02 (hitung periode: `E = Σ_{k=1..90} P(belum S sebelum roll k)`, rata-rata `1/E`); assert peluang B-Arc `apprentice*0.998 + hero*0.97` ≈ 65.33 ± 0.1.
- [ ] **Step 2: Run** `node --test tools/nte/tests/` → FAIL (berkas belum ada).
- [ ] **Step 3: Create `gacha-rules.json`** dengan seluruh angka dari bagian Fakta spec, persentase ditulis sebagai pecahan (0.4593 dst).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(gacha): data aturan resmi papan dadu`.

### Task 2: Mesin hadiah, pity, dan hitungan (tanpa papan)

**Files:**
- Create: `nte/gacha-engine.js` (UMD: `module.exports` di Node, `window.GachaEngine` di browser)
- Test: `tools/nte/tests/gacha-engine.test.js`

**Interfaces:**
- Consumes: `rules` (Task 1).
- Produces:
  - `createRng(seed: number): () => number` (mulberry32, deterministik, 0 ≤ x < 1).
  - `newState(): State` = `{ total, sinceS, mode: "baseline"|"modified", pos: number, dice: number, obtained: {[id: string]: number}, sCount, log: [] }`.
  - `decideReward(state: State, tile: { type: string, amount?: number }, rules: Rules, rng): Reward` — `Reward` = `{ kind: "S"|"A_CHAR"|"A_ARC"|"B_ARC"|"LOST"|"DICE"|"OUTFIT"|"LIVERY"|"GLIDER"|"NONE", warp?: number, lost?: number, dice?: number, dup?: number, mindShard?: number }`. `lost` dan `dice` diambil dari `tile.amount` (kalau kosong, 30 untuk Lost Piece Box, 1 untuk `roll1`, 5 untuk `roll5`); kotak `slumber` (event disederhanakan) dan `start` menghasilkan `NONE`.
  - `applyRoll(state: State, reward: Reward, rules: Rules): { state: State, gift: Reward|null, skinBonus: string[] }` — menaikkan `total` dan `sinceS`, mengatur mode, Points Gift tiap 10 roll, bonus skin di 50/120/200 roll, konversi duplikat.
  - `isForcedS(state: State, rules: Rules): boolean` — benar bila `sinceS >= 89`.

- [ ] **Step 1: Write the failing tests** (nama dan isi):
  - `test("pity keras: roll ke-90 pasti S dan roll ke-89 bidak tidak bergerak")` — rng yang tak pernah menghasilkan S; setelah 89 roll `isForcedS` benar; roll ke-90 hasilnya `kind: "S"` dan `state.pos` tak berubah.
  - `test("Modified mulai roll ke-71, kembali Baseline setelah S")` — setelah 70 roll tanpa S `mode === "modified"`; S di roll ke-70 → `mode === "baseline"` dan `sinceS === 0`.
  - `test("rata-rata S per roll sekitar 1.87%")` — 200.000 roll, seed tetap; assert 1.87 ± 0.1 persen dan rata-rata panjang siklus 53.3 ± 1.
  - `test("Points Gift tiap 10 roll: 20% karakter A, 80% Arc A")` — 20.000 gift; assert 0.2 ± 0.01.
  - `test("duplikat S ke-2 sampai ke-7 = 1 Mind Shard + 40 Warp; ke-8 = 80 Warp")` dan padanan A (6 dan 12).
  - `test("bonus skin saat total roll 50, 120, 200")`.
  - `test("Roll Again menambah dadu gratis dan ikut menambah total roll")`.
- [ ] **Step 2: Run** `node --test tools/nte/tests/` → FAIL.
- [ ] **Step 3: Implement** fungsi di atas. Probabilitas S per roll: 0.0099 (baseline), 0.1959 (modified), 1 bila `isForcedS`. Hadiah non-S diambil dari `rules.landing` (kecuali `slumber`) dengan isi dari `tileContent`. Satu tiap pull.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(gacha): mesin hadiah dan pity`.

### Task 3: Data papan dari screenshot

**Files:**
- Create: `tools/nte/extract_board.py`, `nte/data/gacha-board.json`
- Reference input (tidak masuk repo): screenshot peta di `C:\Users\anime\AppData\Local\Temp\claude\3cfb78a60dc22d2b\9cc741f2-b856-4dfa-8f81-787d1c3ea396\images\67.webp` (1920x1080, area peta x 545–1850, y 235–850) dan foto sudut di folder yang sama (`82` sampai `91.webp`).

**Interfaces:**
- Produces: `Board` = `{ name: "Scarborough Fair", tiles: Tile[], route: number[], blocks: Block[], confirmed: {modifiedLayout: false} }`; `Tile` = `{ id: number, x: number, y: number, type: string, amount?: number, char?: string }` (x, y piksel pada peta 1920x1080); `Block` = `{ side: "left"|"right", enter: number, exit: number, tiles: number[] }`. `route` = urutan id rute utama searah jarum jam; `block.tiles` = urutan jalan di dalam blok searah jarum jam.

- [ ] **Step 1: Write the failing test** — `test("papan: rute tertutup dan semua id valid")`: setiap id di `route`/`blocks` ada di `tiles`; tak ada id ganda di `route`; tiap `arrowIn` punya `arrowOut` pasangan; jumlah `hero` dan `apprentice` kira-kira sebanding dengan 20% dan 46% dari kotak rute (toleransi 8 poin).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Write `extract_board.py`** — deteksi kotak oranye/ungu/biru lewat warna tepi (komponen terhubung, luas 500–4500 piksel; skrip percobaan sudah ada di scratchpad `tiles.py` dan menemukan 71 kotak), lalu jenis ikon khusus (S/A, Livery, dadu, Arc-light, Fashion, Outfit, panah, Slumberland) dilengkapi lewat tabel manual di dalam skrip, dibuat dengan membaca gambar. Skrip juga menulis `board-check.png` (nomor id di atas tiap kotak) ke folder sementara supaya diperiksa mata dan diperlihatkan ke pemilik situs. Jumlah isi (`amount`) diisi dari foto dekat: Lost Piece Box ×30 atau ×50, kotak dadu ×1 atau ×5; yang tak terbaca dikosongkan dan ditandai.
- [ ] **Step 4: Run** `python tools/nte/extract_board.py` lalu `node --test tools/nte/tests/` → PASS; tunjukkan `board-check.png` ke pemilik situs untuk dikoreksi sebelum lanjut.
- [ ] **Step 5: Commit** `feat(gacha): data papan Scarborough Fair`.

### Task 4: Gerak di papan (rute dan blok)

**Files:**
- Modify: `nte/gacha-engine.js`
- Test: `tools/nte/tests/gacha-engine.test.js`

**Interfaces:**
- Consumes: `Board` (Task 3), `decideReward`, `applyRoll`, `isForcedS` (Task 2).
- Produces: `moveToken(board: Board, pos: number, die: number): { path: number[], landed: number }` dan `roll(state: State, board: Board, rules: Rules, rng): RollResult` dengan `RollResult` = `{ n: number, die: number|null, path: number[], landed: number, reward: Reward, gift: Reward|null, skinBonus: string[], forced: boolean, modeAfter: "baseline"|"modified", extra: RollResult[], state: State }`; `extra` berisi roll dadu gratis yang dijalankan langsung setelah roll ini.

- [ ] **Step 1: Write the failing tests** (dengan papan kecil buatan sendiri di dalam tes):
  - `moveToken` biasa: `die` melangkah searah rute dan melingkar di ujung.
  - Mendarat tepat di `arrowIn` → `path` melewati semua kotak blok searah jarum jam lalu `arrowOut`, dan `landed` = `arrowOut`; roll berikutnya lanjut dari situ di rute utama.
  - Hanya melewati (bukan mendarat) `arrowIn` tidak masuk blok.
  - Roll paksa pity: `die === null`, `path` kosong, `landed === state.pos`, `reward.kind === "S"`.
  - Rangkaian dadu gratis: `Multiple Surprises` menghasilkan 5 dadu gratis; semuanya dijalankan, `extra.length === 5`, `state.total` naik 6, berhenti (tidak berlipat tak berhingga bila ada kotak dadu di jalan: batas 50 roll beruntun).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** — `moveToken` berjalan per langkah di `route`; hanya kotak pendaratan yang memberi hadiah. Aturan di dalam blok (apakah sisa langkah diteruskan) mengikuti keputusan Task 5.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(gacha): gerak bidak dan blok ujung`.

### Task 5: Tes peluang mendarat dan keputusan aturan

**Files:**
- Create: `tools/nte/board_stats.py` (atau setara di Node: `tools/nte/board_stats.js`; pilih yang membaca `gacha-board.json` tanpa dependensi)
- Modify: `nte/gacha-engine.js`, `nte/data/gacha-board.json`

**Interfaces:**
- Consumes: `moveToken`, `roll` (Task 4), `rules.landing`.
- Produces: laporan persentase mendarat per jenis kotak untuk tiap kemungkinan aturan blok, dan keputusan tertulis di `gacha-board.json` kunci `blockRule`: `"continue"` (sisa langkah diteruskan di dalam blok) atau `"traverse"` (blok dilewati penuh, mendarat di `arrowOut`).

- [ ] **Step 1: Write the failing test** — `test("peluang mendarat cocok angka resmi")`: 500.000 roll seed tetap dengan `blockRule` terpilih; untuk `apprentice`, `hero`, `lost`, `journeyS + journeyA`, selisih dari angka resmi ≤ 3 poin persentase; `journeyS` ≤ 1.19 ± 0.6; `livery`, `outfit`, `roll5` ≤ 1 poin dari angka resmi.
- [ ] **Step 2: Run** → FAIL atau mismatch; cetak laporan kedua kemungkinan aturan.
- [ ] **Step 3: Decide** — pakai kemungkinan yang paling cocok. Kalau keduanya cocok seimbang, tanya pemilik situs. Kalau peluang S dari jalan di papan baseline menyimpang lebih dari 0.15 poin dari 0.99%, S ditentukan lebih dulu oleh peluang resmi (`baseRate`/`modifiedRate`/pity) dan hadiah kotak yang bukan S disesuaikan; tulis keputusan di `gacha-board.json` kunci `sMode`: `"walk"` atau `"calibrated"`. Susunan papan Modified tidak diketahui, jadi di mode Modified hanya peluang S yang berubah, papan tetap sama; tandai `confirmed.modifiedLayout: false` dan tampilkan "perkiraan" di halaman.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(gacha): keputusan aturan blok dari tes peluang`.

### Task 6: Halaman /gacha (tampilan, papan, kontrol)

**Files:**
- Modify: `nte/app.js` (rute dekat `[/^\/tierlist\/?$/, viewTierlist]`, fungsi `viewGacha` memakai `head()`, `load()`, `S()`, `toast()`, `sheet()`), `nte/app.css`, `index.html`, `404.html`, `tools/nte/make_pages.py`
- Test: manual di browser (lihat Task 8) plus uji mesin yang sudah ada

**Interfaces:**
- Consumes: `GachaEngine.newState`, `roll`, `createRng` (global, dimuat lewat `<script src="/nte/gacha-engine.js?v=NN" defer>` sebelum `app.js` di `index.html` dan `404.html`).
- Produces: rute `/gacha`; tab Esper aktif, tab Arc ditutup ("Segera hadir / Coming soon"); papan 2D dengan kotak diposisikan absolut dari `tiles[].x/y` (skala sesuai lebar), bidak, hitungan `sinceS/90`, `total`, status Baseline/Modified, tombol Roll 1x dan Roll 10x (10x = 10 roll berurutan dengan animasi pendek), catatan "simulasi, angka dari layar aturan game papan Android Dreams; susunan papan Modified dan pool karakter/Arc perkiraan".
- Menu: tautan `Gacha` di `index.html` dan `404.html` (daftar nomor drawer bertambah jadi 19), entri `("gacha", "Simulator Gacha", "Simulasi gacha papan dadu Neverness to Everness dengan angka resmi dari game.")` di `PAGES`.

- [ ] **Step 1:** Tambah rute, `viewGacha`, gaya, tautan menu, entri `PAGES`, dan tag `<script>` mesin.
- [ ] **Step 2:** Tombol dikunci selama animasi (`let busy`); kalau `busy`, klik diabaikan.
- [ ] **Step 3:** Jalankan `python tools/nte/make_pages.py --bump`.
- [ ] **Step 4:** Buka `http://localhost:5501/gacha/` (server lokal `python tools/nte/serve.py` atau `preview_start`), pastikan papan tampil dan Roll 1x menggerakkan bidak tanpa error di konsol.
- [ ] **Step 5: Commit** `feat(gacha): halaman simulator dan menu`.

### Task 7: Riwayat, statistik, penyimpanan, dan bagikan gambar

**Files:**
- Modify: `nte/app.js`, `nte/app.css`

**Interfaces:**
- Consumes: `State`, `RollResult` (Task 4).
- Produces: `saveGacha(state: State): void` dan `loadGacha(): State` (kunci `localStorage` `nte_gacha_v1`, try/catch, data tak valid → `newState()`); daftar riwayat (terbaru di atas, maksimum 200); statistik (total roll, jumlah S dan A, Anowith terpakai = total × 160, roll sejak S terakhir); tombol "Reset"; tombol "Bagikan hasil" yang menggambar canvas (gaya seperti ekspor Tier List di `nte/app.js` sekitar baris 1982) berisi nama papan, jumlah roll, hadiah S/A terbaik dengan gambar dari `nte/img`, lalu mengunduh PNG.

- [ ] **Step 1:** Tulis uji manual tertulis di komentar: `localStorage` diisi `"{bukan json"` lalu muat ulang → halaman mulai awal tanpa error.
- [ ] **Step 2:** Implement `saveGacha`/`loadGacha`, riwayat, statistik, reset, dan bagikan gambar.
- [ ] **Step 3:** Jalankan `python tools/nte/make_pages.py --bump`; cek di browser: roll 10x → muat ulang → hitungan tetap; tombol bagikan mengunduh PNG.
- [ ] **Step 4: Commit** `feat(gacha): riwayat, statistik, simpan lokal, bagikan gambar`.

### Task 8: Verifikasi akhir dan ringkasan ke pemilik situs

**Files:**
- Modify: `nte/app.js` (halaman Tentang: tambahkan "Simulator Gacha" ke daftar isi situs), `README.md` bila ada daftar halaman

- [ ] **Step 1:** `node --test tools/nte/tests/` semua lulus; `node --check nte/app.js nte/gacha-engine.js` bersih.
- [ ] **Step 2:** Di browser: tampilan ponsel (375 px) dan desktop, bahasa ID dan EN, tab Arc tertutup, tidak ada galat di konsol, roll sampai pity 90 lewat pengaturan seed uji (atau 90 kali klik) menghasilkan S di roll ke-90 paling lambat.
- [ ] **Step 3:** Tulis ke pemilik situs: yang sudah cocok dengan angka resmi, yang masih perkiraan (papan Modified, pool A/B, jumlah isi kotak yang tak terbaca), dan minta aturan Arc untuk tahap 2.
- [ ] **Step 4: Commit** `feat(gacha): selesai tahap Esper`. Jangan push sebelum pemilik situs menyatakan "push".
