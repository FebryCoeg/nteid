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


# Tangkapan layar dari siaran resmi "NTE Version 1.5 Preview Special Program" (kanal NTE Global).
# Frame 1920x1080 diambil dari pemutar lalu disimpan di .cache/_video/frames/s_<nama>.jpg.
VIDEO = {
    # nama berkas: (frame, potong bagian bawah dalam piksel dari 720, lebar keluaran)
    "vid-android": ("s_android", 0), "vid-dawn": ("s_dawn", 0), "vid-offline": ("s_offline", 0),
    "vid-forsaken": ("s_forsaken", 0), "vid-arc-echo": ("s_echoprog", 0), "vid-arc-enc": ("s_encprog", 0),
    "vid-calendar": ("s_calendar", 52), "vid-fortune": ("s_fortune", 0), "vid-amber": ("s_amber", 0),
    "vid-logistics": ("s_logistics", 0), "vid-tycoon": ("s_tycoon", 0), "vid-tank": ("s_tank", 0),
    "vid-fishing": ("s_fishing", 0), "vid-lucky": ("s_lucky", 0), "vid-pixel": ("s_pixel", 0),
    "vid-gold": ("s_gold", 0), "vid-invalid": ("s_invalid", 0), "vid-overlord": ("s_landoverlord", 0),
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
    frames = B.CACHE / "_video" / "frames"
    for name, (frame, crop_bottom) in VIDEO.items():
        f = frames / f"{frame}.jpg"
        if not f.exists():
            print("lewati (frame belum ada):", name)
            continue
        im = Image.open(f)
        if crop_bottom:
            im = im.crop((0, 0, im.width, im.height - round(crop_bottom * im.height / 720)))
        save(im, name, 1000)
    for name, rel in GAME.items():
        save(Image.open(io.BytesIO(B.fetch(rel, binary=True))), name, 900)


if __name__ == "__main__":
    main()
