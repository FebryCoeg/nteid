"""Buat ikon kotak papan gacha (SVG buatan sendiri, terinspirasi tampilan di game) ke nte/img/gacha/.

Setiap ikon: viewBox 64x64, alas kotak membulat bergradasi + sorot + tepi, lalu gambar di tengah.
Tidak ada gambar/aset game di dalamnya; semuanya bentuk vektor sederhana.

  python tools/nte/make_gacha_svg.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "nte" / "img" / "gacha"

HEAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'


def base(c1, c2, border, glow=None):
    g = f'<rect x="1" y="1" width="62" height="62" rx="17" fill="{glow}" opacity=".55"/>' if glow else ""
    return (
        f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>'
        '<linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'
        + g
        + '<rect x="4" y="6" width="56" height="56" rx="14" fill="#000" opacity=".28"/>'
        + f'<rect x="4" y="3" width="56" height="56" rx="14" fill="url(#g)" stroke="{border}" stroke-width="3"/>'
        + '<rect x="9" y="7" width="46" height="21" rx="10" fill="url(#h)"/>'
    )


def bag(body1, body2, handle, outline, clasp):
    return (
        f'<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{body1}"/><stop offset="1" stop-color="{body2}"/></linearGradient></defs>'
        f'<path d="M24 25v-4a8 8 0 0 1 16 0v4" fill="none" stroke="{handle}" stroke-width="3.4" stroke-linecap="round"/>'
        f'<rect x="14" y="24" width="36" height="27" rx="7" fill="url(#b)" stroke="{outline}" stroke-width="2.2"/>'
        f'<path d="M16 33h32" stroke="{outline}" stroke-width="1.6" opacity=".45"/>'
        f'<rect x="28" y="31" width="8" height="11" rx="3" fill="{clasp}" stroke="{outline}" stroke-width="1.4"/>'
    )


ROOK = (
    '<path d="M19 20h6v5h4v-5h6v5h4v-5h6v11H19z" fill="#fff" stroke="#7fb8f5" stroke-width="1.6" stroke-linejoin="round"/>'
    '<rect x="22" y="30" width="20" height="14" fill="#fff" stroke="#7fb8f5" stroke-width="1.6"/>'
    '<rect x="18" y="43" width="28" height="7" rx="2.5" fill="#fff" stroke="#7fb8f5" stroke-width="1.6"/>'
)


def badge(color, letter, dark):
    return (
        f'<circle cx="31" cy="31" r="17" fill="#fff"/><circle cx="31" cy="31" r="14" fill="{color}"/>'
        '<circle cx="26" cy="28" r="2.4" fill="#fff"/><circle cx="36" cy="28" r="2.4" fill="#fff"/>'
        '<path d="M25 35q6 6 12 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
        f'<circle cx="47" cy="47" r="8" fill="{dark}" stroke="#fff" stroke-width="2"/>'
        f'<text x="47" y="51" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="11" fill="#fff">{letter}</text>'
    )


ARCLIGHT = (
    '<circle cx="32" cy="32" r="17" fill="#1b1b24" stroke="#fff" stroke-width="2.4"/>'
    '<circle cx="32" cy="32" r="11" fill="none" stroke="#ffffff33" stroke-width="2"/>'
    '<text x="32" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="24" fill="#fff">?</text>'
)

GLIDER = (
    '<path d="M10 38 32 17 54 38 32 31Z" fill="#fff" stroke="#e7a3d6" stroke-width="1.8" stroke-linejoin="round"/>'
    '<path d="M32 31v17" stroke="#e7a3d6" stroke-width="2.4" stroke-linecap="round"/>'
    '<circle cx="32" cy="50" r="3.4" fill="#fff" stroke="#e7a3d6" stroke-width="1.6"/>'
)


def die(pip, edge):
    pips = "".join(f'<circle cx="{x}" cy="{y}" r="2.8" fill="{pip}"/>' for x, y in ((25, 25), (39, 25), (32, 32), (25, 39), (39, 39)))
    return f'<rect x="17" y="17" width="30" height="30" rx="7" fill="#fff" stroke="{edge}" stroke-width="2"/>' + pips


SHIRT = (
    '<path d="M18 26l9-8c1.5 3 3 4 5 4s3.500-1 5-4l9 8-5 7-4-3v17H27V30l-4 3z" fill="#fff" stroke="#e2a24a" stroke-width="1.8" stroke-linejoin="round"/>'
    '<rect x="29" y="34" width="6" height="4" rx="1" fill="#e2a24a"/>'
)

CAR = (
    '<path d="M21 33l4-9h14l4 9z" fill="#8e6cf2" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>'
    '<path d="M26 31l2.500-5h8l2.500 5z" fill="#d6e4ff"/>'
    '<rect x="15" y="32" width="34" height="11" rx="5" fill="#8e6cf2" stroke="#fff" stroke-width="1.8"/>'
    '<circle cx="24" cy="44" r="4.800" fill="#25252d" stroke="#fff" stroke-width="1.6"/><circle cx="40" cy="44" r="4.800" fill="#25252d" stroke="#fff" stroke-width="1.6"/>'
    '<rect x="44" y="35" width="4" height="3" rx="1" fill="#ffe27a"/>'
)

ARROW = '<path d="M13 26h19v-9l19 15-19 15v-9H13z" fill="#fff" stroke="#c79a00" stroke-width="2.4" stroke-linejoin="round"/>'

ICONS = {
    "hero": (base("#ffc24d", "#e8890c", "#b9650b"), bag("#fff4d6", "#f1c46f", "#fff4d6", "#b9650b", "#e8890c")),
    "apprentice": (base("#c85cea", "#7e30c0", "#e04ad6"), bag("#6a37b0", "#4a2182", "#e9c8ff", "#2e1458", "#e9c8ff")),
    "lost": (base("#4aa3f5", "#1f63c2", "#cfe8ff"), ROOK),
    "journeyS": (base("#ffc84e", "#f07a0a", "#ffe08a", "#ffb21a"), badge("#f58a1f", "S", "#d4580a")),
    "journeyA": (base("#d65be8", "#a02fc2", "#f08aff"), badge("#b24bd8", "A", "#7a2a9e")),
    "arclight": (base("#e24fb5", "#a3257f", "#ff8ad8"), ARCLIGHT),
    "fashion": (base("#ec7ccb", "#b83a97", "#ffb0e6"), GLIDER),
    "roll1": (base("#ffd3ee", "#f070b8", "#ff8ad8"), die("#c0267f", "#e07cc0")),
    "roll5": (base("#ffc24d", "#e8890c", "#b9650b"), die("#d6700a", "#e0a548")),
    "outfit": (base("#ffd25f", "#e9971b", "#fff3c4", "#ffe08a"), SHIRT),
    "livery": (base("#ffd25f", "#e9971b", "#fff3c4", "#ffe08a"), CAR),
}

SLUMBER = (
    '<rect x="29" y="30" width="6" height="30" rx="2" fill="#a56a2c"/>'
    '<rect x="8" y="6" width="48" height="26" rx="6" fill="#f6cd82" stroke="#a56a2c" stroke-width="3"/>'
    '<text x="32" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="19" fill="#9a2f7a">Zz</text>'
)


def write(name, body):
    (OUT / name).write_text(HEAD + body + "</svg>\n", encoding="utf-8", newline="\n")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for k, (b, ic) in ICONS.items():
        write(f"tile-{k}.svg", b + ic)
    # panah: arah kanan; arah kiri lewat CSS (scaleX(-1))
    for k in ("arrowIn", "arrowOut"):
        write(f"tile-{k}.svg", base("#fff3b0", "#f5d33c", "#c79a00") + ARROW)
    write("tile-slumber.svg", SLUMBER)
    print("tulis", len(ICONS) + 3, "ikon ke", OUT)


if __name__ == "__main__":
    main()
