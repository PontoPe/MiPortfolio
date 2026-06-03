// Vercel serverless function: receives Notion webhooks and triggers a Vercel
// Deploy Hook so the site rebuilds (pulling fresh Notion content + media).
//
// Zero designer effort: she edits the Notion DB, Notion fires this webhook,
// the site redeploys automatically in ~30s.
//
// Env vars (Vercel project settings):
//   VERCEL_DEPLOY_HOOK_URL - the Deploy Hook URL to POST to (required)
//   NOTION_WEBHOOK_SECRET  - optional shared token; if set, requests must send
//                            it as ?token=... or X-Webhook-Secret header.
//
// Notion's first request during subscription setup contains a
// "verification_token" — this handler echoes it back so you can confirm the
// subscription in the Notion integration dashboard.

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
