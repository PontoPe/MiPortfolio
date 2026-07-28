/**
 * Entry point for the glass "Welcome" hero.
 *
 * This file deliberately has no static imports. Everything it decides is a
 * decision about whether to download three.js and a 3MB sculpt at all, so it
 * has to be able to decide it first — on a phone, on a machine without WebGL2,
 * or for someone who has asked for reduced motion, nothing further is fetched
 * and the hero stays as it is in the markup: the flat PNG under its CSS
 * refraction filter, which is the fallback in every one of those cases.
 */
const HOST = ".hero-stage";
const WORD_BOX = ".hero-welcome";

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

const boot = async () => {
    const host = document.querySelector(HOST);
    const wordBox = document.querySelector(WORD_BOX);
    if (!host || !wordBox) {
        return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || !supportsWebGL2()
        || !canAffordIt()) {
        return;
    }

    try {
        const { mountHero } = await import("./stage.js");
        const hero = await mountHero({ host, wordBox });
        /* ?glass on the URL brings up a lil-gui bound to config.js. The
           thickness, dispersion and absorption numbers are all in pixels and
           all want tuning by eye; loaded from a CDN, and only on request, so
           it costs a visitor nothing. */
        if (window.location.search.includes("glass")) {
            /* Also handy from the console: __hero.redraw(), __hero.glass.material. */
            window.__hero = hero;
            const { attachDebugUI } = await import("./debug.js");
            attachDebugUI(hero);
        }
    } catch (error) {
        console.warn("Welcome hero: 3D lettering unavailable, keeping the still.", error);
    }
};

boot();
