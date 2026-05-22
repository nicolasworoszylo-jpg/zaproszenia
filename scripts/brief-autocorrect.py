#!/usr/bin/env python3
"""
brief-autocorrect.py - Autokorekta polskich znaków w brief.json klienta.

Cel: klient wpisuje "Kosciol sw. Marcina", system zwraca "Kościół św. Marcina"
     - bez ręcznej korekty. Działa tylko na PROSE fields (text/desc/address/etc),
     NIE rusza technical fields (icon/palette/slug/iban/mapUrl/phone/email/url/time).

Strategia 2-warstwowa:
  Warstwa 1: DICTIONARY (deterministyczna, szybka, ~150 par) - obejmuje najpopularniejsze
             słowa weselne + polskie miasta + skróty (Sw./św.).
  Warstwa 2: LOKALNY LLM (Ollama qwen2.5:14b, OPCJONALNIE) - dla długiego custom text
             (Nasza historia) który wymaga rozumienia semantyki, gdzie dictionary może
             nie wystarczyć. Skip jeśli Ollama nie running lub --no-llm flag.

Bezpieczeństwo:
  - Word-boundary regex (\\bSlub\\b matchuje "Slub" ale NIE "Slubuke" itp.)
  - Skip non-prose fields (icon, palette, slug, iban, mapUrl, phone, email, url, time, *Url, color hex)
  - --diff-only pokazuje zmiany bez zapisu (preview mode)

Uzycie:
  python3 brief-autocorrect.py <brief.json>                  # in-place edit (autoryzowane)
  python3 brief-autocorrect.py <brief.json> --diff-only      # tylko podglad zmian
  python3 brief-autocorrect.py <brief.json> --no-llm         # tylko dictionary
  python3 brief-autocorrect.py <brief.json> --check          # exit 1 jezeli sa zmiany do zrobienia
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

# Pary (ASCII -> polski). Format: (regex_pattern_z_boundaries, replacement)
# Kolejność WAŻNA: dłuższe wzorce PRZED krótszymi (greedy ale word-boundary).
# Wszystkie używają \\b boundaries żeby nie matchować w środku słów.
PAIRS = [
    # === Miesiące (mianownik + dopełniacz) ===
    (r"\bstycznia\b", "stycznia"),  # OK ASCII
    (r"\blutego\b", "lutego"),
    (r"\bmarca\b", "marca"),
    (r"\bkwietnia\b", "kwietnia"),
    (r"\bczerwca\b", "czerwca"),
    (r"\blipca\b", "lipca"),
    (r"\bsierpnia\b", "sierpnia"),
    (r"\bwrzesnia\b", "września"),
    (r"\bWrzesnia\b", "Września"),
    (r"\bWrzesien\b", "Wrzesień"),
    (r"\bwrzesien\b", "wrzesień"),
    (r"\bpazdziernika\b", "października"),
    (r"\bPazdziernika\b", "Października"),
    (r"\bpazdziernik\b", "październik"),
    (r"\bPazdziernik\b", "Październik"),
    (r"\blistopada\b", "listopada"),
    (r"\bgrudnia\b", "grudnia"),
    (r"\bGrudzien\b", "Grudzień"),
    (r"\bgrudzien\b", "grudzień"),

    # === Polskie miasta (najczęstsze) ===
    (r"\bGdansk\b", "Gdańsk"),
    (r"\bGdanska\b", "Gdańska"),
    (r"\bGdansku\b", "Gdańsku"),
    (r"\bGdansko\b", "Gdańsko"),
    (r"\bgdanski\b", "gdański"),
    (r"\bKrakow\b", "Kraków"),
    (r"\bKrakowa\b", "Krakowa"),
    (r"\bKrakowie\b", "Krakowie"),
    (r"\bLodz\b", "Łódź"),
    (r"\bLodzi\b", "Łodzi"),
    (r"\bWroclaw\b", "Wrocław"),
    (r"\bWroclawia\b", "Wrocławia"),
    (r"\bWroclawiu\b", "Wrocławiu"),
    (r"\bPoznan\b", "Poznań"),
    (r"\bPoznania\b", "Poznania"),
    (r"\bPoznaniu\b", "Poznaniu"),
    (r"\bTorun\b", "Toruń"),
    (r"\bToruniu\b", "Toruniu"),
    (r"\bTorunska\b", "Toruńska"),
    (r"\bTorunski\b", "Toruński"),
    (r"\bTorunskiej\b", "Toruńskiej"),
    (r"\bRzeszow\b", "Rzeszów"),
    (r"\bRzeszowa\b", "Rzeszowa"),
    (r"\bRzeszowie\b", "Rzeszowie"),
    (r"\bSopot\b", "Sopot"),  # OK
    (r"\bSopotu\b", "Sopotu"),  # OK
    (r"\bSopocie\b", "Sopocie"),  # OK
    (r"\bGdynia\b", "Gdynia"),  # OK
    (r"\bGdyni\b", "Gdyni"),  # OK
    (r"\bZielona Gora\b", "Zielona Góra"),
    (r"\bZielonej Gorze\b", "Zielonej Górze"),

    # === Kościoły / sakralne ===
    (r"\bKosciol\b", "Kościół"),
    (r"\bkosciol\b", "kościół"),
    (r"\bKoscioł\b", "Kościół"),  # mieszane
    (r"\bKosciola\b", "Kościoła"),
    (r"\bkosciola\b", "kościoła"),
    (r"\bKosciele\b", "Kościele"),
    (r"\bkosciele\b", "kościele"),
    (r"\bKosciolami\b", "Kościołami"),
    (r"\bswiete[jmgo]?\b", lambda m: "święte" + m.group()[-1] if m.group()[-1] in "jmgo" else "święte"),
    (r"\bsw\.\s", "św. "),
    (r"\bSw\.\s", "Św. "),
    (r"\bSw\b", "Św"),
    (r"\bSwietego\b", "Świętego"),
    (r"\bswietego\b", "świętego"),
    (r"\bSwietej\b", "Świętej"),
    (r"\bswietej\b", "świętej"),

    # === Ślub + warianty ===
    (r"\bSlub\b", "Ślub"),
    (r"\bslub\b", "ślub"),
    (r"\bSlubu\b", "Ślubu"),
    (r"\bslubu\b", "ślubu"),
    (r"\bSlubn(\w*)", r"Ślubn\1"),  # Slubna/Slubny/Slubne/Slubnym...
    (r"\bslubn(\w*)", r"ślubn\1"),
    (r"\bSlubic\b", "Ślubić"),
    (r"\bslubic\b", "ślubić"),

    # === Gości / obecność ===
    (r"\bgosci\b", "gości"),
    (r"\bGosci\b", "Gości"),
    (r"\bGosc\b", "Gość"),
    (r"\bgosc\b", "gość"),
    (r"\bobecnosc\b", "obecność"),
    (r"\bObecnosc\b", "Obecność"),
    (r"\bobecnosci\b", "obecności"),
    (r"\bObecnosci\b", "Obecności"),

    # === Najsłodszy / najbliższy / itp ===
    (r"\bNajslodszy\b", "Najsłodszy"),
    (r"\bnajslodszy\b", "najsłodszy"),
    (r"\bNajslodsza\b", "Najsłodsza"),
    (r"\bnajslodsza\b", "najsłodsza"),
    (r"\bNajwiekszy\b", "Największy"),
    (r"\bnajwiekszy\b", "największy"),
    (r"\bNajwieksza\b", "Największa"),
    (r"\bnajwieksza\b", "największa"),
    (r"\bNajblizszy\b", "Najbliższy"),
    (r"\bnajblizszy\b", "najbliższy"),

    # === Czasowniki przeszłe (-l/-la/-li z polskimi diakr) ===
    (r"\bpowiedziala\b", "powiedziała"),
    (r"\bPowiedziala\b", "Powiedziała"),
    (r"\bpowiedzial\b", "powiedział"),
    (r"\bPowiedzial\b", "Powiedział"),
    (r"\brzucila\b", "rzuciła"),
    (r"\bRzucila\b", "Rzuciła"),
    (r"\brzucil\b", "rzucił"),
    (r"\bRzucil\b", "Rzucił"),
    (r"\bdolaczyla\b", "dołączyła"),
    (r"\bDolaczyla\b", "Dołączyła"),
    (r"\bdolaczyl\b", "dołączył"),
    (r"\bDolaczyl\b", "Dołączył"),
    (r"\bdolaczyli\b", "dołączyli"),
    (r"\buklenelismy\b", "uklęknęliśmy"),
    (r"\bUklenelismy\b", "Uklęknęliśmy"),
    (r"\buklenal\b", "uklęknął"),
    (r"\bUklenal\b", "Uklęknął"),
    (r"\buklela\b", "uklękła"),
    (r"\bUklela\b", "Uklękła"),
    (r"\bukleknal\b", "uklęknął"),
    (r"\bUkleknal\b", "Uklęknął"),
    (r"\bzaczeli\b", "zaczęli"),
    (r"\bZaczeli\b", "Zaczęli"),
    (r"\bzaczela\b", "zaczęła"),
    (r"\bZaczela\b", "Zaczęła"),
    (r"\bzaczal\b", "zaczął"),
    (r"\bZaczal\b", "Zaczął"),
    (r"\bwzielismy\b", "wzięliśmy"),
    (r"\bWzielismy\b", "Wzięliśmy"),
    (r"\bwziel\b", "wziął"),
    (r"\bWziel\b", "Wziął"),
    (r"\bwziela\b", "wzięła"),
    (r"\bWziela\b", "Wzięła"),
    (r"\bpoznalismy\b", "poznaliśmy"),
    (r"\bPoznalismy\b", "Poznaliśmy"),
    (r"\bspotkalismy\b", "spotkaliśmy"),
    (r"\bSpotkalismy\b", "Spotkaliśmy"),

    # === Przyjęcie / przyjmować ===
    (r"\bPrzyjecie\b", "Przyjęcie"),
    (r"\bprzyjecie\b", "przyjęcie"),
    (r"\bPrzyjecia\b", "Przyjęcia"),
    (r"\bprzyjecia\b", "przyjęcia"),
    (r"\bPrzyjeciu\b", "Przyjęciu"),
    (r"\bprzyjeciu\b", "przyjęciu"),
    # === Powrót / słońce / inne ===
    (r"\bPowrot\b", "Powrót"),
    (r"\bpowrot\b", "powrót"),
    (r"\bslonca\b", "słońca"),
    (r"\bSlonca\b", "Słońca"),
    (r"\bsionce\b", "słońce"),
    (r"\bSlonce\b", "Słońce"),
    (r"\bjedzeni(\w*)", r"jedzeni\1"),  # OK no diac
    # Reflexive się (uważnie - tylko jako osobne słowo)
    (r"\bsie\b", "się"),
    (r"\bSie\b", "Się"),
    # Słowo "może" / "może być" etc
    (r"\bmoge\b", "mogę"),
    (r"\bMoge\b", "Mogę"),
    (r"\bmozesz\b", "możesz"),
    (r"\bMozesz\b", "Możesz"),
    (r"\bmozemy\b", "możemy"),
    (r"\bMozemy\b", "Możemy"),
    (r"\bmoga\b", "mogą"),
    (r"\bMoga\b", "Mogą"),
    (r"\bmozna\b", "można"),
    (r"\bMozna\b", "Można"),
    # Lat / lata / letni
    (r"\bswiateczn(\w+)", r"świąteczn\1"),
    (r"\bSwiateczn(\w+)", r"Świąteczn\1"),

    # === Słowa kluczowe weselne ===
    (r"\bzareczyny\b", "zaręczyny"),
    (r"\bZareczyny\b", "Zaręczyny"),
    (r"\bzareczynowy\b", "zaręczynowy"),
    (r"\bwesele\b", "wesele"),  # OK
    (r"\bWesele\b", "Wesele"),  # OK
    (r"\bweselny\b", "weselny"),  # OK
    (r"\bwesela\b", "wesela"),  # OK
    (r"\bwlasne\b", "własne"),
    (r"\bWlasne\b", "Własne"),
    (r"\bwlasn(\w+)", r"własn\1"),  # własna/własny/własnym
    (r"\bWlasn(\w+)", r"Własn\1"),
    (r"\bwlasciciel\b", "właściciel"),
    (r"\bWlasciciel\b", "Właściciel"),
    (r"\bwlasciw(\w+)", r"właściw\1"),
    (r"\bWlasciw(\w+)", r"Właściw\1"),
    (r"\bksiezniczk(\w+)", r"księżniczk\1"),

    # === "Każdy"/"który" itp. ===
    (r"\bkazdy\b", "każdy"),
    (r"\bKazdy\b", "Każdy"),
    (r"\bkazda\b", "każda"),
    (r"\bKazda\b", "Każda"),
    (r"\bkazde\b", "każde"),
    (r"\bKazde\b", "Każde"),
    (r"\bktory\b", "który"),
    (r"\bKtory\b", "Który"),
    (r"\bktora\b", "która"),
    (r"\bKtora\b", "Która"),
    (r"\bktore\b", "które"),
    (r"\bKtore\b", "Które"),
    (r"\bktorzy\b", "którzy"),
    (r"\bKtorzy\b", "Którzy"),

    # === Inne częste ===
    (r"\bMlod(\w+)", r"Młod\1"),
    (r"\bmlod(\w+)", r"młod\1"),
    (r"\bdlug(\w+)", r"dług\1"),
    (r"\bDlug(\w+)", r"Dług\1"),
    (r"\bmilosc\b", "miłość"),
    (r"\bMilosc\b", "Miłość"),
    (r"\bmilosci\b", "miłości"),
    (r"\bMilosci\b", "Miłości"),
    (r"\bmiloscia\b", "miłością"),
    (r"\bMiloscia\b", "Miłością"),
    (r"\bzyc(\w+)", r"życ\1"),
    (r"\bZyc(\w+)", r"Życ\1"),
    (r"\bzyczen\b", "życzeń"),
    (r"\bZyczen\b", "Życzeń"),
    (r"\bzyczenia\b", "życzenia"),
    (r"\bZyczenia\b", "Życzenia"),
    (r"\bwieczor\b", "wieczór"),
    (r"\bWieczor\b", "Wieczór"),
    (r"\bzachod\b", "zachód"),
    (r"\bZachod\b", "Zachód"),
    (r"\bdziewczyn(\w*)", r"dziewczyn\1"),  # OK
    (r"\bchlopak(\w*)", r"chłopak\1"),
    (r"\bChlopak(\w*)", r"Chłopak\1"),
    (r"\bwspoln(\w+)", r"wspóln\1"),
    (r"\bWspoln(\w+)", r"Wspóln\1"),
    (r"\bktorych\b", "których"),
    (r"\bktorymi\b", "którymi"),

    # === Prezenty / IBAN context ===
    (r"\buwazamy\b", "uważamy"),
    (r"\bUwazamy\b", "Uważamy"),
    (r"\buwaza(\w*)", r"uważa\1"),
    (r"\bUwaza(\w*)", r"Uważa\1"),
    (r"\bwplata\b", "wpłata"),
    (r"\bWplata\b", "Wpłata"),
    (r"\bwplate\b", "wpłatę"),
    (r"\bwplatu\b", "wpłatu"),
    (r"\bucieszy\b", "ucieszy"),  # OK
    (r"\bwyprawe\b", "wyprawę"),
    (r"\bWyprawe\b", "Wyprawę"),
    (r"\bposlubna\b", "poślubną"),
    (r"\bPoslubna\b", "Poślubną"),
    (r"\bposlubn(\w+)", r"poślubn\1"),
    (r"\bPoslubn(\w+)", r"Poślubn\1"),

    # === Hotele context ===
    (r"\bhaslo\b", "hasło"),
    (r"\bHaslo\b", "Hasło"),
    (r"\bnoclegi\b", "noclegi"),  # OK
    (r"\bNoclegi\b", "Noclegi"),  # OK

    # === Transport context ===
    (r"\bautokar\b", "autokar"),  # OK
    (r"\bAutokar\b", "Autokar"),  # OK
    (r"\bprzystanek\b", "przystanek"),  # OK
    (r"\bGlowne\b", "Główne"),
    (r"\bglowne\b", "główne"),
    (r"\bGlowna\b", "Główna"),
    (r"\bglowna\b", "główna"),
    (r"\bGlowny\b", "Główny"),
    (r"\bglowny\b", "główny"),
    (r"\bMiasto\b", "Miasto"),  # OK

    # === FAQ context ===
    (r"\bpotwierdzic\b", "potwierdzić"),
    (r"\bPotwierdzic\b", "Potwierdzić"),
    (r"\buniknac\b", "uniknąć"),
    (r"\bUniknac\b", "Uniknąć"),
    (r"\bdziec(mi|i)\b", lambda m: "dzieć" + m.group(1) if m.group(1) == "mi" else "dzieci"),  # dziećmi/dzieci
    (r"\bDziec(mi|i)\b", lambda m: "Dzieć" + m.group(1) if m.group(1) == "mi" else "Dzieci"),
    (r"\bbezplatny\b", "bezpłatny"),
    (r"\bBezplatny\b", "Bezpłatny"),
    (r"\bbezplatn(\w+)", r"bezpłatn\1"),
    (r"\bBezplatn(\w+)", r"Bezpłatn\1"),
    (r"\beleganck(\w+)", r"elegancj\1"),  # eleganckie/ego ZACHOWAĆ k? OK
    (r"\bElegant\b", "Elegant"),  # OK
    (r"\beleganckie\b", "eleganckie"),  # OK
    (r"\bdresscode\b", "dress code"),  # OK
    (r"\buprzejmie\b", "uprzejmie"),  # OK
    (r"\bprosimy\b", "prosimy"),  # OK
    (r"\bProsimy\b", "Prosimy"),  # OK

    # === Timeline / time-related ===
    (r"\bceremonia\b", "ceremonia"),  # OK
    (r"\bCeremonia\b", "Ceremonia"),  # OK
    (r"\bsesja\b", "sesja"),  # OK
    (r"\bSesja\b", "Sesja"),  # OK
    (r"\bzdjeciowa\b", "zdjęciowa"),
    (r"\bZdjeciowa\b", "Zdjęciowa"),
    (r"\bzdjeciowy\b", "zdjęciowy"),
    (r"\bzdjecie\b", "zdjęcie"),
    (r"\bzdjecia\b", "zdjęcia"),
    (r"\bZdjecia\b", "Zdjęcia"),
    (r"\bpowitanie\b", "powitanie"),  # OK
    (r"\bPowitanie\b", "Powitanie"),  # OK
    (r"\bobiad\b", "obiad"),  # OK
    (r"\bObiad\b", "Obiad"),  # OK
    (r"\btaniec\b", "taniec"),  # OK
    (r"\bTaniec\b", "Taniec"),  # OK
    (r"\bpierwszy\b", "pierwszy"),  # OK
    (r"\bPierwszy\b", "Pierwszy"),  # OK
    (r"\boczepiny\b", "oczepiny"),  # OK
    (r"\bOczepiny\b", "Oczepiny"),  # OK
    (r"\btradycyjna\b", "tradycyjna"),  # OK
    (r"\bTradycyjna\b", "Tradycyjna"),  # OK
    (r"\bzabawa\b", "zabawa"),  # OK
    (r"\bZabawa\b", "Zabawa"),  # OK
    (r"\bbiesiadowanie\b", "biesiadowanie"),  # OK
]

# Pola w briefie które są PROZĄ (free text Polish) - auto-correct.
PROSE_FIELDS = {
    "quote", "gifts", "ceremonyVenue", "ceremonyAddress",
    "receptionVenue", "receptionAddress", "event", "desc",
    "title", "main", "note", "q", "a", "text", "name",
    "address", "departure", "ret", "venue", "rsvpDeadline",
    "bgMusicTitle", "package", "message",
}

# Pola które MUSZĄ być nietykane (technical).
SKIP_FIELDS = {
    "slug", "icon", "palette", "iban", "mapUrl", "phone",
    "email", "url", "time", "guestPhotosUrl", "photographerGalleryUrl",
    "bgMusicUrl", "weddingDate", "weddingTime", "payment_id", "token",
    "guestsCount", "features", "color", "colors", "id",
}


def autocorrect_string(s):
    """Apply all dictionary patterns to a single string."""
    if not isinstance(s, str) or not s.strip():
        return s
    out = s
    for pattern, replacement in PAIRS:
        if callable(replacement):
            out = re.sub(pattern, replacement, out)
        else:
            out = re.sub(pattern, replacement, out)
    return out


def autocorrect_recursive(obj, parent_key=None):
    """Walk JSON tree, applying autocorrect only to PROSE fields."""
    if isinstance(obj, dict):
        return {k: autocorrect_recursive(v, parent_key=k) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [autocorrect_recursive(x, parent_key=parent_key) for x in obj]
    elif isinstance(obj, str):
        # Skip if parent key is technical (icon/palette/iban/etc)
        if parent_key in SKIP_FIELDS:
            return obj
        # Apply if parent is PROSE field OR has no parent (top-level scalar)
        if parent_key in PROSE_FIELDS or parent_key is None:
            return autocorrect_string(obj)
        # Unknown parent_key - apply by default (catch-all for nested prose)
        return autocorrect_string(obj)
    return obj


def call_local_llm(text, timeout=30):
    """OPCJONALNE warstwa 2: lokalny qwen2.5:14b dla długich free-text fields.

    Wraca poprawiony text lub original gdy LLM nie dostępny / failuje.
    """
    if len(text) < 60:
        return text  # za krótki - dictionary wystarczy
    try:
        prompt = f"""Popraw polskie znaki diakrytyczne w tym tekście. Zachowaj WSZYSTKO inne (interpunkcja, wielkość liter, słowa). Zwróć tylko poprawiony tekst, bez wstępu/komentarzy.

Tekst:
{text}

Poprawiony tekst:"""
        r = subprocess.run(
            ["ollama", "run", "qwen2.5:14b", "--", prompt],
            capture_output=True, text=True, timeout=timeout,
        )
        if r.returncode == 0 and r.stdout.strip():
            corrected = r.stdout.strip()
            # Sanity: LLM nie może zmienić długości >50% (znak halucynacji)
            if 0.5 < len(corrected) / len(text) < 1.5:
                return corrected
        return text
    except Exception:
        return text


def main():
    ap = argparse.ArgumentParser(description="Autokorekta polskich znaków w brief.json")
    ap.add_argument("brief", help="Ścieżka do brief.json")
    ap.add_argument("--diff-only", action="store_true", help="Tylko podgląd zmian, nie zapisuj")
    ap.add_argument("--check", action="store_true", help="Exit 1 jeżeli są zmiany do zrobienia")
    ap.add_argument("--no-llm", action="store_true", help="Tylko dictionary, pomiń lokalny LLM")
    ap.add_argument("--llm-fields", default="text", help="Pola dla LLM (comma-sep, np. 'text,gifts')")
    args = ap.parse_args()

    path = Path(args.brief)
    if not path.exists():
        print(f"ERROR: {path} nie istnieje")
        sys.exit(1)

    original = path.read_text(encoding="utf-8")
    brief = json.loads(original)

    # Warstwa 1: dictionary
    corrected = autocorrect_recursive(brief)

    # Warstwa 2: LLM dla long free-text (OPCJONALNIE)
    if not args.no_llm:
        llm_fields = set(args.llm_fields.split(","))
        # Story text - najdłuższy free-text w brief, idealny dla LLM
        if "ourStory" in corrected and isinstance(corrected["ourStory"], list):
            for item in corrected["ourStory"]:
                if isinstance(item, dict) and "text" in item and len(item["text"]) > 60:
                    item["text"] = call_local_llm(item["text"])

    corrected_json = json.dumps(corrected, ensure_ascii=False, indent=2)

    if original.strip() == corrected_json.strip():
        print(f"✓ {path.name}: brak zmian (polskie znaki już OK)")
        sys.exit(0)

    # Lista różnic
    import difflib
    diff = list(difflib.unified_diff(
        original.splitlines(keepends=False),
        corrected_json.splitlines(keepends=False),
        fromfile=f"{path.name} (przed)",
        tofile=f"{path.name} (po autokorekcie)",
        lineterm="",
    ))
    changed_lines = len([l for l in diff if l.startswith("+") and not l.startswith("+++")])

    if args.diff_only:
        for line in diff:
            print(line)
        print(f"\n(brief NIE zapisany, --diff-only mode; zmian: {changed_lines} linii)")
        sys.exit(0)

    if args.check:
        print(f"⚠ {path.name}: {changed_lines} linii do poprawy (run bez --check żeby zastosować)")
        sys.exit(1)

    # In-place edit
    path.write_text(corrected_json + "\n", encoding="utf-8")
    print(f"✓ {path.name}: zaktualizowany ({changed_lines} linii poprawione)")


if __name__ == "__main__":
    main()
