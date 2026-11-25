/*
 * Configurator state and UI. Each step is an entry in STEPS with a body()
 * that returns its options; add the next step there as it's built.
 */
(function () {
  const CFG = window.LANYARD_CONFIG;
  const $ = (sel) => document.querySelector(sel);
  const byId = (list, id) => list.find((x) => x.id === id) || list[0];

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
    breakaway: "none",
    // Imprint: "Print on", the imprint type, text and logo are wired up so far.
    sides: "one",
    front: { mode: "text", text: "YOUR BRAND", font: "arial", bold: true, colour: "#f4f4f2", size: "m", spacing: "normal", layout: "repeat", logo: null, logoAspect: 1, logoName: "", logoTint: null },
    back: { mode: "text", text: "www.yourbrand.com", font: "arial", bold: false, colour: "#f4f4f2", size: "m", spacing: "normal", layout: "repeat", logo: null, logoAspect: 1, logoName: "", logoTint: null },
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
      imprint: imprintFor(ui.side),
      side: ui.side,
      breakaway: byId(CFG.breakaways, state.breakaway),
    };
  };

  // Logo colours: "One colour" prints the logo in the imprint colour. Until the
  // customer picks, it follows the material (dye-sub prints full colour).
  const logoTint = (imp) => (imp.logoTint == null ? !byId(CFG.materials, state.material).fullColourLogo : imp.logoTint);

  // What's printed on one side.
  function imprintFor(side) {
    if (side === "back" && state.sides === "one") return null;
    const src = side === "back" && state.sides === "different" ? state.back : state.front;
    if (src.mode === "none") return null;
    return { ...src, text: src.text.trim(), font: byId(CFG.fonts, src.font), logoTint: logoTint(src) };
  }

  function setSide(side) {
    ui.side = side;
    document.querySelectorAll("[data-side]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.side === side)));
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
    return h("div", { class: "swatches", role: "radiogroup", "aria-label": label },
      CFG.colours.map((c) => {
        const sel = c.hex.toLowerCase() === current.toLowerCase();
        return h("button", {
          type: "button",
          role: "radio",
          class: "swatch" + (sel ? " is-selected" : ""),
          "aria-checked": String(sel),
          title: c.name,
          "aria-label": c.name,
          style: `--c:${c.hex}`,
          onclick: () => onpick(c.hex),
        });
      }),
      h("label", { class: "swatch swatch-custom" + (isCustom ? " is-selected" : ""), title: "Custom colour", style: isCustom ? `--c:${current}` : null },
        // change (not input) so the native picker isn't torn down by a re-render while it's open
        h("input", { type: "color", value: current, "aria-label": label + ", custom colour", onchange: (e) => onpick(e.target.value) }),
        h("span", { "aria-hidden": "true" }, "+")));
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

  // Drop zone: click to browse or drag a file onto it. Shows the file once uploaded.
  function upload({ id, label, hint, current, currentName, accept, onFile, onRemove }) {
    const input = h("input", { type: "file", accept, class: "visually-hidden", id,
      onchange: (e) => { onFile(e.target.files[0]); e.target.value = ""; } });
    const drop = h("label", {
      class: "dropzone" + (current ? " has-file" : ""),
      for: id,
      ondragover: (e) => { e.preventDefault(); drop.classList.add("is-over"); },
      ondragleave: () => drop.classList.remove("is-over"),
      ondrop: (e) => { e.preventDefault(); drop.classList.remove("is-over"); onFile(e.dataTransfer.files[0]); },
    },
      current
        ? [h("img", { src: current, alt: "" }), h("span", {}, currentName || "Uploaded", h("br"), h("small", {}, "Click or drop to replace"))]
        : [h("strong", {}, label), h("small", {}, hint)]);
    return h("div", { class: "stack-sm" }, input, drop,
      current ? h("button", { type: "button", class: "link", onclick: onRemove }, "Remove") : null);
  }

  const photoUpload = () => upload({
    id: "photo-input", accept: "image/png,image/jpeg,image/webp",
    label: "Upload a background image", hint: "A wide photo or pattern works best. It repeats along the strap.",
    current: state.photo, currentName: state.photoName, onFile: loadPhoto, onRemove: () => set({ photo: null, photoName: "" }),
  });

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

  // Logo upload: keeps SVGs as they are and shrinks big images to 1200px.
  function loadLogo(file, side) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { alert("Please choose an image file (PNG, JPG, SVG or WebP)."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("That file is over 10 MB. Please use a smaller version."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || 300, nh = img.naturalHeight || 300;
        let logo = reader.result;
        if (file.type !== "image/svg+xml") {
          const k = Math.min(1, 1200 / Math.max(nw, nh));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(nw * k));
          c.height = Math.max(1, Math.round(nh * k));
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          logo = c.toDataURL("image/png");
        }
        set({ [side]: { ...state[side], logo, logoAspect: nw / nh, logoName: file.name } });
      };
      img.onerror = () => alert("We couldn't read that image. Try a PNG or JPG.");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // Imprint step: what's printed, per side when front and back differ.
  function imprintForm() {
    const m = resolved().material;
    const side = state.sides === "different" ? ui.editSide : "front";
    const imp = state[side];
    // Typing only redraws the preview, so the text box keeps focus.
    const setImp = (patch, light) => {
      state[side] = { ...state[side], ...patch };
      if (light) renderPreview(); else render();
    };
    const field = (label, ...body) => h("div", { class: "field" }, h("span", {}, label), ...body);
    const small = (...args) => { const el = seg(...args); el.classList.add("segmented-sm"); return el; };
    const tint = logoTint(imp);
    const hasText = imp.mode === "text" || imp.mode === "both";
    const hasLogo = imp.mode === "logo" || imp.mode === "both";

    return h("div", { class: "stack" },
      field("Print on", seg([["one", "One side"], ["same", "Both sides, same"], ["different", "Front & back different"]], state.sides, "Print on", (v) => {
        if (v === "one") { ui.editSide = "front"; setSide("front"); }
        set({ sides: v });
      })),
      state.sides === "different"
        ? h("div", { class: "side-tabs" }, seg([["front", "Edit front"], ["back", "Edit back"]], ui.editSide, "Side", (v) => { ui.editSide = v; setSide(v); render(); }))
        : null,
      seg([["none", "Blank"], ["text", "Text"], ["logo", "Logo"], ["both", "Logo + text"]], imp.mode, "Imprint type", (v) => setImp({ mode: v })),
      hasText ? h("label", { class: "field" }, h("span", {}, "Text"),
        h("input", { type: "text", maxlength: "60", value: imp.text, placeholder: "Your company, event or slogan",
          oninput: (e) => setImp({ text: e.target.value }, true) })) : null,
      hasText ? h("div", { class: "row" },
        h("label", { class: "field" }, h("span", {}, "Font"),
          h("select", { onchange: (e) => setImp({ font: e.target.value }) },
            CFG.fonts.map((fo) => h("option", { value: fo.id, selected: fo.id === imp.font, style: `font-family:${fo.css}` }, fo.name)))),
        h("label", { class: "check" }, h("input", { type: "checkbox", checked: imp.bold, onchange: (e) => setImp({ bold: e.target.checked }) }), "Bold")) : null,
      hasLogo ? upload({
        id: "logo-input-" + side, accept: "image/png,image/jpeg,image/svg+xml,image/webp",
        label: "Upload your logo", hint: "PNG with a transparent background works best. SVG, JPG and WebP also accepted.",
        current: imp.logo, currentName: imp.logoName, onFile: (f) => loadLogo(f, side),
        onRemove: () => setImp({ logo: null, logoAspect: 1, logoName: "" }),
      }) : null,
      hasLogo && imp.logo ? field("Logo colours",
        seg([["one", "One colour"], ["full", "Full colour"]], tint ? "one" : "full", "Logo colours", (v) => setImp({ logoTint: v === "one" })),
        h("small", { class: "hint" }, tint
          ? "Printed in your imprint colour, the way silkscreen and woven lanyards are usually made."
          : m.fullColourLogo ? "Printed exactly as uploaded." : "Multi-colour logos cost more on silkscreen and may be simplified on woven. We'll confirm on your proof.")) : null,
      // The imprint colour isn't used when only a full-colour logo is printed.
      imp.mode !== "none" && (hasText || tint) ? field("Imprint colour", swatches(imp.colour, "Imprint colour", (hex) => setImp({ colour: hex }))) : null,
      imp.mode !== "none" ? h("div", { class: "row row-wrap" },
        field("Size", small([["s", "S"], ["m", "M"], ["l", "L"]], imp.size, "Size", (v) => setImp({ size: v }))),
        // Spacing is the gap between repeats, or between logo and text when printed once.
        imp.layout === "single" && imp.mode !== "both" ? null
          : field("Spacing", small([["tight", "Tight"], ["normal", "Normal"], ["loose", "Loose"]], imp.spacing, "Spacing", (v) => setImp({ spacing: v }))),
        field("Layout", small([["repeat", "Repeat"], ["single", "Once per side"]], imp.layout, "Layout", (v) => setImp({ layout: v })))) : null,
      imp.mode !== "none" ? h("p", { class: "hint" }, m.imprintNote) : null);
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
      summary: () => ({ none: "Blank", text: "Text", logo: "Logo", both: "Logo + text" })[state.front.mode] +
        ({ one: "", same: ", 2 sides", different: ", front & back" })[state.sides],
      body: imprintForm,
    },
    {
      // Plain HTML for now. Only No breakaway, XBA and CYL-BA are wired up;
      // the others are greyed out until they are.
      id: "breakaway",
      title: "Safety breakaway",
      summary: () => byId(CFG.breakaways, state.breakaway).name,
      body: () => h("div", {},
        h("p", {}, "Releases at the back of the neck if the lanyard is pulled. Recommended for events, schools and workplaces."),
        h("fieldset", {}, h("legend", {}, "Safety breakaway"), CFG.breakaways.map((o) =>
          h("label", {},
            h("input", { type: "radio", name: "breakaway", value: o.id, checked: o.id === state.breakaway,
              disabled: o.id !== "none" && !o.box, onchange: () => set({ breakaway: o.id }) }), " ",
            o.img ? h("img", { src: o.img, alt: "", width: "120" }) : null, " ",
            o.name, o.code ? ` (${o.code})` : "", h("br"))))),
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
    // The back is drawn as its own view (with the back text), not mirrored, so text reads correctly.
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
    // With different front and back text, the Imprint step edits the side being viewed.
    if (state.sides === "different") { ui.editSide = ui.side; render(); } else renderPreview();
  }));

  const zoomBy = (z) => { ui.zoom = Math.max(0.6, Math.min(2.5, z)); renderPreview(); };
  $("#zoom-in").addEventListener("click", () => zoomBy(ui.zoom + 0.25));
  $("#zoom-out").addEventListener("click", () => zoomBy(ui.zoom - 0.25));
  $("#zoom-reset").addEventListener("click", () => zoomBy(1));

  render();
})();
