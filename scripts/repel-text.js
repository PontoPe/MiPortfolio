// Cursor-repellent text effect. Words drift away from the pointer.
// Apply with data-repel on a container: data-repel="strong" (default) or data-repel="soft" (minimized, e.g. header).
//
// Performance notes, because this runs against every word on the page and the
// naive version of it is what makes Safari crawl:
//
//  - Rects are measured in their own pass and only when they can actually have
//    changed (scroll, resize). Reading a rect right after writing a transform
//    forces a synchronous layout, and doing that once per word is one forced
//    layout per word per frame.
//  - The easing is done here rather than by a CSS transition. A transition on
//    the words would be restarted every frame by the new target, and each word
//    would want its own compositing layer — a few hundred layers at 2x on a
//    retina screen costs far more than the effect is worth.
//  - Only words that moved are written to, and the loop parks itself as soon as
//    everything is back at rest.
(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    /* Fraction of the distance left after one second. The per-frame factor is
       derived from it, so the settle takes the same time at 60 and 120Hz. */
    const SMOOTHING = 0.0000005;
    /* Below this the word is close enough to its target to be snapped and the
       loop allowed to stop. */
    const EPSILON = 0.05;
    /* Words this far outside the viewport are never near the cursor. */
    const CULL_MARGIN = 120;

    const words = [];

    const isAtomic = (node, root) => {
        let parent = node.parentElement;
        while (parent && parent !== root) {
            if (
                parent.classList.contains("hero-hotspot") ||
                parent.classList.contains("story-icon")
            ) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    };

    const wrap = (root, strength) => {
        if (root.dataset.repelWrapped) {
            return;
        }
        root.dataset.repelWrapped = "1";

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (isAtomic(node, root)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }

        textNodes.forEach((node) => {
            const fragment = document.createDocumentFragment();
            node.nodeValue.split(/(\s+)/).forEach((part) => {
                if (!part) {
                    return;
                }
                if (/\s+/.test(part)) {
                    fragment.appendChild(document.createTextNode(part));
                    return;
                }
                const span = document.createElement("span");
                span.className = "repel-word";
                span.textContent = part;
                fragment.appendChild(span);
            });
            node.replaceWith(fragment);
        });

        // Decorative hotspots keep their own rotation/scale styling, so leave them static.
        root.querySelectorAll(".repel-word").forEach((el) => words.push({
            el,
            strength,
            radius: 110 * strength + 40,
            /* Resting centre, filled in by measure(). */
            cx: 0,
            cy: 0,
            onScreen: true,
            /* Where the word is now, and where the cursor wants it. */
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            /* Last value actually written, so an unchanged word is never
               touched — a style write on a word that is already at rest still
               dirties the document. */
            wroteX: 0,
            wroteY: 0,
            written: false,
        }));
    };

    document.querySelectorAll("[data-repel]").forEach((root) => {
        wrap(root, root.getAttribute("data-repel") === "soft" ? 0.5 : 1);
    });

    if (!words.length) {
        return;
    }

    let pointerX = -9999;
    let pointerY = -9999;
    let frame = null;
    let lastTime = 0;
    let needsMeasure = true;

    /* Read-only pass. Nothing here may write to the DOM: the point is that the
       browser lays out once for all of them instead of once each. */
    const measure = () => {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        for (let i = 0; i < words.length; i += 1) {
            const word = words[i];
            const rect = word.el.getBoundingClientRect();
            /* The rect already includes the offset the word is currently
               carrying, so take it back out — otherwise a pushed word would
               measure as if its resting place were where it was pushed to, and
               the push would compound. */
            word.cx = rect.left + rect.width / 2 - word.x;
            word.cy = rect.top + rect.height / 2 - word.y;
            word.onScreen = rect.bottom > -CULL_MARGIN
                && rect.top < viewportHeight + CULL_MARGIN
                && rect.right > -CULL_MARGIN
                && rect.left < viewportWidth + CULL_MARGIN;
        }

        needsMeasure = false;
    };

    const render = (now) => {
        frame = null;
        const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 1 / 60;
        lastTime = now;

        if (needsMeasure) {
            measure();
        }

        /* Frame-rate independent ease: the same fraction of the gap closes per
           second no matter how often we are called. */
        const ease = 1 - Math.pow(SMOOTHING, dt);
        let moving = false;

        for (let i = 0; i < words.length; i += 1) {
            const word = words[i];

            if (word.onScreen) {
                const dx = word.cx - pointerX;
                const dy = word.cy - pointerY;
                const distance = Math.hypot(dx, dy);

                if (distance > word.radius || distance === 0) {
                    word.targetX = 0;
                    word.targetY = 0;
                } else {
                    const linear = 1 - distance / word.radius;
                    // smoothstep easing so the push fades in/out gently (water-like, no hard edge)
                    const eased = linear * linear * (3 - 2 * linear);
                    const push = 15 * word.strength * eased;
                    word.targetX = (dx / distance) * push;
                    word.targetY = (dy / distance) * push;
                }
            } else {
                word.targetX = 0;
                word.targetY = 0;
            }

            const gapX = word.targetX - word.x;
            const gapY = word.targetY - word.y;

            if (Math.abs(gapX) < EPSILON && Math.abs(gapY) < EPSILON) {
                word.x = word.targetX;
                word.y = word.targetY;
            } else {
                word.x += gapX * ease;
                word.y += gapY * ease;
                moving = true;
            }

            if (Math.abs(word.x - word.wroteX) < 0.01 && Math.abs(word.y - word.wroteY) < 0.01
                && word.written) {
                continue;
            }
            word.wroteX = word.x;
            word.wroteY = word.y;
            word.written = true;
            word.el.style.transform = word.x === 0 && word.y === 0
                ? ""
                : `translate(${word.x.toFixed(2)}px, ${word.y.toFixed(2)}px)`;
        }

        /* Keep going only while something is still settling. A page nobody is
           touching runs no frames at all. */
        if (moving) {
            queue();
        } else {
            lastTime = 0;
        }
    };

    function queue() {
        if (!frame) {
            frame = window.requestAnimationFrame(render);
        }
    }

    window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        queue();
    }, { passive: true });
    window.addEventListener("pointerleave", () => {
        pointerX = -9999;
        pointerY = -9999;
        queue();
    });
    window.addEventListener("scroll", () => {
        needsMeasure = true;
        queue();
    }, { passive: true });
    window.addEventListener("resize", () => {
        needsMeasure = true;
        queue();
    }, { passive: true });
})();
