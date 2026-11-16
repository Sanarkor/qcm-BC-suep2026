#!/usr/bin/env python3
"""Génère les MP3 de la fiche express (voix Vivienne, ton neutre et rythme express).

  /workspace/ttsenv/bin/python tools/gen_fiche_express_audio.py --texts
  /workspace/ttsenv/bin/python tools/gen_fiche_express_audio.py
"""
from __future__ import annotations

import argparse, asyncio, hashlib, json, os, re, subprocess, sys, unicodedata
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "fiche_express.html"
OUT = ROOT / "lecture_audio" / "fiche_express"
RAW = Path("/tmp/fiche_express_raw")
LEX = Path("/tmp/lecture_lexicon.json")
VOICE = "fr-FR-VivienneMultilingualNeural"
RATE = "+18%"
PITCH = "+0Hz"
VOLUME = "+0%"
BITRATE = "48k"
AR = "24000"
# Pauses (secondes) entre morceaux concaténés
GAP_POINT = 0.3
GAP_COURSE = 0.5
GAP_THEME = 0.4

MONTHS = {
    1: "janvier", 2: "février", 3: "mars", 4: "avril",
    5: "mai", 6: "juin", 7: "juillet", 8: "août",
    9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre",
}
MONTH_ABBR = {
    "janv": "janvier", "jan": "janvier", "févr": "février", "fevr": "février",
    "fév": "février", "fev": "février", "avr": "avril", "juil": "juillet",
    "sept": "septembre", "oct": "octobre", "nov": "novembre",
    "déc": "décembre", "dec": "décembre",
}

PRON = [
    (re.compile(r"\bcanons\b", re.I), "canonts"),
    (re.compile(r"\bcanon\b", re.I), "canont"),
    (re.compile(r"\bpontets\b", re.I), "pontés"),
    (re.compile(r"\bpontet\b", re.I), "ponté"),
]

UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
         "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
         "dix-sept", "dix-huit", "dix-neuf"]
TENS = {2: "vingt", 3: "trente", 4: "quarante"}
ROM = r"(?:XL|X{0,3})(?:IX|IV|V?I{0,3})"
ROM_KW = "|".join(
    f"[{w[0]}{w[0].upper()}]{w[1:]}|{w.upper()}"
    for w in [
        "titre", "chapitre", "partie", "livre", "section", "sous-section", "tome",
        "annexe", "article", "fiche", "volume", "acte", "phase", "niveau", "degré",
        "catégorie", "annexes", "titres", "chapitres", "parties", "livres",
    ]
)
ROM_KINGS = r"Louis|Henri|Charles|François|Napoléon|Philippe|Jean|Paul|Pie|Léon|Benoît|Jean-Paul|Edouard|Édouard|Elisabeth|Élisabeth|Guillaume"
NOT_A_SIGLE = re.compile(
    r"^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|"
    r"XXI|XXII|XXIII|XXIV|XXV|JANVIER|FEVRIER|FÉVRIER|MARS|AVRIL|MAI|JUIN|JUILLET|"
    r"AOUT|AOÛT|SEPTEMBRE|OCTOBRE|NOVEMBRE|DECEMBRE|DÉCEMBRE|EDITION|ÉDITION|PAGE|"
    r"PAGES|CHAPITRE|TITRE|ARTICLE|ANNEXE)$"
)


def load_lexicon():
    if LEX.exists():
        return json.loads(LEX.read_text())
    js = (ROOT / "lecture.js").read_text()
    caps = json.loads(re.search(r"var CAPS_WORDS=(\{.*?\});", js).group(1))
    sig = json.loads(re.search(r"var SIGLES_SET=(\[.*?\]);", js).group(1))
    data = {"CAPS_WORDS": caps, "SIGLES_SET": sig}
    LEX.write_text(json.dumps(data, ensure_ascii=False))
    return data


LEXICON = None
PAGE_W = {}
SIG_S = {}
CAPS_W = {}


def deacc(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")


def init_lex(page_text: str):
    global LEXICON, PAGE_W, SIG_S, CAPS_W
    LEXICON = load_lexicon()
    CAPS_W = LEXICON["CAPS_WORDS"]
    SIG_S = {x: 1 for x in LEXICON["SIGLES_SET"]}
    PAGE_W = {}
    for w in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]{4,}", page_text):
        if re.search(r"[a-zß-öø-ÿ]", w):
            key = deacc(w).upper()
            if key not in PAGE_W:
                PAGE_W[key] = w.lower()


def roman_val(r: str) -> int:
    if not r or not re.fullmatch(ROM, r):
        return 0
    m = {"I": 1, "V": 5, "X": 10, "L": 50}
    n = 0
    for i, ch in enumerate(r):
        a = m[ch]
        b = m[r[i + 1]] if i + 1 < len(r) else 0
        n += -a if a < b else a
    return n


def card_fr(n: int) -> str:
    if n < 20:
        return UNITS[n]
    t, u = divmod(n, 10)
    return TENS[t] + ("" if u == 0 else (" et un" if u == 1 else "-" + UNITS[u]))


def ord_fr(n: int, fem: bool = False) -> str:
    if n == 1:
        return "première" if fem else "premier"
    w = card_fr(n)
    if w.endswith("un"):
        return w + "ième"
    if w.endswith("cinq"):
        return w + "uième"
    if w.endswith("neuf"):
        return w[:-1] + "vième"
    if w.endswith("e"):
        return w[:-1] + "ième"
    return w + "ième"


def romans(s: str) -> str:
    s = s.replace("Ier", "premier").replace("Ire", "première")
    s = re.sub(
        rf"\b({ROM})(e|ème|eme)\b",
        lambda m: (ord_fr(roman_val(m.group(1))) if roman_val(m.group(1)) else m.group(0)),
        s,
    )

    def lead(m):
        n = roman_val(m.group(1))
        if not n:
            return m.group(0)
        w = card_fr(n)
        return w[0].upper() + w[1:] + ". "

    s = re.sub(rf"^({ROM})\s*[-–—.)]\s*(?=\S)", lead, s)

    def kw(m):
        n = roman_val(m.group(2))
        return f"{m.group(1)} {card_fr(n)}" if n else m.group(0)

    s = re.sub(rf"\b({ROM_KW})\s+({ROM})\b(?![-'’]?[A-Za-zÀ-ÿ])", kw, s)

    def king(m):
        n = roman_val(m.group(2))
        return f"{m.group(1)} {card_fr(n)}" if n else m.group(0)

    s = re.sub(rf"\b({ROM_KINGS})\s+({ROM})\b", king, s)
    return s


def degrees(s: str) -> str:
    s = re.sub(r"(\d+,\d+)\s?°", r"\1 degrés", s)
    s = re.sub(r"(\d+)\s?°\s?([CF])\b", r"\1 degrés", s)

    def deg(m, off_s=s):
        # re.sub with function: use match positions
        return m  # placeholder, replaced below

    out = []
    last = 0
    for m in re.finditer(r"(^|[^\d,])(\d{1,2})\s?°", s):
        out.append(s[last:m.start()])
        pre, n = m.group(1), m.group(2)
        after = s[m.end(): m.end() + 30]
        if re.search(r"cm|écart|angle", after, re.I):
            out.append(pre + n + " degrés")
        else:
            k = int(n)
            if not k:
                out.append(m.group(0))
            else:
                before = s[max(0, m.start() - 8): m.start()] + pre
                if re.search(r"\b[A-D]\s?\d?\s*\(?\s*$", before):
                    out.append(pre + ord_fr(k))
                else:
                    out.append(pre + ord_fr(k, True) + "ment")
        last = m.end()
    out.append(s[last:])
    return "".join(out)


def unspace(s: str) -> str:
    def recoll(m):
        pre, block = m.group(1), m.group(2)
        if not re.search(r"[A-ZÀ-ÖØ-Þ]", block):
            return m.group(0)
        glued = block.replace(" ", "")
        glued = re.sub(r"([A-ZÀ-ÖØ-Þ])(?=\d)", r"\1 ", glued)
        glued = re.sub(r"(\d)(?=[A-ZÀ-ÖØ-Þ])", r"\1 ", glued)
        return pre + glued

    return re.sub(
        r"(^|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])((?:[A-ZÀ-ÖØ-Þ0-9] ){3,}[A-ZÀ-ÖØ-Þ0-9])(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])",
        recoll,
        s,
    )


def spell_sigles(s: str) -> str:
    def repl(m):
        pre, tok = m.group(1), m.group(2)
        if NOT_A_SIGLE.match(tok):
            return pre + tok
        u = deacc(tok)
        if u not in SIG_S and tok not in SIG_S:
            if u in CAPS_W:
                return pre + CAPS_W[u]
            if len(u) >= 4 and u in PAGE_W:
                return pre + PAGE_W[u]
            if u != tok and not re.search(r"\d", tok):
                return pre + tok.lower()
        return pre + " ".join(tok)

    return re.sub(
        r"(^|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])([A-ZÀ-ÖØ-Þ]{2,}(?:\d[A-Z0-9]{0,3})?|[A-Z]{1,4}\d[A-Z0-9]{0,3})(?=$|[^A-Za-zÀ-ÖØ-öø-ÿ0-9])",
        repl,
        s,
    )


def speakable(raw: str) -> str:
    s = re.sub(r"\s+", " ", str(raw or "")).strip()
    if not s:
        return ""
    s = unspace(s)
    s = degrees(s)
    s = re.sub(r"art\.\s*", "article ", s, flags=re.I)
    s = romans(s)
    s = re.sub(r"\bn\s?[°º]\s*", "numéro ", s, flags=re.I)
    s = re.sub(r"\bno\.?\s*(?=\d)", "numéro ", s, flags=re.I)
    s = re.sub(r"§\s*", "paragraphe ", s)
    s = re.sub(r"\b1er\b", "premier", s, flags=re.I)
    s = re.sub(r"\b1re\b", "première", s, flags=re.I)
    s = re.sub(
        r"\b(\d+)\s*h\s*(\d{1,2})\s*[–−-]\s*(\d+)\s*h\s*(\d{1,2})",
        r"\1 heures \2 à \3 heures \4",
        s,
        flags=re.I,
    )
    s = re.sub(r"\b(\d+)\s*h\s*[–−-]\s*(\d+)\s*h\b", r"\1 heures à \2 heures", s, flags=re.I)
    s = re.sub(r"\b(\d+)\s*h\s*(\d{2})\b", r"\1 heures \2", s, flags=re.I)
    s = re.sub(r"\b(\d+)\s*h\b", r"\1 heures", s, flags=re.I)
    s = re.sub(r"\b(\d+)\s*min(?:utes?)?\b", r"\1 minutes", s, flags=re.I)
    s = re.sub(r"\b(\d+)\s*j\b", r"\1 jours", s, flags=re.I)
    s = re.sub(r"(\d+)\s*%", r"\1 pour cent", s)
    s = re.sub(r"\bL\.\s*", "L ", s)
    s = re.sub(r"\s*→\s*", " à ", s)
    s = re.sub(r"\s*[–−]\s*", " à ", s)
    s = re.sub(r"\s*/\s*", " ", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    s = spell_sigles(s)
    return s


def prep_html_text(t: str) -> str:
    """Convert a raw HTML fragment to visible text, keeping 1er/16e intact."""
    t = re.sub(r"<sup>\s*(er|re|e|ème|eme)\s*</sup>", r"\1", t, flags=re.I)
    t = re.sub(r"<br\s*/?>", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = unescape(t)
    t = t.replace("\xa0", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def expand_specials(s: str, *, is_title: bool = False) -> str:
    """Fiche-specific expansions, applied BEFORE speakable()."""
    s = s.replace("«", " ").replace("»", " ").replace("“", " ").replace("”", " ")
    s = s.replace("•", " ").replace("·", " ").replace("*", " ").replace("_", " ")
    s = s.replace("#", " ").replace("`", " ").replace("…", ".")
    s = s.replace("=", " égal ")
    s = s.replace("≥", " supérieur ou égal à ")
    s = s.replace("≤", " inférieur ou égal à ")
    s = s.replace("<", " inférieur à ")
    s = s.replace(">", " supérieur à ")
    s = s.replace("×", " fois ")
    s = s.replace("€", " euros ")
    s = s.replace("&", " et ")

    # milliers : "1 607 heures", "15 000 euros"
    s = re.sub(r"\b(\d{1,3})\s+(\d{3})\b", r"\1\2", s)

    # "et s." = et suivants (\b after a period does not match)
    s = re.sub(r"\bet s\.(?=\s|$)", "et suivants", s)

    s = re.sub(r"\bal\.\s*", "alinéa ", s, flags=re.I)
    s = re.sub(r"\betc\.\b", "etcétéra", s, flags=re.I)

    def mo_abbr(m):
        w = deacc(m.group(1)).lower().rstrip(".")
        return MONTH_ABBR.get(w, m.group(1)) + " "

    s = re.sub(
        r"\b(janv|jan|févr|fevr|fév|fev|avr|juil|sept|oct|nov|déc|dec)\.\s*",
        mo_abbr,
        s,
        flags=re.I,
    )

    s = re.sub(r"\bA/R\b", "aller-retour", s)
    s = re.sub(r"\bet/ou\b", "et ou", s, flags=re.I)
    s = re.sub(r"\bjour/nuit\b", "jour nuit", s, flags=re.I)
    s = re.sub(r"habillage/déshabillage", "habillage déshabillage", s, flags=re.I)
    s = re.sub(r"superviseur\s*/\s*tireur", "superviseur tireur", s, flags=re.I)
    s = re.sub(r"superviseur-tireur", "superviseur tireur", s, flags=re.I)

    s = re.sub(r"\bmin/h\b", "minutes par heure", s, flags=re.I)
    s = re.sub(r"\bjours/an\b", "jours par an", s, flags=re.I)
    s = re.sub(r"\b(\d+(?:,\d+)?)\s*mm\b", r"\1 millimètres", s)
    s = re.sub(r"\b(\d+)\s*m\b", r"\1 mètres", s)

    # G36 before letter-by-letter spelling, so the caliber stays separate
    s = re.sub(r"\bG36\b", "G 36", s)

    # Instruction refs DPN-1.9.4.1
    s = re.sub(r"\b([A-Z]{2,}(?:/[A-Z]{2,})*)-(\d)", r"\1 \2", s)

    # Fiche versions "vs 06-2021"
    s = re.sub(r"\bvs\s+(\d{2})-(\d{4})\b", r"version \1 \2", s, flags=re.I)

    s = re.sub(r"\bGlock\s+17/26\b", "Glock 17 et 26", s, flags=re.I)

    # n° 15/2025, n°3/2024 BEFORE the month/year pattern
    s = re.sub(
        r"n\s?[°º]\s*(\d{1,3})\s*/\s*(\d{4})\b",
        r"numéro \1 de \2",
        s,
        flags=re.I,
    )

    def fr_date(m):
        d, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
        if mo < 1 or mo > 12:
            return m.group(0)
        return f"{d} {MONTHS[mo]} {y}"

    s = re.sub(r"\b(\d{1,2})/(\d{1,2})/(\d{4})\b", fr_date, s)

    def fr_my(m):
        mo, y = int(m.group(1)), m.group(2)
        if mo < 1 or mo > 12:
            return m.group(0)
        return f"{MONTHS[mo]} {y}"

    s = re.sub(r"\(?\b(\d{1,2})/(\d{4})\b\)?", fr_my, s)

    # décret 2025/70, instruction 2004/40
    s = re.sub(r"\b((?:19|20)\d{2})/(\d{1,3})\b", r"\1-\2", s)

    s = re.sub(r"\b1/24\b", "un vingt-quatrième", s)
    s = re.sub(r"\b1/5\b", "un cinquième", s)

    s = re.sub(
        r"\b(\d)-(\d)\s*/\s*(\d)-(\d)\s*/\s*(\d)-(\d)\b",
        r"\1 \2 sur \3 \4 sur \5 \6",
        s,
    )
    s = re.sub(
        r"\b(\d)/(\d)/(\d)/(\d)/(\d)/(\d)\b",
        r"\1 sur \2 sur \3 sur \4 sur \5 sur \6",
        s,
    )
    s = re.sub(r"\b(\d)/(\d)\b", r"\1 sur \2", s)
    s = re.sub(r"\b(\d)\s*/\s*(\d)\b", r"\1 sur \2", s)

    s = re.sub(r"\b([A-Z]{2,})(?:/([A-Z]{2,}))+\b", lambda m: m.group(0).replace("/", " "), s)
    # DGGN-PP-DGPN etc.
    s = re.sub(r"\b([A-Z]{2,}(?:-[A-Z]{2,})+)\b", lambda m: m.group(0).replace("-", " "), s)

    s = re.sub(r"\b([A-D])(\d)-(\d)\b", r"\1 \2 tiret \3", s)

    s = re.sub(r"\b(\d{1,4})-(\d{1,4})-(\d{1,4})\b", r"\1 tiret \2 tiret \3", s)
    s = re.sub(r"\b(\d{1,4})-(\d{1,4})\b", r"\1 tiret \2", s)

    s = re.sub(r"\bR\.\s*", "R ", s)
    s = re.sub(r"\bD\.\s*", "D ", s)

    s = re.sub(r"([:；;]|Maladie|\bde)\s*[–−-]\s*(?=\d|un )", r"\1 moins ", s)
    s = re.sub(r"(^| )\+\s*(?=\d)", r"\1plus ", s)

    def typ_dash(m):
        left, right = m.group(1), m.group(2)
        months = r"janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre"
        if re.search(months, left, re.I) and re.search(months, right, re.I):
            return f"{left} au {right}"
        if re.search(r"\d", left) and re.search(r"\d", right):
            return f"{left} à {right}"
        return f"{left} : {right}"

    s = re.sub(r"(\S.*?)\s*[–−]\s*(\S+)", typ_dash, s)

    def ordn(m):
        return ord_fr(int(m.group(1)), fem=True)

    s = re.sub(r"\b(\d+)\s*(?:e|ème|eme)\b", ordn, s, flags=re.I)

    s = re.sub(r"\bNOR\s+([A-Z]{3,}\d+[A-Z]?)\b", lambda m: "NOR " + " ".join(m.group(1)), s)

    return s



def pron(t: str) -> str:
    for rx, rep in PRON:
        t = rx.sub(rep, t)
    t = re.sub(r"\s{2,}", " ", t).strip()
    # no leftover markdown/symbols that TTS would name
    t = re.sub(r"[#*_`|\\]+", " ", t)
    t = re.sub(r"\s{2,}", " ", t).strip()
    return t


def spoken(raw: str, *, is_title: bool = False) -> str:
    s = pron(speakable(expand_specials(raw, is_title=is_title)))
    # identifiants longs (NOR, etc.) : chiffres lus un à un, après unspace()
    s = re.sub(r"\b(\d{6,})\b", lambda m: " ".join(m.group(1)), s)
    # courte pause entre le modèle et un calibre distinct : « H K G 36, 5,56 millimètres »
    # (pas « 9 fois 19 millimètres », ni « L B D 40 millimètres », ni « calibre 5,56 »)
    s = re.sub(
        r"\b(G 36|Glock)\s+(\d+(?:,\d+)?\s+millimètres)\b",
        r"\1, \2",
        s,
    )
    return s


def parse_fiche():
    raw = HTML.read_text(encoding="utf-8")
    body = raw[raw.find("<body"):]
    body = re.sub(r"<script\b[^>]*>.*?</script>", "", body, flags=re.S | re.I)
    body = re.sub(r"<style\b[^>]*>.*?</style>", "", body, flags=re.S | re.I)
    sections = re.findall(
        r'<section id="([^"]+)">\s*<h2>(.*?)</h2>(.*?)</section>', body, flags=re.S
    )
    themes = []
    page_plain = []
    for sid, h2, content in sections:
        title = prep_html_text(h2)
        courses = []
        for aid, h3, ul in re.findall(
            r'<article id="([^"]+)">\s*<h3>(.*?)</h3>\s*<ul>(.*?)</ul>\s*</article>',
            content,
            flags=re.S,
        ):
            h3t = prep_html_text(h3)
            # strip leading course number already in .n ("19 Schéma" or "01 DocPro")
            num = aid[1:] if aid.startswith("c") else ""
            if num.isdigit():
                h3t = re.sub(rf"^0*{int(num)}\s*[–−-]?\s*", "", h3t)
            points = [prep_html_text(li) for li in re.findall(r"<li>(.*?)</li>", ul, flags=re.S)]
            courses.append({"id": aid, "n": int(num) if num.isdigit() else 0, "title": h3t, "points": points})
            page_plain.append(h3t)
            page_plain.extend(points)
        themes.append({"id": sid, "title": title, "courses": courses})
        page_plain.append(title)
    init_lex(" ".join(page_plain))
    return themes


def theme_script(theme: dict) -> list[dict]:
    """List of {kind, text} segments that will be spoken then concatenated."""
    segs = []
    segs.append({"kind": "theme", "text": spoken(f"Thème. {theme['title']}.", is_title=True), "course": None})
    for c in theme["courses"]:
        segs.append({"kind": "course", "text": spoken(f"Cours {c['n']}. {c['title']}.", is_title=True), "course": c["n"], "cid": c["id"], "ctitle": c["title"]})
        for p in c["points"]:
            pt = p if p.endswith((".", "?", "!", "…")) else p + "."
            segs.append({"kind": "point", "text": spoken(pt), "course": c["n"], "cid": c["id"]})
    return segs


THEME_FILES = [
    ("01", "tt"),
    ("02", "mo"),
    ("03", "armes"),
    ("04", "interp"),
    ("05", "lieux"),
    ("06", "att"),
    ("07", "refus"),
    ("08", "aps"),
]


def short_label(title: str) -> str:
    mapping = {
        "tt": "Temps de travail",
        "mo": "Maintien de l’ordre",
        "armes": "Armes et AFI",
        "interp": "Interpellation",
        "lieux": "Lieux",
        "att": "Forcené et attentats",
        "refus": "Refus d’obtempérer",
        "aps": "Activités physiques",
    }
    return mapping


def write_texts(themes):
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    all_lines = []
    issues = []
    manifest_segs = []
    for (num, sid), theme in zip(THEME_FILES, themes):
        assert theme["id"] == sid, (theme["id"], sid)
        segs = theme_script(theme)
        chars = sum(len(s["text"]) for s in segs)
        path = OUT / f"{num}_{sid}.txt"
        blocks = []
        for s in segs:
            blocks.append(f"[{s['kind']}]\n{s['text']}\n")
            # flag leftover symbols / oddities
            leftover = re.findall(r"[/%§→=#*_<>≥≤×€\\]|art\.|\bL\.|\bR\.|\bn°", s["text"])
            if leftover:
                issues.append((sid, leftover, s["text"][:180]))
        path.write_text("\n".join(blocks), encoding="utf-8")
        all_lines.append(f"===== {num} {sid} {theme['title']} — {len(segs)} segments, {chars} car. =====")
        all_lines.extend(blocks)
        manifest_segs.append({"id": sid, "file": f"{num}_{sid}.mp3", "n": int(num), "title": theme["title"], "segs": segs, "chars": chars})
    dump = Path("/tmp/fiche_spoken.txt")
    dump.write_text("\n".join(all_lines), encoding="utf-8")
    print(f"Thèmes {len(themes)} ; texte → {dump} ; issues {len(issues)}")
    for it in issues[:40]:
        print("ISSUE", it[0], it[1], "|", it[2])
    return manifest_segs


def clip_key(text: str) -> str:
    return hashlib.sha1(f"{VOICE}|{RATE}|{PITCH}|{VOLUME}|{text}".encode()).hexdigest()[:16]


def ff(*args, check=True):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(r.stderr or r.stdout or "ffmpeg failed")
    return r


def make_silence(seconds: float, dest: Path):
    ff(
        "-f", "lavfi", "-i", f"anullsrc=r={AR}:cl=mono",
        "-t", f"{seconds:.3f}",
        "-c:a", "libmp3lame", "-b:a", BITRATE, "-ac", "1", "-ar", AR,
        str(dest),
    )


async def tts_one(text: str, dest: Path, sem: asyncio.Semaphore, fail: list):
    import edge_tts
    async with sem:
        if dest.exists() and dest.stat().st_size > 500:
            return True
        tmp = dest.with_suffix(".part.mp3")
        for attempt in range(8):
            try:
                com = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, volume=VOLUME)
                await asyncio.wait_for(com.save(str(tmp)), 90)
                if tmp.exists() and tmp.stat().st_size > 500:
                    # normalize to constant bitrate / rate for concat
                    ff("-i", str(tmp), "-ac", "1", "-ar", AR, "-c:a", "libmp3lame", "-b:a", BITRATE, str(dest))
                    tmp.unlink(missing_ok=True)
                    return True
            except Exception:
                await asyncio.sleep(1.5 * (attempt + 1))
        fail.append(text[:80])
        return False


async def synthesize(manifest_segs, concurrency=8):
    import edge_tts  # noqa: F401
    RAW.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    make_silence(GAP_POINT, RAW / "sil_point.mp3")
    make_silence(GAP_COURSE, RAW / "sil_course.mp3")
    make_silence(GAP_THEME, RAW / "sil_theme.mp3")
    # unique clips
    texts = {}
    for th in manifest_segs:
        for s in th["segs"]:
            h = clip_key(s["text"])
            s["hash"] = h
            texts[h] = s["text"]
    todo = {h: t for h, t in texts.items() if not (RAW / f"{h}.mp3").exists() or (RAW / f"{h}.mp3").stat().st_size <= 500}
    print(f"{len(texts)} clips uniques, {len(todo)} à synthétiser", flush=True)
    sem = asyncio.Semaphore(concurrency)
    fail = []
    done = 0

    async def one(h, t):
        nonlocal done
        ok = await tts_one(t, RAW / f"{h}.mp3", sem, fail)
        if ok:
            done += 1
            if done % 20 == 0 or done == len(todo):
                print(f"  {done}/{len(todo)}", flush=True)

    if todo:
        await asyncio.gather(*(one(h, t) for h, t in todo.items()))
    print(f"TTS terminé : {done} nouveaux, échecs {len(fail)}", flush=True)
    if fail:
        for f in fail:
            print("FAIL", f)
        raise SystemExit(2)
    # concat per theme
    info = []
    for th in manifest_segs:
        lst = RAW / f"concat_{th['id']}.txt"
        parts = []
        for i, s in enumerate(th["segs"]):
            parts.append(RAW / f"{s['hash']}.mp3")
            if i + 1 < len(th["segs"]):
                nxt = th["segs"][i + 1]["kind"]
                if nxt == "course":
                    parts.append(RAW / "sil_course.mp3")
                elif s["kind"] == "theme":
                    parts.append(RAW / "sil_theme.mp3")
                else:
                    parts.append(RAW / "sil_point.mp3")
        lines = []
        for p in parts:
            if not p.exists() or p.stat().st_size < 200:
                raise RuntimeError(f"clip manquant {p}")
            lines.append(f"file '{p}'")
        lst.write_text("\n".join(lines))
        dest = OUT / th["file"]
        ff("-f", "concat", "-safe", "0", "-i", str(lst),
           "-c:a", "libmp3lame", "-b:a", BITRATE, "-ac", "1", "-ar", AR,
           "-write_xing", "1", str(dest))
        dur = duration(dest)
        th["duration"] = dur
        th["bytes"] = dest.stat().st_size
        print(f"  {th['file']}: {dur:.1f}s  {th['bytes']//1024} Ko  ({th['chars']} car.)", flush=True)
        info.append(th)
    return info


def duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


def concat_parts(parts, dest: Path):
    lst = dest.with_suffix(".concat.txt")
    lines = []
    for p in parts:
        if not p.exists() or p.stat().st_size < 200:
            raise RuntimeError(f"clip manquant {p}")
        lines.append(f"file '{p}'")
    lst.write_text("\n".join(lines))
    ff("-f", "concat", "-safe", "0", "-i", str(lst),
       "-c:a", "libmp3lame", "-b:a", BITRATE, "-ac", "1", "-ar", AR,
       "-write_xing", "1", str(dest))
    lst.unlink(missing_ok=True)
    return duration(dest)


def concat_courses(themes, manifest_segs):
    """Assemble un MP3 par cours à partir des clips déjà générés (sans le titre de thème)."""
    out = []
    for theme, th in zip(themes, manifest_segs):
        groups = {}
        order = []
        chars = {}
        for s in th["segs"]:
            n = s.get("course")
            if n is None:
                continue
            if n not in groups:
                groups[n] = []
                order.append(n)
                chars[n] = 0
            groups[n].append(s)
            chars[n] += len(s["text"])
        for n in order:
            segs = groups[n]
            parts = []
            for i, s in enumerate(segs):
                parts.append(RAW / f"{s['hash']}.mp3")
                if i + 1 < len(segs):
                    parts.append(RAW / "sil_point.mp3")
            dest = OUT / f"c{n:02d}.mp3"
            dur = concat_parts(parts, dest)
            cobj = next(c for c in theme["courses"] if c["n"] == n)
            info = {
                "id": cobj["id"],
                "n": n,
                "theme": theme["id"],
                "title": cobj["title"],
                "file": f"lecture_audio/fiche_express/c{n:02d}.mp3",
                "duration": round(dur, 2),
                "chars": chars[n],
                "segments": len(segs),
            }
            out.append(info)
            print(f"  c{n:02d}.mp3: {dur:.1f}s  {dest.stat().st_size//1024} Ko  ({chars[n]} car.)", flush=True)
    return out


def write_manifest(info, courses=None):
    short = short_label("")
    out = {
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
        "volume": VOLUME,
        "version": "20261116f",
        "themes": [
            {
                "id": t["id"],
                "n": t["n"],
                "title": t["title"],
                "short": short[t["id"]],
                "file": "lecture_audio/fiche_express/" + t["file"],
                "duration": round(t["duration"], 2),
            }
            for t in info
        ],
    }
    # attach course counts from original segs
    for t, raw in zip(out["themes"], info):
        t["segments"] = len(raw["segs"])
        t["chars"] = raw["chars"]
    out["total_duration"] = round(sum(t["duration"] for t in out["themes"]), 2)
    if courses:
        out["courses"] = courses
        out["courses_duration"] = round(sum(c["duration"] for c in courses), 2)
        print("Cours", len(courses), "durée cumulée", f"{out['courses_duration']/60:.1f}", "min")
    (OUT / "manifest.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Total thèmes", out["total_duration"], "s =", f"{out['total_duration']/60:.1f}", "min")
    return out


def sanity(info):
    """Duration vs character count should be in a plausible band at -16% rate."""
    # casual French TTS ~13-15 char/s at 0%; at -16% ~11-13 char/s, plus pauses
    ok = True
    for t in info:
        cps = t["chars"] / max(t["duration"], 0.01)
        # with pauses, expect roughly 8-16 spoken chars per second of file
        flag = ""
        if cps < 6 or cps > 20:
            flag = "  ** ANOMALIE **"
            ok = False
        print(f"  sanity {t['file']}: {cps:.1f} car/s, {t['duration']:.1f}s{flag}")
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--texts", action="store_true", help="écrire les textes seulement")
    ap.add_argument("--concurrency", type=int, default=8)
    args = ap.parse_args()
    themes = parse_fiche()
    n_c = sum(len(t["courses"]) for t in themes)
    n_p = sum(len(c["points"]) for t in themes for c in t["courses"])
    print(f"{len(themes)} thèmes, {n_c} cours, {n_p} points")
    segs = write_texts(themes)
    if args.texts:
        return
    info = asyncio.run(synthesize(segs, args.concurrency))
    courses = concat_courses(themes, info)
    man = write_manifest(info, courses)
    if not sanity(info):
        sys.exit(3)
    print("OK", OUT)


if __name__ == "__main__":
    main()
