// LP2 mobile navigation.
//
// The links collapse behind a button under 768px (see .lp2-nav-links in
// lp2.css); this opens and closes them. Deliberately small: the panel is the
// same list of anchors, so following one closes it, and so does Escape or a
// click anywhere else on the page.
(function () {
    "use strict";

    var toggle = document.querySelector(".lp2-nav-toggle");
    var links = document.querySelector(".lp2-nav-links");

    if (!toggle || !links) {
        return;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "lp2-nav-links");
    links.id = "lp2-nav-links";

    var setOpen = function (open) {
        links.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    toggle.addEventListener("click", function (event) {
        event.stopPropagation();
        setOpen(!links.classList.contains("is-open"));
    });

    links.addEventListener("click", function (event) {
        if (event.target.closest("a")) {
            setOpen(false);
        }
    });

    document.addEventListener("click", function (event) {
        if (!links.contains(event.target) && !toggle.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            setOpen(false);
        }
    });
})();
