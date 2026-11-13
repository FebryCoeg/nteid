"""Tulis nte/data/builds_curated.json dari data pemilik situs (curated_owner.py) dan urutan Awakening
(awakening_prydwen.py). Data kurasi lama (Raddish, spreadsheet, ntebuild.com, simulasi) sudah dicabut.

Dijalankan manual, hasilnya digabung oleh make_builds.py.   python tools/nte/make_curated.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import curated_owner  # noqa: E402

D = Path(__file__).resolve().parents[2] / "nte" / "data"
out = {}
curated_owner.apply(out)
(D / "builds_curated.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("builds_curated.json:", len(out), "karakter")
