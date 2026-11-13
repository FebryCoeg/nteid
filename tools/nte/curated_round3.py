"""Kurasi putaran 3: Iroi, Chiz, Lacrimosa, Zankou, Nanally, Hotori, Chaos. Dipanggil oleh make_curated.py.

Sumber: panduan Beware the Raddish (dirangkum dengan kata sendiri, ada kredit dan tautan) dan spreadsheet uji
pemilik situs. Catatan pemetaan: nama Awakening Nanally di spreadsheet berbeda dari nama di game, jadi dipetakan
lewat artinya: Gang First Established=A1, Call Me Big Sister=A3, Not a Troublemaker=A4, Second Member=A2,
Followers Everywhere=A5, Because We Are Family=A6.
"""
from curated_round2 import ALT, RAD, SHEET, TESTED, T, V_BB, team

V_IROI = {"title": "Complete IROI Guide NTE", "by": RAD, "url": "https://youtu.be/mk5pkOImoeg"}
V_CHIZ = {"title": "NTE Chiz In Depth Guide", "by": RAD, "url": "https://youtu.be/pjwZCUm1XhY"}
V_LACRI = {"title": "NTE Lacrimosa Guide in 4 minutes", "by": RAD, "url": "https://youtu.be/fOqDMDELYA8"}
V_NOVA = {"title": "NTE Lacrimosa Nova Team Guide", "by": RAD, "url": "https://youtu.be/1Hsg8Fndu1I"}
V_ZANKOU = {"title": "Complete Zankou Guide NTE", "by": RAD, "url": "https://youtu.be/ktPZnmnHrGU"}
V_HEXED = {"title": "Advanced Hexed Team Guide NTE", "by": RAD, "url": "https://youtu.be/OA4f4tNipqg"}
V_ZHOTORI = {"title": "Zankou Hotori Rotations", "by": RAD, "url": "https://youtu.be/tARn79AL1kQ"}
V_BLOSSOM = {"title": "NTE Perfect Blossom Rotation Guide", "by": RAD, "url": "https://youtu.be/Vi4AB7rnBI0"}


def apply(out):
    # ------------------------------------------------------------------ IROI
    out["iroi"] = {
        "arcs": ["the-wrong-gate", "youthful-fantasy", "fluff-of-fleetness", "clear-skies"],
        "arcPct": {"the-wrong-gate": {"team": 100, "solo": 100}, "youthful-fantasy": {"team": 93.5, "solo": 73.3},
                   "fluff-of-fleetness": {"team": 84.4, "solo": 72}, "clear-skies": {"team": 80.4, "solo": 75.2}},
        "arcNote": T(
            "Arc signature menambah 15% DMG Bonus seluruh tim, sekitar +7,5 sampai 11,5% damage tim tergantung susunan (kurang berguna di tim Blossom karena damage Vita Bud tidak terpengaruh DMG Bonus). Buff ATK Iroi bergantung pada ATK dasar, sehingga Arc lain dengan ATK dasar sama memberi buff yang hampir sama. Dengan kata lain, Iroi sudah pendukung bagus tanpa Arc signature; incar Arc itu hanya bila ingin damage pribadinya. Persentase dari data uji pemilik situs (refine 5 menambah +6,2% tim dan +29,2% solo).",
            "The signature Arc adds 15% team DMG Bonus, about +7.5 to 11.5% team damage depending on the team (less useful in Blossom teams since Vita Bud damage ignores DMG Bonus). Her ATK buff scales with base ATK, so other Arcs with the same base ATK give nearly the same buff. She is already a great support without it; chase it only for her personal damage. Percentages from the owner's test data (refine 5 adds +6.2% team and +29.2% solo)."),
        "sets": [{"id": "Suit11", "pieces": 4}, {"id": "Suit2", "pieces": 4}],
        "setNote": {"Suit11": T("Untuk Iroi sebagai pendukung dan penyembuh; ATK % sebagai main stat menguatkan penyembuhan dan damage pribadi.", "For Iroi as buffer and healer; ATK % main stat boosts both healing and personal damage."),
                    "Suit2": T("Untuk build berorientasi damage atau bila rekan lain sudah memakai Speedy Hedgehog; main stat CRIT Rate.", "For a damage-oriented build or when a teammate already runs Speedy Hedgehog; CRIT Rate main stat.")},
        "stats": ["ATK %"], "sub": ["ATK %", "DMG Bonus", "CRIT Rate", "Break"],
        "statNote": T("Sebagai pendukung sub stat tidak terlalu penting (ATK, Break, DMG Bonus, dan Crit selalu berguna). Build damage: CRIT Rate sebagai main stat, lalu sub stat CRIT Rate, DMG Bonus universal, CRIT DMG, dan ATK.",
                      "As a support her sub stats matter little (ATK, Break, DMG Bonus and Crit are always welcome). Damage build: CRIT Rate main stat, then sub stats CRIT Rate, universal DMG Bonus, CRIT DMG and ATK."),
        "awks": [5, 1, 2, 3, 4, 6],
        "awkGain": {
            "1": T("+8,9% damage pribadi; bisa 3 serangan charge di rotasi pertama", "+8.9% personal damage; allows three charged attacks in the first rotation"),
            "2": T("+5,5 sampai 11,2% damage pribadi (lebih besar bila rekan sering memakai Redirect, misalnya Shinku)", "+5.5 to 11.2% personal damage (more with allies who spam Redirect, like Shinku)"),
            "3": T("+36% penyembuhan; berguna di commission berisiko tinggi", "+36% healing; useful in high-risk commissions"),
            "4": T("+11,3% damage pribadi sebagai Main DPS; tidak berguna sebagai pendukung", "+11.3% personal damage as Main DPS; useless as support"),
            "5": T("+15% buff ATK pada passive kedua; sekitar +6,5% damage tim", "+15% ATK buff on her second passive; about +6.5% team damage"),
            "6": T("Berguna terutama untuk Iroi Main DPS (merombak rekan jadi domba); belum teruji penuh", "Mostly for Main DPS Iroi (turns allies into sheep); not fully tested"),
            "b3": T("Skill +1 level (sekitar +8% damage pribadi) dan DEF sekutu +30%", "Skills +1 level (about +8% personal damage) and allies' DEF +30%"),
            "b6": T("+7,4 sampai 9,2% damage tim lewat Crit DMG tim; damage pribadi hingga +47,4% bila ketiga rekan jadi domba", "+7.4 to 9.2% team damage via team Crit DMG; personal damage up to +47.4% with all three allies as sheep"),
        },
        "skills": ["basic", "redirect", "ultimate", "support"],
        "skillNote": T("Buka dulu kedua passive (buff ATK tidak terpengaruh level skill). Naikkan Basic Attack lebih dulu karena serangan charge-nya lebih sakit daripada Ultimate. Bila dipakai sebagai Main DPS, naikkan semuanya.",
                       "Unlock both passives first (the ATK buff does not scale with skill level). Level Basic Attack first since her charged attack out-damages her Ultimate. Level everything if you use her as main DPS."),
        "src": [V_IROI, V_ZANKOU, SHEET],
        "teams": [
            team("Shinku + Hathor + Zero + Iroi", ["shinku", "hathor", "zero-1051", "iroi"], T("TIM SHINKU", "SHINKU TEAM"), V_IROI, [
                T("Blossom enhancement Iroi membuat Charge terpicu lebih konsisten dalam waktu lebih lama dibanding Nanally. Hathor bisa diganti Skia untuk Remora lebih panjang, tetapi Remora Hathor lebih konsisten melawan musuh yang melompat atau terbang.",
                  "Iroi's Blossom enhancement makes Charge trigger more consistently over a longer window than Nanally. Hathor can be swapped for Skia for a longer Remora, but Hathor's Remora is more reliable against dashing or flying enemies.")]),
            team("Blossom: Iroi + Zero + Nanally + Jiuyuan", ["iroi", "zero-1051", "nanally", "jiuyuan"], T("TIM BLOSSOM", "BLOSSOM TEAM"), V_IROI, [
                T("Tiap Vita Pistol dari salinan Vita Bud berwarna pink milik Iroi memicu passive kedua Jiuyuan. Dalam satu rotasi Blossom terpicu dua kali sehingga ada sekitar 80 pemicu tambahan.",
                  "Every Vita Pistol from Iroi's pink Vita Bud copy triggers Jiuyuan's second passive. Blossom triggers twice per rotation, giving about 80 extra triggers.")]),
            team("Hexed: Zankou + Daffodill + Sakiri + Iroi", ["zankou", "daffodill", "sakiri", "iroi"], T("TIM ZANKOU", "ZANKOU TEAM"), V_ZANKOU, [
                T("Buff dan energi tim dari Iroi menjadikannya pilihan terbaik untuk tim Hexed saat itu (kemungkinan digantikan Linko).", "Iroi's team buffs and energy make her the best pick for the Hexed team at the time (likely to be replaced by Linko).")]),
            team("Chaos Stain: Iroi + Sakiri + Blackbird + Chaos", ["iroi", "sakiri", "blackbird", "chaos"], ALT, V_BB, [
                T("Lebih baik daripada tim Remora lama (Hathor dan Zero) dan punya batas damage lebih tinggi.", "Better than the older Remora team (Hathor and Zero) with a higher damage ceiling.")]),
            team("Shinku + Iroi + Zero + Hathor", ["shinku", "iroi", "zero-1051", "hathor"], TESTED, SHEET, [], T("3,87 juta damage, puncak DPS 282.861, clear 1 menit 2 detik", "3.87M damage, peak DPS 282,861, 1m02s clear")),
            team("Zankou + Lacrimosa + Sakiri + Iroi", ["zankou", "lacrimosa", "sakiri", "iroi"], TESTED, SHEET, [], T("2,97 juta damage, 43 detik, puncak DPS 205.143", "2.97M damage, 43s, peak DPS 205,143")),
            team("Akane + Blackbird + Iroi + Linko", ["akane-rin", "blackbird", "iroi", "linko"], TESTED, SHEET, [], T("1,93 juta damage, 17 detik, puncak DPS 421.447", "1.93M damage, 17s, peak DPS 421,447")),
        ],
    }

    # ------------------------------------------------------------------ CHIZ
    out["chiz"] = {
        "sets": [{"id": "Suit6", "pieces": 4}],
        "setNote": {"Suit6": T("Terbaik karena damage berbasis grains-nya juga diuntungkan DEF dan RES ignore.", "Best because her grains-based damage also benefits from DEF and RES ignore.")},
        "stats": ["DMG Bonus"], "sub": ["DMG Bonus", "CRIT DMG", "CRIT Rate", "ATK %"],
        "statNote": T("Sekitar 83% damage Chiz berasal dari damage berbasis grains yang tidak bisa crit dan tidak bergantung ATK, jadi main stat terbaik adalah DMG Bonus Cosmos (CRIT DMG hanya bila dipakai sebagai sub DPS yang masuk untuk Ultimate). Sub stat utama: DMG Bonus universal. Chiz dengan semua sub stat sempurna hanya sekitar 14% lebih kuat daripada yang hanya punya DMG Bonus universal.",
                      "About 83% of Chiz's damage is grains-based, which cannot crit and does not scale with ATK, so the best main stat is Cosmos DMG Bonus (CRIT DMG only when used as a sub DPS who comes in for her Ultimate). Top sub stat: universal DMG Bonus. A Chiz with all perfect sub stats is only about 14% stronger than one with just universal DMG Bonus."),
        "awks": [1, 6, 5, 3, 4, 2],
        "awkGain": {
            "1": T("Salah satu dari tiga Awakening damage; prioritas 1 sebagai Main DPS dan prioritas 2 sebagai sub DPS", "One of three damage Awakenings; priority 1 as main DPS, 2 as sub DPS"),
            "5": T("Prioritas 3 sebagai Main DPS, prioritas 1 sebagai sub DPS (makin lama di lapangan makin kurang bernilai)", "Priority 3 as main DPS, priority 1 as sub DPS (less valuable the longer she stays on field)"),
            "6": T("Prioritas 2 sebagai Main DPS, prioritas 3 sebagai sub DPS", "Priority 2 as main DPS, 3 as sub DPS"),
            "3": T("Kenyamanan: lebih banyak kesempatan memakai skill di waktu yang tepat", "Quality of life: more chances to use her skill at the right time"),
            "4": T("Kenyamanan: mengumpulkan grain lebih cepat", "Quality of life: gathers grains faster"),
            "2": T("Kenyamanan: mengumpulkan grain lebih cepat", "Quality of life: gathers grains faster"),
        },
        "src": [V_CHIZ],
        "teams": [
            team("Charge: Chiz + Zero + Skia + Jiuyuan", ["chiz", "zero-1051", "skia", "jiuyuan"], T("MAIN DPS", "MAIN DPS"), V_CHIZ, [
                T("Chiz kurang diuntungkan buff ATK, jadi pendukung ATK klasik kurang efektif; tim Charge menjaga Ultimate-nya selalu siap lewat energi tambahan. Skia diganti Hathor, Jiuyuan diganti Mint. (Nama anggota Anima dibaca dari subtitle otomatis, mohon dicek.)",
                  "Chiz gains little from ATK buffs, so classic ATK supports are less effective; the Charge team keeps her Ultimate always ready through extra energy. Skia can be swapped for Hathor, Jiuyuan for Mint. (The Anima member was read from auto subtitles, please double-check.)")]),
            team("Charge: Chiz + Hathor + Elyms + Iroi", ["chiz", "hathor", "elyms", "iroi"], T("RAMAH PEMULA", "BEGINNER FRIENDLY"), {"title": "Complete ELYMS Guide NTE", "by": RAD, "url": "https://youtu.be/HMm6rqo5xj4"}, [
                T("Murah dan mudah dimainkan; damage lebih rendah dari tim meta.", "Cheap and easy; lower damage than meta teams.")]),
        ],
    }

    # ------------------------------------------------------------------ LACRIMOSA
    out["lacrimosa"] = {
        "arcs": ["the-last-rose", "fluff-of-fleetness", "youthful-fantasy"],
        "arcNote": T("Pilihannya sedikit. Arc signature The Last Rose sebagai acuan 100%; alternatif yang layak hanya Fluff of Fleetness (Battle Pass berbayar) dan Youthful Fantasy (gratis, dijatuhkan Black Tome pada kemenangan pertama). Battle Pass tidak disarankan: stack hilang saat ganti karakter, buff ATK-nya di belakang, dan cakupannya kurang. Pakai Youthful Fantasy bila tidak menarik signature.",
                     "Few options. The signature The Last Rose is the 100% benchmark; the only decent alternatives are Fluff of Fleetness (paid Battle Pass) and Youthful Fantasy (free, dropped by Black Tome on first defeat). The Battle Pass Arc is not recommended: stacks are lost on switching, its ATK buff is back-loaded and coverage is poor. Use Youthful Fantasy if you do not pull the signature."),
        "sets": [{"id": "Suit1", "pieces": 4}],
        "stats": ["CRIT Rate", "CRIT DMG", "DMG Bonus"], "sub": ["ATK %", "CRIT Rate", "CRIT DMG", "DMG Bonus", "Cycle Intensity"],
        "statNote": T("Di Awakening 0, CRIT Rate atau CRIT DMG sama-sama oke (CRIT Rate lebih konsisten). Di Awakening tinggi, DoT jadi porsi damage lebih besar dan crit rate DoT tetap 50%, jadi pilih DMG Bonus Chaos atau CRIT DMG sebagai main stat. Cycle Intensity Lacrimosa harus lebih tinggi daripada Sakiri agar Scorch dihitung sebagai damage Chaos (diuntungkan Diabolos 24% Chaos RES ignore); Sakiri sebaiknya menumpuk Break Intensity.",
                      "At Awakening 0 CRIT Rate or CRIT DMG are both fine (CRIT Rate is more consistent). At higher Awakenings DoT becomes a bigger share with a fixed 50% crit rate, so pick Chaos DMG Bonus or CRIT DMG main stat. Lacrimosa's Cycle Intensity must be higher than Sakiri's so Scorch counts as Chaos damage (benefiting from Diabolos' 24% Chaos RES ignore); Sakiri should stack Break Intensity instead."),
        "awks": [5, 6],
        "awkGain": {
            "5": T("Inti kit; menambah kecepatan clear sekitar 17 sampai 20% dalam uji Raddish", "The core of the kit; about 17 to 20% faster clears in Raddish's test"),
            "6": T("Prioritas utama untuk tim quick-swap Discord", "Top priority for a quick-swap Discord team"),
            "3": T("Kehilangan konsistensi melawan musuh gesit atau terbang", "Loses consistency against mobile or flying enemies"),
        },
        "skills": ["basic", "redirect", "ultimate", "support"],
        "skillNote": T("Naikkan Basic Attack lebih dulu, lalu Skill, Ultimate, dan Support paling akhir. Skill menyalin kemampuan musuh: Tomato Devil untuk boss dan single target, Black Tome untuk kelompok musuh, Where Is Home bila butuh 1,5 detik kekebalan.",
                       "Level Basic Attack first, then Skill, Ultimate, and Support last. Her Skill copies enemy abilities: Tomato Devil for bosses and single targets, Black Tome for groups, Where Is Home when you need 1.5s of invincibility."),
        "src": [V_LACRI, V_NOVA, V_ZANKOU, SHEET],
        "teams": [
            team("Lacrimosa + Sakiri + Haniel + Daffodill", ["lacrimosa", "sakiri", "haniel", "daffodill"], T("DAMAGE TERTINGGI", "HIGHEST DAMAGE"), V_LACRI, [
                T("Sakiri adalah rekan terpenting (kesimpulan semua panduan CN yang tepercaya). Daffodill A1; tanpa A1 gantikan dengan Fadia atau Adler untuk lebih tahan banting.",
                  "Sakiri is the most important teammate (the conclusion of every reputable CN guide). Daffodill at A1; without A1 swap her for Fadia or Adler for more survivability.")]),
            team("Hemat: Lacrimosa + Sakiri + Haniel", ["lacrimosa", "sakiri", "haniel"], T("3 ANGGOTA", "3 MEMBERS"), V_NOVA, [
                T("Tanpa anggota keempat, Lacrimosa A0 bisa membersihkan separuh pertama stasiun 12 dalam 74 detik dengan investasi minim. Haniel cukup menumpuk Cycle Intensity (250 CI membuat Nova level 70 menghasilkan 35.000 damage); Sakiri cukup punya level dan Arc tinggi karena buff ATK-nya tetap. Awakening 5 membuatnya 11 detik lebih cepat.",
                  "With no fourth member, A0 Lacrimosa can clear the first half of station 12 in 74s with minimal investment. Haniel only needs Cycle Intensity (250 CI makes a level 70 Nova deal 35,000 damage); Sakiri just needs a high level and Arc since her ATK buff is fixed. Awakening 5 made it 11s faster.")]),
            team("Dual DPS: Zankou + Lacrimosa + Sakiri + Adler", ["zankou", "lacrimosa", "sakiri", "adler"], ALT, V_ZANKOU, [
                T("Passive Scorch Adler hampir tanpa syarat bila bersama Zankou dan hampir tanpa investasi. Slot keempat juga bisa Haniel atau Fadia.", "Adler's Scorch enhancement is nearly unconditional with Zankou and needs almost no investment. The fourth slot can also be Haniel or Fadia.")]),
            team("Lacrimosa main + Zankou penyokong", ["lacrimosa", "sakiri", "haniel", "zankou"], ALT, V_ZANKOU, [
                T("Zankou berperan sebagai buffer DoT dan Scorch dengan Lost Radiance dan cartridge CRIT DMG; jangan khusus farming build ini bila sudah punya build Main DPS.", "Zankou acts as a DoT and Scorch buffer with Lost Radiance and a CRIT DMG cartridge; do not farm this build specifically if you already have a main DPS build.")]),
            team("Zankou + Lacrimosa + Sakiri + Iroi", ["zankou", "lacrimosa", "sakiri", "iroi"], TESTED, SHEET, [], T("2,97 juta damage, 43 detik, puncak DPS 205.143", "2.97M damage, 43s, peak DPS 205,143")),
        ],
    }

    # ------------------------------------------------------------------ ZANKOU (melengkapi data uji yang sudah ada)
    z = out["zankou"]
    sheet_teams = z.get("teams", [])
    z.update({
        "arcs": ["ravenous-blade", "fluff-of-finesse", "watch-your-heads", "contemplative-cat"],
        "arcPct": {"ravenous-blade": {"m1": 100, "m5": 134}, "fluff-of-finesse": {"m1": 75, "m5": 84},
                   "watch-your-heads": {"m1": None, "m5": 70.5}, "contemplative-cat": {"m1": 65.9, "m5": None}},
        "arcNote": T("Arc signature memberi 40% Crit Rate dan hingga 63% Crit DMG sebagai acuan 100%; tanpanya Zankou kehilangan 40% Crit Rate, jadi pakai CRIT Rate sebagai main stat. Raddish menyarankan Contemplative Cat atau Watch Your Heads sebagai pengganti, dan menilai Fluff of Finesse serta Cosmos Daze, Wild Reverie tidak konsisten karena syaratnya. Data uji pemilik situs menempatkan Fluff of Finesse (3 stack) cukup tinggi, jadi pakai sesuai ketersediaan. M1 dan M5 = tingkat refine.",
                     "The signature gives 40% Crit Rate and up to 63% Crit DMG as the 100% benchmark; without it Zankou loses 40% Crit Rate, so use CRIT Rate main stat. Raddish recommends Contemplative Cat or Watch Your Heads as replacements and calls Fluff of Finesse and Cosmos Daze, Wild Reverie inconsistent due to their conditions. The owner's test data rates Fluff of Finesse (3 stacks) fairly high, so pick what you have. M1 and M5 are refine levels."),
        "sets": [{"id": "Suit4", "pieces": 4}, {"id": "Suit6", "pieces": 4}],
        "setNote": {"Suit6": T("Untuk build sub DPS dan pemicu Scorch di tim Lacrimosa (CRIT DMG dan Cycle Intensity setinggi mungkin, DEF ignore juga menaikkan Scorch). Hanya untuk Zankou A0 berinvestasi rendah.", "For the sub DPS and Scorch-enabler build in a Lacrimosa team (as much CRIT DMG and Cycle Intensity as possible; DEF ignore also boosts Scorch). Only for a low-investment A0 Zankou.")},
        "stats": ["CRIT DMG", "DMG Bonus", "CRIT Rate"], "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus"],
        "statNote": T("Dengan Arc signature, main stat CRIT DMG atau DMG Bonus Incantation (pilih yang sub stat-nya lebih baik); untuk Arc lain pakai CRIT Rate. Cari CRIT Rate sampai sekitar 70%, lalu CRIT DMG dan DMG Bonus universal, meski Scorch punya crit rate tetap 50%.",
                      "With the signature Arc use CRIT DMG or Incantation DMG Bonus main stat (whichever has better sub stats); for other Arcs use CRIT Rate. Aim for about 70% CRIT Rate, then CRIT DMG and universal DMG Bonus, even though Scorch has a fixed 50% crit rate."),
        "awks": [2, 4, 6, 1, 5, 3],
        "awkGain": {
            "1": T("Sekitar +9,8 sampai 11% damage pribadi; buff Hunt dan Delusion permanen dan DoT menyebar dari semua serangan", "About +9.8 to 11% personal damage; permanent Hunt and Delusion and DoT spreading from every attack"),
            "2": T("Sekitar +10,6 sampai 13% damage pribadi; Kindling menambah 150% damage final Ultimate (pengali independen)", "About +10.6 to 13% personal damage; Kindling adds 150% final Ultimate damage (independent multiplier)"),
            "3": T("Kenyamanan: ketahanan interupsi dan regen HP saat Hunt dan Delusion aktif", "Quality of life: interruption resistance and HP regen while Hunt and Delusion are active"),
            "4": T("Bersama Awakening 2 sekitar +23,4% damage pribadi; Dangle Ultimate tersedia tanpa skill pink", "Together with Awakening 2 about +23.4% personal damage; Dangle Ultimate no longer needs the pink skill"),
            "5": T("Membuat musuh langsung Broken lewat skill emas dan +300% Break DMG sekutu; kuat di tim Break bersama Daffodill", "Forces Broken via the golden skill and +300% ally Break DMG; strong in the Break team with Daffodill"),
            "6": T("Sekitar +6,8 sampai 15% damage pribadi tergantung rotasi (12% per stack DoT, hingga 240%)", "About +6.8 to 15% personal damage depending on rotation (12% per DoT stack up to 240%)"),
            "b3": T("Skill +1 level dan +20% rasio Ultimate; sekitar +12,6% damage pribadi", "Skills +1 level and +20% Ultimate ratios; about +12.6% personal damage"),
            "b6": T("ATK +40% permanen (sekitar +11,3% damage pribadi); memindahkan Scorch ke musuh baru", "Permanent ATK +40% (about +11.3% personal damage); transfers Scorch to new enemies"),
        },
        "skills": ["basic", "ultimate", "redirect", "support"],
        "skillNote": T("Buka kedua passive, utamakan Basic Attack dan Ultimate (damage terbesar), lalu Redirect. Support cukup Lv.1 bila bahan terbatas.",
                       "Unlock both passives and prioritise Basic Attack and Ultimate (the most damage), then Redirect. Support can stay at Lv.1 if you are short on resources."),
        "src": [V_ZANKOU, V_HEXED, V_ZHOTORI, SHEET],
        "teams": [
            team("Hexed: Zankou + Daffodill + Sakiri + Iroi", ["zankou", "daffodill", "sakiri", "iroi"], T("TERBAIK SAAT INI", "BEST RIGHT NOW"), V_ZANKOU, [
                T("Buff dan energi Iroi membuatnya pilihan terbaik untuk tim Hexed (kemungkinan digantikan Linko). Zankou memicu Scorch di awal pertempuran dan membuatnya bertahan.", "Iroi's buffs and energy make her the best pick for the Hexed team (likely to be replaced by Linko). Zankou triggers Scorch at the start and keeps it up."),
                T("Rotasi lanjutan dengan animation cancel pada serangan cabang Zankou menambah damage tim hingga sekitar 20% (sekitar 12% bahkan tanpa Hexed terpicu), tetapi tidak wajib untuk konten akhir.", "The advanced rotation with animation-cancelled branch attacks adds up to about 20% team damage (about 12% even without Hexed), but is not required for endgame content.")]),
            team("Break: Zankou + Daffodill + Sakiri + Adler", ["zankou", "daffodill", "sakiri", "adler"], T("TIM BREAK", "BREAK TEAM"), V_ZANKOU, [
                T("Semua rekan menumpuk Break Intensity; Arc The Great Thief milik Adler memberi tambahan 210 Break Intensity ke tim. Lost Radiance di Sakiri dan Adler menambah Break damage lewat DEF ignore. Dengan Zankou A1 dan Awakening 5-nya tim ini menjadi sangat kuat.", "Everyone stacks Break Intensity; Adler's The Great Thief Arc gives the team an extra 210 Break Intensity. Lost Radiance on Sakiri and Adler boosts Break damage via DEF ignore. With A1 Zankou and her Awakening 5 this team becomes extremely strong.")]),
            team("Dual DPS: Zankou + Lacrimosa + Sakiri + Adler", ["zankou", "lacrimosa", "sakiri", "adler"], ALT, V_ZANKOU, [
                T("Slot keempat fleksibel: Haniel, Adler, atau Fadia.", "The fourth slot is flexible: Haniel, Adler or Fadia.")]),
            team("Zankou + Lacrimosa + Sakiri + Hotori", ["zankou", "lacrimosa", "sakiri", "hotori"], ALT, V_ZHOTORI, [
                T("Semua karakter A0 dengan Arc signature dan build standar.", "All characters at A0 with their signature Arc and standard builds.")]),
            team("Zankou + Daffodill + Sakiri + Hotori", ["zankou", "daffodill", "sakiri", "hotori"], ALT, V_ZHOTORI, []),
        ] + sheet_teams,
    })

    # ------------------------------------------------------------------ NANALLY
    out["nanally"] = {
        "arcs": ["ready-ready", "fluff-of-fortitude", "raging-flames", "song-of-the-whale"],
        "arcPct": {"ready-ready": {"m1": 100, "m5": 119.5}, "fluff-of-fortitude": {"m1": 84.6, "m5": None},
                   "raging-flames": {"m1": 77.4, "m5": None}, "song-of-the-whale": {"m1": 76.9, "m5": None}},
        "arcNote": T("Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine). Pilihan gratis terbaik: Oraora! pada refine 5 (sekitar 67,7%).",
                     "Percentages from the owner's test data (M1 and M5 are refine levels). Best free option: Oraora! at refine 5 (about 67.7%)."),
        "awks": [1, 3, 4, 2, 5, 6],
        "awkGain": {
            "1": T("Wajib diambil pertama: optimasi energi", "Take first: energy optimisation"),
            "2": T("+4,31% durasi Underboss (opsional)", "+4.31% Underboss duration (optional)"),
            "3": T("+13,49% total damage; wajib kedua", "+13.49% total damage; take second"),
            "4": T("+7,8% damage Underboss; pilihan ketiga", "+7.8% Underboss damage; third pick"),
            "5": T("+4,45% ATK (opsional)", "+4.45% ATK (optional)"),
            "6": T("Utilitas: memperpanjang durasi buff", "Utility: extends buff duration"),
        },
        "src": [V_BLOSSOM, SHEET],
        "teams": [
            team("Blossom premium: Nanally + Zero + Jiuyuan + Hotori", ["nanally", "zero-1051", "jiuyuan", "hotori"], T("TERBAIK", "BEST"), V_BLOSSOM, [
                T("Hotori merekam skill rekan lalu memutarnya ulang saat time stop untuk menghasilkan enam Vita Bud; Jiuyuan memasang Lethal Rose Pact dan mengembalikan 40% energi Ultimate saat dipicu.", "Hotori records teammates' skills and replays them during her time stop to produce six Vita Buds; Jiuyuan applies Lethal Rose Pact and refunds 40% Ultimate energy when it triggers."),
                T("Efek Crit DMG +30% Nanally tetap aktif bila ganti karakter cukup cepat setelah memakai skill-nya. Video CN yang ditautkan Raddish menunjukkan tim A0 clear dalam 38 detik.", "Nanally's +30% Crit DMG stays active if you switch out fast enough after her skill. A CN video linked by Raddish shows an A0 team clearing in 38s.")]),
            team("Nanally + Linko + Sakiri + Iroi", ["nanally", "linko", "sakiri", "iroi"], ALT, {"title": "Complete LINKO Guide NTE", "by": RAD, "url": "https://youtu.be/TA4qUNCyL9k"}, [
                T("Bisa dimainkan dengan Linko A0 dan cukup untuk Beyond the Rails.", "Playable with A0 Linko and enough for Beyond the Rails.")]),
            team("Nanally + Linko + Iroi + Sakiri", ["nanally", "linko", "iroi", "sakiri"], TESTED, SHEET, [], T("2,90 juta damage, 60 detik", "2.90M damage, 60s")),
        ],
    }

    # ------------------------------------------------------------------ HOTORI
    out["hotori"] = {
        "arcs": ["marching-beyond-time", "the-rain-that-shook-the-world", "fluff-of-fearlessness", "hethereau-s-keeper"],
        "arcPct": {"marching-beyond-time": {"m1": 100, "m5": 131.1}, "the-rain-that-shook-the-world": {"m1": 83.6, "m5": 88.4},
                   "fluff-of-fearlessness": {"m1": 78.9, "m5": 84.8}, "hethereau-s-keeper": {"m1": 74, "m5": 80.2}},
        "arcNote": T("Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine). Day Off juga masuk daftar uji (sekitar 68,4% pada M1).", "Percentages from the owner's test data (M1 and M5 are refine levels). Day Off was also tested (about 68.4% at M1)."),
        "awks": [1, 6, 2, 5, 4, 3],
        "awkGain": {
            "1": T("+16,6 sampai 24% damage lewat mekanik Recorded Skill", "+16.6 to 24% damage via the Recorded Skill mechanic"),
            "2": T("+9,2 sampai 13,3% damage stabil selama Time Stop", "+9.2 to 13.3% steady damage during Time Stop"),
            "3": T("0 sampai 16,7%; refund energi sangat situasional", "0 to 16.7%; very situational energy refund"),
            "4": T("Tergantung rotasi: pengisian energi lebih cepat", "Rotation dependent: faster energy charging"),
            "5": T("+8,45 sampai 10% damage tim saat melawan musuh tunggal (boss)", "+8.45 to 10% team damage against a single target (boss)"),
            "6": T("+22,56% damage (dengan Arc signature) lewat DEF ignore", "+22.56% damage (with the signature Arc) via DEF ignore"),
        },
        "src": [V_BLOSSOM, V_ZHOTORI, SHEET],
        "teams": [
            team("Blossom premium: Hotori + Nanally + Zero + Jiuyuan", ["hotori", "nanally", "zero-1051", "jiuyuan"], T("TERBAIK", "BEST"), V_BLOSSOM, [
                T("Dari data uji: Zero memberi 100 Cycle Intensity instan saat direkam (sangat disarankan), Hathor memicu 2 passive Stuck sekaligus, Jiuyuan menghasilkan 4 peluru penuh dalam rekaman. Buff Crit DMG milik Nanally tidak ikut terekam.", "From test data: Zero gives 100 Cycle Intensity instantly when recorded (highly recommended), Hathor triggers two Stuck passives at once, Jiuyuan produces four full ammo in the recording. Nanally's Crit DMG buff is not recorded.")]),
            team("Zankou + Lacrimosa + Sakiri + Hotori", ["zankou", "lacrimosa", "sakiri", "hotori"], ALT, V_ZHOTORI, []),
            team("Zankou + Daffodill + Sakiri + Hotori", ["zankou", "daffodill", "sakiri", "hotori"], ALT, V_ZHOTORI, []),
        ],
    }

    # ------------------------------------------------------------------ CHAOS
    out["chaos"] = {
        "arcs": ["what-s-desired", "fluff-of-ferocity", "a-time-will-come", "camellia-society"],
        "arcPct": {"what-s-desired": {"m1": 100, "m5": 122}, "fluff-of-ferocity": {"m1": 85, "m5": 92.5},
                   "a-time-will-come": {"m1": None, "m5": 78}, "camellia-society": {"m1": 78.9, "m5": None}},
        "arcNote": T("Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine). Fluff of Ferocity adalah Battle Pass, A Time Will Come dari gacha bintang 4 atau Anomaly, Camellia Society dari Anomaly Commission.",
                     "Percentages from the owner's test data (M1 and M5 are refine levels). Fluff of Ferocity is the Battle Pass Arc, A Time Will Come comes from 4-star gacha or Anomaly, Camellia Society from Anomaly Commission."),
        "awks": [6, 2, 3, 5, 1, 4],
        "awkGain": {
            "1": T("Kenyamanan rotasi: batas energi +40%", "Rotation comfort: +40% energy cap"),
            "2": T("Sekitar +11,1% damage (20% DEF penetration permanen)", "About +11.1% damage (permanent 20% DEF penetration)"),
            "3": T("Sekitar +9,1% damage (+30% Crit DMG 20 detik setelah Ultimate)", "About +9.1% damage (+30% Crit DMG for 20s after Ultimate)"),
            "4": T("Minimal", "Minimal"),
            "5": T("Sekitar +10% damage terhadap target bertanda (single target)", "About +10% damage against marked targets (single target)"),
            "6": T("Sekitar +15 sampai 25% damage; mekanik inti, energi Sabit langsung penuh setelah Ultimate", "About +15 to 25% damage; the core mechanic, Scythe energy fills instantly after Ultimate"),
        },
        "src": [V_BB, SHEET],
        "teams": [
            team("Chaos Stain: Iroi + Sakiri + Blackbird + Chaos", ["iroi", "sakiri", "blackbird", "chaos"], T("TERBAIK", "BEST"), V_BB, [
                T("Lebih baik daripada tim Remora lama dan punya batas damage lebih tinggi; Blackbird memicu Stain bersama Chaos.", "Better than the older Remora team with a higher ceiling; Blackbird triggers Stain together with Chaos.")]),
        ],
    }
