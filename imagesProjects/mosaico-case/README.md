# Mosaico case page — expected media

`case-mosaico.html` references these filenames. Every `<img>` on that page has an
`onerror` that swaps it for a dashed placeholder showing the expected path, so the
page works with none of them present and fills in as files land here. Just drop a
file with the matching name — no code change needed.

| File | Screen | What it should show |
| --- | --- | --- |
| `diagram-final.png` | 1 · Hero | The finished Mosaico diagram — the **coloured version, after the study's adjustments**. Landscape, 4:3. This is the single most valuable image on the page. |
| `method-diagram.png` | 4 · Method | The diagram again, large and legible: three phases (Exposition / Action / Resolution) plus the auxiliary tools attached to each step. 16:10. |
| `guide-spread.jpg` | 5 · In use | A photograph of the guide open on a spread — ideally one of the auxiliary-tool pages, where a tool and its source sit together. 4:3. The guide is an object; a photograph of it says that better than a PDF export. |
| `steps-before-after.png` | 8 · The call | The step sequence before and after external validation was removed — Figure 31 of the thesis, **redrawn clean**, not a screenshot of the PDF. 16:9. |
| `iteration-onboarding.png` | 9 · Iteration | The intro/onboarding text before and after the rewrite. 4:3. |
| `iteration-visual-language.png` | 9 · Iteration | The visual language before and after the warmer treatment — Figure 32, redrawn. 4:3. |
| `iteration-steps.png` | 9 · Iteration | The restructured stages after the validation swap. 4:3. |
| `fanzine-cover.jpg` | 10 · Artefacts | Photograph of the printed fanzine cover. Portrait, 4:5. A real photograph of the physical object beats a flat export. |
| `fanzine-spread.jpg` | 10 · Artefacts | An interior spread of the fanzine. Portrait, 4:5. |
| `diary-01.jpg` | 10 · Artefacts | A page from a participant's diary study — **anonymized, used with permission**. Portrait, 4:5. |
| `diary-02.jpg` | 10 · Artefacts | A second diary page, same conditions. Portrait, 4:5. |

## Built in code, not needed as images

These were figures in the thesis but the page draws them natively, so they stay
sharp, responsive and readable on a phone — don't export them:

- The nine analysed methodologies and the four selection criteria (screen 3).
- The six emotional arcs (screen 3) — inline SVG, drawn on scroll.
- The three phases and their sixteen steps (screen 4).
- The ten auxiliary tools and the guide's worked example (screen 5) — all
  transcribed from `references/Mosaico/GuiaDigital_Mosaico.pdf`.
- The two contrast groups and the study flow (screen 6).
- The removed-vs-replaced validation step (screen 9).

## Permissions

The diary pages and the fanzine contain participants' work. Only publish what the
consent covers, and keep names out of frame — the captions on the page already
say "anonymized, used with permission", so the images have to match that claim.

Copy still to write is marked in the HTML with `class="todo"` — grep for it.
