import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  employeeName: z.string(),
  employeeEmail: z.string().email(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number().int(),
  description: z.string().nullable().optional(),
});

const RECIPIENT = "evrim.baykal@avasya.com.tr";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/microsoft_outlook";

export const sendLeaveRequestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const OUTLOOK_KEY = process.env.MICROSOFT_OUTLOOK_API_KEY;

    if (!LOVABLE_API_KEY || !OUTLOOK_KEY) {
      return {
        sent: false,
        reason:
          "Microsoft Outlook bağlantısı yapılmamış. Yönetici bağlantıyı ekledikten sonra e-postalar gönderilecek.",
      };
    }

    const subject = `Yeni İzin Talebi — ${data.employeeName} (${data.totalDays} gün)`;
    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
        <h2 style="color:#b91c1c;margin:0 0 12px">Yeni İzin Talebi</h2>
        <p><strong>${data.employeeName}</strong> yeni bir izin talebi oluşturdu.</p>
        <table style="border-collapse:collapse;margin-top:12px">
          <tr><td style="padding:6px 12px;color:#64748b">Çalışan</td><td style="padding:6px 12px"><strong>${data.employeeName}</strong> &lt;${data.employeeEmail}&gt;</td></tr>
          <tr><td style="padding:6px 12px;color:#64748b">İzin Türü</td><td style="padding:6px 12px">${data.leaveType}</td></tr>
          <tr><td style="padding:6px 12px;color:#64748b">Tarih</td><td style="padding:6px 12px">${data.startDate} – ${data.endDate}</td></tr>
          <tr><td style="padding:6px 12px;color:#64748b">Toplam Gün</td><td style="padding:6px 12px"><strong>${data.totalDays}</strong></td></tr>
          ${data.description ? `<tr><td style="padding:6px 12px;color:#64748b;vertical-align:top">Açıklama</td><td style="padding:6px 12px">${data.description}</td></tr>` : ""}
        </table>
        <p style="margin-top:20px;color:#64748b;font-size:13px">Onaylamak için Avasya İzin Yönetim uygulamasındaki Onay Paneli'ni açın.</p>
      </div>
    `;

    const resp = await fetch(`${GATEWAY_URL}/me/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": OUTLOOK_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: RECIPIENT } }],
        },
        saveToSentItems: true,
      }),
    });

    if (!resp.ok) {
      const errorBody = await resp.text();
      console.error(`Outlook sendMail failed [${resp.status}]: ${errorBody}`);
      return { sent: false, reason: `E-posta gönderilemedi (${resp.status})` };
    }
    return { sent: true };
  });
