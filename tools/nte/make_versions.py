"""Isi halaman Versi & Patch -> nte/data/versions.json

Ditulis tangan (diringkas dan diterjemahkan ke bahasa Indonesia) dari catatan patch resmi
. Tiap versi menjadi satu artikel di /versi/<id>. Tambah versi baru dengan menaruh entrinya DI AWAL daftar VERSIONS,
lalu jalankan:  python tools/nte/make_versions.py

Format item: {"t": judul, "d": isi, "tag": label kecil, "date": periode, "link": halaman di situs}
"""
import json
from pathlib import Path

OFFICIAL = "https://nte.perfectworld.com/en/article/news/gamenews/20261109/264948.html"

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "nte" / "data"


def _load(name):
    return json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))


_ESPERS = {x["slug"]: x for x in _load("espers")}
_ARCS = {x["slug"]: x for x in _load("arcs")}
_VEH = {x["name"]: x for x in _load("vehicles")}
_FASH = {x["name"]["en"]: x for x in _load("fashion")}
_STORY = {x["title"]["en"]: x for x in _load("story")}
_ITEMS = {x["id"]: x for x in _load("items")["items"]}


def _ok(path):
    assert (ROOT / "nte" / path).exists(), path
    return path


def E(slug):   # potret Esper
    return {"s": _ok(_ESPERS[slug]["portrait"]), "k": "art", "n": _ESPERS[slug]["name"]}


def A(slug):   # ikon Arc
    return {"s": _ok(_ARCS[slug]["icon"]), "k": "ico", "n": _ARCS[slug]["name"]}


def V(name):   # ikon kendaraan
    return {"s": _ok(_VEH[name]["icon"]), "k": "ico", "n": name}


def F(name):   # ilustrasi kostum
    return {"s": _ok(_FASH[name]["image"]), "k": "art", "n": name}


def S_(title):  # gambar bab cerita
    return {"s": _ok(_STORY[title]["image"]), "k": "wide", "n": title}


def K(name):   # key visual resmi / ilustrasi event (nte/img/versi, dibuat make_versi_images.py)
    return {"s": _ok(f"img/versi/{name}.webp"), "k": "wide", "n": name}


def I(iid):    # ikon item
    return {"s": _ok(_ITEMS[iid]["icon"]), "k": "ico", "n": _ITEMS[iid]["name"]}


V15 = {
    "id": "1.5",
    "title": "Once Upon a Glitched Call",
    "released": "11 November 2026",
    "end": "23 Desember 2026",
    "phases": [
        {"n": "Fase 1", "range": "11 Nov – 2 Des 2026", "note": "Elyms debut, Shinku rerun"},
        {"n": "Fase 2", "range": "2 Des – 23 Des 2026", "note": "Exe debut"},
    ],
    "art": E("elyms"),
    "cover": K("v15-kv"),
    "published": "13 November 2026",
    "lead": "Update 1.5 membawa episode utama baru \"Meet Me in the Data Stream\", Esper baru Elyms (lalu Exe di fase 2), "
            "mode tank, event City Logistics, kendaraan baru, dan banyak perbaikan kenyamanan.",
    "sources": [
        {"name": "Catatan patch resmi (nte.perfectworld.com)", "url": OFFICIAL},
        {"name": "Trailer NTE Version 1.5 PV (YouTube)", "url": "https://youtu.be/4mdb_aRMVF4"},
    ],
    "sections": [
        {
            "id": "esper", "title": "Esper & Banner", "open": True,
            "items": [
                {"t": "Elyms", "img": [E("elyms")], "tag": "Esper baru · S-Class · Limited", "link": "/esper/elyms",
                 "date": "11 Nov – 2 Des 2026",
                 "d": "Esper Cosmos dengan peran Buff, Instant Cycle, DMG Boost, dan Burst DPS (sesuai data game). "
                      "Hadir lewat Limited Board \"Android Dreams\" bersama karakter A-class Mint, Edgar, dan Adler. "
                      "Board ini membawa glider \"Joy Buoy\", livery Novus A001 \"+Friend & Rescue+\", dan kostum Elyms \"Drifting Petals\". "
                      "Hadiah bonus tersedia di milestone 50, 120, dan 200 total roll lewat halaman Skin Perks."},
                {"t": "Exe", "img": [E("exe")], "tag": "Esper baru · S-Class · Limited (Fase 2)", "link": "/esper/exe",
                 "date": "2 Des – 23 Des 2026",
                 "d": "Esper Chaos dengan peran Damage, Main DPS, dan Summoner (sesuai data game). Debut di fase 2 lewat Limited Board miliknya."},
                {"t": "Shinku (rerun)", "img": [E("crimson")], "tag": "Rerun · S-Class · Limited", "link": "/esper/crimson",
                 "date": "11 Nov – 2 Des 2026",
                 "d": "Kembali lewat Limited Board \"Before the Dawn\" bersama Mint, Edgar, dan Adler. Ada livery glider \"Overcast Canopy\", "
                      "livery Blizzard-V4 \"Hidden Dragon\", dan kostum \"Student of Terrasea\". Di data game Esper ini tercatat sebagai Crimson. "
                      "Hanya roll di board yang sama yang dihitung untuk Resolve Perks, dan tiap board dihitung terpisah."},
                {"t": "Syarat membuka banner", "tag": "Info",
                 "d": "Selesaikan quest utama \"Prologue - A New Destination - Head to Eibon Antique Shop\" untuk bisa memakai board karakter baru."},
            ],
        },
        {
            "id": "arc", "title": "Arc Baru", "open": True,
            "items": [
                {"t": "Echoes on Hold", "img": [A("echoes-on-hold")], "tag": "Arc S-Class · Limited · tipe Solid", "link": "/arc/echoes-on-hold",
                 "date": "11 Nov – 2 Des 2026",
                 "d": "Arc khas Elyms. Hanya didapat lewat program Arc Research \"Echo Special\" memakai Tri-Key atau Echo Key (menu Arc Shop > Arc Research Program)."},
                {"t": "Blushing Mirage (rerun)", "img": [A("blushing-mirage")], "tag": "Arc S-Class · Rerun · tipe Synthesis", "link": "/arc/blushing-mirage",
                 "d": "Arc khas Shinku. Hanya lewat program Arc Research \"Resolve Special\" memakai Tri-Key atau Resolve Key."},
                {"t": "Dotted Horizon", "img": [A("dotted-horizon")], "tag": "Arc S-Class · tipe Plasma", "link": "/arc/dotted-horizon",
                 "d": "Arc bertipe Plasma, tipe yang sama dengan Exe, sehingga cocok dipasangkan dengannya."},
            ],
        },
        {
            "id": "cerita", "title": "Cerita & Konten Baru", "open": True,
            "items": [
                {"t": "Episode utama: Meet Me in the Data Stream", "img": [S_("Meet Me in the Data Stream")], "tag": "Cerita utama", "link": "/cerita",
                 "d": "Episode baru yang terbuka setelah menamatkan episode \"The Witch\". Ceritanya berawal dari legenda tentang mimpi bertemu teman lama yang "
                      "meninggalkan \"nomor tidak valid\", lalu sebuah panggilan masuk di dalam mimpi. Muncul pertanyaan: apakah kapten dan letnan ETD-6 menghilang "
                      "dalam misi rahasia, dan apakah Anomali tingkat tinggi atau kejahatan Anomali ada di baliknya?"},
                {"t": "Anomaly Pilgrimage: Amber Broodmother", "tag": "Boss mingguan",
                 "d": "Terbuka setelah menamatkan episode \"Fogden Game\". Boss ini muncul sebagai tantangan Anomaly Pilgrimage."},
                {"t": "City Hangouts dan Home Time Elyms", "img": [E("elyms")], "tag": "Bond",
                 "d": "Cerita City Hangouts dan mode undangan Home Time dengan Elyms, terbuka setelah punya Elyms dan mencapai Bond Level tertentu. "
                      "Ada juga quest Bond, ikut duduk di kursi penumpang kendaraan, dan tutorial tempur Elyms."},
            ],
        },
        {
            "id": "fitur", "title": "Fitur & Mode Baru", "open": False,
            "items": [
                {"t": "City Logistics", "img": [I("Avatar_Logistics")], "tag": "Sistem baru · event", "date": "11 Nov – 23 Des 2026",
                 "d": "Event terbatas dengan quest khusus. Menyelesaikannya memberi token \"Kool\" yang bisa ditukar di Event Shop, ditambah hadiah level Reputasi."},
                {"t": "Full Tank Ahead", "img": [V("Iron Ogre")], "tag": "Event · mode tank", "date": "19 Nov (09.00 WIB) – 23 Des 2026",
                 "d": "Event peluncuran tank TerraX \"Iron Ogre\". Mata uangnya \"TX Token\" untuk ditukar di Event Shop."},
                {"t": "Volley Star", "tag": "Peringkat", "d": "Ditambahkan sistem peringkat PvP."},
                {"t": "Going, Going, Gone!", "tag": "Mini game",
                 "d": "Etalase koleksi, laporan saat pertandingan, riwayat pertandingan, asisten lelang baru Elyms, koleksi baru, dan penyesuaian peluang muncul beberapa koleksi."},
                {"t": "Shadow-n-Seek", "tag": "Mini game",
                 "d": "Bot AI mengisi slot kosong kalau antrean terlalu lama, dan posisi beberapa objek diacak tiap pertandingan."},
                {"t": "Akane Rin", "img": [E("akane-rin")], "tag": "Fitur karakter", "d": "Bisa merekam gitar, membagikan kode musik, dan membagikan Bagel."},
                {"t": "Pop-Up Divination House", "tag": "Item dunia terbuka",
                 "d": "Bangunan yang bisa dipasang dan dibongkar di dunia terbuka. Terbuka di total progres 5.100 pada event Fortune's Bounty."},
            ],
        },
        {
            "id": "kosmetik", "title": "Kendaraan, Kostum & Aksesori", "open": False,
            "items": [
                {"t": "Iron Ogre", "img": [V("Iron Ogre")], "tag": "Kendaraan · tank mini",
                 "d": "Dari Mystery Box \"Open Roads Ahead\". Menembakkan peluru ledak untuk membersihkan Anomali dan preman di jalan, dan dipakai juga di mode Full Tank Ahead."},
                {"t": "Prototype Land Overlord 001", "img": [V("Prototype Land Overlord 001")], "tag": "Kendaraan", "d": "Kendaraan bergaya wahana anak yang memakai Fons untuk dorongan kecepatan. Dari Mystery Box \"Open Roads Ahead\"."},
                {"t": "Ori-LV03 dan C001", "img": [V("Ori-LV03"), V("C001")], "tag": "Kendaraan",
                 "d": "Ori-LV03 adalah hadiah level Reputasi event City Logistics. C001 dibeli di Event Shop dengan token Kool."},
                {"t": "Kostum Elyms: Y2K Mystique", "img": [F("Y2K Mystique")], "tag": "Shop · permanen", "date": "diskon 11 Nov – 23 Des 2026",
                 "d": "Harga diskon 2.680 Riftcrystal dari 3.280 (hemat 18%), selama periode diskon."},
                {"t": "Kostum Elyms: Drifting Petals dan Windflower", "img": [F("Drifting Petals"), F("Windflower")], "tag": "Kostum",
                 "d": "Drifting Petals dari board \"Android Dreams\" atau halaman event Dialing Perks. Windflower terbuka di Bond Level 10 bersama Elyms."},
                {"t": "Aksesori Tiny Friend dan Eagle Eye", "img": [I("Pendant_8"), I("Pendant_9")], "tag": "Aksesori",
                 "d": "Tiny Friend terbuka di total progres 3.000 event Fortune's Bounty. Eagle Eye didapat dari \"Forward Momentum Skin Bundle\" di Mall > Gift Center."},
            ],
        },
        {
            "id": "event", "title": "Event & Hadiah", "open": True,
            "items": [
                {"t": "Open Roads Ahead (Mystery Box)", "img": [V("Iron Ogre"), V("Prototype Land Overlord 001"), I("Frame_MangHe_005")], "tag": "Event", "date": "11 Nov – 23 Des 2026",
                 "d": "15 kotak. Kotak pertama seharga 50.000 Fons atau 50 Annulith dan harganya naik tiap kotak. Membuka semuanya membuka seluruh hadiah: kendaraan Iron Ogre dan "
                      "Prototype Land Overlord 001, livery \"Caution: Graffiti!\", frame avatar \"Wayfinder\", namecard \"The Open Road\", Fabricated Dice, A Handwritten Letter, dan lainnya."},
                {"t": "Circle Gifts", "img": [I("Dicelimite")], "tag": "Login", "date": "11 Nov – 23 Des 2026", "d": "Login total 7 hari mendapat Solid Dice x10."},
                {"t": "City Logistics", "tag": "Event", "date": "11 Nov – 23 Des 2026",
                 "d": "Selesaikan quest terbatas untuk token Kool. Menamatkan semuanya memberi namecard \"Big Dreams\". Event Shop berisi kendaraan C001, gelar \"Hethereau Delivery King\", "
                      "case ponsel \"Five-Star Reviews\", avatar \"Kool\", dan lainnya. Level Reputasi memberi Ori-LV03, Annulith, Floe Cinema Ticket, Elite Hunter Guide, dan Chaotic Dye."},
                {"t": "Hunter's Crucible: Breakthrough", "img": [I("CharacterUpMaterial_lv3"), I("WeaponUpMaterial_lv3")], "tag": "Event", "date": "11 Nov – 23 Des 2026",
                 "d": "Tamatkan stage tantangan untuk gelar \"Hunter's Crucible - Blade Honed\" (efek visualnya berubah sesuai total poin), Annulith, Fabricated Dice, Fons, Elite Hunter Guide, dan Chaotic Dye."},
                {"t": "Fortune's Bounty", "img": [I("Pendant_8")], "tag": "Event", "date": "11 Nov – 23 Des 2026",
                 "d": "Kumpulkan Fortune Coins. Hadiah milestone: Pop-Up Divination House, aksesori Tiny Friend, jejak ban \"Hyperflame\", asap ban \"Neonbula\", Solid Dice, Fabricated Dice, dan kotak material."},
                {"t": "Circle Bounty (panduan versi 1.5)", "img": [I("combat_68")], "tag": "Event", "date": "11 Nov – 22 Des 2026",
                 "d": "Butuh quest utama \"Relax Time\". Selesaikan Circle Quest untuk EXP dan rank. Ada Elite Hunter Supplies (Annulith x680, Solid Dice x4, Fabricated Dice x2, Fons x950.000, dan lainnya) "
                      "dan Honor Hunter Supplies (tambahan avatar \"Long Time No See\", frame \"Who's Calling?\", namecard \"City of Wonders\"). Arc-light Trove II memberi pilihan salah satu Arc Fluff of ... atau Fons x2.000.000."},
                {"t": "Full Tank Ahead", "tag": "Event", "date": "19 Nov (09.00 WIB) – 23 Des 2026", "d": "Event peluncuran Iron Ogre. Hadiah Event Shop: Annulith, Floe Cinema Ticket, Fons, Elite Hunter Guide, Chaotic Dye."},
                {"t": "Fishing Frenzy", "img": [I("EquipmentUpMaterial_lv3")], "tag": "Event", "date": "23 Nov – 23 Des 2026", "d": "Memancing di titik \"Sea Angler\" Nacupeda Park dan naikkan level memancing. Hadiah: Annulith, Floe Cinema Ticket, Elite Hunter Guide, Chaotic Dye, dan boss Manhole."},
                {"t": "Pixel Surge", "tag": "Event", "date": "16 Nov – 23 Nov 2026",
                 "d": "Hadiah dobel saat memakai Character Pixels di Houdinii's Magic Stage, Houdinii's Schemes, Bubble Can Factory, dan Rabbit Hole. Batas dobel 120 per hari (sisa terbawa), total 840."},
                {"t": "Gold Clash", "img": [I("steal_gold")], "tag": "Event", "date": "23 Nov – 7 Des 2026", "d": "Efisiensi Fons 2x di Pink Paws Heist."},
            ],
        },
        {
            "id": "qol", "title": "Perbaikan & Kenyamanan", "open": False,
            "items": [
                {"t": "Penyimpanan melimpah", "tag": "Kenyamanan",
                 "d": "Kelebihan City Stamina berubah jadi City Stamina Reserve (maksimal 1.000), dan kelebihan Character Pixels jadi Photo Paper Supply (maksimal 2.400)."},
                {"t": "Resource Overview", "tag": "Kenyamanan",
                 "d": "Panel untuk melihat progres Annulith, Solid Dice, Fabricated Dice, dan Tri-Key beserta pintasannya. Tampilan total progres di Mac dan iOS menyusul."},
                {"t": "Esper Ability dan Upgrade Target", "tag": "Kenyamanan",
                 "d": "Esper Ability bisa dinaikkan ke level target tertentu, dan ada Upgrade Target untuk melacak material Ascension."},
                {"t": "Auto-drive mode Free Roam", "tag": "Kendaraan", "d": "Mengemudi otomatis kini punya mode bebas jalan-jalan."},
                {"t": "Impor Blueprint", "tag": "Rumah", "d": "Furnitur yang kurang bisa dibeli sekali klik saat mengimpor Blueprint."},
                {"t": "Lain-lain", "tag": "Kenyamanan",
                 "d": "Opsi hapus Map Pin sekali klik, pengaturan putar langsung animasi First Meeting Replay (Settings > Control), item sumber kini langsung menuju stage tantangan, "
                      "tampilan hadiah Awakening ke-6 diperbaiki, dukungan controller dan terjemahan beberapa bahasa membaik, dan sebagian aksesori kini cocok untuk lebih banyak karakter."},
                {"t": "Grafis", "tag": "Performa", "d": "Dukungan Snapdragon ANF di HP, serta NVIDIA RTX Spark dan AMD FSR 4 di PC."},
            ],
        },
        {
            "id": "bug", "title": "Perbaikan Bug", "open": False,
            "items": [
                {"t": "Akane Rin", "img": [E("akane-rin")], "tag": "Bug", "d": "Dodge dan Critical Riposte tidak bisa tersambung ke serangan dasar berikutnya saat Basic Attack ditahan. Sudah diperbaiki."},
                {"t": "Shinku", "img": [E("crimson")], "tag": "Bug",
                 "d": "Animasi meluncur yang kadang janggal diperbaiki. Pasif \"Menacing Gaze\" di Beyond the Rails kini mulai dari stack penuh saat masuk atau mengulang stage."},
                {"t": "Anomaly Hunt: Black Tome", "tag": "Bug",
                 "d": "Kombinasi Redirect Linko dengan Synced Strike Xiaozhen saat karakter terbelenggu boss tidak lagi memberi lonjakan damage yang tidak wajar."},
                {"t": "Serenetti Manor (multiplayer)", "tag": "Bug", "d": "Pemain kini bisa menyerang Anomali \"Huggy Vines\"."},
                {"t": "Lain-lain", "tag": "Bug", "d": "Beberapa crash dan masalah lain yang sudah diketahui diperbaiki."},
            ],
        },
        {
            "id": "update", "title": "Maintenance, Kompensasi & Cara Update", "open": False,
            "items": [
                {"t": "Maintenance", "tag": "Jadwal", "date": "11 Nov 2026",
                 "d": "05.00 – 10.00 WIB, bisa maju atau mundur tergantung progres. Login tidak tersedia selama maintenance, dan \"Pink Paws Heist\" ditutup sementara sejak 04.30 WIB."},
                {"t": "Kompensasi", "img": [I("Annulith_x300")], "tag": "Hadiah",
                 "d": "Annulith x300 untuk maintenance dan Annulith x300 untuk perbaikan bug, dikirim lewat surat dalam game. Berlaku untuk Appraiser yang membuat karakter sebelum 11 Nov 2026, 05.00 WIB. Klaim sebelum surat kedaluwarsa."},
                {"t": "Pengingat", "tag": "Info",
                 "d": "Limited Board Akane Rin \"Dazzling Star\" berakhir 11 Nov 2026, 04.59 WIB. Tukarkan hadiah kosmetiknya di halaman event Void Perks sebelum itu."},
                {"t": "Cara update", "tag": "Panduan",
                 "d": "PC dan Epic: tutup game, buka launcher lagi, klik Update. Steam: tutup game, mulai ulang Steam, Library > NTE > Update. Android: jalankan game dan ikuti petunjuk. "
                      "iOS dan Mac: lewat App Store. PlayStation: menu sistem > pilih NTE > OPTIONS > Check for Update."},
            ],
        },
    ],
}


# Gambar tambahan per (id bagian, judul butir); menimpa "img" bawaan butir itu.
EXTRA = {
    ("esper", "Elyms"): [K("elyms-kv")],
    ("esper", "Exe"): [K("exe-kv")],
    ("esper", "Syarat membuka banner"): [K("v15-kv")],
    ("fitur", "City Logistics"): [I("Avatar_Logistics"), I("BusinessCard_Logistics"), V("C001")],
    ("fitur", "Full Tank Ahead"): [V("Iron Ogre")],
    ("event", "City Logistics"): [I("Avatar_Logistics"), I("BusinessCard_Logistics"), I("LogisticsExp")],
    ("event", "Full Tank Ahead"): [K("event-tank")],
    ("event", "Fishing Frenzy"): [K("event-fishing")],
    ("event", "Pixel Surge"): [I("Stamina"), I("BackupStamina")],
    ("update", "Maintenance"): [K("v15-maintenance")],
    ("update", "Pengingat"): [E("akane-rin")],
    ("fitur", "Going, Going, Gone!"): [E("elyms")],
    ("qol", "Penyimpanan melimpah"): [I("Stamina"), I("BackupStamina")],
    ("qol", "Resource Overview"): [I("Annulith_x10"), I("Dicelimite"), I("DiceNormal"), I("WeaponGacha")],
}
for _sec in V15["sections"]:
    for _it in _sec["items"]:
        _k = (_sec["id"], _it["t"])
        if _k in EXTRA:
            _it["img"] = EXTRA[_k]


# ---- Pembaruan dari siaran resmi "NTE Version 1.5 Preview Special Program" ----
def _sec(sid):
    return next(x for x in V15["sections"] if x["id"] == sid)


def _item(sid, title):
    return next(x for x in _sec(sid)["items"] if x["t"] == title)


def _insert_after(sid, after, item):
    items = _sec(sid)["items"]
    items.insert(next(i for i, x in enumerate(items) if x["t"] == after) + 1, item)


V15["phases"][1]["note"] = "Exe debut, Chaos rerun"
V15["sources"] = [
    {"name": "Catatan patch resmi (nte.perfectworld.com)", "url": OFFICIAL},
    {"name": "Siaran resmi: NTE Version 1.5 Preview Special Program (YouTube NTE Global)", "url": "https://youtu.be/UxT6b7h5Mcc"},
]

_sec("esper")["items"].insert(0, {
    "t": "Jadwal banner dan program Arc Research", "img": [K("vid-calendar")], "big": True, "tag": "Kalender 1.5",
    "d": "Fase 1 (11 Nov setelah update – 2 Des 04.59 WIB): Limited Board Android Dreams (Elyms) dan Before the Dawn (Shinku), "
         "program Arc Research Echo Special (Echoes on Hold) dan Resolve Special (Blushing Mirage). "
         "Fase 2 (2 Des setelah update – 23 Des 04.59 WIB): Limited Board Offline Equations (Exe) dan Forsaken Path (Chaos), "
         "program Arc Research Encryption Special (Dotted Horizon) dan Pursuit Special (What's Desired). Tiap fase berlangsung 21 hari. "
         "Jumlah roll dibagi antar board yang sedang aktif, tetapi progres Skin Perks dihitung per board. Jumlah pull dan pity Arc Research juga dibagi antar program sejenis."})

_item("esper", "Elyms")["img"] = [K("vid-android")]
_item("esper", "Exe").update({
    "img": [K("vid-offline")],
    "d": "Kapten ETD-6. Esper Chaos dengan peran ranged DPS dan Summoner. Debut di fase 2 lewat Limited Board \"Offline Equations\". "
         "Ia memakai dua mekanik inti: Frame, yang dikumpulkan lewat serangan lalu dipakai untuk \"mengekspor\" Digital Echo yang menyerang serempak, "
         "dan Rating, nilai performa tempur yang naik saat ia menyerang dan memakai skill."})
_item("esper", "Shinku (rerun)")["img"] = [K("vid-dawn")]
_insert_after("esper", "Shinku (rerun)", {
    "t": "Chaos (rerun)", "img": [K("vid-forsaken")], "tag": "Rerun · S-Class · Limited", "link": "/esper/chaos",
    "date": "2 Des – 23 Des 2026",
    "d": "Kembali di fase 2 lewat Limited Board \"Forsaken Path\", berdampingan dengan banner Exe."})

_item("arc", "Echoes on Hold")["img"] = [K("vid-arc-echo")]
_item("arc", "Dotted Horizon").update({
    "img": [K("vid-arc-enc")], "date": "2 Des – 23 Des 2026",
    "d": "Hadir di fase 2 lewat program Arc Research \"Encryption Special\". Bertipe Plasma, tipe yang sama dengan Exe."})
_insert_after("arc", "Dotted Horizon", {
    "t": "What's Desired (rerun)", "img": [A("what-s-desired")], "tag": "Arc · Rerun · tipe Synthesis", "link": "/arc/what-s-desired",
    "date": "2 Des – 23 Des 2026",
    "d": "Kembali lewat program Arc Research \"Pursuit Special\" di fase 2, berpasangan dengan banner Chaos."})

_insert_after("cerita", "Episode utama: Meet Me in the Data Stream", {
    "t": "Wilayah baru: The Invalid Number", "img": [K("vid-invalid")], "tag": "Wilayah baru",
    "d": "Legenda urban \"nomor tidak valid\" membawamu ke sebuah kota terendam yang mengambang di lautan digital, bernuansa nostalgia core, dreamcore, dan pool core. "
         "Di sini juga ada Anomali setingkat boss yang unik, dan masih banyak rahasia lain yang bisa ditemukan di dalam kota."})
_item("cerita", "Anomaly Pilgrimage: Amber Broodmother").update({
    "img": [K("vid-amber")],
    "d": "Terbuka setelah menamatkan episode \"Fogden Game\". Tantangan ini menjadi sumber material upgrade baru bernama Hollowflower Seeds."})

_item("fitur", "City Logistics").update({
    "img": [K("vid-logistics")],
    "d": "Buka cabang waralaba Kool Logistics dan bangun logistics hub milikmu sendiri. Setelah hub berdiri, pencari kerja muncul di sekitar kota untuk diwawancarai. "
         "Tiap pengemudi punya aptitude dan keahlian khusus, dengan gaji pokok ditambah bagian dari setiap komisi. Ada kendaraan seperti ambulans, van pengawal, "
         "dan truk kas lapis baja untuk komisi bank. Token Kool bisa ditukar dengan berbagai item, termasuk skin eksklusif ambulans dan van pengawal."})
_item("fitur", "Full Tank Ahead").update({
    "d": "Mode tank memakai TerraX \"Iron Ogre\": kumpulkan skor di arena dan hadiah dibagikan sesuai skor akhir saat waktu habis. "
         "Arena punya zona yang diperebutkan, dan air drop yang jatuh di zona itu membawa perk kuat sekaligus menunjukkan posisi tank lain."})
_insert_after("fitur", "Full Tank Ahead", {
    "t": "Tycoon's Deck", "img": [K("vid-tycoon")], "tag": "Event · board game", "date": "2 Des – 23 Des 2026",
    "d": "DSD Pop kembali dengan board game baru. Taruh kartu bangunan di grid 3x3 untuk menghasilkan foot traffic (skor dasar, biru), lalu kalikan dengan kartu strategi "
         "(pengali, merah) demi mencapai target pendapatan. Kartu strategi tidak bisa ditempatkan di grid tetapi membawa aturan unik, dan bisa saling berantai. Ada juga indeks kartu yang bisa dilengkapi."})

_item("kosmetik", "Prototype Land Overlord 001")["img"] = [K("vid-overlord")]

_item("event", "Fortune's Bounty")["img"] = [K("vid-fortune")]
_item("event", "Full Tank Ahead")["img"] = [K("vid-tank")]
_item("event", "Fishing Frenzy")["img"] = [K("vid-fishing")]
_item("event", "Pixel Surge")["img"] = [K("vid-pixel")]
_item("event", "Gold Clash")["img"] = [K("vid-gold")]
_insert_after("event", "Gold Clash", {
    "t": "Magic Lucky Flip", "img": [K("vid-lucky")], "tag": "Event", "date": "10 Des (04.00 WIB) – 23 Des 2026",
    "d": "Event bertema malam ajaib ketika Hethereau berubah menjadi labu raksasa. Pratinjau hadiahnya menampilkan Annulith, dadu, dan item kartu."})

VERSIONS = [V15]

if __name__ == "__main__":
    out = Path(__file__).resolve().parents[2] / "nte" / "data" / "versions.json"
    out.write_text(json.dumps({"versions": VERSIONS}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(out, out.stat().st_size // 1024, "KB;", sum(len(s["items"]) for v in VERSIONS for s in v["sections"]), "butir")
