// LP2 theme resolution.
//
// The sky has a day version and a night version, and which one a visitor gets
// is their operating system's business: the default is `prefers-color-scheme`,
// handled entirely in lp2.css. This script exists for the other two cases —
// looking at the other one on purpose, and keeping that choice for the visit:
//
//     ?theme=dark    force the night sky
//     ?theme=light   force the day sky
//     ?theme=auto    hand it back to the system
//
// The choice is kept in sessionStorage so it survives a page change without
// outliving the visit. Set as early as possible (this file is in <head>, before
// the stylesheet) so the page is never painted in one theme and corrected into
// the other.
(function () {
    "use strict";

    var KEY = "portfolio:lp2-theme";
    var root = document.documentElement;

    var apply = function (theme) {
        if (theme === "dark" || theme === "light") {
            root.setAttribute("data-lp2-theme", theme);
            root.style.colorScheme = theme;
        } else {
            root.removeAttribute("data-lp2-theme");
            root.style.colorScheme = "light dark";
        }
    };

    var forced = /[?&]theme=(dark|light|auto)/.exec(window.location.search);

    if (forced) {
        apply(forced[1]);
        try {
            if (forced[1] === "auto") {
                window.sessionStorage.removeItem(KEY);
            } else {
                window.sessionStorage.setItem(KEY, forced[1]);
            }
        } catch (error) {
            /* Storage blocked: the choice holds for this page only. */
        }
        return;
    }

    try {
        apply(window.sessionStorage.getItem(KEY));
    } catch (error) {
        /* No storage, no stored choice: the system preference, which is the
           default the stylesheet already implements. */
    }
})();
