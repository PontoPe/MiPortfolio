/**
 * The stickers falling behind the lettering (z = -80).
 *
 * These are what the glass has to distort: planes inside the scene, between
 * the backdrop and the word. They drift down the hero continuously — one
 * leaves the bottom and returns at the top as a different sticker, at a new
 * size, lane and speed — so what is behind the strokes, and therefore what is
 * magnified and bent inside them, is never the same twice. The first set is
 * scattered along the fall rather than queued above the top edge, so the hero
 * fades in already raining, at the same moment as the lettering and the tags.
 *
 * Everything about a sticker is stored normalised (x and y in fractions of the
 * canvas, speed in canvas heights per second), so a resize is a matter of
 * multiplying out again: the rain keeps its pace and its layout instead of
 * jumping when the viewport changes.
 *
 * Getting them refracted at all takes one trick. three renders only the
 * objects it considers opaque into the transmission render target, and it
 * decides that from `material.transparent` alone — while the GL blend mode
 * comes from `material.blending`. Setting `transparent: false` with
 * `blending: CustomBlending` therefore gets both: the plane is filed as
 * opaque, so the glass can see it, and its alpha still composites, so the
 * artwork can have soft edges and fade in and out at the ends of its fall.
 *
 * With no artwork supplied (STICKERS.images empty) the faces are drawn here:
 * the emoji from the falling-sticker rain over their own tinted glow, so the
 * hero matches the rest of the site.
 */
import * as THREE from "three";
import { LAYERS, STICKERS } from "./config.js";

const TILE = 256;
const TAU = Math.PI * 2;

const random = (min, max) => min + Math.random() * (max - min);
const fade = (rgba, alpha) => rgba.replace(/[\d.]+\)$/, `${alpha})`);

/** One emoji over its glow, on transparent ground. */
const drawFace = (emoji, glow) => {
    const canvas = document.createElement("canvas");
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    const centre = TILE / 2;

    /* Falls off to nothing well before the edge of the canvas, so the plane
       has no border to give itself away — through the glass or beside it. */
    const halo = ctx.createRadialGradient(centre, centre, 0, centre, centre, centre);
    halo.addColorStop(0, fade(glow, 0.55));
    halo.addColorStop(0.45, fade(glow, 0.22));
    halo.addColorStop(1, fade(glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, TILE, TILE);

    ctx.font = `${TILE * 0.56}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(73, 100, 219, 0.28)";
    ctx.shadowBlur = TILE * 0.07;
    ctx.shadowOffsetY = TILE * 0.02;
    ctx.fillText(emoji, centre, centre * 1.04);

    return canvas;
};

const createTexture = (emoji, glow) => {
    const texture = new THREE.CanvasTexture(drawFace(emoji, glow));
    /* Colour artwork, so it has to be tagged sRGB — left in linear it comes
       out washed out. (Normal and roughness maps are the opposite case.) */
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
};

export const createStickers = () => {
    const group = new THREE.Group();
    group.position.z = LAYERS.stickers;

    /* One texture per sticker in the set, shared by whichever planes happen to
       be showing it — a respawn swaps the map, it does not build artwork. */
    const loader = STICKERS.images.length ? new THREE.TextureLoader() : null;
    const textures = (loader ? STICKERS.images : STICKERS.emoji).map((entry) => {
        if (loader) {
            const texture = loader.load(entry);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        }
        return createTexture(entry[0], entry[1]);
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    const size = new THREE.Vector2(1, 1);
    const pointer = new THREE.Vector2();

    /**
     * Give a sticker a new identity and put it back above the top edge —
     * except on the very first pass, where `scattered` drops it anywhere along
     * the fall instead, so the hero fades in already raining.
     */
    const respawn = (item, scattered) => {
        item.material.map = textures[Math.floor(Math.random() * textures.length)];
        item.size = random(STICKERS.size.min, STICKERS.size.max);
        item.x = random(-0.44, 0.44);
        item.speed = random(STICKERS.speed.min, STICKERS.speed.max);
        item.sway = random(0.4, 1) * STICKERS.sway.amplitude;
        item.swayPeriod = random(STICKERS.sway.period.min, STICKERS.sway.period.max);
        item.phase = random(0, TAU);
        item.spin = random(-STICKERS.spin, STICKERS.spin);
        item.mesh.rotation.z = random(-STICKERS.tilt, STICKERS.tilt);
        /* Just clear of the top edge. Any further out and a large sticker
           spends seconds off screen before it even starts to fade in; the fade
           is what hides the entry, not the distance. */
        item.y = scattered ? random(-0.42, 0.42) : 0.5 + item.size * 0.5;
    };

    const items = [];
    for (let index = 0; index < STICKERS.count; index += 1) {
        const material = new THREE.MeshBasicMaterial({
            /* See the note at the top of the file: opaque to three, blended to
               the GPU. Premultiplied because the canvas is — with straight
               alpha the soft edge of the glow composites as a white fringe. */
            transparent: false,
            blending: THREE.CustomBlending,
            premultipliedAlpha: true,
            blendSrc: THREE.OneFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha: THREE.OneFactor,
            blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
            depthWrite: false,
            toneMapped: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        /* Behind the backdrop in the sort order it would be erased by it, so
           it has to come after — and with depth writes off, after the other
           stickers it overlaps too. */
        mesh.renderOrder = 1;
        /* A little depth between them, so the ones deeper in the scene refract
           slightly differently from the ones nearer the glass. */
        mesh.position.z = (index % 3) * -14;

        const item = { mesh, material };
        respawn(item, true);
        group.add(mesh);
        items.push(item);
    }

    const setSize = (width, height) => {
        size.set(width, height);
    };

    const setPointer = (x, y) => {
        pointer.set(x, y);
    };

    const update = (dt, time) => {
        items.forEach((item) => {
            item.y -= item.speed * dt;
            if (item.y < -0.5 - item.size * 0.5) {
                respawn(item);
            }

            const tile = item.size * size.x;
            const image = item.material.map?.image;
            const imageWidth = image?.naturalWidth || image?.width || 1;
            const imageHeight = image?.naturalHeight || image?.height || 1;
            const aspect = imageWidth / imageHeight;
            const width = aspect >= 1 ? tile : tile * aspect;
            const height = aspect >= 1 ? tile / aspect : tile;
            item.mesh.scale.set(width, height, 1);
            item.mesh.position.x = item.x * size.x
                + Math.sin(time * (TAU / item.swayPeriod) + item.phase) * item.sway
                - pointer.x * STICKERS.parallax;
            item.mesh.position.y = item.y * size.y + pointer.y * STICKERS.parallax;
            item.mesh.rotation.z += item.spin * dt;

            /* Fades over the first and last stretch of the fall, so a sticker
               is never seen appearing — including at the top of the canvas,
               which sits behind the hero copy. */
            const edge = 0.5 - STICKERS.fade;
            item.material.opacity = 1 - THREE.MathUtils.smoothstep(Math.abs(item.y), edge, 0.5);
        });
    };

    const dispose = () => {
        geometry.dispose();
        items.forEach(({ material }) => material.dispose());
        textures.forEach((texture) => texture.dispose());
    };

    return { group, setSize, setPointer, update, dispose };
};
