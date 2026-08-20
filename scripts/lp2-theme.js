// LP2 theme resolution.
//
// The page opens in daylight. That is a decision, not a fallback: the day sky
// is the design, and `prefers-color-scheme` is deliberately not consulted —
// a visitor whose laptop is dark all day should still meet this page the way
// it was drawn. What IS honoured is their own choice, which the nav button
// makes and this file remembers:
//
//     the nav button        toggle day/night, and keep it
//     ?theme=dark           open at night
//     ?theme=light          open in daylight
//     ?theme=auto           forget the stored choice (back to daylight)
//
// The choice is kept in localStorage. It used to be sessionStorage, from when
// the only way in was the query string and the choice was meant to last a look
// rather than a visit; a control on the bar is a decision, and a decision that
// forgets itself on the next visit reads as a bug.
//
// Applied as early as possible (this file is in <head>, before the stylesheet)
// so the page is never painted in one theme and corrected into the other. The
// button itself does not exist yet at that point, which is why wiring it waits
// for the document.
//
// Everything downstream reads the theme from the [data-lp2-theme] attribute,
// which is why this always writes it rather than leaving daylight implicit:
// lp2.css only has to answer one selector, and the WebGL hero — which cannot
// re-read a stylesheet — gets told by the `portfolio:theme-change` event this
// file dispatches on every change.
(function () {
    "use strict";

    var KEY = "portfolio:lp2-theme";
    var DEFAULT = "light";
    var root = document.documentElement;

    var clean = function (theme) {
        return theme === "dark" || theme === "light" ? theme : null;
    };

    var read = function () {
        try {
            // The session key is what earlier visits wrote. Read it once so a
            // tab that is mid-visit does not lose its theme to the move.
            return clean(window.localStorage.getItem(KEY))
                || clean(window.sessionStorage.getItem(KEY));
        } catch (error) {
            return null;
        }
    };

    var write = function (theme) {
        try {
            if (clean(theme)) {
                window.localStorage.setItem(KEY, theme);
            } else {
                window.localStorage.removeItem(KEY);
            }
            window.sessionStorage.removeItem(KEY);
        } catch (error) {
            /* Storage blocked: the choice holds for this page only. */
        }
    };

    var current = function () {
        return root.getAttribute("data-lp2-theme") === "dark" ? "dark" : "light";
    };

    var apply = function (theme) {
        var next = clean(theme) || DEFAULT;

        if (next === current() && root.hasAttribute("data-lp2-theme")) {
            return;
        }

        root.setAttribute("data-lp2-theme", next);
        root.style.colorScheme = next;
        window.dispatchEvent(new CustomEvent("portfolio:theme-change", {
            detail: { theme: next }
        }));
    };

    var forced = /[?&]theme=(dark|light|auto)/.exec(window.location.search);

    if (forced) {
        apply(clean(forced[1]));
        write(clean(forced[1]));
    } else {
        apply(read());
    }

    // --- the button ---------------------------------------------------------

    var wire = function () {
        var button = document.querySelector("[data-lp2-theme-toggle]");

        if (!button) {
            return;
        }

        var label = function () {
            // Both the icon and the label name where the button goes, not where
            // the page is: a moon on a daylit page is an offer, not a status.
            var next = current() === "dark" ? "light" : "dark";
            button.setAttribute("data-lp2-shows", next);
            button.setAttribute(
                "aria-label",
                next === "dark" ? "Switch to dark mode" : "Switch to light mode"
            );
        };

        button.addEventListener("click", function () {
            var next = current() === "dark" ? "light" : "dark";
            apply(next);
            write(next);
            label();
        });

        label();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wire);
    } else {
        wire();
    }
})();
