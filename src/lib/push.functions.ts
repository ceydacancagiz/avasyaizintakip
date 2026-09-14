import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  link: z.string().optional(),
});

/** Sends a Web Push message to every registered device of the given users. */
export const sendPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const publicKey = process.env["VAPID_PUBLIC_KEY"];
    const privateKey = process.env["VAPID_PRIVATE_KEY"];
    const subject = process.env["VAPID_SUBJECT"] ?? "mailto:info@avasya.com.tr";
    if (!publicKey || !privateKey) return { sent: 0, reason: "missing-vapid" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", data.userIds);
    if (error || !subs || subs.length === 0) return { sent: 0 };

    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title: data.title,
      body: data.body ?? "",
      link: data.link ?? "/panel",
    });

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          const details = webpush.generateRequestDetails(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload,
            { TTL: 86400 },
          );
          const res = await fetch(details.endpoint, {
            method: "POST",
            headers: details.headers as Record<string, string>,
            body: details.body as BodyInit,
          });
          if (res.ok) sent += 1;
          else if (res.status === 404 || res.status === 410) stale.push(s.id);
        } catch (e) {
          console.error("push failed", e);
        }
      }),
    );

    if (stale.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("id", stale);
    }

    return { sent };
  });
