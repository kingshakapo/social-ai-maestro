import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns — SocialPilot AI" }] }),
  component: CampaignsPage,
});

const templates = [
  { name: "Product launch", desc: "10-post countdown, hero reveal, and follow-up nurture." },
  { name: "Holiday season", desc: "4-week themed content plan with promo hooks." },
  { name: "Lead magnet", desc: "Landing-page teaser series driving to a free download." },
  { name: "Case study spotlight", desc: "Customer story broken into 5 platform-native posts." },
];

function CampaignsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">One-click multi-post campaigns.</p>
        </div>
        <Link to="/ai-studio"><Button className="rounded-full">Build custom</Button></Link>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-3">
        {templates.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6">
            <Megaphone className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-semibold">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            <Link to="/ai-studio" className="text-sm text-accent underline underline-offset-4 mt-4 inline-block">Use template →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}