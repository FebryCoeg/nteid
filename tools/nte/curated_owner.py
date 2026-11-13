"""Data build tulisan pemilik situs (Hethereau) untuk 26 karakter. Dipanggil oleh make_curated.py.

Format tiap karakter: peran, tier, Arc (berurutan), set modul, main stat, sub stat, urutan skill, Awakening prioritas,
satu tim rekomendasi, dan catatan. Nama dipetakan ke slug data situs; nama yang tidak dikenal dilaporkan, bukan ditebak.
Bagian yang di sumbernya hanya berupa petunjuk umum (bukan nama Arc atau set tertentu) dibiarkan memakai draf.
"""
import json
import re
from pathlib import Path

D = Path(__file__).resolve().parents[2] / "nte" / "data"
OWN = {"title": "Rekomendasi pemilik situs", "by": "Hethereau", "url": ""}

SETS = {"devil's blood: curse": "Suit3", "speedy hedgehog": "Suit11", "street boxer": "Suit5", "shadow creed": "Suit8", "diabolos": "Suit1",
        "crimson: twin butterflies": "Suit4", "fireflies and the forest": "Suit2", "lost radiance": "Suit6", "kingdom's guard": "Suit7",
        "tiny big adventure": "Suit10", "thea's night tavern": "Suit9"}
CHAR = {"shinku": "shinku", "hathor": "hathor", "sakiri": "sakiri", "iroi": "iroi", "chaos": "chaos", "zero": "zero-1051", "nanally": "nanally",
        "jiuyuan": "jiuyuan", "adler": "adler", "haniel": "haniel", "daffodill": "daffodill", "baicang": "baicang", "fadia": "fadia",
        "aurelia": "aurelia", "lacrimosa": "lacrimosa", "zankou": "zankou", "linko": "linko", "blackbird": "blackbird", "akane rin": "akane-rin",
        "hotori": "hotori", "mint": "mint", "skia": "skia", "edgar": "edgar", "elyms": "elyms", "exe": "exe", "chiz": "chiz"}
SKILL = {"ultimate": "ultimate", "skill": "redirect", "basic attack": "basic", "qte": "support"}


def key(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def stat(s):
    return s.strip().replace("ATK%", "ATK %").replace("DEF%", "DEF %").replace("HP%", "HP %").replace("DMG%", "DMG %")


def skills(s):
    out = []
    for part in s.split(">"):
        p = re.sub(r"\(.*?\)", "", part).strip().lower()
        if p in SKILL:
            out.append(SKILL[p])
    return out


# slug: (peringkat, peran, tier, arcs, set, main, sub, urutan skill, awakening, (nama tim, anggota), (catatan id, catatan en))
ROWS = {
    "blackbird": ("S", "Psyche Main DPS", "Tier 0", ["Crime and Punishment", "Ravenous Blade", "Good Boy's Grand Adventure", "Watch Your Heads!"], ["Devil's Blood: Curse", "Speedy Hedgehog"],
                  "CRIT DMG, Psyche DMG", "CRIT Rate / CRIT DMG > DMG% > ATK% > Cycle Intensity", "Ultimate > Skill > Basic Attack > QTE", [1, 6, 3], ("Tim Nova", ["blackbird", "lacrimosa", "zankou", "sakiri"]),
                  ("Ascend (Lv 20 ke 80) butuh total 525.000 Beetle Coins dan 86× Colorful Ticket Stub. Max level ability butuh 1.748.000 Beetle Coins. Gift Bond termurah: Gubicrisp.",
                   "Ascension (Lv 20 to 80) costs 525,000 Beetle Coins and 86× Colorful Ticket Stub. Maxing abilities costs 1,748,000 Beetle Coins. Cheapest Bond gift: Gubicrisp.")),
    "akane-rin": ("S", "Lakshana Main DPS", "Tier 0", ["Far Side of the Moon", "Fluff of Fleetness", "The Last Rose", "Shiny Days"], ["Street Boxer", "Shadow Creed"],
                  "CRIT Rate / CRIT DMG, Lakshana DMG", "CRIT Rate / CRIT DMG > Lakshana DMG Bonus > ATK%", "Skill > Basic Attack > Ultimate > QTE", [2, 5, 3], ("Stain dan Remora", ["akane-rin", "blackbird", "zero-1051", "iroi"]),
                  ("Ascend (20 ke 80) butuh 86× Charging Knight Spark Plug. Max seluruh ability memakan 40× Synchronicity of Thought.",
                   "Ascension (20 to 80) costs 86× Charging Knight Spark Plug. Maxing all abilities takes 40× Synchronicity of Thought.")),
    "lacrimosa": ("S", "Chaos DPS", "Tier 0", ["The Last Rose", "Youthful Fantasy", "Fluff of Fleetness", "Shiny Days"], ["Diabolos"],
                  "CRIT Rate, Chaos DMG", "CRIT DMG > CRIT Rate > DMG% > ATK%", "Ultimate > Skill > Basic Attack > QTE", [1, 2, 5, 6], ("Tim Discord", ["lacrimosa", "sakiri", "daffodill", "haniel"]),
                  ("Fokus mekaniknya menumpuk Nightmare (maks 10 stack) lalu memecahkannya. Material ascend utama 86× Confessional Flower Seed. Gift Bond terbaik: Tomato 100.",
                   "Her mechanic is stacking Nightmare (max 10 stacks) and then breaking it. Main ascension material: 86× Confessional Flower Seed. Best Bond gift: Tomato 100.")),
    "zankou": ("S", "Incantation Main DPS", "Tier 0", ["Ravenous Blade", "Contemplative Cat", "Watch Your Heads!", "Fluff of Finesse", "Failing You", "Heavy in My Heart"], ["Crimson: Twin Butterflies"],
               "CRIT DMG, Cycle Intensity, Incantation DMG, CRIT Rate, ATK%", "CRIT DMG > Cycle Intensity / CRIT Rate > DMG% > ATK% > Break Intensity", "Skill > Ultimate > Basic Attack > QTE", [1, 2, 5],
               ("Tim terbaik", ["zankou", "lacrimosa", "haniel", "sakiri"]),
               ("Ascend butuh 86× Nest Guard Fragment. Gift termurah untuk max Bond: 280× Serenade.", "Ascension needs 86× Nest Guard Fragment. Cheapest gift to max Bond: 280× Serenade.")),
    "linko": ("S", "Anima Main DPS dan Follow-up Attack", "Tier 0", ["Voice of the Voyager", "Ready-Ready", "Raging Flames"], ["Fireflies and the Forest", "Lost Radiance", "Speedy Hedgehog"],
              "CRIT Rate, CRIT DMG, Anima DMG", "CRIT Rate > CRIT DMG > ATK% > ATK > Universal DMG", "Skill > Ultimate > Basic Attack > QTE", [1, 2, 4], ("Tim terbaik", ["linko", "zankou", "daffodill", "sakiri"]),
              ("Ascend butuh 86× Water Moon Pick. Kit-nya berpusat pada trigger Synced Strike (follow-up) bersama rekan tim.", "Ascension needs 86× Water Moon Pick. Her kit centres on Synced Strike (follow-up) triggers with teammates.")),
    "zero-1051": ("S", "Cosmos Burst DPS", "Tier 0 di A6", ["Day Off", "Fluff of Fearlessness", "The Rain That Shook the World", "The Forgotten"], ["Lost Radiance"],
                  "CRIT Rate, CRIT DMG, ATK%", "CRIT DMG > CRIT Rate > DMG% > ATK%", "Skill > Ultimate > QTE > Basic Attack", [2, 3, 4], ("Zero Hypercarry", ["zero-1051", "nanally", "jiuyuan", "adler"]),
                  ("Material utama: 86× Charging Knight Spark Plug.", "Main material: 86× Charging Knight Spark Plug.")),
    "iroi": ("S", "Anima Support", "Tier 0", ["The Wrong Gate", "The Last Rose", "Youthful Fantasy", "Fluff of Fleetness", "Shiny Days", "Clear Skies"], ["Speedy Hedgehog", "Fireflies and the Forest"],
             "ATK%, ATK, CRIT Rate, CRIT DMG", "ATK% > ATK > CRIT Rate > Cycle Intensity", "Ultimate > Skill > QTE > Basic Attack", [3, 5, 6], ("Shinku Hypercarry", ["iroi", "shinku", "chaos", "hathor"]),
             ("Ascend butuh 86× A Page from Delusion's Shore. Ultimate-nya memberi buff DMG besar setiap ia menyembuhkan.", "Ascension needs 86× A Page from Delusion's Shore. Her Ultimate gives a big DMG buff every time she heals.")),
    "sakiri": ("S", "Incantation Buffer dan Control", "Tier 0", ["Good Boy's Grand Adventure", "Failing You", "Heavy in My Heart"], ["Speedy Hedgehog"],
               "ATK%, CRIT DMG", "ATK% > CRIT Rate > CRIT DMG > ATK", "Ultimate > Skill > Basic Attack > QTE", [4], ("Sakiri Hypercarry", ["sakiri", "nanally", "jiuyuan", "baicang"]),
               ("Butuh 86× Charging Knight Spark Plug. Gift Bond paling worth it: Crave Bites! Milk Flavor.", "Needs 86× Charging Knight Spark Plug. Best-value Bond gift: Crave Bites! Milk Flavor.")),
    "chaos": ("S", "Lakshana DPS", "Tier 0.5", ["What's Desired", "Camellia Society", "Fluff of Ferocity", "A Time Will Come"], ["Street Boxer"],
              "Lakshana DMG, CRIT Rate / CRIT DMG", "CRIT Rate > CRIT DMG > DMG% > ATK%", "Ultimate > Skill > Basic Attack > QTE", [1, 5, 6], ("Tim terbaik", ["chaos", "jiuyuan", "hotori", "zero-1051"]),
              ("Butuh 86× Tear of the Sea. Mekaniknya mengumpulkan Crime hingga penuh lalu melepasnya sebagai Settlement DMG.", "Needs 86× Tear of the Sea. Her mechanic is filling Crime and releasing it as Settlement DMG.")),
    "nanally": ("S", "Anima Main DPS dan Follow-up Attack", "Tier 0.5", ["Ready-Ready", "Fluff of Fortitude", "Raging Flames", "Oraora!"], ["Fireflies and the Forest"],
                "CRIT DMG, ATK%", "CRIT Rate > ATK% > CRIT DMG > ATK", "Basic Attack > Ultimate > Skill > QTE", [1, 4, 5], ("Tim Blossom", ["nanally", "jiuyuan", "adler", "haniel"]),
                ("Ascend butuh 86× A Page from Delusion's Shore. Gift Bond paling hemat: Cool-lala Spicy Snack.", "Ascension needs 86× A Page from Delusion's Shore. Most economical Bond gift: Cool-lala Spicy Snack.")),
    "shinku": ("S", "Cosmos DPS", "Tier 0.5", ["Blushing Mirage", "Fluff of Ferocity", "Camellia Society", "What's Desired", "A Time Will Come"], ["Lost Radiance", "Street Boxer", "Fireflies and the Forest"],
               "CRIT Rate, CRIT DMG, Cosmos DMG", "CRIT Rate > CRIT DMG > Universal DMG% > ATK%", "Basic Attack > Ultimate > Skill > QTE", [3, 2, 1], ("Sterry Express", ["shinku", "hathor", "sakiri", "iroi"]),
               ("Butuh 86× Charging Knight Spark Plug. Sangat kuat di single target karena burst DMG dan skala CRIT-nya.", "Needs 86× Charging Knight Spark Plug. Very strong against single targets thanks to its burst DMG and CRIT scaling.")),
    "daffodill": ("S", "Chaos Burst DPS dan Break Boost", "Tier 0.5", ["Youthful Fantasy", "Fluff of Fleetness", "Shiny Days", "Mind Royale"], ["Diabolos"],
                  "CRIT DMG, CRIT Rate", "CRIT Rate > CRIT DMG > ATK% > DMG%", "Ultimate > Skill > Basic Attack > QTE", [3, 5, 6], ("Daffodill Scorch", ["daffodill", "sakiri", "baicang", "haniel"]),
                  ("Ascend butuh 86× Charging Knight Spark Plug. Sangat berfokus pada Break.", "Ascension needs 86× Charging Knight Spark Plug. Heavily focused on Break.")),
    "hotori": ("S", "Cosmos Burst DPS dan Buff", "Tier 0.5", ["Marching Beyond Time", "The Rain That Shook the World", "Fluff of Fearlessness"], ["Lost Radiance"],
               "Cosmos DMG, CRIT DMG", "CRIT Rate > CRIT DMG > ATK% > DMG%", "Ultimate > Skill > QTE > Basic Attack", [1, 5, 6], ("Tim terbaik", ["hotori", "nanally", "jiuyuan", "zero-1051"]),
               ("Mekaniknya memakai Time Stop lalu memutar ulang skill rekan tim. Ascend butuh 86× Confessional Flower Seed.", "Her mechanic uses Time Stop and replays teammates' skills. Ascension needs 86× Confessional Flower Seed.")),
    "haniel": ("A", "Psyche Buff", "Tier 0.5", ["Blow up the Crowd", "Hethereau's Keeper", "Day Off", "The Forgotten"], ["Speedy Hedgehog"],
               "CRIT Rate, Psyche DMG", "CRIT DMG > DMG% > CRIT Rate > ATK%", "Skill > Ultimate > Basic Attack > QTE", [2, 5], ("Haniel Hypercarry", ["haniel", "daffodill", "fadia", "baicang"]),
               ("Memberi pasif ATK tim berdasarkan Base ATK-nya sendiri. Ascend butuh 86× Nest Guard Fragment.", "Gives a team ATK passive based on her own Base ATK. Ascension needs 86× Nest Guard Fragment.")),
    "baicang": ("S", "Incantation Main DPS", "Tier 1", ["Camellia Society", "Fluff of Ferocity", "A Time Will Come"], ["Crimson: Twin Butterflies"],
                "Incantation DMG, CRIT Rate", "CRIT Rate > CRIT DMG > ATK% > DMG%", "Ultimate > Skill > Basic Attack > QTE", [1, 2, 6], ("Baicang Hypercarry", ["baicang", "daffodill", "sakiri", "jiuyuan"]),
                ("Mengorbankan sebagian HP sendiri untuk menumpuk Power Word demi ledakan Ultimate. Ascend butuh 86× Nest Guard Fragment.", "Sacrifices some of her own HP to stack Power Word for an Ultimate burst. Ascension needs 86× Nest Guard Fragment.")),
    "jiuyuan": ("S", "Anima Sub-DPS dan Control", "Tier 1", ["Reality Refuge", "Fluff of Fearlessness", "Hethereau's Keeper", "Day Off"], ["Fireflies and the Forest"],
                "CRIT Rate, CRIT DMG", "CRIT Rate > CRIT DMG > ATK% > DMG%", "Ultimate > Skill > Basic Attack > QTE", [6, 2, 5], ("Jiuyuan Hypercarry", ["jiuyuan", "zero-1051", "nanally", "hathor"]),
                ("Unit revolver yang juga bisa menyembuhkan pada tingkat Awakening tertentu. Ascend butuh 86× Tear of the Sea.", "A revolver unit that can also heal at certain Awakening levels. Ascension needs 86× Tear of the Sea.")),
    "adler": ("A", "Incantation Survival dan Shield", "Tier 1", ["Umbrella", "The Fools' Spring"], ["Kingdom's Guard"],
              "DEF%, DEF", "DEF% > DEF > Break Intensity > Cycle Intensity", "Skill > Ultimate > Basic Attack > QTE", [1, 6], ("Adler Hypercarry", ["adler", "daffodill", "baicang", "sakiri"]),
              ("Ascend butuh 86× Water Moon Pick. Kemampuan utamanya berputar pada Blessing Shield dan menumpuk Karma.", "Ascension needs 86× Water Moon Pick. Her core revolves around Blessing Shield and stacking Karma.")),
    "fadia": ("S", "Psyche Survival dan DMG Redirection", "Tier 1", ["Eternal Waltz", "The Great Thief", "The Good, The Bad, The Bitter"], ["Tiny Big Adventure"],
              "HP%, Mental Damage", "HP% > HP > DMG% > CRIT Rate", "Ultimate > Skill > Basic Attack > QTE", [1, 2], ("Fadia Hypercarry", ["fadia", "haniel", "daffodill", "aurelia"]),
              ("Menyerap damage yang diterima rekan ke dirinya (redirect). Ascend butuh 86× Water Moon Pick.", "Absorbs damage taken by teammates onto herself (redirect). Ascension needs 86× Water Moon Pick.")),
    "elyms": ("S", "Cosmos Buffer dan Burst DPS", "v1.5", ["Echoes on Hold", "Day Off", "The Rain That Shook the World", "First Step to Success"], ["Speedy Hedgehog", "Lost Radiance", "Shadow Creed"],
              "ATK%, Cosmos DMG, CRIT Rate / CRIT DMG", "ATK% > CRIT Rate / CRIT DMG", "Ultimate > Skill > QTE > Basic Attack", [1, 2, 3], ("Akane Rin Remora", ["elyms", "shinku", "akane-rin", "iroi"]),
              ("Karakter baru v1.5. Memakai jenjang Connection Strength dan memberi bonus tim besar setelah Ultimate. Ascend butuh 86× Tear of the Sea.", "New in v1.5. Uses Connection Strength tiers and gives a big team bonus after her Ultimate. Ascension needs 86× Tear of the Sea.")),
    "exe": ("S", "Chaos Main DPS dan Summoner", "v1.5", ["Dotted Horizon"], ["Diabolos"],
            "CRIT Rate / CRIT DMG, Chaos DMG", "CRIT Rate / CRIT DMG > Chaos DMG > ATK%", "Ultimate > Skill > Basic Attack", [1, 2, 3], None,
            ("Rilis di banner Offline Equations v1.5 Phase 2 (2 Desember 2026), jadi data masih pra-rilis. Mekaniknya mengumpulkan Frames untuk memanggil Digital Echo yang bertarung bersamanya. Ascend butuh 86× Confessional Flower Seed.",
             "Releases on the Offline Equations banner, v1.5 Phase 2 (December 2, 2026), so the data is pre-release. Her mechanic collects Frames to summon a Digital Echo that fights alongside her. Ascension needs 86× Confessional Flower Seed.")),
    "chiz": ("A", "Cosmos DPS", "Tier 1.5", [], [], "Cosmos DMG, CRIT Rate / CRIT DMG", "CRIT Rate > CRIT DMG > ATK%", "Ultimate > Skill > Basic Attack", [], None,
             ("Damage ceiling sangat tinggi, tetapi menuntut penguasaan mekanik Grain dengan eksekusi sempurna.", "Very high damage ceiling, but demands mastery of the Grain mechanic with perfect execution.")),
    "hathor": ("S", "Lakshana Hybrid", "Tier 1.5", [], ["Street Boxer"], "Lakshana DMG, Energy Regen / ATK", "ATK% > Lakshana DMG > Energy", "Skill > Ultimate > QTE", [1],
               ("Shinku Charge", ["shinku", "zero-1051", "hathor", "iroi"]),
               ("Mirip Emergency Delivery (Thorn Motorcycle) untuk Burst AoE dan Energy recharge tim.", "Similar to Emergency Delivery (Thorn Motorcycle) for AoE burst and team energy recharge.")),
    "aurelia": ("A", "Psyche Main DPS", "Tier 2", [], ["Speedy Hedgehog"], "Psyche DMG, ATK%", "ATK% > CRIT", "Basic Attack > Ultimate > Skill", [6],
                ("Tim F2P Psyche", ["aurelia", "fadia", "haniel"]),
                ("Psyche DPS yang bisa didapat gratis; pasif Crescendo menumpuk ATK setiap serangan. Awakening 6 wajib.", "A free Psyche DPS; her Crescendo passive stacks ATK on every hit. Awakening 6 is a must.")),
    "mint": ("A", "Anima DPS", "Tier 2", [], ["Fireflies and the Forest"], "Anima DMG, ATK / CRIT", "CRIT Rate > Anima DMG > ATK%", "Ultimate > Skill", [6], None,
             ("Ketahanan di lapangan cukup baik dengan rantai Ultimate, tetapi kalah DPS dibanding S-Rank. Butuh A6 untuk konten endgame.", "Decent on-field durability with her chained Ultimates, but behind S-rank DPS. Needs A6 for endgame content.")),
    "skia": ("A", "Lakshana Hybrid dan Control", "Tier 2", [], ["Street Boxer"], "Lakshana DMG, Break / Energy", "Break Intensity > ATK% > Lakshana DMG", "Skill > QTE > Ultimate", [6], None,
             ("Fokusnya pada Fang Thrusts yang melacak dan mengunci target agar Crowd Control lebih mudah. Bersinergi dengan Baicang saat Stealth. Butuh A6.", "Focuses on Fang Thrusts that track and lock targets for easier Crowd Control. Synergises with Baicang during Stealth. Needs A6.")),
    "edgar": ("A", "Cosmos Support dan Pure Healer", "Tier 3", [], [], "Healing Bonus, HP%", "HP% > Energy Regen > Flat HP", "Ultimate > Skill", [6], None,
              ("Bergantung pada pemulihan berkelanjutan Wild Current; akan tergantikan setelah kamu punya Iroi atau Jiuyuan. Butuh A6 untuk utilitas tinggi.", "Relies on the sustained recovery of Wild Current; replaced once you own Iroi or Jiuyuan. Needs A6 for high utility.")),
}


def T(i, e):
    return {"id": i, "en": e}


def apply(out):
    arcs = {key(a["name"]): a["slug"] for a in json.loads((D / "en" / "arcs.json").read_text(encoding="utf-8"))}
    unknown = []
    for slug, (rank, role, tier, arc_names, set_names, main, sub, skill_order, awk, team, faq) in ROWS.items():
        b = out.setdefault(slug, {})
        for k in ("arcNote", "setNote", "statNote", "skillNote", "setPct", "arcPct"):
            b.pop(k, None)
        b["role"] = {"rank": rank, "role": role.replace(" dan ", " / "), "tier": tier.replace(" di ", " at ")}
        if arc_names:
            slugs = []
            for n in arc_names:
                s = arcs.get(key(n))
                (slugs.append(s) if s else unknown.append((slug, "arc", n)))
            if slugs:
                b["arcs"] = slugs
        if set_names:
            ids = []
            for n in set_names:
                s = SETS.get(n.lower())
                (ids.append({"id": s, "pieces": 4}) if s else unknown.append((slug, "set", n)))
            if ids:
                b["sets"] = ids
        b["stats"] = [stat(x) for x in main.split(",")]
        b["sub"] = [stat(x) for x in sub.split(">")]
        sk = skills(skill_order)
        if sk:
            b["skills"] = sk
        if awk:
            b["awks"] = awk
        else:
            b.pop("awks", None)
        b["faq"] = T(*faq)
        b["src"] = [OWN] + [x for x in b.get("src", []) if x.get("by") != "ntebuild.com" and x.get("title") != OWN["title"]]
        keep = [t for t in b.get("teams", []) if t["src"].get("by") != "ntebuild.com"]
        if team:
            name, members = team
            mem = []
            for m in members:
                mem.append(m)
            keep = [{"name": T(name, name), "members": mem, "tag": T("REKOMENDASI", "RECOMMENDED"), "src": OWN, "why": []}] + keep
        b["teams"] = keep
    out["zero-1046"] = json.loads(json.dumps(out["zero-1051"]))  # Zero satu karakter dengan dua gender
    if unknown:
        print("TIDAK DIKENAL (dilewati):", unknown)
