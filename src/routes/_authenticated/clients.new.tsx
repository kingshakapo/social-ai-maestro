import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients/new")({
  head: () => ({ meta: [{ title: "New client — SocialPilot AI" }] }),
  component: NewClient,
});

const fields: { name: string; label: string; type?: "textarea" }[] = [
  { name: "business_name", label: "Business name" },
  { name: "website", label: "Website" },
  { name: "industry", label: "Industry" },
  { name: "country", label: "Country" },
  { name: "timezone", label: "Time zone" },
  { name: "target_audience", label: "Target audience", type: "textarea" },
  { name: "business_goals", label: "Business goals", type: "textarea" },
  { name: "products", label: "Products", type: "textarea" },
  { name: "services", label: "Services", type: "textarea" },
  { name: "brand_story", label: "Brand story", type: "textarea" },
  { name: "brand_voice", label: "Brand voice", type: "textarea" },
  { name: "tone", label: "Tone" },
  { name: "mission", label: "Mission", type: "textarea" },
  { name: "vision", label: "Vision", type: "textarea" },
  { name: "core_values", label: "Core values", type: "textarea" },
  { name: "usp", label: "Unique selling proposition", type: "textarea" },
  { name: "competitors", label: "Competitors", type: "textarea" },
  { name: "brand_colors", label: "Brand colors" },
  { name: "fonts", label: "Fonts" },
  { name: "keywords", label: "Keywords" },
  { name: "hashtags", label: "Preferred hashtags" },
  { name: "posting_frequency", label: "Posting frequency" },
  { name: "preferred_languages", label: "Preferred languages" },
  { name: "special_offers", label: "Special offers", type: "textarea" },
  { name: "contact_details", label: "Contact details", type: "textarea" },
];

function NewClient() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePlatform = (p: string) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name) {
      toast.error("Business name is required");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...form, preferred_platforms: platforms, owner_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Client created");
      navigate({ to: "/clients/$id", params: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">New client</h1>
      <p className="text-sm text-muted-foreground mt-1">Tell the AI everything it needs to become an expert on this brand.</p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h2 className="font-semibold tracking-tight">Preferred platforms</h2>
          <div className="flex flex-wrap gap-2">
            {["Instagram", "Facebook", "LinkedIn", "TikTok", "X", "Pinterest", "YouTube", "Threads"].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  platforms.includes(p)
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border text-foreground hover:border-foreground/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  rows={3}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : (
                <Input
                  id={f.name}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  required={f.name === "business_name"}
                />
              )}
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/clients" })}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create client"}</Button>
        </div>
      </form>
    </div>
  );
}