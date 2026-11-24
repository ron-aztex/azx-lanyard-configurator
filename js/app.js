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
    // Imprint: "Print on", the imprint type, text and logo are wired up so far.
    sides: "one",
    front: { mode: "text", text: "YOUR BRAND", font: "arial", bold: true, colour: "white", size: "m", logo: null, logoAspect: 1, logoName: "" },
    back: { mode: "text", text: "www.yourbrand.com", font: "arial", bold: false, colour: "white", size: "m", logo: null, logoAspect: 1, logoName: "" },
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
    };
  };

  // What's printed on one side. The logo prints as uploaded (the imprint colour
  // is used for the text); spacing and layout use fixed defaults for now.
  function imprintFor(side) {
    if (side === "back" && state.sides === "one") return null;
    const src = side === "back" && state.sides === "different" ? state.back : state.front;
    if (src.mode === "none") return null;
    return { ...src, text: src.text.trim(), font: byId(CFG.fonts, src.font), colour: byId(CFG.colours, src.colour).hex, spacing: "normal" };
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

  // Imprint step: "Print on", Imprint, Text (font, bold), Logo, Imprint colour and Size work;
  // Logo colours, Spacing and Layout are HTML only for now.
  function imprintForm() {
    const radios = (name, legend, options, checked, onpick) =>
      h("fieldset", {}, h("legend", {}, legend), options.map(([id, text]) =>
        h("label", {},
          h("input", { type: "radio", name, value: id, checked: id === checked, onchange: onpick ? () => onpick(id) : null }),
          " " + text, h("br"))));
    const side = state.sides === "different" ? ui.editSide : "front";
    const imp = state[side];
    // Typing only redraws the preview, so the text box keeps focus.
    const setImp = (patch, light) => {
      state[side] = { ...state[side], ...patch };
      if (light) renderPreview(); else render();
    };
    return h("div", {},
      radios("imp-sides", "Print on", [["one", "One side"], ["same", "Both sides, same"], ["different", "Front & back different"]], state.sides, (v) => {
        if (v === "one") { ui.editSide = "front"; setSide("front"); }
        set({ sides: v });
      }),
      state.sides === "different"
        ? radios("imp-edit-side", "Editing", [["front", "Front"], ["back", "Back"]], ui.editSide, (v) => { ui.editSide = v; setSide(v); render(); })
        : null,
      radios("imp-mode", state.sides === "different" ? `Imprint (${side})` : "Imprint",
        [["none", "Blank"], ["text", "Text"], ["logo", "Logo"], ["both", "Logo + text"]], imp.mode, (v) => setImp({ mode: v })),
      imp.mode === "text" || imp.mode === "both" ? h("fieldset", {}, h("legend", {}, state.sides === "different" ? `Text (${side})` : "Text"),
        h("label", {}, "Text ",
          h("input", { type: "text", maxlength: "60", value: imp.text, placeholder: "Your company, event or slogan",
            oninput: (e) => setImp({ text: e.target.value }, true) })), h("br"),
        h("label", {}, "Font ",
          h("select", { onchange: (e) => setImp({ font: e.target.value }) },
            CFG.fonts.map((fo) => h("option", { value: fo.id, selected: fo.id === imp.font }, fo.name)))), " ",
        h("label", {}, h("input", { type: "checkbox", checked: imp.bold, onchange: (e) => setImp({ bold: e.target.checked }) }), " Bold")) : null,
      imp.mode === "logo" || imp.mode === "both" ? h("fieldset", {}, h("legend", {}, state.sides === "different" ? `Logo (${side})` : "Logo"),
        imp.logo
          ? h("p", {}, "Uploaded: " + imp.logoName + " ",
              h("button", { type: "button", onclick: () => setImp({ logo: null, logoAspect: 1, logoName: "" }) }, "Remove"))
          : null,
        h("label", {}, imp.logo ? "Replace logo " : "Upload your logo ",
          h("input", { type: "file", accept: "image/png,image/jpeg,image/svg+xml,image/webp",
            onchange: (e) => { loadLogo(e.target.files[0], side); e.target.value = ""; } })), h("br"),
        "PNG with a transparent background works best. SVG, JPG and WebP also accepted.") : null,
      radios("imp-logo-colours", "Logo colours", [["one", "One colour"], ["full", "Full colour"]], "one"),
      imp.mode === "none" ? null : radios("imp-colour", "Imprint colour", CFG.colours.map((c) => [c.id, c.name]), imp.colour, (v) => setImp({ colour: v })),
      imp.mode === "none" ? null : radios("imp-size", "Size", [["s", "S"], ["m", "M"], ["l", "L"]], imp.size, (v) => setImp({ size: v })),
      radios("imp-spacing", "Spacing", [["tight", "Tight"], ["normal", "Normal"], ["loose", "Loose"]], "normal"),
      radios("imp-layout", "Layout", [["repeat", "Repeat"], ["single", "Once per side"]], "repeat"));
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
      summary: () => ({ one: "One side", same: "2 sides, same", different: "Front & back" })[state.sides] +
        (state.sides === "different" ? "" : " · " + ({ none: "Blank", text: "Text", logo: "Logo", both: "Logo + text" })[state.front.mode]),
      body: imprintForm,
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
