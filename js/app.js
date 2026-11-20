/*
 * Configurator state and UI. Each step is an entry in STEPS with a body()
 * that returns its options; add the next step there as it's built.
 */
(function () {
  const CFG = window.LANYARD_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const byId = (list, id) => list.find((x) => x.id === id) || list[0];

  const newImprint = (o) => ({
    mode: "text", text: "YOUR BRAND", font: "arial", bold: true, colour: "#f4f4f2",
    logo: null, logoAspect: 1, logoName: "", logoTint: null, logoWarn: "", logoOpaque: false,
    size: "m", spacing: "normal", layout: "repeat", ...o,
  });

  const state = {
    material: CFG.defaults.material,
    width: CFG.defaults.width,
    length: CFG.defaults.length,
    strapColour: CFG.defaults.strapColour,
    designStyle: CFG.defaults.designStyle,
    colour2: CFG.defaults.colour2,
    photo: null,
    photoAspect: 1,
    photoName: "",
    sides: "one",
    front: newImprint(),
    back: newImprint({ mode: "text", text: "www.yourbrand.com", bold: false }),
    palette: [], // colours picked up from the uploaded logo
  };
  const ui = { side: "front", editSide: "front", zoom: 1 };

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v != null && v !== false) el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null) el.append(c);
    return el;
  }

  const resolved = () => {
    const material = byId(CFG.materials, state.material);
    return {
      ...state,
      material,
      width: byId(CFG.widths, state.width),
      length: byId(CFG.lengths, state.length),
      // Designs only apply on materials that can print them; others are always solid.
      design: material.designs
        ? { style: state.designStyle, colour2: state.colour2, photo: state.photo, photoAspect: state.photoAspect }
        : { style: "solid", colour2: state.colour2 },
      imprint: imprintFor(ui.side, material),
    };
  };

  // The imprint shown on one side of the strap, with its font resolved and the
  // logo tint defaulting to one colour unless the material prints full colour.
  function imprintFor(side, material) {
    if (side === "back" && state.sides === "one") return null;
    const src = side === "back" && state.sides === "different" ? state.back : state.front;
    if (src.mode === "none") return null;
    return { ...src, font: byId(CFG.fonts, src.font), logoTint: src.logoTint == null ? !material.fullColourLogo : src.logoTint };
  }

  const colourName = (hex) => {
    const c = CFG.colours.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
    return c ? c.name : "Custom " + hex.toUpperCase();
  };

  // Segmented control: one pressed button out of a few short options.
  const seg = (options, current, label, onpick) =>
    h("div", { class: "segmented", role: "radiogroup", "aria-label": label }, options.map(([id, text]) =>
      h("button", {
        type: "button",
        role: "radio",
        class: id === current ? "is-selected" : null,
        "aria-checked": String(id === current),
        onclick: () => onpick(id),
      }, text)));

  // Colour swatches: one round button per palette colour plus a custom colour.
  function swatches(current, label, onpick) {
    const isCustom = !CFG.colours.some((c) => c.hex.toLowerCase() === current.toLowerCase());
    const swatch = (hex, name) => {
      const sel = hex.toLowerCase() === current.toLowerCase();
      return h("button", {
        type: "button",
        role: "radio",
        class: "swatch" + (sel ? " is-selected" : ""),
        "aria-checked": String(sel),
        title: name,
        "aria-label": name,
        style: `--c:${hex}`,
        onclick: () => onpick(hex),
      });
    };
    const row = h("div", { class: "swatches", role: "radiogroup", "aria-label": label },
      CFG.colours.map((c) => swatch(c.hex, c.name)),
      h("label", { class: "swatch swatch-custom" + (isCustom ? " is-selected" : ""), title: "Custom colour", style: isCustom ? `--c:${current}` : null },
        // change (not input) so the native picker isn't torn down by a re-render while it's open
        h("input", { type: "color", value: current, "aria-label": label + ", custom colour", onchange: (e) => onpick(e.target.value) }),
        h("span", { "aria-hidden": "true" }, "+")));
    if (!state.palette.length) return row;
    return h("div", { class: "swatch-block" },
      h("div", { class: "swatches swatches-logo" }, h("span", { class: "swatch-label" }, "From your logo"),
        state.palette.map((hex) => swatch(hex, "Logo colour " + hex.toUpperCase()))),
      row);
  }

  // Small strip showing what each design looks like in the current colours.
  function designSwatch(style) {
    const a = state.strapColour, b = state.colour2;
    const bg = {
      solid: a,
      gradient: `linear-gradient(90deg,${a},${b})`,
      "stripe-centre": `linear-gradient(${a} 36%,${b} 36% 64%,${a} 64%)`,
      "stripe-edges": `linear-gradient(${a} 6%,${b} 6% 22%,${a} 22% 78%,${b} 78% 94%,${a} 94%)`,
      dots: `radial-gradient(${b} 22%,transparent 24%) 0 0/9px 9px,${a}`,
      chevron: `repeating-linear-gradient(60deg,${a} 0 4px,${b} 4px 7px)`,
      diagonal: `repeating-linear-gradient(45deg,${a} 0 5px,${b} 5px 10px)`,
      checks: `conic-gradient(${b} 25%,${a} 0 50%,${b} 0 75%,${a} 0) 0 0/12px 12px`,
      photo: state.photo ? `url(${state.photo}) center/cover` : "linear-gradient(135deg,#94a3b8,#cbd5e1)",
    }[style];
    return h("span", { class: "design-swatch", style: `background:${bg}` });
  }

  // Drop zone for the background image: click to browse or drag a file onto it.
  function photoUpload() {
    const input = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", class: "visually-hidden", id: "photo-input",
      onchange: (e) => { loadPhoto(e.target.files[0]); e.target.value = ""; } });
    const drop = h("label", {
      class: "dropzone" + (state.photo ? " has-file" : ""),
      for: "photo-input",
      ondragover: (e) => { e.preventDefault(); drop.classList.add("is-over"); },
      ondragleave: () => drop.classList.remove("is-over"),
      ondrop: (e) => { e.preventDefault(); drop.classList.remove("is-over"); loadPhoto(e.dataTransfer.files[0]); },
    },
      state.photo
        ? [h("img", { src: state.photo, alt: "" }), h("span", {}, state.photoName || "Uploaded", h("br"), h("small", {}, "Click or drop to replace"))]
        : [h("strong", {}, "Upload a background image"), h("small", {}, "A wide photo or pattern works best. It repeats along the strap.")]);
    return h("div", { class: "stack-sm" }, input, drop,
      state.photo ? h("button", { type: "button", class: "link", onclick: () => set({ photo: null, photoName: "" }) }, "Remove") : null);
  }

  // Background image for the "Your image" design: downscaled so the preview stays light.
  function loadPhoto(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      set({ photo: c.toDataURL("image/jpeg", 0.88), photoAspect: c.width / c.height, photoName: file.name });
    };
    img.src = url;
  }

  // Plain radio list (imprint step; styled later).
  const radios = (name, legend, options, current, onpick) =>
    h("fieldset", {}, h("legend", {}, legend), options.map(([id, text]) =>
      h("label", {},
        h("input", { type: "radio", name, value: id, checked: id === current, onchange: () => onpick(id) }),
        " " + text, h("br"))));

  // Plain colour list: logo colours first, then the palette, then a custom colour.
  function colourRadios(name, legend, current, onpick) {
    const isCustom = ![...state.palette, ...CFG.colours.map((c) => c.hex)].some((hex) => hex.toLowerCase() === current.toLowerCase());
    const options = [
      ...state.palette.map((hex) => [hex, "From your logo " + hex.toUpperCase()]),
      ...CFG.colours.map((c) => [c.hex, c.name]),
    ];
    return h("fieldset", {}, h("legend", {}, legend),
      options.map(([hex, text]) => h("label", {},
        h("input", { type: "radio", name, value: hex, checked: hex.toLowerCase() === current.toLowerCase(), onchange: () => onpick(hex) }),
        " " + text, h("br"))),
      h("label", {},
        h("input", { type: "radio", name, value: "custom", checked: isCustom, onchange: (e) => e.target.parentNode.querySelector("input[type=color]").click() }),
        " Custom: ",
        h("input", { type: "color", value: current, "aria-label": legend + ", custom colour", onchange: (e) => onpick(e.target.value) })));
  }

  // ---------------------------------------------------------------- logo
  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("none"));
      if (!/^image\//.test(file.type)) { alert("Please choose an image file (PNG, JPG, SVG or WebP)."); return reject(new Error("type")); }
      if (file.size > 10 * 1024 * 1024) { alert("That file is over 10 MB. Please use a smaller version."); return reject(new Error("size")); }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve({ url: reader.result, img, name: file.name, svg: file.type === "image/svg+xml" });
        img.onerror = () => { alert("We couldn't read that image. Try a PNG or JPG."); reject(new Error("decode")); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function downscale(img, maxSide) {
    const w = img.naturalWidth || 300, h0 = img.naturalHeight || 300;
    const k = Math.min(1, maxSide / Math.max(w, h0));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h0 * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  // Finds the logo's main colours and whether it sits on a solid background.
  function analyseLogo(canvas) {
    const { width: w, height: h0 } = canvas;
    const data = canvas.getContext("2d").getImageData(0, 0, w, h0).data;
    const at = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
    const corners = [at(0, 0), at(w - 1, 0), at(0, h0 - 1), at(w - 1, h0 - 1)];
    const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    const uniformBg = corners.every((c) => c[3] > 250) && corners.every((c) => dist(c, corners[0]) < 40);

    // Bucket colours, skipping transparent pixels and the background colour.
    const buckets = new Map();
    const step = Math.max(1, Math.floor(Math.sqrt((w * h0) / 6000)));
    for (let y = 0; y < h0; y += step) for (let x = 0; x < w; x += step) {
      const p = at(x, y);
      if (p[3] < 128 || (uniformBg && dist(p, corners[0]) < 60)) continue;
      const key = (p[0] >> 4) + "," + (p[1] >> 4) + "," + (p[2] >> 4);
      const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      b.n++; b.r += p[0]; b.g += p[1]; b.b += p[2];
      buckets.set(key, b);
    }
    // Ignore rare colours (anti-aliased edges) and near-duplicates.
    const total = [...buckets.values()].reduce((n, b) => n + b.n, 0);
    const sorted = [...buckets.values()].filter((b) => b.n >= total * 0.03)
      .sort((a, b) => b.n - a.n).map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);
    const palette = [];
    for (const c of sorted) if (palette.length < 6 && palette.every((p) => dist(p, c) > 70)) palette.push(c);
    const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    return { uniformBg, palette: palette.map(hex) };
  }

  // Makes a solid background transparent by flood-filling from the edges.
  function removeBackground(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = downscale(img, 1200);
        const ctx = c.getContext("2d");
        const { width: w, height: h0 } = c;
        const id = ctx.getImageData(0, 0, w, h0);
        const d = id.data;
        const bg = [d[0], d[1], d[2]];
        const tol = 60;
        const seen = new Uint8Array(w * h0);
        const stack = [];
        for (let x = 0; x < w; x++) stack.push(x, (h0 - 1) * w + x);
        for (let y = 0; y < h0; y++) stack.push(y * w, y * w + w - 1);
        while (stack.length) {
          const p = stack.pop();
          if (seen[p]) continue;
          seen[p] = 1;
          const i = p * 4;
          const diff = Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);
          if (diff > tol) continue;
          d[i + 3] = diff < tol / 2 ? 0 : Math.round((255 * (diff - tol / 2)) / (tol / 2)); // soft edge
          const x = p % w;
          if (x > 0) stack.push(p - 1);
          if (x < w - 1) stack.push(p + 1);
          if (p >= w) stack.push(p - w);
          if (p < w * (h0 - 1)) stack.push(p + w);
        }
        ctx.putImageData(id, 0, 0);
        resolve(c.toDataURL("image/png"));
      };
      img.src = url;
    });
  }

  async function loadLogo(file, side) {
    let r;
    try { r = await readImage(file); } catch (_) { return; }
    const nw = r.img.naturalWidth, nh = r.img.naturalHeight;
    const c = downscale(r.img, 1200);
    const info = analyseLogo(c);
    const warn = !r.svg && Math.max(nw, nh) < 500
      ? `This image is only ${nw}×${nh}px. It's fine for the preview, but please send a larger file or a vector (AI, EPS, PDF, SVG) for production.`
      : "";
    const imp = { ...state[side], logo: r.svg ? r.url : c.toDataURL("image/png"), logoAspect: (nw || 1) / (nh || 1), logoName: r.name, logoWarn: warn, logoOpaque: info.uniformBg };
    if (imp.mode === "text" || imp.mode === "none") imp.mode = "both";
    set({ [side]: imp, palette: info.palette });
  }

  function setSide(side) {
    ui.side = side;
    document.querySelectorAll("[data-side]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.side === side)));
  }

  function imprintStep() {
    const m = resolved().material;
    const side = state.sides === "different" ? ui.editSide : "front";
    const imp = state[side];
    // Typing only redraws the preview, so the text box keeps focus.
    const setImp = (patch, light) => {
      state[side] = { ...state[side], ...patch };
      if (light) renderPreview(); else render();
    };
    const tint = imp.logoTint == null ? !m.fullColourLogo : imp.logoTint;
    const wrap = h("div", {},
      radios("sides", "Print on", [["one", "One side"], ["same", "Both sides, same"], ["different", "Front & back different"]], state.sides, (v) => {
        if (v === "one") { ui.editSide = "front"; setSide("front"); }
        set({ sides: v });
      }));
    if (state.sides === "different") {
      wrap.append(radios("edit-side", "Editing", [["front", "Front"], ["back", "Back"]], ui.editSide, (v) => {
        ui.editSide = v;
        setSide(v);
        render();
      }));
    }
    wrap.append(radios("imp-mode", "Imprint", [["none", "Blank"], ["text", "Text"], ["logo", "Logo"], ["both", "Logo + text"]], imp.mode, (v) => setImp({ mode: v })));

    if (imp.mode === "text" || imp.mode === "both") {
      wrap.append(h("p", {},
        h("label", {}, "Text ",
          h("input", { type: "text", maxlength: "60", value: imp.text, placeholder: "Your company, event or slogan", name: "imp-text",
            oninput: (e) => setImp({ text: e.target.value }, true) })), h("br"),
        h("label", {}, "Font ",
          h("select", { onchange: (e) => setImp({ font: e.target.value }) },
            CFG.fonts.map((fo) => h("option", { value: fo.id, selected: fo.id === imp.font }, fo.name)))), " ",
        h("label", {}, h("input", { type: "checkbox", checked: imp.bold, onchange: (e) => setImp({ bold: e.target.checked }) }), " Bold")));
    }
    if (imp.mode === "logo" || imp.mode === "both") {
      wrap.append(h("p", {},
        h("label", {}, "Upload your logo ",
          h("input", { type: "file", accept: "image/png,image/jpeg,image/svg+xml,image/webp", onchange: (e) => { loadLogo(e.target.files[0], side); e.target.value = ""; } })),
        h("br"), "PNG with a transparent background works best. SVG, JPG and WebP also accepted."));
      if (side === "back" && !imp.logo && state.front.logo) {
        wrap.append(h("p", {}, h("button", { type: "button", onclick: () => setImp({
          logo: state.front.logo, logoAspect: state.front.logoAspect, logoName: state.front.logoName, logoWarn: state.front.logoWarn, logoOpaque: state.front.logoOpaque,
        }) }, "Use the front logo")));
      }
      if (imp.logo) {
        wrap.append(h("p", {}, "Uploaded: " + imp.logoName + " ",
          h("button", { type: "button", onclick: () => setImp({ logo: null, logoName: "", logoWarn: "", logoOpaque: false }) }, "Remove")));
        if (imp.logoWarn) wrap.append(h("p", {}, imp.logoWarn));
        if (imp.logoOpaque) {
          wrap.append(h("p", {}, "Your logo has a solid background, which will print as a box. ",
            h("button", { type: "button", onclick: async (e) => {
              e.target.disabled = true;
              e.target.textContent = "Removing...";
              setImp({ logo: await removeBackground(imp.logo), logoOpaque: false });
            } }, "Remove background")));
        }
        wrap.append(radios("logo-tint", "Logo colours", [["one", "One colour"], ["full", "Full colour"]], tint ? "one" : "full", (v) => setImp({ logoTint: v === "one" })),
          h("p", {}, tint
            ? "Printed in your imprint colour, the way silkscreen and woven lanyards are usually made."
            : m.fullColourLogo ? "Printed exactly as uploaded." : "Multi-colour logos cost more on silkscreen and may be simplified on woven. We'll confirm on your proof."));
      }
    }
    if (imp.mode !== "none") {
      if (imp.mode !== "logo" || tint) wrap.append(colourRadios("imp-colour", "Imprint colour", imp.colour, (hex) => setImp({ colour: hex })));
      wrap.append(
        radios("imp-size", "Size", [["s", "S"], ["m", "M"], ["l", "L"]], imp.size, (v) => setImp({ size: v })),
        radios("imp-spacing", "Spacing", [["tight", "Tight"], ["normal", "Normal"], ["loose", "Loose"]], imp.spacing, (v) => setImp({ spacing: v })),
        radios("imp-layout", "Layout", [["repeat", "Repeat"], ["single", "Once per side"]], imp.layout, (v) => setImp({ layout: v })),
        h("p", {}, m.imprintNote));
    }
    return wrap;
  }

  const STEPS = [
    {
      id: "material",
      title: "Material",
      summary: () => resolved().material.short,
      body: () => h("div", { class: "material-list", role: "radiogroup", "aria-label": "Material" }, CFG.materials.map((m) =>
        h("button", {
          type: "button",
          role: "radio",
          class: "material" + (m.id === state.material ? " is-selected" : ""),
          "aria-checked": String(m.id === state.material),
          onclick: () => set({ material: m.id }),
        },
          h("img", { src: m.swatch, alt: "" }),
          h("span", { class: "material-text" },
            h("strong", {}, m.name),
            h("span", {}, m.blurb),
            m.badge ? h("span", { class: "badge" }, m.badge) : null)))),
    },
    {
      id: "width",
      title: "Width & length",
      summary: () => `${resolved().width.label} × ${resolved().length.label}`,
      body: () => h("div", { class: "stack" },
        h("div", { class: "widths", role: "radiogroup", "aria-label": "Width" }, CFG.widths.map((w) =>
          h("button", {
            type: "button",
            role: "radio",
            class: "width" + (w.id === state.width ? " is-selected" : ""),
            "aria-checked": String(w.id === state.width),
            onclick: () => set({ width: w.id }),
          },
            h("span", { class: "width-bar", style: `height:${Math.round(w.inches * 30)}px;background:${state.strapColour}` }),
            h("span", {}, w.label)))),
        h("div", { class: "field" },
          h("span", {}, "Length"),
          seg(CFG.lengths.map((l) => [l.id, `${l.label} · ${l.note}`]), state.length, "Length", (id) => set({ length: id })))),
    },
    {
      id: "colour",
      title: "Colour & design",
      summary: () => {
        const r = resolved();
        return colourName(state.strapColour) + (r.design.style !== "solid" ? " · " + byId(CFG.designStyles, r.design.style).name : "");
      },
      body: () => {
        const style = resolved().design.style;
        const designs = resolved().material.designs;
        const twoColour = !["solid", "photo"].includes(style);
        const field = (label, ...children) => h("div", { class: "field" }, h("span", {}, label), ...children);
        return h("div", { class: "stack" },
          designs ? field("Design", h("div", { class: "designs", role: "radiogroup", "aria-label": "Design" }, CFG.designStyles.map((d) =>
            h("button", {
              type: "button",
              role: "radio",
              class: "design" + (d.id === style ? " is-selected" : ""),
              "aria-checked": String(d.id === style),
              onclick: () => set({ designStyle: d.id }),
            }, h("span", { class: "design-chip" }, designSwatch(d.id)), h("span", {}, d.name))))) : null,
          field(twoColour ? "Main colour" : "Strap colour", swatches(state.strapColour, "Strap colour", (hex) => set({ strapColour: hex }))),
          twoColour ? field("Second colour", swatches(state.colour2, "Second colour", (hex) => set({ colour2: hex }))) : null,
          style === "photo" ? photoUpload() : null,
          designs ? null : h("p", { class: "hint" }, "Want stripes, gradients or a photo? Choose Digital Sublimation for full-colour designs."),
          h("p", { class: "hint" }, "Screen colours are approximate. We match to Pantone (PMS) on your proof."));
      },
    },
    {
      id: "imprint",
      title: "Imprint",
      summary: () => {
        const label = { none: "Blank", text: "Text", logo: "Logo", both: "Logo + text" }[state.front.mode];
        return label + (state.sides === "one" ? "" : state.sides === "same" ? ", 2 sides" : ", front & back");
      },
      body: imprintStep,
    },
  ];

  function set(patch) {
    Object.assign(state, patch);
    render();
  }

  function renderSteps() {
    $("#steps").replaceChildren(...STEPS.map((step, i) =>
      h("section", { class: "step is-open", id: "step-" + step.id },
        h("div", { class: "step-head" },
          h("span", { class: "step-num" }, String(i + 1)),
          h("h2", { class: "step-title" }, step.title),
          h("span", { class: "step-summary" }, step.summary())),
        h("div", { class: "step-body" }, step.body()))));
  }

  function renderPreview() {
    const s = resolved();
    const canvas = $("#preview-canvas");
    canvas.innerHTML = window.LanyardRender.renderLanyard(s);
    // The back is drawn as its own view (with the back imprint), not mirrored, so text reads correctly.
    canvas.firstElementChild.style.transform = `scale(${ui.zoom})`;
    $("#zoom-level").textContent = Math.round(ui.zoom * 100) + "%";
    $("#preview-caption").textContent = `${s.material.short} · ${s.width.label} × ${s.length.label} · ${colourName(s.strapColour)} · ${ui.side === "back" ? "Back" : "Front"}`;
    $("#progress-step").textContent = `Step 1 of ${CFG.steps.length}`;
    $("#progress-name").textContent = CFG.steps[0];
    $("#progress-fill").style.width = `${100 / CFG.steps.length}%`;
  }

  function render() {
    renderSteps();
    renderPreview();
  }

  document.querySelectorAll("[data-side]").forEach((btn) => btn.addEventListener("click", () => {
    setSide(btn.dataset.side);
    // With different front and back, the Imprint step follows the side being viewed.
    if (state.sides === "different") { ui.editSide = ui.side; render(); } else renderPreview();
  }));

  const zoomBy = (z) => { ui.zoom = Math.max(0.6, Math.min(2.5, z)); renderPreview(); };
  $("#zoom-in").addEventListener("click", () => zoomBy(ui.zoom + 0.25));
  $("#zoom-out").addEventListener("click", () => zoomBy(ui.zoom - 0.25));
  $("#zoom-reset").addEventListener("click", () => zoomBy(1));

  render();
})();
