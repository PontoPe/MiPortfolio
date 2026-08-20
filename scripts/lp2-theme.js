// LP2 theme resolution.
//
// The sky has a day version and a night version. Which one a visitor gets is
// their operating system's business until they say otherwise: the default is
// `prefers-color-scheme`, handled entirely in lp2.css. This file covers the
// two cases the stylesheet cannot — asking for the other one on purpose, and
// remembering that.
//
//     the nav button        toggle between the two, and keep the choice
//     ?theme=dark           force the night sky
//     ?theme=light          force the day sky
//     ?theme=auto           hand it back to the system
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
(function () {
    "use strict";

    var KEY = "portfolio:lp2-theme";
    var root = document.documentElement;

    var read = function () {
        try {
            // The session key is what earlier visits wrote. Read it once so a
            // tab that is mid-visit does not lose its theme to the move.
            return window.localStorage.getItem(KEY) ||
                   window.sessionStorage.getItem(KEY);
        } catch (error) {
            return null;
        }
    };

    var write = function (theme) {
        try {
            if (theme === "dark" || theme === "light") {
                window.localStorage.setItem(KEY, theme);
            } else {
                window.localStorage.removeItem(KEY);
            }
            window.sessionStorage.removeItem(KEY);
        } catch (error) {
            /* Storage blocked: the choice holds for this page only. */
        }
    };

    var apply = function (theme) {
        if (theme === "dark" || theme === "light") {
            root.setAttribute("data-lp2-theme", theme);
            root.style.colorScheme = theme;
        } else {
            root.removeAttribute("data-lp2-theme");
            root.style.colorScheme = "light dark";
        }
    };

    // What the visitor is actually looking at right now, chosen or inherited.
    // The button offers the opposite of this, so it has to resolve the system
    // preference too rather than only reading the attribute.
    var resolved = function () {
        var chosen = root.getAttribute("data-lp2-theme");

        if (chosen === "dark" || chosen === "light") {
            return chosen;
        }

        return window.matchMedia &&
               window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };

    var forced = /[?&]theme=(dark|light|auto)/.exec(window.location.search);

    if (forced) {
        apply(forced[1] === "auto" ? null : forced[1]);
        write(forced[1] === "auto" ? null : forced[1]);
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
            var next = resolved() === "dark" ? "light" : "dark";
            button.setAttribute("data-lp2-shows", next);
            button.setAttribute(
                "aria-label",
                next === "dark" ? "Switch to dark mode" : "Switch to light mode"
            );
        };

        button.addEventListener("click", function () {
            var next = resolved() === "dark" ? "light" : "dark";
            apply(next);
            write(next);
            label();
        });

        // Nothing is stored until the button is pressed, so a visitor still on
        // the system's word follows it when the system changes under them.
        if (window.matchMedia) {
            var query = window.matchMedia("(prefers-color-scheme: dark)");
            var onChange = function () {
                if (!root.hasAttribute("data-lp2-theme")) {
                    label();
                }
            };

            if (query.addEventListener) {
                query.addEventListener("change", onChange);
            } else if (query.addListener) {
                query.addListener(onChange);
            }
        }

        label();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", wire);
    } else {
        wire();
    }
})();
