// Cursor-repellent text effect. Words drift away from the pointer.
// Apply with data-repel on a container: data-repel="strong" (default) or data-repel="soft" (minimized, e.g. header).
(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    const words = [];

    const isAtomic = (node, root) => {
        let parent = node.parentElement;
        while (parent && parent !== root) {
            if (
                parent.classList.contains("hero-hotspot") ||
                parent.classList.contains("story-icon") ||
                parent.classList.contains("sticker-pill")
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
        root.querySelectorAll(".repel-word").forEach((el) => words.push({ el, strength }));

        // Sticker pills repel as whole boxes: the words inside never move, the
        // box drifts. Deliberately a short reach and a small push — they sit
        // right under the hero lettering, and anything more reads as the row
        // scattering every time the cursor crosses it. The translate is
        // composed with the pill's CSS tilt (--tilt) so it keeps its rotation.
        root.querySelectorAll(".sticker-pill").forEach((el) => {
            words.push({ el, strength: 1, atomic: true, radius: 130, push: 16 });
        });
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

    const render = () => {
        frame = null;
        words.forEach(({ el, strength, atomic, radius: ownRadius, push: ownPush }) => {
            const rect = el.getBoundingClientRect();
            const dx = rect.left + rect.width / 2 - pointerX;
            const dy = rect.top + rect.height / 2 - pointerY;
            const distance = Math.hypot(dx, dy);
            const radius = ownRadius ?? 110 * strength + 40;

            if (distance > radius || distance === 0) {
                el.style.transform = "";
                return;
            }

            const linear = 1 - distance / radius;
            // smoothstep easing so the push fades in/out gently (water-like, no hard edge)
            const eased = linear * linear * (3 - 2 * linear);
            const push = (ownPush ?? 15 * strength) * eased;
            const nx = dx / distance;
            const ny = dy / distance;
            const translate = `translate(${(nx * push).toFixed(2)}px, ${(ny * push).toFixed(2)}px)`;
            el.style.transform = atomic ? `${translate} rotate(var(--tilt, 0deg))` : translate;
        });
    };

    const queue = () => {
        if (!frame) {
            frame = window.requestAnimationFrame(render);
        }
    };

    window.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        queue();
    });
    window.addEventListener("pointerleave", () => {
        pointerX = -9999;
        pointerY = -9999;
        queue();
    });
    window.addEventListener("scroll", queue, { passive: true });
})();
