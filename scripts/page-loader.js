// Keeps the static Welcome fallback and the rest of the page covered until
// both ordinary page assets and the optional 3D hero have settled.
(function () {
    const HERO_READY_EVENT = "portfolio:hero-ready";
    const MINIMUM_DISPLAY_MS = 500;
    const MAXIMUM_WAIT_MS = 12000;
    const startedAt = performance.now();
    let pageLoaded = document.readyState === "complete";
    let heroReady = Boolean(window.__portfolioHeroReady);
    let revealed = false;

    const reveal = () => {
        if (revealed || !pageLoaded || !heroReady) {
            return;
        }

        const remaining = Math.max(0, MINIMUM_DISPLAY_MS - (performance.now() - startedAt));
        window.setTimeout(() => {
            if (revealed) {
                return;
            }

            revealed = true;
            document.documentElement.classList.remove("is-loading");
            document.documentElement.classList.add("is-ready");

            window.setTimeout(() => {
                document.querySelector(".site-loader")?.remove();
            }, 600);
        }, remaining);
    };

    window.addEventListener("load", () => {
        pageLoaded = true;
        reveal();
    }, { once: true });

    window.addEventListener(HERO_READY_EVENT, () => {
        heroReady = true;
        reveal();
    }, { once: true });

    // Safe failure: a broken third-party asset must not leave the portfolio
    // permanently hidden.
    window.setTimeout(() => {
        pageLoaded = true;
        heroReady = true;
        reveal();
    }, MAXIMUM_WAIT_MS);

    // TODO: Keep HERO_READY_EVENT synchronized with scripts/hero/index.js if
    // the hero bootstrap is renamed or replaced.
    reveal();
})();
