import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Calendar, Users, LineChart, Wand2, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="h-7 w-7 rounded-lg bg-foreground text-background grid place-items-center text-xs font-bold">S</div>
            SocialPilot AI
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-secondary text-muted-foreground mb-8">
          <Sparkles className="h-3 w-3" /> AI operating system for social media
        </div>
        <h1 className="text-5xl sm:text-7xl font-semibold tracking-tighter leading-[1.05]">
          One workspace.<br />
          <span className="text-muted-foreground">Every client, on brand.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your client's brand once. SocialPilot AI plans, writes, and organizes their entire social presence — in their voice.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="rounded-full h-12 px-6">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, title: "Client workspaces", desc: "A dedicated brand DNA profile for every client." },
          { icon: Wand2, title: "AI content studio", desc: "Captions, hooks, hashtags, image briefs — instantly." },
          { icon: Calendar, title: "Content calendars", desc: "7 to 365-day plans, ready to schedule." },
          { icon: Zap, title: "Campaign builder", desc: "Full launch campaigns from a single prompt." },
          { icon: LineChart, title: "Analytics & reports", desc: "White-labeled monthly reports for every client." },
          { icon: Sparkles, title: "Always on-brand", desc: "Consistent voice across every post, every platform." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-6 hover:shadow-sm transition-shadow">
            <Icon className="h-5 w-5 text-accent" />
            <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SocialPilot AI
      </footer>
    </div>
  );
}
