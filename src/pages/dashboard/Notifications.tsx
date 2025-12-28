import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";

type DoniaNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const dt = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - dt) / 1000));
  if (s < 60) return "À l’instant";
  const m = Math.floor(s / 60);
  if (m < 60) return "Il y a " + m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return "Il y a " + h + " h";
  const d = Math.floor(h / 24);
  return "Il y a " + d + " j";
}

const getIcon = (type: string) => {
  switch ((type || "info").toLowerCase()) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "info":
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function Notifications() {
  const { supabaseUser } = useUser();
  const [items, setItems] = useState<DoniaNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items]
  );

  async function load() {
    if (!supabaseUser?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", supabaseUser.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) setItems(data as DoniaNotification[]);
    setLoading(false);
  }

  async function markAllRead() {
    if (!supabaseUser?.id) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", supabaseUser.id)
      .eq("is_read", false);

    if (!error) await load();
  }

  useEffect(() => {
    load();
    // Realtime subscribe (Supabase Realtime must be enabled)
    if (!supabaseUser?.id) return;

    const channel = supabase
      .channel("donia-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: "user_id=eq." + supabaseUser.id },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUser?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {unreadCount} non lues
              </span>
            )}
          </div>

          <Button onClick={markAllRead} disabled={unreadCount === 0 || loading}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vos alertes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-muted-foreground">Chargement...</div>}

            {!loading && items.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Aucune notification pour le moment.
              </div>
            )}

            <div className="space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={
                    "flex items-start justify-between rounded-lg border p-4 " +
                    (n.is_read ? "bg-background" : "bg-primary/5")
                  }
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getIcon(n.type || "info")}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{n.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    </div>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
