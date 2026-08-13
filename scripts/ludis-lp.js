// LUDIS case page — the before/after comparison.
//
// The Figma frame ships this as a "slide for before and after" interaction, so
// it is a real control here rather than a flattened screenshot: the handle sets
// --lp-ba, which is both the clip edge on the "after" screen and the handle's
// own left offset.
//
// The screen hole sits 8.669% in from the left of the device export and is
// 85.685% of its width; the pointer is mapped through that inset so the handle
// tracks the cursor rather than drifting from it.
(function () {
    "use strict";

    var MIN = 0;
    var MAX = 100;

    document.querySelectorAll("[data-ba]").forEach(function (device) {
        var handle = device.querySelector(".lp-ba-handle");
        if (!handle) return;

        var value = 73;
        var dragging = false;

        function set(next) {
            value = Math.min(MAX, Math.max(MIN, next));
            device.style.setProperty("--lp-ba", value + "%");
            handle.setAttribute("aria-valuenow", Math.round(value));
        }

        function fromPointer(clientX) {
            var box = device.getBoundingClientRect();
            if (!box.width) return;
            // Map the pointer through the screen inset so the handle tracks it.
            var inner = (clientX - box.left) / box.width;
            set(((inner - 0.08669) / 0.85685) * 100);
        }

        device.addEventListener("pointerdown", function (e) {
            dragging = true;
            handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
            fromPointer(e.clientX);
            e.preventDefault();
        });

        window.addEventListener("pointermove", function (e) {
            if (dragging) fromPointer(e.clientX);
        });

        window.addEventListener("pointerup", function () {
            dragging = false;
        });

        handle.addEventListener("keydown", function (e) {
            var step = e.shiftKey ? 10 : 2;
            if (e.key === "ArrowLeft") set(value - step);
            else if (e.key === "ArrowRight") set(value + step);
            else if (e.key === "Home") set(MIN);
            else if (e.key === "End") set(MAX);
            else return;
            e.preventDefault();
        });

        set(value);
    });
})();
