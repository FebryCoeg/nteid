"""Baca tools/nte/owner_data.txt (data build tulisan pemilik situs, 26 karakter) menjadi data situs.

Satu-satunya sumber data tab Build; data kurasi lama (Raddish, spreadsheet, ntebuild.com, Prydwen, simulasi) sudah dicabut.
Nama dipetakan ke slug data situs; nama yang tidak dikenal dilaporkan (tidak ditebak). Dipanggil oleh make_curated.py.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
D = HERE.parents[1] / "nte" / "data"
OWN = {"title": "Data build pemilik situs", "by": "Hethereau", "url": ""}

SETS = {"devil's blood: curse": "Suit3", "speedy hedgehog": "Suit11", "street boxer": "Suit5", "shadow creed": "Suit8", "diabolos": "Suit1",
        "crimson: twin butterflies": "Suit4", "fireflies and the forest": "Suit2", "lost radiance": "Suit6", "kingdom's guard": "Suit7",
        "tiny big adventure": "Suit10", "thea's night tavern": "Suit9"}
CHAR = {"shinku": "shinku", "hathor": "hathor", "sakiri": "sakiri", "iroi": "iroi", "chaos": "chaos", "zero": "zero-1051", "nanally": "nanally",
        "jiuyuan": "jiuyuan", "adler": "adler", "haniel": "haniel", "daffodill": "daffodill", "baicang": "baicang", "fadia": "fadia",
        "aurelia": "aurelia", "lacrimosa": "lacrimosa", "zankou": "zankou", "linko": "linko", "blackbird": "blackbird", "akane rin": "akane-rin",
        "hotori": "hotori", "mint": "mint", "skia": "skia", "edgar": "edgar", "elyms": "elyms", "exe": "exe", "chiz": "chiz"}
SKILL = {"ultimate": "ultimate", "skill": "redirect", "basic attack": "basic", "qte": "support"}
LABEL = {"Ascension Materials (Lv. 20–80)": ("Material Ascension (Lv. 20–80)", "Ascension Materials (Lv. 20–80)"),
         "Ability Materials (4 Skill Lv. 10)": ("Material Ability (4 Skill Lv. 10)", "Ability Materials (4 Skill Lv. 10)"),
         "Best Bond Gift": ("Hadiah Bond terbaik", "Best Bond gift")}
TEAMNAME = {"Best Team": ("Tim terbaik", "Best team"), "Team 1": ("Tim 1", "Team 1")}


def T(i, e):
    return {"id": i, "en": e}


def tr(s):
    """Terjemahan ringan kata Indonesia yang tersisa di baris material (nama item sudah bahasa Inggris)."""
    return s.replace(" atau ", " or ").replace(" di ", " at ").replace(" untuk ", " for ")


def key(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def stat(s):
    return s.strip().replace("ATK%", "ATK %").replace("DEF%", "DEF %").replace("HP%", "HP %").replace("DMG%", "DMG %")


def skills(s):
    return [SKILL[p.strip().lower()] for p in re.split(r"→|>", s) if p.strip().lower() in SKILL]


def parse_blocks(text):
    blocks, cur = [], None
    for line in text.splitlines():
        m = re.match(r"^(\d+)\.\s+(\S.*?)\s*$", line)
        if m:
            cur = {"name": m.group(2), "lines": []}
            blocks.append(cur)
        elif cur is not None:
            cur["lines"].append(line)
    return blocks


def parse_arcs(v, arc_by_name, slug, unknown):
    v = v.replace("The Good, The Bad, The Bitter", "The Good; The Bad; The Bitter")
    out = []
    for n in v.split(","):
        n = re.sub(r"\s*\(Signature\)", "", n).strip().replace("; ", ", ")
        sl = arc_by_name.get(key(n))
        if sl:
            if sl not in out:
                out.append(sl)
        else:
            unknown.append((slug, "arc", n))
    return out


def parse_team(rest, tname, slug, unknown):
    members, roles = [], []
    for tok in re.split(r"\s\+\s|,\s(?![^()]*\))", rest):
        t = re.match(r"^(.+?)(?:\s+\((.+)\))?$", tok.strip())
        names = [x.strip() for x in t.group(1).split(" / ")]
        sl = CHAR.get(names[0].lower())
        if not sl:
            unknown.append((slug, "anggota tim", names[0]))
            continue
        role = t.group(2) or ""
        if len(names) > 1:
            role = (role + ", atau " + ", ".join(names[1:])).strip(", ")
        members.append(sl)
        roles.append(T(role, tr(role)))
    tn = T(*TEAMNAME[tname]) if tname in TEAMNAME else T(tname, tname)
    return [{"name": tn, "members": members, "roles": roles, "tag": T("REKOMENDASI", "RECOMMENDED"), "src": OWN, "why": []}]


def apply(out):
    text = (HERE / "owner_data.txt").read_text(encoding="utf-8")
    arc_by_name = {key(a["name"]): a["slug"] for a in json.loads((D / "en" / "arcs.json").read_text(encoding="utf-8"))}
    both = arc_by_name.get(key("Cosmos Daze, Wild Reverie"))  # satu Arc di game memuat kedua nama
    arc_by_name[key("Cosmos Daze")] = both
    arc_by_name[key("Wild Reverie")] = both
    unknown = []
    for blk in parse_blocks(text):
        slug = CHAR.get(blk["name"].lower())
        if not slug:
            unknown.append(("karakter", blk["name"]))
            continue
        b = {"teams": [], "src": [OWN]}
        awk_rows, mats, mode = [], [], ""
        for line in blk["lines"]:
            s = line.rstrip()
            if not s.strip():
                continue
            m = re.match(r"^\*\s+(Role|Best Arcs|Best Modules|Main Stats|Sub Stats Priority|Best Teams|Skill Priority|Best Awakening Nodes|Build FAQ)\b[^:]*:\s*(.*)$", s)
            if m:
                k, v = m.group(1), m.group(2).strip()
                mode = {"Best Awakening Nodes": "awk", "Build FAQ": "faq"}.get(k, "")
                if k == "Role":
                    parts = [x.strip() for x in v.split("/")]
                    b["role"] = {"rank": parts[0].split("-")[0], "role": " · ".join(parts[1:])}
                elif k == "Best Arcs":
                    b["arcs"] = parse_arcs(v, arc_by_name, slug, unknown)
                elif k == "Best Modules":
                    ids = []
                    for n in v.split(","):
                        sid = SETS.get(n.strip().lower())
                        (ids.append({"id": sid, "pieces": 4}) if sid else unknown.append((slug, "set", n.strip())))
                    b["sets"] = ids
                elif k == "Main Stats":
                    b["stats"] = [stat(x) for x in v.split(",")]
                elif k == "Sub Stats Priority":
                    b["sub"] = [stat(x) for x in re.split(r"→|>", v)]
                elif k == "Skill Priority":
                    b["skills"] = skills(v)
                elif k == "Best Teams":
                    mm = re.match(r"^\*\s+Best Teams \((.+?)\):\s*(.+)$", s)
                    b["teams"] = parse_team(mm.group(2), mm.group(1), slug, unknown)
                continue
            if mode == "awk":
                m2 = re.match(r"^\s+\d+\.\s+A(\d)\s+\(.*?\)\s+\[Prioritas \d\]:\s*(.*)$", s)
                if m2:
                    awk_rows.append((int(m2.group(1)), m2.group(2).strip()))
            elif mode == "faq":
                m3 = re.match(r"^\s+\*\s+(Ascension Materials \(Lv\. 20–80\)|Ability Materials \(4 Skill Lv\. 10\)|Best Bond Gift):\s*(.*)$", s)
                if m3:
                    body = m3.group(2).strip().rstrip(".")
                    mats.append({"label": T(*LABEL[m3.group(1)]), "text": T(body, tr(body))})
        if awk_rows:
            b["awks"] = [n for n, _ in awk_rows]
            b["awkDesc"] = {str(n): d for n, d in awk_rows}
        if mats:
            b["mats"] = mats
        out[slug] = b
    if "zero-1051" in out:
        out["zero-1046"] = json.loads(json.dumps(out["zero-1051"]))  # Zero satu karakter dengan dua gender
    if unknown:
        print("TIDAK DIKENAL (dilewati):", unknown)
