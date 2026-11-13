"""Tulis nte/data/builds_curated.json: rekomendasi tim, urutan Awakening, dan catatan dari sumber yang dikurasi.

Sumber (dirangkum dengan kata-kata sendiri, dengan kredit dan tautan):
- Beware the Raddish (YouTube): "SHINKU META GUIDE with Numbers" (kUTmy9kC0lY) dan "NTE Best Shinku Rotations Guide" (tC_f2jMpNLg).
- Data uji milik pemilik situs (spreadsheet pribadi): tim, total damage, waktu clear.
Dijalankan manual, hasilnya digabung oleh make_builds.py.   python tools/nte/make_curated.py
"""
import json
from pathlib import Path

D = Path(__file__).resolve().parents[2] / "nte" / "data"
RAD = "Beware the Raddish"
V_META = {"title": "SHINKU META GUIDE with Numbers", "by": RAD, "url": "https://youtu.be/kUTmy9kC0lY"}
V_ROT = {"title": "NTE Best Shinku Rotations Guide", "by": RAD, "url": "https://youtu.be/tC_f2jMpNLg"}
OWN = {"title": "Data uji pemilik situs", "by": "Hethereau", "url": ""}

out = {
    "shinku": {
        "awks": [2, 6, 1, 3, 4, 5],
        "awkGain": {
            "1": {"id": "+8% damage pribadi", "en": "+8% personal damage"},
            "2": {"id": "+11 sampai 14% damage pribadi (lebih besar bila RES Cosmos musuh tinggi)", "en": "+11 to 14% personal damage (more if enemy Cosmos RES is high)"},
            "3": {"id": "Tanpa tambahan damage langsung; Menacing Gaze tetap aktif saat ganti karakter", "en": "No direct damage; keeps Menacing Gaze when switching out"},
            "4": {"id": "Tanpa tambahan damage langsung; cocok dipasangkan dengan Awakening 3", "en": "No direct damage; pairs well with Awakening 3"},
            "5": {"id": "Tanpa tambahan damage langsung; membuatnya sangat sulit mati", "en": "No direct damage; makes her very hard to kill"},
            "6": {"id": "Sekitar +12% damage pribadi", "en": "About +12% personal damage"},
            "b3": {"id": "Sekitar +20% damage pribadi", "en": "About +20% personal damage"},
            "b6": {"id": "Sekitar +18% damage pribadi", "en": "About +18% personal damage"},
        },
        "skills": ["basic", "ultimate", "redirect"],
        "skillNote": {"id": "Basic Attack dinaikkan lebih dulu karena memengaruhi damage Menacing Gaze dan Charge. Ultimate sama pentingnya, lalu Redirect. Support Skill cukup Lv.1 di tim Charge.",
                      "en": "Level Basic Attack first as it scales Menacing Gaze and Charge damage. Ultimate is equally important, then Redirect. Support Skill can stay at Lv.1 in a Charge team."},
        "src": [V_META, V_ROT],
        "teams": [
            {"name": {"id": "Charge terbaik", "en": "Best Charge team"}, "members": ["shinku", "zero-1051", "skia", "nanally"], "tag": {"id": "SERBAGUNA", "en": "ALL-ROUND PICK"}, "src": V_META,
             "why": [{"id": "Passive Charge Shinku menyumbang sekitar 40% damage pribadinya bila Nanally ada di tim.", "en": "Shinku's Charge passive is about 40% of her personal damage when Nanally is on the team."},
                     {"id": "Blossom milik Nanally membuat Vita Bud menyerang tiap 1 detik, pas dengan cooldown Charge 1 detik, sehingga Charge bisa terpicu hingga 10 kali.", "en": "Nanally's Blossom enhancement makes the Vita Bud attack every 1s, matching Charge's 1s cooldown, so Charge can trigger up to 10 times."},
                     {"id": "Zero memicu Blossom tepat setelah Remora tanpa mengorbankan DPS; Skia memperpanjang Remora sampai 16 detik.", "en": "Zero triggers Blossom right after Remora without losing DPS; Skia extends Remora to 16s."},
                     {"id": "Mengganti Nanally dengan Jiuyuan menurunkan damage pribadi Shinku sekitar 20%.", "en": "Swapping Nanally for Jiuyuan lowers Shinku's personal damage by about 20%."}]},
            {"name": {"id": "Charge dengan Hathor", "en": "Charge with Hathor"}, "members": ["shinku", "zero-1051", "hathor", "nanally"], "tag": {"id": "ALTERNATIF", "en": "ALTERNATIVE"}, "src": V_ROT,
             "why": [{"id": "Hathor memberi +10% Crit Rate dan damage pribadi lebih tinggi, dan memperpanjang Remora jadi 12 detik.", "en": "Hathor gives +10% Crit Rate, higher personal damage, and extends Remora to 12s."},
                     {"id": "Remora 12 detik di atas kertas cukup menutup Blossom 10 detik, tapi dalam pertarungan nyata hit Charge terakhir sering terlewat. Skia lebih longgar.", "en": "12s of Remora covers the 10s Blossom on paper, but in real combat the last Charge hit is often missed. Skia is more forgiving."}]},
            {"name": {"id": "Tim hemat", "en": "Budget team"}, "members": ["shinku", "zero-1051", "skia", "mint"], "tag": {"id": "TANPA NANALLY/HATHOR", "en": "NO NANALLY/HATHOR"}, "src": V_ROT,
             "why": [{"id": "Untuk pemain baru yang baru mendapat Shinku. Skia dan Mint tidak butuh banyak investasi; tugas utamanya memicu Remora dan Blossom agar Charge aktif.", "en": "For new players who just pulled Shinku. Skia and Mint need little investment; their main job is triggering Remora and Blossom to enable Charge."}]},
            {"name": {"id": "Tanpa Zero", "en": "Without Zero"}, "members": ["shinku", "chiz", "skia", "mint"], "tag": {"id": "BEBAS ZERO", "en": "ZERO-FREE"}, "src": V_ROT,
             "why": [{"id": "Chiz sama-sama Cosmos, jadi berganti dengan Shinku tidak memicu efek Esper dan energi cycle Shinku tersimpan.", "en": "Chiz is also Cosmos, so switching with Shinku does not trigger an Esper effect and saves Shinku's cycle energy."},
                     {"id": "Kekurangannya: butuh Perfect Counter dengan Chiz agar waktu clear bagus.", "en": "Drawback: you need a Perfect Counter with Chiz for a decent clear time."}]},
            {"name": {"id": "Tim dari rekaman pemilik situs", "en": "Owner's recorded team"}, "members": ["shinku", "elyms", "akane-rin", "iroi"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "4,52 juta damage dalam 106 detik, Beyond the Rails lantai 12", "en": "4.52M damage in 106s, Beyond the Rails floor 12"}, "why": []},
            {"name": {"id": "Tim dari spreadsheet pemilik situs", "en": "Owner's spreadsheet team"}, "members": ["shinku", "iroi", "zero-1051", "hathor"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "3,87 juta damage, puncak DPS 282.861, clear 1 menit 2 detik", "en": "3.87M damage, peak DPS 282,861, 1m02s clear"}, "why": []},
        ],
    },
    "zankou": {
        "src": [OWN],
        "teams": [
            {"name": {"id": "Zankou + Lacrimosa + Sakiri + Iroi", "en": "Zankou + Lacrimosa + Sakiri + Iroi"}, "members": ["zankou", "lacrimosa", "sakiri", "iroi"], "tag": {"id": "TERCEPAT", "en": "FASTEST"}, "src": OWN,
             "metric": {"id": "2,97 juta damage, 43 detik, puncak DPS 205.143 (lantai 12, musuh lemah Cosmos dan Lakshana, RES 30%)", "en": "2.97M damage, 43s, peak DPS 205,143 (floor 12, enemy weak to Cosmos and Lakshana, 30% RES)"}, "why": []},
            {"name": {"id": "Zankou + Lacrimosa + Sakiri + Linko", "en": "Zankou + Lacrimosa + Sakiri + Linko"}, "members": ["zankou", "lacrimosa", "sakiri", "linko"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "2,95 juta damage, 44 detik, puncak DPS 203.002", "en": "2.95M damage, 44s, peak DPS 203,002"}, "why": []},
            {"name": {"id": "Zankou + Linko + Iroi + Sakiri", "en": "Zankou + Linko + Iroi + Sakiri"}, "members": ["zankou", "linko", "iroi", "sakiri"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "2,94 juta damage, 45 detik, puncak DPS 200.157", "en": "2.94M damage, 45s, peak DPS 200,157"}, "why": []},
            {"name": {"id": "Zankou + Linko + Daffodill + Sakiri", "en": "Zankou + Linko + Daffodill + Sakiri"}, "members": ["zankou", "linko", "daffodill", "sakiri"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "2,93 juta damage, 46 detik, puncak DPS 199.161", "en": "2.93M damage, 46s, peak DPS 199,161"}, "why": []},
        ],
    },
    "akane-rin": {
        "src": [OWN],
        "teams": [
            {"name": {"id": "Akane + Blackbird + Iroi + Linko", "en": "Akane + Blackbird + Iroi + Linko"}, "members": ["akane-rin", "blackbird", "iroi", "linko"], "tag": {"id": "TERCEPAT", "en": "FASTEST"}, "src": OWN,
             "metric": {"id": "1,93 juta damage, 17 detik, puncak DPS 421.447", "en": "1.93M damage, 17s, peak DPS 421,447"}, "why": []},
            {"name": {"id": "Akane + Blackbird + Sakiri + Linko", "en": "Akane + Blackbird + Sakiri + Linko"}, "members": ["akane-rin", "blackbird", "sakiri", "linko"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "1,83 juta damage, 18 detik, puncak DPS 393.455", "en": "1.83M damage, 18s, peak DPS 393,455"}, "why": []},
            {"name": {"id": "Akane + Blackbird + Sakiri + Iroi", "en": "Akane + Blackbird + Sakiri + Iroi"}, "members": ["akane-rin", "blackbird", "sakiri", "iroi"], "tag": {"id": "HASIL UJI", "en": "TESTED"}, "src": OWN,
             "metric": {"id": "1,83 juta damage, 21 detik, puncak DPS 383.375", "en": "1.83M damage, 21s, peak DPS 383,375"}, "why": []},
        ],
    },
}
(D / "builds_curated.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("builds_curated.json:", {k: len(v.get("teams", [])) for k, v in out.items()}, "tim")
