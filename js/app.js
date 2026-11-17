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
    widthInches: CFG.defaults.widthInches,
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

  const resolved = () => ({ ...state, material: byId(CFG.materials, state.material) });

  const STEPS = [
    {
      id: "material",
      title: "Material",
      body: () => CFG.materials.map((m) =>
        h("label", { class: "option" },
          h("input", {
            type: "radio",
            name: "material",
            value: m.id,
            checked: m.id === state.material,
            onchange: () => set({ material: m.id }),
          }),
          h("img", { src: m.swatch, alt: "", width: "60", height: "60" }),
          h("span", {},
            h("b", {}, m.name),
            m.badge ? ` (${m.badge})` : null,
            h("br"),
            m.blurb))),
    },
  ];

  function set(patch) {
    Object.assign(state, patch);
    render();
  }

  function renderSteps() {
    $("#steps").replaceChildren(...STEPS.map((step, i) =>
      h("fieldset", {},
        h("legend", {}, `Step ${i + 1}: ${step.title}`),
        step.body())));
  }

  function renderPreview() {
    const s = resolved();
    const canvas = $("#preview-canvas");
    canvas.innerHTML = window.LanyardRender.renderLanyard(s);
    canvas.firstElementChild.style.transform = `scale(${ui.zoom})${ui.side === "back" ? " scaleX(-1)" : ""}`;
    $("#zoom-level").textContent = Math.round(ui.zoom * 100) + "%";
    $("#preview-caption").textContent = `${s.material.short} · ${ui.side === "back" ? "Back" : "Front"}`;
    $("#progress").textContent = `Step 1 of ${CFG.steps.length} · ${CFG.steps[0]}`;
  }

  function render() {
    renderSteps();
    renderPreview();
  }

  document.querySelectorAll("input[name=side]").forEach((input) => input.addEventListener("change", () => {
    ui.side = input.value;
    renderPreview();
  }));

  const zoomBy = (z) => { ui.zoom = Math.max(0.6, Math.min(2.5, z)); renderPreview(); };
  $("#zoom-in").addEventListener("click", () => zoomBy(ui.zoom + 0.25));
  $("#zoom-out").addEventListener("click", () => zoomBy(ui.zoom - 0.25));
  $("#zoom-reset").addEventListener("click", () => zoomBy(1));

  render();
})();
