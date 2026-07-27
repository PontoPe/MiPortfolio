/* ===========================================================================
   LUDIS case page — scroll behaviours
   ---------------------------------------------------------------------------
   Four small things, all opt-out under prefers-reduced-motion:
     1. reading progress bar
     2. chapter rail built from [data-chapter] sections (inverts over dark ones)
     3. reveal-on-enter for [data-reveal]
     4. count-up for [data-count] stats, fired once when the row enters
=========================================================================== */
(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));

    /* --- 1. progress bar ------------------------------------------------- */
    var bar = document.querySelector(".case-progress span");
    var ticking = false;

    function paintProgress() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? window.scrollY / max : 0;
        if (bar) bar.style.setProperty("--p", Math.min(1, Math.max(0, p)));
        ticking = false;
    }

    window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(paintProgress);
    }, { passive: true });
    paintProgress();

    /* --- 2. chapter rail -------------------------------------------------- */
    var rail = document.querySelector(".case-dots");
    var dots = [];

    if (rail && sections.length) {
        sections.forEach(function (section) {
            var dot = document.createElement("a");
            dot.className = "case-dot";
            dot.href = "#" + section.id;
            dot.innerHTML = "<b>" + section.dataset.chapter + "</b><i></i>";
            dot.setAttribute("aria-label", "Go to " + section.dataset.chapter);
            rail.appendChild(dot);
            dots.push(dot);
        });

        // The section covering the middle of the viewport owns the rail — both
        // its active dot and whether the rail paints light or dark.
        var syncRail = function () {
            var mid = window.scrollY + window.innerHeight / 2;
            var current = 0;
            sections.forEach(function (section, i) {
                if (section.offsetTop <= mid) current = i;
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
            rail.classList.toggle("on-dark", sections[current].classList.contains("case-section--dark"));
        };

        window.addEventListener("scroll", syncRail, { passive: true });
        window.addEventListener("resize", syncRail);
        syncRail();
    }

    /* --- 3. reveal -------------------------------------------------------- */
    var revealables = document.querySelectorAll("[data-reveal]");

    if (reduced || !("IntersectionObserver" in window)) {
        Array.prototype.forEach.call(revealables, function (el) {
            el.classList.add("is-in");
        });
    } else {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });

        Array.prototype.forEach.call(revealables, function (el) {
            revealObserver.observe(el);
        });
    }

    /* --- 4. count-up ------------------------------------------------------ */
    function countUp(el) {
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.countSuffix || "";
        if (isNaN(target)) return;

        if (reduced) {
            el.textContent = target + suffix;
            return;
        }

        var duration = 1100;
        var start = null;

        function step(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / duration);
            // ease-out cubic: fast off the line, settles on the number
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
    }

    var counters = document.querySelectorAll("[data-count]");

    if (!("IntersectionObserver" in window)) {
        Array.prototype.forEach.call(counters, countUp);
    } else {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                countUp(entry.target);
                countObserver.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        Array.prototype.forEach.call(counters, function (el) {
            el.textContent = "0" + (el.dataset.countSuffix || "");
            countObserver.observe(el);
        });
    }

    /* --- campaign rail arrows --------------------------------------------- */
    var track = document.querySelector("[data-rail]");

    if (track) {
        var prev = document.querySelector('[data-rail-btn="prev"]');
        var next = document.querySelector('[data-rail-btn="next"]');

        var scrollRail = function (dir) {
            var card = track.firstElementChild;
            var step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
            track.scrollBy({ left: dir * step, behavior: reduced ? "auto" : "smooth" });
        };

        if (prev) prev.addEventListener("click", function () { scrollRail(-1); });
        if (next) next.addEventListener("click", function () { scrollRail(1); });

        var syncRailBtns = function () {
            var maxScroll = track.scrollWidth - track.clientWidth - 2;
            if (prev) prev.disabled = track.scrollLeft <= 2;
            if (next) next.disabled = track.scrollLeft >= maxScroll;
        };

        track.addEventListener("scroll", syncRailBtns, { passive: true });
        window.addEventListener("resize", syncRailBtns);
        syncRailBtns();
    }

    /* --- hero phone drift -------------------------------------------------- */
    var phone = document.querySelector(".case-phone");

    if (phone && !reduced) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > window.innerHeight * 1.2) return;
            phone.style.setProperty("--float", (window.scrollY * -0.06).toFixed(2) + "px");
        }, { passive: true });
    }
})();
