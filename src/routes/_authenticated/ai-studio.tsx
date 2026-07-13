import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateSocialContent } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-studio")({
  head: () => ({ meta: [{ title: "AI Studio — SocialPilot AI" }] }),
  component: AiStudio,
});

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "TikTok", "X", "Threads", "Pinterest", "YouTube"];
const TYPES = ["Post", "Carousel", "Story", "Reel caption", "Thread", "Ad copy", "Announcement", "Educational tip"];

function AiStudio() {
  const qc = useQueryClient();
  const generate = useServerFn(generateSocialContent);
  const [clientId, setClientId] = useState<string>("none");
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("Post");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ caption: string; hashtags: string; cta: string; image_brief: string } | null>(null);

  const { data: clients } = useQuery({
    queryKey: ["clients-select"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, business_name").order("business_name");
      return data ?? [];
    },
  });

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return toast.error("Enter a prompt");
    setLoading(true);
    setResult(null);
    try {
      const res = await generate({
        data: {
          clientId: clientId === "none" ? null : clientId,
          platform,
          contentType,
          prompt,
          save: true,
        },
      });
      setResult(res);
      qc.invalidateQueries({ queryKey: ["recent-content"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Generated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      if (msg.includes("429")) toast.error("Rate limit reached. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits to continue.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">AI Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate on-brand content in seconds.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={run} className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client (generic)</SelectItem>
                {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>What should this post be about?</Label>
            <Textarea
              rows={5}
              placeholder="Announce our summer collection launch with a playful, confident tone…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
            <Sparkles className="h-4 w-4" /> {loading ? "Generating…" : "Generate content"}
          </Button>
        </form>

        <div className="rounded-2xl border border-border/60 bg-card p-6 min-h-[400px]">
          {!result && !loading && (
            <div className="h-full grid place-items-center text-center text-sm text-muted-foreground py-16">
              <div>
                <Sparkles className="h-6 w-6 mx-auto mb-3 text-accent" />
                Your generated content will appear here.
              </div>
            </div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Thinking…</div>}
          {result && (
            <div className="space-y-5">
              <Field label="Caption" value={result.caption} onCopy={copy} />
              <Field label="Hashtags" value={result.hashtags} onCopy={copy} />
              <Field label="Call to action" value={result.cta} onCopy={copy} />
              <Field label="Image brief" value={result.image_brief} onCopy={copy} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy: (t: string) => void }) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <button type="button" onClick={() => onCopy(value)} className="text-muted-foreground hover:text-foreground">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-sm whitespace-pre-wrap">{value}</div>
    </div>
  );
}