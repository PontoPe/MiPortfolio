// Ambient background parallax: the blob layers drift with the pointer and with
// scroll, and the bokeh pseudo-elements on .parallax-bg get carried along by a
// transform on their parent.
//
// The easing is done here rather than by a CSS transition on the layers. A
// transition would be restarted by every frame of the new target, which on
// Safari means four interrupted transitions per frame across four blurred
// full-viewport boxes; easing the number instead leaves the compositor with a
// plain translate to apply.
const container = document.querySelector(".parallax-bg");
const parallaxLayers = document.querySelectorAll(".parallax-layer[data-depth]");
const layers = Array.from(parallaxLayers, (el) => ({
    el,
    depth: Number(el.dataset.depth),
    x: 0,
    y: 0,
}));

/* Fraction of the distance to the target left after one second — the per-frame
   factor is derived from it, so the drift feels the same at 60 and 120Hz. This
   is the old 500ms ease-out, expressed as a rate. */
const SMOOTHING = 0.000001;
const EPSILON = 0.05;

let pointerX = 0;
let pointerY = 0;
let frame = null;
let lastTime = 0;

const render = (now) => {
    frame = null;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 1 / 60;
    lastTime = now;

    const scrollY = window.scrollY;
    const scrollShift = scrollY * 0.035;
    const ambientY = scrollY * -0.14;

    if (container) {
        container.style.transform = `translate3d(0, ${ambientY.toFixed(2)}px, 0)`;
    }

    const ease = 1 - Math.pow(SMOOTHING, dt);
    let moving = false;

    for (let i = 0; i < layers.length; i += 1) {
        const layer = layers[i];
        const targetX = pointerX * layer.depth;
        /* The parent now carries `ambientY` for the bokeh, so take it back out
           here: these layers drift on their own depth, exactly as before. */
        const targetY = pointerY * layer.depth + scrollShift * layer.depth - ambientY;

        const gapX = targetX - layer.x;
        const gapY = targetY - layer.y;

        if (Math.abs(gapX) < EPSILON && Math.abs(gapY) < EPSILON) {
            layer.x = targetX;
            layer.y = targetY;
        } else {
            layer.x += gapX * ease;
            layer.y += gapY * ease;
            moving = true;
        }

        layer.el.style.transform = `translate3d(${layer.x.toFixed(2)}px, ${layer.y.toFixed(2)}px, 0)`;
    }

    /* Park the loop once everything has caught up: a page nobody is touching
       runs no frames. */
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
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    queue();
}, { passive: true });

window.addEventListener("scroll", queue, { passive: true });
queue();
