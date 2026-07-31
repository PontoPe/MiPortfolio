/**
 * The "Welcome" lettering, in glass (z = 0).
 *
 * assets/3d/Welc-extrude.glb is the script lettering extruded out of
 * Illustrator: a single closed mesh with positions, normals and UVs. Normals
 * are still computed defensively — the Nomad sculpt this replaced shipped
 * without any, and glTF leaves deriving them to the client, which three.js
 * does not do (the surface simply renders unlit). The material that ships in
 * the file (opaque, roughness 0.4) is discarded outright: everything that
 * makes this read as glass is set below.
 *
 * MeshPhysicalMaterial has had `dispersion` since r167, which is the reason
 * this needs no MeshTransmissionMaterial and therefore no drei and no React —
 * the rainbow fringing at the edges is native.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLASS, LAYERS, MODEL_URL } from "./config.js";

export const loadGlass = async () => {
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);

    const material = new THREE.MeshPhysicalMaterial({
        transmission: 1,
        ior: GLASS.ior,
        roughness: GLASS.roughness,
        metalness: 0,
        /* Both set properly by setWidth once the canvas has a size. */
        thickness: 1,
        dispersion: GLASS.dispersion,
        /* Beer-Lambert absorption, not a surface colour — see config.js. */
        attenuationColor: new THREE.Color(GLASS.attenuationColor),
        attenuationDistance: 1000,
        clearcoat: GLASS.clearcoat,
        clearcoatRoughness: GLASS.clearcoatRoughness,
        envMapIntensity: GLASS.envMapIntensity,
    });

    const model = gltf.scene;
    model.traverse((object) => {
        if (!object.isMesh) {
            return;
        }
        if (!object.geometry.attributes.normal) {
            object.geometry.computeVertexNormals();
        }
        /* Frees the material three built from the glTF along with anything it
           referenced; nothing else points at it. */
        object.material.dispose();
        object.material = material;
        /* The tube crosses itself and doubles back constantly. Depth writes
           are what keep only the nearest wall visible — without them the far
           side of every stroke blends through the front. */
        object.material.depthWrite = true;
    });

    /* Centred inside its own group so that scaling it stays centred, and the
       group inside a pivot so the pointer tilt rotates about the middle of the
       word rather than about the origin of the sculpt. */
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    model.position.sub(bounds.getCenter(new THREE.Vector3()));

    const holder = new THREE.Group();
    holder.add(model);

    const pivot = new THREE.Group();
    pivot.position.z = LAYERS.glass;
    pivot.add(holder);

    /**
     * Fit the word to `width` CSS pixels. Thickness and absorption distance
     * are ratios of that width, so the glass looks the same on a 1400px hero
     * as on a 700px one instead of turning into a solid blue slab when the
     * viewport shrinks.
     *
     * The unit conversion is the trap in this whole scene. three multiplies
     * `thickness` by the object's world scale before it walks the refracted
     * ray (getVolumeTransmissionRay in transmission_pars_fragment), so
     * thickness is in LOCAL model units — at the scale needed to blow a 6-unit
     * sculpt up to ~800px, a "thickness" of 66 becomes a 7900px path through
     * the glass and Beer-Lambert absorption renders the word solid black.
     * `attenuationDistance` is the opposite: it is compared against that
     * already-scaled ray length, so it stays in world pixels.
     */
    const setWidth = (width) => {
        const scale = width / size.x;
        holder.scale.setScalar(scale);
        material.thickness = (width * GLASS.thicknessRatio) / scale;
        material.attenuationDistance = width * GLASS.attenuationDistanceRatio;
    };

    const dispose = () => {
        model.traverse((object) => {
            if (object.isMesh) {
                object.geometry.dispose();
            }
        });
        material.dispose();
    };

    return { pivot, holder, material, setWidth, dispose };
};
