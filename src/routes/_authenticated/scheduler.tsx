import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/scheduler")({
  head: () => ({ meta: [{ title: "Scheduler — SocialPilot AI" }] }),
  component: SchedulerPage,
});

function SchedulerPage() {
  const { data } = useQuery({
    queryKey: ["scheduler-queue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, caption, scheduled_for, status")
        .in("status", ["draft", "scheduled"])
        .order("scheduled_for", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-1">Queue posts for auto-publish.</p>
        </div>
        <Link to="/library"><Button variant="outline" className="rounded-full">Manage library</Button></Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card">
        {!data?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Queue is empty.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.map((i) => (
              <li key={i.id} className="p-4 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-secondary text-xs">{i.platform}</span>
                <p className="flex-1 text-sm line-clamp-1">{i.caption}</p>
                <span className="text-xs text-muted-foreground">
                  {i.scheduled_for ? new Date(i.scheduled_for).toLocaleString() : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Auto-publish connections (Meta, X, LinkedIn, TikTok) are configured per client on the client page.
      </p>
    </div>
  );
}