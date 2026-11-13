# nteid.site: Arsip Hethereau

Database fan-made game *Neverness to Everness* (NTE) berbahasa Indonesia, dibuat oleh [Febry Coeg](https://febrycoeg.my.id). Tampilannya mengikuti UI di dalam game: latar arang halftone, tombol pil krem bergaris tebal, dan aksen magenta.

| Kategori | Isi |
|---|---|
| **Esper** | 26 karakter dengan halaman detail: peran tempur, statistik HP/ATK/DEF per level (geser level 1-80), material Ascension beserta ikon dan jumlahnya, kemampuan dengan ikon skill yang bisa dibuka-tutup, slider level skill (material per level dan rasio DMG yang bisa dibuka-tutup), ganti kostum di gambar utama, tab Affinity (hadiah favorit dan hadiah tiap level), tab Build, dan profil berbentuk akordeon, Awakening, Console, profil, arsip cerita, dan galeri kostum. |
| **Arc** | 53 senjata/Fork dengan statistik ATK dan ATK% per level, material Ascension, efek yang nilainya berubah sesuai bintang (1 sampai 5), dan daftar Arc sejenis. |
| **Modul** | Modul beserta set bonusnya (efek 2 dan 4 bagian). |
| **Item** | 1.500+ item yang dikelompokkan ke 11 kategori. |
| **Furnitur** | 300+ furnitur dengan nilai Kenyamanan dan Koleksi. |
| **Kendaraan & Properti** | Semua kendaraan dan rumah yang bisa dimiliki di Hethereau. |
| **Cerita** | Ringkasan resmi setiap bab cerita utama dan spinoff, lengkap dengan gambar sampul bab. |
| **Anomali & Monster** | Arsip Anomaly dengan foto, kelas, kode, kutipan, kisah, karakteristik, dan Nexus, ditambah monster dan boss. |
| **Istilah** | Arti istilah dunia NTE dari buku panduan dalam game. |
| **Pencapaian** | 450+ achievement per kategori dengan medali, syarat, dan hadiah. Bisa ditandai selesai (tersimpan di browser) dan diekspor/impor sebagai file JSON. |
| **Fashion & Makanan** | Galeri ilustrasi kostum setiap Esper, serta makanan dan bahan masak beserta efeknya. |
| **Tier List** | Tier list Esper atau Arc buatan pengunjung sendiri: seret ke tier, ganti nama dan warna tier, tersimpan di browser, bisa diunduh sebagai gambar atau diekspor/impor JSON. |

## Fitur

- **Berbahasa Indonesia**: efek, deskripsi, dan cerita diterjemahkan. Nama karakter, item, skill, dan istilah game tetap memakai nama aslinya.
- **Dua bahasa**: tombol ID/EN untuk beralih ke teks bahasa Inggris aslinya.
- **Beranda bergaya key visual** dengan latar ilustrasi kota Hethereau yang berganti otomatis dan etalase Esper.
- **Pencarian cepat** ke seluruh isi database.
- **Filter** per rarity, elemen, tipe, dan kategori yang tersimpan di URL.
- **Tampilan responsif** untuk laptop maupun HP.
- **Data dan gambar langsung dari file game**, diolah dengan skrip Python (`tools/nte/`) menjadi JSON dan gambar WebP.
- **Pemberitahuan update otomatis**: setiap Senin, GitHub Action membandingkan data dengan versi terbaru NTE_Assets dan membuka Issue bila ada yang berubah.

## Teknologi

HTML, CSS, dan JavaScript murni tanpa framework · Python untuk mengolah data · GitHub Actions · Di-hosting gratis dengan GitHub Pages.

## Kredit

Data dan gambar: Neverness to Everness © Hotta Studio / Perfect World, diambil dari Waifus-Grace/NTE_Assets. Ini adalah proyek penggemar dan tidak berafiliasi dengan pengembang game.
