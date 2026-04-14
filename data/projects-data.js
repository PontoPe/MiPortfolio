// Portfolio TODOs live in ../TODO.md.
// Keep project content, media, visibility, and case-study data editable from this file.

// Put project files in imagesProjects/project-slug/.
// Media supports images and videos:
// media: {
//     carousel: [
//         { type: "image", src: "imagesProjects/lumina-studio/cover.jpg", alt: "Lumina Studio packaging mockup" },
//         { type: "video", src: "imagesProjects/lumina-studio/process.mp4", poster: "imagesProjects/lumina-studio/poster.jpg", caption: "Launch motion test" }
//     ],
//     gallery: [
//         { type: "image", src: "imagesProjects/lumina-studio/detail-01.jpg", alt: "Close view of the visual system" }
//     ]
// }

window.portfolioData = {
    cvUrl: "https://drive.google.com/file/d/14kkeX-nYINI_yYW-FbwWHhMAFweyPZ78/view?usp=sharing",
    categories: [
        {
            id: "design-grafico",
            label: "Design Grafico",
            displayLabel: "Design Gráfico",
            page: "design-grafico.html",
            projects: [
                {
                    slug: "marea-identity",
                    title: "Marea Identity",
                    shortTitle: "Marea",
                    cardMeta: "Brand System • Editorial",
                    featured: true,
                    summary: "A flexible identity system for a coastal editorial brand, built around soft rhythm, airy layouts, and tactile print details.",
                    tools: ["Illustrator", "InDesign", "Figma"],
                    thumbnail: {
                        type: "html",
                        alt: "Abstract pastel brand identity preview for Marea",
                        html: `
                            <div class="project-visual absolute inset-[-6%] bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.72),transparent_28%),linear-gradient(135deg,rgba(255,195,186,0.72),rgba(175,163,249,0.34))]"></div>
                            <div class="project-visual absolute inset-x-10 bottom-12 rounded-[1.5rem] bg-white/30 border border-white/40 p-8 backdrop-blur-md">
                                <p class="font-label text-primary text-sm mb-3">visual identity</p>
                                <p class="font-headline text-4xl font-bold text-on-surface">Marea</p>
                            </div>
                        `
                    },
                    media: {
                        carousel: [
                            {
                                type: "image",
                                src: "imagesProjects/marea-identity/onix.webp",
                                alt: "Marea Identity packaging mockup",
                                caption: "Primeira imagem do carrossel."
                            },
                            {
                                type: "video",
                                src: "imagesProjects/marea-identity/girlboss.mp4",
                                poster: "imagesProjects/marea-identity/video-poster.jpg",
                                caption: "Teste de motion para o lançamento."
                            }],
                        gallery: [
                            {
                                type: "image",
                                src: "imagesProjects/marea-identity/detail-01.jpg",
                                alt: "Detalhe do sistema visual da Marea Identity"
                            },
                            {
                                type: "image",
                                src: "imagesProjects/marea-identity/detail-02.jpg",
                                alt: "Detalhe do sistema visual da Marea Identity 2"
                            }]
                    },
                    sections: {
                        brief: [
                            "Create a visual identity that could feel editorial, calm, and memorable across print pieces, launch posts, and brand stationery."
                        ],
                        process: [
                            "The system starts with soft contrast, generous spacing, and a graphic rhythm inspired by tides and collected paper objects.",
                            "Type, color, and layout rules were kept simple so the brand could move quickly without losing its tone."
                        ],
                        outcome: [
                            "A reusable identity kit with launch-ready art direction, cover layouts, social templates, and a clear visual voice."
                        ]
                    }
                },
                {
                    slug: "lumina-studio",
                    title: "Lumina Studio",
                    shortTitle: "Lumina",
                    cardMeta: "Packaging • Campaign",
                    featured: true,
                    summary: "A soft campaign and packaging direction for a small creative studio with a glossy, light-first visual language.",
                    tools: [],
                    thumbnail: {
                        type: "image",
                        alt: "Brand identity project with stationery and elegant pastel layout",
                        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNQKaVvwtPmGJXP-cbtMvO0upWg7fuiEdAwtpXYYyOt6X6Kp7_OshdG2gqwWQBHP_GbY_RGQj-6E9wrfaKyViS3EwsjV85k1edMMOu18P-HttU7l_Wdbb6MUwuTNClGe5_OwKpQJGmJjPWMsMptkwgkl6hubOJWt6_gCqWifnS6gVopKzyMr3Fq8fYlbrbpURFvAJdjv97EHFWM4TAF_Opa7rrjuwST9KDKP2RFbnv21_N0QM8yb5DL5_L59xNthjW9-kk7DMfx2_U"
                    },
                    media: {
                        carousel: [],
                        gallery: []
                    },
                    sections: {
                        brief: [
                            "Shape a visual direction that makes the studio feel luminous, approachable, and polished without becoming too formal."
                        ],
                        process: [
                            "The first pass focused on atmosphere: transparent surfaces, restrained contrast, and small moments of brightness that could scale from packaging to social posts."
                        ],
                        outcome: []
                    }
                }
            ]
        },
        {
            id: "ux-ui",
            label: "UX/UI",
            displayLabel: "UX/UI",
            page: "ux-ui.html",
            projects: [
                {
                    slug: "ecoflow-experience",
                    title: "EcoFlow Experience",
                    shortTitle: "EcoFlow",
                    cardMeta: "Mobile App • UX Flow",
                    featured: true,
                    summary: "A mobile app flow designed to make sustainable habits feel visible, achievable, and light to maintain.",
                    tools: ["Figma", "FigJam", "Maze"],
                    thumbnail: {
                        type: "image",
                        alt: "Mobile app interface project with soft colors and clean typography",
                        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCglzDGmX90BANGA1QSyA7xQNkBsjgRS645dxah18MDmrDRgAI6A_3_M_liO_9jx9A0YggNot3uBzXFwiJS6nCI97VkxqvgCtzkFpUtSFti47HNo0jiz5xGyKPw9W1esWoBwmUgipYFimE-TO3AC96B-WiAnr-2ajTypzsPvuexJ3USed0S2xkbLECVe4glxoMByQj_UogjPr_SnhaqRkEpP-BcH9cgcep71SUIOGNEAEv0V9HJ4GiKXa-rn98WjEeeD28KoMy920be"
                    },
                    media: {
                        carousel: [],
                        gallery: []
                    },
                    sections: {
                        brief: [
                            "Design an app experience where daily choices feel trackable without feeling like homework."
                        ],
                        process: [
                            "The flow was mapped around quick wins: short onboarding, clear habit cards, and feedback that stays warm instead of judgmental."
                        ],
                        outcome: [
                            "A prototype with a clearer first-run path, recurring action cards, and a calmer visual hierarchy."
                        ]
                    }
                },
                {
                    slug: "pulse-board",
                    title: "Pulse Board",
                    shortTitle: "Pulse",
                    cardMeta: "Dashboard • Product",
                    featured: true,
                    summary: "A dashboard concept that turns scattered product signals into a calm, scannable workspace.",
                    tools: ["Figma", "Notion"],
                    thumbnail: {
                        type: "html",
                        alt: "Pastel dashboard preview for Pulse Board",
                        html: `
                            <div class="project-visual absolute inset-[-6%] bg-[linear-gradient(145deg,rgba(214,201,238,0.72),rgba(255,195,186,0.5))]"></div>
                            <div class="project-visual absolute left-8 right-8 top-12 rounded-[1.5rem] bg-white/36 border border-white/40 p-6 backdrop-blur-md">
                                <div class="h-3 w-24 rounded-full bg-primary/35 mb-6"></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="aspect-square rounded-2xl bg-white/45"></div>
                                    <div class="aspect-square rounded-2xl bg-primary/25"></div>
                                    <div class="aspect-square rounded-2xl bg-secondary-fixed/55"></div>
                                    <div class="aspect-square rounded-2xl bg-white/35"></div>
                                </div>
                            </div>
                        `
                    },
                    media: {
                        carousel: [],
                        gallery: []
                    },
                    sections: {
                        brief: [
                            "Make a product dashboard feel quicker to read by reducing visual noise and grouping decisions by urgency."
                        ],
                        process: [
                            "Cards were organized around scanning behavior: status, next action, and context stay close together."
                        ],
                        outcome: [
                            "A compact dashboard direction with clearer prioritization and reusable product-card patterns."
                        ]
                    }
                }
            ]
        },
        {
            id: "ilustracao",
            label: "Ilustracao",
            displayLabel: "Ilustração",
            page: "ilustracao.html",
            projects: [
                {
                    slug: "tiny-stories",
                    title: "Tiny Stories",
                    shortTitle: "Tiny Stories",
                    cardMeta: "Illustration • Narrative",
                    featured: true,
                    summary: "A small illustration series about quiet narrative moments, paper textures, and gentle character details.",
                    tools: ["Procreate", "Photoshop"],
                    thumbnail: {
                        type: "html",
                        alt: "Open book illustration preview",
                        html: `
                            <div class="project-visual absolute inset-[-6%] bg-[linear-gradient(135deg,rgba(255,238,226,0.78),rgba(214,201,238,0.58))]"></div>
                            <img alt="Open book illustration" class="project-visual-centered absolute left-1/2 top-1/2 w-3/4 -translate-x-1/2 -translate-y-1/2 opacity-70" src="assets/ui/book.png"/>
                        `
                    },
                    media: {
                        carousel: [
                            {
                                type: "image",
                                src: "assets/ui/book.png",
                                alt: "Open book illustration detail",
                                caption: "Narrative detail used as the first image in the project carousel."
                            }
                        ],
                        gallery: []
                    },
                    sections: {
                        brief: [
                            "Build an illustration mood that could carry emotion with only a few objects and soft gestures."
                        ],
                        process: [
                            "The image language leans on round silhouettes, paper-like softness, and just enough imperfection to feel made by hand."
                        ],
                        outcome: [
                            "A flexible narrative illustration direction that can expand into editorial spots, stickers, and small printed pieces."
                        ]
                    }
                },
                {
                    slug: "paper-voyage",
                    title: "Paper Voyage",
                    shortTitle: "Paper Voyage",
                    cardMeta: "Character • Print",
                    featured: true,
                    summary: "A playful print illustration built around a tiny ship, soft scale shifts, and storybook energy.",
                    tools: ["Illustrator", "Procreate"],
                    thumbnail: {
                        type: "html",
                        alt: "Ship illustration preview",
                        html: `
                            <div class="project-visual absolute inset-[-6%] bg-[radial-gradient(circle_at_48%_34%,rgba(255,255,255,0.68),transparent_25%),linear-gradient(145deg,rgba(175,163,249,0.58),rgba(253,177,165,0.48))]"></div>
                            <img alt="Ship illustration" class="project-visual-centered absolute left-1/2 top-1/2 w-2/5 -translate-x-1/2 -translate-y-1/2 opacity-65" src="assets/ui/ship.svg"/>
                        `
                    },
                    media: {
                        carousel: [],
                        gallery: [
                            {
                                type: "image",
                                src: "assets/ui/ship.svg",
                                alt: "Ship illustration detail",
                                caption: "A reusable illustration element shown through the gallery renderer."
                            }
                        ]
                    },
                    sections: {
                        brief: [
                            "Create a character-led print moment that feels light, curious, and easy to adapt across small formats."
                        ],
                        process: [
                            "The composition uses simple scale play and generous empty space so the ship can feel expressive without heavy detail."
                        ],
                        outcome: [
                            "A polished illustration direction for print, stickers, and portfolio storytelling details."
                        ]
                    }
                }
            ]
        }
    ]
};
