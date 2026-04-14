# Design System Document: High-End Editorial Portfolio

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Ethereal Editor."** 

Milena’s brand is not just about graphic design; it is about the intersection of Brazilian warmth and high-concept execution. This system rejects the rigid, boxy constraints of traditional web grids in favor of a fluid, layered experience that feels like a curated gallery. We achieve this through "The Ethereal Editor" philosophy: using glassmorphism to create a sense of weightlessness, and intentional typographic "interruptions" to showcase personality. The layout should feel like a high-end fashion magazine digitalized—airy, sophisticated, and deeply intentional.

## 2. Colors
The palette is a sophisticated blend of soft pastels and deep, authoritative purples, creating a high-contrast editorial feel while maintaining a "dreamlike" atmosphere.

### The Color Strategy
*   **The "No-Line" Rule:** Never use 1px solid borders to define sections. Transitions between the `background` (#f7f6fc) and content areas must be achieved through subtle shifts to `surface_container_low` or `surface_container`.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. A base `surface` might host a `surface_container_lowest` card to create a soft "lift." Use the hierarchy from `lowest` to `highest` to dictate importance—the higher the container tier, the closer it should appear to the user.
*   **The "Glass & Gradient" Rule:** All primary navigation and floating "hero" cards should utilize a glassmorphism effect. Use `surface_container_lowest` with an opacity of 40-60% and a `backdrop-blur` of 20px–40px. 
*   **Signature Textures:** For main CTAs and the Hero background, apply a linear gradient from `primary` (#5b509f) to `primary_container` (#afa3f9) at a 135-degree angle. This provides a "soul" to the digital surface that a flat color cannot.

## 3. Typography
The typography is the voice of the system. It pairs the structural elegance of Epilogue and Plus Jakarta Sans with specific stylistic "signatures" that highlight Milena's diverse skill set.

*   **Display (Epilogue):** Used for large-scale hero statements. Bold, confident, and editorial.
*   **Headline/Title (Epilogue & Plus Jakarta Sans):** Used for section headers and project titles. Use `on_surface` (#2d2e33) to maintain readability.
*   **Body (Plus Jakarta Sans):** Designed for maximum legibility in project descriptions.
*   **Labels (Space Grotesk):** For technical data and tags.

### Typographic Signatures
To break the "template" feel, specific words within headlines must be styled uniquely:
*   **'storytelling'**: A whimsical, fluid script font (e.g., a custom signature-style font).
*   **'fast-paced'**: *Plus Jakarta Sans Italic*, slightly tracked out to suggest velocity.
*   **'creativity'**: A hand-drawn/marker style font to represent the "sketch to final" process.
*   **'innovation'**: *Space Grotesk* (Monospaced), conveying technical precision.

## 4. Elevation & Depth
In this design system, depth is a feeling, not a shadow.

*   **The Layering Principle:** Avoid the "Sticker Effect" (flat items on a flat background). Always nest containers. A portfolio grid should sit on a `surface_container_low`, while the individual project cards sit on `surface_container_lowest`.
*   **Ambient Shadows:** Use shadows sparingly. When needed (e.g., for a floating CTA), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(91, 80, 159, 0.08);`. The shadow is tinted with the `primary` color to feel natural under the peachy-pink light.
*   **The "Ghost Border" Fallback:** If a container needs a edge (like a search bar), use the `outline_variant` (#adadb2) at **15% opacity**. This creates a "breath" of a line rather than a hard boundary.
*   **Glassmorphism Depth:** Reference IMAGE_1 for the "frosted" sidebar. Use a semi-transparent `surface` layer to allow the pastel gradient background to bleed through. This anchors the UI into the environment.

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `full` roundedness, white `on_primary` text. No shadow; use a subtle `surface_tint` glow on hover.
*   **Secondary/Ghost:** `outline_variant` (15% opacity) border with `primary` text. Use a `lg` (1rem) corner radius.

### Chips (Project Tags)
*   **Style:** Using `surface_container_high`, no border, `label-md` (Space Grotesk). These should feel like small, smooth pebbles.

### Cards (Portfolio Items)
*   **Construction:** Forbid divider lines. Use `xl` (1.5rem) rounded corners. The image should be the hero, with the text content sitting on a `surface_container_lowest` footer that uses a backdrop-blur.

### Input Fields
*   **Search/Text Input:** Inspired by IMAGE_1, use a pill-shape (`full` roundedness) with a 15% opacity `outline_variant` border. The background should be a subtle `surface_container_low`.

### Navigation (Minimalist)
*   **Desktop:** Horizontal, `label-md` typography, high letter-spacing. Use `on_surface_variant` for inactive states and `primary` for the active state with a small dot indicator below.

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. Allow some project cards to be wider than others to create a rhythmic, "zine-like" feel.
*   **Do** lean into the "glass" effect for the navigation bar and sidebars to maintain a sense of lightness.
*   **Do** use the `primary_fixed` color for small accents like bullet points or "View Project" arrows.

### Don't:
*   **Don't** use 100% black (#000000). Always use `on_surface` (#2d2e33) for text to keep the editorial look soft.
*   **Don't** use standard "drop shadows." If a component doesn't feel "up," use a lighter surface color instead of adding a shadow.
*   **Don't** use hard 90-degree corners. Everything in this system should feel organic and approachable (minimum `DEFAULT` 0.5rem radius).
*   **Don't** crowd the space. If in doubt, double the padding. The "Ethereal Editor" requires room to breathe.