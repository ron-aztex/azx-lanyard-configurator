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

  const resolved = () => ({
    ...state,
    material: byId(CFG.materials, state.material),
    width: byId(CFG.widths, state.width),
    length: byId(CFG.lengths, state.length),
  });

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
    $("#preview-caption").textContent = `${s.material.short} · ${s.width.label} × ${s.length.label} · ${ui.side === "back" ? "Back" : "Front"}`;
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
