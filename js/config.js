/*
 * Catalogue for the lanyard configurator. Add options here; the UI reads from it.
 * Materials, widths, lengths, colours and designs are wired up so far.
 * Imprint and hardware come in later steps.
 */
window.LANYARD_CONFIG = {
  steps: ["Material", "Width & length", "Colour & design", "Imprint", "Safety breakaway", "Fittings", "Detachable buckle", "Hook & attachment", "Badge holder & add-ons", "Quantity & quote"],

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
      designs: true,
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

  // Background designs. Only offered on materials with `designs: true` (dye-sub).
  designStyles: [
    { id: "solid",         name: "Solid" },
    { id: "gradient",      name: "Gradient" },
    { id: "stripe-centre", name: "Centre stripe" },
    { id: "stripe-edges",  name: "Edge stripes" },
    { id: "dots",          name: "Dots" },
    { id: "chevron",       name: "Chevron" },
    { id: "diagonal",      name: "Diagonal" },
    { id: "checks",        name: "Checks" },
    { id: "photo",         name: "Your image" },
  ],

  colours: [
    { id: "black",   name: "Black",       hex: "#1b1b1d" },
    { id: "white",   name: "White",       hex: "#f4f4f2" },
    { id: "grey",    name: "Grey",        hex: "#8a8d91" },
    { id: "navy",    name: "Navy",        hex: "#1d2a4a" },
    { id: "royal",   name: "Royal Blue",  hex: "#1f4fbf" },
    { id: "sky",     name: "Light Blue",  hex: "#68a8de" },
    { id: "teal",    name: "Teal",        hex: "#0f7c80" },
    { id: "green",   name: "Kelly Green", hex: "#1e7b34" },
    { id: "lime",    name: "Lime",        hex: "#8cc63f" },
    { id: "yellow",  name: "Yellow",      hex: "#f6d32d" },
    { id: "gold",    name: "Gold",        hex: "#c9a227" },
    { id: "orange",  name: "Orange",      hex: "#ef7b1e" },
    { id: "red",     name: "Red",         hex: "#c8102e" },
    { id: "maroon",  name: "Maroon",      hex: "#6d1a2c" },
    { id: "pink",    name: "Pink",        hex: "#e86fa5" },
    { id: "purple",  name: "Purple",      hex: "#5b2a86" },
    { id: "brown",   name: "Brown",       hex: "#5a3b26" },
  ],

  defaults: {
    material: "silkscreen-flat",
    width: "3-4",
    length: "36",
    strapColour: "#1f4fbf",
    designStyle: "solid",
    colour2: "#f6d32d",
  },
};
