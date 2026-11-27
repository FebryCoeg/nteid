"""Buat nte/data/city.json dan ikon WebP untuk halaman "Penuhi Seluruh Kota" (mode 铺满全城, 异环 1.5).

Angka dan teks asli diambil dari data yang disimpan di cache (kalkulator ntetools.com/puman, pembuat: B站@莫凡的退休生活,
yang bersumber dari katalog item mode tersebut). Terjemahan ada di tools/nte/city_text.json.

Pemakaian: python tools/nte/make_city.py <folder-cache>   (berisi data/*.json dan img/)
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

THEMES = {"food": ("Kuliner", "Dining"), "fun": ("Hiburan", "Entertainment"), "shop": ("Belanja", "Retail"),
          "green": ("Alam", "Nature"), "traffic": ("Transportasi", "Transit"), "special": ("Khusus", "Special"), "all": ("Umum", "General")}
RARITY = {"普通": "common", "稀有": "rare", "史诗": "epic"}


def main():
    src = Path(sys.argv[1])
    load = lambda n: json.loads((src / "data" / f"{n}.json").read_text(encoding="utf-8"))
    text = json.loads((ROOT / "tools/nte/city_text.json").read_text(encoding="utf-8"))
    themes, buildings, cards = load("themes"), load("buildings"), load("cards")
    out_img = ROOT / "nte/img/city"
    out_img.mkdir(parents=True, exist_ok=True)

    def icon(src_name, out_name, size):
        if not re.fullmatch(r"[\w\-]+\.(png|webp|jpg)", src_name):
            raise SystemExit(f"nama ikon tidak wajar: {src_name}")
        p = src / "img" / src_name
        if not p.exists():
            return ""
        im = Image.open(p).convert("RGBA")
        im.thumbnail((size, size))
        im.save(out_img / f"{out_name}.webp", "WEBP", quality=88, method=6)
        return f"img/city/{out_name}.webp"

    bs = []
    for b in buildings:
        name, pid, pen = text["buildings"][b["id"]]
        bs.append({"id": b["id"], "name": name, "zh": b["name"], "theme": b["theme"], "rarity": RARITY[b["rarity"]], "price": b["price"],
                   "w": b["w"], "h": b["h"], "cap": b["cap"], "conv": b["conv"], "fx": b["fx"],
                   "icon": icon(b["icon"], "b-" + b["id"].lower(), 160), "passive": {"id": pid, "en": pen}})
    cs = []
    for c in cards:
        name, did, den = text["cards"][c["code"]]
        cs.append({"num": c["num"], "code": c["code"], "name": name, "zh": c["name"], "theme": c["themeKey"], "rarity": RARITY[c["rarity"]],
                   "price": c["price"], "icon": icon(c["icon"], "c-" + c["code"].lower(), 96), "desc": {"id": did, "en": den}})
    data = {
        "source": {"name": "ntetools.com · 铺满全城计算器", "author": "B站@莫凡的退休生活", "url": "https://ntetools.com/puman/index.html", "checked": "2026-11-27"},
        "themes": {k: {"id": v[0], "en": v[1], "color": themes.get(k, {}).get("color", "#b9c3d0")} for k, v in THEMES.items()},
        "buildings": bs, "cards": cs,
        "bossBlinds": [{"code": c, "limit": l, "name": n, "desc": {"id": i, "en": e}} for c, l, n, i, e in text["bossBlinds"]],
    }
    (ROOT / "nte/data/city.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    size = sum(f.stat().st_size for f in out_img.iterdir())
    print(f"{len(bs)} bangunan, {len(cs)} kartu, {len(list(out_img.iterdir()))} ikon ({size // 1024} KB)")
    print("tanpa ikon:", [x.get("id") or x["code"] for x in bs + cs if not x["icon"]])


main()
