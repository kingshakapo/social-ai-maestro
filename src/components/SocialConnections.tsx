import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link2, Unlink } from "lucide-react";
import {
  getPlatformStatus,
  listSocialAccounts,
  startSocialConnect,
  disconnectSocialAccount,
} from "@/lib/social.functions";

const LABELS: Record<string, string> = {
  meta: "Facebook & Instagram",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const ACCOUNT_LABELS: Record<string, string> = {
  facebook: "Facebook Page",
  instagram: "Instagram",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function SocialConnections({ clientId }: { clientId?: string | null }) {
  const qc = useQueryClient();
  const status = useServerFn(getPlatformStatus);
  const list = useServerFn(listSocialAccounts);
  const start = useServerFn(startSocialConnect);
  const disconnect = useServerFn(disconnectSocialAccount);

  const { data: providers } = useQuery({ queryKey: ["platform-status"], queryFn: () => status({}) });
  const { data: accounts } = useQuery({
    queryKey: ["social-accounts", clientId ?? "all"],
    queryFn: () => list({ data: { clientId: clientId ?? null } }),
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const connected = p.get("connected");
    if (!connected) return;
    const message = p.get("message") ?? "";
    if (connected === "1") toast.success(message || "Account connected");
    else toast.error(message || "Could not connect that account");
    qc.invalidateQueries({ queryKey: ["social-accounts"] });
    window.history.replaceState({}, "", window.location.pathname);
  }, [qc]);

  const connect = useMutation({
    mutationFn: async (platform: string) => {
      const res = await start({
        data: { platform: platform as never, clientId: clientId ?? null, origin: window.location.origin },
      });
      window.location.href = res.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => disconnect({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
      toast.success("Disconnected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-semibold tracking-tight">Publishing connections</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Connect the accounts you publish to. Scheduled posts go out automatically once an account is connected.
      </p>

      {!!accounts?.length && (
        <ul className="mt-5 divide-y divide-border/60">
          {accounts.map((a) => (
            <li key={a.id} className="py-3 flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-secondary text-xs">
                {ACCOUNT_LABELS[a.platform] ?? a.platform}
              </span>
              <span className="text-sm">{a.account_name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => remove.mutate(a.id)}
                disabled={remove.isPending}
              >
                <Unlink className="h-3 w-3 mr-1" /> Disconnect
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {(providers ?? []).map((p) => (
          <Button
            key={p.platform}
            variant="outline"
            className="rounded-full"
            disabled={!p.configured || connect.isPending}
            onClick={() => connect.mutate(p.platform)}
          >
            <Link2 className="h-4 w-4 mr-1" /> Connect {LABELS[p.platform] ?? p.platform}
          </Button>
        ))}
      </div>

      {providers?.some((p) => !p.configured) && (
        <p className="mt-3 text-xs text-muted-foreground">
          Greyed-out buttons need that platform's developer app details added before they can be connected.
        </p>
      )}
    </div>
  );
}
