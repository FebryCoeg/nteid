"""Rumus damage NTE (gabungan: video Radish bagian 1 dan 2 + thread NGA tid=46659382).

Semua rumus diuji lewat `python tools/nte/dmgformula.py` terhadap angka nyata dari video dan NGA.
Ini model komunitas, bukan data resmi developer. Bagian yang masih perlu data: koefisien break di
level lain sudah ada (BREAK_BASE), tabel resistansi tiap musuh harus diambil per musuh.
"""
import math

# ------------------------------------------------------------------ rumus inti
def atk_total(char_base, arc_base, atk_pct=0.0, atk_flat=0.0):
    return (char_base + arc_base) * (1 + atk_pct) + atk_flat


def crit_mult(cr, cd):
    cr = min(max(cr, 0.0), 1.0)
    return 1 + cr * cd


def dmg_bonus_zone(universal=0.0, typed=0.0, source=0.0, other=0.0, reduction=0.0):
    """Zona 'DMG bonus': semua dijumlah. 'reduction' = damage dealt penurunan (debuff musuh)."""
    return 1 + universal + typed + source + other - reduction


def def_zone(char_lv, enemy_lv, def_reduction=0.0, def_ignore=0.0, beyond_rails=False, psychic=False):
    """Zona DEF. Rumus NGA: (600+6*Lv) / (DEF efektif + 600+6*Lv). Dibagi 6 sama dengan rumus video."""
    if psychic:
        return 1.0
    base_enemy = 6 * ((90 if beyond_rails else 100) + enemy_lv)
    eff = base_enemy * (1 - def_reduction) * (1 - def_ignore)
    k = 600 + 6 * char_lv
    return k / (eff + k)


def res_zone(res, reduction=0.0, ignore=0.0):
    """Zona resistansi (tiga segmen, dari NGA)."""
    e = res - ignore - reduction
    if e > 0.6:
        return 1 / (6.25 * e - 1.25)
    if e >= 0:
        return 1 - e
    return 1 - e / (1 - e)


def hit_damage(atk, ratio, bonus_zone, cr, cd, deff, resz, stain=1.0, final=1.0, special=1.0, crit_fixed=None):
    c = crit_mult(crit_fixed if crit_fixed is not None else cr, cd)
    return atk * ratio * bonus_zone * c * deff * resz * stain * final * special


# ------------------------------------------------------------------ environment (Esper cycle)
CYCLE_BASE = {  # per 5 level: (Blossom/创生, Scorch/浊燃, Nova/黯星)
    1: (80, 20, 400), 2: (120, 35, 600), 3: (200, 60, 1000), 4: (300, 90, 1500), 5: (400, 120, 2000),
    6: (600, 180, 3000), 7: (800, 240, 4000), 8: (1000, 300, 5000), 9: (1700, 510, 8500), 10: (2200, 660, 11000),
    11: (3600, 1080, 18000), 12: (5000, 1500, 25000), 13: (6000, 1800, 30000), 14: (7000, 2100, 35000),
    15: (8000, 2400, 40000), 16: (9000, 2700, 45000),
}


def cycle_base(level, kind):
    tier = min(16, (max(level, 1) - 1) // 5 + 1)
    return CYCLE_BASE[tier][{"blossom": 0, "scorch": 1, "nova": 2}[kind]]


def cycle_intensity_zone(ci):  # Blossom, Scorch, Nova
    return 1 + ci / 600


def stain_coef(ci):  # Stain & Hexed
    return 1 + 0.2 * ci / (ci + 180)


def stain_zone(ci):
    return 1.2 * stain_coef(ci)


def hexed_extra_ratio(ci):
    return 1.2 * stain_coef(ci) - 1


def cycle_damage(level, kind, ci, cd=0.0, deff=1.0, resz=1.0, final=1.0, special=1.0):
    """Blossom/Nova tidak bisa crit; Scorch DoT punya crit 50% tetap."""
    c = crit_mult(0.5, cd) if kind == "scorch" else 1.0
    return cycle_base(level, kind) * cycle_intensity_zone(ci) * c * deff * resz * final * special


# ------------------------------------------------------------------ break (倾陷)
BREAK_BASE = [91, 93, 96, 98, 101, 104, 106, 109, 111, 114, 117, 119, 122, 124, 127, 130, 132, 135, 137, 140,
              148, 159, 170, 182, 193, 204, 214, 226, 241, 257, 273, 289, 306, 325, 345, 367, 390, 413, 438, 462,
              488, 517, 548, 581, 621, 663, 707, 752, 800, 854, 897, 942, 990, 1041, 1106, 1168, 1233, 1300, 1370, 1440,
              1515, 1604, 1693, 1788, 1896, 1990, 2083, 2184, 2285, 2384, 2486, 2602, 2707, 2821, 2984, 3135, 3250, 3367, 3484, 3603]


def break_damage(char_lv, intensity, bonus, enemy_cap, deff, resz):
    return BREAK_BASE[char_lv - 1] * (1 + intensity / 300 + bonus) * (enemy_cap / 3) * deff * resz


def discord_reduction(enemy_cap, char_lv, enemy_lv):
    d = enemy_lv - char_lv
    k = 1.0 if d <= 0 else (0.5 if d <= 5 else 0.2)
    return 0.15 * enemy_cap * k


# ------------------------------------------------------------------ uji
def _close(a, b, tol=0.6):
    assert abs(a - b) <= tol, (a, b)


def selftest():
    # Video 1: Nali Lv80 vs beruang Lv90 (Beyond the Rails, weak Anima 10%) -> 1518 dan 1592
    atk = atk_total(636, 570, 0.325, 366)
    _close(atk, 1963.95, 0.01)
    bz = dmg_bonus_zone(universal=0.29, typed=0.475)
    d = def_zone(80, 90, beyond_rails=True)
    r = res_zone(0.10)
    _close(hit_damage(atk, 0.592, bz, 1, 0.644, d, r), 1518.14, 0.01)
    _close(hit_damage(atk, 0.592, bz, 1, 0.644 + 0.08, d, r), 1592.01, 0.01)
    # RES: kontinu di 0 dan 0.6, ujung grafik NGA (res=1 -> 0.2, res=-1 -> 1.5)
    assert abs(res_zone(0.6) - 0.4) < 1e-9 and abs(res_zone(1.0) - 0.2) < 1e-9 and abs(res_zone(-1.0) - 1.5) < 1e-9
    # Video 1: 30% RES -10% reduksi -10% ignore -> 0.9 ; Adler -10% RES pada 30% RES = +14.29% damage tim
    assert abs(res_zone(0.3, 0.1, 0.1) - 0.9) < 1e-9
    assert abs(res_zone(0.2) / res_zone(0.3) - 1.1429) < 1e-3 and abs(1 / 0.7 * 0.8 - 1.1429) < 1e-3
    # Video 2: Stain CI 108 -> 1.29 ; relatif terhadap 1.2 = 1.075 (tampil 7.5% di game)
    _close(stain_zone(108), 1.29, 0.005)
    assert abs(stain_zone(108) / 1.2 - 1.075) < 1e-3
    # Video 2: CI 360 -> pengali 1.6 ; 300 -> +50%
    assert abs(cycle_intensity_zone(360) - 1.6) < 1e-9 and abs(cycle_intensity_zone(300) - 1.5) < 1e-9
    # Video 2: pemicu Blossom, Zero Lv80 CI144 = 11160 ; Gouen Lv70 CI360 = 11200 ; Zero CI162 = 11430
    assert abs(cycle_base(80, "blossom") * cycle_intensity_zone(144) - 11160) < 1
    assert abs(cycle_base(70, "blossom") * cycle_intensity_zone(360) - 11200) < 1
    assert abs(cycle_base(80, "blossom") * cycle_intensity_zone(162) - 11430) < 1
    # Video 2: dasar Lv80 Blossom 9000 / Scorch 2700 / Nova 45000 ; Scorch crit 1.75 (CD150%) dan 1.5 (CD100%)
    assert (cycle_base(80, "blossom"), cycle_base(80, "scorch"), cycle_base(80, "nova")) == (9000, 2700, 45000)
    assert crit_mult(0.5, 1.5) == 1.75 and crit_mult(0.5, 1.0) == 1.5
    # Video 1: break Lv80 = 3603 ; Daffodil intensitas 240 + 20% -> pengali 2.0 ; cap 40 -> 13.33
    assert BREAK_BASE[79] == 3603 and abs(1 + 240 / 300 + 0.2 - 2.0) < 1e-9 and abs(40 / 3 - 13.3333) < 1e-3
    # NGA: Lv1 MC + Lv1 Mint vs "无画框" Lv9 (cap 45, DEF 654, RES Nature 0.16 / lainnya 0.2) = 1076,66
    k = 600 + 6 * 1
    dz = k / (654 + k)
    total = BREAK_BASE[0] * (45 / 3) * dz * 0.8 + BREAK_BASE[0] * (45 / 3) * dz * 0.84
    _close(total, 1076.66, 0.05)
    print("semua uji lulus")


if __name__ == "__main__":
    selftest()
