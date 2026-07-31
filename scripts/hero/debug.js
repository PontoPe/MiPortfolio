/**
 * Live controls for the hero, loaded only when the page is opened with ?glass.
 *
 * The numbers in config.js are the kind that cannot be reasoned to — thickness
 * and absorption distance are in pixels, and dispersion only shows up in a
 * narrow band of them. Dragging a slider and watching the fringes appear takes
 * a minute; guessing takes an afternoon. Nothing here ships to a visitor: the
 * import is behind a query-string check in index.js.
 */
import GUI from "https://cdn.jsdelivr.net/npm/lil-gui@0.19.2/dist/lil-gui.esm.js";
import { BACKGROUND, GLASS, POINTER } from "./config.js";

export const attachDebugUI = (hero) => {
    const gui = new GUI({ title: "welcome glass" });
    const { material } = hero.glass;
    /* Shared with the opaque backdrop copy, so a change shows up both on the
       page and inside the glass. */
    const uniforms = hero.background.material.uniforms;

    /* Both ratios are turned into material values once, at fit time, so they
       need the word re-fitted to take effect. */
    const refit = () => hero.glass.setWidth(hero.getFitWidth());

    const glass = gui.addFolder("glass");
    /* Size, not fit: this one goes through resize() because the fitted width is
       computed there and everything else keys off it. */
    glass.add(GLASS, "widthScale", 0.4, 2, 0.01).name("size")
        .onChange(() => hero.relayout());
    glass.add(GLASS, "thicknessRatio", 0, 0.4, 0.001).onChange(refit);
    glass.add(GLASS, "attenuationDistanceRatio", 0.02, 1, 0.005).onChange(refit);
    glass.addColor(GLASS, "attenuationColor").onChange((value) => {
        material.attenuationColor.setHex(value);
    });
    glass.add(material, "dispersion", 0, 60, 0.5);
    glass.add(material, "ior", 1, 2.333, 0.01);
    glass.add(material, "roughness", 0, 0.5, 0.005);
    glass.add(material, "clearcoat", 0, 1, 0.01);
    glass.add(material, "clearcoatRoughness", 0, 0.5, 0.005);
    glass.add(material, "envMapIntensity", 0, 3, 0.05);

    const scene = gui.addFolder("scene");
    scene.add(hero.stage.renderer, "toneMappingExposure", 0.4, 2, 0.01).name("exposure");
    if ("transmissionResolutionScale" in hero.stage.renderer) {
        scene.add(hero.stage.renderer, "transmissionResolutionScale", 0.25, 1, 0.05)
            .name("transmission res");
    }
    scene.add(uniforms.uGridSize, "value", 12, 160, 1).name("grid size");
    scene.add(uniforms.uGridOpacity, "value", 0, 0.3, 0.005).name("grid opacity");
    scene.add(uniforms.uEdgeFade, "value", 0, 0.4, 0.005).name("edge fade");

    const motion = gui.addFolder("motion");
    motion.add(POINTER.tilt, "x", 0, 0.4, 0.005).name("tilt x");
    motion.add(POINTER.tilt, "y", 0, 0.4, 0.005).name("tilt y");
    motion.add(POINTER.float, "amplitude", 0, 40, 0.5).name("float y");
    motion.add(POINTER.float, "sway", 0, 60, 0.5).name("float x");
    motion.add(BACKGROUND, "parallax", 0, 80, 1).name("grid parallax");

    /* So the panel is useful on a hero that is parked with the loop stopped. */
    gui.onChange(() => hero.redraw());

    return gui;
};
