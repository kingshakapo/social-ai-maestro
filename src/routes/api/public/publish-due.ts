import { createFileRoute } from "@tanstack/react-router";

/**
 * Publishes every scheduled post whose time has arrived.
 * Protected by a shared secret; call with header `x-cron-secret: $CRON_SECRET`.
 */
export const Route = createFileRoute("/api/public/publish-due")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { publishContentRow } = await import("@/lib/publishing.server");

        const secret = process.env.CRON_SECRET;
        const providedSecret = request.headers.get("x-cron-secret");
        const providedToken = request.headers.get("x-cron-token");

        let authorized = false;
        if (secret && providedSecret && providedSecret === secret) {
          authorized = true;
        } else if (providedToken) {
          const { data: row } = await supabaseAdmin
            .from("cron_tokens")
            .select("token")
            .eq("name", "publish_due")
            .maybeSingle();
          authorized = !!row?.token && row.token === providedToken;
        }
        if (!authorized) return new Response("Unauthorized", { status: 401 });

        const { data: due } = await supabaseAdmin
          .from("generated_content")
          .select("id, owner_id, client_id, platform, caption, hashtags, image_url, social_account_id")
          .eq("status", "scheduled")
          .lte("scheduled_for", new Date().toISOString())
          .limit(25);

        const results: { id: string; ok: boolean; error?: string }[] = [];
        for (const row of due ?? []) {
          const r = await publishContentRow(supabaseAdmin, row);
          results.push(r.ok ? { id: row.id, ok: true } : { id: row.id, ok: false, error: r.error });
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
