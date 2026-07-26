import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
};

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="mx-auto h-11 w-11 rounded-2xl bg-secondary grid place-items-center">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="inline-block mt-5">
          <Button className="rounded-full">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}