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
    slug = brief["slug"]
    title = brief["bride"]
    if brief.get("groom"):
        title += f" i {brief['groom']}"
    date_pl = datetime.fromisoformat(brief["weddingDate"]).strftime("%d %B %Y")  # ENGLISH locale fallback
    title += f" - {date_pl}"

    theme = PALETTE_THEME.get(brief["palette"], "#35101D")
    subdomain = f"https://{slug}.zaproszeniaonline.com/"
    hero_photo = brief.get("photos", {}).get("heart", "")
    og_image = subdomain.rstrip("/") + (hero_photo if hero_photo else "/photos/01.jpg")

    html = re.sub(r"<title>.*?</title>", f"<title>{title}</title>", html)
    html = re.sub(
        r'<meta name="theme-color" content="#[0-9A-Fa-f]+">',
        f'<meta name="theme-color" content="{theme}">',
        html,
    )
    html = re.sub(
        r'<link rel="canonical" href="https://[^"]+">',
        f'<link rel="canonical" href="{subdomain}">',
        html,
    )
    html = re.sub(
        r'<meta property="og:url" content="https://[^"]+">',
        f'<meta property="og:url" content="{subdomain}">',
        html,
    )
    html = re.sub(
        r'<meta property="og:title" content="[^"]+">',
        f'<meta property="og:title" content="{title}">',
        html,
    )
    html = re.sub(
        r'<meta property="og:image" content="[^"]+">',
        f'<meta property="og:image" content="{og_image}">',
        html,
    )
    return html


def replace_invitation_slug(html: str, slug: str) -> str:
    return re.sub(
        r'const INVITATION_SLUG = "[^"]+";',
        f'const INVITATION_SLUG = "{slug}";',
        html,
    )


def add_vercel_rewrite(slug: str):
    """Dodaje host-based rewrite do vercel.json (idempotent)."""
    cfg = json.loads(VERCEL_JSON.read_text())
    host = f"{slug}.zaproszeniaonline.com"
    rewrites = cfg.setdefault("rewrites", [])
    # Skip jesli juz istnieje
    for r in rewrites:
        for h in r.get("has", []):
            if h.get("value") == host:
                print(f"  rewrite dla {host} juz istnieje - skip")
                return
    rewrites.append({
        "source": "/:path*",
        "has": [{"type": "host", "value": host}],
        "destination": f"/{slug}/:path*",
    })
    VERCEL_JSON.write_text(json.dumps(cfg, indent=4, ensure_ascii=False) + "\n")
    print(f"  + rewrite host={host} -> /{slug}/:path*")


def copy_photos(brief: dict, target_dir: Path, photos_src: Path | None):
    """Kopiuje zdjecia z photos_src do target_dir/photos/."""
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

    # 5. Git (opcjonalne)
    if not args.no_commit:
        subprocess.run(["git", "add", str(target), str(VERCEL_JSON)], cwd=ROOT, check=True)
        subprocess.run(
            ["git", "commit", "-m", f"feat({slug}): nowy klient {brief['bride']}" + (f" & {brief['groom']}" if brief.get("groom") else "")],
            cwd=ROOT, check=True,
        )
        subprocess.run(["git", "push", "origin", "main"], cwd=ROOT, check=True)
        print(f"  + git push OK")

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
