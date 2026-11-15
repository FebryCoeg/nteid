# Gacha Tracker (catat S-Class, bukan semua pull) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (dikerjakan sendiri di sesi). Langkah memakai checkbox.

**Goal:** Halaman `/tracker` untuk semua pengunjung: catat total pull dan hanya S-Class yang didapat (nama + pity), lalu situs menghitung statistik, pity sekarang, dan diagram batang pity. Data hanya di browser; ada ekspor/impor berkas.

**Architecture:** Logika murni `nte/tracker-logic.js` (validasi, statistik, impor) dengan `node --test`; tampilan `viewTracker` di `nte/app.js` memakai `pityChartImage` yang sudah ada (diberi mode pratinjau); data di `localStorage` (`nte_tracker_v1`).

**Tech Stack:** JS murni, `node:test`. Tanpa dependensi baru.

**Spec:** persetujuan pemilik situs 2026-11-15 ("coba buatkan aja dulu") atas cara 1 (catat hanya S-Class) dari rencana tracker.

## Global Constraints

- Situs statis tanpa framework, dwibahasa lewat `S()`, `localStorage` dibungkus try/catch, `make_pages.py --bump` setelah ubah aset, rute baru didaftarkan di `PAGES` dan menu, commit diakhiri `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`, jangan push sebelum pemilik situs bilang "push".
- Tidak ada pengiriman data pengguna ke server; tidak ada pembacaan data/lalu lintas game. Impor hanya dari berkas yang diunggah pengguna, diproses di browser.
- Aturan pity memakai angka resmi: Esper hard pity 90, soft pity 71 (papan Modified); Arc S dijamin dalam 6 Pull, Arc UP dalam 8 Pull.
- Berkas impor dianggap tak tepercaya: batasi ukuran/jumlah entri, buang bidang asing, panjang string dibatasi.

## Review Focus

- Jumlah pity entri lebih besar dari total pull: tampil peringatan, perhitungan tidak crash.
- Impor berkas rusak, bukan JSON, atau format asing: ditolak dengan pesan, data lama aman.
- Ratusan sampai ribuan pull: tetap cepat, diagram memuat semua S.
- Nama S yang tak ada di data (berkas lama): ditampilkan apa adanya tanpa error.
- Ganti tab Esper/Arc tidak menghilangkan isian.

---

### Task 1: Logika tracker (TDD)
**Files:** Create `nte/tracker-logic.js`; Test `tools/nte/tests/tracker.test.js`
**Interfaces:** `NteTracker.compute(kind: "esper"|"arc", data: { total: number, a: number, entries: Entry[] }): Result`; `Entry` Esper `{ id: string, p: number }`, Arc `{ arc: string, p: number, up?: boolean, u?: number }`; `Result = { S, percent, avg, min, median, max, items: (Entry & { n: number, kind: "normal"|"soft"|"hard" })[], currentPity, currentUpPity, toHard, errors: string[] }`; `NteTracker.validate(kind, data): string[]`; `NteTracker.normalizeImport(raw: unknown): { data?: { esper, arc }, error?: string }`; `NteTracker.emptyData()`.
- [ ] Tes gagal dulu: statistik Esper (total 200; p 64, 90, 30 → n 64/154/184, pity sekarang 16, rata-rata 61,33, median 64, hard di p 90); soft pity p 75; median genap; validasi (jumlah pity > total, p 0, p 91, Arc up tanpa u, entri bukan larik); Arc dengan UP (pity sekarang dan pity UP sekarang); `normalizeImport` (valid, format salah, bidang asing dibuang, string dipotong, ukuran dibatasi); bolak-balik ekspor-impor.
- [ ] Implement, tes lulus, commit.

### Task 2: Halaman /tracker
**Files:** Modify `nte/app.js` (rute, `viewTracker`), `nte/app.css`, `index.html` (menu + skrip), `tools/nte/make_pages.py`
- [ ] Tab Esper/Arc; isian total pull; formulir tambah S (pilih nama, pity; Arc: kotak UP dan pity UP); daftar entri berurutan (hapus, naik, turun, ubah); kotak A-Class opsional; kartu statistik dan pity sekarang dengan bar; peringatan; simpan otomatis.
- [ ] Commit.

### Task 3: Diagram, ekspor, impor
- [ ] `pityChartImage` mendukung `o.preview` (mengembalikan canvas); pratinjau di halaman; tombol Bagikan gambar; Ekspor (.json), Impor (.json, konfirmasi), Reset.
- [ ] Commit.

### Task 4: Verifikasi
- [ ] Tes lulus; browser desktop dan ponsel; ratusan pull; impor rusak; konsol bersih; commit; jangan push.
