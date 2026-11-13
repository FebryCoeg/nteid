"""Kurasi putaran 4: rekomendasi dari ntebuild.com untuk Elyms, Akane Rin, Blackbird, Linko, Zankou, Nanally.

Pemilik situs menyatakan ada izin dari ntebuild.com untuk memakai rekomendasinya. Isi di sini dicatat sebagai
data ringkas (urutan Arc, set, stat, urutan skill, Awakening prioritas, anggota tim) dengan kata-kata sendiri,
tanpa menyalin teks panduannya, dan dikreditkan ke ntebuild.com dengan tautan ke halaman build tiap karakter.
Rekomendasi ntebuild.com menggantikan urutan lama untuk bagian yang sama; tim dari sumber lain tetap ada setelahnya.
"""
from curated_round2 import T, team


def src(slug):
    return {"title": "NTE Build Guide", "by": "ntebuild.com", "url": f"https://www.ntebuild.com/characters/{slug}/build"}


BEST = T("REKOMENDASI TERBAIK", "TOP RECOMMENDATION")
ALTT = T("ALTERNATIF", "ALTERNATIVE")
SK = T("Urutan skill mengikuti ntebuild.com.", "Skill order follows ntebuild.com.")


def tm(slug, name, members, tag):
    return team(name, members, tag, src(slug), [])


def apply(out):
    def merge(slug, d, teams):
        base = out.setdefault(slug, {})
        base.update(d)
        base["skillNote"] = SK
        base["src"] = [src(slug)] + [s for s in base.get("src", []) if s.get("by") != "ntebuild.com"]
        base["teams"] = teams + [t for t in base.get("teams", []) if t["src"].get("by") != "ntebuild.com"]

    merge("elyms", {
        "arcs": ["echoes-on-hold", "day-off", "the-rain-that-shook-the-world", "first-step-to-success"],
        "arcNote": T("Arc signature terbaik. Alternatif: Day Off (banyak Ultimate berarti uptime buff tim lebih lama), The Rain That Shook the World (bila Elyms dimainkan untuk damage), dan First Step to Success sebagai pilihan gratis.",
                     "Her signature is best. Alternatives: Day Off (more Ultimates means more team-buff uptime), The Rain That Shook the World (when Elyms is played for damage), and First Step to Success as the free pick."),
        "sets": [{"id": "Suit11", "pieces": 4}, {"id": "Suit6", "pieces": 4}, {"id": "Suit8", "pieces": 4}],
        "setNote": {},
        "stats": ["ATK %", "DMG Bonus", "CRIT Rate", "CRIT DMG"], "sub": ["ATK %", "CRIT Rate", "CRIT DMG"],
        "statNote": T("Utamakan ATK%, lalu DMG Bonus Cosmos, lalu CRIT Rate atau CRIT DMG.", "ATK% first, then Cosmos DMG Bonus, then CRIT Rate or CRIT DMG."),
        "skills": ["ultimate", "redirect", "support", "basic"],
    }, [
        tm("elyms", "Akane Rin Remora", ["elyms", "shinku", "akane-rin", "iroi"], BEST),
        tm("elyms", "Stain dan Remora", ["elyms", "blackbird", "akane-rin", "iroi"], ALTT),
        tm("elyms", "Lakshana Burst", ["elyms", "blackbird", "hathor", "chaos"], ALTT),
        tm("elyms", "Tim Follow-up", ["elyms", "nanally", "hotori", "iroi"], ALTT),
    ])

    merge("akane-rin", {
        "arcs": ["far-side-of-the-moon", "fluff-of-fleetness", "the-last-rose", "shiny-days"],
        "arcNote": T("Arc signature terbaik; Fluff of Fleetness adalah pilihan Battle Pass, The Last Rose alternatif gacha, dan Shiny Days pilihan gratis. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
                     "Her signature is best; Fluff of Fleetness is the Battle Pass pick, The Last Rose a gacha alternative and Shiny Days the free option. Percentages from the owner's test data (M1 and M5 are refine levels)."),
        "arcPct": {"far-side-of-the-moon": {"m1": 100, "m5": 132}, "the-last-rose": {"m1": 84, "m5": 88}, "fluff-of-fleetness": {"m1": 75, "m5": 79}},
        "sets": [{"id": "Suit5", "pieces": 4}, {"id": "Suit8", "pieces": 4}],
        "stats": ["CRIT Rate", "CRIT DMG", "DMG Bonus"], "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK %"],
        "statNote": T("CRIT Rate atau CRIT DMG lebih dulu, lalu DMG Bonus Lakshana, lalu ATK%. Modul Type III memberi 10% ATK masing-masing.", "CRIT Rate or CRIT DMG first, then Lakshana DMG Bonus, then ATK%. Type III modules give 10% ATK each."),
        "awks": [2, 5, 3],
        "skills": ["redirect", "basic", "ultimate", "support"],
    }, [
        tm("akane-rin", "Stain dan Remora", ["akane-rin", "blackbird", "zero-1051", "iroi"], BEST),
        tm("akane-rin", "Haniel Buff", ["akane-rin", "haniel", "zero-1051", "iroi"], ALTT),
        tm("akane-rin", "Double Lakshana", ["akane-rin", "hathor", "blackbird", "iroi"], ALTT),
        tm("akane-rin", "Tim Sakiri", ["akane-rin", "sakiri", "blackbird", "linko"], ALTT),
    ])

    merge("blackbird", {
        "arcs": ["crime-and-punishment", "ravenous-blade", "good-boy-s-grand-adventure", "watch-your-heads"],
        "arcNote": T("Arc signature terbaik; Ravenous Blade, Good Boy's Grand Adventure, dan Watch Your Heads sebagai alternatif. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
                     "Her signature is best; Ravenous Blade, Good Boy's Grand Adventure and Watch Your Heads are alternatives. Percentages from the owner's test data (M1 and M5 are refine levels)."),
        "arcPct": {"crime-and-punishment": {"m1": 100, "m5": 128.4}, "ravenous-blade": {"m1": 80.1, "m5": None}, "watch-your-heads": {"m1": None, "m5": 65.5}},
        "sets": [{"id": "Suit3", "pieces": 4}, {"id": "Suit11", "pieces": 4}],
        "stats": ["CRIT DMG", "DMG Bonus"], "sub": ["CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK %", "Cycle Intensity"],
        "statNote": T("Main stat CRIT DMG atau DMG Bonus Psyche; sub stat CRIT Rate atau CRIT DMG lebih dulu, lalu DMG Bonus, ATK%, dan Cycle Intensity.", "CRIT DMG or Psyche DMG Bonus main stat; sub stats CRIT Rate or CRIT DMG first, then DMG Bonus, ATK% and Cycle Intensity."),
        "awks": [1, 6, 3],
        "skills": ["ultimate", "redirect", "basic", "support"],
    }, [
        tm("blackbird", "Tim Nova", ["blackbird", "lacrimosa", "zankou", "sakiri"], BEST),
        tm("blackbird", "Inti Fleksibel", ["blackbird", "hathor", "daffodill", "sakiri"], ALTT),
        tm("blackbird", "Chaos Sub-DPS", ["blackbird", "chaos", "sakiri", "iroi"], ALTT),
        tm("blackbird", "Tim Stain", ["blackbird", "chaos", "hathor", "sakiri"], ALTT),
    ])

    merge("linko", {
        "arcs": ["voice-of-the-voyager", "ready-ready", "raging-flames"],
        "arcNote": T("Arc signature terbaik; Ready-Ready dan Raging Flames sebagai alternatif. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
                     "Her signature is best; Ready-Ready and Raging Flames are alternatives. Percentages from the owner's test data (M1 and M5 are refine levels)."),
        "arcPct": {"voice-of-the-voyager": {"m1": 100, "m5": 125.4}, "ready-ready": {"m1": 84.5, "m5": 94.5}, "raging-flames": {"m1": 66.1, "m5": 70.5}},
        "sets": [{"id": "Suit2", "pieces": 4}, {"id": "Suit6", "pieces": 4}, {"id": "Suit11", "pieces": 4}],
        "stats": ["CRIT Rate", "CRIT DMG", "DMG Bonus"], "sub": ["CRIT Rate", "CRIT DMG", "ATK %", "ATK", "DMG Bonus"],
        "statNote": T("Main stat CRIT Rate, CRIT DMG, atau DMG Bonus Anima; sub stat CRIT Rate lebih dulu, lalu CRIT DMG, ATK%, ATK, dan DMG Bonus universal.", "CRIT Rate, CRIT DMG or Anima DMG Bonus main stat; sub stats CRIT Rate first, then CRIT DMG, ATK%, ATK and universal DMG Bonus."),
        "awks": [1, 2, 4],
        "skills": ["redirect", "ultimate", "basic", "support"],
    }, [
        tm("linko", "Tim terbaik", ["linko", "zankou", "daffodill", "sakiri"], BEST),
        tm("linko", "Alternatif", ["linko", "zankou", "iroi", "sakiri"], ALTT),
        tm("linko", "Alternatif 2", ["linko", "shinku", "skia", "iroi"], ALTT),
        tm("linko", "Alternatif 3", ["linko", "zankou", "sakiri", "nanally"], ALTT),
    ])

    merge("zankou", {
        "arcs": ["ravenous-blade", "contemplative-cat", "watch-your-heads", "fluff-of-finesse"],
        "arcNote": T("Arc signature terbaik; alternatif: Contemplative Cat, Watch Your Heads, dan Fluff of Finesse. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
                     "Her signature is best; alternatives: Contemplative Cat, Watch Your Heads and Fluff of Finesse. Percentages from the owner's test data (M1 and M5 are refine levels)."),
        "sets": [{"id": "Suit4", "pieces": 4}, {"id": "Suit6", "pieces": 4}],
        "stats": ["CRIT DMG", "Cycle Intensity", "DMG Bonus", "CRIT Rate", "ATK %"], "sub": ["CRIT DMG", "Cycle Intensity", "CRIT Rate", "DMG Bonus", "ATK %", "Break"],
        "statNote": T("Sub stat: CRIT DMG lebih dulu, lalu Cycle Intensity atau CRIT Rate, DMG Bonus, ATK%, dan Break Intensity. Crimson: Twin Butterflies cocok untuk jalur Main DPS, Lost Radiance untuk jalur dual DPS bersama Lacrimosa.",
                      "Sub stats: CRIT DMG first, then Cycle Intensity or CRIT Rate, DMG Bonus, ATK% and Break Intensity. Crimson: Twin Butterflies suits the Main DPS line, Lost Radiance the dual-DPS line with Lacrimosa."),
        "awks": [1, 2, 5],
        "skills": ["redirect", "ultimate", "basic", "support"],
    }, [
        tm("zankou", "Tim terbaik", ["zankou", "lacrimosa", "haniel", "sakiri"], BEST),
        tm("zankou", "Alternatif", ["zankou", "linko", "iroi", "sakiri"], ALTT),
        tm("zankou", "Alternatif 2", ["zankou", "daffodill", "baicang", "linko"], ALTT),
        tm("zankou", "Alternatif 3", ["zankou", "daffodill", "mint", "adler"], ALTT),
    ])

    merge("nanally", {
        "arcs": ["ready-ready", "fluff-of-fortitude", "raging-flames", "oraora"],
        "arcNote": T("Arc signature terbaik; alternatif: Fluff of Fortitude, Raging Flames, dan Oraora! sebagai pilihan gratis. Persentase dari data uji pemilik situs (M1 dan M5 = tingkat refine).",
                     "Her signature is best; alternatives: Fluff of Fortitude, Raging Flames and Oraora! as the free pick. Percentages from the owner's test data (M1 and M5 are refine levels)."),
        "sets": [{"id": "Suit2", "pieces": 4}, {"id": "Suit8", "pieces": 4}, {"id": "Suit6", "pieces": 4}, {"id": "Suit3", "pieces": 4}],
        "setPct": {"Suit2": {"team": 100}, "Suit8": {"team": 96.2}, "Suit6": {"team": 95.8}, "Suit3": {"team": 95.2}},
        "stats": ["CRIT DMG", "ATK %"], "sub": ["CRIT Rate", "ATK %", "CRIT DMG", "ATK"],
        "statNote": T("Main stat CRIT DMG atau ATK%; sub stat CRIT Rate lebih dulu, lalu ATK%, CRIT DMG, dan ATK.", "CRIT DMG or ATK% main stat; sub stats CRIT Rate first, then ATK%, CRIT DMG and ATK."),
        "awks": [1, 5, 4],
        "awkGain": {},
        "skills": ["basic", "ultimate", "redirect", "support"],
    }, [
        tm("nanally", "Tim Blossom", ["nanally", "jiuyuan", "adler", "haniel"], BEST),
        tm("nanally", "Alternatif Nanally", ["nanally", "sakiri", "jiuyuan", "adler"], ALTT),
        tm("nanally", "Tim F2P", ["nanally", "haniel", "jiuyuan", "adler"], T("RAMAH GRATISAN", "F2P FRIENDLY")),
    ])
