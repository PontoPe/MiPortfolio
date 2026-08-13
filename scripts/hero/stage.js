/**
 * Assembles the hero: scene, layers, loop, resize, and the rules about when
 * not to run.
 *
 * Loaded through a dynamic import from index.js, which means three.js and the
 * lettering mesh are only fetched once the browser has been judged capable of
 * showing them — a phone or a reduced-motion visitor never touches this file.
 */
import * as THREE from "three";
import { BACKGROUND, GLASS, LIGHTS, POINTER, RENDERER } from "./config.js";
import { addLights, createStage } from "./scene.js";
import { createBackground } from "./background.js";
import { createStickers } from "./stickers.js";
import { loadGlass } from "./glass.js";
import { createPointer } from "./pointer.js";

const RESIZE_DEBOUNCE = 150;
const WORD_REVEAL_DELAY_MS = 900;
const WORD_VISIBILITY_LEAD_MS = 300;
const WORD_REVEAL_DURATION_MS = 1400;
const WORD_REVEAL_START_SCALE = 0.02;
const NAV_SELECTOR = ".site-nav";
/* Quality ladder. A dispersive transmission pass renders the scene three extra
   times per frame, and the canvas is the width of the viewport — on a large
   retina screen with an older GPU that is enough to miss 60fps by a lot, and no
   check made before the scene exists can tell which machines those are. So the
   scene measures itself: if the mean frame is late over a run of frames, it
   drops a step. Resolution first (the cheapest thing to lose to a curved
   refraction), then dispersion, which is what actually costs the extra passes.

   This ladder is internal to the scene and is the one thing that does adapt on
   its own: the hero is still there, still glass, still the same picture — only
   rendered at fewer pixels. It never touches the rest of the page. Turning the
   design itself down is opt-in and lives in scripts/perf-tier.js. */
const QUALITY_STEPS = [
    { pixelRatio: RENDERER.maxPixelRatio, transmissionScale: RENDERER.transmissionResolutionScale, dispersion: GLASS.dispersion },
    { pixelRatio: 1.5, transmissionScale: 0.35, dispersion: GLASS.dispersion },
    { pixelRatio: 1, transmissionScale: 0.3, dispersion: 0 },
];
const QUALITY_SAMPLE_FRAMES = 90;
/* 24ms is a frame and a half at 60Hz: comfortably past jitter, and low enough
   that a scene sitting at 30fps is caught within two seconds. */
const QUALITY_SLOW_FRAME_MS = 24;
/* Nothing is measured until the zoom-in has finished — it is the most expensive
   moment of the scene's life and the least representative of it. */
const QUALITY_WARMUP_MS = WORD_REVEAL_DURATION_MS + 600;
/* The stage bleeds past the lettering so the glass has something to refract on
   every side, and the falling stickers live inside that bleed. It stops at the
   ticker: past that band the rain would be drifting over the about block and
   the project cards, which is not where the hero is. */
const LOWER_BOUND_SELECTOR = ".news-ticker";
/* The element carrying the page's CSS grid, which the canvas's grid is aligned
   to. See .hero-about-band in page-style.css. */
const GRID_SELECTOR = ".hero-grid";

/* Positive remainder: -4 % 30 is -4 in JS, and a negative phase would shift the
   grid the wrong way. */
const wrap = (value, span) => ((value % span) + span) % span;

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
    let qualityStep = 0;

    const resize = () => {
        /* The canvas is absolutely positioned, so a debug size increase would
           otherwise overlap the stickers and section below. Keep equal flow
           space above and below the original word, preserving its centre. */
        const wordImage = wordBox.querySelector("img");
        const wordHeight = wordImage?.getBoundingClientRect().height || wordBox.offsetHeight;
        const extraSpace = Math.max(0, GLASS.widthScale - 1) * wordHeight / 2;
        wordBox.style.setProperty("--hero-glass-size-extra", `${extraSpace}px`);

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
        stage.setSize(width, height, Math.min(window.devicePixelRatio, QUALITY_STEPS[qualityStep].pixelRatio));
        background.setSize(width, height);
        stickers.setSize(width, height);
        const hostRect = host.getBoundingClientRect();
        const wordRect = wordBox.getBoundingClientRect();
        glassBaseY = hostRect.top + hostRect.height / 2
            - (wordRect.top + wordRect.height / 2);

        /* Phase-lock the canvas grid to the page grid, so the lattice reads as
           one background rather than two that meet at the canvas edge.
           The CSS grid draws a line every cell from the band's top-left. The
           shader draws one every cell from the plane's origin, which is the
           canvas's left edge and — uv running bottom-up — its BOTTOM edge.
           Matching each axis is therefore the gap between those origins,
           modulo the cell. Both boxes scroll together, so this holds until
           something resizes, which is exactly when this runs. */
        const gridHost = document.querySelector(GRID_SELECTOR);
        if (gridHost) {
            const gridRect = gridHost.getBoundingClientRect();
            background.setGridAlign(
                wrap(hostRect.left - gridRect.left, BACKGROUND.gridSize),
                wrap(gridRect.top - hostRect.bottom, BACKGROUND.gridSize)
            );
        }
        /* The word keeps the width the PNG had, so the 3D lettering lands
           where the flat one did — except on a narrow viewport, where the
           canvas is barely wider than the word and the ceiling pulls it in
           clear of the edge fade. */
        fitWidth = Math.min(wordBox.clientWidth, width * GLASS.maxCanvasWidthRatio)
            * GLASS.widthScale;
        glass.setWidth(fitWidth);
    };

    const clock = new THREE.Clock();
    let frame = 0;
    let wordRevealStartedAt = null;
    let wordRevealScheduled = false;
    /* Render the word at its distant scale before the loader lifts. Starting
       from an already-rendered mesh prevents a late visibility toggle from
       making it pop into the middle of the zoom. */
    glass.pivot.scale.setScalar(WORD_REVEAL_START_SCALE);
    glass.pivot.visible = false;

    const revealWord = () => {
        if (wordRevealStartedAt !== null) {
            return;
        }

        wordRevealStartedAt = performance.now();
        glass.pivot.visible = true;
    };

    const scheduleWordReveal = () => {
        if (wordRevealScheduled) {
            return;
        }

        wordRevealScheduled = true;
        window.setTimeout(() => {
            glass.pivot.visible = true;
            window.setTimeout(revealWord, WORD_VISIBILITY_LEAD_MS);
        }, WORD_REVEAL_DELAY_MS - WORD_VISIBILITY_LEAD_MS);
    };

    /* mountHero resolves immediately before index.js tells the loader that the
       hero is ready; this delay keeps the word hidden through its exit. */
    scheduleWordReveal();

    let sampleFrames = 0;
    let sampleSeconds = 0;

    const downgrade = () => {
        qualityStep += 1;
        const step = QUALITY_STEPS[qualityStep];
        if ("transmissionResolutionScale" in stage.renderer) {
            stage.renderer.transmissionResolutionScale = step.transmissionScale;
        }
        /* three compiles dispersion in behind a define (USE_DISPERSION), so
           turning it off is a recompile rather than a uniform write. */
        if (glass.material.dispersion !== step.dispersion) {
            glass.material.dispersion = step.dispersion;
            glass.material.needsUpdate = true;
        }
        /* Reapplies the step's pixel ratio, which is where most of the saving
           is: the drawing buffer is the viewport's width. */
        resize();
    };

    let qualitySettled = false;

    /* Mean frame time over a run of frames, judged once the run is complete.
       Mean rather than median because the delta is already clamped at 100ms
       upstream, so a single stall cannot carry the average on its own. */
    const sampleQuality = (dt) => {
        if (qualitySettled
            || wordRevealStartedAt === null
            || performance.now() - wordRevealStartedAt < QUALITY_WARMUP_MS) {
            return;
        }

        sampleFrames += 1;
        sampleSeconds += dt;
        if (sampleFrames < QUALITY_SAMPLE_FRAMES) {
            return;
        }

        const meanFrameMs = (sampleSeconds / sampleFrames) * 1000;
        sampleFrames = 0;
        sampleSeconds = 0;

        if (meanFrameMs <= QUALITY_SLOW_FRAME_MS) {
            /* Holding the frame at this step: stop measuring. The ladder only
               ever goes down, so there is nothing further to learn, and a
               scroll or a resize should not be able to demote a scene that is
               running fine. */
            qualitySettled = true;
            return;
        }
        if (qualityStep < QUALITY_STEPS.length - 1) {
            downgrade();
        } else {
            /* Bottom of the ladder and still late. Nothing further happens: the
               scene stays, at its cheapest settings, and the rest of the page
               is left alone. Turning the design down is a decision for the
               visitor to make (?perf=lite), not for a frame counter. */
            qualitySettled = true;
        }
    };

    const render = () => {
        const dt = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();
        const { x, y } = pointer.update(dt);

        if (wordRevealStartedAt !== null) {
            const progress = Math.min(
                1,
                (performance.now() - wordRevealStartedAt) / WORD_REVEAL_DURATION_MS
            );
            const easedProgress = 1 - (1 - progress) ** 4;
            const scale = WORD_REVEAL_START_SCALE
                + (1 - WORD_REVEAL_START_SCALE) * easedProgress;
            glass.pivot.scale.setScalar(scale);
        }

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
        /* Cursor in the scene's own space: pixels from the centre of the
           canvas, y up, which is exactly how the sticker planes are placed. The
           rect is read per frame rather than cached because the stage scrolls
           with the page, and a cached top would drift the repulsion away from
           the cursor the moment the visitor scrolled. */
        const stageRect = host.getBoundingClientRect();
        stickers.update(dt, time, pointer.client.active
            ? {
                x: pointer.client.x - stageRect.left - stageRect.width / 2,
                y: -(pointer.client.y - stageRect.top - stageRect.height / 2),
            }
            : null);

        stage.renderer.render(stage.scene, stage.camera);
        sampleQuality(dt);
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
        /* Exposed for ?glass: the ladder is the one part of the scene that
           cannot be tried by looking at a fast machine, so __hero.downgrade()
           is how the slow-machine picture gets checked on a quick one. */
        downgrade: () => {
            if (qualityStep < QUALITY_STEPS.length - 1) {
                downgrade();
            }
            return { step: qualityStep, ...QUALITY_STEPS[qualityStep] };
        },
    };
};
