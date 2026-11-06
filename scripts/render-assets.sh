#!/usr/bin/env bash
# Regenerates the social cards and app icons from the HTML sources in scripts/.
# Requires a local Chrome/Chromium (set CHROME=/path/to/chrome to override).
set -euo pipefail

cd "$(dirname "$0")/.."
CHROME="${CHROME:-google-chrome}"

shot() { # url width height out background
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-sandbox \
    --force-color-profile=srgb \
    --default-background-color="${5:-ff050507}" \
    --virtual-time-budget=4000 \
    --window-size="$2,$3" \
    --screenshot="$4" \
    "$1" >/dev/null 2>&1
}

base="file://$PWD/scripts"

shot "$base/og-card.html#pt" 1200 630 public/og.png
shot "$base/og-card.html#en" 1200 630 public/og-en.png
shot "$base/icon-card.html#192" 192 192 public/icon-192.png 00000000
shot "$base/icon-card.html#512" 512 512 public/icon-512.png 00000000
shot "$base/icon-card.html#180" 180 180 public/apple-touch-icon.png 00000000

echo "Rendered social cards and icons into public/."
