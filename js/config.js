/*
 * Catalogue for the lanyard configurator. Add options here; the UI reads from it.
 * Materials, widths and lengths are wired up so far. Colours, imprint and
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

  widths: [
    { id: "3-8", label: '3/8"', inches: 0.375 },
    { id: "1-2", label: '1/2"', inches: 0.5 },
    { id: "5-8", label: '5/8"', inches: 0.625 },
    { id: "3-4", label: '3/4"', inches: 0.75 },
    { id: "7-8", label: '7/8"', inches: 0.875 },
    { id: "1",   label: '1"',   inches: 1.0 },
  ],

  lengths: [
    { id: "32", label: '32"', inches: 32, note: '16" drop' },
    { id: "36", label: '36"', inches: 36, note: '18" drop, standard' },
    { id: "40", label: '40"', inches: 40, note: '20" drop' },
  ],

  // strapColour is a placeholder until the Colours step exists.
  defaults: {
    material: "silkscreen-flat",
    width: "3-4",
    length: "36",
    strapColour: "#1f4fbf",
  },
};
