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
  };
  const ui = { side: "front", zoom: 1 };

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
    };
  };

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
    canvas.firstElementChild.style.transform = `scale(${ui.zoom})${ui.side === "back" ? " scaleX(-1)" : ""}`;
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
    ui.side = btn.dataset.side;
    document.querySelectorAll("[data-side]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderPreview();
  }));

  const zoomBy = (z) => { ui.zoom = Math.max(0.6, Math.min(2.5, z)); renderPreview(); };
  $("#zoom-in").addEventListener("click", () => zoomBy(ui.zoom + 0.25));
  $("#zoom-out").addEventListener("click", () => zoomBy(ui.zoom - 0.25));
  $("#zoom-reset").addEventListener("click", () => zoomBy(1));

  render();
})();
