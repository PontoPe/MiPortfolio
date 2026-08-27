// The "my work" deck on lp-new.
//
// Same data as the rest of the site (window.portfolioData, generated from
// Notion by scripts/build-projects.mjs), rendered as the shape the prototype
// settled on: three cards across with the middle one leading, filtered by
// category pill, and the whole section fitting one window with no scroll of
// its own.
//
// That last constraint is why this is a paged deck and not the LP2 carousel. A
// carousel is a row that scrolls; the section it lives in here is a panel of a
// sticky stage, and a panel that scrolls inside a scene that is itself driven
// by scroll fights the page for the same gesture. So a category longer than
// three pages instead — the geometry stays fixed and the deck changes hands.
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

    var PER_PAGE = 3;

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

    var current = { category: categories[0], page: 0, pages: 1 };

    var pageCount = function (projects) {
        return Math.max(1, Math.ceil(projects.length / PER_PAGE));
    };

    var paintPager = function () {
        if (!pager) {
            return;
        }

        var many = current.pages > 1;
        pager.hidden = !many;

        if (!many) {
            return;
        }

        if (dots) {
            var markup = "";
            for (var i = 0; i < current.pages; i += 1) {
                markup += '<button class="lp-new-dot' + (i === current.page ? " is-active" : "") + '"'
                    + ' type="button" data-lp-new-page="' + i + '"'
                    + ' aria-label="Projects, page ' + (i + 1) + '"'
                    + ' aria-current="' + (i === current.page ? "true" : "false") + '"></button>';
            }
            dots.innerHTML = markup;
        }

        if (previous) { previous.disabled = current.page === 0; }
        if (next) { next.disabled = current.page >= current.pages - 1; }
    };

    var paintDeck = function () {
        var projects = projectsFor(current.category);
        current.pages = pageCount(projects);
        current.page = Math.min(current.page, current.pages - 1);

        var slice = projects.slice(current.page * PER_PAGE, current.page * PER_PAGE + PER_PAGE);

        // The lead is the middle of a full row of three. A short last page has
        // no middle, so nothing leads on it — a single card blown up 9% next to
        // no siblings reads as a mistake rather than as emphasis.
        var leadAt = slice.length === PER_PAGE ? 1 : -1;

        deck.dataset.count = String(slice.length);
        deck.innerHTML = slice.map(function (project, index) {
            return renderCard(project, current.category, index === leadAt);
        }).join("");

        paintPager();
    };

    var show = function (category) {
        current.category = category;
        current.page = 0;
        paintDeck();
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
        var target = current.page + direction;
        if (target < 0 || target >= current.pages) {
            return;
        }
        current.page = target;
        paintDeck();
    };

    if (previous) { previous.addEventListener("click", function () { step(-1); }); }
    if (next) { next.addEventListener("click", function () { step(1); }); }

    if (dots) {
        dots.addEventListener("click", function (event) {
            var dot = event.target.closest("[data-lp-new-page]");
            if (!dot) {
                return;
            }
            current.page = Number(dot.dataset.lpNewPage) || 0;
            paintDeck();
        });
    }

    show(categories[0]);
})();
