#!/usr/bin/env python3
"""
new-client.py - Generator klienta zaproszeniaonline.com

Workflow:
  1. Czyta brief JSON
  2. Kopiuje _template_klient/ -> <slug>/
  3. Podmienia placeholdery (dane personalne + paleta + zdjecia)
  4. Updatuje vercel.json (dodaje host-based rewrite dla subdomeny)
  5. Wyswietla instrukcje DNS dla Nicolasa

Uzycie:
  python3 scripts/new-client.py brief.json
  python3 scripts/new-client.py brief.json --no-commit  # tylko pliki, bez git
  python3 scripts/new-client.py brief.json --photos /sciezka/do/zdjec/

Brief.json przyklad:
  {
    "slug": "anna-michal",
    "bride": "Anna",
    "groom": "Michał",
    "weddingDate": "2026-06-20T15:00:00",
    "rsvpDeadline": "20 maja 2026",
    "quote": "Cytat...",
    "palette": "bordo",
    "ceremony": {"venue":"Kosciol X", "address":"...", "time":"15:00", "title":"Ceremonia"},
    "reception": {"venue":"Palac Y", "address":"...", "time":"17:00", "title":"Przyjecie"},
    "timeline": [{"time":"15:00","event":"...","desc":"...","icon":"church"}],
    "ourStory": [],
    "dressCode": {"main":"...", "note":"...", "colors":["#aaa","#bbb"]},
    "gifts": "...",
    "accounts": [{"holder":"...", "iban":"..."}],
    "guestsCount": 100,
    "features": ["rsvp","countdown","timeline","maps","gifts","music","qr"]
  }
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "_template_klient"
VERCEL_JSON = ROOT / "vercel.json"

PALETTE_IDX = {"forest": 0, "navy": 1, "bordo": 2, "terracotta": 3}
PALETTE_THEME = {
    "forest": "#1E2B1F",
    "navy": "#111D2B",
    "bordo": "#35101D",
    "terracotta": "#4A1E15",
}

# Polskie miesiące w dopełniaczu (np. "16 lipca 2026") - lokalniezalezne mapowanie.
# Powod: strftime("%B") zwraca angielskie nazwy gdy locale=C (default GitHub runners + Vercel build).
PL_MONTHS = {
    1: "stycznia", 2: "lutego", 3: "marca", 4: "kwietnia",
    5: "maja", 6: "czerwca", 7: "lipca", 8: "sierpnia",
    9: "wrzesnia", 10: "pazdziernika", 11: "listopada", 12: "grudnia",
}


def polish_date(iso: str) -> str:
    """ISO date -> '16 lipca 2026'. Akceptuje 'YYYY-MM-DD' i 'YYYY-MM-DDTHH:MM:SS'."""
    d = datetime.fromisoformat(iso)
    return f"{d.day} {PL_MONTHS[d.month]} {d.year}"


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-")
    return re.sub(r"-+", "-", s)


def replace_config(html: str, brief: dict) -> str:
    """Podmienia caly blok CONFIG = {...} na nowy z brief.json."""
    slug = brief["slug"]
    # Helper - auto-prefix slug do paths z 'photos/' (anti-trailing-slash-bug)
    def abs_photo(path):
        if not path: return path
        if path.startswith("/") or path.startswith("http"): return path
        return f"/{slug}/{path}"
    heart = abs_photo(brief.get("photos", {}).get("heart"))
    side = [abs_photo(p) for p in brief.get("photos", {}).get("side", [])]
    # Buduj CONFIG JSON string z brief
    config = {
        "bride": brief["bride"],
        "groom": brief.get("groom", ""),
        "weddingDate": f'new Date("{brief["weddingDate"]}")',  # specjalna wartosc - bez quotes po sub
        "quote": brief["quote"],
        "rsvpDeadline": brief["rsvpDeadline"],
        "ceremony": brief["ceremony"],
        "reception": brief["reception"],
        "timeline": brief["timeline"],
        "ourStory": brief.get("ourStory", []),
        "ourStoryHeartPhoto": heart,
        "ourStoryPhotos": side,
        "dressCode": brief["dressCode"],
        "transport": brief.get("transport", {"departure": "-", "ret": "-"}),
        "hotels": brief.get("hotels", []),
        "faq": brief.get("faq", [{"q": "Do kiedy potwierdzic?", "a": f"Do {brief['rsvpDeadline']}."}]),
        "gifts": brief["gifts"],
        "accounts": brief["accounts"],
        "guestPhotosUrl": brief.get("guestPhotosUrl", ""),
        "photographerGalleryUrl": brief.get("photographerGalleryUrl", ""),
        "bgMusicUrl": brief.get("bgMusicUrl"),
        "bgMusicTitle": brief.get("bgMusicTitle", "Wasza piosenka"),
        "venueBrand": "zaproszeniaonline.com",
        "venueUrl": "https://zaproszeniaonline.com/",
        "calendarTitle": f"Slub - {brief['bride']}" + (f" & {brief['groom']}" if brief.get("groom") else ""),
        "calendarLocation": brief["reception"]["venue"],
        "guestsCount": brief.get("guestsCount", 0),
    }
    # JSON dump z escapingiem unicode false (zachowuje polskie znaki)
    config_str = json.dumps(config, ensure_ascii=False, indent=2)
    # Unescape sentinel weddingDate (chcemy `new Date(...)` jako JS expression, nie string)
    config_str = config_str.replace(
        f'"new Date(\\"{brief["weddingDate"]}\\")"',
        f'new Date("{brief["weddingDate"]}")',
    )

    # Podmien blok `const CONFIG = {...};` (multiline, az do `};` w pierwszej kolumnie)
    pattern = re.compile(r"const CONFIG = \{.*?\n\};", re.DOTALL)
    return pattern.sub(f"const CONFIG = {config_str};", html, count=1)


def replace_palette(html: str, palette: str) -> str:
    idx = PALETTE_IDX.get(palette, 2)  # default bordo
    return re.sub(
        r"const C = \{ \.\.\.PALETTES\[\d+\] \};.*$",
        f"const C = {{ ...PALETTES[{idx}] }};  // klient lock - {palette}",
        html,
        count=1,
        flags=re.MULTILINE,
    )


def replace_meta(html: str, brief: dict) -> str:
    """Podmienia caly meta-blok (title + 9 meta tagow) na dynamiczne wartosci z briefu.

    Naprawia 2 stare bugi:
      - bug 1: '16 July 2026' (angielski miesiac z strftime+C locale) -> '16 lipca 2026'
      - bug 2: meta description/og:description/twitter zostawaly default z templatu (czesto
              ze starego klienta 'nicolas-test') zamiast aktualnego briefu - teraz wszystko
              renderowane z parametrow.
    """
    slug = brief["slug"]
    palette = brief["palette"]

    # Pelne 'imie pary' - 'Anna' + ' i Michal' albo 'Nicolas i Dominika' (single-name pattern).
    couple = brief["bride"]
    if brief.get("groom"):
        couple += f" i {brief['groom']}"

    date_pl = polish_date(brief["weddingDate"])
    title_full = f"{couple} - {date_pl}"

    # Description: dluga (search engines) + krotka (social cards).
    # ASCII-only zgodnie z konwencja templatu (zaproszenie 'slubne' bez polskich znakow w meta).
    desc_long = f"Cyfrowe zaproszenie slubne {couple} - {date_pl}. Paleta {palette}, RSVP, plan dnia, mapy."
    desc_short = f"Cyfrowe zaproszenie slubne {couple} - {date_pl}."
    site_name = f"{couple} - zaproszenie slubne"

    theme = PALETTE_THEME.get(palette, "#35101D")
    subdomain = f"https://{slug}.zaproszeniaonline.com/"
    hero_photo = brief.get("photos", {}).get("heart", "")
    if hero_photo and hero_photo.startswith("http"):
        og_image = hero_photo  # absolutny URL (Supabase Storage CDN)
    else:
        og_image = subdomain.rstrip("/") + (hero_photo if hero_photo else "/photos/01.jpg")

    # 10 podmian (idempotent przez konkretne regexy + jedna podmiana per tag).
    substitutions = [
        (r"<title>.*?</title>", f"<title>{title_full}</title>"),
        (r'<meta name="description" content="[^"]+">',
         f'<meta name="description" content="{desc_long}">'),
        (r'<meta name="theme-color" content="#[0-9A-Fa-f]+">',
         f'<meta name="theme-color" content="{theme}">'),
        (r'<link rel="canonical" href="https://[^"]+">',
         f'<link rel="canonical" href="{subdomain}">'),
        (r'<meta property="og:site_name" content="[^"]+">',
         f'<meta property="og:site_name" content="{site_name}">'),
        (r'<meta property="og:url" content="https://[^"]+">',
         f'<meta property="og:url" content="{subdomain}">'),
        (r'<meta property="og:title" content="[^"]+">',
         f'<meta property="og:title" content="{title_full}">'),
        (r'<meta property="og:description" content="[^"]+">',
         f'<meta property="og:description" content="{desc_short}">'),
        (r'<meta property="og:image" content="[^"]+">',
         f'<meta property="og:image" content="{og_image}">'),
        (r'<meta name="twitter:title" content="[^"]+">',
         f'<meta name="twitter:title" content="{title_full}">'),
        (r'<meta name="twitter:description" content="[^"]+">',
         f'<meta name="twitter:description" content="{desc_short}">'),
        (r'<meta name="twitter:image" content="[^"]+">',
         f'<meta name="twitter:image" content="{og_image}">'),
    ]
    for pattern, replacement in substitutions:
        html = re.sub(pattern, replacement, html)
    return html


def replace_invitation_slug(html: str, slug: str) -> str:
    return re.sub(
        r'const INVITATION_SLUG = "[^"]+";',
        f'const INVITATION_SLUG = "{slug}";',
        html,
    )


def add_vercel_rewrite(slug: str):
    """Dodaje host-based rewrite do vercel.json (idempotent).

    UWAGA: Vercel rewrite source musi byc regex `/(.*)` z `$1` capture, NIE named param
    `/:path*`. Powod: `:path*` nie matchuje root request `/` (pusty path), wiec subdomena
    root pokazywala landing zaproszeniaonline.com zamiast strony klienta. `(.*)` jest
    deterministyczne i matchuje takze pusty path. Patrz: nicolas-test rewrite (dziala) vs
    nicolas-i-dominika-2026-07 (przed fix - root nie dzialal).
    """
    cfg = json.loads(VERCEL_JSON.read_text())
    host = f"{slug}.zaproszeniaonline.com"
    rewrites = cfg.setdefault("rewrites", [])
    # Idempotency + auto-upgrade starego wzorca: znajdz po host, normalizuj na (.*) + $1.
    for r in rewrites:
        for h in r.get("has", []):
            if h.get("value") == host:
                # Auto-fix legacy `:path*` wzorca na bezpieczne `(.*)` + $1.
                if r.get("source") != "/(.*)" or r.get("destination") != f"/{slug}/$1":
                    r["source"] = "/(.*)"
                    r["destination"] = f"/{slug}/$1"
                    VERCEL_JSON.write_text(json.dumps(cfg, indent=4, ensure_ascii=False) + "\n")
                    print(f"  ~ rewrite dla {host} zaktualizowany na /(.*) + $1")
                else:
                    print(f"  rewrite dla {host} juz istnieje - skip")
                return
    rewrites.append({
        "source": "/(.*)",
        "has": [{"type": "host", "value": host}],
        "destination": f"/{slug}/$1",
    })
    VERCEL_JSON.write_text(json.dumps(cfg, indent=4, ensure_ascii=False) + "\n")
    print(f"  + rewrite host={host} -> /{slug}/$1")


def copy_photos(brief: dict, target_dir: Path, photos_src: Path | None):
    """Kopiuje zdjecia z photos_src do target_dir/photos/.

    Jesli brief.json zawiera URL absolutne (https://... - np. z Supabase Storage)
    zamiast relative paths (photos/01.jpg), pomijamy kopiowanie - strona uzywa
    URL bezposrednio z CDN. Patrz [[photos-integration-decision-pending]] OPCJA B.
    """
    photos_obj = brief.get("photos", {})
    all_urls = [photos_obj.get("heart", "")] + photos_obj.get("side", [])
    if any(p.startswith("http") for p in all_urls if p):
        print("  + zdjecia z URL (Supabase) - pomijam copy_photos")
        return

    photos_target = target_dir / "photos"
    photos_target.mkdir(exist_ok=True)
    src = photos_src or Path("photos_input")  # default: ./photos_input/
    if not src.exists():
        print(f"  ⚠ Brak folderu zdjec {src} - pomijam (heart/side beda placeholders)")
        return
    for f in src.glob("*.jpg"):
        shutil.copy(f, photos_target / f.name)
    for f in src.glob("*.jpeg"):
        shutil.copy(f, photos_target / f.name)
    for f in src.glob("*.png"):
        shutil.copy(f, photos_target / f.name)
    n = len(list(photos_target.glob("*")))
    print(f"  + skopiowano {n} zdjec z {src}")


def main():
    ap = argparse.ArgumentParser(description="Generator klienta zaproszeniaonline.com")
    ap.add_argument("brief", type=Path, help="brief.json klienta")
    ap.add_argument("--photos", type=Path, help="folder ze zdjeciami (default: photos_input/)")
    ap.add_argument("--no-commit", action="store_true", help="Tylko pliki, bez git commit/push")
    args = ap.parse_args()

    brief = json.loads(args.brief.read_text(encoding="utf-8"))
    slug = brief["slug"] = slugify(brief["slug"])
    print(f"=== Generuje klienta: {slug} ===")

    # 1. Kopiuj template -> slug/
    target = ROOT / slug
    if target.exists():
        print(f"  ⚠ {target} juz istnieje - usuwam i nadpisuje")
        shutil.rmtree(target)
    shutil.copytree(TEMPLATE, target)
    # Usun example photos z templatu
    example_photos = target / "photos.example"
    if example_photos.exists():
        shutil.rmtree(example_photos)
    print(f"  + kopia templatu -> {slug}/")

    # 2. Zdjecia
    copy_photos(brief, target, args.photos)

    # 3. Podmienia kod HTML (inline JSX)
    html_path = target / "index.html"
    html = html_path.read_text(encoding="utf-8")
    html = replace_config(html, brief)
    html = replace_palette(html, brief["palette"])
    html = replace_meta(html, brief)
    html = replace_invitation_slug(html, slug)
    html_path.write_text(html, encoding="utf-8")
    print(f"  + podmieniono CONFIG + paleta={brief['palette']} + meta + slug")

    # 4. Pre-compile JSX (esbuild) -> vendor/app.js + swap script tag
    extract_pat = re.compile(r'(<script type="text/babel"[^>]*>)(.*?)(</script>)', re.S)
    m = extract_pat.search(html)
    if m:
        jsx = m.group(2)
        jsx_path = target / "_app.jsx"
        jsx_path.write_text(jsx, encoding="utf-8")
        app_js = target / "vendor" / "app.js"
        r = subprocess.run(
            ["npx", "--yes", "esbuild", str(jsx_path),
             "--target=es2020", "--minify", "--format=iife",
             f"--outfile={app_js}"],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            print(f"  ✗ esbuild error: {r.stderr}")
            sys.exit(1)
        jsx_path.unlink()
        # Swap inline script -> compiled (absolute path z slugiem - URL bez trailing slash safe)
        html = extract_pat.sub(f'<script defer src="/{slug}/vendor/app.js"></script>', html)
        # Konwertuj relatywne paths na absolute z slug prefix (anti-trailing-slash-bug)
        html = html.replace('src="vendor/', f'src="/{slug}/vendor/')
        html = html.replace('href="fonts/', f'href="/{slug}/fonts/')
        html = html.replace('href="photos/', f'href="/{slug}/photos/')
        html_path.write_text(html, encoding="utf-8")
        print(f"  + esbuild JSX -> /{slug}/vendor/app.js ({app_js.stat().st_size:,} bytes) + absolute paths")
    else:
        print(f"  ⚠ Brak inline JSX w template - skip esbuild")

    # 5. Vercel rewrite
    add_vercel_rewrite(slug)

    # 5. PREFLIGHT - sanity checks PRZED commit (catch 12+ known bugs)
    print()
    print("=== Pre-flight checks ===")
    pre = subprocess.run(["bash", "scripts/preflight-client.sh", slug], cwd=ROOT)
    if pre.returncode != 0:
        print(f"  ABORT: preflight FAIL - fix issues + retry. Klient {slug} NIE wdrozony.")
        sys.exit(1)

    # 6. Git commit + push
    if not args.no_commit:
        subprocess.run(["git", "add", str(target), str(VERCEL_JSON)], cwd=ROOT, check=True)
        bride_groom = brief['bride'] + (f" & {brief['groom']}" if brief.get("groom") else "")
        body = f"\n\nCo: nowy klient {bride_groom} ({slug}.zaproszeniaonline.com)\nCzemu: order po platnosci Stripe\nTest: preflight passed + smoke test po deploy"
        subprocess.run(
            ["git", "commit", "-m", f"feat({slug}): nowy klient {bride_groom}{body}"],
            cwd=ROOT, check=True,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=ROOT, check=True)
        print(f"  + git push OK")

        # 7. OVH DNS (jezeli wildcard nie istnieje - skrypt sam sprawdza idempotent)
        print()
        print("=== OVH DNS (auto) ===")
        ovh = subprocess.run(["bash", "scripts/ovh-dns-add.sh", slug], cwd=ROOT)
        if ovh.returncode != 0:
            print(f"  WARN: OVH DNS issue - sprawdz recznie. Path-based URL dziala niezaleznie.")

        # 8. Wait + smoke test po Vercel deploy
        print()
        print("=== Wait 35s na Vercel deploy ===")
        import time
        time.sleep(35)
        print()
        print("=== Smoke test ===")
        subprocess.run(["bash", "scripts/smoke-test-client.sh", slug], cwd=ROOT)

    # 6. Instrukcje
    print()
    print("=" * 70)
    print(f"✓ Klient {slug} gotowy.")
    print()
    print("URL natychmiast dziala (path-based, bez DNS):")
    print(f"  https://zaproszeniaonline.com/{slug}/")
    print()
    print(f"URL docelowy (subdomena - wymaga DNS w OVH):")
    print(f"  https://{slug}.zaproszeniaonline.com/")
    print()
    print(f"Aby uruchomic subdomene - opcja A (raz na zawsze, dla wszystkich klientow):")
    print(f"  1. OVH Manager -> {slug}.zaproszeniaonline.com -> DNS Zone")
    print(f"  2. Add CNAME: '*' -> 'cname.vercel-dns.com.' (wildcard)")
    print(f"  3. Vercel: vercel domains add '*.zaproszeniaonline.com'")
    print()
    print(f"Opcja B (per klient):")
    print(f"  1. OVH: A '{slug}' -> '76.76.21.21'")
    print(f"  2. Vercel: vercel domains add '{slug}.zaproszeniaonline.com'")
    print(f"  3. Czekaj 15-60 min na DNS propagacje")
    print("=" * 70)


if __name__ == "__main__":
    main()
