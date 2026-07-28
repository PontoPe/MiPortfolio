/**
 * Renderer, camera and environment for the hero.
 *
 * The camera is orthographic with its frustum set to the canvas in CSS pixels,
 * so one world unit is one pixel and everything downstream — sticker
 * placement, the width the lettering is fitted to, how far the pointer pushes
 * things — is plain pixel arithmetic against the DOM box. The cost is that the
 * material values have to be in pixels too; see config.js.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LAYERS, RENDERER } from "./config.js";

export const createStage = (canvas) => {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
    });
    /* The page shows through wherever the scene does not paint, which is what
       lets the background plane fade into it at the edges. */
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = RENDERER.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    /* Added in r171. Guarded so a rollback to an older three degrades to a
       slower scene rather than a broken one. */
    if ("transmissionResolutionScale" in renderer) {
        renderer.transmissionResolutionScale = RENDERER.transmissionResolutionScale;
    }

    const scene = new THREE.Scene();

    /* Frustum is rewritten by setSize before anything renders. */
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
    camera.position.z = LAYERS.camera;

    /* Without an environment the glass is a dead grey silhouette: transmission
       and clearcoat both have nothing to reflect. RoomEnvironment is generated
       in code, so this costs no download. It is deliberately not used as
       scene.background — the background is its own plane at z = -300, because
       only geometry inside the scene can be refracted. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    pmrem.dispose();

    const setSize = (width, height, pixelRatio) => {
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        /* Orthographic cameras keep their frustum in the projection matrix, so
           unlike a perspective camera there is no aspect shortcut — the four
           planes have to be rewritten by hand. */
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
    };

    const dispose = () => {
        environment.dispose();
        renderer.dispose();
    };

    return { renderer, scene, camera, setSize, dispose };
};

export const addLights = (scene, config) => {
    const key = new THREE.DirectionalLight(config.key.color, config.key.intensity);
    key.position.set(...config.key.position);
    const rim = new THREE.DirectionalLight(config.rim.color, config.rim.intensity);
    rim.position.set(...config.rim.position);
    scene.add(key, rim);
    return { key, rim };
};
