// storage.js - shared storage helpers (Chrome/Edge/Firefox/Safari all support chrome.* via polyfill on Firefox/Safari MV2, and natively on MV3)
/* global chrome */

const DEFAULTS = {
  global: {
    enabled: true,
    brightness: 100, // 70-130
    contrast: 100, // 70-130
    sepia: 0, // 0-30
    grayscale: 0, // 0-100
    ignoreImages: true, // don't invert media (images/video/canvas)
    scheduleEnabled: false,
    scheduleStart: "20:00",
    scheduleEnd: "07:00",
  },
  siteOverrides: {}, // hostname -> { enabled: bool, brightness, contrast, sepia, grayscale, ignoreImages }
};

function getApi() {
  // eslint-disable-next-line no-undef
  return typeof chrome !== "undefined" ? chrome : globalThis.browser;
}

function getAll() {
  const api = getApi();
  return new Promise((resolve) => {
    api.storage.sync.get(["global", "siteOverrides"], (res) => {
      resolve({
        global: { ...DEFAULTS.global, ...(res.global || {}) },
        siteOverrides: res.siteOverrides || {},
      });
    });
  });
}

function setGlobal(patch) {
  const api = getApi();
  return getAll().then(({ global }) => {
    const next = { ...global, ...patch };
    return new Promise((resolve) => {
      api.storage.sync.set({ global: next }, () => resolve(next));
    });
  });
}

function setSiteOverride(hostname, patch) {
  const api = getApi();
  return getAll().then(({ siteOverrides }) => {
    const next = { ...siteOverrides, [hostname]: { ...(siteOverrides[hostname] || {}), ...patch } };
    return new Promise((resolve) => {
      api.storage.sync.set({ siteOverrides: next }, () => resolve(next));
    });
  });
}

function removeSiteOverride(hostname) {
  const api = getApi();
  return getAll().then(({ siteOverrides }) => {
    const next = { ...siteOverrides };
    delete next[hostname];
    return new Promise((resolve) => {
      api.storage.sync.set({ siteOverrides: next }, () => resolve(next));
    });
  });
}

function effectiveSettingsFor(hostname, all) {
  const g = all.global;
  const o = all.siteOverrides[hostname] || {};
  const enabled = typeof o.enabled === "boolean" ? o.enabled : g.enabled;
  return {
    enabled,
    brightness: o.brightness ?? g.brightness,
    contrast: o.contrast ?? g.contrast,
    sepia: o.sepia ?? g.sepia,
    grayscale: o.grayscale ?? g.grayscale,
    ignoreImages: typeof o.ignoreImages === "boolean" ? o.ignoreImages : g.ignoreImages,
  };
}

function isWithinSchedule(startStr, endStr, now = new Date()) {
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const cur = now.getHours() * 60 + now.getMinutes();
  if (start === end) return true;
  if (start < end) return cur >= start && cur < end;
  // wraps past midnight
  return cur >= start || cur < end;
}

if (typeof module !== "undefined") {
  module.exports = { DEFAULTS, getAll, setGlobal, setSiteOverride, removeSiteOverride, effectiveSettingsFor, isWithinSchedule };
}
