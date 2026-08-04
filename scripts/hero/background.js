/**
 * What sits behind the lettering (z = -300 and -320).
 *
 * It exists because `transmission` can only refract what is inside the WebGL
 * scene — the page behind the canvas does not exist as far as the glass is
 * concerned, and with nothing behind it the lettering samples cleared pixels
 * and renders as a dark smear. So the page's own backdrop is reproduced here:
 * the same lavender ramp, the same white bloom, plus a faint grid that makes
 * the refraction legible (a straight line bending through the tube is the
 * clearest possible evidence that the glass is doing something).
 *
 * Two meshes, for a reason worth stating: three.js renders ONLY the opaque
 * objects into the transmission render target (WebGLRenderer.renderTransmissionPass),
 * so a transparent plane is invisible to the glass no matter where it sits.
 *   · `backdrop`  — opaque, no edge fade, and masked out of the on-screen pass
 *                   by its colorWrite hook. This is what the glass refracts.
 *   · `mesh`      — transparent, fades to nothing before the canvas edge. This
 *                   is what the visitor sees, and what lets the hero blend
 *                   into the page instead of reading as a panel dropped on it.
 * Both draw the same shader, so the two agree everywhere it matters.
 *
 * Drawn procedurally rather than from a texture so it stays crisp at any
 * canvas size and pixel ratio.
 */
import * as THREE from "three";
import { BACKGROUND, LAYERS } from "./config.js";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec2 uSize;
uniform vec2 uOffset;
uniform float uBreathe;
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uBloom;
uniform vec3 uLavender;
uniform vec3 uGrid;
uniform float uGridSize;
uniform float uGridOpacity;
uniform float uNoise;
uniform float uEdgeFade;
varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec3 color = mix(uBottom, uTop, vUv.y);

    /* Same bloom the page paints in body::before: a wide white ellipse a third
       of the way down, which is what keeps the middle of the hero bright
       enough for the glass to have something to bend. It drifts and swells a
       little on its own (uBreathe) so an untouched hero still moves. */
    vec2 bloomAt = vec2(0.5 + uBreathe * 0.045, 0.68 - uBreathe * 0.03);
    vec2 bloomSize = vec2(0.62, 0.52) * (1.0 + uBreathe * 0.06);
    float bloom = 1.0 - smoothstep(0.0, 1.0, length((vUv - bloomAt) / bloomSize));
    color = mix(color, uBloom, bloom * 0.85);

    /* Lavender pooling in the bottom corners, as on the page. */
    float leftPool = 1.0 - smoothstep(0.0, 1.0, length((vUv - vec2(0.04, 0.0)) / vec2(0.45, 0.6)));
    float rightPool = 1.0 - smoothstep(0.0, 1.0, length((vUv - vec2(0.96, 0.05)) / vec2(0.42, 0.55)));
    color = mix(color, uLavender, max(leftPool, rightPool) * 0.5);

    /* Screen-space grid. The derivative keeps the line a pixel wide however
       the plane is scaled, so it neither aliases into moiré on a large canvas
       nor thickens into a lattice on a small one. */
    vec2 cell = (vUv * uSize + uOffset) / uGridSize;
    vec2 distanceToLine = abs(fract(cell - 0.5) - 0.5) / fwidth(cell);
    float line = 1.0 - min(min(distanceToLine.x, distanceToLine.y), 1.0);
    color = mix(color, uGrid, line * uGridOpacity);

    /* Breaks up the banding the wide gradients would otherwise show. */
    color += (hash(floor(vUv * uSize)) - 0.5) * uNoise;

    float alpha = 1.0;
    if (uEdgeFade > 0.0) {
        vec2 fade = smoothstep(vec2(0.0), vec2(uEdgeFade), vUv)
                  * smoothstep(vec2(0.0), vec2(uEdgeFade), 1.0 - vUv);
        alpha = fade.x * fade.y;
    }

    gl_FragColor = vec4(color, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    /* After the colour space conversion, not before: the canvas is a
       premultiplied surface, so what has to be scaled by alpha is the value
       actually written out. Without this the fade to transparent at the edges
       comes back as a white halo. */
    #include <premultiplied_alpha_fragment>
}
`;

const createMaterial = (shared, { edgeFade, blended, offset }) => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    /* Never `transparent: true`, for both copies. That flag is what three uses
       to decide an object is not worth putting in the transmission target, and
       it also drops the object into the transparent pass — which runs after
       everything else and would repaint this plane straight over the stickers.
       CustomBlending (whose defaults are NormalBlending) gets the alpha
       blending without either consequence; see stickers.js. */
    transparent: false,
    blending: blended ? THREE.CustomBlending : THREE.NormalBlending,
    /* Premultiplied source, to match the canvas the frame is composited into.
       CustomBlending is also the only way to say so: three rewrites
       NormalBlending to NoBlending whenever `transparent` is false. */
    premultipliedAlpha: true,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    depthWrite: !blended,
    /* Authored to match the CSS behind the canvas. Running it through ACES
       would shift it off the page's colour and put a visible seam where the
       plane fades out. (Moot for the backdrop copy: three disables tone
       mapping while rendering into a render target regardless.) */
    toneMapped: false,
    uniforms: {
        ...shared,
        uOffset: offset,
        uEdgeFade: { value: edgeFade },
    },
});

export const createBackground = () => {
    /* One set of uniform objects behind both materials, so a resize or a
       pointer move only has to be written once and the two can never drift. */
    const shared = {
        uSize: { value: new THREE.Vector2(1, 1) },
        uBreathe: { value: 0 },
        uTop: { value: new THREE.Color(BACKGROUND.top) },
        uBottom: { value: new THREE.Color(BACKGROUND.bottom) },
        uBloom: { value: new THREE.Color(BACKGROUND.bloom) },
        uLavender: { value: new THREE.Color(BACKGROUND.lavender) },
        uGrid: { value: new THREE.Color(BACKGROUND.grid) },
        uGridSize: { value: BACKGROUND.gridSize },
        uGridOpacity: { value: BACKGROUND.gridOpacity },
        uNoise: { value: BACKGROUND.noise },
    };

    const geometry = new THREE.PlaneGeometry(1, 1);

    /* The grid offset is the one uniform the two copies do NOT share.
       · visible — locked to the page's CSS grid by stage.js and then left
         alone. It is the same lattice the band below the canvas draws, and a
         grid that drifted could not stay aligned with a grid that does not.
       · backdrop — keeps the drift and the pointer parallax. This copy is only
         ever seen through the lettering, where it is displaced and magnified
         beyond any relation to the page anyway, so it is free to move: it is
         what keeps the refraction from being the same picture twice. */
    const alignOffset = { value: new THREE.Vector2(0, 0) };
    const driftOffset = { value: new THREE.Vector2(0, 0) };

    const material = createMaterial(shared, {
        edgeFade: BACKGROUND.edgeFade,
        blended: true,
        offset: alignOffset,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = LAYERS.background;
    mesh.frustumCulled = false;
    /* Both planes draw before anything else, and the faded one over the solid
       one. Everything in the scene is in the opaque pass now, so this ordering
       is the only thing keeping the backdrop from erasing the stickers. */
    mesh.renderOrder = -1;

    const backdropMaterial = createMaterial(shared, {
        edgeFade: 0,
        blended: false,
        offset: driftOffset,
    });
    const backdrop = new THREE.Mesh(geometry, backdropMaterial);
    backdrop.position.z = LAYERS.backdrop;
    backdrop.frustumCulled = false;
    backdrop.renderOrder = -2;
    /* The one trick in this file. Being opaque is what gets the backdrop into
       the transmission pass; drawing colour only when there is a render target
       bound is what keeps it out of the visible frame, where the faded copy
       above belongs. onBeforeRender runs before the renderer reads colorWrite
       for the draw, so flipping it here is enough. */
    backdrop.onBeforeRender = (renderer) => {
        backdropMaterial.colorWrite = renderer.getRenderTarget() !== null;
    };

    const setSize = (width, height) => {
        mesh.scale.set(width, height, 1);
        backdrop.scale.set(width, height, 1);
        shared.uSize.value.set(width, height);
    };

    /* Parallax against the stickers, which move the other way, plus a slow
       drift of its own — enough that the refracted grid is never twice the
       same, whether or not there is a cursor on the page. Applies to the
       refracted copy only; see the note by the two offsets above. The bloom is
       shared, so both still breathe together. */
    const setMotion = (x, y, time) => {
        const drift = BACKGROUND.driftAmplitude;
        const w = (Math.PI * 2) / BACKGROUND.driftPeriod;
        driftOffset.value.set(
            x * BACKGROUND.parallax + Math.sin(time * w) * drift,
            y * BACKGROUND.parallax + Math.cos(time * w * 0.73) * drift
        );
        shared.uBreathe.value = Math.sin(time * ((Math.PI * 2) / BACKGROUND.bloomPeriod));
    };

    /* Shifts the visible grid so its lines fall on the page grid's. Pixels, in
       the plane's own space: x from the canvas's left edge, y from its bottom
       (PlaneGeometry uv runs bottom-up). Called on resize by stage.js, which is
       where both boxes are known. */
    const setGridAlign = (x, y) => {
        alignOffset.value.set(x, y);
    };

    const dispose = () => {
        geometry.dispose();
        material.dispose();
        backdropMaterial.dispose();
    };

    return { mesh, backdrop, material, setSize, setMotion, setGridAlign, dispose };
};
