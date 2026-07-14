import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SocialPilot AI" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const [{ data: content }, { data: clients }] = await Promise.all([
        supabase.from("generated_content").select("platform, status, created_at"),
        supabase.from("clients").select("id"),
      ]);
      const byPlatform: Record<string, number> = {};
      (content ?? []).forEach((c) => (byPlatform[c.platform] = (byPlatform[c.platform] ?? 0) + 1));
      return {
        totalClients: clients?.length ?? 0,
        totalContent: content?.length ?? 0,
        scheduled: (content ?? []).filter((c) => c.status === "scheduled").length,
        byPlatform,
      };
    },
  });

  const platforms = Object.entries(data?.byPlatform ?? {});
  const max = Math.max(1, ...platforms.map(([, v]) => v));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
      <p className="text-sm text-muted-foreground mt-1">Content output and platform mix.</p>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "Clients", value: data?.totalClients ?? 0 },
          { label: "Total content", value: data?.totalContent ?? 0 },
          { label: "Scheduled", value: data?.scheduled ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-semibold mb-4">Content by platform</h2>
        {!platforms.length ? (
          <p className="text-sm text-muted-foreground">No content yet.</p>
        ) : (
          <div className="space-y-3">
            {platforms.map(([name, count]) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize">{name}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Live engagement metrics arrive when you connect platform accounts (Meta, X, LinkedIn).
      </p>
    </div>
  );
}