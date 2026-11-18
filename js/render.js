/*
 * Draws the lanyard preview as an SVG string.
 * First pass: a flat-lay strap loop with the material's fabric texture and a
 * simple drawn hook. Hardware images, imprint and the worn view come later.
 */
(function () {
  const U = 40; // drawing units per inch
  const CX = 220;
  const TEXTURES = {
    flat:  { href: "assets/textures/silkscreen.png", w: 160, h: 143, opacity: 0.95 },
    woven: { href: "assets/textures/woven.png",      w: 284, h: 145, opacity: 1 },
    satin: { href: "assets/textures/satin.png",      w: 66,  h: 142, opacity: 0.9 },
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("");
  }

  function renderLanyard(s) {
    const w = s.width.inches * U;
    const tex = TEXTURES[s.material.texture];
    // The drop (half the length) sets how far the strap hangs: 27 units per inch.
    const yTop = 70, halfTop = 92, yJoin = yTop + (s.length.inches / 2) * 27, yTail = yJoin + 40;

    // One path for the whole loop; stroking it at the strap width gives the band.
    const loop = `M${CX} ${yJoin} L${CX - halfTop} ${yTop + 40} Q${CX - halfTop} ${yTop} ${CX} ${yTop} Q${CX + halfTop} ${yTop} ${CX + halfTop} ${yTop + 40} L${CX} ${yJoin} L${CX} ${yTail}`;
    const band = (stroke, extra) => `<path d="${loop}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra || ""}/>`;

    const hookTop = yTail + 4;
    const hook = `
      <g class="hw" fill="none" stroke-linecap="round">
        <ellipse cx="${CX}" cy="${hookTop + 10}" rx="${w * 0.55}" ry="10" stroke="#9aa3ae" stroke-width="4"/>
        <rect x="${CX - 9}" y="${hookTop + 18}" width="18" height="16" rx="4" fill="#b9c1ca" stroke="#8a939e" stroke-width="1.5"/>
        <path d="M${CX} ${hookTop + 34} v26 a16 16 0 1 0 22 14" stroke="#9aa3ae" stroke-width="6"/>
      </g>`;

    return `
      <svg viewBox="0 0 440 760" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${s.material.name} lanyard">
        <defs>
          <pattern id="tex" patternUnits="userSpaceOnUse" width="${tex.w}" height="${tex.h}">
            <image href="${tex.href}" width="${tex.w}" height="${tex.h}"/>
          </pattern>
          <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#0b1220" flood-opacity=".18"/>
          </filter>
        </defs>
        <g filter="url(#drop)">
          ${band(s.strapColour)}
          ${band("url(#tex)", `opacity="${tex.opacity}" style="mix-blend-mode:multiply"`)}
          ${band(shade(s.strapColour, 0.18), `stroke-width="${w * 0.12}" opacity=".25" transform="translate(${-w * 0.3} 0)"`)}
        </g>
        ${hook}
      </svg>`;
  }

  window.LanyardRender = { renderLanyard };
})();
