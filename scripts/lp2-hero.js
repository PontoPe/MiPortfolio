/**
 * The glass "Welcome" hero, on LP2.
 *
 * Same scene as the home page (scripts/hero/) — this file only changes what is
 * behind it. The home page's hero paints its own backdrop inside the canvas: a
 * lavender ramp and the page grid, drawn there because `transmission` can only
 * refract geometry that is in the scene, and matched to the CSS behind the
 * canvas so the two read as one surface. LP2's backdrop is a photograph of the
 * sky, which cannot be reproduced in a shader — so here the visible copy of
 * that plane is switched off and the real sky shows through the canvas, while
 * the opaque copy (the one the glass actually refracts, never drawn to screen)
 * is recoloured to the sky it is standing in.
 *
 * Nothing is imported statically: every decision below is about whether to
 * download three.js and a 3MB sculpt at all, so it has to be made first. On a
 * phone, without WebGL2, or for a visitor who has asked for reduced motion,
 * nothing further is fetched and the flat PNG in the markup stays.
 */
const HOST = ".hero-stage";
const WORD_BOX = ".hero-welcome";
const READY_EVENT = "portfolio:hero-ready";

/* What the glass is bending. Not the page's colours any more but the sky's,
   sampled from the two photographs in assets/ui/sky — the refraction is read
   as "that, distorted", so it has to be made of the same light. */
const SKY = {
    light: { top: 0x9fd4ec, bottom: 0xd8ecf6, bloom: 0xffffff, lavender: 0xbfe2f2 },
    /* Lighter than the night sky actually is: the lettering is only ever
       seen as this plate refracted, and a backdrop as dark as the photograph
       gives glass with nothing in it to catch. */
    dark: { top: 0x3c4374, bottom: 0x646c9c, bloom: 0xdfe4f8, lavender: 0x4a5182 },
};

const signalReady = () => {
    window.__portfolioHeroReady = true;
    window.dispatchEvent(new CustomEvent(READY_EVENT));
};

const supportsWebGL2 = () => {
    try {
        return Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch (error) {
        return false;
    }
};

/* A touch device, or one advertising few cores, is not going to hold 60fps
   through a dispersive transmission pass. `pointer: fine` also stands in for
   the interaction the scene is built around — there is no cursor to lean
   towards on a phone. */
const canAffordIt = () => window.matchMedia("(pointer: fine)").matches
    && (navigator.hardwareConcurrency || 4) >= 4
    && !(navigator.deviceMemory && navigator.deviceMemory < 4);

/* The page always says which theme it is in — scripts/lp2-theme.js writes the
   attribute on the first line it runs, daylight included — so there is nothing
   to infer from the operating system here. */
const nightIsOn = () =>
    document.documentElement.getAttribute("data-lp2-theme") === "dark";

const boot = async () => {
    try {
        const host = document.querySelector(HOST);
        const wordBox = document.querySelector(WORD_BOX);
        if (!host || !wordBox) {
            return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches
            || document.documentElement.classList.contains("perf-lite")
            || !supportsWebGL2()
            || !canAffordIt()) {
            return;
        }

        /* Config is read when the materials are built, which happens inside
           mountHero — so this has to be written before that import, not after.
           The grid goes with it: a lattice belongs to the home page's flat
           backdrop, and there is nothing straight in a photograph of the sky
           for it to agree with. */
        const { BACKGROUND } = await import("./hero/config.js");
        const sky = nightIsOn() ? SKY.dark : SKY.light;
        BACKGROUND.top = sky.top;
        BACKGROUND.bottom = sky.bottom;
        BACKGROUND.bloom = sky.bloom;
        BACKGROUND.lavender = sky.lavender;
        BACKGROUND.gridOpacity = 0;

        const { mountHero } = await import("./hero/stage.js");
        const hero = await mountHero({ host, wordBox });

        /* The two things the home page's hero puts on the page and LP2 does
           not want on top of the sky: the visible copy of the backdrop, and
           the falling stickers. Both stay in the scene — hiding them here
           keeps them out of the frame and out of the transmission pass, so
           what the glass bends is the sky-coloured plate alone. */
        hero.background.mesh.visible = false;
        hero.stickers.group.visible = false;
        hero.redraw();

        /* Follow the theme switch. BACKGROUND is only read when the materials
           are built, so changing it after mount changes nothing — the live
           values are the uniforms, and both copies of the plate share the same
           uniform objects, so writing them once recolours what the glass
           refracts and what would be drawn beside it together. Without this the
           lettering keeps the night plate on a page that has gone back to
           daylight, and reads as a dark smear over a blue sky. */
        window.addEventListener("portfolio:theme-change", () => {
            const next = nightIsOn() ? SKY.dark : SKY.light;
            const uniforms = hero.background.material.uniforms;

            BACKGROUND.top = next.top;
            BACKGROUND.bottom = next.bottom;
            BACKGROUND.bloom = next.bloom;
            BACKGROUND.lavender = next.lavender;

            uniforms.uTop.value.setHex(next.top);
            uniforms.uBottom.value.setHex(next.bottom);
            uniforms.uBloom.value.setHex(next.bloom);
            uniforms.uLavender.value.setHex(next.lavender);

            hero.redraw();
        });

        if (window.location.search.includes("glass")) {
            window.__hero = hero;
            const { attachDebugUI } = await import("./hero/debug.js");
            attachDebugUI(hero);
        }
    } catch (error) {
        console.warn("Welcome hero: 3D lettering unavailable, keeping the still.", error);
    } finally {
        signalReady();
    }
};

boot();
