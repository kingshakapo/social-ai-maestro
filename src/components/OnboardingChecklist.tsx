import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X } from "lucide-react";

export function OnboardingChecklist({
  hasClient,
  hasContent,
  hasScheduled,
}: {
  hasClient: boolean;
  hasContent: boolean;
  hasScheduled: boolean;
}) {
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["onboarding-profile"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("onboarding_completed").maybeSingle();
      return data;
    },
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", uid);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-profile"] }),
  });

  const steps = [
    {
      title: "Add your first client",
      desc: "Upload the brand DNA once — voice, audience, offers, colors.",
      done: hasClient,
      to: "/clients/new",
      cta: "Add client",
    },
    {
      title: "Generate on-brand content",
      desc: "Pick a platform, describe the goal, get caption + hashtags + visual.",
      done: hasContent,
      to: "/ai-studio",
      cta: "Open AI Studio",
    },
    {
      title: "Schedule a post",
      desc: "Send it to the queue and see it land on the calendar.",
      done: hasScheduled,
      to: "/library",
      cta: "Open library",
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (profile?.onboarding_completed || allDone) return null;

  const next = steps.find((s) => !s.done);

  return (
    <div className="relative rounded-2xl border border-border/60 bg-card p-6 mb-8">
      <button
        type="button"
        aria-label="Dismiss setup guide"
        onClick={() => dismiss.mutate()}
        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="font-semibold tracking-tight">Get set up in 3 steps</h2>
        <span className="text-xs text-muted-foreground">
          {steps.filter((s) => s.done).length}/{steps.length} done
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-3">
            <div
              className={`h-6 w-6 shrink-0 rounded-full grid place-items-center text-xs font-medium ${
                s.done ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
              }`}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-medium ${s.done ? "line-through text-muted-foreground" : ""}`}>
                {s.title}
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {next && (
        <Link to={next.to} className="inline-block mt-5">
          <Button className="rounded-full">{next.cta}</Button>
        </Link>
      )}
    </div>
  );
}