const parallaxLayers = document.querySelectorAll(".parallax-layer[data-depth]");
let pointerX = 0;
let pointerY = 0;
let ticking = false;

const renderParallax = () => {
    const scrollShift = window.scrollY * 0.035;
    document.documentElement.style.setProperty("--ambient-scroll-y", `${window.scrollY * -0.14}px`);

    parallaxLayers.forEach((layer) => {
        const depth = Number(layer.dataset.depth);
        const x = pointerX * depth;
        const y = pointerY * depth + scrollShift * depth;

        layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });

    ticking = false;
};

const queueParallax = () => {
    if (!ticking) {
        window.requestAnimationFrame(renderParallax);
        ticking = true;
    }
};

window.addEventListener("pointermove", (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    queueParallax();
});

window.addEventListener("scroll", queueParallax, { passive: true });
renderParallax();
