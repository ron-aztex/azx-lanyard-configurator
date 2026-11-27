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
      imprintNote: "Printed in solid spot colours (PMS matched).",
      fullColourLogo: false,
    },
    {
      id: "woven-polyester",
      name: "Coarse Woven on Polyester",
      short: "Woven",
      blurb: "Your design is woven into the fabric. Premium feel that never fades or peels.",
      swatch: "assets/materials/coarse-woven-on-polyester.jpg",
      texture: "woven",
      imprintNote: "Woven thread colours. Best for bold text and simple logos.",
      fullColourLogo: false,
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
      imprintNote: "Full colour. Logos print exactly as uploaded.",
      fullColourLogo: true,
    },
  ],

  // Safety breakaways (Safety breakaway step). box = the image's
  // [width, height, visible left, top, right, bottom], in pixels, used to place the part on the preview
  breakaways: [
    { id: "none",     code: "",             name: "No breakaway" },
    { id: "xba",      code: "XBA",          name: "Breakaway 2",            img: "assets/attachments/xba-breakaway-2.png", box: [301, 109, 66, 0, 235, 75] },
    { id: "xba2p",    code: "XBA2P",        name: "Breakaway 2P",           img: "assets/attachments/xba2p-breakaway-2p.png", box: [301, 108, 74, 0, 227, 74] },
    { id: "xbasew",   code: "XBASEW",       name: "Breakaway clip, black",  img: "assets/attachments/xbasew-breakaway-clip.png", box: [301, 109, 75, 0, 226, 76] },
    { id: "xbasew-w", code: "XBASEW White", name: "Breakaway clip, white",  img: "assets/attachments/xbasew-white-breakaway-clip.png", box: [301, 109, 78, 2, 223, 75] },
    { id: "xvel",     code: "XVEL",         name: "Velcro-style breakaway", img: "assets/attachments/xvel-breakaway.png", box: [301, 127, 88, 0, 213, 93] },
    { id: "cyl",      code: "CYL-BA",       name: "Cylindrical breakaway",  img: "assets/attachments/cylindrical-breakaway.png", box: [301, 91, 55, 1, 246, 59] },
  ],

  // Fittings step (plain HTML so far, not drawn on the preview yet).
  // End finish: where the strap meets the hook.
  endFinishes: [
    { id: "sewn",        code: "",            name: "Sewn (standard)" },
    { id: "crimp-l",     code: "CRIMP-L",     name: "Crimp, silver, large", img: "assets/attachments/crimped-large.png" },
    { id: "crimp-s",     code: "CRIMP-S",     name: "Crimp, silver, small", img: "assets/attachments/crimped-small.png" },
    { id: "crimp-blk-l", code: "CRIMP-BLK-L", name: "Crimp, black, large",  img: "assets/attachments/crimped-blk-large.png" },
    { id: "crimp-blk-s", code: "CRIMP-BLK-S", name: "Crimp, black, small",  img: "assets/attachments/crimped-blk-small.png" },
  ],
  // Slider or bead: slides on both strands just above where they join (adjusts the drop).
  adjusters: [
    { id: "none",        code: "",         name: "None" },
    { id: "slider",      code: "SLIDER",   name: "Slider",      img: "assets/attachments/slider.png" },
    { id: "bead-black",  code: "BEAD-BLK", name: "Black bead",  img: "assets/attachments/black-bead.png" },
    { id: "bead-silver", code: "BEAD-SLV", name: "Silver bead", img: "assets/attachments/silver-bead.png" },
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

  // Imprint fonts. Only "Print on" and the Text fields of the Imprint step are
  // wired up so far; the rest of that step is HTML only.
  fonts: [
    { id: "arial",     name: "Arial",     css: "Arial, Helvetica, sans-serif" },
    { id: "impact",    name: "Impact",    css: "Impact, 'Arial Narrow Bold', sans-serif" },
    { id: "verdana",   name: "Verdana",   css: "Verdana, Geneva, sans-serif" },
    { id: "trebuchet", name: "Trebuchet", css: "'Trebuchet MS', sans-serif" },
    { id: "georgia",   name: "Georgia",   css: "Georgia, 'Times New Roman', serif" },
    { id: "courier",   name: "Courier",   css: "'Courier New', Courier, monospace" },
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
