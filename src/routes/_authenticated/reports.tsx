import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — SocialPilot AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: clients } = useQuery({
    queryKey: ["report-clients"],
    queryFn: async () => (await supabase.from("clients").select("id, business_name")).data ?? [],
  });

  const exportCsv = async (clientId: string, name: string) => {
    const { data } = await supabase
      .from("generated_content")
      .select("platform, content_type, caption, status, created_at")
      .eq("client_id", clientId);
    const rows = [["Platform", "Type", "Caption", "Status", "Created"], ...(data ?? []).map((r) => [
      r.platform, r.content_type, `"${(r.caption ?? "").replace(/"/g, '""')}"`, r.status, r.created_at,
    ])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-report.csv`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
      <p className="text-sm text-muted-foreground mt-1">Export client-ready content reports.</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card">
        {!clients?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No clients yet.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {clients.map((c) => (
              <li key={c.id} className="p-4 flex items-center">
                <span className="flex-1 font-medium">{c.business_name}</span>
                <Button size="sm" variant="outline" onClick={() => exportCsv(c.id, c.business_name)}>
                  <Download className="h-3 w-3 mr-1" /> CSV
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}