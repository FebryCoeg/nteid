"""Kurasi putaran 2: Elyms, Blackbird, Linko, Akane. Dipanggil oleh make_curated.py.

Sumber: panduan lengkap Beware the Raddish (Elyms, Blackbird, Linko; dirangkum dengan kata sendiri) dan
spreadsheet uji pemilik situs (peringkat Arc M1/M5, prioritas Awakening, hasil tim).
"""

RAD = "Beware the Raddish"


def T(i, e):
    return {"id": i, "en": e}


V_ELYMS = {"title": "Complete ELYMS Guide NTE", "by": RAD, "url": "https://youtu.be/HMm6rqo5xj4"}
V_BB = {"title": "Complete BLACKBIRD Guide NTE", "by": RAD, "url": "https://youtu.be/GT-wszCLUxc"}
V_LINKO = {"title": "Complete LINKO Guide NTE", "by": RAD, "url": "https://youtu.be/TA4qUNCyL9k"}
SHEET = {"title": "Spreadsheet uji pemilik situs", "by": "Hethereau", "url": ""}
TESTED = T("HASIL UJI", "TESTED")
ALT = T("ALTERNATIF", "ALTERNATIVE")


def team(name, members, tag, src, why=None, metric=None):
    t = {"name": T(name, name), "members": members, "tag": tag, "src": src, "why": why or []}
    if metric:
        t["metric"] = metric
    return t


def apply(out):
    out["elyms"] = {
        "arcs": ["echoes-on-hold", "marching-beyond-time", "blow-up-the-crowd"],
        "arcNote": T(
            "Arc signature terbaik: 24% Crit Rate, 15% ATK, 12% DEF ignore seluruh tim, 22% DEF ignore pribadi, dan 8% RES Cosmos ignore tim, dengan uptime penuh dalam rotasi 20 detik. Paling bernilai di tim Shinku atau Chiz; di tim lain RES Cosmos ignore-nya terbuang, jadi Blow Up the Crowd lebih hemat. Pilihan kedua untuk damage tim: Marching Beyond Time.",
            "Her signature Arc is best: 24% Crit Rate, 15% ATK, 12% team DEF ignore, 22% personal DEF ignore and 8% team Cosmos RES ignore, with full uptime in a 20s rotation. Most valuable in Shinku or Chiz teams; elsewhere the Cosmos RES ignore is wasted, so Blow Up the Crowd is more cost-effective. Second choice for team damage: Marching Beyond Time.",
        ),
        "sets": [{"id": "Suit6", "pieces": 4}, {"id": "Suit11", "pieces": 4}],
        "setNote": {"Suit11": T("Pakai bila tidak ada rekan yang membawa Speedy Hedgehog; prioritas stat sama.", "Use it if no teammate carries Speedy Hedgehog; same stat priorities.")},
        "stats": ["CRIT DMG", "DMG Bonus"],
        "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK %"],
        "statNote": T(
            "CRIT DMG unggul sekitar 4% dari DMG Bonus Cosmos untuk damage pribadi; untuk damage tim selisihnya kecil, jadi pilih cartridge dengan sub stat lebih baik. Di tim Blossom, utamakan Cycle Intensity di atas stat lain.",
            "CRIT DMG beats Cosmos DMG Bonus by about 4% for personal damage; for team damage the gap is small, so pick the cartridge with better sub stats. In Blossom teams, put Cycle Intensity above everything else.",
        ),
        "awks": [4, 3, 1, 2, 6, 5],
        "awkGain": {
            "1": T("+10% Crit DMG tim selama 20 detik per stack Optical Illusion yang dipakai; butuh Awakening 3", "+10% team Crit DMG for 20s per Optical Illusion stack consumed; needs Awakening 3"),
            "2": T("+30% rasio Ultimate dan DEF ignore per stack Optical Illusion; butuh Awakening 3", "+30% Ultimate ratio and DEF ignore per Optical Illusion stack; needs Awakening 3"),
            "3": T("Pembuka kunci: memberi 3 stack Optical Illusion; menguatkan Awakening 1, 2, dan 6", "The enabler: grants 3 Optical Illusion stacks; powers up Awakenings 1, 2 and 6"),
            "4": T("+20% Crit DMG tim, paling konsisten bila hanya mengambil satu Awakening", "+20% team Crit DMG, the most consistent if you only take one Awakening"),
            "5": T("Mulai dengan Cycle Energy penuh (berguna di Beyond the Rails, tidak di Hunter's Crucible); situasional", "Starts with full Cycle Energy (useful in Beyond the Rails, not in Hunter's Crucible); situational"),
            "6": T("+25% damage Follow-up per stack Optical Illusion; butuh Awakening 3", "+25% Follow-up damage per Optical Illusion stack; needs Awakening 3"),
            "b3": T("Skill naik 1 level dan langsung ke koneksi 5G, melewati 3 basic attack", "Skill levels +1 and jumps straight to 5G, skipping three basic attacks"),
            "b6": T("+12% RES ignore semua elemen untuk seluruh tim selama Elyms hidup", "+12% all-element RES ignore for the whole team while Elyms is alive"),
        },
        "skills": ["ultimate", "redirect", "basic", "support"],
        "skillNote": T(
            "Buka kedua passive dan utamakan Ultimate, lalu Redirect. Basic Attack dan Support cukup Lv.1 bila bahan terbatas. Titik berhenti Awakening yang disarankan: A0, A3, atau A6.",
            "Unlock both passives and prioritise Ultimate, then Redirect. Basic Attack and Support can stay at Lv.1 if you are short on resources. Recommended stopping points: A0, A3 or A6.",
        ),
        "src": [V_ELYMS],
        "teams": [
            team("Shinku Charge + Akane", ["shinku", "akane-rin", "elyms", "iroi"], T("TERBAIK UNTUK SHINKU", "BEST FOR SHINKU"), V_ELYMS, [
                T("Elyms memberi buff besar ke Shinku (Cosmos DMG lewat Charge, RES Cosmos ignore dari Arc signature) dan ikut menyumbang damage lewat Ultimate dan serangan terkoordinasi.",
                  "Elyms gives Shinku a large buff (Cosmos DMG via Charge, Cosmos RES ignore from her signature Arc) and adds damage through her Ultimate and coordinated attacks."),
                T("Disebut tim terbaik Shinku saat itu, bersaing dengan tim terbaru berisi Akane, Blackbird, atau Zankou. Akane bisa diganti Hathor atau Skia, Iroi diganti Nanally.",
                  "Called Shinku's best team at the time, competitive with newer Akane, Blackbird or Zankou teams. Akane can be swapped for Hathor or Skia, Iroi for Nanally."),
            ]),
            team("Chiz Charge", ["chiz", "hathor", "elyms", "iroi"], T("RAMAH PEMULA", "BEGINNER FRIENDLY"), V_ELYMS, [
                T("Chiz adalah satu dari hanya dua Main DPS Cosmos, jadi ikut diuntungkan Elyms. Damage lebih rendah dari tim meta, tapi murah dan mudah dimainkan.",
                  "Chiz is one of only two Cosmos main DPS, so she benefits from Elyms. Lower damage than meta teams, but cheap and easy."),
                T("Hathor bisa diganti Skia atau Akane; Iroi bisa diganti hampir semua karakter Anima.", "Hathor can be replaced by Skia or Akane; Iroi by almost any Anima character."),
            ]),
            team("Akane Hypercarry", ["akane-rin", "blackbird", "elyms", "iroi"], ALT, V_ELYMS, [
                T("Walau Akane tidak memakai buff Cosmos, damage pribadi dan buff universal Elyms tetap lebih baik dari Zero di tim ini. Blackbird bisa diganti Haniel atau Fadia.",
                  "Even though Akane cannot use the Cosmos buffs, Elyms' personal damage and universal buffs still beat Zero here. Blackbird can be swapped for Haniel or Fadia."),
            ]),
            team("Blossom Anima", ["nanally", "jiuyuan", "iroi", "elyms"], ALT, V_ELYMS, [
                T("Tumpuk Cycle Intensity di Elyms karena dia satu-satunya karakter Cosmos; damage pribadinya turun sedikit tapi damage tim naik. Karakter Anima bisa ditukar dengan Anima lain atau Hotori. (Nama anggota dibaca dari subtitle otomatis, mohon dicek.)",
                  "Stack Cycle Intensity on Elyms since she is the only Cosmos character; her personal damage dips but team damage rises. Anima characters can be swapped for other Anima or Hotori. (Member names read from auto subtitles, please double-check.)"),
            ]),
        ],
    }

    out["blackbird"] = {
        "arcs": ["crime-and-punishment", "ravenous-blade", "contemplative-cat", "watch-your-heads"],
        "arcPct": {
            "crime-and-punishment": {"m1": 100, "m5": 128.4},
            "ravenous-blade": {"m1": 80.1, "m5": None},
            "contemplative-cat": {"m1": 63.8, "m5": None},
            "watch-your-heads": {"m1": None, "m5": 65.5},
        },
        "arcNote": T(
            "Arc signature terbaik (24% Crit Rate, 72 Cycle Intensity, 20% Psyche DMG, +16% Crit DMG tim dan +32% Crit DMG pemakai). Pengganti yang disarankan: Contemplative Cat atau Watch Your Heads. Fluff of Finesse dan Cosmos Daze, Wild Reverie kurang konsisten karena syaratnya ketat. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
            "Her signature Arc is best (24% Crit Rate, 72 Cycle Intensity, 20% Psyche DMG, +16% team Crit DMG and +32% wearer Crit DMG). Recommended replacements: Contemplative Cat or Watch Your Heads. Fluff of Finesse and Cosmos Daze, Wild Reverie are inconsistent due to strict conditions. Percentages from the owner's test data (M1 and M5 are refine levels).",
        ),
        "sets": [{"id": "Suit3", "pieces": 4}],
        "stats": ["CRIT DMG", "DMG Bonus", "CRIT Rate"],
        "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK %", "Cycle Intensity"],
        "statNote": T(
            "CRIT DMG terbaik di atas kertas, tapi DMG Bonus Psyche hampir sama; uji pemilik situs menunjukkan DMG Bonus Psyche 100% vs CRIT DMG 98,7%. Tanpa Arc signature, CRIT Rate lebih konsisten. Pilih cartridge dengan sub stat lebih baik.",
            "CRIT DMG is best on paper, but Psyche DMG Bonus is nearly equal; the owner's test shows Psyche DMG Bonus 100% vs CRIT DMG 98.7%. Without the signature Arc, CRIT Rate is more consistent. Pick whichever cartridge has the better sub stats.",
        ),
        "awks": [1, 5, 6, 3, 4, 2],
        "awkGain": {
            "1": T("+27,3% damage, upgrade tunggal terbaik", "+27.3% damage, the best single upgrade"),
            "2": T("+6,1% damage", "+6.1% damage"),
            "3": T("+11,3% damage", "+11.3% damage"),
            "4": T("+7,1% damage", "+7.1% damage"),
            "5": T("+11,7% damage", "+11.7% damage"),
            "6": T("+13,9% damage", "+13.9% damage"),
            "b3": T("Sekitar +20% damage", "About +20% damage"),
            "b6": T("Sekitar +9,5% damage", "About +9.5% damage"),
        },
        "skills": ["basic", "redirect", "ultimate", "support"],
        "skillNote": T(
            "Utamakan passive pertama dan Basic Attack (dipakai untuk membuka Redirect di Witch Form dan memengaruhi rasio Malice), lalu Redirect, lalu Ultimate. Buff ATK 20% tim dari Ultimate pertama tidak terpengaruh level Ultimate. Support cukup Lv.1.",
            "Prioritise the first passive and Basic Attack (it unlocks Redirect in Witch Form and affects Malice ratio), then Redirect, then Ultimate. The team ATK +20% from the first Ultimate does not scale with Ultimate level. Support can stay at Lv.1.",
        ),
        "src": [V_BB, SHEET],
        "teams": [
            team("Nova murni (Blackbird Main DPS)", ["blackbird", "daffodill", "sakiri", "haniel"], T("MAIN DPS", "MAIN DPS"), V_BB, [
                T("Daffodill memakai build crit; Sakiri dan Haniel membawa Speedy Hedgehog untuk energi. Daffodill bisa diganti Lacrimosa, Haniel diganti Iroi (lebih banyak energi) atau Fadia (lebih tahan).",
                  "Daffodill runs a crit build; Sakiri and Haniel carry Speedy Hedgehog for energy. Daffodill can be swapped for Lacrimosa, Haniel for Iroi (more energy) or Fadia (more survivability)."),
            ]),
            team("Nova + Stain (Blackbird Main DPS)", ["blackbird", "daffodill", "sakiri", "skia"], T("MAIN DPS", "MAIN DPS"), V_BB, [
                T("Skia hanya bertugas sebagai karakter Lakshana pemicu Stain, jadi build-nya tidak penting; bisa diganti Hathor atau Chaos.",
                  "Skia's only job is being the Lakshana character that triggers Stain, so his build barely matters; Hathor or Chaos work too."),
            ]),
            team("Break (Blackbird Sub DPS)", ["blackbird", "daffodill", "linko", "zankou"], T("SUB DPS", "SUB DPS"), V_BB, [
                T("Blackbird menambah pemicu Nova dan buff damage; Daffodill menaikkan efisiensi break dan menurunkan batas break musuh; Linko memberi pengurang RES dan banyak break; Zankou memberi damage di lapangan dan Scorch permanen untuk Discord. Linko bisa diganti Skia.",
                  "Blackbird adds Nova triggers and damage buffs; Daffodill raises break efficiency and lowers the enemy break cap; Linko gives resistance reduction and multiple break instances; Zankou brings on-field damage and permanent Scorch for Discord. Linko can be swapped for Skia."),
            ]),
            team("Chaos Stain (Blackbird Sub DPS)", ["iroi", "sakiri", "blackbird", "chaos"], T("SUB DPS", "SUB DPS"), V_BB, [
                T("Dari pengujian dan panduan CN, tim ini lebih baik daripada tim Remora lama (Hathor dan Zero) dan punya batas damage lebih tinggi.",
                  "From testing and CN guides, this team outperforms the older Remora team (Hathor and Zero) and has a higher damage ceiling."),
            ]),
            team("Akane + Blackbird + Iroi + Linko", ["akane-rin", "blackbird", "iroi", "linko"], TESTED, SHEET, [],
                 T("1,93 juta damage, 17 detik, puncak DPS 421.447", "1.93M damage, 17s, peak DPS 421,447")),
            team("Akane + Blackbird + Sakiri + Linko", ["akane-rin", "blackbird", "sakiri", "linko"], TESTED, SHEET, [],
                 T("1,83 juta damage, 18 detik, puncak DPS 393.455", "1.83M damage, 18s, peak DPS 393,455")),
        ],
    }

    out["linko"] = {
        "arcs": ["voice-of-the-voyager", "ready-ready", "fluff-of-fortitude", "raging-flames"],
        "arcPct": {
            "voice-of-the-voyager": {"m1": 100, "m5": 125.4},
            "ready-ready": {"m1": 84.5, "m5": 94.5},
            "fluff-of-fortitude": {"m1": 75.2, "m5": 82.9},
            "raging-flames": {"m1": 66.1, "m5": 70.5},
        },
        "arcNote": T(
            "Arc signature terbaik. Alternatif terbaik: Ready-Ready (signature Nanally), lalu Fluff of Fortitude (Battle Pass berbayar). Bila keduanya tidak ada, pakai Song of the Whale atau Raging Flames (performanya mirip). Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
            "Her signature Arc is best. Best alternatives: Ready-Ready (Nanally's signature), then Fluff of Fortitude (paid Battle Pass). If both are unavailable, use Song of the Whale or Raging Flames (similar performance). Percentages from the owner's test data (M1 and M5 are refine levels).",
        ),
        "sets": [{"id": "Suit2", "pieces": 4}],
        "stats": ["CRIT DMG", "DMG Bonus"],
        "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus", "Cycle Intensity"],
        "statNote": T(
            "Synced Strike memakai stat Linko tetapi mengikuti elemen pemicunya. DMG Bonus Anima hanya menguntungkan serangan Anima, sedangkan CRIT DMG menguntungkan semua Synced Strike; selisih keduanya hanya 2 sampai 3%. CRIT Rate main stat hanya bila ingin konsisten. Cycle Intensity juga berguna karena Hexed memakainya.",
            "Synced Strikes use Linko's stats but follow the triggering element. Anima DMG Bonus only helps Anima strikes while CRIT DMG helps every Synced Strike; the gap is only 2 to 3%. Use CRIT Rate main stat only for consistency. Cycle Intensity is also useful because Hexed scales with it.",
        ),
        "awks": [5, 3, 1, 4, 2, 6],
        "awkGain": {
            "1": T("+14,4% damage (interval ghost mark 25% lebih cepat)", "+14.4% damage (25% faster ghost mark)"),
            "2": T("+6,7% damage", "+6.7% damage"),
            "3": T("+13% damage (reset cooldown Redirect setelah Ultimate)", "+13% damage (resets Redirect cooldown after Ultimate)"),
            "4": T("+8,8% damage", "+8.8% damage"),
            "5": T("Situasional: Synced Strike bisa memicu efek Esper; paling berguna di tim yang bergantung pada Zero", "Situational: the Synced Strike can trigger Esper effects; most useful in Zero-dependent teams"),
            "6": T("+4,5% damage", "+4.5% damage"),
            "b3": T("Sekitar +15% damage (ATK +20% permanen)", "About +15% damage (permanent ATK +20%)"),
            "b6": T("Sekitar +15% damage; +30% Anima/Incantation DMG untuk rekan di Resonance Field", "About +15% damage; +30% Anima/Incantation DMG for allies in the Resonance Field"),
        },
        "skills": ["support", "ultimate", "redirect", "basic"],
        "skillNote": T(
            "Buka kedua passive dan naikkan Support lebih dulu (menentukan damage semua Synced Strike), lalu Ultimate, lalu Redirect. Basic Attack cukup Lv.1 karena hampir tidak dipakai.",
            "Unlock both passives and level Support first (it scales every Synced Strike), then Ultimate, then Redirect. Basic Attack can stay at Lv.1 since it is barely used.",
        ),
        "src": [V_LINKO, SHEET],
        "teams": [
            team("Zankou + Linko + Sakiri + Iroi", ["zankou", "linko", "sakiri", "iroi"], T("TIM ZANKOU", "ZANKOU TEAM"), V_LINKO, [
                T("Hexed lewat Iroi dan Zankou; hanya Sakiri yang butuh Speedy Hedgehog, set Fireflies dipasang di Sakiri dan Linko. Energi aman berkat serangan charge Iroi. Sakiri bisa diganti Daffodill.",
                  "Hexed via Iroi and Zankou; only Sakiri needs Speedy Hedgehog, with Fireflies on Sakiri and Linko. Energy is fine thanks to Iroi's charge attack. Sakiri can be swapped for Daffodill."),
            ]),
            team("Zankou + Linko + Sakiri + Lacrimosa", ["zankou", "linko", "sakiri", "lacrimosa"], T("TIM ZANKOU", "ZANKOU TEAM"), V_LINKO, [
                T("Susunan best-in-slot tanpa Iroi, memakai Scorch dari Lacrimosa. Lacrimosa bisa diganti Daffodill.",
                  "Best-in-slot setup without Iroi, using Scorch from Lacrimosa. Lacrimosa can be swapped for Daffodill."),
            ]),
            team("Nanally + Linko + Sakiri + Iroi", ["nanally", "linko", "sakiri", "iroi"], T("TIM NANALLY", "NANALLY TEAM"), V_LINKO, [
                T("Nanally sebagai Main DPS; bisa dimainkan dengan Linko A0 dan cukup untuk Beyond the Rails, sedangkan Linko A1 dengan Awakening 5 memberi peningkatan nyata.",
                  "Nanally as main DPS; playable with A0 Linko and enough for Beyond the Rails, while A1 Linko with Awakening 5 is a nice upgrade."),
            ]),
            team("Shinku + Skia + Iroi + Linko", ["shinku", "skia", "iroi", "linko"], T("GANTI ZERO", "REPLACES ZERO"), V_LINKO, [
                T("Linko A1 dengan Awakening 5 menggantikan Zero di tim Shinku dan memberi damage jauh lebih besar, tetapi mahal (dua salinan Linko) dan Hexed enhancement-nya terbuang.",
                  "A1 Linko with Awakening 5 replaces Zero in the Shinku team and deals much more damage, but costs two Linko copies and wastes her Hexed enhancement."),
            ]),
            team("Zankou + Lacrimosa + Sakiri + Linko", ["zankou", "lacrimosa", "sakiri", "linko"], TESTED, SHEET, [],
                 T("2,95 juta damage, 44 detik; sumbangan Linko 716.794 (lantai 12, RES 30%)", "2.95M damage, 44s; Linko contributed 716,794 (floor 12, 30% RES)")),
            team("Zankou + Linko + Iroi + Sakiri", ["zankou", "linko", "iroi", "sakiri"], TESTED, SHEET, [],
                 T("2,94 juta damage, 45 detik; sumbangan Linko 1.055.743", "2.94M damage, 45s; Linko contributed 1,055,743")),
            team("Nanally + Linko + Iroi + Sakiri", ["nanally", "linko", "iroi", "sakiri"], TESTED, SHEET, [],
                 T("2,90 juta damage, 60 detik; sumbangan Linko 821.945", "2.90M damage, 60s; Linko contributed 821,945")),
        ],
    }

    out["akane-rin"].update({
        "arcs": ["far-side-of-the-moon", "the-last-rose", "fluff-of-fleetness", "the-wrong-gate"],
        "arcPct": {
            "far-side-of-the-moon": {"m1": 100, "m5": 132},
            "the-last-rose": {"m1": 84, "m5": 88},
            "fluff-of-fleetness": {"m1": 75, "m5": 79},
            "the-wrong-gate": {"m1": 70, "m5": 75},
        },
        "arcNote": T("Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine), acuan 100% = Far Side of the Moon M1.",
                     "Percentages from the owner's test data (M1 and M5 are refine levels), 100% = Far Side of the Moon M1."),
        "awks": [2, 3, 4, 6, 5, 1],
        "awkGain": {
            "1": T("Penyembuhan, bukan damage", "Healing, not damage"),
            "2": T("+16,5% damage", "+16.5% damage"),
            "3": T("+12% damage", "+12% damage"),
            "4": T("+10% damage", "+10% damage"),
            "5": T("+4,5% sampai 8% damage", "+4.5% to 8% damage"),
            "6": T("+8,8% damage", "+8.8% damage"),
            "b3": T("Sekitar +23% damage", "About +23% damage"),
            "b6": T("Sekitar +20% damage", "About +20% damage"),
        },
        "src": [SHEET],
    })
