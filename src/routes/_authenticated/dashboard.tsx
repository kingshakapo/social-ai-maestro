import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SocialPilot AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [clients, content] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("generated_content").select("id, status", { count: "exact" }),
      ]);
      const contentRows = content.data ?? [];
      return {
        clients: clients.count ?? 0,
        totalContent: content.count ?? 0,
        scheduled: contentRows.filter((r) => r.status === "scheduled").length,
        drafts: contentRows.filter((r) => r.status === "draft").length,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, content_type, caption, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Total clients", value: stats?.clients ?? 0, icon: Users },
    { label: "Content pieces", value: stats?.totalContent ?? 0, icon: FileText },
    { label: "Scheduled", value: stats?.scheduled ?? 0, icon: TrendingUp },
    { label: "Drafts", value: stats?.drafts ?? 0, icon: Sparkles },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI social media command center.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-studio"><Button variant="outline" className="rounded-full">Open AI Studio</Button></Link>
          <Link to="/clients/new"><Button className="rounded-full">New client</Button></Link>
        </div>
      </div>

      <OnboardingChecklist
        hasClient={(stats?.clients ?? 0) > 0}
        hasContent={(stats?.totalContent ?? 0) > 0}
        hasScheduled={(stats?.scheduled ?? 0) > 0}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold tracking-tight">Recent content</h2>
            <Link to="/ai-studio" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Create <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {!recent?.length ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No content yet. <Link to="/ai-studio" className="text-accent underline underline-offset-4">Generate your first post</Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {recent.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-secondary rounded">{r.platform}</span>
                    <span>{r.content_type}</span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{r.caption}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold tracking-tight mb-4">AI suggestions</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" /> Create a 30-day content plan for your top client.</li>
            <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" /> Generate 10 hook variations for a launch post.</li>
            <li className="flex gap-2"><Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" /> Build a holiday campaign in one click.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}