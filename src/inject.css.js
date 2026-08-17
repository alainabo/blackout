// inject.css.js - builds the CSS string applied to every page
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
  img, picture, video, canvas, svg, iframe, embed, object,
  [style*="background-image"], .blackout-no-invert {
    filter: invert(1) hue-rotate(180deg) !important;
  }`
    : "";

  return `
html {
  filter: ${filter} !important;
  background-color: #fff !important;
}
html, body {
  background-color: #fff !important;
}
${mediaException}
`;
}

if (typeof module !== "undefined") {
  module.exports = { buildCss };
}
