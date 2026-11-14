"""Bangun ulang semua data situs dari NTE_Assets, dalam urutan yang benar.

  python tools/nte/rebuild_all.py            # pakai cache yang ada (commit yang sama)
  python tools/nte/rebuild_all.py --fresh    # hapus cache dulu, ambil versi NTE_Assets terbaru
  python tools/nte/rebuild_all.py --bump     # naikkan nomor ?v=NN di akhir

Dipakai juga oleh GitHub Actions (.github/workflows/nte-update.yml).
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = Path(os.environ.get("NTE_CACHE", HERE / ".cache"))

STEPS = [
    "build.py",           # data utama + gambar
    "build_extra.py",     # cerita, anomali, istilah, pencapaian, fashion, makanan
    "build_stats.py",     # statistik Esper dan Arc per level
    "build_en.py",        # versi bahasa Inggris
    "make_curated.py",    # data build tulisan pemilik situs
    "make_builds.py",     # draf build + gabungan data kurasi
    "build_enemies.py",   # status musuh
]


def run(script, *args):
    print(f"\n=== {script} {' '.join(args)}", flush=True)
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, str(HERE / script), *args], cwd=HERE.parents[1], env=env)
    if r.returncode:
        raise SystemExit(f"{script} gagal (kode {r.returncode})")


def main():
    if "--fresh" in sys.argv and CACHE.exists():
        # simpan daftar file, hapus sisanya supaya build mengambil commit terbaru
        print("hapus cache", CACHE)
        shutil.rmtree(CACHE)
    for s in STEPS:
        run(s)
    run("make_pages.py", *(["--bump"] if "--bump" in sys.argv else []))
    print("\nselesai")


if __name__ == "__main__":
    main()
