(function () {
    const data = window.portfolioData;

    if (!data) {
        return;
    }

    const sectionTitles = {
        brief: "Brief",
        process: "Process",
        outcome: "Outcome",
        gallery: "Gallery"
    };

    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const allProjects = data.categories.flatMap((category) =>
        category.projects.map((project) => ({
            ...project,
            categoryId: category.id,
            categoryLabel: category.displayLabel || category.label,
            categoryPage: category.page
        }))
    );

    const findCategory = (categoryId) => data.categories.find((category) => category.id === categoryId);
    const projectHref = (project) => `project.html?project=${encodeURIComponent(project.slug)}`;

    const hasContent = (content) => {
        if (Array.isArray(content)) {
            return content.some(hasContent);
        }

        if (content && typeof content === "object") {
            return Object.values(content).some(hasContent);
        }

        return String(content ?? "").trim().length > 0;
    };

    const renderThumbnail = (project) => {
        const thumbnail = project.thumbnail || {};
        const alt = escapeHtml(thumbnail.alt || `${project.title} project preview`);

        if (thumbnail.type === "image" && thumbnail.src) {
            return `<img alt="${alt}" class="project-visual w-full h-full object-cover" src="${escapeHtml(thumbnail.src)}"/>`;
        }

        return thumbnail.html || "";
    };

    const renderProjectCard = (project, headingTag = "h3") => {
        const safeHeading = headingTag === "h2" ? "h2" : "h3";
        const href = projectHref(project);
        const subcats = (project.subcategories || []).join("|");

        return `
            <article class="project-card group cursor-pointer" data-subcats="${escapeHtml(subcats)}">
                <a class="block" href="${href}" aria-label="Open ${escapeHtml(project.title)} project">
                    <div class="project-frame relative aspect-square overflow-hidden rounded-[2rem] bg-white/25">
                        ${renderThumbnail(project)}
                    </div>
                </a>
                <div class="mt-6">
                    <p class="text-primary text-xs font-bold mb-1">${escapeHtml(project.cardMeta)}</p>
                    <div class="project-card-row flex justify-between items-start gap-6">
                        <${safeHeading} class="font-headline text-2xl font-bold text-on-surface">${escapeHtml(project.title)}</${safeHeading}>
                        <a class="project-arrow bg-surface-container-highest hover:bg-primary hover:text-[#FAF9FF] group-hover:bg-primary group-hover:text-[#FAF9FF] transition-colors" href="${href}" aria-label="Open ${escapeHtml(project.title)} project">
                            <span class="material-symbols-outlined">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </article>
        `;
    };

    const renderFeaturedCarousel = (projects) => {
        const slides = projects
            .map((project) => `<div class="featured-carousel-slide">${renderProjectCard(project, "h3")}</div>`)
            .join("");

        return `
            <div class="featured-carousel" data-featured-carousel>
                <button class="featured-carousel-nav featured-carousel-nav-prev" type="button" data-featured-prev aria-label="Previous projects">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <div class="featured-carousel-track" data-featured-track>
                    ${slides}
                </div>
                <button class="featured-carousel-nav featured-carousel-nav-next" type="button" data-featured-next aria-label="Next projects">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        `;
    };

    document.querySelectorAll("[data-featured-projects]").forEach((container) => {
        const category = findCategory(container.dataset.featuredProjects);
        const projects = category ? category.projects.filter((project) => project.featured) : [];

        if (!projects.length) {
            container.innerHTML = `<p class="text-on-surface-variant">Featured projects are coming soon.</p>`;
            return;
        }

        // Always use the carousel so the card size stays uniform across the home
        // page regardless of how many featured projects a category has. With <4 it
        // simply doesn't overflow, so the nav arrows auto-hide (see updateNav).
        container.classList.remove("landing-project-grid");
        container.innerHTML = renderFeaturedCarousel(projects);
    });

    const initializeFeaturedCarousels = () => {
        document.querySelectorAll("[data-featured-carousel]").forEach((carousel) => {
            const track = carousel.querySelector("[data-featured-track]");
            const previous = carousel.querySelector("[data-featured-prev]");
            const next = carousel.querySelector("[data-featured-next]");

            if (!track) {
                return;
            }

            let ticking = false;

            const updateNav = () => {
                const maxScroll = track.scrollWidth - track.clientWidth - 1;
                const atStart = track.scrollLeft <= 0;
                const atEnd = track.scrollLeft >= maxScroll;
                if (previous) {
                    previous.disabled = atStart;
                }
                if (next) {
                    next.disabled = atEnd;
                }
                carousel.classList.toggle("has-fade-prev", !atStart);
                carousel.classList.toggle("has-fade-next", !atEnd);
                ticking = false;
            };

            const page = () => Math.max(track.clientWidth * 0.9, 1);

            previous?.addEventListener("click", () => track.scrollBy({ left: -page(), behavior: "smooth" }));
            next?.addEventListener("click", () => track.scrollBy({ left: page(), behavior: "smooth" }));
            track.addEventListener("scroll", () => {
                if (!ticking) {
                    window.requestAnimationFrame(updateNav);
                    ticking = true;
                }
            }, { passive: true });
            window.addEventListener("resize", updateNav);

            updateNav();
        });
    };

    initializeFeaturedCarousels();

    const initCategoryFilters = (container, bar) => {
        const cards = Array.from(container.querySelectorAll(".project-card"));
        const buttons = Array.from(bar.querySelectorAll(".category-filter"));

        const apply = (value) => {
            cards.forEach((card) => {
                const cardSubs = (card.dataset.subcats || "").split("|").filter(Boolean);
                card.hidden = !(value === "*" || cardSubs.includes(value));
            });
            buttons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.filter === value));
        };

        buttons.forEach((btn) => btn.addEventListener("click", () => apply(btn.dataset.filter)));
        apply("*");
    };

    document.querySelectorAll("[data-category-projects]").forEach((container) => {
        const category = findCategory(container.dataset.categoryProjects);
        const projects = category ? category.projects : [];

        if (!projects.length) {
            container.innerHTML = `<p class="text-on-surface-variant">Projects are coming soon.</p>`;
            return;
        }

        container.innerHTML = projects.map((project) => renderProjectCard(project, "h2")).join("");

        // Filter pills from the unique subcategories in this category (first-seen order).
        const subcats = [];
        projects.forEach((project) => (project.subcategories || []).forEach((s) => {
            if (s && !subcats.includes(s)) subcats.push(s);
        }));

        if (subcats.length) {
            const bar = document.createElement("div");
            bar.className = "category-filters";
            bar.setAttribute("data-category-filters", "");
            bar.innerHTML = `
                <button class="category-filter" type="button" data-filter="*">All</button>
                ${subcats.map((s) => `<button class="category-filter" type="button" data-filter="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
            `;
            container.parentNode.insertBefore(bar, container);
            initCategoryFilters(container, bar);
        }
    });

    const renderTextSection = (title, paragraphs, options = {}) => {
        const content = Array.isArray(paragraphs) ? paragraphs : [paragraphs];

        if (!hasContent(content)) {
            return "";
        }

        const wideClass = options.wide ? " project-detail-section-wide" : "";

        return `
            <section class="project-detail-section${wideClass}">
                <p class="font-label text-primary font-bold mb-3">${escapeHtml(title)}</p>
                <div class="space-y-4">
                    ${content.map((paragraph) => `<p class="text-on-surface-variant text-lg leading-8">${escapeHtml(paragraph)}</p>`).join("")}
                </div>
            </section>
        `;
    };

    const renderToolTags = (tools) => {
        if (!hasContent(tools)) {
            return "";
        }

        return `
            <div class="flex flex-wrap gap-2 mt-4">
                ${tools.map((tool) => `<span class="rounded-full bg-[#FAF9FF]/40 border border-white/45 px-3 py-1.5 text-xs font-semibold text-on-surface">${escapeHtml(tool)}</span>`).join("")}
            </div>
        `;
    };

    const renderMediaItem = (item, options = {}) => {
        const mediaClass = options.carousel ? "project-media project-media-carousel" : "project-media";
        const caption = item.caption
            ? `<figcaption class="project-media-caption">${escapeHtml(item.caption)}</figcaption>`
            : "";

        if (item.type === "image" && item.src) {
            return `
                <figure class="project-media-card">
                    <img alt="${escapeHtml(item.alt || "Project image")}" class="${mediaClass}" src="${escapeHtml(item.src)}"/>
                    ${caption}
                </figure>
            `;
        }

        if (item.type === "video" && item.src) {
            const poster = item.poster ? ` poster="${escapeHtml(item.poster)}"` : "";
            const mimeType = item.mimeType ? ` type="${escapeHtml(item.mimeType)}"` : "";

            return `
                <figure class="project-media-card">
                    <video class="${mediaClass}" controls playsinline preload="metadata"${poster}>
                        <source src="${escapeHtml(item.src)}"${mimeType}/>
                        Your browser does not support this video.
                    </video>
                    ${caption}
                </figure>
            `;
        }

        if (item.type === "html" && item.html) {
            return `
                <figure class="project-media-card">
                    <div class="${mediaClass} project-media-html">${item.html}</div>
                    ${caption}
                </figure>
            `;
        }

        return "";
    };

    const renderCarouselSection = (items) => {
        if (!hasContent(items)) {
            return "";
        }

        const slides = items.map((item) => `
            <div class="project-carousel-slide">
                ${renderMediaItem(item, { carousel: true })}
            </div>
        `).join("");
        const controls = items.length > 1
            ? `
                <button class="project-carousel-nav project-carousel-nav-prev" type="button" data-carousel-prev aria-label="Previous media">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <button class="project-carousel-nav project-carousel-nav-next" type="button" data-carousel-next aria-label="Next media">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
                <span class="project-carousel-counter-pill" data-carousel-counter>1 / ${items.length}</span>
            `
            : "";

        return `
            <section class="project-detail-section project-detail-section-wide">
                <p class="font-label text-primary font-bold mb-5">Carousel</p>
                <div class="project-carousel" data-carousel>
                    <div class="project-carousel-track" data-carousel-track>
                        ${slides}
                    </div>
                    ${controls}
                </div>
            </section>
        `;
    };

    const renderGallerySection = (items) => {
        if (!hasContent(items)) {
            return "";
        }

        const galleryItems = items.map((item) => renderMediaItem(item)).join("");

        return `
            <section class="project-detail-section project-detail-section-wide">
                <p class="font-label text-primary font-bold mb-5">Gallery</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    ${galleryItems}
                </div>
            </section>
        `;
    };

    const wideTextSectionKeys = new Set(["brief", "process", "outcome"]);

    const renderProjectSection = (key, content) => {
        if (key === "gallery") {
            return renderGallerySection(content);
        }

        if (key === "carousel") {
            return renderCarouselSection(content);
        }

        return renderTextSection(sectionTitles[key] || key, content, { wide: wideTextSectionKeys.has(key) });
    };

    const initializeCarousels = () => {
        document.querySelectorAll("[data-carousel]").forEach((carousel) => {
            const track = carousel.querySelector("[data-carousel-track]");
            const slides = Array.from(carousel.querySelectorAll(".project-carousel-slide"));
            const previous = carousel.querySelector("[data-carousel-prev]");
            const next = carousel.querySelector("[data-carousel-next]");
            const counter = carousel.querySelector("[data-carousel-counter]");
            let currentIndex = 0;
            let ticking = false;

            const updateCounter = () => {
                if (counter) {
                    counter.textContent = `${currentIndex + 1} / ${slides.length}`;
                }

                if (previous) {
                    previous.disabled = currentIndex === 0;
                }

                if (next) {
                    next.disabled = currentIndex === slides.length - 1;
                }
            };

            const goToSlide = (index) => {
                const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
                slides[nextIndex]?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
            };

            const syncFromScroll = () => {
                if (!track) {
                    return;
                }

                const trackLeft = track.getBoundingClientRect().left;
                currentIndex = slides.reduce((closestIndex, slide, index) => {
                    const closestDistance = Math.abs(slides[closestIndex].getBoundingClientRect().left - trackLeft);
                    const slideDistance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
                    return slideDistance < closestDistance ? index : closestIndex;
                }, currentIndex);
                updateCounter();
                ticking = false;
            };

            carousel.querySelectorAll("video").forEach((video) => {
                video.addEventListener("click", () => {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            });

            previous?.addEventListener("click", () => goToSlide(currentIndex - 1));
            next?.addEventListener("click", () => goToSlide(currentIndex + 1));
            track?.addEventListener("scroll", () => {
                if (!ticking) {
                    window.requestAnimationFrame(syncFromScroll);
                    ticking = true;
                }
            }, { passive: true });

            updateCounter();
        });
    };

    const renderProjectNav = (project) => {
        const categoryIndex = data.categories.findIndex((category) => category.id === project.categoryId);
        const category = data.categories[categoryIndex];

        if (!category) {
            return "";
        }

        const projectIndex = category.projects.findIndex((item) => item.slug === project.slug);
        const prevProject = category.projects[projectIndex - 1];
        const nextProject = category.projects[projectIndex + 1];

        const prevHtml = prevProject
            ? `
                <a class="project-detail-prev" href="${escapeHtml(projectHref(prevProject))}">
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span class="project-detail-nav-meta">
                        <span class="font-label text-[0.65rem]">previous project</span>
                        <span class="font-headline text-sm font-bold">${escapeHtml(prevProject.title)}</span>
                    </span>
                </a>
            `
            : `<span class="project-detail-nav-spacer"></span>`;

        let nextHtml = "";
        if (nextProject) {
            nextHtml = `
                <a class="project-detail-next" href="${escapeHtml(projectHref(nextProject))}">
                    <span class="project-detail-nav-meta">
                        <span class="font-label text-[0.65rem]">next project</span>
                        <span class="font-headline text-sm font-bold">${escapeHtml(nextProject.title)}</span>
                    </span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </a>
            `;
        } else {
            const nextCategory = data.categories[(categoryIndex + 1) % data.categories.length];
            if (nextCategory) {
                const nextLabel = nextCategory.displayLabel || nextCategory.label;
                nextHtml = `
                    <a class="project-detail-next" href="${escapeHtml(nextCategory.page)}">
                        <span class="project-detail-nav-meta">
                            <span class="font-label text-[0.65rem]">next category</span>
                            <span class="font-headline text-sm font-bold">${escapeHtml(nextLabel)}</span>
                        </span>
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </a>
                `;
            } else {
                nextHtml = `<span class="project-detail-nav-spacer"></span>`;
            }
        }

        if (!prevProject && !nextProject) {
            return "";
        }

        return `
            <section class="project-detail-section-wide project-detail-nav-bare">
                <div class="project-detail-nav-row">
                    ${prevHtml}
                    ${nextHtml}
                </div>
            </section>
        `;
    };

    const renderProjectDetail = () => {
        const root = document.querySelector("[data-project-detail]");

        if (!root) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const slug = params.get("project") || params.get("slug");
        const project = allProjects.find((item) => item.slug === slug);

        if (!project) {
            document.title = "Project not found | Mimizo";
            root.innerHTML = `
                <section class="glass-card rounded-[2.5rem] p-8 md:p-16">
                    <p class="font-label text-primary font-bold mb-4">project</p>
                    <h1 class="font-headline text-5xl md:text-7xl font-bold leading-tight mb-6">Project not found.</h1>
                    <p class="text-on-surface-variant text-lg leading-8 mb-8">The project link does not match anything in the portfolio data yet.</p>
                    <a class="inline-flex items-center gap-3 bg-primary text-[#FAF9FF] px-8 py-4 rounded-full font-semibold shadow-xl shadow-primary/20" href="index.html">
                        Back home
                        <span class="material-symbols-outlined">arrow_back</span>
                    </a>
                </section>
            `;
            return;
        }

        document.title = `${project.title} | Mimizo`;

        const media = project.media || {};
        const projectSections = project.sections || {};
        const carouselItems = [
            ...(media.carousel || []),
            ...(projectSections.carousel || [])
        ];

        // Fixed order: Brief -> Process -> Carousel -> Outcome. (Tools moved under the thumbnail; gallery removed.)
        const sections = [
            renderProjectSection("brief", projectSections.brief),
            renderProjectSection("process", projectSections.process),
            renderCarouselSection(carouselItems),
            renderProjectSection("outcome", projectSections.outcome),
            renderProjectNav(project)
        ].filter(Boolean).join("");

        root.innerHTML = `
            <section class="glass-card rounded-[2.5rem] p-8 md:p-16">
                <a class="font-label text-primary font-bold inline-flex items-center gap-2 mb-10" href="${escapeHtml(project.categoryPage)}">
                    <span class="material-symbols-outlined text-base">arrow_back</span>
                    ${escapeHtml(project.categoryLabel)}
                </a>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-20">
                    <div class="lg:col-span-2">
                        <p class="font-label text-primary font-bold mb-4">${escapeHtml(project.cardMeta)}</p>
                        <h1 class="font-headline text-5xl md:text-7xl font-bold leading-tight mb-6" data-repel>${escapeHtml(project.title)}</h1>
                        <p class="font-label text-primary font-bold mb-3">Overview</p>
                        <p class="text-on-surface-variant text-lg leading-8">${escapeHtml(project.summary)}</p>
                    </div>
                    <div>
                        <div class="project-frame relative aspect-square overflow-hidden rounded-[2rem] bg-white/25 w-full">
                            ${renderThumbnail(project)}
                        </div>
                        ${renderToolTags(project.tools)}
                    </div>
                </div>
                <div class="project-detail-grid">
                    ${sections}
                </div>
                <div class="portfolio-section mt-28 text-center p-12 bg-primary-container/10 rounded-[2rem] border border-primary/5" id="contact">
                    <p class="text-primary font-bold mb-4">Wanna work together?</p>
                    <h2 class="font-headline text-4xl font-bold text-on-surface mb-8" data-repel>Let's build something <br/>extraordinary.</h2>
                    <a class="cta-btn cta-btn-primary" href="mailto:milena.am.caldas@gmail.com">Send a message</a>
                    <a class="cta-btn cta-btn-ghost" href="${escapeHtml(data.cvUrl || "")}" target="_blank" rel="noopener noreferrer">View CV</a>
                </div>
            </section>
        `;

        initializeCarousels();
    };

    renderProjectDetail();
})();
