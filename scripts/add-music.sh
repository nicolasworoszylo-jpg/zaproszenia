#!/usr/bin/env bash
# add-music.sh - integruje utwor muzyczny z demo (i opcjonalnie magda-tomek)
#
# Workflow:
#   bash scripts/add-music.sh ~/Downloads/utwor.mp3 "Nasza piosenka" [--target=demo|magda|both]
#
# Co robi:
#   1. Walidacja pliku (czy istnieje, czy audio)
#   2. ffmpeg encode: 96 kbps mono 44.1 kHz + fade in/out 0.5s/1s (gladki loop)
#   3. Output: audio/<target>.mp3
#   4. Update wedding-enhanced.jsx (bgMusicUrl + bgMusicTitle)
#   5. esbuild rebuild vendor/demo-compiled.js
#   6. Print git diff + sugeruje commit message
#
# Wymagane: ffmpeg (brew install ffmpeg), npx esbuild (auto-instaluje)

set -e

# ── Args ─────────────────────────────────────────────────────────────
INPUT_FILE="${1:-}"
TITLE="${2:-Nasza piosenka}"
TARGET="demo"
BITRATE="96k"
SAMPLE_RATE="44100"
CHANNELS="1"  # mono dla bg music

# Parsowanie --target=X (3-ci arg opcjonalnie)
for arg in "$@"; do
  case "$arg" in
    --target=demo) TARGET="demo" ;;
    --target=magda) TARGET="magda" ;;
    --target=both) TARGET="both" ;;
    --bitrate=*) BITRATE="${arg#*=}" ;;
    --stereo) CHANNELS="2" ;;
  esac
done

if [ -z "$INPUT_FILE" ] || [ ! -f "$INPUT_FILE" ]; then
  echo "Uzycie: bash scripts/add-music.sh <input-audio-file> [\"Tytul utworu\"] [--target=demo|magda|both] [--stereo] [--bitrate=128k]"
  echo ""
  echo "Przyklady:"
  echo "  bash scripts/add-music.sh ~/Downloads/song.mp3"
  echo "  bash scripts/add-music.sh ~/Downloads/song.mp3 \"Nasza piosenka\""
  echo "  bash scripts/add-music.sh ~/Downloads/song.mp3 \"Tytul\" --target=both --bitrate=128k --stereo"
  exit 1
fi

# Cd do repo root
cd "$(dirname "$0")/.."

# ── Sprawdz ffmpeg ───────────────────────────────────────────────────
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "BLAD: ffmpeg nie zainstalowany."
  echo "Zainstaluj: brew install ffmpeg"
  exit 1
fi

# ── Kolory ───────────────────────────────────────────────────────────
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'

# ── Info o pliku ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " add-music.sh - integracja muzyki z demo"
echo "═══════════════════════════════════════════════════════════"
echo ""

INPUT_SIZE=$(stat -f%z "$INPUT_FILE" 2>/dev/null || stat -c%s "$INPUT_FILE" 2>/dev/null)
INPUT_SIZE_MB=$(echo "scale=2; $INPUT_SIZE / 1048576" | bc)
INPUT_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_FILE" 2>/dev/null | awk '{printf "%d", $1}')

echo -e "${C}Plik wejsciowy:${N} $INPUT_FILE"
echo -e "${C}Rozmiar:${N} ${INPUT_SIZE_MB} MB"
echo -e "${C}Dlugosc:${N} ${INPUT_DURATION}s"
echo -e "${C}Target:${N} $TARGET"
echo -e "${C}Encode:${N} ${BITRATE} ${CHANNELS}ch ${SAMPLE_RATE}Hz + fade 0.5s/1s"
echo ""

# ── Encode ────────────────────────────────────────────────────────────
encode_target() {
  local target="$1"
  local out_path="audio/${target}.mp3"

  echo -e "${Y}>>${N} Encoding -> $out_path ..."

  # Fade in 0.5s + fade out 1s (smooth loop), bitrate optimized
  # afade=t=in:st=0:d=0.5  -> fade in 0.5s
  # afade=t=out:st=$(D-1):d=1  -> fade out ostatnia 1s
  local fade_out_start=$(echo "$INPUT_DURATION - 1" | bc)

  ffmpeg -hide_banner -loglevel error -y \
    -i "$INPUT_FILE" \
    -af "afade=t=in:st=0:d=0.5,afade=t=out:st=${fade_out_start}:d=1,aformat=channel_layouts=$(if [ "$CHANNELS" = "1" ]; then echo "mono"; else echo "stereo"; fi)" \
    -ar "$SAMPLE_RATE" -ac "$CHANNELS" -b:a "$BITRATE" -codec:a libmp3lame \
    "$out_path"

  local out_size=$(stat -f%z "$out_path" 2>/dev/null || stat -c%s "$out_path" 2>/dev/null)
  local out_size_mb=$(echo "scale=2; $out_size / 1048576" | bc)
  local savings=$(echo "scale=0; 100 - ($out_size * 100 / $INPUT_SIZE)" | bc)

  echo -e "${G}OK${N} $out_path: ${out_size_mb} MB (${savings}% mniej niz oryginal)"
}

case "$TARGET" in
  demo) encode_target "demo" ;;
  magda) encode_target "magda" ;;
  both) encode_target "demo"; encode_target "magda" ;;
esac

# ── Update wedding-enhanced.jsx ────────────────────────────────────────
echo ""
echo -e "${Y}>>${N} Update wedding-enhanced.jsx ..."

if [ "$TARGET" = "demo" ] || [ "$TARGET" = "both" ]; then
  # Sed dla bgMusicUrl (z null lub aktualnego URL -> nowy)
  # Pattern: 'bgMusicUrl: null,' lub 'bgMusicUrl: "/audio/X.mp3",'
  python3 <<PY
import re
from pathlib import Path
p = Path("wedding-enhanced.jsx")
s = p.read_text()
# Replace bgMusicUrl
s = re.sub(r'bgMusicUrl: (null|"[^"]*"),', f'bgMusicUrl: "/audio/demo.mp3",', s, count=1)
# Replace bgMusicTitle
s = re.sub(r'bgMusicTitle: "[^"]*",', f'bgMusicTitle: "$TITLE",', s, count=1)
p.write_text(s)
print(f"  - bgMusicUrl: /audio/demo.mp3")
print(f"  - bgMusicTitle: $TITLE")
PY
fi

# ── Rebuild vendor/demo-compiled.js ───────────────────────────────────
echo ""
echo -e "${Y}>>${N} Rebuild vendor/demo-compiled.js ..."

if npx --yes esbuild wedding-enhanced.jsx --target=es2020 --minify --format=iife --outfile=vendor/demo-compiled.js 2>&1 | tail -3; then
  echo -e "${G}OK${N} vendor/demo-compiled.js"
else
  echo -e "${R}BLAD${N} esbuild failed"
  exit 1
fi

# ── Status + sugestia commit ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${G}GOTOWE${N}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Zmienione pliki:"
git status --short audio/ wedding-enhanced.jsx vendor/demo-compiled.js 2>/dev/null
echo ""
echo "Aby zatwierdzic:"
echo "  cd $(pwd)"
echo "  git add audio/ wedding-enhanced.jsx vendor/demo-compiled.js"
echo "  git commit -m 'feat(demo): muzyka w tle - $TITLE'"
echo "  git push origin main"
echo ""
echo "Albo odpal wszystko za jednym zamachem:"
echo "  bash scripts/add-music.sh <plik> \"$TITLE\" && git add -A && git commit -m 'feat(demo): muzyka' && git push"
