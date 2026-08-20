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

    /* Smoothing. The plates do not follow the scrollbar, they follow a value
       that chases it: each frame a layer closes a fixed fraction of the gap
       between where the page is and where that layer thinks it is. A wheel
       notch is a step change in scroll, and a chased value turns it into a
       short glide — which is the difference between a cloud being flown into
       and a picture being dragged up the window.

       What is smoothed is the gap, not the choreography, so everything
       downstream of the two edges — the haze, the copy, the work section's
       chase — inherits the easing for free.

       The gap halves every SMOOTH_HALFLIFE seconds, so the feel is identical at
       60 and 144Hz. Each layer gets its own half-life: settling at different
       rates is parallax the same way travelling at different speeds is. */
    var SMOOTH_HALFLIFE = 0.13;
    /* Below this the chase is over: snap, and let the frame loop stop. Already
       under what setPx would bother to write. */
    var SMOOTH_SETTLE = 0.3;

    var chaser = function (halflife) {
        return { at: null, halflife: halflife };
    };

    /* Advances one chaser and returns the gap it is still carrying, in pixels —
       which is exactly how much to add to a live rect to see the page from
       where that layer thinks it is. Called with no elapsed time (a resize, the
       first paint) it reports the gap without moving. */
    /* Someone who has asked for less motion gets none of this: every layer is
       pinned to the scrollbar, which is what the choreography did before the
       chasing existed. The beats are unchanged — only the glide goes. */
    var still = window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var advance = function (c, y, dt) {
        if (still) {
            c.at = y;
            return 0;
        }
        if (c.at === null) {
            c.at = y;
            return 0;
        }
        if (dt > 0) {
            c.at = mix(c.at, y, 1 - Math.pow(0.5, dt / c.halflife));
            if (Math.abs(y - c.at) < SMOOTH_SETTLE) {
                c.at = y;
            }
        }
        return y - c.at;
    };

    var cloudChase = chaser(SMOOTH_HALFLIFE);
    /* The page's own content — the work section and the call to action — rides
       the same idea at about half the half-life. It glides, but it is text:
       lag it as much as the weather and reading it while scrolling turns into
       chasing it. */
    var contentChase = chaser(SMOOTH_HALFLIFE * 0.55);
    /* The hill is the furthest thing in the picture, so it is the slowest to
       settle. Same reason the far wisp is. */
    var groundChase = chaser(SMOOTH_HALFLIFE * 1.2);

    var frame = null;
    var last = { top: null, bottom: null, haze: -1, exit: -1, ground: -1, hold: null, out: -1, reveal: -1, lead: 0, drag: 0 };

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

    /* Each strand chases the page on its own clock: the nearer it is, the
       faster it settles, so the four never resolve as one plate. Half-life
       falls with the square root of the speed — enough for the stagger to be
       visible, not so much that the nearest one snaps. */
    for (var w = 0; w < WISPS.length; w += 1) {
        WISPS[w].lag = chaser(SMOOTH_HALFLIFE * Math.sqrt(WISPS[0].speed / WISPS[w].speed));
    }

    /* Writes a pixel variable, but only when it has actually moved: three of
       these change on every frame of the flight and none of them is worth a
       style recalculation for a tenth of a pixel. */
    var setPx = function (name, key, value) {
        if (last[key] === undefined || last[key] === null || Math.abs(value - last[key]) > 0.5) {
            root.style.setProperty(name, value.toFixed(1) + "px");
            last[key] = value;
        }
    };

    var render = function (dt) {
        frame = null;

        var y = window.pageYOffset || 0;
        /* Where the cloud thinks the page is, expressed as the gap it is still
           carrying. Added to a live rect, it reads that rect from the smoothed
           position instead of the real one — so every beat below is written
           against the scrollbar and lands eased. */
        var offset = advance(cloudChase, y, dt);

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
        var rest = restTop(vh, plate);

        /* The two edges, for one layer's idea of where the page is. Factored
           because the strands ask the same question from further behind: a
           plate that is still catching up is a plate at a different distance,
           which is the whole trick. */
        var edges = function (lag) {
            var enter = ease(clamp01((vh - (aboutBox.top + lag)) / Math.max(vh * 1.55, 1)));
            var leave = ease(clamp01((vh * LEAVE_START - (aboutBox.bottom + lag)) / Math.max(vh * LEAVE_SPAN, 1)));
            var hi = mix(rest, 0, enter);
            var lo = mix(vh, -edge, leave);

            /* The two edges cross twice, and the body between them is empty
               both times: at rest, with the whole cloud below the window, and
               at the end of the flight, with the whole cloud above it. Only the
               second needs correcting — a body left at the lower of the two
               numbers would hang its underside back down into the window — and
               correcting the first would drag the resting cloud up into the
               hero. */
            if (lo < hi && hi <= vh) {
                hi = lo;
            }
            return { entering: enter, leaving: leave, top: hi, bottom: lo };
        };

        var cloud = edges(offset);
        var entering = cloud.entering;
        var leaving = cloud.leaving;
        var top = cloud.top;
        var bottom = cloud.bottom;

        /* Leaving. Measured from the section's end, and timed to finish while
           the copy is still pinned: everything the visitor is meant to see of
           the opening happens with the page still, and by the time the pin
           releases there is nothing left on it to watch scroll away. */
        /* The content's glide. A transform, so the sections stay exactly where
           the layout put them and nothing measured from them moves; what the
           visitor sees is the page arriving a beat after the scrollbar instead
           of nailed to it. */
        var drag = advance(contentChase, y, dt);
        setPx("--lp2-content-lag", "drag", drag);

        /* The hill. Comes up while the deck is still on screen — the design has
           the cards floating over the ground, not arriving after it.

           Measured against the deck's laid-out position, never its drawn one,
           which means undoing both transforms it is currently carrying — its
           chase of the cloud and its glide — before reading it from where the
           hill thinks the page is. A hill that followed those offsets would
           ride back down with them.

           The window is short enough that the hill is fully up before the page
           runs out of scroll — the deck is the last thing above the fold, so
           there is no more scrolling left to finish anything with. */
        var deckBottom = deckBox.bottom - last.lead - drag + advance(groundChase, y, dt);
        var ground = ease(clamp01((vh * 1.25 - deckBottom) / Math.max(vh * 0.45, 1)));

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
        for (var i = 0; i < WISPS.length; i += 1) {
            var plane = edges(advance(WISPS[i].lag, y, dt));
            var travelled = plane.leaving > 0 ? (vh - plane.bottom) : (rest - plane.top);
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
           the cloud eases. Nothing here reads the section's own box, so the
           transform it produces can never feed back into itself.

           Both terms are floored at zero, and that is not tidiness: past the end
           of the crossing the section's own term goes negative, and subtracting
           a negative would grow the offset again — the section would settle,
           then drift back down over the section below it for the rest of the
           page. The cloud's term is the outer floor, so once there is no cloud
           left to keep up with there is no offset either. */
        var remaining = Math.max(0, bottom + edge);
        var itsOwn = Math.max(0, aboutBox.bottom + offset - vh * (LEAVE_START - LEAVE_SPAN));
        var lead = Math.max(0, remaining - itsOwn) * chase;

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

    /* Every layer has caught up: nothing left to animate until the page moves
       again, so the loop can stop instead of burning a frame a tick. */
    var settled = function (y) {
        if (cloudChase.at !== y || contentChase.at !== y || groundChase.at !== y) {
            return false;
        }
        for (var i = 0; i < WISPS.length; i += 1) {
            if (WISPS[i].lag.at !== y) {
                return false;
            }
        }
        return true;
    };

    var stamp = 0;

    /* The loop. It runs while anything is still chasing, not while the wheel is
       turning: the glide has to outlive the scroll event that started it, which
       is the entire point of smoothing. */
    var tick = function (now) {
        var dt = stamp ? Math.min((now - stamp) / 1000, 0.05) : 0;
        stamp = now;
        render(dt);
        if (!settled(window.pageYOffset || 0)) {
            frame = window.requestAnimationFrame(tick);
        }
    };

    var queue = function () {
        if (!frame) {
            /* A first frame after an idle stretch would otherwise be handed the
               whole idle time as its step. */
            stamp = 0;
            frame = window.requestAnimationFrame(tick);
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
    render(0);
})();
