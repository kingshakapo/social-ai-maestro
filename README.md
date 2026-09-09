# SocialPilot AI

**The AI Operating System for Social Media Managers.**
Upload a client once — the AI plans, writes, schedules, and reports on their entire social media presence.

---

## 📈 Investor Brief

**Market.** 5M+ freelance social media managers and 50k+ agencies worldwide spend
60–70% of their time on repetitive content work (research, writing, scheduling,
reporting). The category leaders (Hootsuite, Buffer, Later, SocialPilot) are
scheduling tools — none is AI-native.

**Product.** SocialPilot AI is an AI-first operating system. Managers create a
**client workspace**, upload the brand DNA (voice, audience, offers, visual
identity), and the AI becomes an on-demand teammate that produces platform-native
content, campaigns, calendars, and reports.

**Wedge.** One-click multi-post campaigns + auto-generated brand-safe captions
cut per-client production time from ~10h/week to <2h. That is the moat: every
client onboarded deepens their brand model, which competitors can't replicate.

**Business model.** SaaS tiered by number of client workspaces + AI generation
quota. Additional revenue: white-label add-on for agencies, per-seat pricing,
invoicing/retainer processing (revenue share on Stripe).

**Traction path.** Launch → freelance managers (self-serve, $29/mo). Expand →
small agencies ($99/mo, 10 clients). Enterprise → white-label agencies (custom).

**Defensibility.** Per-client Brand DNA + generation history compounds into a
proprietary dataset that improves output quality faster than horizontal LLMs.

---

## 🛠️ Admin Brief

**Stack.** TanStack Start (React 19 + Vite 7) · Tailwind v4 · shadcn/ui ·
Lovable Cloud (Supabase Postgres + Auth) · Lovable AI Gateway (Gemini 2.5 Flash).

**Auth.** Email/password + Google OAuth. Email confirmation auto-approved in
dev; disable in production via Cloud → Users → Auth Settings.

**Database (RLS enforced, owner-scoped).**
- `profiles` — user profile, auto-created on signup via trigger.
- `clients` — client workspaces with full Brand DNA columns.
- `generated_content` — every AI-generated post with status (`draft`,
  `scheduled`, `published`, `failed`), platform, schedule time, image path,
  `published_at`, `external_post_id`, `publish_error`, `social_account_id`.
- `social_accounts` — connected publishing destinations per client
  (platform, account name, external id, tokens, expiry, meta).
- `oauth_states` — short-lived CSRF/PKCE handshake records.
- `cron_tokens` — private (no RLS policies, service-role only) shared key the
  scheduled job uses to authenticate against the publish endpoint.

**Server functions.**
- `src/lib/ai.functions.ts` — AI generation (Lovable AI Gateway, no user keys).
- `src/lib/social.functions.ts` — platform status, OAuth start, list/disconnect
  accounts, `publishNow`.
- `src/lib/publishing.server.ts` — per-platform OAuth + publish adapters.

**Server routes.**
- `GET /api/public/oauth/callback/:platform` — OAuth callback; validates state,
  exchanges the code, upserts `social_accounts`, redirects back with a toast.
- `POST /api/public/publish-due` — publishes due scheduled posts. Requires
  `x-cron-secret: $CRON_SECRET` or the DB `x-cron-token`. Called by a pg_cron
  job every 5 minutes (288 runs/day; keeps posts within ~5 min of their slot).

**Native publishing.**

| Platform | Auth | Publishing |
| --- | --- | --- |
| Facebook Page | Meta OAuth (long-lived page token) | text + image posts |
| Instagram Business | via the same Meta OAuth | image posts (image required) |
| X | OAuth 2.0 PKCE + refresh | text posts (280 chars) |
| LinkedIn | OAuth 2.0 (`w_member_social`) | text posts on the member feed |
| TikTok | OAuth 2.0 PKCE + refresh | photo posts (image required) |

**Required secrets** (per platform, from each developer portal). A platform's
Connect button stays disabled until its pair is present:
`META_APP_ID` / `META_APP_SECRET` ·
`X_CLIENT_ID` / `X_CLIENT_SECRET` ·
`LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` ·
`TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` ·
`CRON_SECRET` (auto-generated).

Register this redirect URI in each developer portal:
`https://<your-domain>/api/public/oauth/callback/{meta|x|linkedin|tiktok}`

**Modules shipped.**
Dashboard · Clients (CRUD + Brand DNA + publishing connections) · AI Studio ·
Calendar · Content Library · Brand Kits · Campaigns · Scheduler (publish now +
auto-publish) · Analytics · Reports (CSV export) · Invoices · Settings.

**Ops.**
- Secrets managed in Cloud (LOVABLE_API_KEY auto-provisioned).
- Migrations in `supabase/migrations/`.
- Local dev: `bun install && bun dev`.

---

## 👤 User Brief

**Who it's for.** Freelance social media managers, agencies, and in-house
marketers running multiple brands.

**The flow.**
1. **Add a client** — business name, industry, audience, offers, brand voice,
   colors, fonts, hashtags. This is the client's *Brand DNA*.
2. **Open AI Studio** — pick platform + content type, describe the goal, and
   generate a caption + hashtags + CTA on-brand.
3. **Save to Library** — every generation is stored, editable, and reusable.
4. **Schedule** — send to the queue, view in the Calendar.
5. **Report** — export a CSV of everything you produced for the client.

**Time saved.** ~10 hours/week/client.

---

## 🚧 Launch Blockers (must-fix before public launch)

- [ ] **Native platform publishing** — Meta, X, LinkedIn, TikTok OAuth +
      publish APIs (Scheduler currently queues but does not push).
- [x] **AI image generation** — streaming image generation from each post's
      image brief, stored per user in the `post-images` bucket.
- [ ] **Billing** — Stripe integration for plan subscriptions and per-workspace
      quotas.
- [ ] **Email verification enforced** in production + password reset flow with
      dedicated `/reset-password` route.
- [ ] **Rate limiting** on AI generation server function (per user, per hour).
- [ ] **RLS review** — pen-test all policies with a second Supabase account.
- [ ] **Legal** — Terms of Service, Privacy Policy, DPA for EU clients.
- [x] **Onboarding** — 3-step guided setup on the dashboard (add client →
      generate → schedule), dismissible per user.
- [ ] **Error monitoring** — Sentry or equivalent wired to production.
- [x] **Empty-state polish** — shared `EmptyState` component across library,
      calendar, scheduler, and clients.

## ✨ Good-to-Have Features (post-launch roadmap)

- Team seats + roles (Owner, Editor, Viewer) per workspace.
- White-label mode for agencies (custom domain, logo, colors).
- AI-powered competitor analysis (paste competitor handle → get insights).
- Trend radar (surface trending topics per industry, weekly).
- Content approval workflow with client-facing review link.
- Comment/DM inbox unification across platforms.
- Auto-generated monthly performance PDF for each client.
- Content repurposing (blog → 10 posts, video → clips + captions).
- A/B hook testing on published posts.
- Zapier / n8n / webhook integrations.
- Chrome extension: right-click any URL → generate a post about it.
- Mobile apps (iOS + Android) for on-the-go approvals.
- Multi-language generation with per-market tone tuning.
- Voice-of-brand fine-tuning from uploaded past posts.
- Invoicing + retainer contracts with e-signature.

---

Built on [Lovable](https://lovable.dev).