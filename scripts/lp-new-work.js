// The "my work" deck on lp-new.
//
// Same data as the rest of the site (window.portfolioData, generated from
// Notion by scripts/build-projects.mjs), rendered as the shape the prototype
// settled on: three cards across with the middle one leading, filtered by
// category pill, and the whole section fitting one window with no scroll of
// its own.
//
// The row scrolls sideways and holds the whole category. The reason it was a
// paged deck before is still true and is what shapes this: the section is a
// panel of a sticky stage, and a scroller inside a scene that is itself driven
// by scroll can fight the page for the same gesture.
//
// So it takes every way of moving a row EXCEPT the one that would: drag, a
// trackpad's sideways swipe, the two buttons, the dots, and the arrow keys the
// browser gives any focusable scroll container for free. It never listens for
// `wheel`. A vertical wheel over the cards therefore does what it does
// everywhere else on the page — it flies the scene — and the row only moves
// when the reader means the row.
(function () {
    "use strict";

    var data = window.portfolioData;
    var deck = document.querySelector("[data-lp-new-deck]");
    var filters = document.querySelector("[data-lp-new-filters]");
    var pager = document.querySelector("[data-lp-new-pager]");

    if (!data || !deck) {
        return;
    }

    var dots = pager ? pager.querySelector("[data-lp-new-dots]") : null;
    var previous = pager ? pager.querySelector("[data-lp-new-prev]") : null;
    var next = pager ? pager.querySelector("[data-lp-new-next]") : null;

    // How many cards stand on the window at once. The row is measured, not
    // sliced, so this is only what decides which card leads at rest.
    var ACROSS = 3;

    var smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

    var escapeHtml = function (value) {
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Hand-built case pages, keyed the same way portfolio-render.js and
    // lp2-projects.js key them: by title for the ones whose Notion slug has
    // moved before, by slug otherwise. Kept in step with those files —
    // data/projects-data.js is regenerated on every build, so none of this can
    // live in the data.
    var titleCasePages = { "ludis": "/case-ludis-lp.html" };
    var slugCasePages = { "mosaico": "case-mosaico.html" };

    var safeLocalCasePage = function (value) {
        var page = String(value === null || value === undefined ? "" : value).trim();
        return /^\/?[a-z0-9][a-z0-9/_-]*\.html(?:[?#][a-z0-9=&%_+.-]*)?$/i.test(page) ? page : "";
    };

    var projectHref = function (project) {
        return titleCasePages[String(project.title || "").trim().toLowerCase()]
            || safeLocalCasePage(project.casePage)
            || slugCasePages[project.slug]
            || "project.html?project=" + encodeURIComponent(project.slug);
    };

    // The card is large but its bottom strip is one line, so it carries the
    // category and at most two of the project's own tags. The category label
    // comes from the category being shown — the project rows do not carry one.
    var cardMeta = function (project, category) {
        var label = category ? (category.displayLabel || category.label || "") : "";
        var parts = String(project.cardMeta || "")
            .split("•")
            .map(function (part) { return part.trim(); })
            .filter(Boolean)
            .slice(0, 2);

        return [label].concat(parts).filter(Boolean).slice(0, 3).join(" • ");
    };

    // The same correction portfolio-render.js and lp2-projects.js make: this
    // row is filed under Graphic Design in Notion, but its card opens the LUDIS
    // *product* case, so it belongs behind the product design pill. Changing
    // the row's category in Notion is what retires this.
    (function moveMisfiled() {
        var target = (data.categories || []).filter(function (category) {
            return category.id === "ux-ui";
        })[0];

        if (!target) {
            return;
        }

        (data.categories || []).forEach(function (category) {
            if (category === target) {
                return;
            }
            var index = (category.projects || []).findIndex(function (project) {
                return project.slug === "ludis-social";
            });
            if (index !== -1) {
                target.projects.push.apply(target.projects, category.projects.splice(index, 1));
            }
        });
    })();

    // Product design leads: it is the work the page is selling, and the design
    // puts its pill first. Anything the database adds later keeps its own order
    // behind these two rather than being dropped.
    var ORDER = ["ux-ui", "design-grafico"];

    var categories = (data.categories || []).filter(function (category) {
        return category.projects && category.projects.length;
    }).sort(function (a, b) {
        var ai = ORDER.indexOf(a.id);
        var bi = ORDER.indexOf(b.id);
        return (ai === -1 ? ORDER.length : ai) - (bi === -1 ? ORDER.length : bi);
    });

    if (!categories.length) {
        deck.remove();
        if (filters) { filters.remove(); }
        if (pager) { pager.remove(); }
        return;
    }

    // The deck is the only place this page shows work, so it shows all of it:
    // the "featured" flag orders a category rather than filtering it, and the
    // pills do the filtering the flag used to do on the old home page.
    var projectsFor = function (category) {
        var featured = [];
        var rest = [];

        category.projects.forEach(function (project) {
            (project.featured ? featured : rest).push(project);
        });

        return featured.concat(rest);
    };

    var renderCard = function (project, category, lead) {
        var thumbnail = project.thumbnail || {};
        var visual = thumbnail.type === "image" && thumbnail.src
            ? '<img alt="' + escapeHtml(thumbnail.alt || project.title + " project preview") + '" loading="lazy" src="' + escapeHtml(thumbnail.src) + '"/>'
            : "";

        return '<a class="lp-new-card' + (lead ? " is-lead" : "") + '" href="' + escapeHtml(projectHref(project)) + '"'
            + ' aria-label="Open ' + escapeHtml(project.title) + ' project">'
            + '<div class="lp-new-card-visual">' + visual + "</div>"
            + '<div class="lp-new-card-foot">'
            + '<p class="lp-new-card-meta">' + escapeHtml(cardMeta(project, category)) + "</p>"
            + '<h3 class="lp-new-card-title">' + escapeHtml(project.shortTitle || project.title) + "</h3>"
            + "</div>"
            + '<span class="lp-new-card-arrow" aria-hidden="true">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h14M12.5 5.5 19 12l-6.5 6.5"/></svg>'
            + "</span>"
            + "</a>";
    };

    var current = { category: categories[0] };

    /* Where the row is, in windows. Measured from the scroll port every time
       rather than remembered: the card width is a clamp against the viewport,
       so the answer changes with the window and there is nothing to keep in
       sync. */
    var span = function () {
        return deck.clientWidth || 1;
    };

    var maxScroll = function () {
        return Math.max(0, deck.scrollWidth - deck.clientWidth);
    };

    var pageCount = function () {
        return Math.max(1, Math.ceil(maxScroll() / span()) + 1);
    };

    var pageIndex = function () {
        return Math.min(pageCount() - 1, Math.round(deck.scrollLeft / span()));
    };

    /* The dots are rebuilt only when the row itself changes — a new category, a
       resize. Rewriting this markup on every scroll frame would throw away the
       focused dot in the middle of someone tabbing through them. */
    var buildDots = function () {
        if (!pager) {
            return;
        }

        var count = pageCount();
        pager.hidden = count < 2;

        if (pager.hidden || !dots) {
            return;
        }

        var markup = "";
        for (var i = 0; i < count; i += 1) {
            markup += '<button class="lp-new-dot" type="button" data-lp-new-page="' + i + '"'
                + ' aria-label="Projects, page ' + (i + 1) + '"></button>';
        }
        dots.innerHTML = markup;
    };

    /* The cheap half, safe to run on every scroll frame: it only writes state
       onto nodes that already exist. */
    var markPosition = function () {
        if (!pager || pager.hidden) {
            return;
        }

        var index = pageIndex();
        var limit = maxScroll();

        if (dots) {
            Array.prototype.forEach.call(dots.children, function (dot, i) {
                var on = i === index;
                dot.classList.toggle("is-active", on);
                dot.setAttribute("aria-current", on ? "true" : "false");
            });
        }

        // A pixel of slack: a smooth scroll lands a fraction short of the end
        // often enough that an exact test leaves "next" enabled at the end.
        if (previous) { previous.disabled = deck.scrollLeft <= 1; }
        if (next) { next.disabled = deck.scrollLeft >= limit - 1; }
    };

    var repaintPager = function () {
        buildDots();
        markPosition();
    };

    var renderCards = function () {
        var projects = projectsFor(current.category);

        // The lead is the middle card of the three standing on the window at
        // rest, which is where the design puts it. A category too short to fill
        // the row has no middle: one card blown up 9% next to no siblings reads
        // as a mistake rather than as emphasis.
        var leadAt = projects.length >= ACROSS ? 1 : -1;

        deck.dataset.count = String(projects.length);
        deck.innerHTML = projects.map(function (project, index) {
            return renderCard(project, current.category, index === leadAt);
        }).join("");
        deck.scrollLeft = 0;

        repaintPager();
    };

    var show = function (category) {
        current.category = category;
        renderCards();
    };

    if (filters) {
        filters.innerHTML = categories.map(function (category, index) {
            return '<button class="lp-new-filter' + (index === 0 ? " is-active" : "") + '" type="button" role="tab"'
                + ' aria-selected="' + (index === 0 ? "true" : "false") + '"'
                + ' data-lp-new-filter="' + escapeHtml(category.id) + '">'
                + escapeHtml((category.displayLabel || category.label || "").toLowerCase())
                + "</button>";
        }).join("");

        filters.addEventListener("click", function (event) {
            var button = event.target.closest("[data-lp-new-filter]");
            if (!button) {
                return;
            }

            var category = categories.filter(function (item) {
                return item.id === button.dataset.lpNewFilter;
            })[0];

            if (!category) {
                return;
            }

            Array.prototype.forEach.call(filters.querySelectorAll(".lp-new-filter"), function (item) {
                var active = item === button;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", active ? "true" : "false");
            });

            show(category);
        });
    }

    var step = function (direction) {
        deck.scrollBy({ left: direction * span(), behavior: smooth });
    };

    if (previous) { previous.addEventListener("click", function () { step(-1); }); }
    if (next) { next.addEventListener("click", function () { step(1); }); }

    if (dots) {
        dots.addEventListener("click", function (event) {
            var dot = event.target.closest("[data-lp-new-page]");
            if (!dot) {
                return;
            }
            deck.scrollTo({ left: (Number(dot.dataset.lpNewPage) || 0) * span(), behavior: smooth });
        });
    }

    /* Scroll and resize only ever repaint the pager, and never more than once a
       frame. `scroll` on a container the user is dragging fires far faster than
       the compositor draws. */
    var pending = 0;
    var afterScroll = function () {
        if (pending) {
            return;
        }
        pending = requestAnimationFrame(function () {
            pending = 0;
            markPosition();
        });
    };

    deck.addEventListener("scroll", afterScroll, { passive: true });

    /* A resize changes the card width, so it changes how many windows the row
       is — the dots have to be rebuilt, not just re-marked. */
    var resizing = 0;
    window.addEventListener("resize", function () {
        clearTimeout(resizing);
        resizing = setTimeout(repaintPager, 150);
    }, { passive: true });

    /* --- drag to pan --------------------------------------------------------

       Mouse and pen only. A touch already pans the row natively and capturing
       it here would take that away and re-implement it worse.

       The threshold is what keeps a click a click: below it nothing has
       happened and the card opens as normal; above it the row is being dragged,
       the cards go inert (see .is-dragging in lp-new.css) and the click that
       fires after pointerup is swallowed once — without that, letting go over a
       card navigates away at the end of every drag.
    ---------------------------------------------------------------------- */
    var DRAG_THRESHOLD = 6;
    var drag = { id: -1, startX: 0, startLeft: 0, moved: false };

    deck.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "touch" || event.button !== 0) {
            return;
        }
        drag.id = event.pointerId;
        drag.startX = event.clientX;
        drag.startLeft = deck.scrollLeft;
        drag.moved = false;
    });

    deck.addEventListener("pointermove", function (event) {
        if (event.pointerId !== drag.id) {
            return;
        }

        var travel = event.clientX - drag.startX;

        if (!drag.moved) {
            if (Math.abs(travel) < DRAG_THRESHOLD) {
                return;
            }
            drag.moved = true;
            deck.classList.add("is-dragging");
            /* Capture only once it IS a drag: taken on pointerdown it would
               swallow the click on a card that was never dragged. */
            if (deck.setPointerCapture) {
                deck.setPointerCapture(event.pointerId);
            }
        }

        deck.scrollLeft = drag.startLeft - travel;
        event.preventDefault();
    });

    var endDrag = function (event) {
        if (event.pointerId !== drag.id) {
            return;
        }

        drag.id = -1;

        if (!drag.moved) {
            return;
        }

        deck.classList.remove("is-dragging");
        // The click is dispatched after pointerup; this is the one that has to
        // go, and only this one.
        window.addEventListener("click", function (click) {
            click.stopPropagation();
            click.preventDefault();
        }, { capture: true, once: true });
    };

    deck.addEventListener("pointerup", endDrag);
    deck.addEventListener("pointercancel", endDrag);

    /* A card is a link, and a link inside a scroller is draggable by default —
       the browser would start a link drag instead of panning the row. */
    deck.addEventListener("dragstart", function (event) {
        event.preventDefault();
    });

    show(categories[0]);

    /* The row is measured, and at this point the cards have markup but no
       layout yet: the first pass reads a scrollWidth that is still catching up,
       and on a cold load the images have not sized either. Re-measure once the
       frame has been laid out, and again when the page reports itself loaded. */
    requestAnimationFrame(repaintPager);
    window.addEventListener("load", repaintPager, { once: true });
})();
