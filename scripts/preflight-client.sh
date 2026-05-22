#!/usr/bin/env bash
# preflight-client.sh - Sanity checks PRZED deploy klienta
# Zapobiega ZNANYM bugom z sesji 2026-05-16/17/18 (cala lista w docs/BUGS_PREVENTED.md)
#
# Usage: bash scripts/preflight-client.sh <slug>
# Exit 0 = OK do deploy, exit 1 = ABORT

set -uo pipefail

SLUG="${1:-}"
if [ -z "$SLUG" ]; then
  echo "Usage: $0 <slug>"
  exit 1
fi

CLIENT="$SLUG"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/$CLIENT/index.html"
APP="$ROOT/$CLIENT/vendor/app.js"

cd "$ROOT"
FAIL=0

check() {
  local desc="$1"; local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  PASS: $desc"
  else
    echo "  FAIL: $desc"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Preflight: $CLIENT ==="

# Bug 1+2 (CSP): vendor self-host, brak unpkg
check "Brak unpkg.com w HTML" "! grep -q 'unpkg.com' $HTML"
check "Vendor lokalne: react.min.js" "[ -f $ROOT/$CLIENT/vendor/react.min.js ]"
check "Vendor lokalne: react-dom.min.js" "[ -f $ROOT/$CLIENT/vendor/react-dom.min.js ]"
check "Vendor lokalne: supabase.min.js" "[ -f $ROOT/$CLIENT/vendor/supabase.min.js ]"
check "Vendor lokalne: app.js (esbuild)" "[ -f $APP ]"

# Bug 5 (paths absolutne z slug)
check "HTML: src=\"/$CLIENT/vendor/app.js\"" "grep -q 'src=\"/$CLIENT/vendor/app.js\"' $HTML"
check "HTML: href=\"/$CLIENT/fonts/" "grep -q 'href=\"/$CLIENT/fonts/' $HTML"

# Bug 2 (CSP googleapis fonts)
check "Self-host fonty: fonts.css" "[ -f $ROOT/$CLIENT/fonts/fonts.css ]"
check "Self-host fonty: playfair.woff2" "[ -f $ROOT/$CLIENT/fonts/playfair.woff2 ]"
check "Brak fonts.googleapis w HTML" "! grep -q 'fonts.googleapis' $HTML"
check "Brak fonts.googleapis w app.js" "! grep -q 'fonts.googleapis' $APP"

# Bug 3 (Supabase CDN path - aktualnie self-host wiec skip CDN)
check "Supabase global window.supabase" "grep -q 'globalThis' $ROOT/$CLIENT/vendor/supabase.min.js"

# Bug 6 (Gallery wyciety jezeli brief.features no gallery)
# (skip - kontekstowy)

# Subdomain routing - OPCJA A: middleware.js (Edge Middleware, dynamiczny per host)
# LUB OPCJA B: per-slug rewrite w vercel.json (legacy, dla starych klientow).
# Middleware.js obsluguje *.zaproszeniaonline.com globalnie - per-slug rewrite NIE potrzebny.
check "Subdomain routing dla $CLIENT.zaproszeniaonline.com (middleware OR vercel.json)" \
  "grep -q '@vercel/edge' $ROOT/middleware.js 2>/dev/null || grep -q '$CLIENT.zaproszeniaonline.com' $ROOT/vercel.json"

# Photos: lokalne (OPCJA A) LUB Supabase CDN (OPCJA B)
PHOTOS_LOCAL=0
PHOTOS_CDN=0
if [ -d "$ROOT/$CLIENT/photos" ] && ls "$ROOT/$CLIENT/photos/"*.jpg >/dev/null 2>&1; then
  PHOTOS_LOCAL=1
fi
if grep -qE 'https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/[^"'\'']+\.(jpg|jpeg|png|webp|avif)' "$HTML" "$APP" 2>/dev/null; then
  PHOTOS_CDN=1
fi
if [ "$PHOTOS_LOCAL" -eq 1 ]; then
  echo "  PASS: Folder photos/ ma jpg (OPCJA A - lokalne)"
elif [ "$PHOTOS_CDN" -eq 1 ]; then
  echo "  PASS: Photos via Supabase CDN (OPCJA B - URL absolutne)"
else
  echo "  FAIL: Brak zdjec - ani lokalne photos/ ani URL Supabase w HTML/app.js"
  FAIL=$((FAIL+1))
fi

# JS syntax check (esbuild output)
check "app.js valid JS" "node --check $APP 2>&1"

# JS contains key markers (CONFIG, ReactDOM.createRoot)
check "app.js zawiera ReactDOM.createRoot" "grep -q 'ReactDOM.createRoot' $APP"
check "app.js zawiera window.supabase" "grep -q 'window.supabase' $APP"

# HTML title nie jest domyslny demo
check "HTML title nie jest 'Anna i Michal'" "! grep -q '<title>Anna i Michał' $HTML"

# meta robots noindex (private demo)
check "HTML <meta robots noindex>" "grep -q 'robots.*noindex' $HTML"

# Timeline icons - kazda ikona w brief.timeline musi byc w TLIcons (inaczej puste kolko).
# Lista ikon wspieranych w template (synchronizuj jezeli dodajesz nowe w _template_klient/index.html#TLIcons):
SUPPORTED_ICONS="church camera dinner cake party cocktail dance ring heart music toast car star diamond"
BRIEF_JSON="$ROOT/briefs/$CLIENT.json"
if [ -f "$BRIEF_JSON" ]; then
  UNKNOWN_ICONS=$(python3 -c "
import json, sys
brief = json.load(open('$BRIEF_JSON'))
supported = set('$SUPPORTED_ICONS'.split())
unknown = []
for item in brief.get('timeline', []):
    icon = item.get('icon', '')
    if icon and icon not in supported:
        unknown.append(f\"{item.get('time','?')}={icon}\")
print(' '.join(unknown))
")
  if [ -n "$UNKNOWN_ICONS" ]; then
    echo "  FAIL: Timeline icons spoza listy: $UNKNOWN_ICONS"
    echo "        Wspierane: $SUPPORTED_ICONS"
    echo "        Albo dodaj ikone do _template_klient/index.html#TLIcons + tu w SUPPORTED_ICONS"
    echo "        Albo zmien icon w brief.json na wspierana (np. 'dance'->'party', 'cocktail'->'toast')"
    FAIL=$((FAIL+1))
  else
    echo "  PASS: Timeline icons - wszystkie wspierane (lub timeline pusty)"
  fi
else
  echo "  WARN: brak brief.json - skip timeline icons check (regen z lokalu)"
fi


# Audio URL validator - bgMusicUrl MUSI byc bezposrednim linkiem do pliku audio
# (.mp3/.ogg/.wav/.m4a), NIE linkiem do strony (Pixabay/Spotify/YouTube). Bez tego
# <audio src=link-do-strony> daje "MEDIA_ELEMENT_ERROR: Format error" i muzyka NIE gra.
if [ -f "$BRIEF_JSON" ]; then
  AUDIO_CHECK=$(python3 -c "
import json
brief = json.load(open('$BRIEF_JSON'))
url = brief.get('bgMusicUrl', '') or ''
if not url:
    print('SKIP')
elif url.lower().endswith(('.mp3','.ogg','.wav','.m4a','.aac','.flac')):
    print('OK')
else:
    print(f'BAD:{url[:80]}')
")
  case "$AUDIO_CHECK" in
    SKIP) echo "  PASS: bgMusicUrl pusty (skip - opcjonalne)" ;;
    OK)   echo "  PASS: bgMusicUrl wskazuje na plik audio (mp3/ogg/wav/m4a)" ;;
    BAD:*)
      echo "  FAIL: bgMusicUrl NIE jest bezposrednim plikiem audio: ${AUDIO_CHECK#BAD:}"
      echo "        Klient wpisal link do strony - browser zwroci 'Format error' i muzyka NIE zagra."
      echo "        Wymagaj od klienta: link konczacy sie .mp3/.ogg/.wav/.m4a (np. Pixabay download URL,"
      echo "        nie strona Pixabay). Albo wlasny upload do Supabase Storage."
      FAIL=$((FAIL+1))
      ;;
  esac
fi

echo ""
if [ $FAIL -gt 0 ]; then
  echo "PREFLIGHT FAIL: $FAIL problems - NIE deploy"
  exit 1
else
  echo "PREFLIGHT OK - gotowe do deploy"
  exit 0
fi
