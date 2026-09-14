import { Bell, BellRing } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotifications,
  markNotificationRead,
  markAllRead,
  requestNotificationPermission,
} from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { enablePush } from "@/lib/push-client";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

export function NotificationBell() {
  const { user } = useAuth();
  const { data: items = [] } = useNotifications();
  const qc = useQueryClient();
  const unread = items.filter((n) => !n.read).length;
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  useEffect(() => {
    if (!user) return;
    if (Notification.permission === "granted") {
      // keep the device subscription fresh
      enablePush(user.id).catch((e) => console.error("push enable failed", e));
    } else if (perm === "default") {
      requestNotificationPermission().then(async (p) => {
        setPerm(p as NotificationPermission);
        if (p === "granted") await enablePush(user.id).catch(() => undefined);
      });
    }
  }, [perm, user]);


  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-semibold">Bildirimler</p>
          {unread > 0 && user && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={async () => {
                await markAllRead(user.id);
                refresh();
              }}
            >
              Tümünü okundu işaretle
            </button>
          )}
        </div>
        {perm !== "granted" && perm !== "unsupported" && (
          <div className="flex items-center justify-between gap-2 border-b bg-brand-red/5 p-3">
            <div className="flex items-start gap-2">
              <BellRing className="mt-0.5 h-4 w-4 text-brand-red" />
              <p className="text-xs text-muted-foreground">
                Masaüstü bildirimleri kapalı. Yeni izin talepleri için etkinleştirin.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 text-xs"
              onClick={async () => {
                const p = user
                  ? await enablePush(user.id)
                  : await requestNotificationPermission();
                setPerm(p as NotificationPermission);
              }}
            >
              Aç
            </Button>
          </div>
        )}
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Henüz bildirim yok
            </p>
          ) : (
            items.map((n) => {
              const inner = (
                <div
                  className={`border-b p-3 text-sm transition-colors hover:bg-muted/50 ${!n.read ? "bg-brand-red/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{n.title}</p>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-red" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                  )}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              );
              const onClick = async () => {
                if (!n.read) {
                  await markNotificationRead(n.id);
                  refresh();
                }
              };
              return n.link ? (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={onClick}
                  className="block"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={n.id}
                  onClick={onClick}
                  className="block w-full text-left"
                >
                  {inner}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
