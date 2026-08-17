// background.js - MV3 service worker (also works as MV2 background script)
/* global chrome, browser */

const api = typeof chrome !== "undefined" ? chrome : browser;

const DEFAULT_GLOBAL = {
  enabled: true,
  brightness: 100,
  contrast: 100,
  sepia: 0,
  grayscale: 0,
  ignoreImages: true,
  scheduleEnabled: false,
  scheduleStart: "20:00",
  scheduleEnd: "07:00",
};

api.runtime.onInstalled.addListener((details) => {
  api.storage.sync.get(["global"], (res) => {
    if (!res.global) {
      api.storage.sync.set({ global: DEFAULT_GLOBAL, siteOverrides: {} });
    }
  });
  if (details.reason === "install") {
    api.tabs.create({ url: api.runtime.getURL("welcome.html") });
  }
});

// Toolbar icon click toggles dark mode globally (quick access without opening popup,
// useful on browsers where the popup is set but a plain click is still desired as a
// fallback shortcut). Popup is primary UI; this listener only fires if no popup is set
// for that click context, so it's safe to keep as a no-op-safe convenience.
if (api.action && api.action.onClicked) {
  api.action.onClicked.addListener(() => {
    api.storage.sync.get(["global"], (res) => {
      const g = { ...DEFAULT_GLOBAL, ...(res.global || {}) };
      api.storage.sync.set({ global: { ...g, enabled: !g.enabled } });
    });
  });
}
