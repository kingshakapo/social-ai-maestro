import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, Send } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { publishNow } from "@/lib/social.functions";

export const Route = createFileRoute("/_authenticated/scheduler")({
  head: () => ({
    meta: [
      { title: "Scheduler — SocialPilot AI" },
      {
        name: "description",
        content: "Queue and auto-publish posts to Facebook, Instagram, X, LinkedIn and TikTok.",
      },
      { property: "og:title", content: "Scheduler — SocialPilot AI" },
      { property: "og:description", content: "Queue posts and publish them natively to every connected platform." },
    ],
  }),
  component: SchedulerPage,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
};

function SchedulerPage() {
  const qc = useQueryClient();
  const publish = useServerFn(publishNow);
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["scheduler-queue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, caption, scheduled_for, status, published_at, publish_error, external_post_id")
        .in("status", ["draft", "scheduled", "failed", "published"])
        .order("scheduled_for", { ascending: true, nullsFirst: false })
        .limit(50);
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      setBusy(id);
      return publish({ data: { contentId: id } });
    },
    onSuccess: () => {
      toast.success("Published");
      qc.invalidateQueries({ queryKey: ["scheduler-queue"] });
      qc.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["scheduler-queue"] });
    },
    onSettled: () => setBusy(null),
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-1">Queue posts, or publish straight to a connected account.</p>
        </div>
        <Link to="/library">
          <Button variant="outline" className="rounded-full">
            Manage library
          </Button>
        </Link>
      </div>

      {!data?.length ? (
        <div className="mt-6">
          <EmptyState
            icon={Clock}
            title="Your queue is empty"
            description="Drafts and scheduled posts show up here in publish order, so you always know what goes out next."
            actionLabel="Create a post"
            actionTo="/ai-studio"
          />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card">
          <ul className="divide-y divide-border/60">
            {data.map((i) => (
              <li key={i.id} className="p-4 flex items-center gap-3 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-secondary text-xs">{i.platform}</span>
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm line-clamp-1">{i.caption}</p>
                  {i.publish_error && <p className="text-xs text-destructive mt-1">{i.publish_error}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {i.published_at
                    ? `Live ${new Date(i.published_at).toLocaleString()}`
                    : i.scheduled_for
                      ? new Date(i.scheduled_for).toLocaleString()
                      : STATUS_LABEL[i.status] ?? i.status}
                </span>
                {i.status !== "published" && (
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => send.mutate(i.id)}
                    disabled={busy === i.id}
                  >
                    <Send className="h-3 w-3 mr-1" /> {busy === i.id ? "Publishing…" : "Publish now"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Connect Facebook, Instagram, X, LinkedIn or TikTok on each client page. Scheduled posts publish automatically
        once their time arrives.
      </p>
    </div>
  );
}
