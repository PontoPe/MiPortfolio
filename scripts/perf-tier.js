// Opt-in reduced-cost tier.
//
// The expensive half of the design is all compositor work: four blurred
// full-viewport parallax boxes, ambient keyframes that never stop, and large
// backdrop-filter surfaces (nav, project panel, footer) sitting above them.
// Because something behind those surfaces is always moving, the GPU re-blurs
// them every frame forever — on a 4K panel with an older discrete GPU that is
// enough to make the whole page feel heavy while nothing is happening.
//
// None of it is switched off on its own. The default is the full design on
// every machine: nothing here measures the visitor and decides on their behalf,
// because a page that quietly removes its own blurs is a worse outcome than a
// page that runs at 40fps on one old iMac. `perf-lite` is applied only when
// asked for by hand:
//
//     ?perf=lite   strip the blurs, the ambient animation and the 3D hero
//     ?perf=full   put them back
//
// Either choice is kept in sessionStorage, so it carries across the pages of
// the visit rather than having to be typed onto every URL. page-style.css owns
// what the class actually turns off; scripts/hero/index.js reads it to decide
// whether to load the WebGL lettering at all. Nothing under perf-lite changes
// layout, so applying it never reflows the page.
(function () {
    "use strict";

    var KEY = "portfolio:perf-tier";
    var root = document.documentElement;

    var apply = function (tier) {
        root.classList.toggle("perf-lite", tier === "lite");
    };

    var forced = /[?&]perf=(lite|full)/.exec(window.location.search);
    if (forced) {
        apply(forced[1]);
        try {
            window.sessionStorage.setItem(KEY, forced[1]);
        } catch (error) {
            /* Private mode, or storage disabled: the choice holds for this page
               and has to be repeated on the next one. */
        }
        return;
    }

    try {
        apply(window.sessionStorage.getItem(KEY));
    } catch (error) {
        /* No storage, no stored choice: the full design, which is the default
           anyway. */
    }
})();
