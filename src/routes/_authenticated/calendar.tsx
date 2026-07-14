import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — SocialPilot AI" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data } = useQuery({
    queryKey: ["calendar-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("generated_content")
        .select("id, platform, content_type, caption, scheduled_for, status")
        .not("scheduled_for", "is", null)
        .order("scheduled_for", { ascending: true });
      return data ?? [];
    },
  });

  const groups: Record<string, typeof data> = {};
  (data ?? []).forEach((item) => {
    const d = new Date(item.scheduled_for!).toDateString();
    (groups[d] ||= []).push(item);
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
      <p className="text-sm text-muted-foreground mt-1">Everything scheduled across your clients.</p>

      {!data?.length ? (
        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          Nothing scheduled yet. Schedule posts from the Content Library.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {Object.entries(groups).map(([day, items]) => (
            <div key={day} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{day}</div>
              <ul className="mt-3 divide-y divide-border/60">
                {items!.map((i) => (
                  <li key={i.id} className="py-3 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-secondary text-xs">{i.platform}</span>
                    <div className="flex-1">
                      <p className="text-sm line-clamp-2">{i.caption}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(i.scheduled_for!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {i.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}