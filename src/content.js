// content.js - runs in every page (Chrome/Edge/Firefox/Safari, MV3 + MV2 fallback)
/* global chrome, browser */

(function () {
  const api = typeof chrome !== "undefined" ? chrome : browser;
  const STYLE_ID = "__blackout_style__";

  function buildCss(settings) {
    const { brightness, contrast, sepia, grayscale, ignoreImages } = settings;
    const filterParts = [
      "invert(1)",
      "hue-rotate(180deg)",
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
    ];
    if (sepia > 0) filterParts.push(`sepia(${sepia}%)`);
    if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
    const filter = filterParts.join(" ");

    const mediaException = ignoreImages
      ? `
img, picture, video, canvas, svg, iframe, embed, object {
  filter: invert(1) hue-rotate(180deg) !important;
}`
      : "";

    return `html {
  filter: ${filter} !important;
  background-color: #fff !important;
}
html, body { background-color: #fff !important; }
${mediaException}`;
  }

  function isWithinSchedule(startStr, endStr, now) {
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const cur = now.getHours() * 60 + now.getMinutes();
    if (start === end) return true;
    if (start < end) return cur >= start && cur < end;
    return cur >= start || cur < end;
  }

  function ensureStyleEl() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  function effectiveSettingsFor(hostname, all) {
    const g = all.global;
    const o = all.siteOverrides[hostname] || {};
    let enabled = typeof o.enabled === "boolean" ? o.enabled : g.enabled;
    if (enabled && g.scheduleEnabled && typeof o.enabled !== "boolean") {
      enabled = isWithinSchedule(g.scheduleStart, g.scheduleEnd, new Date());
    }
    return {
      enabled,
      brightness: o.brightness ?? g.brightness,
      contrast: o.contrast ?? g.contrast,
      sepia: o.sepia ?? g.sepia,
      grayscale: o.grayscale ?? g.grayscale,
      ignoreImages: typeof o.ignoreImages === "boolean" ? o.ignoreImages : g.ignoreImages,
    };
  }

  function apply(all) {
    const hostname = location.hostname;
    const settings = effectiveSettingsFor(hostname, all);
    if (!settings.enabled) {
      removeStyle();
      return;
    }
    const styleEl = ensureStyleEl();
    styleEl.textContent = buildCss(settings);
  }

  function loadAndApply() {
    api.storage.sync.get(["global", "siteOverrides"], (res) => {
      const all = {
        global: {
          enabled: true,
          brightness: 100,
          contrast: 100,
          sepia: 0,
          grayscale: 0,
          ignoreImages: true,
          scheduleEnabled: false,
          scheduleStart: "20:00",
          scheduleEnd: "07:00",
          ...(res.global || {}),
        },
        siteOverrides: res.siteOverrides || {},
      };
      apply(all);
    });
  }

  // Apply ASAP, then again on DOMContentLoaded in case <head> wasn't ready.
  loadAndApply();
  document.addEventListener("DOMContentLoaded", loadAndApply);

  // React to storage changes (popup edits) live.
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.global || changes.siteOverrides)) {
      loadAndApply();
    }
  });

  // Recheck schedule every minute in case time-of-day crosses a boundary
  // while the tab stays open.
  setInterval(loadAndApply, 60 * 1000);
})();
