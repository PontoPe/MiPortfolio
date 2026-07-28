/**
 * 3D "Welcome" lettering for the home hero.
 *
 * The model is 3d/Welcome.glb, sculpted by hand in Nomad. It carries no
 * material worth keeping — Nomad exports a plain opaque PBR material and no
 * normals at all — so everything that makes it read as glass is set up here:
 * smooth normals, a transmissive physical material, and a studio environment
 * baked into a canvas for it to reflect. No textures are involved.
 *
 * The canvas background stays transparent and the material is partly
 * transmissive, so the page underneath — including the backdrop-filter
 * refraction layer masked to the lettering — shows through the glass while the
 * highlights and reflections composite on top. Until the model has loaded, and
 * for good if WebGL2 or the file is unavailable, the original <img> stays.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "3d/Welcome.glb";
/* World width the lettering is scaled to; the camera frames the same span, so
   the number itself only sets the scale that thickness and lighting work in. */
const WORLD_WIDTH = 6;
/* A hair of slack so the outer wall of the tube is not clipped at the edges. */
const FIT_WIDTH = WORLD_WIDTH * 1.015;

const host = document.querySelector(".hero-welcome");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const supportsWebGL2 = () => {
    try {
        return Boolean(document.createElement("canvas").getContext("webgl2"));
    } catch (error) {
        return false;
    }
};

/**
 * Studio lighting baked into an equirectangular canvas: a bright ceiling for
 * the long highlight that runs along the top of each stroke, cooling to
 * periwinkle at the floor to match the page palette.
 */
const createEnvironmentTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;

    /* The contrast between ceiling and floor is what gives the tube its
       roundness — a flat environment renders the glass as a pale silhouette. */
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0.0, "#ffffff");
    sky.addColorStop(0.26, "#ffffff");
    sky.addColorStop(0.46, "#dfe8fb");
    sky.addColorStop(0.6, "#a8bce2");
    sky.addColorStop(0.82, "#7d92c4");
    sky.addColorStop(1.0, "#677cb0");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const blob = (x, y, rx, ry, color) => {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, rx);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        ctx.translate(-x, -y);
        ctx.fillStyle = gradient;
        ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
        ctx.restore();
    };

    /* Broad softbox for the long highlight down the top of each stroke, plus a
       tight one for the hard glint. */
    blob(width * 0.3, height * 0.16, width * 0.3, height * 0.26, "rgba(255, 255, 255, 1)");
    blob(width * 0.34, height * 0.3, width * 0.07, height * 0.05, "rgba(255, 255, 255, 1)");
    blob(width * 0.76, height * 0.24, width * 0.2, height * 0.22, "rgba(244, 248, 255, 0.95)");
    blob(width * 0.06, height * 0.44, width * 0.16, height * 0.26, "rgba(214, 228, 255, 0.6)");

    const texture = new THREE.CanvasTexture(canvas);
    /* Equirectangular sampling reads the canvas top-down, so without this the
       ceiling ends up on the floor and the whole word is lit from below. */
    texture.flipY = false;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const init = (gltf) => {
    const canvas = document.createElement("canvas");
    canvas.className = "hero-welcome-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(22, 3, 0.1, 100);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envSource = createEnvironmentTexture();
    scene.environment = pmrem.fromEquirectangular(envSource).texture;
    envSource.dispose();
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2.2, 3.4, 4.5);
    const rim = new THREE.DirectionalLight(0xd8e3ff, 0.9);
    rim.position.set(3.2, -1.8, 2.2);
    scene.add(key, rim);

    const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.09,
        transmission: 0.35,
        thickness: 1.0,
        ior: 1.5,
        attenuationColor: new THREE.Color(0x9fbde4),
        attenuationDistance: 1.8,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        iridescence: 0.25,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [120, 420],
        specularIntensity: 1,
        envMapIntensity: 1.6,
        transparent: true,
        depthWrite: false,
    });
    /* Fills the depth buffer before the glass is drawn, so only the nearest
       surface survives. Without it the far wall of the tube, and every stroke
       hidden behind a crossing, blend through the front of the glass. */
    const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true });

    const model = gltf.scene;
    const meshes = [];
    model.traverse((object) => {
        if (object.isMesh) {
            meshes.push(object);
        }
    });
    meshes.forEach((mesh) => {
        /* Nomad exports positions only. glTF says a client must derive normals
           itself in that case, and three.js leaves the mesh unlit instead. */
        if (!mesh.geometry.attributes.normal) {
            mesh.geometry.computeVertexNormals();
        }
        mesh.material.dispose();
        mesh.material = glass;

        const prepass = new THREE.Mesh(mesh.geometry, depthOnly);
        prepass.renderOrder = -1;
        mesh.parent.add(prepass);
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    model.position.sub(bounds.getCenter(new THREE.Vector3()));

    /* The model is centred inside its own group so scaling it stays centred. */
    const holder = new THREE.Group();
    holder.scale.setScalar(WORLD_WIDTH / size.x);
    holder.add(model);

    const pivot = new THREE.Group();
    pivot.add(holder);
    scene.add(pivot);

    const resize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) {
            return;
        }
        /* The canvas bleeds past the lettering's box by however much the CSS
           says; framing that same ratio of extra world width puts the word back
           at exactly the width the PNG had. */
        const bleed = host.clientWidth ? width / host.clientWidth : 1;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 640 ? 1.75 : 2));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = (FIT_WIDTH * bleed / 2)
            / (camera.aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
        camera.updateProjectionMatrix();
    };

    let pointerX = 0;
    let pointerY = 0;
    let tiltX = 0;
    let tiltY = 0;

    window.addEventListener("pointermove", (event) => {
        pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    let visible = true;
    let frame = 0;

    const render = () => {
        const time = clock.getElapsedTime();
        if (reduceMotion.matches) {
            pivot.rotation.set(0, 0, 0);
        } else {
            const targetY = pointerX * 0.16 + Math.sin(time * 0.32) * 0.022;
            const targetX = pointerY * 0.09 + Math.sin(time * 0.24 + 1.1) * 0.014;
            tiltY += (targetY - tiltY) * 0.05;
            tiltX += (targetX - tiltX) * 0.05;
            pivot.rotation.y = tiltY;
            pivot.rotation.x = tiltX;
        }
        renderer.render(scene, camera);
    };

    const loop = () => {
        frame = window.requestAnimationFrame(loop);
        render();
    };

    const start = () => {
        if (!frame) {
            clock.getDelta();
            loop();
        }
    };

    const stop = () => {
        if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
        }
    };

    /* Everything that can fail has run by now, so it is safe to hand the hero
       over to the canvas — and it has to happen before the first resize, since
       the canvas has no box until this class reveals it. */
    host.classList.add("is-3d");

    const relayout = () => {
        resize();
        if (!frame) {
            render();
        }
    };

    resize();
    /* One frame up front, so the lettering is there even if the loop never
       starts — a background tab, or reduced motion. */
    render();
    window.addEventListener("resize", relayout);
    /* The still in the flow behind the canvas is what gives it its height. */
    const layoutImage = host.querySelector("img");
    if (layoutImage && !layoutImage.complete) {
        layoutImage.addEventListener("load", relayout, { once: true });
        layoutImage.addEventListener("error", relayout, { once: true });
    }

    /* Reduced motion gets a still frame; everything else animates, but only
       while the hero is actually on screen and the tab is in front. */
    const sync = () => {
        if (reduceMotion.matches) {
            stop();
            render();
        } else if (visible && !document.hidden) {
            start();
        } else {
            stop();
        }
    };

    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        sync();
    }).observe(host);
    document.addEventListener("visibilitychange", sync);
    reduceMotion.addEventListener("change", sync);
    sync();
};

if (host && supportsWebGL2()) {
    new GLTFLoader().load(MODEL_URL, init, undefined, (error) => {
        console.warn(`Welcome lettering: ${MODEL_URL} failed to load, keeping the still.`, error);
    });
}
