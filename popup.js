// popup.js
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

let currentHost = "";
let state = { global: { ...DEFAULT_GLOBAL }, siteOverrides: {} };

const el = (id) => document.getElementById(id);

function getActiveTabHost() {
  return new Promise((resolve) => {
    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      try {
        const url = new URL(tabs[0].url);
        resolve(url.hostname || "");
      } catch (e) {
        resolve("");
      }
    });
  });
}

function loadState() {
  return new Promise((resolve) => {
    api.storage.sync.get(["global", "siteOverrides"], (res) => {
      state = {
        global: { ...DEFAULT_GLOBAL, ...(res.global || {}) },
        siteOverrides: res.siteOverrides || {},
      };
      resolve(state);
    });
  });
}

function effective() {
  const g = state.global;
  const o = state.siteOverrides[currentHost] || {};
  return {
    enabled: typeof o.enabled === "boolean" ? o.enabled : g.enabled,
    brightness: o.brightness ?? g.brightness,
    contrast: o.contrast ?? g.contrast,
    sepia: o.sepia ?? g.sepia,
    grayscale: o.grayscale ?? g.grayscale,
    ignoreImages: typeof o.ignoreImages === "boolean" ? o.ignoreImages : g.ignoreImages,
  };
}

function render() {
  const eff = effective();
  const o = state.siteOverrides[currentHost] || {};
  const hasOverride = typeof o.enabled === "boolean";

  el("hostLabel").textContent = currentHost || "this page";
  el("globalToggle").checked = state.global.enabled;
  el("siteToggle").checked = eff.enabled;
  el("siteOverrideState").textContent = hasOverride
    ? "Custom override active for this site"
    : "Following global setting";

  el("brightness").value = eff.brightness;
  el("brightnessVal").textContent = eff.brightness + "%";
  el("contrast").value = eff.contrast;
  el("contrastVal").textContent = eff.contrast + "%";
  el("sepia").value = eff.sepia;
  el("sepiaVal").textContent = eff.sepia + "%";
  el("grayscale").value = eff.grayscale;
  el("grayscaleVal").textContent = eff.grayscale + "%";
  el("ignoreImages").checked = eff.ignoreImages;

  el("scheduleEnabled").checked = state.global.scheduleEnabled;
  el("scheduleStart").value = state.global.scheduleStart;
  el("scheduleEnd").value = state.global.scheduleEnd;
  el("scheduleTimes").style.opacity = state.global.scheduleEnabled ? "1" : "0.4";
}

function saveGlobal(patch) {
  state.global = { ...state.global, ...patch };
  api.storage.sync.set({ global: state.global });
}

function saveSiteOverride(patch) {
  const next = { ...(state.siteOverrides[currentHost] || {}), ...patch };
  state.siteOverrides = { ...state.siteOverrides, [currentHost]: next };
  api.storage.sync.set({ siteOverrides: state.siteOverrides });
}

async function init() {
  currentHost = await getActiveTabHost();
  await loadState();
  render();

  el("globalToggle").addEventListener("change", (e) => {
    saveGlobal({ enabled: e.target.checked });
  });

  el("siteToggle").addEventListener("change", (e) => {
    saveSiteOverride({ enabled: e.target.checked });
    render();
  });

  el("clearOverride").addEventListener("click", () => {
    const next = { ...state.siteOverrides };
    delete next[currentHost];
    state.siteOverrides = next;
    api.storage.sync.set({ siteOverrides: next });
    render();
  });

  ["brightness", "contrast", "sepia", "grayscale"].forEach((key) => {
    el(key).addEventListener("input", (e) => {
      const val = Number(e.target.value);
      el(key + "Val").textContent = val + "%";
      // Slider changes apply as a site override so tuning one page
      // doesn't silently change every other site's look.
      saveSiteOverride({ [key]: val });
    });
  });

  el("ignoreImages").addEventListener("change", (e) => {
    saveSiteOverride({ ignoreImages: e.target.checked });
  });

  el("scheduleEnabled").addEventListener("change", (e) => {
    saveGlobal({ scheduleEnabled: e.target.checked });
    render();
  });
  el("scheduleStart").addEventListener("change", (e) => {
    saveGlobal({ scheduleStart: e.target.value });
  });
  el("scheduleEnd").addEventListener("change", (e) => {
    saveGlobal({ scheduleEnd: e.target.value });
  });
}

init();
