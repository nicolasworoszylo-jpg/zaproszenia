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

# Vercel rewrite dla subdomeny w vercel.json
check "Vercel rewrite dla $CLIENT.zaproszeniaonline.com" "grep -q '$CLIENT.zaproszeniaonline.com' $ROOT/vercel.json"

# Photos folder
check "Folder photos/ ma jpg" "ls $ROOT/$CLIENT/photos/*.jpg 2>/dev/null | head -1"

# JS syntax check (esbuild output)
check "app.js valid JS" "node --check $APP 2>&1"

# JS contains key markers (CONFIG, ReactDOM.createRoot)
check "app.js zawiera ReactDOM.createRoot" "grep -q 'ReactDOM.createRoot' $APP"
check "app.js zawiera window.supabase" "grep -q 'window.supabase' $APP"

# HTML title nie jest domyslny demo
check "HTML title nie jest 'Anna i Michal'" "! grep -q '<title>Anna i Michał' $HTML"

# meta robots noindex (private demo)
check "HTML <meta robots noindex>" "grep -q 'robots.*noindex' $HTML"

echo ""
if [ $FAIL -gt 0 ]; then
  echo "PREFLIGHT FAIL: $FAIL problems - NIE deploy"
  exit 1
else
  echo "PREFLIGHT OK - gotowe do deploy"
  exit 0
fi
