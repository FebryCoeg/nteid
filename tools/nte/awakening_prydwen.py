"""Urutan prioritas Awakening per karakter, dicatat dari halaman karakter Prydwen (bagian "Awakenings & Calcs").

Hanya nomor Awakening dan tanda urutan yang dicatat (ranking singkat), tanpa tulisan analisis atau persentasenya.
Tanda ">" = lebih penting, "=" atau "~" = sama penting. Awakening yang tidak disebut diberi peringkat kosong ("–").
Dibaca pada saat dibuat: 14 November 2026. Exe belum ada di sumber (karakter belum rilis).
"""
import re

PRYDWEN_SLUG = {"daffodill": "daffodil", "zero-1051": "zero", "zero-1046": "zero"}

ORDER = {
    "adler": "A1 = A6 > A3 > A5 > A4 > A2",
    "akane-rin": "A3 > A2 > A6 > A4 > A5 > A1",
    "aurelia": "A1 > A2 = A6 > A5 > A3 > A4",
    "baicang": "A1 > A6 > A2 > A3 > A5 = A4",
    "blackbird": "A1 > A4 > A5 > A6 > A3 > A2",
    "chaos": "A6 > A1 > A2 > A5 = A3 > A4",
    "chiz": "A2 > A4 > A1 = A5 > A3 = A6",
    "daffodill": "A5 > A3 > A4 > A6 > A1 > A2",
    "edgar": "A6 > A5 > A3 > A1 > A2 > A4",
    "elyms": "A4 > A1 > A3 > A5 > A2 > A6",
    "fadia": "A5 = A1 > A6 = A2 > A3 > A4",
    "haniel": "A2 = A6 > A5 > A1 > A3 > A4",
    "hathor": "A2 > A1 > A6 > A5 > A4 = A3",
    "hotori": "A6 = A3 > A1 = A5 > A2 = A4",
    "iroi": "A5 > A2 > A1 > A4",
    "jiuyuan": "A2 > A6 > A5 > A3 > A4 > A1",
    "lacrimosa": "A5 = A6 > A4 = A3 > A2 > A1",
    "linko": "A6 = A5 > A1 > A4 > A3 > A2",
    "mint": "A1 > A5 > A3 > A2 = A6 > A4",
    "nanally": "A1 > A5 = A3 > A4 > A6 > A2",
    "sakiri": "A4 > A5 > A1 > A2 > A3 > A6",
    "shinku": "A3 > A2 > A1 > A6 > A4 > A5",
    "skia": "A4 > A1 > A6 > A2 > A3 > A5",
    "zankou": "A5 > A2 > A1 > A4 > A6 > A3",
    "zero-1051": "A2 > A3 > A4 = A5",
    "zero-1046": "A2 > A3 > A4 = A5",
}

# catatan khusus dari sumber (diringkas)
NOTE = {
    "zankou": ("A6 lebih bernilai bila Zankou dipakai sebagai Main DPS, bukan sub DPS.", "A6 is worth more when Zankou is used as main DPS rather than sub DPS."),
    "iroi": ("Sisanya (A3 dan A6) hanya buff non-damage; ambil bila perlu.", "The rest (A3 and A6) are non-damage buffs; take them as needed."),
    "zero-1051": ("A1 dan A6 adalah dua Awakening terakhir; urutan keduanya tidak disebutkan.", "A1 and A6 are the last two; their relative order is not stated."),
    "zero-1046": ("A1 dan A6 adalah dua Awakening terakhir; urutan keduanya tidak disebutkan.", "A1 and A6 are the last two; their relative order is not stated."),
}


def parse(line):
    """'A1 = A6 > A3' -> ([[1, 6], [3]], {1: 1, 6: 1, 3: 2}) (peringkat padat; sama kuat berbagi nomor)."""
    groups, cur, prev_op = [], [], None
    tokens = re.findall(r"A(\d)|([>=~])", line)
    for num, op in tokens:
        if num:
            cur.append(int(num))
        elif op == ">":
            groups.append(cur)
            cur = []
    groups.append(cur)
    rank = {n: i + 1 for i, g in enumerate(groups) for n in g}
    return groups, rank


def source(slug):
    ps = PRYDWEN_SLUG.get(slug, slug)
    return {"title": "Awakening order of importance", "by": "Prydwen", "url": f"https://www.prydwen.gg/neverness-to-everness/characters/{ps}"}
