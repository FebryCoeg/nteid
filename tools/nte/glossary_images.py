"""Gambar untuk halaman Istilah.

Game tidak punya gambar per istilah, jadi dipakai dua lapis:
  1. SPESIFIK: istilah yang punya padanan gambar asli di game (path relatif ke nte/).
  2. KELOMPOK: sisanya memakai ikon seragam sesuai kelompok (awalan id istilah).

Dipakai oleh build_extra.py dan bisa dijalankan langsung untuk menerapkan ke
nte/data/glossary.json:  python tools/nte/glossary_images.py
"""
import json
from pathlib import Path

SPECIFIC = {
    "1_1": "img/anomaly/ui_yh_archive_fileimages_44.webp",    # Anomaly
    "1_2": "img/esper-art/yh_lihui_fashionshop_kaesi.webp",     # Esper
    "1_12": "img/monster/boss_04.webp",                         # Anomalous Realm
    "1_13": "img/esper-art/yh_lihui_fashionshop_lingke.webp",   # Esper Ability
    "1_15": "img/esper-art/yh_lihui_fashionshop_yiluoyi.webp",  # Anomaly Hunter
    "1_17": "img/home/ui_yh_loading_image_005.webp",            # Hethereau
    "1_18": "img/home/ui_yh_loading_image_014.webp",            # New Helios
    "1_19": "img/item/yh_ui_titlesystem_bagel2_icon.webp",      # Bagel
    "1_27": "img/anomaly/ui_yh_archive_fileimages_30.webp",     # Surge Anomaly
    "1_28": "img/anomaly/ui_yh_archive_fileimages_41.webp",     # Derivative Anomaly
    "1_30": "img/anomaly/ui_yh_archive_fileimages_76.webp",     # Rule Anomaly
    "3_1": "img/esper-art/1024_fashion_1074_0.webp",            # Esper Types
    "3_2": "img/arc-card/image_fork_bitgame.webp",              # Arc
    "3_3": "img/awaken/1090_1.webp",                            # Console
}
GROUP = {
    "1": ("img/glossary/konsep.svg", "Konsep"),
    "2": ("img/glossary/organisasi.svg", "Organisasi"),
    "3": ("img/glossary/sistem.svg", "Sistem"),
    "4": ("img/glossary/teori.svg", "Teori"),
}


def attach(items):
    for x in items:
        grp = x["id"].split("_")[0]
        x["group"] = grp
        if x["id"] in SPECIFIC:
            x["image"] = SPECIFIC[x["id"]]
            x.pop("icon", None)
        else:
            x["icon"] = GROUP.get(grp, GROUP["1"])[0]
            x.pop("image", None)
    return items


if __name__ == "__main__":
    p = Path(__file__).resolve().parents[2] / "nte" / "data" / "glossary.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    attach(data)
    for x in data:
        for k in ("image", "icon"):
            if k in x:
                assert (p.parents[1] / x[k]).exists(), x[k]
    p.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(data), "istilah,", sum(1 for x in data if "image" in x), "bergambar spesifik")
