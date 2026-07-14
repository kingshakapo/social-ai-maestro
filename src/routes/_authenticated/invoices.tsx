import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({ meta: [{ title: "Invoices — SocialPilot AI" }] }),
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
      <p className="text-sm text-muted-foreground mt-1">Bill your clients for social media services.</p>

      <div className="mt-10 rounded-2xl border border-border/60 bg-card p-10 text-center">
        <Receipt className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="mt-4 font-semibold">Connect a payment provider</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Enable Stripe or Paddle to send invoices, track payments, and manage subscriptions
          for each client retainer.
        </p>
      </div>
    </div>
  );
}