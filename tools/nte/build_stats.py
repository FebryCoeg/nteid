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


SKILL_GROUP = {"melee": "basic", "skill": "redirect", "ultraskill": "ultimate", "qte": "support"}
LABELS = [
    (r"(\d+)(?:st|nd|rd|th) Instance Ratio", lambda m: f"Rasio Hit ke-{m.group(1)}"),
    (r"Plunge DMG Ratio", lambda m: "Rasio DMG Plunge"),
    (r"Critical Riposte Ratio", lambda m: "Rasio Critical Riposte"),
    (r"Press Ratio", lambda m: "Rasio Tekan"),
    (r"Hold Ratio", lambda m: "Rasio Tahan"),
    (r"(.*) Ratio", lambda m: f"Rasio {m.group(1)}"),
]


def label_id(t):
    t = re.sub(r"<[^>]+>", "", t or "").strip()
    for rx, fn in LABELS:
        m = re.fullmatch(rx, t)
        if m:
            return fn(m)
    return t


def skill_levels(char_id, cfg, tips, dmg):
    """Material tiap level skill (kumulatif dihitung di browser) dan tabel rasio DMG per level."""
    out = {}
    for ab in (cfg.get(char_id) or {}).get("CharacterAbilityList", []):
        key = ab["Key"]
        group = SKILL_GROUP.get(key.rsplit("_", 1)[-1].lower())
        if not group:
            continue
        costs = []
        for lv in ab["Value"].get("LevelsCostItems", []):
            costs.append({it["ID"]: it["Number"] for it in lv["CostItems"]})
        rows = []
        for g in (tips.get(key, {}).get("GALevelUpArray") or []):
            lu = g.get("LevelUpData") or {}
            ges = lu.get("DamageGEList") or []
            if not ges or any(x not in dmg for x in ges):
                continue
            fmt = (g.get("DescValue") or {}).get("LocalizedString") or "{0}%"
            pct = "%" in fmt
            arrs = [dmg[x]["AtkRateBaseArray"] or dmg[x].get("DefRateBaseArray") or dmg[x].get("HPRateBaseArray") or [] for x in ges]
            n = min(len(costs) + 1, *(len(a) for a in arrs)) if all(arrs) else 0
            if not n:
                continue
            vals = [[int(a[i] * 100 + 1e-6) if pct else round(a[i], 2) for a in arrs] for i in range(n)]
            rows.append({"l": label_id((g.get("Desc") or {}).get("LocalizedString")), "f": fmt, "v": vals})
        out[group] = {"cost": costs, "rows": rows}
    return out


BONUS_NAMES = {"AtkUp": "ATK", "HPMaxUp": "HP", "DefUp": "DEF", "CritBase": "CRIT Rate", "CritDamageBase": "CRIT DMG"}


def affinity(cid, role, drops, gifts, mod):
    """Level Affinity (poin, hadiah), bonus stat, dan hadiah yang disukai."""
    levels = []
    for i, lv in enumerate(role["LevelInfo"], 1):
        items = []
        for k in sorted(k for k in drops if re.fullmatch(rf"droplist_Likeability_{cid}_lv{i}_\d+_\d+", k)):
            items.append([drops[k]["ItemID"], drops[k]["Num"]])
        levels.append({"max": lv["MaxValue"], "items": items})
    bonus = []
    m = mod.get(f"likeatt_{cid}")
    if m:
        bonus = [[BONUS_NAMES.get(x["PropName"], x["PropName"]), round(x["PropValue"] * 100, 2)] for x in m["ModifyData"]]
    loved = []
    for gid, g in gifts.items():
        sp = [x["LikeabilityValue"] for x in g.get("SpeicalGiftDatas", []) if x["RoleId"] == cid]
        if sp:
            loved.append([gid, max(sp)])
        elif g.get("ExclusiveLikeabilityID") == cid:
            loved.append([gid, g["DefaultLikeabilityValue"]])
    loved.sort(key=lambda x: -x[1])
    return {"levels": levels, "bonus": bonus, "gifts": loved}


def esper_stats():
    char = B.table("DataTable/Character/DT_Character.json")
    base = lower(B.table("DataTable/PackData/DT_PlayerPackData.json"))
    lvl = lower(B.table(P + "DT_PlayerModifyPackData.json"))
    brk = lower(B.table("DataTable/Character/DT_CharacterBreakthroughDataTable.json"))
    cfg = B.table("DataTable/Character/DT_CharacterAbilityConfig.json")
    tips = B.table("DataTable/Skill/DT_GameplayAbilityTipsData.json")
    dmg = B.table("DataTable/Skill/DT_SkillDamageData.json")
    roles = B.table("DataTable/LikeabilitySystem/DT_LikeabilityRoleData.json")
    gifts = B.table("DataTable/LikeabilitySystem/DT_LikeabilityGiftData.json")
    mod = B.table(P + "DT_LikeabilityModifyData.json")
    drops = B.table("DataTable/Drop/DropSequenceDataTable.json")
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
                        "mats": mat_list(parse_items(*tot_items, *tot_gold)), "icons": icons,
                        "skills": skill_levels(e["id"], cfg, tips, dmg),
                        "affinity": affinity(e["id"], roles[e["id"]], drops, gifts, mod) if e["id"] in roles else None}
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
    used |= {k for d in data["espers"].values() for sk in d["skills"].values() for c in sk["cost"] for k in c}
    used |= {i[0] for d in data["espers"].values() if d["affinity"] for lv in d["affinity"]["levels"] for i in lv["items"]}
    used |= {g[0] for d in data["espers"].values() if d["affinity"] for g in d["affinity"]["gifts"]}
    data["items"] = {k: {"name": items[k]["name"], "icon": items[k]["icon"], "rarity": items[k]["rarity"]} for k in used if k in items}
    cfg_items = B.table("DataTable/Inventory/DT_ItemConfig.json")
    food_items = B.table("DataTable/Food/DT_FoodItemData.json")
    alias = {"Annulith": ("Annulith_x10", "Annulith"), "Gold": ("gold_1000", "Beetle Coin")}
    for k in sorted(used - set(data["items"])):
        r = cfg_items.get(k) or food_items.get(k)
        fixed = None
        if k in alias:
            r, fixed = cfg_items.get(alias[k][0]), alias[k][1]
        if not r:
            continue
        name = fixed or B.plain(B.loc_text(r.get("ItemName")))
        icon = B.asset(r.get("ItemIcon"), "item", 160)
        if name and icon and not re.search(r"[㐀-鿿]", name):
            data["items"][k] = {"name": name, "icon": icon, "rarity": B.quality(r)}
    miss = sorted(k for k in used if k not in data["items"] and k != "gold")
    if miss:
        print("item tidak ada di items.json:", miss)
    data["items"]["gold"] = {"name": "Beetle Coin", "icon": "img/item/item_coin_beetle.webp", "rarity": 3}
    s = data["espers"].get("1003")
    assert (s["hp"][79], s["atk"][79], s["def"][79]) == (9955, 386, 549), s
    bopu = data["arcs"]["cosmos-daze-wild-reverie"]
    assert (bopu["atk"][79], bopu["up"][79]) == (475, 0.25), bopu
    (B.OUT_DATA / "stats.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    B.build_images()
    print("Esper:", len(data["espers"]), "Arc:", len(data["arcs"]))
