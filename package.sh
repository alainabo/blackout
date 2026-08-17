#!/usr/bin/env bash
# Packages the extension into per-browser zip files ready for store submission.
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(grep -m1 '"version"' manifest.chrome.json | sed -E 's/.*"version": *"([^"]+)".*/\1/')
OUT="dist"
rm -rf "$OUT"
mkdir -p "$OUT"

SHARED_FILES=(popup.html popup.js options.html options.js welcome.html src icons)

build_variant() {
  local name="$1"
  local manifest_src="$2"
  local build_dir="$OUT/$name"
  mkdir -p "$build_dir"
  cp "$manifest_src" "$build_dir/manifest.json"
  cp -r "${SHARED_FILES[@]}" "$build_dir/"
  (cd "$build_dir" && zip -qr "../blackout-${name}-v${VERSION}.zip" .)
  rm -rf "$build_dir"
  echo "Built $OUT/blackout-${name}-v${VERSION}.zip"
}

build_variant "chrome" "manifest.chrome.json"
build_variant "edge" "manifest.chrome.json"
build_variant "firefox" "manifest.firefox.json"

echo ""
echo "Safari note: Safari requires converting the extension via Xcode's"
echo "'safari-web-extension-converter' (macOS + Xcode only, cannot run in this"
echo "Linux environment). Run on a Mac:"
echo "  xcrun safari-web-extension-converter dist/chrome-source-folder"
echo "using the unpacked chrome build as input, then build/sign in Xcode."
