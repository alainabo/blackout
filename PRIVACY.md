# Privacy Policy — Blackout

**Last updated:** 2026-08-17

Blackout does not collect, transmit, sell, or share any user data.

## What the extension does

- Reads the page you're viewing (via a content script) solely to apply a
  visual dark-mode filter to it. Page content is never read for any other
  purpose, never copied, and never sent anywhere.
- Stores your preferences (global settings, per-site overrides, schedule)
  using your browser's built-in `storage.sync` API. This data stays inside
  your browser and, if you're signed into your browser account (Google/
  Microsoft/Firefox account), syncs across your own devices the same way
  your bookmarks do — it is never sent to us or any third party.

## What the extension does NOT do

- No analytics, telemetry, or tracking of any kind.
- No network requests to any external server.
- No collection of browsing history, page content, or personal information.
- No ads, no third-party scripts.

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `storage` | Save your dark mode settings and per-site overrides locally/synced. |
| `activeTab` | Let the popup know which site you're currently on, for per-site controls. |
| Access to all sites (`<all_urls>` / host permissions) | The extension must be able to inject its dark-mode style sheet into any page you visit, since that's the whole point of the extension. It only ever writes a `<style>` tag; it does not read or exfiltrate page content. |

## Changes

If this policy ever changes (e.g. a future optional paid tier introduces a
license-check network call), this document will be updated first and the
store listing will note the version it applies to.

## Contact

Questions: support@example.com _(replace with your real support address before publishing)_.
