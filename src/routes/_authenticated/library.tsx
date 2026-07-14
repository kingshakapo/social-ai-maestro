import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Content Library — SocialPilot AI" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, content_type, caption, hashtags, cta, status, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("generated_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Deleted");
    },
  });

  const schedule = useMutation({
    mutationFn: async (id: string) => {
      const when = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("generated_content").update({ status: "scheduled", scheduled_for: when }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library"] });
      toast.success("Scheduled for tomorrow");
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Content Library</h1>
      <p className="text-sm text-muted-foreground mt-1">Every piece of content your AI has generated.</p>

      {!data?.length ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </div>
      ) : (
        <div className="mt-8 grid md:grid-cols-2 gap-3">
          {data.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-1.5 py-0.5 bg-secondary rounded">{c.platform}</span>
                <span className="text-muted-foreground">{c.content_type}</span>
                <span className="ml-auto text-muted-foreground capitalize">{c.status}</span>
              </div>
              <p className="text-sm mt-3 whitespace-pre-wrap line-clamp-6">{c.caption}</p>
              {c.hashtags && <p className="text-xs text-accent mt-2">{c.hashtags}</p>}
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(c.caption); toast.success("Copied"); }}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
                {c.status !== "scheduled" && (
                  <Button size="sm" variant="outline" onClick={() => schedule.mutate(c.id)}>Schedule</Button>
                )}
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}