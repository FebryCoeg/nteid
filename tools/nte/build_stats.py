"""Statistik Esper dan Arc per level -> nte/data/stats.json

Esper : stat dasar (DT_PlayerPackData) + paket level (DT_PlayerModifyPackData, <Nama>_lv_N)
Arc   : ATK paket level (DT_ForkModifyData) + ATK tahap breakthrough, serta ATK% tahap tersebut
Angka Sakiri Lv.80 (HP 9955, ATK 386, DEF 549) dan Cosmos Daze, Wild Reverie Lv.80
(ATK 475, ATK 25%) cocok dengan situs referensi.

Jalankan setelah build.py dan build_extra.py:  python tools/nte/build_stats.py
"""
import json
import sys

sys.argv = [sys.argv[0], "--no-images"]
import build as B  # noqa: E402

P = "DataTable/PackData/ModifyData/"
MAXLV = 80


def mods(tab, key):
    return {m["PropName"]: m["PropValue"] for m in tab[key]["ModifyData"]}


def esper_stats():
    char = B.table("DataTable/Character/DT_Character.json")
    base = B.table("DataTable/PackData/DT_PlayerPackData.json")
    lvl = B.table(P + "DT_PlayerModifyPackData.json")
    espers = json.loads((B.OUT_DATA / "espers.json").read_text(encoding="utf-8"))
    out = {}
    for e in espers:
        row = char.get(e["id"])
        if not row:
            continue
        ed = row["ElementData"]
        b = base.get(ed["PropModifyID"])
        if not b or f"{ed['UpgradeModifyPackId']}_1" not in lvl:
            continue
        hp, atk, df = [], [], []
        for n in range(1, MAXLV + 1):
            m = mods(lvl, f"{ed['UpgradeModifyPackId']}_{n}")
            hp.append(round(b["HPMaxBase"] + m.get("HPMaxBase", 0)))
            atk.append(round(b["AtkBase"] + m.get("AtkBase", 0)))
            df.append(round(b["DefBase"] + m.get("DefBase", 0)))
        tags = [t["TagText"]["LocalizedString"] for t in row.get("PlayerViewTagArray", [])]
        out[e["id"]] = {"hp": hp, "atk": atk, "def": df, "crit": b["CritBase"], "critDmg": b["CritDamageBase"], "tags": tags}
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
        out[a["slug"]] = {"atk": atk, "up": up, "caps": [s[0] for s in stages]}
    return out


if __name__ == "__main__":
    data = {"espers": esper_stats(), "arcs": arc_stats()}
    s = data["espers"].get("1003")
    assert (s["hp"][79], s["atk"][79], s["def"][79]) == (9955, 386, 549), s
    bopu = data["arcs"]["cosmos-daze-wild-reverie"]
    assert (bopu["atk"][79], bopu["up"][79]) == (475, 0.25), bopu
    (B.OUT_DATA / "stats.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Esper:", len(data["espers"]), "Arc:", len(data["arcs"]))
