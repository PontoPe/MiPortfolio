# LUDIS case study — code recreation

Static recreation of the Figma frame **art1** (page *ludis*) from
`Portfolio` (`IvX12drB01aSCTI6ObHib4`), built from the exported `art1.png`
because the Figma MCP connector hit the Starter-plan tool-call limit.

## Run

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321

## Files

| Path | What it is |
|---|---|
| `index.html` | Page structure, all copy as real selectable text |
| `styles.css` | All styling; design tokens live in `:root` |
| `assets/` | 34 PNGs cropped out of `art1.png` |
| `art1.png` | The original Figma export (source of truth) |

## How it scales

The Figma canvas is 1920 px wide. `html { font-size: min(10px, 0.5208vw) }`
makes **1rem = 10 design px**, so every value in `styles.css` is the Figma
measurement divided by 10 and the whole page scales proportionally down to
1024 px. Below that a breakpoint reflows to single-column and resets the
scale so text stays readable.

Section offsets land within 8 px of the original at 1920 px wide; total page
height is 15110 px vs. 15111 px in the export.

## Known substitutions

- **Typeface.** The original is a geometric sans with a double-storey `a`
  and an angled `t` — most likely a licensed face (Sofia Pro / Greycliff
  family). It is not embedded in the PNG, so the page uses **Figtree** from
  Google Fonts. Swap it in one place: `--font` in `:root`. Line breaks in a
  few paragraphs will shift slightly with a different face.
- **Imagery is raster.** Phone mockups, the bento board, the mascot, the
  screen wall and the before/after comparison are cropped from `art1.png`
  rather than rebuilt. Re-export them from Figma as SVG/2× PNG when the
  connector quota is available and drop them into `assets/` under the same
  names.
- **The before/after slider is a static image.** In Figma it is a
  "slide for before and after" interaction; here it is the composed frame.
- **Links are `#` placeholders** — nav, "view our design system", "view
  interview protocol", "view LUDIS' marketing project".

## Colours lifted from the export

| Token | Value | Used for |
|---|---|---|
| `--heading` | `#6f6a99` | section headings |
| `--ink` | `#5b5e6d` | body copy |
| `--violet` | `#7672a3` | result stats |
| `--lav-bg` | `#f1efff` | tinted section bands |
| `--lav-card` | `#e3e0ff` | cards on tinted bands |
| `--lav-solid` | `#b9b1ff` | buttons, list rules |
| `--chip` | `#e2aafd` | outline chips |
| `--cyan` | `#8ed6ed` | "product design" tag |
| `--green` | `#7db96e` | "shipped" tag, availability dot |
