// Vercel serverless function: receives Notion webhooks and triggers a Vercel
// Deploy Hook so the site rebuilds (pulling fresh Notion content + media).
//
// PUBLISH GATE — to avoid a build on every keystroke while the designer fills
// out a row, we ONLY trigger a rebuild when a page's "Status" property is set
// to "Ready". Drafting (typing, attaching photos, reordering, comments) fires
// events that this function ignores. So the workflow is:
//   1. Create row, fill it in, attach photos — Status stays Draft/empty (no builds).
//   2. Flip Status -> Ready  ==> exactly one build, site goes live in ~30s.
//   3. To edit a live project later: flip back to Draft, edit, then Ready again.
//
// Env vars (Vercel project settings):
//   VERCEL_DEPLOY_HOOK_URL - the Deploy Hook URL to POST to (required)
//   NOTION_TOKEN           - integration secret, used to read the changed page
//   NOTION_DB_ID           - database id (optional, falls back to constant)
//   NOTION_WEBHOOK_SECRET  - optional shared token; if set, requests must send
//                            it as ?token=... or X-Webhook-Secret header.

const NOTION_DB_ID = process.env.NOTION_DB_ID || "7b03d1c73b1e4dd9a39b670ff086cbcc";
const NOTION_VERSION = "2022-06-28";
const READY_VALUE = "Ready";

const stripDashes = (s) => String(s || "").replace(/-/g, "");

// Build only on these event types. Other events (content, comments, views,
// page.created in Draft, etc.) never trigger a deploy.
const RELEVANT_TYPES = new Set(["page.properties_updated", "page.created"]);

async function shouldBuild(event) {
    if (!RELEVANT_TYPES.has(event.type)) return false;

    const pageId = event.entity?.id;
    if (!pageId || event.entity?.type !== "page") return false;

    const token = process.env.NOTION_TOKEN;
    if (!token) return false;

    // Fetch the changed page to read its current Status + parent database.
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: { "Authorization": `Bearer ${token}`, "Notion-Version": NOTION_VERSION }
    });
    if (!res.ok) return false;
    const page = await res.json();

    // Must belong to our Portfolio Projects database.
    if (stripDashes(page.parent?.database_id) !== stripDashes(NOTION_DB_ID)) return false;

    // Find the Status (select) property regardless of its exact name.
    const entries = Object.values(page.properties || {});
    const status = entries.find((p) => p.type === "select" && p.select?.name &&
        ["Ready", "Draft"].includes(p.select.name));
    if (status?.select?.name !== READY_VALUE) return false;

    // For property updates, require the Status property itself to be the one
    // that changed (so editing other fields on a Ready row does NOT rebuild).
    if (event.type === "page.properties_updated") {
        const updated = event.data?.updated_properties || [];
        const statusId = status.id;
        if (updated.length && statusId && !updated.includes(statusId)) return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const body = req.body || {};

    // 1) Subscription handshake: Notion sends a verification_token once.
    if (body.verification_token) {
        console.log("[notion-webhook] verification_token:", body.verification_token);
        res.status(200).json({ verification_token: body.verification_token });
        return;
    }

    // 2) Optional shared-secret check for real events.
    const expected = process.env.NOTION_WEBHOOK_SECRET;
    if (expected) {
        const got = req.query?.token || req.headers["x-webhook-secret"];
        if (got !== expected) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
    }

    // 3) Publish gate — ignore anything that isn't "row set to Ready".
    let build = false;
    try {
        build = await shouldBuild(body);
    } catch (err) {
        console.error("[notion-webhook] gate check failed:", err);
    }
    if (!build) {
        console.log("[notion-webhook] ignored event:", body.type);
        res.status(200).json({ ignored: true, type: body.type || null });
        return;
    }

    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!hook) {
        res.status(500).json({ error: "VERCEL_DEPLOY_HOOK_URL not configured" });
        return;
    }

    try {
        const r = await fetch(hook, { method: "POST" });
        console.log("[notion-webhook] deploy hook triggered:", r.status);
        res.status(202).json({ triggered: true });
    } catch (err) {
        console.error("[notion-webhook] deploy hook failed:", err);
        res.status(502).json({ error: "Deploy hook failed" });
    }
}
