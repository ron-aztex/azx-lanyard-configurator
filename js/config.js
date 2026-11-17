/*
 * Catalogue for the lanyard configurator. Add options here; the UI reads from it.
 * Only materials are wired up so far. Widths, lengths, colours, imprint and
 * hardware come in later steps.
 */
window.LANYARD_CONFIG = {
  steps: ["Material", "Width", "Length", "Colours", "Imprint", "Breakaway", "End finish", "Buckle", "Attachment", "Quote"],

  materials: [
    {
      id: "silkscreen-flat",
      name: "Silkscreen on Flat Polyester",
      short: "Silkscreen",
      blurb: "Ribbed flat polyester with screen-printed spot colours. Our most popular, budget-friendly option.",
      swatch: "assets/materials/silkscreen-on-flat.jpg",
      texture: "flat",
    },
    {
      id: "woven-polyester",
      name: "Coarse Woven on Polyester",
      short: "Woven",
      blurb: "Your design is woven into the fabric. Premium feel that never fades or peels.",
      swatch: "assets/materials/coarse-woven-on-polyester.jpg",
      texture: "woven",
    },
    {
      id: "dye-sub-satin",
      name: "Digital Sublimation on Thick Satin",
      short: "Dye-sub satin",
      blurb: "Full-colour, edge-to-edge printing on smooth satin. Gradients, photos and detailed logos.",
      swatch: "assets/materials/digital-sublimation-on-thick-satin.jpg",
      texture: "satin",
      badge: "Full-colour designs",
    },
  ],

  // Placeholders until the Width and Colours steps exist.
  defaults: {
    material: "silkscreen-flat",
    widthInches: 0.75,
    strapColour: "#1f4fbf",
  },
};
