import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlatformSchema = z.enum(["meta", "x", "linkedin", "tiktok"]);

/** Which platform providers have credentials configured on the server. */
export const getPlatformStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { PLATFORMS, isProviderConfigured } = await import("./publishing.server");
    return PLATFORMS.map((p) => ({ platform: p, configured: isProviderConfigured(p) }));
  });

/** Begin an OAuth connect flow; returns the provider authorize URL to redirect to. */
export const startSocialConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        platform: PlatformSchema,
        clientId: z.string().uuid().nullable().optional(),
        origin: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { authorizeUrl, isProviderConfigured, pkcePair } = await import("./publishing.server");
    const { randomBytes } = await import("crypto");

    if (!isProviderConfigured(data.platform)) {
      throw new Error(`${data.platform} is not configured yet. Add its app credentials first.`);
    }

    const origin = new URL(data.origin).origin;
    const state = randomBytes(24).toString("base64url");
    const { verifier, challenge } = pkcePair();

    const { error } = await context.supabase.from("oauth_states").insert({
      state,
      owner_id: context.userId,
      client_id: data.clientId ?? null,
      platform: data.platform,
      code_verifier: verifier,
      redirect_to: data.clientId ? `/clients/${data.clientId}` : "/settings",
    });
    if (error) throw new Error(error.message);

    return { url: authorizeUrl(data.platform, origin, state, challenge) };
  });

/** Connected accounts, optionally scoped to a client. */
export const listSocialAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ clientId: z.string().uuid().nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("social_accounts")
      .select("id, platform, account_name, client_id, expires_at, created_at")
      .order("created_at", { ascending: true });
    if (data.clientId) q = q.eq("client_id", data.clientId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const disconnectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("social_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Publish one piece of content right now to its connected account. */
export const publishNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("generated_content")
      .select("id, owner_id, client_id, platform, caption, hashtags, image_url, social_account_id")
      .eq("id", data.contentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Post not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { publishContentRow } = await import("./publishing.server");
    const result = await publishContentRow(supabaseAdmin, { ...row, owner_id: context.userId });
    if (!result.ok) throw new Error(result.error);
    return result;
  });
