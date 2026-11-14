import math
"""Buat nte/img/gacha/bg-fair.svg (latar pasar malam papan gacha, gambar vektor buatan sendiri).

  python tools/nte/make_gacha_bg.py
"""
from pathlib import Path

W, H = 1305, 615
OUT = Path(__file__).resolve().parents[2] / 'nte' / 'img' / 'gacha' / 'bg-fair.svg'

o = []
a = o.append
a(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" preserveAspectRatio="none">')
a('<defs>'
  '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2760"/><stop offset=".38" stop-color="#7d3a8c"/><stop offset=".72" stop-color="#e0666f"/><stop offset="1" stop-color="#f6b062"/></linearGradient>'
  '<pattern id="harl" width="46" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><path d="M23 0 46 23 23 46 0 23Z" fill="#000" opacity=".07"/></pattern>'
  '<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>'
  '<linearGradient id="coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd25f"/><stop offset="1" stop-color="#e08a12"/></linearGradient>'
  '</defs>')
a(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
a(f'<rect width="{W}" height="{H}" fill="url(#harl)"/>')

# bintang kecil di langit
import random
random.seed(7)
for _ in range(46):
    x, y, r = random.randint(8, W - 8), random.randint(6, 300), random.choice((1, 1.4, 1.8))
    a(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="{random.choice((.35, .5, .7))}"/>')

# siluet gedung jauh
a('<g fill="#1d1646" opacity=".55">')
x = 0
random.seed(3)
while x < W:
    w = random.randint(50, 110)
    h = random.randint(70, 190)
    a(f'<rect x="{x}" y="{H - h}" width="{w}" height="{h}"/>')
    x += w + random.randint(4, 16)
a('</g>')

# bunting (bendera segitiga) menggantung di atas
a('<path d="M0 26Q330 74 660 26T1305 26" fill="none" stroke="#2a1a4a" stroke-width="2.4"/>')
cols = ['#ff5a7a', '#ffc84e', '#5fcf8a', '#4aa3ff', '#d65be8']
for i in range(26):
    t = i / 25
    x = t * W
    y = 26 + math.sin(t * math.pi * 2) * 0 + 24 * math.sin(t * math.pi * 4) * (0.5) + 12
    y = 26 + 24 * (1 - abs(math.cos(t * math.pi * 2)))  # kurva sederhana di bawah tali
    a(f'<path d="M{x - 11:.1f} {y - 7:.1f}L{x + 11:.1f} {y - 7:.1f}L{x:.1f} {y + 18:.1f}Z" fill="{cols[i % 5]}" opacity=".92"/>')

# kincir raksasa di area kosong dalam jalur
cx, cy, R = 430, 320, 138
a(f'<circle cx="{cx}" cy="{cy}" r="{R + 40}" fill="url(#glow)"/>')
# kaki penyangga
a(f'<path d="M{cx} {cy}L{cx - 78} {cy + 160}M{cx} {cy}L{cx + 78} {cy + 160}" stroke="#ffb454" stroke-width="9" stroke-linecap="round"/>')
a(f'<path d="M{cx - 78} {cy + 160}H{cx + 78}" stroke="#ffb454" stroke-width="8" stroke-linecap="round"/>')
a(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#ffcf6b" stroke-width="7"/>')
a(f'<circle cx="{cx}" cy="{cy}" r="{R - 24}" fill="none" stroke="#ff9f43" stroke-width="3.5"/>')
for i in range(12):
    ang = i * math.pi / 6
    x2, y2 = cx + R * math.cos(ang), cy + R * math.sin(ang)
    a(f'<line x1="{cx}" y1="{cy}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#ffcf6b" stroke-width="3"/>')
gc = ['#ff5a7a', '#5fcf8a', '#4aa3ff', '#ffc84e']
for i in range(12):
    ang = i * math.pi / 6 + math.pi / 12
    x2, y2 = cx + R * math.cos(ang), cy + R * math.sin(ang)
    a(f'<g transform="translate({x2:.1f} {y2:.1f})"><line x1="0" y1="-2" x2="0" y2="8" stroke="#ffe9b8" stroke-width="2"/>'
      f'<rect x="-11" y="6" width="22" height="16" rx="5" fill="{gc[i % 4]}" stroke="#fff" stroke-width="2"/></g>')
a(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#ffd25f" stroke="#a35d0c" stroke-width="3"/>')
a(f'<polygon points="{cx},{cy - 9} {cx + 3},{cy - 3} {cx + 9},{cy - 3} {cx + 4},{cy + 1} {cx + 6},{cy + 8} {cx},{cy + 4} {cx - 6},{cy + 8} {cx - 4},{cy + 1} {cx - 9},{cy - 3} {cx - 3},{cy - 3}" fill="#fff"/>')

# balon udara
def balloon(x, y, s, c1, c2):
    a(f'<g transform="translate({x} {y}) scale({s})"><path d="M0 52 -10 78M0 52 10 78" stroke="#fff" stroke-width="1.6" opacity=".8"/>'
      f'<rect x="-9" y="76" width="18" height="12" rx="3" fill="#a56a2c" stroke="#fff" stroke-width="1.4"/>'
      f'<ellipse cx="0" cy="22" rx="34" ry="42" fill="{c1}" stroke="#fff" stroke-width="2"/>'
      f'<path d="M-12 -18Q-26 22 -12 60M12 -18Q26 22 12 60" fill="none" stroke="{c2}" stroke-width="7" opacity=".9"/>'
      f'<polygon points="0,6 4,16 15,16 6,22 9,33 0,27 -9,33 -6,22 -15,16 -4,16" fill="#ffe27a"/></g>')
balloon(1120, 90, 0.9, '#ff5a7a', '#ffc84e')
balloon(1230, 190, 0.7, '#4aa3ff', '#fff')
balloon(990, 150, 0.6, '#5fcf8a', '#ffc84e')
balloon(90, 140, 0.75, '#d65be8', '#ffc84e')

# koin bintang
def coin(x, y, r):
    a(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#coin)" stroke="#9c5a0e" stroke-width="{r * .14:.1f}"/>'
      f'<circle cx="{x}" cy="{y}" r="{r * .72:.1f}" fill="none" stroke="#fff3b0" stroke-width="{r * .08:.1f}" opacity=".8"/>')
    pts = []
    for k in range(10):
        rad = r * (.5 if k % 2 == 0 else .22)
        ang = -math.pi / 2 + k * math.pi / 5
        pts.append(f'{x + rad * math.cos(ang):.1f},{y + rad * math.sin(ang):.1f}')
    a(f'<polygon points="{" ".join(pts)}" fill="#fff3b0"/>')
for (x, y, r) in ((70, 520, 24), (128, 566, 17), (1235, 556, 22), (1180, 585, 15), (940, 40, 0), (640, 585, 20), (1010, 580, 14)):
    if r:
        coin(x, y, r)

# tenda bergaris di kiri bawah
a('<g transform="translate(40 330)"><path d="M0 120 60 40 120 120Z" fill="#fff" stroke="#9c3a63" stroke-width="3"/>'
  '<path d="M0 120 20 80 40 120M40 120 60 40 80 120M80 120 100 80 120 120" fill="#ff5a7a" opacity=".85"/>'
  '<rect x="22" y="120" width="76" height="48" fill="#ffe9b8" stroke="#9c3a63" stroke-width="3"/><rect x="48" y="132" width="24" height="36" rx="4" fill="#7d3a8c"/>'
  '<line x1="60" y1="40" x2="60" y2="14" stroke="#9c3a63" stroke-width="3"/><path d="M60 14 78 22 60 30Z" fill="#ffc84e"/></g>')

a('</svg>')
OUT.write_text(''.join(o), encoding='utf-8', newline='\n')
print('ok', OUT.stat().st_size)
