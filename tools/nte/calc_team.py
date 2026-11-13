"""Simulasi ulang (log replay) tim Shinku: ganti Arc/set Shinku, hitung ulang damage tiap hit.

Cara kerja: jadwal hit nyata dari log DPS tool dipakai apa adanya (rotasi, pergantian karakter, buff rekan
ikut tersimpan di damage nyata). Untuk tiap hit Shinku kita hitung faktor f = P_baru / P_acuan, dengan
P = ATK x zona DMG x ekspektasi crit x zona DEF (rumus dmgformula.py), lalu damage_baru = damage_nyata x f.
Jendela buff ("20 detik setelah Ultimate/Skill") diambil dari waktu cast di log.
Acuan 100% = build di rekaman: Blushing Mirage + Lost Radiance.

BATASAN: log tidak memuat stat panel, jadi gear dasar dan buff tim adalah asumsi (SCENARIOS). Hasilnya
peringkat relatif, bukan angka damage mutlak. Log pengguna TIDAK disimpan di repo (data akun).

Jalankan:  python tools/nte/calc_team.py <log.json> [dir cache NTE]
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import dmgformula as F  # noqa: E402

D = Path(__file__).resolve().parents[2] / "nte" / "data"
SHINKU = 1076
LOG = Path(sys.argv[1]) if len(sys.argv) > 1 else None
STATS = json.loads((D / "en" / "stats.json").read_text(encoding="utf-8"))
ARCS = {a["slug"]: a for a in json.loads((D / "en" / "arcs.json").read_text(encoding="utf-8"))}
ARC_ID = {a["slug"]: a["id"] for a in json.loads((D / "arcs.json").read_text(encoding="utf-8"))}
CACHE = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(os.environ.get("NTE_CACHE", "."))

CHAR_LV, ENEMY_LV, ENEMY_RES = 80, 90, 0.20
CONSOLE_CD = 0.32
TEAM = {1090: "echoes-on-hold", 1057: "far-side-of-the-moon", 1075: "the-wrong-gate"}  # arc rekan (dari pengguna)
SCENARIOS = {  # gear dasar + buff tim di luar Arc/set Shinku
    "konservatif": dict(cr=0.35, cd=0.80, uni=0.15, typed=0.10, team_atk=0.00),
    "tim kuat": dict(cr=0.45, cd=1.00, uni=0.25, typed=0.10, team_atk=0.30),
    "crit rendah": dict(cr=0.25, cd=0.60, uni=0.15, typed=0.10, team_atk=0.15),
}
# efek: (stat, nilai, jendela). jendela: always | ult | skill | ult_or_skill ; 'team' = berlaku juga untuk rekan
ARC_EFFECTS = {
    "blushing-mirage": lambda v: [("atk", v(0), "always"), ("typed", v(1), "ult"), ("def_ign", v(2), "ult")],
    "fluff-of-ferocity": lambda v: [("cd", 10 * v(0), "always")],
    "what-s-desired": lambda v: [("cd", v(1), "ult_or_skill")],
    "a-time-will-come": lambda v: [("atk", v(0), "always")],
    "camellia-society": lambda v: [],
}
SETS = {
    "Lost Radiance (4)": [("typed", 0.10, "always"), ("def_ign", 0.25, "ult")],
    "Shadow Creed (4)": [("atk", 0.10, "always"), ("atk", 0.25, "skill")],
    "Speedy Hedgehog (4) + buff tim": [("team_atk_ult", 0.15, "ult")],
    "Street Boxer (4)": [("cr", 0.14, "always")],
    "Street Boxer (4) + Remora/Stain tim": [("cr", 0.28, "always")],
    "Fireflies and the Forest (4)": [("cd", 0.56, "always")],
    "2 Lost Radiance + 2 Shadow Creed": [("typed", 0.10, "always"), ("atk", 0.10, "always")],
}


def parse_pct(s):
    s = str(s)
    return float(s.replace("%", "")) / (100 if "%" in s else 1)


def arc_secondary(slug):
    mod = json.loads((CACHE / "DataTable/PackData/ModifyData/DT_ForkModifyData.json").read_text(encoding="utf-8"))[0]["Rows"]
    a = ARCS[slug]
    m = mod.get(f"{ARC_ID[slug]}_rank{a['rarity']}_stage6")
    return {x["PropName"]: x["PropValue"] for x in (m or {}).get("ModifyData", [])}


def clusters(ts, gap):
    out, cur = [], []
    for t in ts:
        if cur and t - cur[-1] > gap:
            out.append(cur)
            cur = []
        cur.append(t)
    if cur:
        out.append(cur)
    return out


def load_log():
    d = json.loads(LOG.read_text(encoding="utf-8"))
    hits = [x for x in d["details"]["first_half_hits"] if x["damage"] is not None and x["direction"] == "outgoing"]
    t0 = hits[0]["timestamp"]
    rows = [(x["timestamp"] - t0, x["char_id"], x["damage"], x.get("damage_name") or "", x.get("ability_name") or "") for x in hits]
    ults = [c[0] for c in clusters([t for t, c, _, n, _ in rows if c == SHINKU and "沸血赤红" in n], 5)]
    # Crimson Fury dipakai sebagai penanda cast Ultimate; cluster berikutnya (Judgment, gap kecil dari rage) bukan cast baru
    ults = [u for i, u in enumerate(ults) if i == 0 or u - ults[i - 1] > 20]
    skills = [c[0] for c in clusters([t for t, c, _, n, a in rows if c == SHINKU and a == "GA_Shinku_Skill"], 1.5)]
    return rows, ults, skills


def in_window(t, starts, length=20.0):
    return any(s <= t <= s + length for s in starts)


def active(window, t, ults, skills):
    if window == "always":
        return True
    if window == "ult":
        return in_window(t, ults)
    if window == "skill":
        return in_window(t, skills)
    return in_window(t, ults) or in_window(t, skills)


def pool(effects, sec, t, ults, skills, sc, arc_atk):
    b = {"atk": 0.0, "typed": 0.0, "def_ign": 0.0, "cd": 0.0, "cr": 0.0}
    for stat, val, win in effects:
        if stat in b and active(win, t, ults, skills):
            b[stat] += val
    atk_pct = 0.175 + sc["team_atk"] + sec.get("AtkUp", 0) + b["atk"]
    atk = F.atk_total(STATS["espers"]["1076"]["atk"][-1], arc_atk, atk_pct, 366)
    cr = min(1.0, 0.05 + sc["cr"] + sec.get("CritBase", 0) + b["cr"])
    cd = 0.50 + sc["cd"] + CONSOLE_CD + b["cd"]
    bonus = F.dmg_bonus_zone(universal=sc["uni"], typed=sc["typed"] + b["typed"])
    deff = F.def_zone(CHAR_LV, ENEMY_LV, def_ignore=b["def_ign"], beyond_rails=True)
    return atk * bonus * F.crit_mult(cr, cd) * deff


def build_effects(arc, setname):
    a = ARCS[arc]
    vals = a["effect"]["values"][0]
    v = lambda i: parse_pct(vals[i])  # noqa: E731
    return ARC_EFFECTS.get(arc, lambda v: [])(v) + SETS[setname]


def team_total(arc, setname, sc, rows, ults, skills, ref):
    eff = build_effects(arc, setname)
    sec = arc_secondary(arc)
    arc_atk = STATS["arcs"][arc]["atk"][-1]
    eff_ref, sec_ref, atk_ref = ref
    total = shinku = 0.0
    hedge = [e for e in eff if e[0] == "team_atk_ult"]
    for t, cid, dmg, _n, _a in rows:
        if cid == SHINKU:
            f = pool(eff, sec, t, ults, skills, sc, arc_atk) / pool(eff_ref, sec_ref, t, ults, skills, sc, atk_ref)
            total += dmg * f
            shinku += dmg * f
        else:
            f = 1.0
            if hedge and in_window(t, ults):  # Speedy Hedgehog: ATK +15% seluruh rekan 20 detik setelah Ultimate
                mate_atk_base = STATS["espers"].get(str(cid), {"atk": [400]})["atk"][-1] + STATS["arcs"].get(TEAM.get(cid, ""), {"atk": [500]})["atk"][-1]
                pct = 0.175 + sc["team_atk"]
                f = (mate_atk_base * (1 + pct + 0.15) + 366) / (mate_atk_base * (1 + pct) + 366)
            total += dmg * f
    return total, shinku


def main():
    if not LOG:
        sys.exit(__doc__)
    rows, ults, skills = load_log()
    actual = sum(r[2] for r in rows)
    print(f"Log: {len(rows)} hit, damage nyata tim {actual:,.0f}; cast Ultimate Shinku di detik {[round(u,1) for u in ults]}; Skill di {[round(s,1) for s in skills]}")
    ref_eff = build_effects("blushing-mirage", "Lost Radiance (4)")
    ref = (ref_eff, arc_secondary("blushing-mirage"), STATS["arcs"]["blushing-mirage"]["atk"][-1])
    syn = [s for s, a in ARCS.items() if a["type"] == "Synthesis" and a["rarity"] >= 4]
    for name, sc in SCENARIOS.items():
        base, base_s = team_total("blushing-mirage", "Lost Radiance (4)", sc, rows, ults, skills, ref)
        print(f"\n=== Skenario {name}: acuan 100% = Blushing Mirage + Lost Radiance (tim {base:,.0f}) ===")
        print("-- Arc Shinku (set Lost Radiance)")
        res = sorted(((team_total(s, "Lost Radiance (4)", sc, rows, ults, skills, ref), s) for s in syn), key=lambda x: -x[0][0])
        for (tot, sh), s in res:
            print(f"  {ARCS[s]['name']:<30} tim {100 * tot / base:6.1f}%   Shinku saja {100 * sh / base_s:6.1f}%")
        print("-- Set cartridge Shinku (Arc Blushing Mirage)")
        res = sorted(((team_total("blushing-mirage", n, sc, rows, ults, skills, ref), n) for n in SETS), key=lambda x: -x[0][0])
        for (tot, sh), n in res:
            print(f"  {n:<40} tim {100 * tot / base:6.1f}%   Shinku saja {100 * sh / base_s:6.1f}%")


if __name__ == "__main__":
    main()
