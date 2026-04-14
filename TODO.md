# Portfolio TODOs

## 1. Real Project Detail Pages

Each project should open a complete case-study page. The current data-driven `project.html` is the base for this, but the content model should be expanded until every project can include:

- overview
- role
- tools
- challenge
- process
- final result
- gallery images
- carousel images and videos
- next/previous project links

Notes:

- Sections should only render when the project has content for them.
- Project content should stay editable from `data/projects-data.js`.
- Next/previous links should follow the project order in `data/projects-data.js`.

## 2. Landing Sections As Teasers

The landing page should feel like a preview, not the full archive.

- Show a small number of featured cards per category.
- Keep `featured: true` as the control for what appears on the landing page.
- Add a "view all" link for each full category page:
  - design gráfico
  - ux/ui
  - ilustração
  - about

## 3. Active Nav Refinement

The section pages already have active states, and the landing page can stay neutral.

- Refine the active state into a small dot instead of an underline.
- Keep the style aligned with the soft/glossy design system.
- Make sure the active state works on all non-landing pages.

## 4. Selected Work Filter Or Tabs

Optional polish for the landing page.

- Add tabs or filters for:
  - all
  - design gráfico
  - ux/ui
  - ilustração
- Keep separate category pages as the deeper archive.
- Only add this if it makes the landing page feel clearer, not heavier.

## 5. Replace Placeholder Card Content

Replace the placeholder projects with real portfolio material.

- Real project names.
- Real screenshots, mockups, and thumbnails.
- Short descriptions.
- Accurate project metadata.
- Project-specific images and videos inside `imagesProjects/project-slug/`.

## 6. Better Mobile Nav

The menu icon should open an actual mobile menu.

Mobile menu links:

- design gráfico
- ux/ui
- ilustração
- about
- View CV
- Contact

Notes:

- The menu should be keyboard accessible.
- It should close when a link is clicked.
- It should close with Escape.

## 7. Make Contact Work

The contact CTA should link to a real destination.

Easiest good option:

```html
<a href="mailto:your.email@example.com">Send a message</a>
```

Other options:

- WhatsApp
- LinkedIn
- Behance
- contact form

## 8. Add Social Proof

Add a small credibility section.

Possible content:

- clients
- collaborations
- awards
- courses/certifications
- testimonials

Even 2-3 real items would make the portfolio feel more mature.

## 9. Add Microcopy To Project Cards

Project cards should include a one-line description under the title or metadata.

Examples:

- "Brand system for a coastal lifestyle studio."
- "Mobile flow redesign for daily review habits."

This should come from `data/projects-data.js`, probably from a `cardDescription` field.

## 10. Improve Accessibility And SEO

Useful details:

- page titles and meta descriptions per page
- meaningful alt text for real project images
- focus states for all links/buttons
- aria-labels on icon-only arrows
- no dead `href="#"` links once project pages exist
- logical heading structure
- keyboard-accessible carousel controls
