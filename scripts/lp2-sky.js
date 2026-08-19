// LP2 sky choreography.
//
// The page flies up through one cloud. That cloud is a single element in
// lp2.css (.lp2-cloudwall) whose body is bounded by two edges, and this file's
// whole job is to say where those two edges are, in viewport pixels:
//
//     --lp2-cloud-top      the billowing top of the cloud
//     --lp2-cloud-bottom   its underside
//
// The flight is those two numbers, in order:
//
//     hero      the whole cloud is below the window — open sky, nothing else
//     entering  the top rises off the bottom edge and closes over the window,
//               which is the "flying up into it" move
//     about     top above the window, underside below it: the window is inside
//               the cloud, and nothing else is drawn over that section
//     leaving   the underside rises past the top of the window, dropping the
//               page out of the bottom of the cloud into open sky
//
// Nothing clamps the cloud to the about section any more. The copy is pinned
// (.lp2-about-stage in lp2.css) and its own opacity says when it can be read —
// it fades up as the cloud closes and back down as it opens — so the cloud is
// free to open on time instead of being held until the section it covers has
// scrolled past. Holding it against the section's *bottom* was what made the
// opening happen a screen and a half late, with the copy sliding away under it.
//
// More numbers ride along:
//
//     --lp2-haze                     the mist around the cloud, which is what
//                                    makes crossing its surface a transition
//                                    rather than a wipe
//     --lp2-wisp-1..4                four loose strands, in viewport pixels.
//                                    Each is the same plate at a different
//                                    distance, so each travels a different
//                                    multiple of the distance the cloud has
//                                    travelled. The two nearest are drawn in
//                                    front of the page (.lp2-sky-front in
//                                    lp2.css) — the whole difference between
//                                    watching a cloud arrive and being in it is
//                                    whether any of it passes on your side of
//                                    the window. The same four serve both
//                                    crossings; see the note by their maths
//     --lp2-hero-out / --lp2-hero-hold
//                                    the lettering going away: it is held where
//                                    it is and shrinks out of sight, which is
//                                    the zoom it arrives on, run backwards
//     --lp2-reveal                   the about copy, which is not allowed to be
//                                    read through a hole in the weather: it
//                                    fades up only as the cloud finishes closing
//     --lp2-work-lead                how far the work section is still being held
//                                    below where the page put it, so that it
//                                    arrives moving faster than the page and
//                                    settles into place — the cloud leaves at
//                                    more than scroll speed, and content that
//                                    crawls out from under it at exactly scroll
//                                    speed reads as being left behind
//     --lp2-exit                     fades the lower sky in behind the work
//     --lp2-ground                   brings the hill up under the call to action
//
// Everything is derived from element positions read live, not from hard-coded
// scroll distances: the about copy is as long as it is, the deck is as tall as
// its cards, and both change with the viewport. Measuring the real sections is
// what keeps the beats landing on the sections on a phone and on an ultrawide
// alike.
(function () {
    "use strict";

    var root = document.documentElement;
    var hero = document.querySelector(".lp2-hero");
    var work = document.querySelector(".lp2-work");
    var about = document.querySelector(".lp2-about");
    var carousel = document.querySelector(".lp2-carousel");
    var contact = document.querySelector(".lp2-cta");
    var underside = document.querySelector(".lp2-cloudwall-bottom");
    var billow = document.querySelector(".lp2-cloudwall-top");

    if (!about || !contact) {
        return;
    }

    /* Where the exit begins and how long it runs, in screens of scroll, counted
       from the about section's bottom edge. Named because the work section's
       chase is measured against the same two numbers: the scroll position at
       which the cloud is finally gone is the one its content has to have caught
       up by. */
    var LEAVE_START = 2.6;
    var LEAVE_SPAN = 1.55;

    /* At rest the cloud is entirely below the window — the hero is open sky,
       and the cloud is something the page finds by scrolling rather than
       something already in the picture. "Entirely" includes the billowing top,
       which hangs above the body it belongs to, so the resting position is one
       window plus that plate's height. */
    var restTop = function (vh, plate) {
        return vh + plate;
    };

    var clamp01 = function (value) {
        return value < 0 ? 0 : (value > 1 ? 1 : value);
    };

    // Ease the ends of each move so an edge never starts or stops dead. Applied
    // to progress, not to time: scrolling back up runs it backwards exactly.
    var ease = function (t) {
        return t * t * (3 - 2 * t);
    };

    var mix = function (from, to, t) {
        return from + (to - from) * t;
    };

    var frame = null;
    var last = { top: null, bottom: null, haze: -1, exit: -1, ground: -1, hold: null, out: -1, reveal: -1, lead: 0 };

    /* How much faster than the page the work section arrives, and where it stops
       being faster. Read from CSS rather than written here so every knob in this
       choreography lives in one file — see --lp2-work-chase in lp2.css. Read on
       resize, not per frame: getComputedStyle is a layout read. */
    var chase = 1;
    var readChase = function () {
        var value = parseFloat(getComputedStyle(root).getPropertyValue("--lp2-work-chase"));
        chase = isNaN(value) ? 1 : Math.max(1, value);
    };

    /* How much of the cloud's travel each strand covers, and how far ahead of
       it each one starts (in screens). Nearer means faster and lower — parallax,
       with the cloud itself as the far plane. The last two are the ones drawn in
       front of the page. */
    var WISPS = [
        { key: "1", speed: 0.75, lead: 0.02 },
        { key: "2", speed: 1.20, lead: 0.06 },
        { key: "3", speed: 1.70, lead: 0.10 },
        { key: "4", speed: 2.40, lead: 0.16 }
    ];

    /* Writes a pixel variable, but only when it has actually moved: three of
       these change on every frame of the flight and none of them is worth a
       style recalculation for a tenth of a pixel. */
    var setPx = function (name, key, value) {
        if (last[key] === undefined || last[key] === null || Math.abs(value - last[key]) > 0.5) {
            root.style.setProperty(name, value.toFixed(1) + "px");
            last[key] = value;
        }
    };

    var render = function () {
        frame = null;

        var vh = window.innerHeight || 1;
        var heroBox = hero ? hero.getBoundingClientRect() : null;
        var aboutBox = about.getBoundingClientRect();
        var deckBox = (carousel || contact).getBoundingClientRect();

        /* The two plates hang outside the body they bound, so both ends of the
           travel have to account for one of them: the cloud is only truly below
           the window when its top plate is, and only truly gone when its
           underside is. */
        var edge = underside ? underside.offsetHeight : vh * 0.28;
        var plate = billow ? billow.offsetHeight : vh * 0.28;

        /* Entering. Keyed to the about section arriving rather than to the hero
           leaving: the cloud has to have closed over the window by the time the
           first line of that copy could be read, and the copy is what the
           timing has to be true against.

           A screen and a half of travel, which is why .lp2-about carries so
           much padding above its copy: a crossing can only take as long as
           there is empty scroll for it to take. */
        var entering = ease(clamp01((vh - aboutBox.top) / Math.max(vh * 1.55, 1)));

        /* Leaving. Measured from the section's end, and timed to finish while
           the copy is still pinned: everything the visitor is meant to see of
           the opening happens with the page still, and by the time the pin
           releases there is nothing left on it to watch scroll away. */
        var leaving = ease(clamp01((vh * LEAVE_START - aboutBox.bottom) / Math.max(vh * LEAVE_SPAN, 1)));

        /* The hill. Comes up while the deck is still on screen — the design has
           the cards floating over the ground, not arriving after it. */
        var ground = ease(clamp01((vh * 1.25 - deckBox.bottom) / Math.max(vh * 0.7, 1)));

        var rest = restTop(vh, plate);
        var top = mix(rest, 0, entering);
        var bottom = mix(vh, -edge, leaving);

        /* The two edges cross twice, and the body between them is empty both
           times: at rest, with the whole cloud below the window, and at the end
           of the flight, with the whole cloud above it. Only the second needs
           correcting — a body left at the lower of the two numbers would hang
           its underside back down into the window — and correcting the first
           would drag the resting cloud up into the hero. */
        if (bottom < top && top <= vh) {
            top = bottom;
        }

        /* The strands. A cloud has no single surface — it has an approach, made
           of pieces of itself that arrive first and, if you are really going
           into it, pass you.

           Both crossings are the same event, so both get the same maths: the
           only thing that changes is which edge is doing the travelling. Going
           in it is the billowing top, climbing from where the cloud rests;
           coming out it is the underside, climbing from the bottom of the
           window. The two distances are the same, both start with every strand
           below the fold, and the handover happens while all four are off the
           top of the screen — so there is nothing to see in it. */
        var travelled = leaving > 0 ? (vh - bottom) : (rest - top);

        for (var i = 0; i < WISPS.length; i += 1) {
            setPx(
                "--lp2-wisp-" + WISPS[i].key,
                WISPS[i].key,
                rest - travelled * WISPS[i].speed - vh * WISPS[i].lead
            );
        }

        setPx("--lp2-cloud-top", "top", top);
        setPx("--lp2-cloud-bottom", "bottom", bottom);
        /* The lettering. It does not scroll away — it is held where it is (the
           hold cancels exactly as much as the page has moved) and shrinks and
           dims instead, which is the zoom it arrives on when the page loads,
           played backwards. Something receding reads as distance opening up,
           and distance opening up is what the rest of the flight is about. */
        if (heroBox) {
            var scrolled = Math.max(0, -heroBox.top);
            var heroOut = ease(clamp01(scrolled / Math.max(vh * 0.7, 1)));

            setPx("--lp2-hero-hold", "hold", Math.min(scrolled, heroBox.height));
            if (Math.abs(heroOut - last.out) > 0.002) {
                root.style.setProperty("--lp2-hero-out", heroOut.toFixed(4));
                last.out = heroOut;
            }
        }

        /* The about copy, both ways. Held back until the cloud has all but
           closed, faded up in place, and faded back down as soon as the cloud
           starts to open — so it is never seen arriving or leaving, only being
           there. Between the two the page is pinned, so "in place" is literal:
           what moves during either fade is the weather, not the text. */
        var reveal = clamp01((entering - 0.62) / 0.3)
            * (1 - clamp01((leaving - 0.02) / 0.26));
        if (Math.abs(reveal - last.reveal) > 0.002) {
            root.style.setProperty("--lp2-reveal", reveal.toFixed(4));
            /* Faded out is not the same as gone: the work section is pulled up
               over the tail of this one (see .lp2-work in lp2.css), so while the
               copy is invisible its links have to stop catching clicks meant for
               what is drawn on top of them. */
            root.dataset.lp2Copy = reveal > 0.02 ? "on" : "off";
            last.reveal = reveal;
        }

        /* The work section, keeping up with the cloud. Held down by whatever is
           left of the underside's journey, minus whatever is left of its own —
           so it travels on the cloud's curve rather than the page's, easing when
           the cloud eases, and both terms reach zero at the same scroll
           position. Nothing here reads the section's own box, so the transform
           it produces can never feed back into itself. */
        var settleAt = vh * (LEAVE_START - LEAVE_SPAN);
        var lead = Math.max(0, (bottom + edge) - (aboutBox.bottom - settleAt)) * chase;

        if (Math.abs(lead - last.lead) > 0.5) {
            root.style.setProperty("--lp2-work-lead", lead.toFixed(1) + "px");
            last.lead = lead;
        }

        /* Mist. A cloud has no surface to cross — the air thickens for a while
           before there is anything to see, and thins for a while after. So the
           veil comes up as the billowing top climbs towards the window and goes
           down as the underside clears it, and the sky behind it goes out of
           focus by the same amount. Without this the plates read as a picture
           being slid over the page; with it they read as weather. */
        /* Measured from where the cloud rests, not from an arbitrary distance:
           at rest the billow's top is exactly one window down, so anchoring the
           ramp there is what keeps the hero's sky clear. */
        var approach = clamp01((vh - (top - plate)) / Math.max(vh * 1.15, 1));
        /* Leaving, the blur is measured against the underside's whole journey —
           full while the cloud still fills the window, nothing at the exact
           moment its last plate clears the top. Scaling it by the plate's own
           height rather than a fixed fraction of the window is what keeps the
           sky from staying soft after there is nothing left to be soft about. */
        var depart = clamp01((bottom + edge) / Math.max(vh + edge, 1));
        var haze = ease(Math.min(approach, depart));

        if (Math.abs(haze - last.haze) > 0.002) {
            root.style.setProperty("--lp2-haze", haze.toFixed(4));
            last.haze = haze;
        }
        if (Math.abs(leaving - last.exit) > 0.001) {
            root.style.setProperty("--lp2-exit", leaving.toFixed(4));
            last.exit = leaving;
        }
        if (Math.abs(ground - last.ground) > 0.001) {
            root.style.setProperty("--lp2-ground", ground.toFixed(4));
            last.ground = ground;
        }

        // Not read by anything yet, but useful to style against: which part of
        // the flight the page is in.
        root.dataset.lp2Beat = ground > 0.4
            ? "ground"
            : (leaving > 0.5 ? "under" : (entering > 0.6 ? "inside" : "above"));
    };

    var queue = function () {
        if (!frame) {
            frame = window.requestAnimationFrame(render);
        }
    };

    /* The resting position is one window plus the billow's own height, so the
       first frame in which that height is known has to be rendered — otherwise
       the cloud sits a plate too high until something else happens to move it. */
    if (window.ResizeObserver && billow) {
        new ResizeObserver(queue).observe(billow);
    }

    var remeasure = function () {
        readChase();
        queue();
    };

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("orientationchange", remeasure);
    // Fonts and the project cards both change section heights after first paint.
    window.addEventListener("load", remeasure);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(queue).catch(function () { /* nothing to do */ });
    }

    readChase();
    render();
})();
