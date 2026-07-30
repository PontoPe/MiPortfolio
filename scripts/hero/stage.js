/**
 * Assembles the hero: scene, layers, loop, resize, and the rules about when
 * not to run.
 *
 * Loaded through a dynamic import from index.js, which means three.js and the
 * 3MB sculpt are only fetched once the browser has been judged capable of
 * showing them — a phone or a reduced-motion visitor never touches this file.
 */
import * as THREE from "three";
import { GLASS, LIGHTS, POINTER, RENDERER } from "./config.js";
import { addLights, createStage } from "./scene.js";
import { createBackground } from "./background.js";
import { createStickers } from "./stickers.js";
import { loadGlass } from "./glass.js";
import { createPointer } from "./pointer.js";

const RESIZE_DEBOUNCE = 150;
/* Milliseconds. Mirrors the transition-delay on .hero-stage, which mirrors the
   page-load animation on .home-hero .hero-welcome. Both are measured from load,
   but this scene only exists once a 3MB model has arrived — so the delay is
   rewritten below with whatever is left of it, and the glass lands with the
   copy around it instead of a beat behind. */
const REVEAL_AT = 650;
const NAV_SELECTOR = ".site-nav";
const LOWER_BOUND_SELECTOR = ".section-panel";

const getDocumentTop = (element) => {
    let top = 0;
    let current = element;
    while (current) {
        top += current.offsetTop;
        current = current.offsetParent;
    }
    return top;
};

export const mountHero = async ({ host, wordBox }) => {
    /* Loaded before anything is shown: if the file is missing or the GPU
       rejects the context, the PNG in the markup stays and the page is none
       the wiser. */
    const glass = await loadGlass();

    const canvas = document.createElement("canvas");
    canvas.className = "hero-stage-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const stage = createStage(canvas);
    const background = createBackground();
    const stickers = createStickers();
    const pointer = createPointer();

    stage.scene.add(background.backdrop, background.mesh, stickers.group, glass.pivot);
    addLights(stage.scene, LIGHTS);

    /* Everything that could have failed has run, so the canvas can take over
       from the still — and it has to happen before the first resize, since the
       stage has no box until this class reveals it. */
    wordBox.classList.add("is-3d");

    let fitWidth = 1;
    let glassBaseY = 0;

    const resize = () => {
        const nav = document.querySelector(NAV_SELECTOR);
        const lowerBound = document.querySelector(LOWER_BOUND_SELECTOR);
        const wordTop = getDocumentTop(wordBox);
        const wordBottom = wordTop + wordBox.offsetHeight;
        const stageTop = nav?.offsetHeight || 0;
        const stageBottom = lowerBound ? getDocumentTop(lowerBound) : wordBottom;
        host.style.setProperty("--hero-stage-top-bleed", `${Math.max(0, wordTop - stageTop)}px`);
        host.style.setProperty("--hero-stage-bottom-bleed", `${Math.max(0, stageBottom - wordBottom)}px`);

        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) {
            return;
        }
        stage.setSize(width, height, Math.min(window.devicePixelRatio, RENDERER.maxPixelRatio));
        background.setSize(width, height);
        stickers.setSize(width, height);
        const hostRect = host.getBoundingClientRect();
        const wordRect = wordBox.getBoundingClientRect();
        glassBaseY = hostRect.top + hostRect.height / 2
            - (wordRect.top + wordRect.height / 2);
        /* The word keeps the width the PNG had, so the 3D lettering lands
           where the flat one did — except on a narrow viewport, where the
           canvas is barely wider than the word and the ceiling pulls it in
           clear of the edge fade. */
        fitWidth = Math.min(wordBox.clientWidth, width * GLASS.maxCanvasWidthRatio);
        glass.setWidth(fitWidth);
    };

    const clock = new THREE.Clock();
    let frame = 0;

    const render = () => {
        const dt = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();
        const { x, y } = pointer.update(dt);

        /* The pointer's entire contribution: a lean towards the cursor, eased.
           Nothing keys off how fast it moves or whether it is over the word —
           no swell, no reaction as it crosses the lettering. */
        glass.pivot.rotation.y = x * POINTER.tilt.y;
        glass.pivot.rotation.x = y * POINTER.tilt.x;
        /* Idle float. Sideways as well as up and down, on a longer period, so
           a hero nobody is touching drifts rather than bobs on the spot. */
        glass.pivot.position.y = glassBaseY
            + Math.sin(time * ((Math.PI * 2) / POINTER.float.period))
            * POINTER.float.amplitude;
        glass.pivot.position.x = Math.sin(time * ((Math.PI * 2) / POINTER.float.swayPeriod))
            * POINTER.float.sway;

        background.setMotion(x, y, time);
        stickers.update(dt, time);

        stage.renderer.render(stage.scene, stage.camera);
    };

    const loop = () => {
        frame = window.requestAnimationFrame(loop);
        render();
    };

    const start = () => {
        if (!frame) {
            /* Drops the delta accumulated while the loop was parked, which
               would otherwise arrive as one large step. */
            clock.getDelta();
            loop();
        }
    };

    const stop = () => {
        if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
        }
    };

    resize();
    /* One frame up front so the lettering is there even if the loop never
       starts — a hero that loads already scrolled past, or a background tab. */
    render();
    /* The stage went from display:none to block a moment ago, and a transition
       only runs if the browser has already resolved the element at opacity 0.
       Reading a layout property forces exactly that, and unlike waiting for a
       frame it works in a tab that is not being painted — otherwise a hero
       loaded in the background would still be invisible when it came forward. */
    host.style.transitionDelay = `${Math.max(0, REVEAL_AT - performance.now())}ms`;
    void host.offsetWidth;
    host.classList.add("is-lit");

    const relayout = () => {
        resize();
        if (!frame) {
            render();
        }
    };

    /* A ResizeObserver rather than window.onresize: the stage is a
       viewport-wide box inside the flow, so it also changes when the hero copy
       reflows or a font lands, and those never fire a window resize. Debounced
       because every call reallocates the drawing buffer and the transmission
       target with it. */
    let debounce = 0;
    const observer = new ResizeObserver(() => {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(relayout, RESIZE_DEBOUNCE);
    });
    observer.observe(host);

    /* The transmission pass runs the scene three more times per frame, once
       per colour channel. Left running behind the rest of the portfolio it
       would drain a battery for nothing, so it only animates while the hero is
       actually on screen and the tab is in front. */
    let onScreen = true;
    const sync = () => {
        if (onScreen && !document.hidden) {
            start();
        } else {
            stop();
        }
    };

    new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        sync();
    }).observe(host);
    document.addEventListener("visibilitychange", sync);
    sync();

    return {
        stage,
        glass,
        background,
        stickers,
        getFitWidth: () => fitWidth,
        relayout,
        /* Unconditional, so the debug panel still updates the picture on a
           hero whose loop is parked. */
        redraw: render,
    };
};
