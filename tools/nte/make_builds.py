"""Buat draf build tiap Esper dari data game -> nte/data/builds_draft.json

Draf ini murni turunan data game (tipe Arc, elemen, peran tempur, bonus set modul, teks awakening),
BUKAN hasil perhitungan damage. Build buatan admin (nte/data/builds.json) selalu menggantikan draf.

Jalankan SETELAH build.py, build_stats.py, dan build_en.py:   python tools/nte/make_builds.py
"""
import json
import re
from pathlib import Path

D = Path(__file__).resolve().parents[2] / "nte" / "data"
EN = D / "en"


def jl(p):
    return json.loads(p.read_text(encoding="utf-8"))


espers = jl(EN / "espers.json")
arcs = jl(EN / "arcs.json")
mods = jl(EN / "modules.json")
stats = jl(D / "stats.json")
set_ids = {s["id"] for s in mods["sets"]}
ARCS_BY_SLUG = {a["slug"]: a for a in arcs}

ELEMENT_SET = {"Chaos": "Suit1", "Anima": "Suit2", "Psyche": "Suit3", "Incantation": "Suit4",
               "Lakshana": "Suit5", "Cosmos": "Suit6", "Mental": "Suit12"}
SC, HEDGE, KING, TAVERN, TINY = "Suit8", "Suit11", "Suit7", "Suit9", "Suit10"


def kind(tags):
    t = set(tags)
    if "Healing" in t:
        return "heal"
    if "Shield" in t or ("Survival" in t and "Damage" not in t):
        return "guard"
    if "Buff" in t and "Damage" not in t:
        return "buff"
    if "Buff" in t:
        return "buffdps"
    return "dps"


def arc_codes(a, e, tags):
    """Alasan sebuah Arc cocok; kode diterjemahkan di app.js."""
    txt = a["effect"]["text"] if isinstance(a.get("effect"), dict) else ""
    low = txt.lower()
    codes = []
    if e["element"].lower() in low:
        codes.append("element")
    if "crit" in low:
        codes.append("crit")
    if re.search(r"\batk\b", low):
        codes.append("atk")
    t = set(tags)
    if "DoT" in t and "dot" in low:
        codes.append("dot")
    if "Summoner" in t and "summon" in low:
        codes.append("summon")
    if ("Break Boost" in t or "Control" in t) and "break" in low:
        codes.append("break")
    if "Follow-up Attack" in t and "follow-up" in low:
        codes.append("followup")
    if "Healing" in t and "heal" in low:
        codes.append("heal")
    if "Shield" in t and "shield" in low:
        codes.append("shield")
    if t & {"Buff", "DMG Boost"} and re.search(r"all allies|team|ally|allies", low):
        codes.append("team")
    if "Instant Cycle" in t and "cycle" in low:
        codes.append("cycle")
    return codes


WEIGHT = {"element": 3, "crit": 2, "atk": 2, "dot": 3, "summon": 3, "break": 2, "followup": 3, "heal": 3, "shield": 3, "team": 3, "cycle": 2}


def pick_arcs(e, tags, k):
    cand = [a for a in arcs if a["type"] == e["arcType"] and a["rarity"] >= 4]
    sc = stats["arcs"]
    scored = []
    for a in cand:
        codes = arc_codes(a, e, tags)
        if k in ("heal", "guard", "buff"):
            codes = [c for c in codes if c not in ("crit",)] or codes
        atk = (sc.get(a["slug"], {}).get("atk") or [0])[-1]
        score = a["rarity"] * 10 + sum(WEIGHT.get(c, 1) for c in codes) + atk / 100
        scored.append((score, a, codes))
    scored.sort(key=lambda x: -x[0])
    top = scored[:4]
    return [x[1]["slug"] for x in top], {x[1]["slug"]: (["type"] + x[2] + (["rare"] if x[1]["rarity"] == 5 else [])) for x in top}


def pick_sets(e, k):
    es = ELEMENT_SET.get(e["element"])
    plan = {
        "dps": [(es, "element"), (SC, "atk"), (HEDGE, "team")],
        "buffdps": [(es, "element"), (HEDGE, "team"), (SC, "atk")],
        "buff": [(HEDGE, "team"), (SC, "atk"), (es, "element")],
        "guard": [(KING, "shield"), (TINY, "hp"), (HEDGE, "team")],
        "heal": [(TAVERN, "heal"), (TINY, "hp"), (KING, "shield")],
    }[k]
    sets = [{"id": i, "pieces": 4} for i, _ in plan if i in set_ids]
    why = {i: c for i, c in plan if i in set_ids}
    return sets, why


MAIN = {
    "dps": (["CRIT Rate", "CRIT DMG", "ATK %", "DMG Bonus"], ["CRIT Rate", "CRIT DMG", "DMG Bonus", "ATK %", "ATK"]),
    "buffdps": (["CRIT Rate", "CRIT DMG", "ATK %", "DMG Bonus"], ["CRIT Rate", "CRIT DMG", "ATK %", "Energy Regen", "DMG Bonus"]),
    "buff": (["ATK %", "Energy Regen", "CRIT Rate", "CRIT DMG"], ["Energy Regen", "ATK %", "CRIT Rate", "CRIT DMG"]),
    "guard": (["HP %", "DEF %", "Energy Regen"], ["HP %", "DEF %", "Energy Regen", "HP", "DEF"]),
    "heal": (["Healing Bonus", "HP %", "Energy Regen"], ["HP %", "Energy Regen", "Healing Bonus", "DEF %"]),
}
SKILL_ORDER = {
    "main": ["basic", "ultimate", "redirect", "support"],
    "burst": ["ultimate", "redirect", "basic", "support"],
    "sup": ["ultimate", "redirect", "support", "basic"],
}


def skill_order(e, tags, k):
    t = set(tags)
    key = "sup" if k in ("buff", "guard", "heal") else ("burst" if "Burst DPS" in t and "Main DPS" not in t else "main")
    have = {s["group"] for s in e["skills"]}
    return [g for g in SKILL_ORDER[key] if g in have]


AW_POS = [(r"ignores?", 3), (r"damage ratio|dmg ratio", 3), (r"crit", 3), (r"dmg (dealt )?by|increases dmg|dmg dealt|dmg bonus", 2), (r"\batk\b", 2),
          (r"resistance", -1), (r"\bdef\b", -1), (r"\bhp\b|heal", -1), (r"energy|cycle", 1)]
AW_SUP = [(r"all allies|team|allies|ally", 3), (r"\batk\b", 2), (r"crit", 2), (r"dmg", 1), (r"energy|cycle", 1)]
AW_GRD = [(r"heal|shield|\bhp\b|\bdef\b|resistance", 3), (r"allies|ally|team", 2), (r"energy|cycle", 1)]


def awk_order(e, k):
    pats = {"dps": AW_POS, "buffdps": AW_POS + [(r"all allies|team", 1)], "buff": AW_SUP, "guard": AW_GRD, "heal": AW_GRD}[k]
    res = []
    for i, a in enumerate(e["awakening"][:6]):
        low = (a.get("desc") or "").lower()
        res.append((sum(w for p, w in pats if re.search(p, low)), -i, i + 1))
    res.sort(reverse=True)
    return [n for _, _, n in res]


out = {}
for e in espers:
    st = stats["espers"].get(e["id"]) or {}
    tags = st.get("tags") or []
    k = kind(tags)
    a_slugs, a_why = pick_arcs(e, tags, k)
    sets, s_why = pick_sets(e, k)
    main, sub = MAIN[k]
    main = [("DMG Bonus" if m == "DMG Bonus" else m) for m in main]
    out[e["slug"]] = {
        "draft": True, "kind": k, "arcs": a_slugs, "arcWhy": a_why, "sets": sets, "setWhy": s_why,
        "stats": main, "sub": sub, "awks": awk_order(e, k), "skills": skill_order(e, tags, k),
    }

# hasil simulasi (builds_calc.json) menggantikan urutan Arc/set draf untuk Esper yang sudah dihitung
calc_path = D / "builds_calc.json"
if calc_path.exists():
    by_slug = {e["slug"]: e for e in espers}
    for slug, c in jl(calc_path).items():
        e = by_slug[slug]
        tags = (stats["espers"].get(e["id"]) or {}).get("tags") or []
        d = out[slug]
        d["arcs"] = c["arcs"]
        d["arcWhy"] = {a: ["type"] + arc_codes(ARCS_BY_SLUG[a], e, tags) + (["rare"] if ARCS_BY_SLUG[a]["rarity"] == 5 else []) for a in c["arcs"]}
        d["arcPct"] = c["arcPct"]
        d["sets"] = c["sets"]
        d["setPct"] = c["setPct"]
        d["setWhy"] = {i: w for i, w in {"Suit6": "element", "Suit8": "atk"}.items() if any(x["id"] == i for x in c["sets"])}
        d["setNote"] = c.get("setNote", {})
        d["calc"] = {"team": c["team"], "basis": c["basis"], "note": c["note"], "members": c["members"], "shared": c.get("shared", 0), "total": c["total"], "seconds": c["seconds"]}
        # reaksi Esper yang terbentuk dari pasangan elemen di tim (aturan: reactions game + NGA)
        els = {m["slug"]: by_slug[m["slug"]]["element"] for m in c["members"]}
        pairs = {frozenset(x) for x in [("Cosmos", "Lakshana"), ("Anima", "Cosmos"), ("Anima", "Incantation"), ("Chaos", "Psyche"),
                                         ("Chaos", "Incantation"), ("Lakshana", "Psyche")]}
        names = {frozenset(("Cosmos", "Lakshana")): "remora", frozenset(("Anima", "Cosmos")): "blossom", frozenset(("Anima", "Incantation")): "hexed",
                 frozenset(("Chaos", "Psyche")): "nova", frozenset(("Chaos", "Incantation")): "scorch", frozenset(("Lakshana", "Psyche")): "stain"}
        have = {names[frozenset((a, b))] for a in els.values() for b in els.values() if a != b and frozenset((a, b)) in pairs}
        if {"blossom", "remora"} <= have:
            have.add("charge")
        if {"nova", "scorch"} <= have:
            have.add("discord")
        d["calc"]["reactions"] = sorted(have)

(D / "builds_draft.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("draf build:", len(out), "Esper ->", D / "builds_draft.json")
