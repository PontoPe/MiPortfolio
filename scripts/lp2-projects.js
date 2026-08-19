// LP2 work carousel.
//
// Same data as the rest of the site (window.portfolioData, generated from
// Notion by scripts/build-projects.mjs) rendered as the floating deck the LP2
// design asks for: one card in the middle at full size, its neighbours sitting
// back on either side, filtered by category pill.
//
// The focus effect is scroll position, not a slide index — the track is a plain
// scroll-snap row, so a trackpad swipe, a drag, the arrow buttons and the
// keyboard all drive the same thing and none of them has to be intercepted.
(function () {
    "use strict";

    var data = window.portfolioData;
    var track = document.querySelector("[data-lp2-track]");
    var filters = document.querySelector("[data-lp2-filters]");
    var carousel = document.querySelector("[data-lp2-carousel]");

    if (!data || !track || !carousel) {
        return;
    }

    var previous = carousel.querySelector("[data-lp2-prev]");
    var next = carousel.querySelector("[data-lp2-next]");

    var escapeHtml = function (value) {
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Hand-built case pages, keyed the same way portfolio-render.js keys them:
    // by title for the ones whose Notion slug has moved before, by slug
    // otherwise. Kept in step with that file — data/projects-data.js is
    // regenerated on every build, so neither can live in the data.
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

    // Cards carry the category and at most two of the project's own tags: the
    // card is large but its bottom strip is one line, and "PRODUCT DESIGN •
    // UX/UI" is the shape the design uses. The category label comes from the
    // category being shown — the project rows themselves do not carry one.
    var cardMeta = function (project, category) {
        var label = category ? (category.displayLabel || category.label || "") : "";
        var parts = String(project.cardMeta || "")
            .split("•")
            .map(function (part) { return part.trim(); })
            .filter(Boolean)
            .slice(0, 2);

        return [label].concat(parts).filter(Boolean).slice(0, 3).join(" • ");
    };

    // The same correction portfolio-render.js makes: this row is filed under
    // Graphic Design in Notion, but its card opens the LUDIS *product* case, so
    // it belongs behind the product design pill. Both files carry it because
    // data/projects-data.js is regenerated from the database on every build;
    // changing the row's category in Notion is what retires it.
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
        carousel.remove();
        if (filters) {
            filters.remove();
        }
        return;
    }

    // The deck is the only place LP2 shows work, so it shows all of it: the
    // "featured" flag orders the category rather than filtering it, and the
    // pills do the filtering the flag used to do on the old home page.
    var projectsFor = function (category) {
        var featured = [];
        var rest = [];

        category.projects.forEach(function (project) {
            (project.featured ? featured : rest).push(project);
        });

        return featured.concat(rest);
    };

    var renderCard = function (project, category) {
        var href = projectHref(project);
        var thumbnail = project.thumbnail || {};
        var visual = thumbnail.type === "image" && thumbnail.src
            ? '<img alt="' + escapeHtml(thumbnail.alt || project.title + " project preview") + '" loading="lazy" src="' + escapeHtml(thumbnail.src) + '"/>'
            : "";

        return '<a class="lp2-card" href="' + escapeHtml(href) + '" aria-label="Open ' + escapeHtml(project.title) + ' project">'
            + '<div class="lp2-card-visual">' + visual + "</div>"
            + '<div class="lp2-card-foot">'
            + '<p class="lp2-card-meta">' + escapeHtml(cardMeta(project, category)) + "</p>"
            + '<h3 class="lp2-card-title">' + escapeHtml(project.shortTitle || project.title) + "</h3>"
            + "</div>"
            + '<span class="lp2-card-arrow" aria-hidden="true">'
            + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12h14M12.5 5.5 19 12l-6.5 6.5"/></svg>'
            + "</span>"
            + "</a>";
    };

    /* --- focus ------------------------------------------------------------
       Each card's `--focus` is 1 when its middle is on the middle of the track
       and falls off over one card's width either side. Written straight onto
       the elements: it drives scale, opacity and shadow in lp2.css, so this is
       the only place the effect is described in code. */
    var cards = [];
    var frame = null;

    var paint = function () {
        frame = null;

        var box = track.getBoundingClientRect();
        var middle = box.left + box.width / 2;
        var span = cards.length ? cards[0].getBoundingClientRect().width * 0.9 : 1;

        for (var i = 0; i < cards.length; i += 1) {
            var card = cards[i];
            var rect = card.getBoundingClientRect();
            var distance = Math.abs(rect.left + rect.width / 2 - middle);
            var focus = Math.max(0, 1 - distance / Math.max(span, 1));
            card.style.setProperty("--focus", focus.toFixed(3));
        }

        var maxScroll = track.scrollWidth - track.clientWidth - 1;
        var atStart = track.scrollLeft <= 0;
        var atEnd = track.scrollLeft >= maxScroll;

        if (previous) {
            previous.disabled = atStart;
        }
        if (next) {
            next.disabled = atEnd;
        }
    };

    var queue = function () {
        if (!frame) {
            frame = window.requestAnimationFrame(paint);
        }
    };

    var step = function (direction) {
        if (!cards.length) {
            return;
        }
        var width = cards[0].getBoundingClientRect().width;
        var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
        track.scrollBy({ left: direction * (width + gap), behavior: "smooth" });
    };

    var show = function (category) {
        var projects = projectsFor(category);
        track.innerHTML = projects.map(function (project) {
            return renderCard(project, category);
        }).join("");
        cards = Array.prototype.slice.call(track.querySelectorAll(".lp2-card"));

        // Open with a card *on* the middle rather than on the middle of the
        // scroll range: with an even number of cards those are not the same
        // place, and centring the range would park the gap between two cards
        // where the focused one belongs.
        var opening = cards[Math.floor((cards.length - 1) / 2)];
        if (opening) {
            var centre = opening.offsetLeft + opening.offsetWidth / 2 - track.clientWidth / 2;
            var behavior = track.scrollLeft === 0 ? "auto" : "smooth";
            track.scrollTo({ left: Math.max(0, centre), behavior: behavior });
        }

        queue();
    };

    if (filters) {
        filters.innerHTML = categories.map(function (category, index) {
            return '<button class="lp2-filter' + (index === 0 ? " is-active" : "") + '" type="button" role="tab"'
                + ' aria-selected="' + (index === 0 ? "true" : "false") + '"'
                + ' data-lp2-filter="' + escapeHtml(category.id) + '">'
                + escapeHtml((category.displayLabel || category.label || "").toLowerCase())
                + "</button>";
        }).join("");

        filters.addEventListener("click", function (event) {
            var button = event.target.closest("[data-lp2-filter]");
            if (!button) {
                return;
            }

            var category = categories.filter(function (item) {
                return item.id === button.dataset.lp2Filter;
            })[0];

            if (!category) {
                return;
            }

            Array.prototype.forEach.call(filters.querySelectorAll(".lp2-filter"), function (item) {
                var active = item === button;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", active ? "true" : "false");
            });

            show(category);
        });
    }

    if (previous) {
        previous.addEventListener("click", function () { step(-1); });
    }
    if (next) {
        next.addEventListener("click", function () { step(1); });
    }

    track.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);

    // Pointer drag, for a mouse: the row already scrolls with a trackpad and
    // with touch, and grabbing it is the gesture people try on a deck of cards.
    (function enableDrag() {
        var dragging = false;
        var startX = 0;
        var startScroll = 0;
        var moved = 0;

        track.addEventListener("pointerdown", function (event) {
            if (event.pointerType !== "mouse" || event.button !== 0) {
                return;
            }
            dragging = true;
            moved = 0;
            startX = event.clientX;
            startScroll = track.scrollLeft;
            track.style.scrollSnapType = "none";
            track.style.scrollBehavior = "auto";
        });

        window.addEventListener("pointermove", function (event) {
            if (!dragging) {
                return;
            }
            var delta = event.clientX - startX;
            moved = Math.max(moved, Math.abs(delta));
            track.scrollLeft = startScroll - delta;
        });

        var release = function (event) {
            if (!dragging) {
                return;
            }
            dragging = false;
            track.style.scrollSnapType = "";
            track.style.scrollBehavior = "";
            // A drag that moved the deck must not also open the card it ended on.
            if (moved > 6 && event.target.closest && event.target.closest(".lp2-card")) {
                event.preventDefault();
            }
        };

        window.addEventListener("pointerup", release);
        track.addEventListener("click", function (event) {
            if (moved > 6) {
                event.preventDefault();
                moved = 0;
            }
        });
    })();

    show(categories[0]);
})();
