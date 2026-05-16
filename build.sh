#!/bin/bash
# Build pipeline — pre-compile JSX z demo.html + magda-tomek.html → /vendor/*.js
# Eliminuje Babel-in-browser (-2.87 MB transfer + ~1s LCP gain)
#
# Workflow:
#   Edytuj wedding-enhanced.jsx LUB inline JSX w demo.html
#   ./build.sh
#   git add -A && git commit && git push
# Vercel auto-deploy serwuje skompilowane /vendor/*.js zamiast text/babel + babel.min.js
#
# Wymagane: node + npx (esbuild instaluje się on-demand)

set -e
cd "$(dirname "$0")"

echo "🔧 Pre-compiling demo + magda JSX → /vendor/*.js..."
python3 <<'PY'
import re
import subprocess
from pathlib import Path

ROOT = Path(".").resolve()
VENDOR = ROOT / "vendor"
PAIRS = [
    ("demo.html", "demo-compiled.js"),
    ("magda-tomek.html", "magda-compiled.js"),
]

def extract_jsx(html):
    m = re.search(r'(<script type="text/babel"[^>]*>)(.*?)(</script>)', html, re.S)
    return (html[:m.start()], m.group(2), html[m.end():]) if m else None

for src_name, out_name in PAIRS:
    src_path = ROOT / src_name
    html = src_path.read_text()
    parts = extract_jsx(html)
    if not parts:
        # już skompilowane — szukamy <script defer src="/vendor/X-compiled.js">
        if f'/vendor/{out_name}' in html:
            print(f"  ⏭ {src_name}: już używa /vendor/{out_name} (skip)")
            continue
        print(f"  ⚠ {src_name}: nie znaleziono <script type=text/babel>")
        continue
    before, jsx, after = parts
    jsx_path = ROOT / f"_{src_name.replace('.html','')}.jsx"
    jsx_path.write_text(jsx)
    out_path = VENDOR / out_name
    print(f"  → {src_name}: {len(jsx):,} chars JSX → {out_name}...")
    r = subprocess.run([
        "npx", "--yes", "esbuild", str(jsx_path),
        "--target=es2020", "--minify", "--format=iife",
        f"--outfile={out_path}",
    ], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  ✗ esbuild: {r.stderr}")
        raise SystemExit(1)
    print(f"  ✓ {out_path.name}: {out_path.stat().st_size:,} bytes")
    new_html = before + f'<script defer src="/vendor/{out_name}"></script>' + after
    new_html = re.sub(r'<script defer src="/vendor/babel\.min\.js"></script>\s*\n?', '', new_html)
    src_path.write_text(new_html)
    jsx_path.unlink()

print("✓ Done. Babel.min.js eliminated.")
PY

echo ""
echo "✅ Build complete. Commit + push:"
echo "   git add -A && git commit -m 'rebuild compiled demos' && git push"
