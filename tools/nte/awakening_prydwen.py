"""Urutan prioritas Awakening per karakter, dicatat dari halaman karakter Prydwen (bagian "Awakenings & Calcs").

Hanya nomor Awakening dan tanda urutan yang dicatat (ranking singkat), tanpa tulisan analisis atau persentasenya.
Tanda ">" = lebih penting, "=" atau "~" = sama penting. Awakening yang tidak disebut diberi peringkat kosong ("–").
Dibaca pada saat dibuat: 14 November 2026. Exe belum ada di sumber (karakter belum rilis).
"""
import re

PRYDWEN_SLUG = {"daffodill": "daffodil", "zero-1051": "zero", "zero-1046": "zero"}

ORDER = {
    "adler": "A1 = A6 > A3 > A5 > A4 > A2",
    "akane-rin": "A3 > A2 > A6 > A4 > A5 > A1",
    "aurelia": "A1 > A2 = A6 > A5 > A3 > A4",
    "baicang": "A1 > A6 > A2 > A3 > A5 = A4",
    "blackbird": "A1 > A4 > A5 > A6 > A3 > A2",
    "chaos": "A6 > A1 > A2 > A5 = A3 > A4",
    "chiz": "A2 > A4 > A1 = A5 > A3 = A6",
    "daffodill": "A5 > A3 > A4 > A6 > A1 > A2",
    "edgar": "A6 > A5 > A3 > A1 > A2 > A4",
    "elyms": "A4 > A1 > A3 > A5 > A2 > A6",
    "fadia": "A5 = A1 > A6 = A2 > A3 > A4",
    "haniel": "A2 = A6 > A5 > A1 > A3 > A4",
    "hathor": "A2 > A1 > A6 > A5 > A4 = A3",
    "hotori": "A6 = A3 > A1 = A5 > A2 = A4",
    "iroi": "A5 > A2 > A1 > A4",
    "jiuyuan": "A2 > A6 > A5 > A3 > A4 > A1",
    "lacrimosa": "A5 = A6 > A4 = A3 > A2 > A1",
    "linko": "A6 = A5 > A1 > A4 > A3 > A2",
    "mint": "A1 > A5 > A3 > A2 = A6 > A4",
    "nanally": "A1 > A5 = A3 > A4 > A6 > A2",
    "sakiri": "A4 > A5 > A1 > A2 > A3 > A6",
    "shinku": "A3 > A2 > A1 > A6 > A4 > A5",
    "skia": "A4 > A1 > A6 > A2 > A3 > A5",
    "zankou": "A5 > A2 > A1 > A4 > A6 > A3",
    "zero-1051": "A2 > A3 > A4 = A5",
    "zero-1046": "A2 > A3 > A4 = A5",
}

# catatan sinergi per karakter, ditulis ulang dengan kata sendiri (tanpa angka persentase dari sumber)
NOTE = {
    "akane-rin": ("Awakening yang menambah damage didahulukan dan satu-satunya yang bersifat bertahan (A1) paling akhir. A3 menguatkan skill klik dan memperbesar medan emasnya, A2 hampir selalu aktif. Resonance 3 dan 6 sangat bernilai karena menambah satu pemakaian skill kuat per rotasi.",
                  "Damage Awakenings come first and her only defensive one (A1) comes last. A3 boosts her click skill and widens the golden field, A2 is almost always active. Resonance 3 and 6 are very valuable because they add one extra enhanced skill per rotation."),
    "baicang": ("Sudah bagus tanpa copy tambahan. A1 mempercepat penumpukan Power Word, A6 menambah Crit Rate, A2 menambah ATK; tiga lainnya terutama kenyamanan. A5 baru berguna bila kamu punya Resonance 6.",
                "Already good with no extra copies. A1 speeds up Power Word stacking, A6 adds Crit Rate, A2 adds ATK; the other three are mostly comfort. A5 only matters if you reach Resonance 6."),
    "blackbird": ("A1 adalah peningkatan tunggal terbaik untuk Main DPS maupun sub DPS karena Ultimate kedua menghabiskan semua Malice. A4 menambah uptime buff ATK tim, dan A5 paling berguna bila seluruh tim bertipe Lakshana, Psyche, atau Chaos.",
                  "A1 is the best single upgrade for both main and sub DPS because her second Ultimate consumes all Malice. A4 raises the uptime of her team ATK buff, and A5 shines when the whole team is Lakshana, Psyche or Chaos."),
    "chaos": ("A6 menambah satu pemakaian mekanik utamanya (Final Verdict) dan membuka jendela burst baru. A1 menambah konsistensi, A2 menambah damage terhadap target ber-Warrant; A5 lebih unggul untuk boss, A3 untuk gerombolan. A4 hampir tidak berdampak.",
              "A6 adds an extra use of his core mechanic (Final Verdict) and opens a new burst window. A1 adds consistency and A2 adds damage against Warrant targets; A5 is better for bosses, A3 for groups. A4 has almost no impact."),
    "chiz": ("Chiz gratis, jadi semua Awakening-nya akan kamu dapat; urutan bisa berubah saat perhitungan sumbernya selesai. A2 dan A4 mempercepat pengumpulan Grain, A1 menambah kapasitas, dan A5 membuka pertarungan dengan penyimpanan penuh.",
             "Chiz is free, so you will get every Awakening; the order may change once the source finishes its calculations. A2 and A4 gather Grain faster, A1 raises capacity and A5 opens combat with full storage."),
    "daffodill": ("Daffodill itu unik karena beberapa Awakening saling menguatkan. A5 selalu yang pertama. A3 membuat Insight tidak terhapus dan bisa menumpuk, sedangkan A4 menambah damage per stack Insight, jadi ambil A4 setelah A3, bukan sebelumnya. Kombinasi A5 + A3 adalah yang terbaik bila punya dua copy, dan menambahkan A4 membuatnya lebih tinggi lagi.",
                  "Daffodill is unique because several Awakenings reinforce each other. A5 is always first. A3 stops Insight from being removed and lets it stack, while A4 adds damage per Insight stack, so take A4 after A3, not before. A5 + A3 is the best two-copy combo, and adding A4 raises it further."),
    "elyms": ("Dengan dua copy, ambil A1 + A3 dulu: A3 memberi stack Optical Illusion yang dibutuhkan A1. Kalau hanya satu, A4 adalah yang terkuat. Kombinasi A1 + A3 menuntut satu serangan kuat tambahan sehingga waktu di lapangan lebih lama.",
              "With two copies take A1 + A3 first: A3 supplies the Optical Illusion stacks that A1 needs. With only one, A4 is the strongest. The A1 + A3 combo needs one extra strong attack, so it costs more field time."),
    "fadia": ("Tentukan dulu fokusnya: damage pribadi atau utilitas tim. A5 mengubah cara membangunnya dan memberi lonjakan besar di wujud Lilith; A1 membuat rekan yang sedang di lapangan lebih tahan. Urutan bisa berubah saat perhitungan sumbernya selesai.",
              "Decide your focus first: personal damage or team utility. A5 changes how you build her and gives a big spike in Lilith form; A1 makes the on-field ally sturdier. The order may change once the source finishes its calculations."),
    "hathor": ("A2 dan A1 dipilih pertama karena memperbaiki siklus stack-nya. A3 menambah damage terhadap musuh non-boss, jadi kuat di AoE walau tampak kecil dalam hitungan melawan boss; aktifkan atau matikan sesuai pertarungan single target atau AoE.",
               "A2 and A1 come first because they fix her stack loop. A3 adds damage against non-boss enemies, so it is strong in AoE even though it looks small in boss calculations; toggle it on or off depending on single-target or AoE fights."),
    "hotori": ("A6 dan A3 diambil pertama. A5 memberi buff tim hanya saat melawan satu musuh (pilih A5 untuk single target, A1 bila ingin yang selalu aktif), dan A4 hanya berguna di AoE.",
               "A6 and A3 come first. A5 buffs the team only against a single enemy (pick A5 for single target, A1 if you want something always active), and A4 only helps in AoE."),
    "iroi": ("Hanya sebagian Awakening Iroi yang menambah damage tim: A5 terbaik, lalu A2 dan A1. A4 hanya berguna bila Iroi dipakai sebagai DPS; A3 dan A6 bersifat penyembuhan dan jarang dibutuhkan di konten akhir, jadi ambil sesuai kebutuhan.",
             "Only some of Iroi's Awakenings add team damage: A5 is best, then A2 and A1. A4 only helps if Iroi is used as a DPS; A3 and A6 are healing-focused and rarely needed in endgame, so take them as needed."),
    "jiuyuan": ("A2 jelas yang pertama (menguatkan Lethal Rose Pact dan menyembuhkan tim), A6 kedua terutama melawan boss dan musuh elit. A1 paling akhir karena butuh minimal tiga target.",
                "A2 is clearly first (strengthens Lethal Rose Pact and heals the team), A6 second especially against bosses and elites. A1 is last because it needs at least three targets."),
    "lacrimosa": ("A5 untuk damage mentah (Lacrimosa DPS), A6 untuk utilitas (sub DPS yang memicu Esper Cycle tanpa mengumpulkan rate). A4, A3, dan A1 saling menguatkan di sekitar Nightmare; untuk Lacrimosa DPS, A4 atau A3 biasanya lebih baik daripada A6.",
                  "A5 for raw damage (DPS Lacrimosa), A6 for utility (a sub DPS who triggers Esper Cycles without building rate). A4, A3 and A1 reinforce each other around Nightmare; for a DPS Lacrimosa, A4 or A3 is usually better than A6."),
    "linko": ("Dua pilihan pertama sudah jelas: A6 dan A5, pilih sesuai kebutuhan tim (A5 untuk tim yang bergantung pada Esper Cycle). A1 lalu A4 menambah damage; A3 dan A2 lebih kecil dan terutama memperlancar rotasi.",
              "The first two are clear: A6 and A5, pick by team need (A5 for teams that rely on Esper Cycles). A1 then A4 add damage; A3 and A2 are smaller and mainly smooth the rotation."),
    "nanally": ("A1 biasanya pertama bila hanya punya satu copy, tetapi dengan dua copy A3 + A5 memberi damage lebih besar karena saling menguatkan. A4 makin baik bila A2 sudah ada. A6 terutama kenyamanan di luar pertarungan.",
                "A1 is usually first if you only have one copy, but with two copies A3 + A5 gives more damage because they feed each other. A4 gets better once A2 is in. A6 is mostly out-of-combat comfort."),
    "sakiri": ("A4 sangat disarankan karena menggandakan buff ATK tim setelah Ultimate. A5 situasional karena tidak semua musuh bisa dilempar ke udara. Sisanya kecil karena peran Sakiri bukan menyerang.",
               "A4 is highly recommended because it doubles the team ATK buff after her Ultimate. A5 is situational because not every enemy can be launched. The rest are minor since Sakiri's role is not damage."),
    "shinku": ("A3 memudahkan rotasi dan A2 sedikit lebih besar untuk damage murni; A4 hanya layak diambil bila A3 sudah ada. A5 bersifat bertahan.",
               "A3 makes rotations easier and A2 is slightly larger for pure damage; A4 is only worth taking once A3 is in. A5 is defensive."),
    "zankou": ("A5 terbaik (Break paksa dan Break DMG tim, apalagi bersama Daffodill). A2 menguatkan Ultimate dan membuat A4 jauh lebih baik, jadi A4 diambil setelah A2. A6 lebih bernilai bila Zankou Main DPS, bahkan bisa jadi pilihan ketiga; A3 hanya bertahan.",
               "A5 is best (forced Break and team Break DMG, especially with Daffodill). A2 powers up her Ultimate and makes A4 much better, so take A4 after A2. A6 is worth more as Main DPS and can even be the third pick; A3 is defensive only."),
    "zero-1051": ("Kamu akan mendapat semua Awakening Zero, jadi jangan terlalu dipusingkan. A2 pertama (pemulihan energi Ultimate), lalu A3. A1 dan A6 hanya aktif melawan musuh yang levelnya lebih rendah sehingga hampir tidak berguna di konten utama.",
                  "You will get all of Zero's Awakenings, so do not stress. A2 first (Ultimate energy recovery), then A3. A1 and A6 only trigger against lower-level enemies, so they are nearly useless in main content."),
}
NOTE["zero-1046"] = NOTE["zero-1051"]


def parse(line):
    """'A1 = A6 > A3' -> ([[1, 6], [3]], {1: 1, 6: 1, 3: 2}) (peringkat padat; sama kuat berbagi nomor)."""
    groups, cur, prev_op = [], [], None
    tokens = re.findall(r"A(\d)|([>=~])", line)
    for num, op in tokens:
        if num:
            cur.append(int(num))
        elif op == ">":
            groups.append(cur)
            cur = []
    groups.append(cur)
    rank = {n: i + 1 for i, g in enumerate(groups) for n in g}
    return groups, rank


def source(slug):
    ps = PRYDWEN_SLUG.get(slug, slug)
    return {"title": "Awakening order of importance", "by": "Prydwen", "url": f"https://www.prydwen.gg/neverness-to-everness/characters/{ps}"}
