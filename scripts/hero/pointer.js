/**
 * Pointer state for the hero, smoothed.
 *
 * Position is normalised to -1..1 across the viewport rather than the canvas,
 * so the word keeps leaning towards the cursor even once it has left the hero
 * — tracking only inside the canvas makes the object snap when the pointer
 * crosses the edge.
 *
 * The easing is `1 - smoothing^dt` rather than a fixed per-frame fraction, so
 * a 144Hz display and a 60Hz one settle at the same speed instead of the fast
 * one arriving nearly instantly.
 */
import { POINTER } from "./config.js";

export const createPointer = () => {
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    /* Raw viewport coordinates, unsmoothed and unnormalised. The lean wants the
       eased -1..1 pair above; the sticker repulsion wants real pixels it can
       measure a distance in, and its own easing lives per sticker. */
    const client = { x: 0, y: 0, active: false };

    /* Position and nothing else. Pointer velocity used to drive the glass
       thickness here; it read as the word reacting when the cursor crossed it,
       which is exactly what the hero is not supposed to do. */
    const onMove = (event) => {
        target.x = (event.clientX / window.innerWidth - 0.5) * 2;
        target.y = (event.clientY / window.innerHeight - 0.5) * 2;
        client.x = event.clientX;
        client.y = event.clientY;
        client.active = true;
    };

    /* Cursor gone from the window entirely: the stickers have to ease home
       rather than hold the last push forever. The word keeps its lean, which
       is where it was already pointing. */
    const onLeave = () => {
        client.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const update = (dt) => {
        const k = 1 - Math.pow(POINTER.smoothing, dt);
        current.x += (target.x - current.x) * k;
        current.y += (target.y - current.y) * k;
        return current;
    };

    const dispose = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerleave", onLeave);
    };

    return { current, client, update, dispose };
};
