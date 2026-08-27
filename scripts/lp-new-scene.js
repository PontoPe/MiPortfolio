/* =============================================================
   lp-new — the flight.

   Hero → About → my work, one scroll, no seam. Ported from the isolated
   prototype in the testes-codigo repo (prototipo-transicao-hero-about),
   with the placeholders replaced by the site's real hero, About and work,
   and the test panel dropped.

   The four rules that separate this from a transition that moves in steps:

   1. The scroll event ANIMATES NOTHING. It is not even on the critical
      path: window.scrollY is read by the rAF loop, once per frame. So the
      number of calculations per second is the monitor's, not the (very
      irregular) rate at which the browser fires scroll.

   2. No geometry is measured during the animation. offsetTop, offsetHeight
      and innerHeight are read on load and resize and cached. Reading them
      inside the frame forces a synchronous reflow, and that is the classic
      cause of the stutter.

   3. The scroll value does not go straight into the transform. It is the
      TARGET; what gets rendered chases that target with exponential
      interpolation. That is what turns a discrete input (scroll arrives in
      jumps of 40-120px) into continuous movement.

   4. The damping is normalized by delta time. A fixed lerp of 0.1 per frame
      runs at DOUBLE speed on a 120Hz display. damp() makes the feel identical
      at 60, 90 and 120Hz.

   BOTH TRANSITIONS ARE THE SAME SYSTEM. One sticky stage, one progress, one
   lerp, one loop. Only the choreography differs: renderAscent() closes the
   window with cloud, renderDescent() opens it. Neither has a loop, a listener
   or smoothing of its own — which is why they join without a seam.

   A CSS trap worth knowing, because it costs an afternoon and prints nothing:
   `overflow-x: hidden` on <html> or <body> makes overflow-y compute to `auto`,
   turns the body into a scroll container, and position: sticky stops sticking.
   page-style.css sets it; lp-new.css turns it back off for this page.
   ============================================================= */

(function () {
    "use strict";

    var $ = function (selector, root) { return (root || document).querySelector(selector); };
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var mix = function (a, b, t) { return a + (b - a) * t; };
    var range = function (p, a, b) { return clamp01((p - a) / (b - a)); };
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
    var easeInOut = function (t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    /* Frame-rate independent exponential interpolation. `f` is the fraction
       that would be left over in a 60Hz frame. */
    var damp = function (current, target, f, dt) {
        return current + (target - current) * (1 - Math.pow(1 - f, dt / 16.6667));
    };

    var el = {
        scene: $("#scene"), stage: $("#stage"),
        sky: $("#sky"), skyWisp: $("#skyWisp"),
        hero: $("#hero"), chrome: $(".site-nav"), clouds: $("#clouds"),
        veilWhite: $("#veilWhite"), veilTint: $("#veilTint"),
        aboutClouds: $("#aboutClouds"), about: $("#about"),
        lowerSky: $("#lowerSky"), cloudsOpen: $("#cloudsOpen"),
        work: $("#work"), ground: $("#ground")
    };

    if (!el.scene || !el.stage) {
        return;
    }

    var ART = [
        "assets/ui/scene/cloud-wisp.png",
        "assets/ui/scene/cloud-soft.png",
        "assets/ui/scene/cloud-dense.png"
    ].map(function (src) {
        var image = new Image();
        image.src = src;
        return image;
    });

    /* Pixel budget for the cloud canvas. This is the centrepiece of the
       performance fix on large displays: the backing store never exceeds it,
       whatever the viewport and the devicePixelRatio, and CSS stretches the
       result. Cloud is diffuse content — upscaling one texture is invisible,
       and the fill cost becomes CONSTANT instead of growing with screen area.
       Measured: 2048x1152 @2x went from 33 to 51fps, and the layer count
       stopped mattering at all (3, 5 or 7 layers all hold 60). */
    var CANVAS_BUDGET = 1024 * 576;

    /* The sky veil is diffuse mist behind the hero — nowhere near the
       resolution of the clouds in front, and every canvas still pays a texture
       upload per frame. */
    var WISP_BUDGET = 560 * 315;

    /* The scene is described in SEGMENTS of scroll (in vh), not as one height.
       That way a transition can be lengthened without touching the other's
       rhythm: t1 is the first crossing, holdA the breath where the About sits
       still and readable, t2 the second, holdW the closing breath. */
    var SEG = { t1: 176, holdA: 80, t2: 176, holdW: 56 };

    var small = matchMedia("(max-width: 820px)");
    var lite = document.documentElement.classList.contains("perf-lite");

    var cfg = {
        damping: 0.10,
        /* The per-resolution layer budget was removed when the clouds moved to
           canvas — a cloud now costs the same at 1366x768 and at 5K. Three on a
           phone, five everywhere else; the fps governor below stays as a safety
           net for weak machines. */
        layers: small.matches || lite ? 3 : 5,
        auto: true,
        length: small.matches ? 0.73 : 1,   // multiplier over the segments
        drift: !lite
    };

    var geo = {
        top: 0, stageH: 1, stageW: 1, k: 1, kWisp: 1, total: 1, band: 1,
        seg: { t1: 1, holdA: 1, t2: 1, holdW: 1 }
    };
    var state = { target: 0, eased: 0, p1: 0, p2: 0, fps: 60, running: false, reduced: false };
    var sets = { ascent: [], descent: [] };

    /* Reproduces the old `background: center 62% / 150% auto`: a box 150% of
       the stage's width, height from the file's aspect ratio, transform origin
       at the centre of the stage (the CSS default). */
    var wisp = {
        hvh: 0, art: ART[0], originY: 0.5, x: 0, y: 0, sx: 1, sy: 1, op: 0,
        wide: true, anchor: 0.62
    };
    var wispSet = [wisp];
    var rafId = 0;
    var last = 0;

    /* ---------------------------------------------------------
       Theme tint

       One white cut-out serves both themes; at night the sprites are
       multiplied down on the canvas instead of a second set being shipped.
       Read from CSS (--lpn-cloud-tint) so the palette stays in one file, and
       re-read on the theme event lp2-theme.js dispatches.
       --------------------------------------------------------- */
    var tint = null;

    var readTint = function () {
        var value = getComputedStyle(document.documentElement)
            .getPropertyValue("--lpn-cloud-tint").trim();
        // White means no tint at all, and skipping the fill is the daylight
        // fast path: two full-canvas composites per frame that never happen.
        tint = (!value || value === "#ffffff" || value === "#fff") ? null : value;
    };

    /* ---------------------------------------------------------
       Layers — both sets come out of the same factory
       --------------------------------------------------------- */

    /* A sprite describes the SAME box the div had: 118% of the width starting
       at -9%, height in vh, transform origin as a fraction of its own box. The
       choreography's arithmetic did not change — only who executes it. */
    var sprite = function (hvh, art, originY) {
        return { hvh: hvh, art: art, originY: originY, x: 0, y: 0, sx: 1, sy: 1, op: 0 };
    };

    /* Sine drift, driven by TIME rather than scroll — it is what keeps the
       scene breathing when the visitor stops scrolling. */
    var breath = function (d, i) {
        return {
            driftX: mix(14, 46, d) * (small.matches ? 0.6 : 1),
            driftY: mix(3, 11, d) * (small.matches ? 0.6 : 1),
            speed: mix(0.000055, 0.000108, d),
            phase: i * 1.73
        };
    };

    // phase 1: the bank rises from below and closes the window
    var buildAscent = function (n) {
        sets.ascent = [];
        for (var i = 0; i < n; i += 1) {
            var d = n === 1 ? 1 : i / (n - 1);
            sets.ascent.push(Object.assign(
                sprite(mix(56, 88, d), ART[d < 0.34 ? 0 : d < 0.7 ? 1 : 2], 0.72),
                {
                    d: d,
                    y0: mix(78, 128, d),                 // vh — the far ones already show at rest
                    y1: mix(-16, -98, d),                // vh — the near one travels further
                    s0: mix(1.00, 1.20, d),
                    s1: mix(1.38, 2.60, d),
                    peak: mix(0.60, 1.00, d),            // maximum opacity
                    op0: mix(0.85, 0.00, d),             // fraction already visible at p=0
                    inAt: mix(0.00, 0.09, d),
                    /* exponent > 1 = starts slow and accelerates. Besides being
                       the right gesture for a rising cloud, a different value
                       per layer desynchronises the set — without it they all
                       move as one block and the parallax is just a
                       translation, with no depth. */
                    curve: mix(1.10, 1.55, d),
                    /* mirroring and offsetting each layer stops the silhouettes
                       stacking identically and the set reading as a single arc */
                    flip: i % 2 === 1,
                    xOff: (i % 3 - 1) * 0.09             // fraction of the screen's width
                },
                breath(d, i)
            ));
        }
    };

    /* phase 2: we are INSIDE the cloud and descending.
       The opening is made of TRANSLATION, not scale. A cloud enlarged at the
       centre of the window only shows its own middle — it goes flat white,
       loses its silhouette and stops reading as cloud. Here each layer leaves
       by a corner: what tears the opening in the middle, and lets the sky and
       then the ground through it, is the distance between them. */
    var buildDescent = function (n) {
        sets.descent = [];
        for (var i = 0; i < n; i += 1) {
            var d = n === 1 ? 1 : i / (n - 1);
            sets.descent.push(Object.assign(
                /* Always the defined silhouette: against blue sky the soft
                   plates of phase 1 turn to mist and the opening disappears.
                   What covers the window early in the phase is the veil, which
                   is still there — the layer does not have to cover it alone.
                   On the way down the cloud swells AROUND whoever is passing
                   through it, not up from its base: origin at the middle. */
                sprite(mix(52, 82, d), ART[2], 0.45),
                {
                    d: d,
                    /* Scale close to 1 deliberately: enlarged, a cloud throws
                       its own edges out of frame and only the middle is left.
                       The silhouette has to fit.
                       They start BELOW the top of the frame, which is what puts
                       the cloud's upper edge on screen and opens sky above it —
                       the instant of coming out of the underside of the deck. */
                    y0: mix(6, 24, d),                     // vh
                    y1: mix(-95, -175, d),                 // vh — up and out of frame
                    x0: (i % 2 ? 1 : -1) * mix(6, 16, d),  // vh
                    x1: (i % 2 ? 1 : -1) * mix(40, 92, d), // vh — this is what tears the gap
                    s0: mix(0.90, 1.15, d),
                    s1: mix(1.20, 1.75, d),                // slight growth, depth only
                    peak: mix(0.70, 1.00, d),
                    /* they emerge out of the flat white instead of appearing
                       from nothing: the veil loses its uniformity and becomes
                       cloud again */
                    inAt: mix(0.00, 0.05, d),
                    outAt: mix(0.28, 0.16, d),             // the near ones leave first
                    outEnd: mix(0.54, 0.40, d),
                    curve: mix(1.06, 1.42, d),
                    flip: i % 2 === 0
                },
                breath(d, i)
            ));
        }
    };

    var buildLayers = function (n) {
        buildAscent(n);
        buildDescent(n);
    };

    /* ---------------------------------------------------------
       Canvas — locked resolution
       --------------------------------------------------------- */

    var ctxs = new WeakMap();

    var ctxOf = function (canvas) {
        var ctx = ctxs.get(canvas);
        if (!ctx) {
            ctx = canvas.getContext("2d", { alpha: true });
            ctxs.set(canvas, ctx);
        }
        return ctx;
    };

    /* Sizes the backing store within the budget and returns how many canvas
       pixels there are per CSS pixel. It never UPSCALES: on a small screen
       k = 1 and the drawing is at native resolution, with nothing lost. */
    var fitCanvas = function (canvas, w, h, budget) {
        var k = Math.min(1, Math.sqrt((budget || CANVAS_BUDGET) / Math.max(1, w * h)));
        var cw = Math.max(1, Math.round(w * k));
        var ch = Math.max(1, Math.round(h * k));
        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width = cw;
            canvas.height = ch;
        }
        return cw / w;
    };

    /* Draws a list of sprites, reproducing exactly what the CSS transform did:
       translate, then scale about the box's own origin. Returns whether
       anything was drawn, so an empty canvas can be taken out of the
       compositor entirely. */
    var drawSet = function (canvas, list, W, H, k) {
        var ctx = ctxOf(canvas);
        k = k || geo.k;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var any = false;
        for (var i = 0; i < list.length; i += 1) {
            var L = list[i];
            if (L.op <= 0.004) { continue; }
            var img = L.art;
            if (!img.complete || !img.naturalWidth) { continue; }

            var w, x0, h, ox, oy;
            if (L.wide) {
                w = 1.5 * W;
                x0 = -0.25 * W;
                h = w * (img.naturalHeight / img.naturalWidth);
                ox = W / 2;
                oy = L.originY * H;               // origin on the stage, not the box
            } else {
                w = 1.18 * W;
                x0 = -0.09 * W;
                h = L.hvh / 100 * H;
                ox = x0 + w / 2;
                oy = L.originY * h;
            }
            var y0 = L.wide ? L.anchor * (H - h) : 0;

            ctx.setTransform(k, 0, 0, k, 0, 0);
            ctx.translate(L.x + ox, L.y + oy);
            ctx.scale(L.sx, L.sy);
            ctx.translate(-ox, -oy);
            ctx.globalAlpha = L.op;
            ctx.drawImage(img, x0, y0, w, h);
            any = true;
        }
        ctx.globalAlpha = 1;

        /* Night: multiply the whole set down in one pass, clipped to what was
           actually drawn. One fill at the canvas's locked resolution, and only
           when a tint is set — daylight never runs it. */
        if (any && tint) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = tint;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = "source-over";
        }

        if (canvas._any !== any) {
            canvas.style.visibility = any ? "" : "hidden";
            canvas._any = any;
        }
        return any;
    };

    /* ---------------------------------------------------------
       Measurement — the only place layout is read
       --------------------------------------------------------- */

    var retryId = 0;

    var measure = function () {
        var h = el.stage.offsetHeight || window.innerHeight;
        var w = el.stage.offsetWidth || window.innerWidth;

        /* A window with no size is a real state and its damage is permanent:
           the runway would be written as zero, the scene would collapse to one
           screen, and nothing would put it back until something else happened
           to fire a resize. It happens for a frame while a tab is restored in
           the background, while a device emulation is switched, and behind a
           `display: none` ancestor. Keep the last good geometry and come back
           for it — measuring nothing is always better than measuring zero. */
        if (!h || !w) {
            clearTimeout(retryId);
            retryId = setTimeout(measure, 200);
            return;
        }

        geo.stageH = h;
        var u = geo.stageH / 100 * cfg.length;    // 1vh of scroll, in px
        geo.seg = {
            t1: SEG.t1 * u, holdA: SEG.holdA * u,
            t2: SEG.t2 * u, holdW: SEG.holdW * u
        };
        geo.total = geo.seg.t1 + geo.seg.holdA + geo.seg.t2 + geo.seg.holdW;
        /* the ground band is sized in CSS (it depends on the PNG's aspect
           ratio); reading it here keeps the constant from living in two
           places that can disagree */
        geo.band = el.ground.offsetHeight || geo.stageH * 0.48;
        geo.stageW = w;
        geo.k = fitCanvas(el.clouds, geo.stageW, geo.stageH);
        fitCanvas(el.cloudsOpen, geo.stageW, geo.stageH);
        geo.kWisp = fitCanvas(el.skyWisp, geo.stageW, geo.stageH, WISP_BUDGET);
        [el.clouds, el.cloudsOpen, el.skyWisp].forEach(function (canvas) {
            canvas._any = undefined;
        });
        // the runway needs the whole scroll PLUS one screen, which is what the
        // sticky consumes
        el.scene.style.height = (geo.total + geo.stageH) + "px";
        geo.top = el.scene.getBoundingClientRect().top + window.scrollY;
    };

    /* ---------------------------------------------------------
       Render — transform and opacity, nothing else
       --------------------------------------------------------- */

    /* Writes to the element only when the value actually changes, and takes
       whatever is invisible out of the compositor.

       `visibility` causes no layout, so it is safe to touch during the
       animation — and a hidden layer stops costing a blend per frame.

       `will-change` goes with it, and that matters more than it looks: it
       promotes the layer and RESERVES texture on the GPU while it is on. On a
       high-density display a full-screen layer costs around 37MB of VRAM
       (width x height x dpr^2 x 4 bytes). With all ten promoted at once an
       integrated GPU cannot hold the set, starts re-rasterising, and the frame
       spikes appear. The two phases never coexist, so half of them can hand
       the memory back at any moment. */
    var paint = function (node, op, transform) {
        if (!node) { return; }
        if (transform !== undefined && node._tf !== transform) {
            node.style.transform = transform;
            node._tf = transform;
        }
        if (node._op !== op) {
            node.style.opacity = op;
            node._op = op;
            var live = +op > 0.004;
            if (node._live !== live) {
                node.style.willChange = live ? "transform, opacity" : "auto";
                node.style.visibility = live ? "" : "hidden";
                node._live = live;
            }
        }
    };

    /* The nav is fixed and outside the stage, so it is never hidden — only
       faded. Writing visibility on it would take the menu away from the
       keyboard in the middle of the flight. */
    var paintChrome = function (op) {
        if (!el.chrome || el.chrome._op === op) { return; }
        el.chrome.style.opacity = op;
        el.chrome._op = op;
    };

    var render = function (p, t) {
        /* one progress, sliced into the segments. The two phases never overlap,
           so every element has a clear owner in each stretch. */
        var s = p * geo.total;
        state.p1 = clamp01(s / geo.seg.t1);
        state.p2 = clamp01((s - geo.seg.t1 - geo.seg.holdA) / geo.seg.t2);
        renderAscent(state.p1, t);
        renderDescent(state.p2, t);
    };

    // ---------- phase 1: Hero → About ----------

    function renderAscent(p, t) {
        var H = geo.stageH;

        // sky: lifts a little and opens its scale, gone once the cloud has the window
        var skyP = easeOutCubic(p);
        paint(el.sky, (1 - range(p, 0.60, 0.88)).toFixed(3),
            "translate3d(0, " + (-0.07 * H * skyP).toFixed(2) + "px, 0) scale(" + (1 + 0.16 * skyP).toFixed(4) + ")");

        /* the sky veil is the same kind of thing as a cloud — large image,
           transparent, scaled — so it goes on the same kind of canvas */
        var ws = 1 + 0.3 * skyP;
        wisp.x = Math.sin(t * 0.00004) * 22;
        wisp.y = -0.22 * H * skyP;
        wisp.sx = wisp.sy = ws;
        wisp.op = 0.45 * (1 - range(p, 0.34, 0.70));
        drawSet(el.skyWisp, wispSet, geo.stageW, H, geo.kWisp);

        // hero: leaves before the cloud arrives, but does not evaporate on the first gesture
        var heroOut = easeInOut(range(p, 0.08, 0.46));
        paint(el.hero, (1 - heroOut).toFixed(3),
            "translate3d(0, " + (-0.2 * H * heroOut).toFixed(2) + "px, 0) scale(" + (1 + 0.07 * heroOut).toFixed(4) + ")");

        // nav: dives into the cloud and comes back over the About
        paintChrome((1 - 0.86 * range(p, 0.26, 0.56) + 0.86 * range(p, 0.80, 0.96)).toFixed(3));

        /* clouds — they do not use raw `p`: they rise over a sub-range of the
           scroll, leaving air for the hero at the start and the About at the end */
        var q = range(p, 0.08, 0.84);
        for (var i = 0; i < sets.ascent.length; i += 1) {
            var L = sets.ascent[i];
            var e = Math.pow(q, L.curve);
            var s = mix(L.s0, L.s1, e);
            var dx = cfg.drift ? Math.sin(t * L.speed + L.phase) * L.driftX : 0;
            var dy = cfg.drift ? Math.cos(t * L.speed * 0.71 + L.phase) * L.driftY : 0;

            L.x = dx + L.xOff * H;
            L.y = mix(L.y0, L.y1, e) / 100 * H + dy;
            L.sx = L.flip ? -s : s;
            L.sy = s;
            L.op = L.peak
                * mix(L.op0, 1, range(q, L.inAt, L.inAt + 0.16))
                * (1 - range(p, 0.90, 1));
        }
        drawSet(el.clouds, sets.ascent, geo.stageW, H);

        // veils: pure white closes the window, then it becomes the About's tone
        paint(el.veilWhite, (0.94 * easeInOut(range(p, 0.58, 0.86))).toFixed(3));
        paint(el.veilTint, easeInOut(range(p, 0.80, 0.99)).toFixed(3));

        // the cloud settling on the top of the About
        var settle = easeOutCubic(range(p, 0.74, 0.98));
        paint(el.aboutClouds, settle.toFixed(3),
            "translate3d(0, " + mix(8, 0, settle).toFixed(2) + "px, 0)");

        // the About arrives out of the white
        var inAbout = easeOutCubic(range(p, 0.80, 1));
        paint(el.about, inAbout.toFixed(3),
            "translate3d(0, " + mix(42, 0, inAbout).toFixed(2) + "px, 0) scale(" + mix(0.985, 1, inAbout).toFixed(4) + ")");
        el.about.classList.toggle("is-live", inAbout > 0.9);
    }

    // ---------- phase 2: About → my work ----------

    function renderDescent(p, t) {
        var H = geo.stageH;

        /* What phase 1 left on the window only changes hands once phase 2 has
           actually started. Before that renderAscent owns those elements, and
           writing here would fight it. At p=0 the formulas below return exactly
           phase 1's final values, so the join has no step in it. */
        if (p > 0) {
            var out = easeInOut(range(p, 0, 0.30));
            paint(el.about, (1 - out).toFixed(3),
                "translate3d(0, " + (-0.14 * H * out).toFixed(2) + "px, 0) scale(" + (1 - 0.035 * out).toFixed(4) + ")");

            // the cloud on top of the About rises out of frame (its axis is inverted)
            var lift = easeOutCubic(range(p, 0, 0.34));
            paint(el.aboutClouds, (1 - range(p, 0.02, 0.26)).toFixed(3),
                "translate3d(0, " + (-0.34 * H * lift).toFixed(2) + "px, 0)");

            // the flat white dissolves: it is what "becomes" cloud again
            paint(el.veilWhite, (0.94 * (1 - easeInOut(range(p, 0.00, 0.28)))).toFixed(3));
            paint(el.veilTint, (1 - easeInOut(range(p, 0.00, 0.20))).toFixed(3));
        }

        // the low sky — what exists under the layer of cloud
        paint(el.lowerSky, easeOutCubic(range(p, 0.06, 0.26)).toFixed(3));

        /* The rain changes sides here. Under the bank while the page is
           climbing; over the ground and the low sky once the page is back out
           in the open, so the stickers fall through the second sky too instead
           of being buried by the layers that uncovered it. The flip happens
           while the white veil still covers everything, so it is never seen. */
        if (window.lpNewStickers) {
            window.lpNewStickers.phase(p > 0.14 ? "under" : "over");
        }

        /* clouds opening: they rise, swell and move apart. Same arithmetic as
           phase 1, signs and ranges inverted. */
        for (var i = 0; i < sets.descent.length; i += 1) {
            var L = sets.descent[i];
            var e = Math.pow(p, L.curve);
            var s = mix(L.s0, L.s1, e);
            var dx = cfg.drift ? Math.sin(t * L.speed + L.phase) * L.driftX : 0;
            var dy = cfg.drift ? Math.cos(t * L.speed * 0.71 + L.phase) * L.driftY : 0;

            L.x = mix(L.x0, L.x1, e) / 100 * H + dx;
            L.y = mix(L.y0, L.y1, e) / 100 * H + dy;
            L.sx = L.flip ? -s : s;
            L.sy = s;
            L.op = L.peak
                * range(p, L.inAt, L.inAt + 0.11)
                * (1 - easeInOut(range(p, L.outAt, L.outEnd)));
        }
        drawSet(el.cloudsOpen, sets.descent, geo.stageW, H);

        /* Ground: arrives only AFTER the sky is already clear, and rises just
           far enough for its own band to settle on the footer — it does not
           cover the window and does not overshoot. The sense of landing comes
           from sighting the ground from far off while descending, not from
           falling into it. */
        var rise = easeOutCubic(range(p, 0.44, 0.88));
        paint(el.ground, easeOutCubic(range(p, 0.42, 0.58)).toFixed(3),
            "translate3d(0, " + mix(geo.band, 0, rise).toFixed(2) + "px, 0)");

        // my work resolves over the top, with the ground already in place
        var inWork = easeOutCubic(range(p, 0.74, 0.98));
        paint(el.work, inWork.toFixed(3),
            "translate3d(0, " + mix(46, 0, inWork).toFixed(2) + "px, 0) scale(" + mix(0.985, 1, inWork).toFixed(4) + ")");
        el.work.classList.toggle("is-live", inWork > 0.9);
    }

    /* ---------------------------------------------------------
       Loop
       --------------------------------------------------------- */

    var progress = function () {
        // window.scrollY forces no reflow; the scene's geometry came from cache
        return clamp01((window.scrollY - geo.top) / geo.total);
    };

    var frame = function (now) {
        var dt = Math.min(64, now - last || 16.7);
        last = now;

        state.target = progress();
        state.eased = damp(state.eased, state.target, cfg.damping, dt);
        if (Math.abs(state.target - state.eased) < 0.00003) {
            state.eased = state.target;
        }

        render(state.eased, now);

        state.fps += (1000 / dt - state.fps) * 0.06;
        governor(now);

        rafId = requestAnimationFrame(frame);
    };

    /* The budget above is a guess from the resolution; this is the correction
       from what the machine ACTUALLY delivers. It only steps down, never back
       up on its own: climbing back would oscillate in the middle of a
       transition, which is worse than running one layer short. */
    var lowSince = 0;
    var lastStep = 0;

    function governor(now) {
        if (!cfg.auto) { lowSince = 0; return; }
        if (state.fps >= 48) { lowSince = 0; return; }
        if (!lowSince) { lowSince = now; return; }
        if (now - lowSince < 1200 || now - lastStep < 2500) { return; }

        lastStep = now;
        lowSince = 0;
        if (cfg.layers > 2) {
            cfg.layers -= 1;
            buildLayers(cfg.layers);
            render(state.eased, performance.now());
        } else if (cfg.drift) {
            cfg.drift = false;              // last resort before giving up
        }
    }

    var start = function () {
        if (state.running || state.reduced) { return; }
        state.running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    };

    var stop = function () {
        state.running = false;
        cancelAnimationFrame(rafId);
    };

    /* Outside the scene the loop has nothing to turn for — free battery, at no
       cost, since the whole scene is off screen. */
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                start();
            } else {
                stop();
                state.eased = state.target = progress();
                render(state.eased, performance.now());
            }
        });
    }, { rootMargin: "10% 0px" });

    /* ---------------------------------------------------------
       Navigation inside a sticky scene

       There is no element at the work section's offset to jump to — the
       sections are panels of one pinned stage, all at the same place in the
       document. So the in-page anchors resolve to scroll positions instead.
       --------------------------------------------------------- */

    var anchors = function (name) {
        var g = geo.seg;
        if (name === "about") { return geo.top + g.t1 + g.holdA * 0.4; }
        if (name === "work") { return geo.top + g.t1 + g.holdA + g.t2 + g.holdW * 0.5; }
        return geo.top;                                   // "top" / the hero
    };

    var jump = function (name) {
        if (state.reduced) {
            var panel = name === "work" ? el.work : name === "about" ? el.about : el.hero;
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        window.scrollTo({ top: Math.round(anchors(name)), behavior: "smooth" });
    };

    document.addEventListener("click", function (event) {
        var trigger = event.target.closest("[data-lp-new-jump], a[href^='#']");
        if (!trigger) { return; }

        var name = trigger.dataset ? trigger.dataset.lpNewJump : null;
        if (!name) {
            var hash = (trigger.getAttribute("href") || "").slice(1);
            // #contact is a real section under the scene; let the browser have it.
            if (hash !== "work" && hash !== "about" && hash !== "top") { return; }
            name = hash;
        }

        event.preventDefault();
        jump(name);
    });

    /* ---------------------------------------------------------
       Reduced motion
       --------------------------------------------------------- */

    var motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    var staticIO = null;

    var animated = function () {
        return [el.sky, el.skyWisp, el.hero, el.about, el.aboutClouds,
                el.veilWhite, el.veilTint, el.lowerSky, el.ground, el.work];
    };

    var setReduced = function (on) {
        state.reduced = on;
        document.documentElement.classList.toggle("lpn-reduced", on);

        if (on) {
            stop();
            io.unobserve(el.scene);
            el.scene.style.height = "";
            paintChrome("");
            animated().forEach(function (node) {
                node.style.transform = "";
                node.style.opacity = "";
                node.style.visibility = "";
                node.style.willChange = "";
                node._tf = node._op = node._live = undefined;
            });
            staticIO = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    entry.target.classList.toggle("is-in", entry.isIntersecting);
                });
            }, { threshold: 0.15 });
            staticIO.observe(el.about);
            staticIO.observe(el.work);
        } else {
            if (staticIO) { staticIO.disconnect(); }
            staticIO = null;
            el.about.classList.remove("is-in");
            el.work.classList.remove("is-in");
            measure();
            io.observe(el.scene);
            start();
        }
    };

    /* ---------------------------------------------------------
       Resize — debounced, never during a frame
       --------------------------------------------------------- */

    /* In the fallback the stage has no fixed height, so measuring there feeds
       the sum back into itself and the scene grows without limit (17,000px of
       document, in the prototype). Every entry into measure() goes through
       this guard. */
    var remeasure = function () {
        if (!state.reduced) { measure(); }
    };

    var resizeId = 0;
    addEventListener("resize", function () {
        clearTimeout(resizeId);
        resizeId = setTimeout(function () {
            if (state.reduced) { return; }
            /* dragging the window to another monitor changes both dpr and area,
               so the budget has to be redone, not only the geometry */
            measure();
            render(state.eased, performance.now());
        }, 120);
    }, { passive: true });

    addEventListener("orientationchange", function () { setTimeout(remeasure, 240); });

    /* A tab that was in the background may have booted with no size at all, and
       coming back to the front does not always fire a resize. This is the one
       event that always arrives. */
    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) { remeasure(); }
    });

    /* Scroll is only an alarm clock, for the case where the loop is stopped.
       It calculates nothing and writes nothing to the DOM. */
    addEventListener("scroll", function () {
        if (!state.running && !state.reduced) { start(); }
    }, { passive: true });

    window.addEventListener("portfolio:theme-change", function () {
        readTint();
        if (!state.reduced) { render(state.eased, performance.now()); }
    });

    /* ---------------------------------------------------------
       Boot
       --------------------------------------------------------- */

    readTint();

    ART.forEach(function (image) {
        image.addEventListener("load", function () {
            if (!state.reduced) { render(state.eased, performance.now()); }
        }, { once: true });
    });

    buildLayers(cfg.layers);
    measure();
    state.target = state.eased = progress();
    render(state.eased, performance.now());

    if (motionQuery.matches) {
        setReduced(true);
    } else {
        io.observe(el.scene);
        start();
    }

    motionQuery.addEventListener("change", function (event) { setReduced(event.matches); });
    small.addEventListener("change", function () { buildLayers(cfg.layers); remeasure(); });
    addEventListener("load", remeasure);

    /* Inspection hook. With the clouds on canvas the animation's state cannot
       be read off the DOM any more, so it is exposed here — for the console and
       for anything measuring continuity. `render` is on it because a scene
       driven by rAF cannot be stepped from outside otherwise: a tab that is not
       compositing never fires a frame, so calling render(p) by hand is the only
       way to inspect a position without scrolling to it and waiting. */
    window.lpNewScene = {
        state: state, sets: sets, geo: geo, cfg: cfg, wisp: wisp,
        render: render, measure: measure
    };
})();
