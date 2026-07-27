// Shared Tailwind (Play CDN) theme. Must load AFTER the CDN script so the
// config is registered correctly — setting window.tailwind BEFORE the script
// gets overwritten and silently dropped.
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "tertiary-fixed-dim": "#c5e2f2",
                "on-tertiary-fixed": "#2f4b5c",
                "on-background": "#777c95",
                "on-secondary-fixed-variant": "#8c3f74",
                "error": "#b41340",
                "on-error": "#ffefef",
                "on-tertiary-fixed-variant": "#41637a",
                "on-primary-fixed": "#252c4d",
                "surface-container-lowest": "#ffffff",
                "tertiary-dim": "#5f93b5",
                "on-primary-container": "#3c4467",
                "primary-fixed": "#c3ccf4",
                "surface-variant": "#e2e5f2",
                "on-primary-fixed-variant": "#4a5486",
                "on-tertiary": "#ffffff",
                "inverse-on-surface": "#f2f3fa",
                "tertiary-container": "#d9edf9",
                "outline": "#9ba0b3",
                "on-secondary-container": "#6d3159",
                "inverse-surface": "#2f3038",
                "primary": "#8b9ae3",
                "secondary-fixed-dim": "#f3bede",
                "on-secondary-fixed": "#5c2a4b",
                "secondary-container": "#f6d9ee",
                "surface-container-highest": "#d9def0",
                "primary-container": "#dae2ff",
                "surface-dim": "#d5d9ea",
                "on-surface-variant": "#9ca0b2",
                "tertiary-fixed": "#d9edf9",
                "surface-container": "#e7eaf6",
                "primary-fixed-dim": "#a6b2ec",
                "surface-tint": "#8290dc",
                "surface-container-low": "#eef0f9",
                "on-primary": "#ffffff",
                "secondary-fixed": "#f6d9ee",
                "secondary-dim": "#c96ea9",
                "error-dim": "#a70138",
                "surface-container-high": "#e0e4f3",
                "primary-dim": "#6b7ace",
                "on-surface": "#777c95",
                "inverse-primary": "#c3ccf4",
                "background": "#f4f5fb",
                "surface-bright": "#f4f5fb",
                "error-container": "#f74b6d",
                "surface": "#f4f5fb",
                "on-error-container": "#510017",
                "on-tertiary-container": "#33566b",
                "tertiary": "#7ec3ea",
                "outline-variant": "#c9cede",
                "secondary": "#e293cf",
                "on-secondary": "#ffffff"
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
