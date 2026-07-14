// Falling emoji stickers behind the page content. Each sticker carries a
// faint radial glow tinted with the emoji's dominant colour (see .emoji-drop
// styles in page-style.css). Self-injects its container, so pages only need
// to include this script.
//
// Each drop runs ONE pass of the fall animation; on animationend it is
// re-randomized and restarted from the top. Restarting via a fresh animation
// (instead of mutating a running infinite one) keeps the speed stable —
// changing the duration of a live animation recomputes its progress from the
// original start time, which made drops jump around and speed up over time.
(function () {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    // [emoji, dominant glow colour]
    const STICKERS = [
        ["🎨", "rgba(240, 160, 130, 0.75)"],
        ["✏️", "rgba(245, 200, 110, 0.75)"],
        ["💜", "rgba(183, 157, 240, 0.8)"],
        ["⭐", "rgba(247, 215, 116, 0.8)"],
        ["🌸", "rgba(244, 168, 208, 0.8)"],
        ["💻", "rgba(159, 180, 240, 0.8)"],
        ["✨", "rgba(247, 224, 142, 0.8)"],
        ["🩵", "rgba(143, 211, 244, 0.8)"],
        ["🖌️", "rgba(201, 162, 239, 0.75)"],
        ["💌", "rgba(243, 176, 192, 0.8)"],
        ["🧷", "rgba(160, 170, 230, 0.7)"],
        ["📐", "rgba(240, 180, 111, 0.75)"]
    ];

    const DROP_COUNT = 14;
    const random = (min, max) => min + Math.random() * (max - min);

    const container = document.createElement("div");
    container.className = "emoji-rain";
    container.setAttribute("aria-hidden", "true");

    const launch = (drop, inner, initial) => {
        const [emoji, glow] = STICKERS[Math.floor(Math.random() * STICKERS.length)];
        const duration = random(14, 26);

        // Reset the animation cleanly: detach, apply new randoms, force a
        // reflow so the browser treats the next pass as a brand-new animation.
        drop.style.animation = "none";

        drop.style.left = `${random(-2, 98)}vw`;
        drop.style.fontSize = `${random(1.1, 2.2)}rem`;
        drop.style.setProperty("--glow", glow);
        drop.style.setProperty("--tilt-from", `${random(-14, 6)}deg`);
        drop.style.setProperty("--tilt-to", `${random(-6, 14)}deg`);
        drop.style.setProperty("--sway", `${random(0.5, 1.8)}rem`);
        inner.style.animationDuration = `${random(2.4, 4.6)}s`;
        inner.querySelector("span").textContent = emoji;

        void drop.offsetWidth;

        drop.style.animation = "";
        drop.style.animationDuration = `${duration}s`;
        // Negative delay on the first pass scatters drops through the whole
        // fall path so the screen starts populated instead of raining in a
        // clump. Later passes always start from the top.
        drop.style.animationDelay = initial ? `${-random(0, duration)}s` : "0s";
    };

    for (let i = 0; i < DROP_COUNT; i += 1) {
        const drop = document.createElement("div");
        drop.className = "emoji-drop";

        const inner = document.createElement("div");
        inner.className = "emoji-drop-inner";
        inner.appendChild(document.createElement("span"));
        drop.appendChild(inner);

        drop.addEventListener("animationend", () => launch(drop, inner, false));
        launch(drop, inner, true);
        container.appendChild(drop);
    }

    document.body.prepend(container);
})();
