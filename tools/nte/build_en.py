"""Bangun versi bahasa Inggris data situs -> nte/data/en/*.json

Data utama (Esper, Arc, Modul, Item, Kendaraan, Properti, label rasio skill) disimpan dalam bahasa
Indonesia. Skrip ini membangun ulang bahan yang sama dengan teks aslinya (Inggris), lalu hanya
menimpa nilai teks pada struktur data Indonesia yang sudah jadi, sehingga ikon, urutan, dan
pengaturan lain tetap persis sama. File yang tidak berbeda tidak ditulis; daftar file yang ada
dicatat di nte/data/en/_index.json dan dipakai app.js saat bahasa EN dipilih.

Jalankan SETELAH build.py, build_extra.py, dan build_stats.py:   python tools/nte/build_en.py
"""
import json
import os
import shutil
import sys

os.environ["NTE_LANG"] = "en"
sys.argv = [sys.argv[0], "--no-images"]
import build as B  # noqa: E402
import build_stats as BS  # noqa: E402

ID_DIR = B.OUT_DATA
TMP = ID_DIR / "_en_tmp"
EN_DIR = ID_DIR / "en"
NAMES = ["espers", "arcs", "modules", "items", "furniture", "vehicles", "property"]


def merge(idv, env, stat):
    """Ambil struktur dari data Indonesia, ganti hanya nilai teks dengan versi Inggris."""
    if isinstance(idv, dict) and isinstance(env, dict):
        return {k: merge(v, env.get(k, v), stat) for k, v in idv.items()}
    if isinstance(idv, list) and isinstance(env, list) and len(idv) == len(env):
        return [merge(a, b, stat) for a, b in zip(idv, env)]
    if isinstance(idv, list) and isinstance(env, list):
        stat["panjang_beda"] += 1
        return idv
    if isinstance(idv, str) and isinstance(env, str) and env != idv and not env.startswith("img/"):
        stat["diganti"] += 1
        return env
    return idv


def main():
    shutil.rmtree(TMP, ignore_errors=True)
    shutil.rmtree(EN_DIR, ignore_errors=True)
    B.OUT_DATA = TMP
    B.build_espers()
    B.build_arcs()
    B.build_modules()
    B.build_items()
    B.build_vehicles()
    B.build_property()
    en_stats = BS.esper_stats()  # label rasio skill dalam bahasa Inggris
    EN_DIR.mkdir(parents=True, exist_ok=True)
    written = []
    total = {"diganti": 0, "panjang_beda": 0}
    for name in NAMES + ["stats"]:
        idv = json.loads((ID_DIR / f"{name}.json").read_text(encoding="utf-8"))
        if name == "stats":
            env = {"espers": en_stats}
            out = dict(idv)
            out["espers"] = merge(idv["espers"], env["espers"], total)
        else:
            env = json.loads((TMP / f"{name}.json").read_text(encoding="utf-8"))
            out = merge(idv, env, total)
        if out != idv:
            (EN_DIR / f"{name}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            written.append(name)
        print(f"  {name}: {'berbeda' if out != idv else 'sama'}")
    # beranda: teks Esper pada etalase (judul, deskripsi, ringkasan)
    home = json.loads((ID_DIR / "home.json").read_text(encoding="utf-8"))
    en_es = {e["slug"]: e for e in json.loads((EN_DIR / "espers.json").read_text(encoding="utf-8"))}
    for r in home["roster"]:
        e = en_es.get(r["slug"])
        if e:
            r["title"], r["desc"], r["intro"] = e.get("title", ""), e.get("desc", ""), (e.get("profile") or {}).get("intro", "")
    (EN_DIR / "home.json").write_text(json.dumps(home, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    written.append("home")
    (EN_DIR / "_index.json").write_text(json.dumps(written), encoding="utf-8")
    shutil.rmtree(TMP, ignore_errors=True)
    print("en/:", written, "| nilai teks diganti:", total["diganti"], "| daftar beda panjang:", total["panjang_beda"])


if __name__ == "__main__":
    main()
