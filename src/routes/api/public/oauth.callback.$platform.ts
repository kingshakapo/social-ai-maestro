import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const PlatformSchema = z.enum(["meta", "x", "linkedin", "tiktok"]);

function redirect(to: string, message: string, ok: boolean) {
  const url = new URL(to, "http://placeholder");
  const path = `${url.pathname}?connected=${ok ? "1" : "0"}&message=${encodeURIComponent(message)}`;
  return new Response(null, { status: 302, headers: { location: path } });
}

export const Route = createFileRoute("/api/public/oauth/callback/$platform")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const platform = PlatformSchema.safeParse(params.platform);
        if (!platform.success) return new Response("Unknown platform", { status: 400 });

        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error_description") || url.searchParams.get("error");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { exchangeCode } = await import("@/lib/publishing.server");

        if (!state) return new Response("Missing state", { status: 400 });

        const { data: st } = await supabaseAdmin
          .from("oauth_states")
          .select("*")
          .eq("state", state)
          .eq("platform", platform.data)
          .maybeSingle();
        if (!st) return new Response("Invalid or expired state", { status: 400 });
        await supabaseAdmin.from("oauth_states").delete().eq("state", state);

        const back = st.redirect_to || "/settings";
        if (err || !code) return redirect(back, err || "Authorization was cancelled.", false);

        try {
          const accounts = await exchangeCode(platform.data, url.origin, code, st.code_verifier);
          for (const a of accounts) {
            await supabaseAdmin.from("social_accounts").upsert(
              {
                owner_id: st.owner_id,
                client_id: st.client_id,
                platform: a.platform,
                account_name: a.account_name,
                external_id: a.external_id,
                access_token: a.access_token,
                refresh_token: a.refresh_token,
                expires_at: a.expires_at,
                meta: a.meta as never,
              },
              { onConflict: "owner_id,client_id,platform,external_id" },
            );
          }
          const names = accounts.map((a) => a.account_name).join(", ");
          return redirect(back, `Connected: ${names}`, true);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Connection failed";
          console.error(`[oauth-callback:${platform.data}] ${msg}`);
          return redirect(back, msg, false);
        }
      },
    },
  },
});
