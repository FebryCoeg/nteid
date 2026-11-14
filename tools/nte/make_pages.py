"""Buat halaman statis per rute, sitemap.xml, dan robots.txt supaya mesin pencari bisa mengindeks situs.

GitHub Pages membalas rute yang tidak punya file dengan status 404 (lalu menampilkan 404.html), jadi alamat seperti
/esper/elyms terlihat "tidak ditemukan" bagi Google walaupun aplikasinya tetap jalan. Skrip ini menyalin index.html
ke <rute>/index.html untuk tiap halaman, dengan <title>, deskripsi, canonical, dan Open Graph yang sesuai halamannya,
sehingga server membalas 200. Aplikasi (SPA) tetap memuat dan menggambar isi halaman seperti biasa.

Pemakaian:
  python tools/nte/make_pages.py            # buat ulang semua halaman dari index.html
  python tools/nte/make_pages.py --bump     # naikkan nomor ?v=NN di index.html lebih dulu (setelah mengubah app.js/app.css/data)

Jalankan setiap selesai mengubah index.html, app.js, app.css, atau data.
"""
import html
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / "nte" / "data"
SITE = "https://nteid.site"
NAME = "Arsip Hethereau"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def bump():
    p = ROOT / "index.html"
    t = p.read_text(encoding="utf-8")
    m = re.search(r"\?v=(\d+)", t)
    n = int(m.group(1)) + 1
    t = re.sub(r"\?v=\d+", f"?v={n}", t)
    p.write_text(t, encoding="utf-8", newline="\n")
    print("versi aset:", n)


def j(name):
    return json.loads((D / name).read_text(encoding="utf-8"))


def clip(s, n=155):
    s = re.sub(r"<[^>]+>", "", str(s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[: n - 1].rsplit(" ", 1)[0] + "…"


# (rute, judul, deskripsi)
PAGES = [
    ("esper", "Esper", "Daftar semua Esper (karakter) Neverness to Everness: elemen, tipe Arc, skill, Awakening, dan build rekomendasi."),
    ("arc", "Arc", "Semua Arc (senjata) Neverness to Everness dengan ATK per level, efek per bintang, dan material Ascension."),
    ("modul", "Modul", "Semua set Modul Neverness to Everness beserta bonus 2 dan 4 keping."),
    ("item", "Item", "Katalog lebih dari 1.500 item Neverness to Everness: material, makanan, hadiah, dan lainnya."),
    ("furnitur", "Furnitur", "Katalog furnitur Neverness to Everness dengan nilai Kenyamanan dan Koleksi."),
    ("kendaraan", "Kendaraan", "Mobil dan motor di Neverness to Everness beserta mereknya."),
    ("properti", "Properti", "Apartemen dan hunian yang bisa dibeli di Hethereau, Neverness to Everness."),
    ("cerita", "Cerita", "Ringkasan resmi setiap bab cerita utama dan spinoff Neverness to Everness."),
    ("anomali", "Anomali dan Monster", "Arsip Anomaly, monster, dan boss Neverness to Everness lengkap dengan kode, kutipan, dan kisahnya."),
    ("musuh", "Status Anomali", "Status musuh Neverness to Everness di setiap level: HP, ATK, DEF, Resist per elemen, dan Break, termasuk Beyond the Rails."),
    ("kalkulator", "Kalkulator Damage", "Hitung damage satu serangan karakter Neverness to Everness ke musuh, plus total Break tim, dari data base game."),
    ("istilah", "Istilah", "Arti istilah dunia Neverness to Everness dari buku panduan dalam game."),
    ("pencapaian", "Pencapaian", "Lebih dari 450 pencapaian Neverness to Everness lengkap dengan syarat dan hadiah."),
    ("fashion", "Fashion", "Galeri ilustrasi kostum setiap Esper di Neverness to Everness."),
    ("makanan", "Makanan", "Makanan dan bahan masak Neverness to Everness beserta efeknya."),
    ("tierlist", "Tier List", "Buat tier list Esper atau Arc versimu sendiri, simpan di browser, dan unduh sebagai gambar."),
    ("versi", "Versi dan Patch", "Rangkuman tiap update game Neverness to Everness dalam bahasa Indonesia."),
]


def pages():
    out = [(p, f"{t} | {NAME}", d) for p, t, d in PAGES]
    for e in j("espers.json"):
        out.append((f"esper/{e['slug']}", f"{e['name'].split(' (')[0]} | {NAME}",
                    clip(f"{e['name']}: Esper {e.get('element', '')} Arc {e.get('arcType', '')} di Neverness to Everness. Skill, Awakening, build rekomendasi, dan status per level. " + (e.get("desc") or ""))))
    for a in j("arcs.json"):
        out.append((f"arc/{a['slug']}", f"{a['name']} | {NAME}",
                    clip(f"{a['name']}: Arc {a.get('type', '')} bintang {a.get('rarity', '')} di Neverness to Everness. ATK per level, efek per bintang, dan material Ascension.")))
    for v in j("versions.json")["versions"]:
        out.append((f"versi/{v['id']}", f"Update {v['id']}: {v.get('title', '')} | {NAME}", clip(v.get("lead") or f"Rangkuman update {v['id']} Neverness to Everness.")))
    return out


def render(tpl, route, title, desc):
    url = f"{SITE}/{route}/"
    t, d = html.escape(title, quote=True), html.escape(desc, quote=True)
    s = tpl
    s = re.sub(r"<title>.*?</title>", lambda m: f"<title>{t}</title>", s, count=1, flags=re.S)
    s = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + d + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + t + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + d + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', lambda m: m.group(1) + t + m.group(2), s, count=1)
    s = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', lambda m: m.group(1) + d + m.group(2), s, count=1)
    s = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), s, count=1)
    # isi cadangan untuk yang tidak menjalankan JavaScript
    s = s.replace('<main id="main" tabindex="-1"></main>', f'<main id="main" tabindex="-1"><noscript><h1>{t}</h1><p>{d}</p></noscript></main>', 1)
    return s


def main():
    if "--bump" in sys.argv:
        bump()
    tpl = (ROOT / "index.html").read_text(encoding="utf-8")
    shutil.copyfile(ROOT / "index.html", ROOT / "404.html")
    today = date.today().isoformat()
    urls = [f"{SITE}/"]
    n = 0
    for route, title, desc in pages():
        d = ROOT / route
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(render(tpl, route, title, desc), encoding="utf-8", newline="\n")
        urls.append(f"{SITE}/{route}/")
        n += 1
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f"  <url><loc>{u}</loc><lastmod>{today}</lastmod></url>" for u in urls]
    sm.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8", newline="\n")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8", newline="\n")
    print(f"{n} halaman statis, sitemap {len(urls)} alamat")


if __name__ == "__main__":
    main()
