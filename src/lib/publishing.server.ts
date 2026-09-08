// Server-only: OAuth + publish adapters for Meta (Facebook/Instagram), X, LinkedIn, TikTok.
import { createHash, randomBytes } from "crypto";

export type Platform = "meta" | "x" | "linkedin" | "tiktok";
export const PLATFORMS: Platform[] = ["meta", "x", "linkedin", "tiktok"];

export interface SocialAccountRow {
  id: string;
  owner_id: string;
  client_id: string | null;
  platform: string; // facebook | instagram | x | linkedin | tiktok
  account_name: string;
  external_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  meta: Record<string, unknown>;
}

export interface PublishInput {
  text: string;
  imageUrl?: string | null; // must be publicly fetchable
}

export interface PublishResult {
  externalId: string;
}

/** Map the content "platform" label (e.g. "Instagram") to the social_accounts.platform value. */
export function contentPlatformToAccountPlatform(label: string): string | null {
  const l = label.toLowerCase();
  if (l === "instagram") return "instagram";
  if (l === "facebook") return "facebook";
  if (l === "x" || l === "twitter") return "x";
  if (l === "linkedin") return "linkedin";
  if (l === "tiktok") return "tiktok";
  return null;
}

export function providerCredentials(p: Platform) {
  const env = process.env;
  const map = {
    meta: { id: env.META_APP_ID, secret: env.META_APP_SECRET },
    x: { id: env.X_CLIENT_ID, secret: env.X_CLIENT_SECRET },
    linkedin: { id: env.LINKEDIN_CLIENT_ID, secret: env.LINKEDIN_CLIENT_SECRET },
    tiktok: { id: env.TIKTOK_CLIENT_KEY, secret: env.TIKTOK_CLIENT_SECRET },
  } as const;
  return map[p];
}

export function isProviderConfigured(p: Platform) {
  const c = providerCredentials(p);
  return !!(c.id && c.secret);
}

export function pkcePair() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function redirectUri(origin: string, p: Platform) {
  return `${origin}/api/public/oauth/callback/${p}`;
}

export function authorizeUrl(p: Platform, origin: string, state: string, challenge: string) {
  const { id } = providerCredentials(p);
  const cb = redirectUri(origin, p);
  switch (p) {
    case "meta": {
      const u = new URL("https://www.facebook.com/v21.0/dialog/oauth");
      u.searchParams.set("client_id", id!);
      u.searchParams.set("redirect_uri", cb);
      u.searchParams.set("state", state);
      u.searchParams.set("response_type", "code");
      u.searchParams.set(
        "scope",
        "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management",
      );
      return u.toString();
    }
    case "x": {
      const u = new URL("https://x.com/i/oauth2/authorize");
      u.searchParams.set("response_type", "code");
      u.searchParams.set("client_id", id!);
      u.searchParams.set("redirect_uri", cb);
      u.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
      u.searchParams.set("state", state);
      u.searchParams.set("code_challenge", challenge);
      u.searchParams.set("code_challenge_method", "S256");
      return u.toString();
    }
    case "linkedin": {
      const u = new URL("https://www.linkedin.com/oauth/v2/authorization");
      u.searchParams.set("response_type", "code");
      u.searchParams.set("client_id", id!);
      u.searchParams.set("redirect_uri", cb);
      u.searchParams.set("state", state);
      u.searchParams.set("scope", "openid profile w_member_social");
      return u.toString();
    }
    case "tiktok": {
      const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
      u.searchParams.set("client_key", id!);
      u.searchParams.set("response_type", "code");
      u.searchParams.set("scope", "user.info.basic,video.publish");
      u.searchParams.set("redirect_uri", cb);
      u.searchParams.set("state", state);
      u.searchParams.set("code_challenge", challenge);
      u.searchParams.set("code_challenge_method", "S256");
      return u.toString();
    }
  }
}

async function readJson(res: Response) {
  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`Provider request failed [${res.status}]: ${text.slice(0, 500)}`);
  }
  return body;
}

export type ExchangedAccount = Omit<SocialAccountRow, "id" | "owner_id" | "client_id">;

/** Exchange an OAuth code for one or more publishable accounts. */
export async function exchangeCode(
  p: Platform,
  origin: string,
  code: string,
  verifier: string | null,
): Promise<ExchangedAccount[]> {
  const { id, secret } = providerCredentials(p);
  const cb = redirectUri(origin, p);

  if (p === "meta") {
    const short = await readJson(
      await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          new URLSearchParams({ client_id: id!, client_secret: secret!, redirect_uri: cb, code }),
      ),
    );
    const long = await readJson(
      await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?` +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: id!,
            client_secret: secret!,
            fb_exchange_token: short.access_token,
          }),
      ),
    );
    const userToken: string = long.access_token;
    const pages = await readJson(
      await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`,
      ),
    );
    const out: ExchangedAccount[] = [];
    for (const page of pages.data ?? []) {
      out.push({
        platform: "facebook",
        account_name: page.name,
        external_id: page.id,
        access_token: page.access_token, // page tokens from long-lived user tokens don't expire
        refresh_token: null,
        expires_at: null,
        meta: { page_id: page.id },
      });
      if (page.instagram_business_account?.id) {
        out.push({
          platform: "instagram",
          account_name: `@${page.instagram_business_account.username ?? page.name}`,
          external_id: page.instagram_business_account.id,
          access_token: page.access_token,
          refresh_token: null,
          expires_at: null,
          meta: { page_id: page.id },
        });
      }
    }
    if (!out.length) throw new Error("No Facebook Pages found on this account. Publishing requires a Page.");
    return out;
  }

  if (p === "x") {
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    const tok = await readJson(
      await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: cb,
          code_verifier: verifier ?? "",
          client_id: id!,
        }),
      }),
    );
    const me = await readJson(
      await fetch("https://api.x.com/2/users/me", { headers: { authorization: `Bearer ${tok.access_token}` } }),
    );
    return [
      {
        platform: "x",
        account_name: `@${me.data.username}`,
        external_id: me.data.id,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at: new Date(Date.now() + (tok.expires_in ?? 7200) * 1000).toISOString(),
        meta: {},
      },
    ];
  }

  if (p === "linkedin") {
    const tok = await readJson(
      await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: cb,
          client_id: id!,
          client_secret: secret!,
        }),
      }),
    );
    const me = await readJson(
      await fetch("https://api.linkedin.com/v2/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } }),
    );
    return [
      {
        platform: "linkedin",
        account_name: me.name ?? "LinkedIn member",
        external_id: me.sub,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at: new Date(Date.now() + (tok.expires_in ?? 5184000) * 1000).toISOString(),
        meta: {},
      },
    ];
  }

  // tiktok
  const tok = await readJson(
    await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: id!,
        client_secret: secret!,
        code,
        grant_type: "authorization_code",
        redirect_uri: cb,
        code_verifier: verifier ?? "",
      }),
    }),
  );
  if (tok.error) throw new Error(`TikTok: ${tok.error_description ?? tok.error}`);
  const info = await readJson(
    await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name", {
      headers: { authorization: `Bearer ${tok.access_token}` },
    }),
  );
  return [
    {
      platform: "tiktok",
      account_name: info.data?.user?.display_name ?? "TikTok creator",
      external_id: tok.open_id,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? null,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 86400) * 1000).toISOString(),
      meta: {},
    },
  ];
}

/** Refresh an expiring token where the provider supports it. Returns updated fields or null if no refresh needed. */
export async function refreshIfNeeded(acc: SocialAccountRow): Promise<Partial<SocialAccountRow> | null> {
  if (!acc.expires_at || !acc.refresh_token) return null;
  if (new Date(acc.expires_at).getTime() - Date.now() > 5 * 60 * 1000) return null;

  if (acc.platform === "x") {
    const { id, secret } = providerCredentials("x");
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    const tok = await readJson(
      await fetch("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${basic}` },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: acc.refresh_token, client_id: id! }),
      }),
    );
    return {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? acc.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 7200) * 1000).toISOString(),
    };
  }
  if (acc.platform === "tiktok") {
    const { id, secret } = providerCredentials("tiktok");
    const tok = await readJson(
      await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: id!,
          client_secret: secret!,
          grant_type: "refresh_token",
          refresh_token: acc.refresh_token,
        }),
      }),
    );
    return {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? acc.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 86400) * 1000).toISOString(),
    };
  }
  if (acc.platform === "linkedin") {
    const { id, secret } = providerCredentials("linkedin");
    const tok = await readJson(
      await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: acc.refresh_token,
          client_id: id!,
          client_secret: secret!,
        }),
      }),
    );
    return {
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? acc.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in ?? 5184000) * 1000).toISOString(),
    };
  }
  return null;
}

export async function publishTo(acc: SocialAccountRow, input: PublishInput): Promise<PublishResult> {
  const token = acc.access_token;

  switch (acc.platform) {
    case "facebook": {
      const pageId = acc.external_id;
      if (input.imageUrl) {
        const r = await readJson(
          await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url: input.imageUrl, caption: input.text, access_token: token }),
          }),
        );
        return { externalId: r.post_id ?? r.id };
      }
      const r = await readJson(
        await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: input.text, access_token: token }),
        }),
      );
      return { externalId: r.id };
    }

    case "instagram": {
      if (!input.imageUrl) throw new Error("Instagram requires an image. Generate one in AI Studio first.");
      const igId = acc.external_id;
      const container = await readJson(
        await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ image_url: input.imageUrl, caption: input.text, access_token: token }),
        }),
      );
      // Wait for the container to be ready (usually a few seconds).
      for (let i = 0; i < 10; i++) {
        const st = await readJson(
          await fetch(
            `https://graph.facebook.com/v21.0/${container.id}?fields=status_code&access_token=${encodeURIComponent(token)}`,
          ),
        );
        if (st.status_code === "FINISHED") break;
        if (st.status_code === "ERROR") throw new Error("Instagram could not process the image.");
        await new Promise((r) => setTimeout(r, 2000));
      }
      const pub = await readJson(
        await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ creation_id: container.id, access_token: token }),
        }),
      );
      return { externalId: pub.id };
    }

    case "x": {
      const r = await readJson(
        await fetch("https://api.x.com/2/tweets", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: input.text.slice(0, 280) }),
        }),
      );
      return { externalId: r.data.id };
    }

    case "linkedin": {
      const res = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "LinkedIn-Version": "202409",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${acc.external_id}`,
          commentary: input.text.slice(0, 3000),
          visibility: "PUBLIC",
          distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
          lifecycleState: "PUBLISHED",
          isReshareDisabledByAuthor: false,
        }),
      });
      if (!res.ok) throw new Error(`LinkedIn request failed [${res.status}]: ${(await res.text()).slice(0, 500)}`);
      return { externalId: res.headers.get("x-restli-id") ?? "posted" };
    }

    case "tiktok": {
      if (!input.imageUrl) throw new Error("TikTok requires an image or video. Generate an image in AI Studio first.");
      const r = await readJson(
        await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
          method: "POST",
          headers: { "content-type": "application/json; charset=UTF-8", authorization: `Bearer ${token}` },
          body: JSON.stringify({
            post_info: {
              title: input.text.slice(0, 90),
              description: input.text.slice(0, 4000),
              privacy_level: "PUBLIC_TO_EVERYONE",
              disable_comment: false,
              auto_add_music: true,
            },
            source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [input.imageUrl] },
            post_mode: "DIRECT_POST",
            media_type: "PHOTO",
          }),
        }),
      );
      if (r.error?.code && r.error.code !== "ok") throw new Error(`TikTok: ${r.error.message ?? r.error.code}`);
      return { externalId: r.data?.publish_id ?? "queued" };
    }
  }
  throw new Error(`Unsupported platform: ${acc.platform}`);
}

/** Publish one generated_content row using the admin client. Updates the row with the result. */
export async function publishContentRow(
  admin: any,
  row: {
    id: string;
    owner_id: string;
    client_id: string | null;
    platform: string;
    caption: string | null;
    hashtags: string | null;
    image_url: string | null;
    social_account_id: string | null;
  },
): Promise<{ ok: true; externalId: string } | { ok: false; error: string }> {
  try {
    const target = contentPlatformToAccountPlatform(row.platform);
    if (!target) throw new Error(`No native publishing for ${row.platform} yet.`);

    let q = admin.from("social_accounts").select("*").eq("owner_id", row.owner_id);
    if (row.social_account_id) q = q.eq("id", row.social_account_id);
    else {
      q = q.eq("platform", target);
      if (row.client_id) q = q.eq("client_id", row.client_id);
    }
    const { data: accounts } = await q.limit(1);
    const acc: SocialAccountRow | undefined = accounts?.[0];
    if (!acc) throw new Error(`No connected ${target} account for this client. Connect one on the client page.`);

    const refreshed = await refreshIfNeeded(acc);
    if (refreshed) {
      await admin.from("social_accounts").update(refreshed).eq("id", acc.id);
      Object.assign(acc, refreshed);
    }

    let imageUrl: string | null = null;
    if (row.image_url) {
      const { data } = await admin.storage.from("post-images").createSignedUrl(row.image_url, 60 * 60);
      imageUrl = data?.signedUrl ?? null;
    }

    const text = [row.caption ?? "", row.hashtags ?? ""].filter(Boolean).join("\n\n");
    const result = await publishTo(acc, { text, imageUrl });

    await admin
      .from("generated_content")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        external_post_id: result.externalId,
        publish_error: null,
        social_account_id: acc.id,
      })
      .eq("id", row.id);
    return { ok: true, externalId: result.externalId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[publish] ${row.id} failed: ${msg}`);
    await admin.from("generated_content").update({ status: "failed", publish_error: msg }).eq("id", row.id);
    return { ok: false, error: msg };
  }
}
