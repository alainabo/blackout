// options.js
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

const el = (id) => document.getElementById(id);
let state = { global: { ...DEFAULT_GLOBAL }, siteOverrides: {} };

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

function saveGlobal(patch) {
  state.global = { ...state.global, ...patch };
  api.storage.sync.set({ global: state.global });
}

function renderGlobalForm() {
  const g = state.global;
  el("enabled").checked = g.enabled;
  el("brightness").value = g.brightness;
  el("brightnessVal").textContent = g.brightness;
  el("contrast").value = g.contrast;
  el("contrastVal").textContent = g.contrast;
  el("sepia").value = g.sepia;
  el("sepiaVal").textContent = g.sepia;
  el("grayscale").value = g.grayscale;
  el("grayscaleVal").textContent = g.grayscale;
  el("ignoreImages").checked = g.ignoreImages;
  el("scheduleEnabled").checked = g.scheduleEnabled;
  el("scheduleStart").value = g.scheduleStart;
  el("scheduleEnd").value = g.scheduleEnd;
}

function renderOverridesTable() {
  const body = el("overridesBody");
  body.innerHTML = "";
  const hosts = Object.keys(state.siteOverrides);
  el("noOverrides").style.display = hosts.length ? "none" : "block";
  hosts.forEach((host) => {
    const o = state.siteOverrides[host];
    const g = state.global;
    const tr = document.createElement("tr");
    const enabledLabel =
      typeof o.enabled === "boolean" ? (o.enabled ? "On" : "Off") : "(global)";
    tr.innerHTML = `
      <td>${host}</td>
      <td>${enabledLabel}</td>
      <td>${o.brightness ?? g.brightness}%</td>
      <td>${o.contrast ?? g.contrast}%</td>
      <td><button class="secondary" data-host="${host}">Remove</button></td>
    `;
    body.appendChild(tr);
  });
  body.querySelectorAll("button[data-host]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const host = btn.getAttribute("data-host");
      const next = { ...state.siteOverrides };
      delete next[host];
      state.siteOverrides = next;
      api.storage.sync.set({ siteOverrides: next });
      renderOverridesTable();
    });
  });
}

function bindGlobalControls() {
  el("enabled").addEventListener("change", (e) => saveGlobal({ enabled: e.target.checked }));

  ["brightness", "contrast", "sepia", "grayscale"].forEach((key) => {
    el(key).addEventListener("input", (e) => {
      const val = Number(e.target.value);
      el(key + "Val").textContent = val;
      saveGlobal({ [key]: val });
    });
  });

  el("ignoreImages").addEventListener("change", (e) => saveGlobal({ ignoreImages: e.target.checked }));
  el("scheduleEnabled").addEventListener("change", (e) => saveGlobal({ scheduleEnabled: e.target.checked }));
  el("scheduleStart").addEventListener("change", (e) => saveGlobal({ scheduleStart: e.target.value }));
  el("scheduleEnd").addEventListener("change", (e) => saveGlobal({ scheduleEnd: e.target.value }));
}

function bindBackup() {
  el("exportBtn").addEventListener("click", () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blackout-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  el("importBtn").addEventListener("click", () => el("importFile").click());
  el("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const nextGlobal = { ...DEFAULT_GLOBAL, ...(parsed.global || {}) };
        const nextOverrides = parsed.siteOverrides || {};
        api.storage.sync.set({ global: nextGlobal, siteOverrides: nextOverrides }, async () => {
          await loadState();
          renderGlobalForm();
          renderOverridesTable();
        });
      } catch (err) {
        alert("Invalid settings file.");
      }
    };
    reader.readAsText(file);
  });
}

async function init() {
  await loadState();
  renderGlobalForm();
  renderOverridesTable();
  bindGlobalControls();
  bindBackup();

  api.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      loadState().then(() => {
        renderGlobalForm();
        renderOverridesTable();
      });
    }
  });
}

init();
