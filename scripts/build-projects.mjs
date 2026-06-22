#!/usr/bin/env node
// Build-time generator: pulls "Ready" rows from the Notion "Portfolio Projects"
// database, writes data/projects-data.js, AND downloads each row's
// "Files & media" attachments into imagesProjects/<slug>/. Runs on Vercel build.
//
// Notion file URLs expire (~1h), but that's irrelevant: this script requests
// fresh signed URLs at build time and downloads them within the same build.
// So the designer only attaches photos/videos to the Notion row — nothing is
// committed to the repo by hand.
//
// Filename rules:
//   - Each attachment is saved as imagesProjects/<slug>/<original-filename>.
//   - "Thumbnail File" should match an attachment name. If blank, the first
//     attachment is used as the cover.
//   - "Carousel" lines ("filename | caption") reference attachment names.
//     If blank, no carousel is shown (cover only).
//
// Env vars (set in Vercel project settings):
//   NOTION_TOKEN  - internal integration secret (required to regenerate)
//   NOTION_DB_ID  - database id (optional, falls back to constant below)
//   CV_URL        - link to the CV (optional, falls back to constant below)
//
// If NOTION_TOKEN is missing (e.g. local dev), the script exits without
// touching the committed data file.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../data/projects-data.js");
const MEDIA_ROOT = resolve(__dirname, "../imagesProjects");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB_ID = process.env.NOTION_DB_ID || "7b03d1c73b1e4dd9a39b670ff086cbcc";
const CV_URL = process.env.CV_URL ||
    "https://drive.google.com/file/d/14kkeX-nYINI_yYW-FbwWHhMAFweyPZ78/view?usp=sharing";
const NOTION_VERSION = "2022-06-28";

// Category select value -> site category definition. Order here = page order.
const CATEGORIES = [
    { id: "design-grafico", select: "Graphic Design", label: "Graphic Design", page: "design-grafico.html" },
    { id: "ux-ui", select: "UX/UI", label: "UX/UI", page: "ux-ui.html" },
    { id: "ilustracao", select: "Illustration", label: "Illustration", page: "ilustracao.html" }
];

if (!NOTION_TOKEN) {
    console.warn("[build-projects] NOTION_TOKEN not set — keeping existing data/projects-data.js. Skipping.");
    process.exit(0);
}

// --- Notion property readers -------------------------------------------------
const txt = (prop) => (prop?.rich_text || []).map((r) => r.plain_text).join("").trim();
const titleTxt = (prop) => (prop?.title || []).map((r) => r.plain_text).join("").trim();
const sel = (prop) => prop?.select?.name || "";
const multi = (prop) => (prop?.multi_select || []).map((o) => o.name);
// Read the first matching multi-select property among several candidate names.
const multiAny = (props, names) => {
    for (const name of names) {
        if (props[name]?.multi_select) return multi(props[name]);
    }
    return [];
};
const bool = (prop) => Boolean(prop?.checkbox);
const num = (prop) => (typeof prop?.number === "number" ? prop.number : null);

// Find the first "files" property on a page, regardless of its name, and
// return [{ name, url }] entries (signed file URLs or external URLs).
const fileEntries = (properties) => {
    const filesProp = Object.values(properties).find((prop) => prop?.type === "files");
    return (filesProp?.files || []).map((f) => ({
        name: basename(f.name || ""),
        url: f.type === "external" ? f.external?.url : f.file?.url
    })).filter((f) => f.name && f.url);
};

// Split a text field into paragraphs. Accepts real newlines or <br> tags.
const paragraphs = (value) => String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

// Parse "filename | caption" lines into carousel media items.
const parseCarousel = (value, slug) => paragraphs(value).map((line) => {
    const [file, ...rest] = line.split("|");
    const filename = file.trim();
    const caption = rest.join("|").trim();
    const src = `imagesProjects/${slug}/${filename}`;
    const isVideo = /\.(mp4|webm|mov)$/i.test(filename);
    if (isVideo) {
        return { type: "video", src, ...(caption ? { caption } : {}) };
    }
    return { type: "image", src, alt: caption || filename, ...(caption ? { caption } : {}) };
}).filter((item) => item.src && !item.src.endsWith("/"));

// --- Fetch all Ready rows ----------------------------------------------------
async function fetchReadyPages() {
    const pages = [];
    let cursor;
    do {
        const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NOTION_TOKEN}`,
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                filter: { property: "Status", select: { equals: "Ready" } },
                sorts: [{ property: "Order", direction: "ascending" }],
                page_size: 100,
                ...(cursor ? { start_cursor: cursor } : {})
            })
        });
        if (!res.ok) {
            throw new Error(`Notion query failed: ${res.status} ${await res.text()}`);
        }
        const data = await res.json();
        pages.push(...data.results);
        cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);
    return pages;
}

// Download a row's attachments into imagesProjects/<slug>/.
async function downloadMedia(slug, files) {
    if (!files.length) return;
    const dir = resolve(MEDIA_ROOT, slug);
    await mkdir(dir, { recursive: true });
    await Promise.all(files.map(async (f) => {
        const res = await fetch(f.url);
        if (!res.ok) {
            throw new Error(`Download failed for ${slug}/${f.name}: ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(resolve(dir, f.name), buf);
        console.log(`[build-projects]   ↓ imagesProjects/${slug}/${f.name} (${buf.length} bytes)`);
    }));
}

function mapProject(page, files) {
    const p = page.properties;
    const slug = txt(p["Slug"]);
    // Thumbnail: explicit field, else first attachment.
    const thumbFile = txt(p["Thumbnail File"]) || files[0]?.name || "";
    const project = {
        slug,
        title: titleTxt(p["Title"]),
        shortTitle: txt(p["Short Title"]) || titleTxt(p["Title"]),
        cardMeta: txt(p["Card Meta"]),
        featured: bool(p["Featured"]),
        // Multi-select on the Notion row; drives the filter pills on the category page.
        subcategories: multiAny(p, ["Sub-categories", "Subcategories", "Sub-Categories", "Subcategory"]),
        summary: txt(p["Summary"]).replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim(),
        tools: multi(p["Tools"]),
        thumbnail: thumbFile
            ? { type: "image", src: `imagesProjects/${slug}/${thumbFile}`, alt: `${titleTxt(p["Title"])} project preview` }
            : { type: "html", alt: `${titleTxt(p["Title"])} project preview`, html: "" },
        media: { carousel: parseCarousel(txt(p["Carousel"]), slug), gallery: [] },
        sections: {
            brief: paragraphs(txt(p["Brief"])),
            process: paragraphs(txt(p["Process"])),
            outcome: paragraphs(txt(p["Outcome"]))
        },
        _order: num(p["Order"]) ?? Number.MAX_SAFE_INTEGER
    };
    return { category: sel(p["Category"]), project };
}

async function main() {
    const pages = await fetchReadyPages();

    const mapped = [];
    for (const page of pages) {
        const slug = txt(page.properties["Slug"]);
        if (!slug) continue;
        const files = fileEntries(page.properties);
        await downloadMedia(slug, files);
        mapped.push(mapProject(page, files));
    }

    const categories = CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        displayLabel: cat.label,
        page: cat.page,
        projects: mapped
            .filter((m) => m.category === cat.select)
            .sort((a, b) => a.project._order - b.project._order)
            .map(({ project }) => { const { _order, ...rest } = project; return rest; })
    }));

    const portfolioData = { cvUrl: CV_URL, categories };

    const header =
        "// AUTO-GENERATED at build time from the Notion \"Portfolio Projects\" database.\n" +
        "// Do NOT edit by hand — changes are overwritten on the next build.\n" +
        "// Source: scripts/build-projects.mjs\n\n";
    const body = "window.portfolioData = " + JSON.stringify(portfolioData, null, 4) + ";\n";

    await writeFile(OUT_PATH, header + body, "utf8");
    const total = categories.reduce((n, c) => n + c.projects.length, 0);
    console.log(`[build-projects] Wrote ${total} project(s) across ${categories.length} categories to data/projects-data.js`);
}

main().catch((err) => {
    console.error("[build-projects] FAILED:", err.message);
    process.exit(1);
});
