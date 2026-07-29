/**
 * Every number the hero scene needs, in one place.
 *
 * The scene uses an orthographic camera mapped 1 unit = 1 CSS pixel, so every
 * distance here is in pixels — including the ones that usually live in metres.
 * `thickness: 1.5`, the value a metre-scale glass shader wants, is invisible at
 * this scale; what reads as glass here is tens of pixels. (three's `thickness`
 * uniform is the exception that proves it: glass.js converts out of pixels
 * before handing it over, and explains why.)
 *
 * Anything that has to survive a resize is expressed as a ratio of the word's
 * fitted width rather than an absolute, so a 1400px hero and a 700px hero get
 * the same glass instead of the same numbers.
 *
 * Live-tune any of this by loading the page with ?glass in the query string:
 * scripts/hero/debug.js hangs a lil-gui off these objects.
 */
export const MODEL_URL = "assets/3d/Welc.glb";

export const RENDERER = {
    /* Two is enough for the tube's silhouette; past that the transmission pass
       costs more than the extra crispness is worth. */
    maxPixelRatio: 2,
    /* transmission renders the scene an extra time per frame, and `dispersion`
       makes that three times — once per colour channel. Halving the resolution
       of that offscreen pass is by far the cheapest win available, and the
       result is refracted through a curved surface anyway, so the softness
       does not survive to be noticed. */
    transmissionResolutionScale: 0.5,
    exposure: 1,
};

export const GLASS = {
    /* Fraction of the canvas the word is allowed to span. The word is also
       clamped to the width of the hero box (the same span the PNG had), so on
       a wide screen this ceiling never binds — it only kicks in on narrow ones,
       where it keeps the lettering clear of the canvas edge fade. */
    maxCanvasWidthRatio: 0.8,
    /* How far light travels through the glass, as a ratio of the fitted width
       — a little over the diameter of the tube, which is about 0.1 of the
       word's width. This is what drives how far the backdrop is displaced, so
       too low and the refraction goes flat and the dispersion disappears with
       it. glass.js converts it into the model-local units three actually
       wants; the note there is worth reading before touching this. */
    thicknessRatio: 0.12,
    /* Beer-Lambert absorption distance, in pixels of that same travel. Short =
       deeply saturated core; long = barely tinted. Kept long on purpose: the
       word should read as clear glass that happens to pick up a violet cast
       where it is thick, not as coloured glass. */
    attenuationDistanceRatio: 0.42,
    /* The tint does NOT come from `color`. It is absorption through the
       volume, which is why thick parts of the tube go saturated while the thin
       edges stay near-clear — a flat `color` would render as violet plastic. */
    attenuationColor: 0xa98cff,
    ior: 1.6,
    /* Low: the roughness feeds the mip level the transmission sample is read
       at, so anything higher blurs the stickers behind the word into mush. */
    roughness: 0.03,
    /* Rainbow fringing at the edges. Needs transmission > 0, and only shows
       where the surface curves — a flat face refracts all three channels the
       same way and separates nothing. three turns this into an IOR spread of
       only (ior - 1) * 0.025 * dispersion, so against a pale backdrop like
       this one it takes a value in the tens to read at all; past ~40 the
       channels separate far enough to tear the strokes apart. */
    dispersion: 22,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.15,
};

export const LIGHTS = {
    /* The environment gives the tube its body; these two give it the hard
       white glints that travel along the strokes as it tilts. */
    key: { color: 0xffffff, intensity: 2.2, position: [-260, 420, 520] },
    rim: { color: 0xdbe4ff, intensity: 1.1, position: [380, -220, 300] },
};

export const LAYERS = {
    /* The opaque copy the glass refracts, kept behind the visible one so the
       two never fight over the depth buffer. See background.js. */
    backdrop: -320,
    background: -300,
    stickers: -80,
    glass: 0,
    camera: 500,
};

export const BACKGROUND = {
    /* Sampled from page-style.css so the plane reads as a continuation of the
       page rather than a panel dropped on top of it: body is #f1f2fa under a
       white bloom at 50% 32%, with lavender pooling at the bottom corners. */
    top: 0xf7f8fd,
    bottom: 0xeceffa,
    bloom: 0xffffff,
    lavender: 0xc8cff3,
    grid: 0x8b9ae3,
    gridSize: 30,
    /* Faint on the page, but it is the only straight line in the scene: bent
       through the tube it is what makes the refraction legible. */
    gridOpacity: 0.14,
    noise: 0.014,
    /* Idle motion. The grid slides a few pixels and the bloom breathes, so the
       backdrop the glass is bending is never twice the same even when nobody
       is touching the page. Seconds per cycle, pixels of travel. */
    driftAmplitude: 18,
    driftPeriod: 26,
    bloomPeriod: 19,
    /* The canvas is transparent, so the plane has to fade out before it
       reaches the edge or the hero would be a visible rectangle stamped over
       the page. Fraction of the canvas each edge fades across. */
    edgeFade: 0.09,
    /* How far the grid slides with the pointer, in pixels. Parallax against
       the stickers, which move on their own. */
    parallax: 14,
};

export const STICKERS = {
    /* Transparent artwork used by the falling planes behind the lettering.
       The renderer reads each PNG's natural dimensions so wide badges and
       portrait stickers keep their proportions. */
    images: [
        { src: "assets/ui/stickers/claude.png", family: "scalloped" },
        { src: "assets/ui/stickers/accidents.png", family: "wide" },
        { src: "assets/ui/stickers/ai.png", family: "vertical" },
        { src: "assets/ui/stickers/human.png", family: "scalloped" },
        { src: "assets/ui/stickers/figma.png", family: "wide" },
        { src: "assets/ui/stickers/star_pink.png", family: "star" },
        { src: "assets/ui/stickers/fine.png", family: "vertical" },
        { src: "assets/ui/stickers/star_blue.png", family: "star" },
        { src: "assets/ui/stickers/cmd_z.png", family: "wide" },
        { src: "assets/ui/stickers/passion.png", family: "round" },
        { src: "assets/ui/stickers/pixel.png", family: "round" },
        { src: "assets/ui/stickers/nerd.png", family: "vertical" },
        { src: "assets/ui/stickers/pen.png", family: "round" },
        { src: "assets/ui/stickers/heart.png", family: "heart" },
        { src: "assets/ui/stickers/buddy.png", family: "wide" },
        { src: "assets/ui/stickers/nilsen.png", family: "wide" },
        { src: "assets/ui/stickers/best.png", family: "scalloped" },
    ],
    /* Fallbacks for a future image-free version of the scene. */
    emoji: [
        ["💜", "rgba(183, 157, 240, 0.9)"],
        ["🌸", "rgba(244, 168, 208, 0.9)"],
        ["⭐", "rgba(247, 215, 116, 0.9)"],
        ["🎨", "rgba(240, 160, 130, 0.85)"],
        ["✏️", "rgba(245, 200, 110, 0.85)"],
        ["💻", "rgba(159, 180, 240, 0.9)"],
        ["✨", "rgba(247, 224, 142, 0.9)"],
        ["🩵", "rgba(143, 211, 244, 0.9)"],
        ["🖌️", "rgba(201, 162, 239, 0.85)"],
        ["💌", "rgba(243, 176, 192, 0.9)"],
    ],
    // TODO: Add future transparent PNGs here with a visual family; the family
    // lets the spawner keep similar silhouettes out of the same local cluster.
    /* They fall, slowly and forever: one leaves the bottom of the canvas and
       comes back in at the top as a different sticker, at a new size, speed
       and lane. Kept sparse — the point is to give the glass something to
       bend, not to fill the hero. */
    count: 8,
    /* Size as a fraction of the canvas width. The top of the range matters:
       a small sticker passing behind the tube is magnified into an unreadable
       smear, so some of them have to be big enough to survive it. */
    size: { min: 0.055, max: 0.096 },
    /* Similar silhouettes stay out of the same local cluster. Values are
       normalised against the canvas, like the spawn coordinates themselves. */
    variety: { nearbyX: 0.28, nearbyY: 0.3, recentTextures: 3 },
    /* Fall speed in canvas heights per second — normalised so the rain reads
       at the same pace on any viewport. At these values a sticker takes
       roughly 16 to 36 seconds to cross. */
    speed: { min: 0.028, max: 0.062 },
    /* Lateral drift on the way down: pixels of travel, and the range of
       seconds one sway takes. */
    sway: { amplitude: 30, period: { min: 6, max: 13 } },
    /* Peak turn in radians per second, and the tilt they can spawn at. */
    spin: 0.05,
    tilt: 0.35,
    /* Fraction of the canvas height each sticker fades across as it enters at
       the top and leaves at the bottom, so nothing pops in or out. */
    fade: 0.12,
    /* No entry delay: the rain is already mid-fall when the hero fades in, so
       the stickers arrive with the lettering and the tags rather than raining
       into an empty sky afterwards. The fade that brings them in is the one on
       .hero-stage, which they are inside. */
    /* How much of the pointer's offset they follow, against the background. */
    parallax: 26,
};

export const POINTER = {
    /* Peak rotation in radians. This is weight and inertia, not a spin — much
       past this and the flat faces of the tube turn towards the camera and the
       refraction goes to nothing.

       This tilt is the ONLY thing the pointer does to the word. No swell, no
       reaction to how fast the cursor is moving, nothing that triggers when it
       crosses the lettering: the word leans towards the cursor and that is the
       whole interaction. */
    tilt: { x: 0.09, y: 0.15 },
    /* Fraction of the remaining distance left after one second. The per-frame
       factor is derived from this, so the easing is identical at 60 and 144Hz. */
    smoothing: 0.001,
    /* Idle float, in pixels and seconds. The two axes are on deliberately
       unrelated periods so the word wanders instead of tracing a loop. */
    float: { amplitude: 7, period: 6.5, sway: 16, swayPeriod: 11.5 },
};
