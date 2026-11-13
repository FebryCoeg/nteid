"""Gambar untuk halaman Versi & Patch -> nte/img/versi/*.webp

Dua sumber:
  1. Key visual resmi di nte.perfectworld.com (Elyms, Exe, tema versi 1.5, banner maintenance).
  2. Ilustrasi menu event dari data game (NTE_Assets) lewat build.py.
Jalankan:  python tools/nte/make_versi_images.py   (butuh internet; hasilnya sudah ada di repo)
"""
import io
import sys
import urllib.request
from pathlib import Path

sys.argv = [sys.argv[0], "--no-images"]
import build as B  # noqa: E402
from PIL import Image  # noqa: E402

OUT = B.ROOT / "nte" / "img" / "versi"
OFFICIAL = {  # nama -> url
    "elyms-kv": "https://nte.perfectworld.com/en/images/cover261111/slide2.jpg",
    "exe-kv": "https://nte.perfectworld.com/en/images/cover261111/slide3.jpg",
    "v15-kv": "https://nte.perfectworld.com/en/images/cover261111/slide6.jpg",
    "v15-maintenance": "https://ntevmg.perfectworld.com/webops/nte/104en.jpg",
}
GAME = {  # nama -> path di NTE_Assets
    "event-logistics": "UI/DeliveryCompany/LogisticsActivity/UI_YH_Kool_Activity_Rewards_Bkg.png",
    "event-tank": "UI/DeliveryCompany/Tanke/YH_Tanke_BG.png",
    "event-fishing": "UI/Activity/NetFish/UI_YH_Activity_Fishing_Bkg.png",
    "event-hunter": "UI/Activity/StrongPath/YH_UI_Hunter_Bg.png",
    "event-houdini": "UI/CloneSystem/Houdini/UI_YH_FB_Images01.png",
}


def save(im, name, width):
    im = im.convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{name}.webp"
    im.save(dst, "WEBP", quality=80, method=6)
    print(f"{name}: {im.size} {dst.stat().st_size // 1024} KB")


def main():
    cache = B.CACHE / "_official"
    cache.mkdir(parents=True, exist_ok=True)
    for name, url in OFFICIAL.items():
        f = cache / f"{name}{Path(url).suffix}"
        if not f.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            f.write_bytes(urllib.request.urlopen(req, timeout=60).read())
        save(Image.open(f), name, 1100)
    for name, rel in GAME.items():
        save(Image.open(io.BytesIO(B.fetch(rel, binary=True))), name, 900)


if __name__ == "__main__":
    main()
