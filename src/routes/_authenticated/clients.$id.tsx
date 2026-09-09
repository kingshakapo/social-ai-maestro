import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SocialConnections } from "@/components/SocialConnections";

export const Route = createFileRoute("/_authenticated/clients/$id")({
  head: () => ({ meta: [{ title: "Client — SocialPilot AI" }] }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: content } = useQuery({
    queryKey: ["client-content", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, content_type, caption, hashtags, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleDelete = async () => {
    if (!confirm("Delete this client and all its content?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Client deleted");
    navigate({ to: "/clients" });
  };

  if (!client) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  const info: [string, string | null | undefined][] = [
    ["Industry", client.industry],
    ["Website", client.website],
    ["Country", client.country],
    ["Time zone", client.timezone],
    ["Audience", client.target_audience],
    ["Voice", client.brand_voice],
    ["Tone", client.tone],
    ["USP", client.usp],
    ["Mission", client.mission],
    ["Keywords", client.keywords],
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link to="/clients" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-3 w-3" /> All clients</Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{client.business_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{client.industry || "Brand workspace"}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-studio" search={{ client: id } as never}>
            <Button className="rounded-full"><Wand2 className="h-4 w-4" /> Generate content</Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {info.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k}</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{v || <span className="text-muted-foreground">—</span>}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <SocialConnections clientId={id} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-semibold tracking-tight mb-4">Content for this client</h2>
        {!content?.length ? (
          <p className="text-sm text-muted-foreground">Nothing generated yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {content.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-secondary rounded">{c.platform}</span>
                  <span>{c.content_type}</span>
                </div>
                <p className="text-sm mt-1.5 whitespace-pre-wrap">{c.caption}</p>
                {c.hashtags && <p className="text-xs text-accent mt-1.5">{c.hashtags}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}