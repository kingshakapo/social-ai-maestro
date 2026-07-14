import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/brand-kits")({
  head: () => ({ meta: [{ title: "Brand Kits — SocialPilot AI" }] }),
  component: BrandKitsPage,
});

function BrandKitsPage() {
  const { data } = useQuery({
    queryKey: ["brand-kits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, business_name, brand_colors, fonts, logo_url, brand_voice, tone")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Brand Kits</h1>
      <p className="text-sm text-muted-foreground mt-1">Visual identity and voice per client.</p>

      {!data?.length ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          Add a client to create their brand kit.
        </div>
      ) : (
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((c) => (
            <Link key={c.id} to="/clients/$id" params={{ id: c.id }} className="rounded-2xl border border-border/60 bg-card p-5 hover:border-foreground/30 transition">
              <div className="flex items-center gap-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center text-sm font-bold">
                    {c.business_name?.[0] ?? "?"}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{c.business_name}</h3>
                  <p className="text-xs text-muted-foreground">{c.tone ?? "No tone set"}</p>
                </div>
              </div>
              {c.brand_colors && (
                <div className="mt-4 flex gap-1.5">
                  {c.brand_colors.split(",").slice(0, 5).map((color, i) => (
                    <div key={i} className="h-6 w-6 rounded-md border border-border/60" style={{ background: color.trim() }} />
                  ))}
                </div>
              )}
              {c.fonts && <p className="text-xs text-muted-foreground mt-3">Fonts: {c.fonts}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}