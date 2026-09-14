import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY =
  "BCK_G_o7cX7B-K83gD5Q5tuZ0GBM5IF8zrT3cIU1TWPgww3LUYrL86o4JK5yHeGWMRpKryhgq-XQ7VeYBzO88mc";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function bufToBase64Url(buf: ArrayBuffer | null) {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Registers the messaging service worker and stores the push subscription. */
export async function enablePush(userId: string) {
  if (!pushSupported()) return "unsupported" as const;

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") return permission as NotificationPermission;

  const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: Record<string, string> };
  const p256dh = json.keys?.p256dh ?? bufToBase64Url(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? bufToBase64Url(sub.getKey("auth"));

  await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh,
      auth,
    },
    { onConflict: "endpoint" },
  );

  return "granted" as const;
}
