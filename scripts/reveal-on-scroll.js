// Reveals a group of elements the first time it scrolls into view.
//
// Markup contract: [data-reveal-group] is the thing being watched, and the
// [data-reveal] elements inside it are what fade in. The group is observed
// rather than each child, so a tall block and a short one next to it arrive
// together on one beat instead of each tripping its own threshold; the order
// they arrive in is the number in the attribute, spaced out in CSS.
//
// The hidden state lives behind html.has-reveal, which is set here. Nothing is
// hidden until the script that can show it again has run, so a failed or
// blocked script leaves the content visible rather than blank — and the class
// is never set at all for a visitor who has asked for reduced motion.
(function () {
    const GROUP = "[data-reveal-group]";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const groups = document.querySelectorAll(GROUP);
    if (!groups.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        return;
    }

    document.documentElement.classList.add("has-reveal");

    /* A fifth of the group has to be showing, and the bottom of the viewport
       does not count as "in view" until the group is properly past it — so the
       reveal reads as a response to arriving at the section rather than as
       something that already happened by the time it is being looked at. */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

    groups.forEach((group) => observer.observe(group));
})();
