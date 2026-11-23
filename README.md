# AZX Lanyard Configurator

Static site (no build step): `index.html`, `css/`, `js/`, `assets/`. Deployed on Vercel.

Run locally:

```bash
npx serve .
```

## Progress

- [x] Layout: live preview on the left, option steps on the right
- [x] Preview: flat lay, front/back, zoom
- [x] Step 1, Material (silkscreen, woven, dye-sub satin) with real fabric textures
- [x] Step 2, Width & length (3/8" to 1"; 32", 36", 40"): styled like the design: width cards and a length segmented control; the preview strap gets wider and hangs lower
- [x] Step 3, Colour & design: 17 colours + custom, second colour, 9 designs on dye-sub incl. your own image, styled like the design (design tiles, round swatches, upload drop zone); the preview draws them
- [ ] Imprint (text + logo): "Print on", Imprint (Blank / Text / Logo / Logo + text), Text and Logo upload work (drawn on the preview, back side shows its own); logo colours, imprint colour, size, spacing and layout are HTML only
- [ ] Hardware: breakaway, end finish, buckle, attachment, add-ons
- [ ] Worn view
- [ ] Quote form, share link, PDF proof

Options live in `js/config.js`; the preview drawing is in `js/render.js`.
