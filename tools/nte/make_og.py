"""Bikin gambar pratinjau link (Open Graph) 1200x630 -> nte/og-image.jpg

Latar: ilustrasi layar loading game (nte/img/home). Font memakai font sistem Windows.
Jalankan:  python tools/nte/make_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
W, H = 1200, 630
PINK, CREAM, INK = (255, 61, 134), (236, 230, 221), (18, 18, 20)
FONTS = Path("C:/Windows/Fonts")


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def main():
    bg = Image.open(ROOT / "nte/img/home/ui_yh_loading_image_005.webp").convert("RGB")
    s = max(W / bg.width, H / bg.height)
    bg = bg.resize((round(bg.width * s), round(bg.height * s)), Image.LANCZOS)
    bg = bg.crop(((bg.width - W) // 2, (bg.height - H) // 2, (bg.width - W) // 2 + W, (bg.height - H) // 2 + H))
    bg = ImageEnhance.Color(bg).enhance(1.05)

    # gradasi gelap dari kiri agar teks terbaca
    shade = Image.new("L", (W, H))
    px = shade.load()
    for x in range(W):
        a = int(235 * max(0.0, 1 - x / (W * 0.95)) ** 0.85 + 8)
        for y in range(H):
            px[x, y] = min(255, a)
    dark = Image.new("RGB", (W, H), (10, 10, 14))
    img = Image.composite(dark, bg, shade)

    # titik halftone halus
    dots = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(dots)
    for y in range(0, H, 14):
        for x in range(0, W, 14):
            d.ellipse((x, y, x + 2, y + 2), fill=(255, 255, 255, 14))
    img = Image.alpha_composite(img.convert("RGBA"), dots).convert("RGB")

    d = ImageDraw.Draw(img)

    # pita magenta di tepi kiri
    d.rectangle((0, 0, 14, H), fill=PINK)

    # label atas
    f_tag = font("segoeuib.ttf", 26)
    tag = "NTE INDONESIA  ·  FAN DATABASE"
    tw = d.textlength(tag, font=f_tag)
    d.rounded_rectangle((64, 58, 64 + tw + 44, 58 + 52), radius=26, fill=CREAM, outline=INK, width=4)
    d.text((86, 66), tag, font=f_tag, fill=INK)

    # judul besar dengan bayangan magenta
    f_big = font("ariblk.ttf", 150)
    for off, col in ((7, PINK), (0, CREAM)):
        d.text((60 + off, 138 + off), "HETHEREAU", font=f_big, fill=col)

    # subjudul
    d.text((66, 322), "Database Neverness to Everness", font=font("segoeuib.ttf", 44), fill=CREAM)
    d.text((66, 380), "Lengkap dalam Bahasa Indonesia", font=font("segoeui.ttf", 34), fill=(205, 198, 190))

    # kapsul kategori
    f_pill = font("segoeuib.ttf", 26)
    x, y = 66, 462
    for label in ("Esper", "Arc", "Modul", "Item", "Cerita", "Tier List"):
        w = d.textlength(label, font=f_pill) + 40
        d.rounded_rectangle((x, y, x + w, y + 50), radius=25, fill=CREAM, outline=INK, width=4)
        d.text((x + 20, y + 7), label, font=f_pill, fill=INK)
        x += w + 12

    # alamat
    d.text((66, 548), "nteid.site", font=font("segoeuib.ttf", 40), fill=PINK)

    out = ROOT / "nte" / "og-image.jpg"
    img.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    print(out, out.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
