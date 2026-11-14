# Simulator Gacha (papan dadu) untuk Hethereau

Status: menunggu persetujuan pemilik situs. Belum ada kode.

## Tujuan dan alasan
Pemilik situs ingin lebih banyak pengunjung. Simulator gacha mudah dipakai, seru dicoba berulang, dan hasilnya enak dibagikan. Maka simulator harus terasa seperti game aslinya (papan, dadu, bidak) dan angkanya harus sama dengan angka resmi di game.

## Tujuan, bukan-tujuan, anti-tujuan
Tujuan
- Meniru papan gacha Esper di game: papan tetap, dadu 1 sampai 6, bidak berjalan, kotak yang diinjak memberi hadiah.
- Memakai angka resmi dari layar aturan di game (lihat bagian Fakta).
- Penghitung pity, status papan (Baseline / Modified), riwayat roll, statistik, dan bagikan hasil sebagai gambar.
- Dwibahasa (ID/EN) seperti halaman lain.

Bukan-tujuan
- Tidak ada akun, penyimpanan di server, atau papan peringkat.
- Event Slumberland (mengejar Guardian) disederhanakan: langsung mendapat reward kotaknya.
- Bukan alat memprediksi hasil gacha asli.

Anti-tujuan (dianggap gagal walau jalan)
- Mengarang angka atau susunan papan lalu menyajikannya sebagai resmi.
- Angka yang tidak cocok dengan angka resmi.

## Batasan
- Situs statis: HTML, CSS, JavaScript murni tanpa framework, di GitHub Pages. Halaman baru `/gacha`, didaftarkan di `make_pages.py`, menu, dan sitemap. Setelah perubahan jalankan `python tools/nte/make_pages.py --bump`.
- Gambar Esper dan Arc memakai yang sudah ada di `nte/img`.
- Penyimpanan hanya `localStorage` (dibungkus try/catch).
- Perubahan hanya di-push setelah pemilik situs menyetujui.

## Fakta (dari layar aturan di game, papan Android Dreams, dikirim pemilik situs)
- Dadu Solid: maju 1 sampai 6 kotak, peluang sama. Semua papan Limited berbagi pity S-Class, kemajuan Points Gift, dan kemajuan Board Modification.
- S-Class featured: peluang 0,99% per roll di papan Baseline. Setelah 70 roll berturut-turut tanpa S-Class, papan menjadi Modified dengan peluang 19,59%. Setelah S-Class didapat, papan kembali Baseline. Rata-rata resmi (termasuk pity) 1,87%.
- Pity: kalau 89 roll tanpa S-Class, roll berikutnya bidak tidak bergerak dan langsung dapat S-Class (dijamin dalam 90). Tidak ada 50/50.
- Points Gift tiap 10 roll: 20% karakter A, 80% Arc A. Peluang A-Class per roll 22,98% (karakter 11,67%, Arc 11,31%). Arc B 65,33% per roll.
- Duplikat S-Class ke-2 sampai ke-7: 1 Mind Shard + 40 Warp Pieces; ke-8 dan seterusnya 80 Warp Pieces. Duplikat A-Class: 1 Mind Shard + 6 Warp Pieces; ke-8 dan seterusnya 12. Arc A: bonus 4 Warp Pieces. Arc B: bonus 20 Lost Pieces.
- Peluang mendarat per roll: Apprentice Chest 45,93% (isi: 0,2% S-Class featured, 99,8% Arc B); Hero Chest 20,07% (3% S-Class, 97% Arc B, plus 2 Warp Pieces); Lost Piece Box 15,47%; Journey Together 10,86% (S-Class 1,19%, A-Class 9,67%); Arc-light Mystery Box 3,31% (satu Arc A acak); Fashion Center 1,71%; Roll Again 1,57% (1 dadu); Multiple Surprises 0,38% (5 dadu); Daily Outfit 0,33%; Mod Up! (Livery) 0,33%; Slumberland 3,15% (tambahan di atas kotak lain, kalau semua dijumlahkan tanpa Slumberland hasilnya 99,96%).
- Skin: Daily Outfit (bonus di 200 roll, duplikat 16 Warp Pieces), Livery (bonus di 120 roll, duplikat 16), Glider/Fashion Center (bonus di 50 roll, duplikat 4). Peluang pertama kali per papan: outfit 0,68%, livery 1,00%, glider 2,96%.
- Dadu gratis (Roll Again, Multiple Surprises) ikut menambah hitungan pity, menurut pemilik situs (dikonfirmasi 2026-11-15).
- Layar utama Scarborough Fair: penghitung "8/90" (S-Class Elyms), "8/70" (Board Modification), "0/10" (item A tambahan). Roll 1x memakai 1 dadu. Roll 10x memakai 5 dadu + 800 mata uang (800 = 5 x 160).
- Arti ikon peta: kotak oranye berikon tas = Hero Chest; ungu berikon tas = Apprentice Chest; biru berikon bidak = Lost Piece Box; ikon dadu = Roll Again / Multiple Surprises; hitam di kotak pink = Arc-light Mystery Box; ikon karakter berhuruf S atau A = Journey Together; ikon baju = Daily Outfit; ikon kendaraan = Mod Up!; ikon papan = Slumberland; ikon glider = Fashion Center.

## Pendekatan
Dipertimbangkan:
1. Simulator sederhana (tombol pull, tanpa papan). Cepat, tapi kurang menarik.
2. Hasil ditentukan peluang dulu, papan hanya animasi. Diusulkan awal, ditolak pemilik: tidak sama dengan game.
3. Papan tetap seperti game, bidak benar-benar berjalan sesuai dadu. **Dipilih oleh pemilik situs.**

Alat verifikasi pendekatan 3: setelah peta disalin, hitung secara simulasi persentase mendarat di tiap jenis kotak, lalu bandingkan dengan angka resmi. Kalau cocok, salinan peta benar. Ini jadi tes otomatis.

## Bagian yang sudah diputuskan
- Halaman `/gacha` dengan tab Esper dan Arc. Tab Arc ditutup ("segera hadir") sampai aturan banner Arc tersedia.
- Papan digambar 2D (HTML/CSS), posisi kotak diambil dari screenshot peta game dan disimpan sebagai data (JSON), bukan ditulis tangan di kode.
- Tombol Roll 1x dan Roll 10x seperti di game. Mata uang tidak dihitung ketat; tampilkan saja jumlah roll dan perkiraan Anowith terpakai (160 per roll).
- Hasil roll dihitung oleh mesin sederhana yang terpisah dari tampilan, supaya bisa diuji tanpa browser.
- Tombol bagikan hasil membuat gambar lewat canvas, seperti Tier List.
- Halaman diberi catatan bahwa ini simulasi dan angka diambil dari layar aturan game, plus nama papan yang dipakai.

## Yang belum diketahui dan harus ditandai di halaman
- Susunan papan versi Modified (setelah 70 roll). Perkiraan sampai pemilik mengirim screenshot-nya.
- Cara kerja jalur dan blok ujung (keterangan dan gambar pemilik situs, 2026-11-15): rute utama berjalan searah jarum jam. Kotak panah kuning datang berpasangan (satu panah masuk dan satu panah keluar, saling berdekatan). Kalau dadu membuat bidak mendarat tepat di panah masuk, bidak masuk ke blok ujung (kiri atau kanan), berjalan searah jarum jam melewati blok, lalu keluar lewat panah pasangannya dan kembali ke rute utama. Blok kanan (9 kotak): baris atas dari kiri ke kanan Journey Together S-Class (bersinar), Livery, chest oranye, chest ungu; sisi kanan chest oranye; baris bawah dari kanan ke kiri chest ungu, oranye, ungu, oranye. Blok kiri berupa cincin 8 kotak (baris atas 3 chest oranye, sisi kiri dan kanan chest oranye, baris bawah kotak dadu x5, Daily Outfit yang bersinar, chest oranye). Belum diketahui: apakah sisa langkah dadu diteruskan di dalam blok dan kotak mana di dalam blok yang memberi hadiah. Putusan: coba beberapa kemungkinan di tes peluang mendarat (angka resmi S-Class 1,19%, Livery 0,33%, Daily Outfit 0,33%, Multiple Surprises 0,38% hanya bisa dicapai lewat blok, jadi ini petunjuk kuat), pakai yang paling cocok. Kalau lebih dari satu cocok, tanya pemilik situs.
- Jumlah isi tiap kotak (Lost Piece Box terlihat bertuliskan x30 dan x50, kotak dadu x5) berbeda per kotak dan tidak terbaca di peta ringkas. Tahap awal: tampilkan jenis kotaknya; jumlah dicatat kalau pemilik mengirim foto dekat kotak-kotaknya.
- Angka resmi di atas berasal dari papan Android Dreams, sedangkan peta yang dikirim adalah Scarborough Fair. Kalau hasil tes peluang mendarat tidak cocok, minta layar aturan Scarborough Fair.
- Aturan banner Arc (tahap 2).

## Diserahkan kepada pembuat
Tata letak halaman, animasi dadu dan bidak, nama berkas, cara menyalin posisi kotak dari screenshot (disarankan skrip Python yang mendeteksi warna ikon, lalu diperiksa mata), serta cara menguji mesin roll.
