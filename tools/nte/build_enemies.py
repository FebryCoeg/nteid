"""Data musuh: status (HP, ATK, DEF, Resist, Unbal) di setiap level, langsung dari tabel game.

Sumber: DT_MonsterStaticData_BigWorld (musuh dunia, level -> paket stat), DT_MonsterStaticData_Clone (boss mingguan,
7 tingkat kesulitan), DT_MonsterPackData (stat per paket), ST_ActorName (nama). Ditulis ke nte/data/enemies.json.
Jalankan: NTE_CACHE=... PYTHONIOENCODING=utf-8 python tools/nte/build_enemies.py
"""
import json
import re
from pathlib import Path

import build as B

OUT = Path(__file__).resolve().parents[2] / "nte" / "data" / "enemies.json"
bw = B.table("DataTable/Monster/DT_MonsterStaticData_BigWorld.json")
cl = B.table("DataTable/Monster/DT_MonsterStaticData_Clone.json")
pk = B.table("DataTable/PackData/DT_MonsterPackData.json")
manual = B.table("DataTable/DT_MonsterManualConfig.json")
NAMES = {k.lower(): v for k, v in (B.LOC.get("ST_ActorName") or {}).items()}

RES = [("normal", "Normal"), ("cosmos", "Cosmos"), ("nature", "Nature"), ("incantation", "Incantation"),
       ("chaos", "Chaos"), ("psyche", "Psyche"), ("lakshana", "Lakshana")]


def stat(pid):
    p = pk.get(pid)
    if not p:
        return None
    return {
        "hp": round(p["HPMaxBase"]), "atk": round(p["AtkBase"]), "def": round(p["DefBase"]),
        "res": {k: round(p["DamageResist%sBase" % n], 4) for k, n in RES},
        "imm": {k: round(p["DamageImmu%s" % n], 4) for k, n in RES if p["DamageImmu%s" % n]},
        "unbal": round(p["UnbalMax"], 2), "ten": round(p["TenacityRecoverSpeed"], 2),
    }


def prefix(pid):
    """Nama paket 'mon_18_BP_World_DataPack3' -> 'mon_18'; 'Boss_15_BP_Vision_DataPack0' -> 'boss_15'."""
    m = re.match(r"^(mon_\d+|boss_\d+)", pid, re.I)
    return m.group(1).lower() if m else None


def name_for(pre):
    if not pre:
        return ""
    n = re.match(r"^(mon|boss)_(\d+)$", pre)
    alts = [pre, "%s_%s" % (n.group(1), n.group(2).lstrip("0").zfill(2)), "%s_%03d" % (n.group(1), int(n.group(2)))] if n else [pre]
    for a in alts:
        if NAMES.get(a + "_name"):
            return NAMES[a + "_name"]
    return ""


def name_fam(pre, fam):
    """mon_35 punya dua nama menurut warna (Blue/Red) di ST_ActorName."""
    m = re.search(r"_(blue|red)_", fam + "_", re.I)
    if pre == "mon_35" and m:
        return NAMES.get("mon_35_%s_name" % m.group(1).lower(), "")
    return name_for(pre)


def family(pid):
    return re.sub(r"_DataPack\d+$", "", pid.replace(" ", ""))


enemies = {}   # kunci: keluarga paket


def add(fam, pre, typ, kind, rows):
    e = enemies.setdefault(fam, {"id": fam, "pre": pre, "name": name_fam(pre, fam), "type": typ, "kind": kind, "levels": {}})
    for lv, pid in rows:
        s = stat(pid)
        if s:
            e["levels"][int(lv)] = s


for key, v in bw.items():
    wl = v.get("WorldLevelArray") or []
    if not wl:
        continue
    pid0 = wl[0]["MonsterWorldLevelPropModifyID"]
    pre = prefix(pid0) or prefix(key)
    typ = "boss" if (pre or "").startswith("boss") else "normal"
    add(family(pid0), pre, typ, "dunia", [(w["MonsterWorldLevel"], w["MonsterWorldLevelPropModifyID"]) for w in wl])

for key, v in cl.items():
    nm = (v["TextName"] or {}).get("LocalizedString")
    cd = v.get("CloneDifficultyLevelArray") or []
    pid = v["PropModifyID"]
    if nm and v["MonsterLevel"] and pk.get(pid) and key.lower().startswith("boss"):
        pre = prefix(key)
        fam = re.sub(r"_Lv\d+$", "", key)
        e = enemies.setdefault(fam, {"id": fam, "pre": pre, "name": nm, "type": "weekly", "kind": "boss mingguan", "levels": {}})
        e["name"] = nm
        s = stat(pid)
        if s:
            e["levels"][int(v["MonsterLevel"])] = s

# jenis dari Monster Manual (Boss / WeeklyBoss / Elite / Normal) bila ada
man_type = {}
for k, m in manual.items():
    t = m["EnemyType"].split("::")[1]
    man_type[prefix(k) or k.lower()] = t
for e in enemies.values():
    t = man_type.get(e["pre"])
    if t:
        e["type"] = {"Boss": "boss", "WeeklyBoss": "weekly", "Elite": "elite", "Normal": "normal"}.get(t, e["type"])

LABELS = [("WorldBoss", "Boss dunia", "World boss"), ("VisionBoss", "Boss Vision", "Vision boss"), ("DiyBoss", "Boss DIY", "DIY boss"),
          ("Weekly", "Boss mingguan (Clone)", "Weekly boss (Clone)"), ("Clone", "Clone", "Clone"), ("Bank", "Bank", "Bank"),
          ("Vision", "Vision", "Vision"), ("Quest", "Misi", "Quest"), ("Summon", "Panggilan", "Summon"), ("World", "Dunia", "Open world")]


def label(fid):
    for k, i, e in LABELS:
        if k.lower() in fid.lower():
            return i, e
    return "Lainnya", "Other"


groups = {}
unnamed = []
for e in enemies.values():
    if not e["levels"]:
        continue
    if not e["name"]:
        unnamed.append(e["id"])
        continue
    g = groups.setdefault(e["name"], {"name": e["name"], "type": e["type"], "pre": e["pre"], "variants": []})
    g["variants"].append(e)

out = []
for g in groups.values():
    seen, vs = {}, []
    for e in sorted(g["variants"], key=lambda e: (-len(e["levels"]), e["id"])):
        lv = {str(k): e["levels"][k] for k in sorted(e["levels"])}
        sig = json.dumps(lv, sort_keys=True)
        if len(lv) == 1 and re.search(r"PV|Parry|test", e["id"], re.I):
            continue
        if sig in seen:
            seen[sig]["ids"].append(e["id"])
            continue
        li, le = label(e["id"])
        v = {"id": e["id"], "ids": [e["id"]], "label": {"id": li, "en": le}, "levels": lv}
        seen[sig] = v
        vs.append(v)
    if vs:
        out.append({"name": g["name"], "type": g["type"], "pre": g["pre"], "variants": vs})
out.sort(key=lambda e: ({"weekly": 0, "boss": 1, "elite": 2, "normal": 3}.get(e["type"], 4), e["name"]))
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("musuh:", len(out), "| varian:", sum(len(e["variants"]) for e in out), "| tanpa nama (dilewati):", len(unnamed), unnamed[:30])
for e in out:
    print(e["type"], e["name"], [(v["label"]["en"], len(v["levels"])) for v in e["variants"]])
