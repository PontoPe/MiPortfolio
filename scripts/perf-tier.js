// Decides whether this machine can afford the expensive half of the design.
//
// The costly parts are all compositor work, not script: four blurred
// full-viewport parallax boxes, ambient keyframes that never stop, and large
// backdrop-filter surfaces (nav, project panel, footer) sitting above them.
// Because something behind those surfaces is always moving, the GPU re-blurs
// them every frame forever — on a 4K panel with an older discrete GPU that is
// enough to make the whole page feel heavy while nothing is happening.
//
// So: sample real frame times once the page has settled, and if the machine
// cannot hold ~50fps while idle, put `perf-lite` on <html>. page-style.css
// turns the blurs and the ambient animation off under that class, and
// scripts/hero/index.js skips the WebGL lettering entirely. Nothing under
// perf-lite changes layout, so the class landing never reflows the page.
//
// The verdict is kept in sessionStorage, which is what makes it useful: the
// second page of the visit starts lite before the first paint instead of
// re-earning the same result. Force either mode with ?perf=lite / ?perf=full.
(function () {
    "use strict";

    var KEY = "portfolio:perf-tier";
    var root = document.documentElement;

    var apply = function (tier) {
        root.classList.toggle("perf-lite", tier === "lite");
    };

    var remember = function (tier) {
        try {
            window.sessionStorage.setItem(KEY, tier);
        } catch (error) {
            /* Private mode, or storage disabled: the probe just runs again. */
        }
    };

    var forced = /[?&]perf=(lite|full)/.exec(window.location.search);
    if (forced) {
        apply(forced[1]);
        remember(forced[1]);
        return;
    }

    var stored = null;
    try {
        stored = window.sessionStorage.getItem(KEY);
    } catch (error) {
        stored = null;
    }

    if (stored) {
        apply(stored);
        return;
    }

    /* Machines that are not worth measuring. Core count is deliberately not in
       here — a six-core desktop from 2019 passes that test and is exactly the
       machine this file exists for. */
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
        apply("lite");
        remember("lite");
        return;
    }

    /* Frames to collect, and the point at which the median of them is judged
       too slow. An idle 60Hz machine sits at 16.7ms; 22 is late enough to mean
       frames are actually being dropped rather than jittering. */
    var SAMPLE_FRAMES = 120;
    var SLOW_FRAME_MS = 22;
    /* Long enough after load for fonts, the Tailwind CDN compile and the first
       project render to be out of the way — otherwise the probe measures the
       load, which is slow on every machine. */
    var SETTLE_MS = 1500;

    var probe = function () {
        var samples = [];
        var last = 0;

        var step = function (now) {
            if (last) {
                samples.push(now - last);
            }
            last = now;

            if (samples.length < SAMPLE_FRAMES) {
                window.requestAnimationFrame(step);
                return;
            }

            /* Median, not mean: one 200ms stall from something else on the
               machine should not condemn the page. */
            samples.sort(function (a, b) { return a - b; });
            var median = samples[Math.floor(samples.length / 2)];
            var tier = median > SLOW_FRAME_MS ? "lite" : "full";
            apply(tier);
            remember(tier);
        };

        window.requestAnimationFrame(step);
    };

    /* A backgrounded tab throttles rAF to something like 1fps, which would read
       as a machine that cannot render at all. Wait for the page to be looked at
       before believing anything it reports. */
    var start = function () {
        if (document.hidden) {
            document.addEventListener("visibilitychange", start, { once: true });
            return;
        }
        window.setTimeout(probe, SETTLE_MS);
    };

    if (document.readyState === "complete") {
        start();
    } else {
        window.addEventListener("load", start);
    }
})();
