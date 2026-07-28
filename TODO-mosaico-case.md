# Mosaico case — what's still missing

The page is built and all twelve screens are written. What's left is media, two
copy slots, and wiring the project into the portfolio index.

Two kinds of gap, both visible on the page itself so nothing gets forgotten:

- **Copy** — yellow dashed slots reading `FILL: …`. Markup: `<span class="todo">`.
- **Media** — dashed frames showing the expected file path.

Find them in the source:

```bash
grep -n 'class="todo"' case-mosaico.html
```

---

## 1 · Nothing links to this page yet

`data/projects-data.js` is regenerated from Notion on every build and has **no
Mosaico project in it** — so the case exists at `case-mosaico.html` but no card
on the site points to it.

To wire it up, add the project to the Notion "Portfolio Projects" database with
slug **`mosaico`**, in the **UX/UI** category. `scripts/portfolio-render.js`
already maps that slug to this page:

```js
const casePages = {
    "ludis-social": "case-ludis.html",
    "mosaico": "case-mosaico.html"
};
```

The blueprint also asks for the portfolio order **Mosaico → Hospital → LUDIS**,
with NOMMU removed. Card order follows the project order in
`data/projects-data.js`, so that's a Notion change too, not a code one.

Card fields worth setting, from the blueprint:

- **Title** — Mosaico
- **Card meta** — UX Research · Learning Experience Design
- **Thumbnail** — the coloured final diagram (same asset as `diagram-final.png`)

---

## 2 · Copy — 3 slots

| Screen | Slot | Note |
| --- | --- | --- |
| 5 · In use | age range | In the worked example, the guide reads "grupo focal composto por jóvens e **28 a 25** anos". That's a typo in the PDF; the page assumes **18**–25 and marks the 18 as unfilled. Confirm the real range, or drop the numbers and leave it at "young adults". |
| 13 · Next | v2 link | Where "follow it here →" should point: the Mosaico v2 case once it exists, or the build-log posts while the pilot runs. Until there's a destination, this screen ends on a promise it can't keep. |
| 13 · Next | institution | The university, for the discreet thesis footnote. Deliberately the last line on the page — the case is about the problem, not the degree. |

---

## 3 · Media — 11 slots

Drop a file with the matching name into `imagesProjects/mosaico-case/` and the
placeholder fills itself — no code change. Full table with intended content and
aspect ratios in that folder's README.

Priority order, because they aren't worth the same:

1. **`diagram-final.png`** — screen 1. The hero. Without it the first screen is
   half a screen.
2. **`method-diagram.png`** — screen 4. The tool itself, large and legible.
3. **`fanzine-cover.jpg` / `fanzine-spread.jpg`** — screen 11. A photograph of
   the printed object is the most convincing image in the case: it's the proof
   that the study produced writing, not opinions about writing.
4. **`guide-spread.jpg`** — screen 5. The guide open on a spread. Same argument
   as the fanzine: it's an object, photograph it.
5. **`steps-before-after.png`** — screen 9. Figure 31, redrawn clean.
6. **`iteration-onboarding.png` / `iteration-visual-language.png` /
   `iteration-steps.png`** — screen 10.
7. **`diary-01.jpg` / `diary-02.jpg`** — screen 11. Only what consent covers,
   names out of frame. The captions on the page claim "anonymized, used with
   permission" and the images have to match that claim.

**Redraw, don't screenshot.** Figures 31 and 32 exist as thesis PDF pages. A
recruiter can tell the difference between an exported figure and a screenshot of
a PDF, and the difference reads as care.

---

## 4 · Drawn in code, not needed as images

These were figures in the thesis or pages of the guide, but the page renders
them natively — they stay sharp and readable on a phone. Don't export them:

- the nine methodologies and the four criteria (screen 3)
- the six emotional arcs, inline SVG, drawn on scroll (screen 3)
- the three phases and their sixteen steps (screen 4)
- the ten auxiliary tools and the guide's worked example (screen 5)
- the two contrast groups and the study flow (screen 6)
- the removed-vs-replaced validation step (screen 9)

Screens 4 and 5 are transcribed from `references/Mosaico/GuiaDigital_Mosaico.pdf`
— phases, step names, tool list, sources and the worked example all come from
the guide itself rather than from a summary of it.

---

## 5 · The screen that expires

Screen 12 is written as of the pilot being **in progress**. It has a live
indicator and present-tense copy. When the pilot ends, this screen becomes the
link to the v2 case and the copy needs rewriting — a "study running now" badge
on a study that finished a year ago is worse than no badge.

---

## The 90-second test

Someone reads screens 1 and 7 only — the hero and the teacher. Do they come away
knowing she designed a method, measured it honestly, and that someone adopted it
without being asked? If yes, the case works.
