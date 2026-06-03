#!/usr/bin/env node
// Build-time generator: pulls "Ready" rows from the Notion "Portfolio Projects"
// database and writes data/projects-data.js. Runs on Vercel build.
//
// Media files are NOT fetched from Notion (its file URLs expire). Images/videos
// must live in the repo under imagesProjects/<slug>/. Notion holds text only,
// and references media by filename (Thumbnail File, Carousel).
//
// Env vars (set in Vercel project settings):
//   NOTION_TOKEN  - internal integration secret (required to regenerate)
//   NOTION_DB_ID  - database id (optional, falls back to constant below)
//   CV_URL        - link to the CV (optional, falls back to constant below)
//
// If NOTION_TOKEN is missing (e.g. local dev), the script exits without
// touching the committed data file.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../data/projects-data.js");

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
const bool = (prop) => Boolean(prop?.checkbox);
const num = (prop) => (typeof prop?.number === "number" ? prop.number : null);

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

function mapProject(page) {
    const p = page.properties;
    const slug = txt(p["Slug"]);
    const thumbFile = txt(p["Thumbnail File"]);
    const project = {
        slug,
        title: titleTxt(p["Title"]),
        shortTitle: txt(p["Short Title"]) || titleTxt(p["Title"]),
        cardMeta: txt(p["Card Meta"]),
        featured: bool(p["Featured"]),
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
    const mapped = pages.map(mapProject).filter((m) => m.project.slug);

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
