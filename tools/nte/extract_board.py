"""Bangun nte/data/gacha-board.json (papan gacha Scarborough Fair) dari screenshot peta di game.

Cara kerja:
  1. Deteksi otomatis kotak oranye/ungu/biru lewat warna tepinya (komponen terhubung) sebagai PEMERIKSA.
  2. Jenis kotak dan urutan rute disalin dari pembacaan peta secara manual (tabel di bawah), karena ikon khusus
     (S/A, dadu, Arc-light, Fashion, Livery, Outfit) tidak bisa dibedakan hanya dari warna.
  3. Tiap kotak manual dicek terhadap hasil deteksi (selisih posisi <= 14 piksel dan warna tepi sesuai jenis);
     ketidakcocokan dicetak supaya diperbaiki.
  4. Tulis JSON dan gambar periksa (nomor id di tiap kotak) ke folder sementara.

Pemakaian:
  python tools/nte/extract_board.py PETA.webp [folder_gambar_periksa]

PETA = screenshot layar "Board Tile Guide" 1920x1080 (area peta x 545-1850, y 235-850).
Screenshot tidak ikut repo; hanya JSON hasilnya.
"""
import colorsys
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "nte" / "data" / "gacha-board.json"
AREA = (545, 235, 1850, 850)

# jenis -> warna tepi yang diharapkan (1 oranye, 2 ungu/magenta, 3 biru)
EXPECT = {
    "hero": 1, "apprentice": 2, "lost": 3, "journeyA": 2, "journeyS": 1, "arclight": 2, "fashion": 2,
    "roll1": 2, "roll5": 1, "outfit": 1, "livery": 1,
}

# (x, y, jenis, opsi). Posisi = pusat kotak di screenshot 1920x1080.
# Rute utama, searah jarum jam mulai dari kiri atas. "ai"/"ao" = panah masuk/keluar (tidak tergambar di peta ringkas,
# posisi perkiraan di sisi kolom, sejajar dengan kotak rute di sebelahnya; confirmed.arrows = false).
ROUTE = [
    (793, 346, "lost", {"amount": 30}), (844, 345, "apprentice"), (896, 345, "apprentice"), (947, 346, "hero"),
    (998, 347, "roll1", {"slumber": True}), (1049, 345, "apprentice"), (1100, 347, "arclight"), (1153, 346, "lost", {"amount": 30}),
    (1153, 396, "apprentice"), (1153, 448, "hero"), (1153, 499, "journeyA"),
    (1204, 499, "apprentice"), (1255, 500, "fashion"), (1306, 499, "apprentice"),
    (1306, 447, "apprentice"), (1306, 397, "hero"), (1306, 344, "apprentice"),
    (1357, 344, "apprentice"), (1408, 347, "lost"), (1460, 346, "journeyA"),
    (1460, 396, "apprentice"), (1460, 448, "hero"), (1460, 499, "apprentice"),
    (1512, 499, "apprentice"), (1563, 500, "lost", {"amount": 50}),
    (1563, 549, "apprentice"), (1607, 549, "arrowIn", {"block": "right"}),
    (1563, 601, "journeyA"), (1563, 653, "hero"), (1607, 653, "arrowOut", {"block": "right"}),
    (1563, 704, "apprentice"), (1563, 755, "apprentice"), (1563, 807, "lost"),
    (1512, 807, "arclight", {"slumber": True}), (1460, 806, "apprentice"), (1408, 807, "hero"), (1357, 806, "apprentice"), (1306, 806, "apprentice"),
    (1306, 756, "lost"),
    (1254, 755, "apprentice"), (1202, 755, "journeyA"), (1153, 756, "hero"), (1100, 755, "apprentice"), (1050, 755, "apprentice"), (998, 756, "lost"),
    (998, 704, "apprentice"),
    (947, 704, "apprentice"), (895, 705, "hero"), (845, 704, "journeyA"), (793, 704, "apprentice"),
    (793, 654, "lost", {"amount": 30}), (793, 602, "apprentice"), (793, 552, "lost", {"amount": 50}), (793, 500, "hero"),
    (751, 447, "arrowIn", {"block": "left"}),
    (793, 447, "apprentice"), (793, 397, "journeyA"),
    (751, 346, "arrowOut", {"block": "left"}),
]

# Blok ujung, urutan jalan searah jarum jam dari kotak pertama yang dimasuki.
BLOCK_RIGHT = [
    (1650, 548, "journeyS"), (1699, 549, "livery"), (1747, 549, "hero"), (1803, 549, "apprentice"),
    (1803, 602, "hero"),
    (1803, 653, "apprentice"), (1747, 653, "hero"), (1699, 653, "apprentice"), (1650, 653, "hero"),
]
BLOCK_LEFT = [
    (707, 448, "hero"), (656, 448, "outfit"), (605, 449, "roll5", {"amount": 5}),
    (605, 397, "hero"), (605, 346, "hero"), (605, 294, "hero"), (656, 294, "hero"), (707, 295, "hero"), (707, 346, "hero"),
]


def cat(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if 28 < h < 48 and s > 0.55 and v > 0.75:
        return 1
    if 270 < h < 325 and s > 0.35 and v > 0.45:
        return 2
    if 195 < h < 225 and s > 0.55 and v > 0.6:
        return 3
    return 0


def detect(im):
    x0, y0, x1, y1 = AREA
    W, H = x1 - x0, y1 - y0
    px = im.load()
    grid = [[cat(*px[x0 + x, y0 + y]) for x in range(W)] for y in range(H)]
    seen = [[False] * W for _ in range(H)]
    found = []
    for y in range(H):
        for x in range(W):
            c = grid[y][x]
            if c and not seen[y][x]:
                stack, pts = [(x, y)], []
                seen[y][x] = True
                while stack:
                    cx, cy = stack.pop()
                    pts.append((cx, cy))
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < W and 0 <= ny < H and not seen[ny][nx] and grid[ny][nx] == c:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
                if 500 <= len(pts) <= 4500:
                    found.append((c, sum(p[0] for p in pts) / len(pts) + x0, sum(p[1] for p in pts) / len(pts) + y0))
    return found


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    im = Image.open(sys.argv[1]).convert("RGB")
    outdir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")
    found = detect(im)

    tiles, route, nid = [], [], 0

    def add(row):
        nonlocal nid
        x, y, t = row[0], row[1], row[2]
        o = row[3] if len(row) > 3 else {}
        tile = {"id": nid, "x": x, "y": y, "type": t}
        tile.update({k: v for k, v in o.items() if k != "block"})
        tiles.append(tile)
        nid += 1
        return tile["id"]

    arrows = {"right": {}, "left": {}}
    for row in ROUTE:
        i = add(row)
        route.append(i)
        if row[2] in ("arrowIn", "arrowOut"):
            arrows[row[3]["block"]]["enter" if row[2] == "arrowIn" else "exit"] = i
    blocks = []
    for side, rows in (("right", BLOCK_RIGHT), ("left", BLOCK_LEFT)):
        ids = [add(r) for r in rows]
        blocks.append({"side": side, "enter": arrows[side]["enter"], "exit": arrows[side]["exit"], "tiles": ids})

    # pemeriksa terhadap deteksi warna
    bad = 0
    for t in tiles:
        want = EXPECT.get(t["type"])
        if want is None:
            continue
        near = [f for f in found if abs(f[1] - t["x"]) <= 14 and abs(f[2] - t["y"]) <= 14]
        if not near or near[0][0] != want:
            bad += 1
            print("periksa:", t["id"], t["type"], (t["x"], t["y"]), "terdeteksi:", [(f[0], round(f[1]), round(f[2])) for f in near])
    print(f"{len(tiles)} kotak, {len(route)} di rute, {bad} tak cocok dengan deteksi warna")

    board = {
        "name": "Scarborough Fair",
        "source": "Peta 'Board Tile Guide' di game, dibaca dari screenshot pemilik situs 2026-11-15",
        "width": 1920, "height": 1080, "area": list(AREA),
        "start": route[0],
        # keputusan dari tes peluang mendarat (tools/nte/board_stats.js): bidak yang mendarat tepat di panah masuk berhenti
        # di kotak pertama blok dan roll berikutnya berjalan di dalam blok; peluang S per roll mengikuti angka resmi
        # (papan Modified belum diketahui susunannya).
        "blockRule": "enterFirst",
        "sMode": "calibrated",
        "tiles": tiles, "route": route, "blocks": blocks,
        "confirmed": {"arrows": False, "modifiedLayout": False, "lostAmounts": False},
    }
    OUT.write_text(json.dumps(board, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")

    ov = im.copy()
    d = ImageDraw.Draw(ov)
    for t in tiles:
        d.rectangle((t["x"] - 22, t["y"] - 22, t["x"] + 22, t["y"] + 22), outline=(0, 255, 0), width=2)
        d.text((t["x"] - 14, t["y"] - 18), str(t["id"]), fill=(255, 255, 255))
        d.text((t["x"] - 14, t["y"] - 4), t["type"][:6], fill=(255, 255, 0))
    ov.crop(AREA).save(outdir / "board-check.png")
    print("tulis", OUT)


if __name__ == "__main__":
    main()
