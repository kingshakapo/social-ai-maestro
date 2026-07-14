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
  `scheduled`, `published`), platform, and schedule time.

**Server functions.** `src/lib/ai.functions.ts` — AI generation via
`createServerFn` + `requireSupabaseAuth`. All AI calls go through the Lovable
AI Gateway (no user API keys).

**Modules shipped.**
Dashboard · Clients (CRUD + Brand DNA) · AI Studio · Calendar ·
Content Library · Brand Kits · Campaigns · Scheduler · Analytics ·
Reports (CSV export) · Invoices · Settings.

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
- [ ] **AI image generation** — hero images and image variants per post
      (currently text-only briefs).
- [ ] **Billing** — Stripe integration for plan subscriptions and per-workspace
      quotas.
- [ ] **Email verification enforced** in production + password reset flow with
      dedicated `/reset-password` route.
- [ ] **Rate limiting** on AI generation server function (per user, per hour).
- [ ] **RLS review** — pen-test all policies with a second Supabase account.
- [ ] **Legal** — Terms of Service, Privacy Policy, DPA for EU clients.
- [ ] **Onboarding** — 3-step guided setup for the first client.
- [ ] **Error monitoring** — Sentry or equivalent wired to production.
- [ ] **Empty-state polish** across every module.

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