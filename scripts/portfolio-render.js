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

        return `
            <article class="project-card group cursor-pointer">
                <a class="block" href="${href}" aria-label="Open ${escapeHtml(project.title)} project">
                    <div class="project-frame relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-white/25">
                        ${renderThumbnail(project)}
                    </div>
                </a>
                <div class="mt-6 flex justify-between items-end gap-6">
                    <div>
                        <p class="font-label text-primary text-xs font-bold mb-1">${escapeHtml(project.cardMeta)}</p>
                        <${safeHeading} class="font-headline text-2xl font-bold text-on-surface">${escapeHtml(project.title)}</${safeHeading}>
                    </div>
                    <a class="project-arrow bg-surface-container-highest hover:bg-primary hover:text-[#FAF9FF] group-hover:bg-primary group-hover:text-[#FAF9FF] transition-colors" href="${href}" aria-label="Open ${escapeHtml(project.title)} project">
                        <span class="material-symbols-outlined">arrow_outward</span>
                    </a>
                </div>
            </article>
        `;
    };

    document.querySelectorAll("[data-featured-projects]").forEach((container) => {
        const category = findCategory(container.dataset.featuredProjects);
        const projects = category ? category.projects.filter((project) => project.featured) : [];

        container.innerHTML = projects.length
            ? projects.map((project) => renderProjectCard(project, "h3")).join("")
            : `<p class="text-on-surface-variant">Featured projects are coming soon.</p>`;
    });

    document.querySelectorAll("[data-category-projects]").forEach((container) => {
        const category = findCategory(container.dataset.categoryProjects);
        const projects = category ? category.projects : [];

        container.innerHTML = projects.length
            ? projects.map((project) => renderProjectCard(project, "h2")).join("")
            : `<p class="text-on-surface-variant">Projects are coming soon.</p>`;
    });

    const renderTextSection = (title, paragraphs) => {
        const content = Array.isArray(paragraphs) ? paragraphs : [paragraphs];

        if (!hasContent(content)) {
            return "";
        }

        return `
            <section class="project-detail-section">
                <p class="font-label text-primary font-bold mb-3">${escapeHtml(title)}</p>
                <div class="space-y-4">
                    ${content.map((paragraph) => `<p class="text-on-surface-variant text-lg leading-8">${escapeHtml(paragraph)}</p>`).join("")}
                </div>
            </section>
        `;
    };

    const renderToolsSection = (tools) => {
        if (!hasContent(tools)) {
            return "";
        }

        return `
            <section class="project-detail-section">
                <p class="font-label text-primary font-bold mb-3">Tools</p>
                <div class="flex flex-wrap gap-3">
                    ${tools.map((tool) => `<span class="rounded-full bg-[#FAF9FF]/40 border border-white/45 px-4 py-2 text-sm font-semibold text-on-surface">${escapeHtml(tool)}</span>`).join("")}
                </div>
            </section>
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
                <div class="project-carousel-controls">
                    <button class="project-carousel-button" type="button" data-carousel-prev aria-label="Previous media">
                        <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span class="project-carousel-counter" data-carousel-counter>1 / ${items.length}</span>
                    <button class="project-carousel-button" type="button" data-carousel-next aria-label="Next media">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
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

    const renderProjectSection = (key, content) => {
        if (key === "gallery") {
            return renderGallerySection(content);
        }

        if (key === "carousel") {
            return renderCarouselSection(content);
        }

        return renderTextSection(sectionTitles[key] || key, content);
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
        const sectionEntries = Object.entries(project.sections || {})
            .filter(([key]) => key !== "gallery" && key !== "carousel");
        const galleryItems = [
            ...(media.gallery || []),
            ...((project.sections || {}).gallery || [])
        ];
        const carouselItems = [
            ...(media.carousel || []),
            ...((project.sections || {}).carousel || [])
        ];

        const sections = [
            renderTextSection("Overview", [project.summary]),
            renderToolsSection(project.tools),
            renderCarouselSection(carouselItems),
            ...sectionEntries.map(([key, content]) => renderProjectSection(key, content)),
            renderGallerySection(galleryItems)
        ].filter(Boolean).join("");

        root.innerHTML = `
            <section class="glass-card rounded-[2.5rem] p-8 md:p-16">
                <a class="font-label text-primary font-bold inline-flex items-center gap-2 mb-10" href="${escapeHtml(project.categoryPage)}">
                    <span class="material-symbols-outlined text-base">arrow_back</span>
                    ${escapeHtml(project.categoryLabel)}
                </a>
                <div class="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center mb-20">
                    <div>
                        <p class="font-label text-primary font-bold mb-4">${escapeHtml(project.cardMeta)}</p>
                        <h1 class="font-headline text-5xl md:text-7xl font-bold leading-tight mb-6">${escapeHtml(project.title)}</h1>
                        <p class="text-on-surface-variant text-lg leading-8">${escapeHtml(project.summary)}</p>
                    </div>
                    <div class="project-frame relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-white/25">
                        ${renderThumbnail(project)}
                    </div>
                </div>
                <div class="project-detail-grid">
                    ${sections}
                </div>
            </section>
        `;

        initializeCarousels();
    };

    renderProjectDetail();
})();
