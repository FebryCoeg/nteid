"""Statistik Esper dan Arc per level -> nte/data/stats.json

Esper : stat dasar (DT_PlayerPackData) + paket level (DT_PlayerModifyPackData, <Nama>_lv_N)
Arc   : ATK paket level (DT_ForkModifyData) + ATK tahap breakthrough, serta ATK% tahap tersebut
Angka Sakiri Lv.80 (HP 9955, ATK 386, DEF 549) dan Cosmos Daze, Wild Reverie Lv.80
(ATK 475, ATK 25%) cocok dengan situs referensi.

Jalankan setelah build.py dan build_extra.py:  python tools/nte/build_stats.py
"""
import json
import re
import sys

sys.argv = [sys.argv[0], "--no-images"]
import build as B  # noqa: E402

P = "DataTable/PackData/ModifyData/"
MAXLV = 80


def mods(tab, key):
    return {m["PropName"]: m["PropValue"] for m in tab[key]["ModifyData"]}


def lower(tab):
    return {k.lower(): v for k, v in tab.items()}


def parse_items(*texts):
    """'a:5,b:2' (beberapa baris) -> {'a': 5, 'b': 2} dijumlahkan."""
    tot = {}
    for t in texts:
        for part in (t or "").split(","):
            if ":" in part:
                k, v = part.rsplit(":", 1)
                tot[k.strip()] = tot.get(k.strip(), 0) + int(float(v))
    return tot


def mat_list(tot):
    order = sorted(tot.items(), key=lambda kv: (kv[0] == "gold", kv[0]))
    return [[k, v] for k, v in order]


_TREE = None


def skill_icons(prefix):
    """Cari ikon skill UI_Icon/Skill/<prefix>_* dan petakan ke kelompok skill."""
    global _TREE
    if _TREE is None:
        _TREE = [p for p in json.loads(B.fetch_tree()) if p.startswith("UI_Icon/Skill/") and p.endswith(".png")]
    mine = {}
    for p in _TREE:
        n = p[len("UI_Icon/Skill/"):-4]
        if n.lower().startswith(prefix.lower() + "_"):
            mine[n[len(prefix) + 1:].lower()] = n

    def first(*cands):
        for c in cands:
            if c.lower() in mine:
                return mine[c.lower()]
        return None

    def reg(name):
        if not name:
            return ""
        return B.asset(f"/Game/UI/UI_Icon/Skill/{name}.x", "skill", 128)

    picks = {
        "basic": first("melee", "melee1", "magicmelee"),
        "redirect": first("skill", "skill1", "skilla"),
        "support": first("qte"),
        "ultimate": first("ultraskill", "ultraskill1", "ultra", "ultraskilla"),
    }
    out = {k: reg(v) for k, v in picks.items()}
    pas = sorted(n for n in mine if re.fullmatch(r"pas(sive)?\d+", n))
    out["passive"] = [reg(mine[n]) for n in pas]
    out["reflexive"] = B.asset("/Game/UI/UI_Icon/Skill/Icon_Skill_Main_shanbi.x", "skill", 128)
    return {k: v for k, v in out.items() if v}


def esper_stats():
    char = B.table("DataTable/Character/DT_Character.json")
    base = lower(B.table("DataTable/PackData/DT_PlayerPackData.json"))
    lvl = lower(B.table(P + "DT_PlayerModifyPackData.json"))
    brk = lower(B.table("DataTable/Character/DT_CharacterBreakthroughDataTable.json"))
    espers = json.loads((B.OUT_DATA / "espers.json").read_text(encoding="utf-8"))
    out = {}
    for e in espers:
        row = char.get(e["id"])
        if not row:
            continue
        ed = row["ElementData"]
        b = base.get(ed["PropModifyID"].lower())
        up = ed["UpgradeModifyPackId"].lower()
        if not b or f"{up}_1" not in lvl:
            continue
        hp, atk, df = [], [], []
        for n in range(1, MAXLV + 1):
            m = mods(lvl, f"{up}_{n}")
            hp.append(round(b["HPMaxBase"] + m.get("HPMaxBase", 0)))
            atk.append(round(b["AtkBase"] + m.get("AtkBase", 0)))
            df.append(round(b["DefBase"] + m.get("DefBase", 0)))
        tags = [t["TagText"]["LocalizedString"] for t in row.get("PlayerViewTagArray", [])]
        tot_items, tot_gold, n = [], [], 0
        bp = ed["BreakthroughPackId"].lower()
        while f"{bp}_{n}" in brk:
            tot_items.append(brk[f"{bp}_{n}"]["NeedItems"])
            tot_gold.append(brk[f"{bp}_{n}"]["NeedGolds"])
            n += 1
        prefix = ed["PropModifyID"][: -len("_base")]
        icons = skill_icons(prefix)
        if "basic" not in icons:
            icons = skill_icons(e["name"])
        out[e["id"]] = {"hp": hp, "atk": atk, "def": df, "crit": b["CritBase"], "critDmg": b["CritDamageBase"], "tags": tags,
                        "mats": mat_list(parse_items(*tot_items, *tot_gold)), "icons": icons}
    return out


def arc_stats():
    items = B.table("DataTable/Fork/DT_ForkItemData.json")
    upg = B.table("DataTable/Fork/DT_ForkUpgradeData.json")
    brk = B.table("DataTable/Fork/DT_ForkBreakthroughData.json")
    fmod = B.table(P + "DT_ForkModifyData.json")
    by_lower = {k.lower(): k for k in items}
    arcs = json.loads((B.OUT_DATA / "arcs.json").read_text(encoding="utf-8"))
    out = {}
    for a in arcs:
        key = by_lower.get(a["id"].lower())
        if not key:
            continue
        ed = items[key]["ElementData"]
        up_id, br_id = ed["UpgradePackId"], ed["BreakthroughPackId"]
        stages = []
        n = 0
        while f"{br_id}_{n}" in brk:
            r = brk[f"{br_id}_{n}"]
            stages.append((r["MaxForkLevel"], mods(fmod, r["ModifyPackID"])))
            n += 1
        if not stages:
            continue
        cap = stages[-1][0]
        atk, up = [], []
        for lv in range(1, cap + 1):
            u = upg.get(f"{up_id}_{lv}")
            if not u:
                break
            m = mods(fmod, u["ModifyPack"])
            st = next((s for s in stages if s[0] >= lv), stages[-1])[1]
            atk.append(round(m.get("AtkBase", 0) + st.get("AtkBase", 0)))
            up.append(round(st.get("AtkUp", 0), 4))
        items_t, gold_t = [], []
        n = 0
        while f"{br_id}_{n}" in brk:
            items_t.append(brk[f"{br_id}_{n}"].get("NeedItems"))
            gold_t.append(brk[f"{br_id}_{n}"].get("NeedGolds"))
            n += 1
        out[a["slug"]] = {"atk": atk, "up": up, "caps": [s[0] for s in stages], "mats": mat_list(parse_items(*items_t, *gold_t))}
    return out


if __name__ == "__main__":
    data = {"espers": esper_stats(), "arcs": arc_stats()}
    items = {x["id"]: x for x in json.loads((B.OUT_DATA / "items.json").read_text(encoding="utf-8"))["items"]}
    used = {m[0] for d in (*data["espers"].values(), *data["arcs"].values()) for m in d["mats"]}
    data["items"] = {k: {"name": items[k]["name"], "icon": items[k]["icon"], "rarity": items[k]["rarity"]} for k in used if k in items}
    data["items"]["gold"] = {"name": "Beetle Coin", "icon": "img/item/item_coin_beetle.webp", "rarity": 3}
    s = data["espers"].get("1003")
    assert (s["hp"][79], s["atk"][79], s["def"][79]) == (9955, 386, 549), s
    bopu = data["arcs"]["cosmos-daze-wild-reverie"]
    assert (bopu["atk"][79], bopu["up"][79]) == (475, 0.25), bopu
    (B.OUT_DATA / "stats.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    B.build_images()
    print("Esper:", len(data["espers"]), "Arc:", len(data["arcs"]))
