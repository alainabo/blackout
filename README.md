# Blackout

A cross-browser extension that forces dark mode on any website, with per-site
overrides, brightness/contrast/sepia/grayscale tuning, and a day/night
schedule. Free and open source.

## Browser support

| Browser | Manifest used              | Status                         |
|---------|-----------------------------|---------------------------------|
| Chrome  | `manifest.chrome.json` (MV3) | Ready to submit                |
| Edge    | `manifest.chrome.json` (MV3) | Same package as Chrome works    |
| Firefox | `manifest.firefox.json` (MV2)| Ready to submit (AMO)           |
| Safari  | Converted from Chrome build | Needs macOS + Xcode to finish   |

Core logic (`src/content.js`, `src/background.js`, `popup.*`, `options.*`)
is shared across all four; only the manifest differs (MV3 vs MV2, and
`action` vs `browser_action`). This is the same pattern used by every
successful cross-browser extension (uBlock Origin, Dark Reader, etc.) — one
codebase, two manifest shapes, WebExtensions API throughout so Safari's
converter can also consume the Chrome-shaped source.

## How it works

- Injects a `<style>` tag at `document_start` in every frame that applies a
  CSS `filter: invert(1) hue-rotate(180deg) ...` to `<html>`, which is the
  standard "universal dark mode" trick — it doesn't require a lightness
  engine, works instantly on any site, and is trivially reversible.
- Images/video/canvas get a counter-filter by default so photos and videos
  keep normal colors instead of looking like photo negatives (toggle: "Keep
  images in color").
- Brightness, contrast, sepia (warmth) and grayscale are additional filter
  passes layered on top, exposed as sliders.
- Settings are stored in `chrome.storage.sync` (also implemented via
  `browser.storage.sync` on Firefox), so preferences roam across a user's
  signed-in browser instances.
- **Global settings**: on/off, brightness/contrast/sepia/grayscale defaults,
  schedule window.
- **Per-site overrides**: adjusting a slider in the popup while on a given
  site saves an override for that hostname only, so tuning Reddit doesn't
  change how Wikipedia looks. The options page lists/removes overrides.
- **Schedule**: optional day/night auto-toggle (e.g. dark 20:00–07:00),
  re-checked every 60s in every open tab.
- **Backup**: export/import all settings as JSON from the options page.

## File layout

```
manifest.chrome.json     MV3 manifest (Chrome + Edge)
manifest.firefox.json    MV2 manifest (Firefox; Safari conversion source)
popup.html / popup.js    Toolbar popup — quick toggle + sliders + schedule
options.html / options.js  Full settings page, site override management, backup
welcome.html             Post-install onboarding page
src/background.js        Sets defaults on install, opens welcome page
src/content.js            Injects the dark-mode <style> tag, reacts live to
                          storage changes and schedule
src/storage.js            Shared storage helpers (Node/testable module)
src/inject.css.js          Shared CSS-builder (Node/testable module)
icons/                    16/32/48/128 px icons
package.sh                Builds dist/*.zip per browser
dist/                     Built zips (gitignored candidate; generated)
```

## Build

```bash
./package.sh
```

Produces:
- `dist/blackout-chrome-v1.0.0.zip` → Chrome Web Store
- `dist/blackout-edge-v1.0.0.zip` → Microsoft Edge Add-ons
- `dist/blackout-firefox-v1.0.0.zip` → addons.mozilla.org (AMO)

### Safari

Safari extension packaging requires Xcode's
`safari-web-extension-converter`, which only runs on macOS — it cannot run
in this Linux workspace. On a Mac, once you have Xcode + command line tools:

```bash
# unzip the chrome build to a folder first, then:
xcrun safari-web-extension-converter path/to/unpacked-chrome-build
```

That generates an Xcode project; build/archive/sign it in Xcode, then submit
via App Store Connect (Safari extensions on macOS/iOS ship through the Mac
App Store, with a developer account, $99/yr).

## Store listing checklist (per store)

- **Chrome Web Store**: submit the zip via the Chrome Web Store Developer
  Dashboard. Needs: 1-2 screenshots (before/after a site), a short + long
  description, privacy policy URL (simple: "no data collected, all settings
  stored locally via browser sync storage").
- **Edge Add-ons**: free to submit, same zip works, same listing assets.
- **Firefox AMO**: free to submit, reviewed by Mozilla (usually automated +
  spot review), same zip built from `manifest.firefox.json`.
- **Safari (App Store)**: requires an Apple Developer account, macOS + Xcode
  required to build/sign/submit.

This build is fully functional, free, with no license gate or paywall code
anywhere in the extension, and it makes no network requests.
