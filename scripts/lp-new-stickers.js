// Falling stickers, mounted inside the scene — THE FALLBACK SET.
//
// The stickers this page is meant to show are the ones inside the WebGL hero
// (scripts/hero/stickers.js): they lean away from the cursor and the glass
// lettering refracts them, which is the whole reason the scene is there. They
// only exist on a machine that can afford the scene, so these stay as the set
// for every machine that cannot — and stand down the moment the scene reports
// itself up, so the two never fall at once.
//
// Same drops as scripts/falling-emoji.js — same artwork, same tinted glow,
// same one-pass-then-relaunch loop — with one difference that is the entire
// reason this file exists: the container goes into the sticky stage rather
// than onto <body>.
//
// On an ordinary page the rain is a fixed layer behind the content. Here the
// page flies through a cloud, and a fixed layer would float over the weather
// the whole way. Mounted in the stage it is a layer of the scene like any
// other, sitting under the cloud canvas — so the rising bank swallows the
// stickers instead of them crossing it. lp-new.css owns those two z-indexes;
// scripts/lp-new-scene.js flips between them by writing [data-lp-new-phase]
// on the container as the page passes through.
//
// Each drop runs ONE pass of the fall animation; on animationend it is
// re-randomized and restarted from the top. Restarting via a fresh animation
// (instead of mutating a running infinite one) keeps the speed stable —
// changing the duration of a live animation recomputes its progress from the
// original start time, which made drops jump around and speed up over time.
(function () {
    "use strict";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    var stage = document.getElementById("stage");
    if (!stage) {
        return;
    }

    var STICKERS = [
        "assets/ui/stickers/claude.png",
        "assets/ui/stickers/accidents.png",
        "assets/ui/stickers/human.png",
        "assets/ui/stickers/figma.png",
        "assets/ui/stickers/star_pink.png",
        "assets/ui/stickers/fine.png",
        "assets/ui/stickers/star_blue.png",
        "assets/ui/stickers/cmd_z.png",
        "assets/ui/stickers/passion.png",
        "assets/ui/stickers/pixel.png",
        "assets/ui/stickers/nerd.png",
        "assets/ui/stickers/pen.png",
        "assets/ui/stickers/heart.png",
        "assets/ui/stickers/buddy.png",
        "assets/ui/stickers/nilsen.png",
        "assets/ui/stickers/best.png"
    ];

    // Three fewer than the home page's fourteen. The scene already keeps two
    // cloud canvases and a mist canvas uploading a texture per frame; the rain
    // is the one thing here that can give some of that budget back without
    // being noticed.
    var DROP_COUNT = document.documentElement.classList.contains("perf-lite") ? 6 : 11;

    var random = function (min, max) { return min + Math.random() * (max - min); };

    var container = document.createElement("div");
    container.className = "emoji-rain emoji-rain--flat";
    container.setAttribute("aria-hidden", "true");
    container.setAttribute("data-lp-new-phase", "over");

    var launch = function (drop, inner) {
        var pick = STICKERS[Math.floor(Math.random() * STICKERS.length)];
        var duration = random(14, 26);

        // Reset the animation cleanly: detach, apply new randoms, force a
        // reflow so the browser treats the next pass as a brand-new animation.
        drop.style.animation = "none";

        drop.style.left = random(-2, 98) + "vw";
        drop.style.fontSize = random(2.6, 3.1) + "rem";
        drop.style.setProperty("--tilt-from", random(-14, 6) + "deg");
        drop.style.setProperty("--tilt-to", random(-6, 14) + "deg");
        drop.style.setProperty("--sway", random(0.5, 1.8) + "rem");
        inner.style.animationDuration = random(2.4, 4.6) + "s";
        inner.querySelector("img").src = pick;

        void drop.offsetWidth;

        drop.style.animation = "";
        drop.style.animationDuration = duration + "s";
        // Keep every new drop above the viewport for one second before it
        // begins falling; nothing should materialize halfway down the screen.
        drop.style.animationDelay = "1s";
    };

    for (var i = 0; i < DROP_COUNT; i += 1) {
        var drop = document.createElement("div");
        drop.className = "emoji-drop";

        var inner = document.createElement("div");
        inner.className = "emoji-drop-inner";
        var image = document.createElement("img");
        image.alt = "";
        image.decoding = "async";
        inner.appendChild(image);
        drop.appendChild(inner);

        drop.addEventListener("animationend", (function (d, n) {
            return function () { launch(d, n); };
        })(drop, inner));

        launch(drop, inner);
        container.appendChild(drop);
    }

    // First child of the stage: document order alone then keeps it under every
    // panel drawn after it, and lp-new.css only has to say which two layers of
    // the scene it rides between.
    stage.insertBefore(container, stage.firstChild);

    /* The scene talks to the rain through this. `phase` is the only thing it
       needs today.

       TODO — settling on the ground. The drops currently fall past the grass
       band and out of the stage. Accumulating them means, in this file: stop
       the fall animation at the band's top edge (scripts/lp-new-scene.js
       already knows where that is — geo.band), park the drop there with a
       small random rotation, and keep a bounded pile (oldest out first) so the
       count cannot grow without limit while someone sits at the bottom of the
       page. Deliberately not built yet. */
    /* The scene reports in once, whether or not it managed to mount, and
       `.is-3d` on the word is what says it actually did. If it did, these come
       out: the WebGL set is already falling, and two sets of the same artwork
       reads as a bug rather than as weather. */
    var standDown = function () {
        var word = document.querySelector(".hero-welcome");
        if (!word || !word.classList.contains("is-3d")) {
            return;
        }
        container.remove();
        window.lpNewStickers = null;
    };

    if (window.__portfolioHeroReady) {
        standDown();
    } else {
        window.addEventListener("portfolio:hero-ready", standDown, { once: true });
    }

    window.lpNewStickers = {
        container: container,
        phase: function (name) {
            if (container.getAttribute("data-lp-new-phase") !== name) {
                container.setAttribute("data-lp-new-phase", name);
            }
        }
    };
})();
