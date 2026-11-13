"""Kalkulator build Shinku v0: damage per satu siklus rotasi, Arc signature = 100%.

BUKAN simulasi DPS (tidak ada data durasi animasi); yang dibandingkan adalah total damage satu siklus
rotasi tetap, jadi urutan Arc/set tidak bergantung kecepatan menekan tombol. Semua asumsi ada di ASSUMPTIONS
dan harus dicek pengguna. Rumus: tools/nte/dmgformula.py (terverifikasi video + NGA).

Jalankan:  NTE_CACHE=.../tools/nte/.cache python tools/nte/calc_shinku.py
"""
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import dmgformula as F  # noqa: E402

D = Path(__file__).resolve().parents[2] / "nte" / "data"
CACHE = Path(os.environ.get("NTE_CACHE", Path(__file__).resolve().parents[2] / "tools" / "nte" / ".cache"))

ASSUMPTIONS = [
    "Karakter Lv80, skill Basic/Redirect/Ultimate Lv10, Awakening 0, Arc Lv80 refine M1 (nilai efek kolom pertama).",
    "Musuh Lv90 di Beyond the Rails (DEF 90+Lv), RES 20% netral, bukan boss (Wrathscale +50% Ultimate tidak dihitung; ubah BOSS=False).",
    "Rotasi satu siklus: SCA x5 -> High-Speed Breach -> Crimson Fury -> 2x rantai Tidal Assault (5 hit) + 5x Scarlet Descent -> 3x Crimson Judgment -> Dragonflame Verdict.",
    "Efek 'setelah Ultimate' dianggap aktif untuk semua damage setelah Crimson Fury (hit Crimson Fury sendiri tidak diberi buff).",
    "Gear dasar (di luar Arc/set) mengikuti contoh video Radish: ATK +17,5% dan +366 flat; DMG universal, elemen, Crit Rate, Crit DMG lihat PROFILES.",
    "Console Shinku (Type III Specialization) dianggap +32% Crit DMG (2 modul Type III). Efek Menacing Gaze dan pasif Charge tidak dihitung.",
    "Set tim (Fireflies, Street Boxer, Speedy Hedgehog) bergantung pada rekan tim; dihitung dengan syarat terpenuhi penuh kecuali ditandai.",
]
BOSS = False
SKILL_LV = 10
PROFILES = {  # gear di luar Arc/set: (Crit Rate, Crit DMG, DMG universal, DMG elemen Cosmos)
    "tengah": (0.35, 0.80, 0.15, 0.10),
    "crit tinggi": (0.45, 1.00, 0.15, 0.10),
    "crit rendah": (0.25, 0.60, 0.15, 0.10),
}
CONSOLE_CD = 0.32
CHAR_LV, ENEMY_LV, ENEMY_RES = 80, 90, 0.20

stats = json.loads((D / "en" / "stats.json").read_text(encoding="utf-8"))  # label skill berbahasa Inggris
arcs_en = {a["slug"]: a for a in json.loads((D / "en" / "arcs.json").read_text(encoding="utf-8"))}
arcs_id = {a["slug"]: a["id"] for a in json.loads((D / "arcs.json").read_text(encoding="utf-8"))}
SH = stats["espers"]["1076"]
BASE_ATK = SH["atk"][-1]


def panel(group, label_part, idx=0):
    """Ambil baris panel skill: kembalikan total rasio (pecahan) memakai format '{0}% + {1}% *5'."""
    for r in SH["skills"][group]["rows"]:
        if label_part in r["l"]:
            vals = r["v"][SKILL_LV - 1]
            total = 0.0
            for term in r["f"].split("+"):
                m = re.search(r"\{(\d+)\}%\s*(?:\*(\d+))?", term)
                total += vals[int(m.group(1))] * (int(m.group(2)) if m.group(2) else 1) / 100
            return total
    raise KeyError(label_part)


def build_rotation():
    sca = sum(panel("basic", f"Special Combat Arts {n} Instance DMG Ratio") for n in ("1st", "2nd", "3rd", "4th", "5th"))
    hsb = [r for r in SH["skills"]["redirect"]["rows"] if r["l"] == "DMG Ratio"][0]
    hsb = sum(hsb["v"][SKILL_LV - 1]) / 100
    fury = panel("ultimate", "Crimson Fury")
    ta = sum(panel("basic", f"Tidal Assault {n} Instance DMG Ratio") for n in ("1st", "2nd", "3rd", "4th", "5th"))
    sd = panel("redirect", "Scarlet Descent")
    jud = panel("ultimate", "Crimson Judgment")
    verdict = panel("ultimate", "Dragonflame Verdict")
    # (nama, rasio total, fase, kena bonus Ultimate Wrathscale)
    return [
        ("Special Combat Arts x5", sca, "pre", False),
        ("High-Speed Breach", hsb, "pre", False),
        ("Crimson Fury", fury, "ult", True),
        ("Tidal Assault x5 (2 rantai)", ta * 2, "post", False),
        ("Scarlet Descent x5", sd * 5, "post", False),
        ("Crimson Judgment x3", jud * 3, "post", True),
        ("Dragonflame Verdict", verdict, "post", True),
    ]


def arc_secondary(slug):
    """Stat sekunder Arc di Lv80: dibaca langsung dari tabel modifier game."""
    mod = json.loads((CACHE / "DataTable/PackData/ModifyData/DT_ForkModifyData.json").read_text(encoding="utf-8"))[0]["Rows"]
    a = arcs_en[slug]
    m = mod.get(f"{arcs_id[slug]}_rank{a['rarity']}_stage6")
    sec = {}
    for x in (m or {}).get("ModifyData", []):
        sec[x["PropName"]] = x["PropValue"]
    return sec


def num(s):
    return float(str(s).replace("%", "")) / (100 if "%" in str(s) else 1)


def arc_effect(slug):
    """Efek pasif Arc untuk Shinku (Cosmos, pakai Redirect dan Ultimate). Mengembalikan dict buff per fase."""
    v = arcs_en[slug]["effect"]["values"][0]
    e = {"always": {}, "post": {}, "afterRedirect": {}}
    if slug == "blushing-mirage":
        e["always"]["atk_pct"] = num(v[0])
        e["post"].update(typed=num(v[1]), def_ignore=num(v[2]))
    elif slug == "fluff-of-ferocity":
        e["always"]["cd"] = 10 * num(v[0])  # 10 stack setelah crit, uptime dianggap penuh
    elif slug == "what-s-desired":
        e["afterRedirect"]["cd"] = num(v[1])  # Lakshana DMG tidak berguna untuk Cosmos
    elif slug == "a-time-will-come":
        e["always"]["atk_pct"] = num(v[0])  # tim punya >=3 tipe Esper
    elif slug == "camellia-society":
        pass  # 0 stack (HP dikurangi tanpa terkena damage jarang terjadi); serangan Silent Garden tidak dihitung
    return e


SETS = {
    "Lost Radiance (4)": {"always": {"typed": 0.10}, "post": {"def_ignore": 0.25}},
    "Shadow Creed (4)": {"always": {"atk_pct": 0.10}, "afterRedirect": {"atk_pct": 0.25}},
    "Speedy Hedgehog (4)": {"post": {"atk_pct": 0.15}},
    "Street Boxer (4)": {"always": {"cr": 0.14}},
    "Street Boxer (4) + tim Remora/Stain": {"always": {"cr": 0.28}},
    "Fireflies and the Forest (4)": {"always": {"cd": 0.56}},
    "2 Lost Radiance + 2 Shadow Creed": {"always": {"typed": 0.10, "atk_pct": 0.10}, "post": {}, "afterRedirect": {}},
}
SETS["2 Lost Radiance + 2 Shadow Creed"] = {"always": {"typed": 0.10, "atk_pct": 0.10}}


def phase_buffs(parts, phase):
    out = {}
    order = ["always"] + (["afterRedirect"] if phase in ("ult", "post") else []) + (["post"] if phase == "post" else [])
    for p in parts:
        for k in order:
            for stat, val in p.get(k, {}).items():
                out[stat] = out.get(stat, 0) + val
    return out


def total_damage(slug, set_name, profile, arc_base_atk=None, sec=None):
    cr0, cd0, uni, typed0 = PROFILES[profile]
    parts = [arc_effect(slug), SETS[set_name]]
    sec = sec if sec is not None else arc_secondary(slug)
    arc_atk = stats["arcs"][slug]["atk"][-1]
    rot = build_rotation()
    total = 0.0
    for name, ratio, phase, ult_bonus in rot:
        b = phase_buffs(parts, phase)
        atk_pct = 0.175 + sec.get("AtkUp", 0) + b.get("atk_pct", 0)
        atk = F.atk_total(BASE_ATK, arc_atk, atk_pct, 366)
        cr = min(1.0, 0.05 + cr0 + sec.get("CritBase", 0) + b.get("cr", 0))
        cd = 0.50 + cd0 + CONSOLE_CD + b.get("cd", 0)
        bonus = F.dmg_bonus_zone(universal=uni, typed=typed0 + b.get("typed", 0), source=(0.5 if (ult_bonus and not BOSS) else 0.0))
        deff = F.def_zone(CHAR_LV, ENEMY_LV, def_ignore=b.get("def_ignore", 0), beyond_rails=True)
        total += F.hit_damage(atk, ratio, bonus, cr, cd, deff, F.res_zone(ENEMY_RES))
    return total


def main():
    syn = [s for s, a in arcs_en.items() if a["type"] == "Synthesis" and a["rarity"] >= 4]
    for profile in PROFILES:
        sig = total_damage("blushing-mirage", "Lost Radiance (4)", profile)
        print(f"\n=== Profil gear: {profile} | pembanding 100% = Blushing Mirage + Lost Radiance (4) = {sig:,.0f} damage/siklus ===")
        print("-- Arc (set Lost Radiance 4pc)")
        for s in sorted(syn, key=lambda s: -total_damage(s, "Lost Radiance (4)", profile)):
            print(f"  {arcs_en[s]['name']:<30} {100 * total_damage(s, 'Lost Radiance (4)', profile) / sig:6.1f}%")
        print("-- Set cartridge (Arc Blushing Mirage)")
        for n in sorted(SETS, key=lambda n: -total_damage("blushing-mirage", n, profile)):
            print(f"  {n:<38} {100 * total_damage('blushing-mirage', n, profile) / sig:6.1f}%")
    print("\nRotasi satu siklus (rasio total, level skill 10):")
    for name, ratio, phase, ub in build_rotation():
        print(f"  {name:<30} {ratio * 100:8.1f}%  fase {phase}")
    print("\nASUMSI:")
    for a in ASSUMPTIONS:
        print(" -", a)


if __name__ == "__main__":
    main()
