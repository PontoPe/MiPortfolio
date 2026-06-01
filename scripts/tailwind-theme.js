// Shared Tailwind (Play CDN) theme. Must load AFTER the CDN script so the
// config is registered correctly — setting window.tailwind BEFORE the script
// gets overwritten and silently dropped.
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "tertiary-fixed-dim": "#d6c9ee",
                "on-tertiary-fixed": "#403755",
                "on-background": "#1A1B20",
                "on-secondary-fixed-variant": "#794138",
                "error": "#b41340",
                "on-error": "#ffefef",
                "on-tertiary-fixed-variant": "#5d5372",
                "on-primary-fixed": "#120050",
                "surface-container-lowest": "#FAF9FF",
                "tertiary-dim": "#544b6a",
                "on-primary-container": "#2d206f",
                "primary-fixed": "#afa3f9",
                "surface-variant": "#dcdce4",
                "on-primary-fixed-variant": "#362a78",
                "on-tertiary": "#f8f0ff",
                "inverse-on-surface": "#9c9ca2",
                "tertiary-container": "#e4d7fd",
                "outline": "#76767c",
                "on-secondary-container": "#6e3830",
                "inverse-surface": "#0d0e12",
                "primary": "#5b509f",
                "secondary-fixed-dim": "#fdb1a5",
                "on-secondary-fixed": "#57251e",
                "secondary-container": "#ffc3ba",
                "surface-container-highest": "#dcdce4",
                "primary-container": "#afa3f9",
                "surface-dim": "#d3d4dc",
                "on-surface-variant": "#5a5b60",
                "tertiary-fixed": "#e4d7fd",
                "surface-container": "#e8e7ee",
                "primary-fixed-dim": "#a196eb",
                "surface-tint": "#5b509f",
                "surface-container-low": "#f1f0f7",
                "on-primary": "#FAF9FF",
                "secondary-fixed": "#ffc3ba",
                "secondary-dim": "#784037",
                "error-dim": "#a70138",
                "surface-container-high": "#e2e2e9",
                "primary-dim": "#4f4493",
                "on-surface": "#1A1B20",
                "inverse-primary": "#afa3f9",
                "background": "#f7f6fc",
                "surface-bright": "#f7f6fc",
                "error-container": "#f74b6d",
                "surface": "#f7f6fc",
                "on-error-container": "#510017",
                "on-tertiary-container": "#534968",
                "tertiary": "#605676",
                "outline-variant": "#adadb2",
                "secondary": "#864b42",
                "on-secondary": "#ffefed"
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            fontFamily: {
                "headline": ["Poppins", "sans-serif"],
                "body": ["Poppins", "sans-serif"],
                "label": ["Poppins", "sans-serif"],
                "signature": ["Caveat", "cursive"],
                "marker": ["Kalam", "cursive"]
            }
        }
    }
};
