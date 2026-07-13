import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({ meta: [{ title: "Clients — SocialPilot AI" }] }),
  component: ClientsList,
});

function ClientsList() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, business_name, industry, brand_voice, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">A workspace for every brand you manage.</p>
        </div>
        <Link to="/clients/new"><Button className="rounded-full"><Plus className="h-4 w-4" /> New client</Button></Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !clients?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No clients yet</h2>
          <p className="text-sm text-muted-foreground mt-1">Create your first client workspace to unlock the AI.</p>
          <Link to="/clients/new"><Button className="mt-6 rounded-full">Create client</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              to="/clients/$id"
              params={{ id: c.id }}
              className="rounded-2xl border border-border/60 bg-card p-5 hover:shadow-sm hover:border-border transition"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center font-semibold text-sm">
                {c.business_name.slice(0, 1).toUpperCase()}
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{c.business_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{c.industry || "—"}</p>
              {c.brand_voice && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{c.brand_voice}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}