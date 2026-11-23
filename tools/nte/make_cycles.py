"""Buat nte/data/cycles.json (8 Esper Cycle) dari data game: reactions.json + espers.json.

Dari reactions.json diambil: urutan siklus, elemen pemicu, angka pada deskripsi, dan karakter yang punya penguatan.
Teks dasar ditulis di bawah dalam Indonesia dan Inggris; angkanya diisi dari teks Cina game lewat {0}, {1}, ...
dan skrip berhenti bila jumlah angka tidak cocok, supaya terjemahan tidak bisa menyimpang dari data.

Pemakaian: python tools/nte/make_cycles.py [jalur/ke/reactions.json]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / "nte" / "data"
DEFAULT = Path(r"E:\Download\nte-dps-tool-windows-external-resources\res\data\reactions\reactions.json")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ELEMENT = {"LAKSHANA": "Lakshana", "COSMOS": "Cosmos", "NATURE": "Anima", "INCANTATION": "Incantation", "CHAOS": "Chaos", "PSYCHE": "Psyche"}

# kunci: nama Cina di game -> (kunci, nama tampil, teks ID, teks EN). Urutan tampil = urutan di bawah.
TEXT = [
    ("延滞", "remora", "Remora",
     "Target masuk status Remora selama {0} detik setelah Esper Cycle terpicu: kecepatan gerak dan serangannya turun. Efeknya memudar seiring waktu dan durasinya makin pendek bila diterapkan berulang.",
     "The target enters Remora for {0}s after triggering Esper Cycle, slowing their movement and attack speed. The effect decays over time, and will have a shorter duration if repeatedly applied."),
    ("创生", "blossom", "Blossom",
     "Memunculkan {0} Vita Bud di dekat target setelah Esper Cycle terpicu, yang mekar menjadi {1} Vita Pistil.\nVita Pistil lalu terbang ke target dalam jangkauan, meledak setiap {2} detik dan memberi DMG area.\nMaksimal {3} Vita Bud ada di lapangan sekaligus.",
     "Generates {0} Vita Bud near the target after triggering Esper Cycle, which blossoms {1} Vita Pistils.\nVita Pistils then fly toward targets within range, exploding every {2}s and dealing DMG to an area.\nUp to {3} Vita Buds can exist on the field at once."),
    ("覆纹", "hexed", "Hexed",
     "Memberi satu hit Follow-up Attack DMG tambahan pada target sebesar {1} dari Anima atau Incantation DMG yang diterimanya dalam {0} detik setelah Esper Cycle terpicu.",
     "Deals an additional instance of follow-up attack DMG to the target equal to {1} of Anima or Incantation DMG taken within {0}s after triggering Esper Cycle."),
    ("黯星", "nova", "Nova",
     "Menerapkan Nova pada target selama {0} detik setelah Esper Cycle terpicu. Saat efeknya berakhir, target menerima Mental Damage besar.",
     "Inflicts Nova on the target for {0}s after triggering Esper Cycle. When the effect ends, the target takes massive Mental Damage."),
    ("浊燃", "scorch", "Scorch",
     "Saat Esper Cycle terpicu, target terkena Scorch selama {0} detik dan menerima DoT.",
     "Upon triggering Esper Cycle, inflicts Scorch on the target for {0}s, dealing DoT."),
    ("浸染", "stain", "Stain",
     "Setelah Esper Cycle terpicu, Psyche dan Lakshana DMG yang diterima target naik {1} selama {0} detik.",
     "Increases the target's Psyche and Lakshana DMG taken by {1} for {0}s after triggering Esper Cycle."),
    ("盈蓄", "charge", "Charge",
     "Karakter yang sedang aktif mendapat {0} Ultimate Energy tambahan saat Vita Pistil mengenai target yang terkena Remora.",
     "Grants the active character {0} additional Ultimate Energy when Vita Pistils hit targets affected by Remora."),
    ("失谐", "discord", "Discord",
     "Mengurangi sebagian Break target saat target terkena Nova dan Scorch sekaligus.",
     "Deducts a percentage of the target's Break when they are simultaneously affected by Nova and Scorch."),
]
# Zero punya dua halaman (♀ dan ♂) dengan passive yang sama
TWINS = {"zero-1051": ["zero-1051", "zero-1046"]}


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    game = json.loads(src.read_text(encoding="utf-8"))["reactions"]
    by_zh = {r["name_zh"]: r for r in game.values()}
    espers = json.loads((D / "espers.json").read_text(encoding="utf-8"))
    en = json.loads((D / "en" / "espers.json").read_text(encoding="utf-8"))
    slug_of = {e["id"]: e["slug"] for e in espers}
    en_by = {e["slug"]: e for e in en}

    out = []
    for zh, key, name, tid, ten in TEXT:
        r = by_zh[zh]
        nums = re.findall(r"<NumGreen>([^<]*)</>", r["description_zh"])
        need = max([int(x) for x in re.findall(r"\{(\d+)\}", tid)] + [-1]) + 1
        assert len(nums) == need, f"{key}: game punya {len(nums)} angka, teks butuh {need}"
        assert need == max([int(x) for x in re.findall(r"\{(\d+)\}", ten)] + [-1]) + 1, f"{key}: ID dan EN beda jumlah angka"
        # anggota: urutan game, lalu karakter yang teks penguatannya ada di data situs tapi belum ada di data game
        slugs = []
        for a in r["character_abilities"]:
            sl = slug_of.get(a["CharacterID"])
            if not sl:
                print("lewati ID tak dikenal", a["CharacterID"])
                continue
            for s in TWINS.get(sl, [sl]):
                if s not in slugs:
                    slugs.append(s)
        marker = f"<b>{name} Enhancement</b>"
        for e in en:
            if any(s["group"] == "passive" and marker in s["desc"] for s in e["skills"]) and e["slug"] not in slugs:
                slugs.append(e["slug"])
        members = []
        for sl in slugs:
            skills = en_by[sl]["skills"]
            has = any(s["group"] == "passive" and marker in s["desc"] for s in skills)
            m = {"slug": sl}
            if not has:  # tanpa penanda: pakai passive pertama (GA_*_Passive_1)
                m["p"] = 0
            members.append(m)
        out.append({
            "key": key, "name": name, "zh": zh,
            "elements": [ELEMENT[x.split("_")[-1]] for x in r["elements"]],
            "nums": nums, "desc": {"id": tid, "en": ten}, "members": members,
        })
    (D / "cycles.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    for c in out:
        print(c["key"], c["elements"], c["nums"], [m["slug"] + ("*" if "p" in m else "") for m in c["members"]])


main()
