/*
 * Draws the lanyard preview as an SVG string.
 * First pass: a flat-lay strap loop with the material's fabric texture, the
 * chosen colours/design, the imprint (text and logo) and a simple drawn hook.
 * Hardware images and the worn view come later.
 */
(function () {
  const U = 40; // drawing units per inch
  const CX = 220;
  const TEXTURES = {
    flat:  { href: "assets/textures/silkscreen.png", w: 160, h: 143, opacity: 0.95 },
    woven: { href: "assets/textures/woven.png",      w: 284, h: 145, opacity: 1 },
    satin: { href: "assets/textures/satin.png",      w: 66,  h: 142, opacity: 0.9 },
  };

  // Imprint sizes are fractions of the strap width.
  const TEXT_SIZE = { s: 0.44, m: 0.56, l: 0.68 };
  const LOGO_SIZE = { s: 0.6, m: 0.74, l: 0.88 };
  const GAP = { tight: 0.7, normal: 1.3, loose: 2.6 };

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const measureCtx = document.createElement("canvas").getContext("2d");
  function textWidth(text, fontCss, size, bold) {
    measureCtx.font = `${bold ? "bold" : "normal"} ${size}px ${fontCss}`;
    return measureCtx.measureText(text).width + text.length * size * 0.04;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, "0")).join("");
  }

  // Pattern tiles for the two-colour designs, in a leg's local frame
  // (x along the strap, y across it, centred on 0).
  function designPattern(d, w) {
    const c2 = d.colour2;
    const tile = (pw, ph, body, extra) =>
      `<pattern id="dz" width="${pw}" height="${ph}" patternUnits="userSpaceOnUse" y="${-w / 2}" ${extra || ""}>${body}</pattern>`;
    switch (d.style) {
      case "dots": {
        const p = w * 0.42;
        return tile(p, p, `<circle cx="${p / 2}" cy="${p / 2}" r="${p * 0.2}" fill="${c2}"/>`);
      }
      case "chevron": {
        const p = w / 2;
        return tile(p, w, `<path d="M0,0 L${p / 2},${w / 2} L0,${w} M${p / 2},0 L${p},${w / 2} L${p / 2},${w}" stroke="${c2}" stroke-width="${p * 0.22}" fill="none"/>`);
      }
      case "diagonal": {
        const p = w * 0.5;
        return tile(p, p, `<rect width="${p / 2}" height="${p}" fill="${c2}"/>`, `patternTransform="rotate(45)"`);
      }
      case "checks": {
        const p = w / 2;
        return tile(p * 2, p * 2, `<rect width="${p}" height="${p}" fill="${c2}"/><rect x="${p}" y="${p}" width="${p}" height="${p}" fill="${c2}"/>`);
      }
      case "photo": {
        if (!d.photo) return "";
        const pw = w * (d.photoAspect || 1);
        return tile(pw, w, `<image href="${d.photo}" width="${pw}" height="${w}" preserveAspectRatio="xMidYMid slice"/>`);
      }
      default:
        return "";
    }
  }

  // The strap's colours and design. Stripes are nested strokes, so they follow
  // the curve too. Gradients and patterns are drawn on the two straight legs in
  // each leg's own frame (so they run along the strap); the short top curve and
  // the tail stay a plain colour. Everything is masked to the strap's outline.
  function strapDesign(s, loop, legs, w, tail) {
    const d = s.design, c1 = s.strapColour, c2 = d.colour2;
    const stroke = (colour, width, path) => `<path d="${path || loop}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linejoin="round"/>`;
    const leg = (g, fill) => `<g transform="translate(${g.x} ${g.y}) rotate(${g.deg})"><rect x="-20" y="${-w / 2}" width="${g.len + 40}" height="${w}" fill="${fill}"/></g>`;
    let defs = "", body;
    switch (d.style) {
      case "stripe-centre":
        body = stroke(c1, w) + stroke(c2, w * 0.28);
        break;
      case "stripe-edges":
        body = stroke(c1, w) + stroke(c2, w * 0.9) + stroke(c1, w * 0.6);
        break;
      case "gradient":
        // Each leg runs from the hook end (main colour) to the top (second colour).
        defs = legs.map((g, i) => `<linearGradient id="gr${i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${g.len}" y2="0">
            <stop offset="0" stop-color="${g.fromJoin ? c1 : c2}"/><stop offset="1" stop-color="${g.fromJoin ? c2 : c1}"/></linearGradient>`).join("");
        body = stroke(c2, w) + legs.map((g, i) => leg(g, `url(#gr${i})`)).join("") + stroke(c1, w, tail);
        break;
      default: {
        const pattern = designPattern(d, w);
        defs = pattern;
        body = stroke(c1, w) + (pattern ? legs.map((g) => leg(g, "url(#dz)")).join("") : "");
      }
    }
    return { defs, body };
  }

  // ---------- imprint ----------
  // The logo and/or text, each with its length along the strap.
  function imprintItems(imp, w) {
    const items = [];
    const size = w * TEXT_SIZE[imp.size];
    if ((imp.mode === "logo" || imp.mode === "both") && imp.logo) {
      const lh = w * LOGO_SIZE[imp.size];
      items.push({ kind: "logo", w: Math.min(lh * imp.logoAspect, w * 8), h: lh });
    }
    if ((imp.mode === "text" || imp.mode === "both") && imp.text) {
      items.push({ kind: "text", w: textWidth(imp.text, imp.font.css, size, imp.bold) });
    }
    return { items, size };
  }

  // Repeats the items (logo, text, logo, text...) as many times as fit
  // between a and b, centred in that run.
  function layoutItems(items, gap, a, b) {
    const run = [];
    let used = 0;
    for (let n = 0; n < 200; n++) {
      const it = items[n % items.length];
      const need = (run.length ? gap : 0) + it.w;
      if (used + need > b - a) break;
      used += need;
      run.push(it);
    }
    let pos = a + (b - a - used) / 2;
    return run.map((it, j) => {
      if (j) pos += gap;
      const centre = pos + it.w / 2;
      pos += it.w;
      return { item: it, centre };
    });
  }

  // Imprint along both legs, in each leg's frame so it reads along the strap.
  // It stays clear of the hook end (w * 2.6) and the top curve (w * 0.85).
  function strapImprint(imp, legs, w) {
    if (!imp) return "";
    const set = imprintItems(imp, w);
    if (!set.items.length) return "";
    const gap = Math.max(w * GAP[imp.spacing], 8);
    const draw = ({ item, centre }) => item.kind === "logo"
      ? `<image href="${imp.logo}" x="${centre - item.w / 2}" y="${-item.h / 2}" width="${item.w}" height="${item.h}" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="${centre}" y="${set.size * 0.36}" text-anchor="middle" font-family="${esc(imp.font.css)}" font-size="${set.size}" font-weight="${imp.bold ? 700 : 400}" letter-spacing="${set.size * 0.04}" fill="${imp.colour}">${esc(imp.text)}</text>`;
    return legs.map((g) => {
      const [a, b] = g.fromJoin ? [w * 2.6, g.len - w * 0.85] : [w * 0.85, g.len - w * 2.6];
      return `<g transform="translate(${g.x} ${g.y}) rotate(${g.deg})">${layoutItems(set.items, gap, a, b).map(draw).join("")}</g>`;
    }).join("");
  }

  function renderLanyard(s) {
    const w = s.width.inches * U;
    const tex = TEXTURES[s.material.texture];
    // The drop (half the length) sets how far the strap hangs: 27 units per inch.
    const yTop = 70, halfTop = 92, yJoin = yTop + (s.length.inches / 2) * 27, yTail = yJoin + 40;

    // One path for the whole loop; stroking it at the strap width gives the band.
    const loop = `M${CX} ${yJoin} L${CX - halfTop} ${yTop + 40} Q${CX - halfTop} ${yTop} ${CX} ${yTop} Q${CX + halfTop} ${yTop} ${CX + halfTop} ${yTop + 40} L${CX} ${yJoin} L${CX} ${yTail}`;
    const band = (stroke, extra) => `<path d="${loop}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra || ""}/>`;

    // The two straight legs, each with its start point, angle and length.
    const legFrom = (x1, y1, x2, y2, fromJoin) =>
      ({ x: x1, y: y1, deg: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI, len: Math.hypot(x2 - x1, y2 - y1), fromJoin });
    const legs = [legFrom(CX, yJoin, CX - halfTop, yTop + 40, true), legFrom(CX + halfTop, yTop + 40, CX, yJoin, false)];
    const design = strapDesign(s, loop, legs, w, `M${CX} ${yJoin} L${CX} ${yTail}`);

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
          ${design.defs}
          <mask id="strap-shape" maskUnits="userSpaceOnUse" x="0" y="0" width="440" height="760">${band("#fff")}</mask>
          <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#0b1220" flood-opacity=".18"/>
          </filter>
        </defs>
        <g filter="url(#drop)">
          <g mask="url(#strap-shape)">${design.body}${strapImprint(s.imprint, legs, w)}</g>
          ${band("url(#tex)", `opacity="${tex.opacity}" style="mix-blend-mode:multiply"`)}
          ${band(shade(s.strapColour, 0.18), `stroke-width="${w * 0.12}" opacity=".25" transform="translate(${-w * 0.3} 0)"`)}
        </g>
        ${hook}
      </svg>`;
  }

  window.LanyardRender = { renderLanyard };
})();
