import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SocialConnections } from "@/components/SocialConnections";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — SocialPilot AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
        setFullName(p?.full_name ?? "");
      }
    })();
  }, []);

  const save = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName });
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage your account.</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <Button onClick={save}>Save changes</Button>
      </div>

      <div className="mt-6">
        <SocialConnections />
      </div>
    </div>
  );
}