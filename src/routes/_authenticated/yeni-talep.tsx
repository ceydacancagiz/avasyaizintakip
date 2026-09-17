import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHolidays } from "@/hooks/useLeaves";
import { useQueryClient } from "@tanstack/react-query";
import { sendPush } from "@/lib/push.functions";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABEL,
  calculateBusinessDays,
  formatDateTR,
  fmtDays,
  remainingDays,
  type LeaveTypeValue,
} from "@/lib/leave-utils";
import { Loader2, Info } from "lucide-react";

const searchSchema = z.object({ date: z.string().optional() });

export const Route = createFileRoute("/_authenticated/yeni-talep")({
  ssr: false,
  validateSearch: searchSchema,
  component: YeniTalep,
});

function YeniTalep() {
  const { user, profile, refresh } = useAuth();
  const { date: prefill } = useSearch({ from: "/_authenticated/yeni-talep" });
  const { data: holidays = [] } = useHolidays();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [izinTuru, setIzinTuru] = useState<LeaveTypeValue>("yillik");
  const [start, setStart] = useState(prefill ?? "");
  const [end, setEnd] = useState(prefill ?? "");
  const [aciklama, setAciklama] = useState("");
  const [loading, setLoading] = useState(false);

  const totalDays = useMemo(() => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
    return calculateBusinessDays(s, e, holidays);
  }, [start, end, holidays]);

  const willExceed =
    izinTuru === "yillik" && profile && totalDays > remainingDays(profile);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!start || !end) {
      toast.error("Başlangıç ve bitiş tarihlerini seçin");
      return;
    }
    if (new Date(end) < new Date(start)) {
      toast.error("Bitiş tarihi başlangıçtan önce olamaz");
      return;
    }
    if (totalDays === 0) {
      toast.error("Seçilen aralıkta iş günü yok");
      return;
    }
    if (willExceed) {
      toast.error("Yıllık izin bakiyeniz yetersiz");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("leave_requests").insert({
      user_id: user.id,
      baslangic_tarihi: start,
      bitis_tarihi: end,
      izin_turu: izinTuru,
      toplam_gun: totalDays,
      aciklama: aciklama || null,
    });

    if (error) {
      setLoading(false);
      toast.error("Talep oluşturulamadı", { description: error.message });
      return;
    }

    // In-app notification for all managers
    try {
      const { data: managerRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "yonetici");
      const managerIds = (managerRoles ?? []).map((r) => r.user_id);
      if (managerIds.length > 0) {
        const title = `Yeni izin talebi — ${profile?.ad_soyad ?? "Çalışan"}`;
        const body = `${LEAVE_TYPE_LABEL[izinTuru]} · ${formatDateTR(start)} – ${formatDateTR(end)} · ${totalDays} gün`;
        await supabase.from("notifications").insert(
          managerIds.map((uid) => ({
            user_id: uid,
            title,
            body,
            link: "/onay-paneli",
          })),
        );
        await sendPush({
          data: { userIds: managerIds, title, body, link: "/onay-paneli" },
        });
      }
    } catch (e) {
      console.error("notification insert failed", e);
    }




    setLoading(false);
    toast.success("İzin talebi başarıyla iletildi", {
      description: "Yönetici onayı bekleniyor.",
    });
    await refresh();
    qc.invalidateQueries({ queryKey: ["leaves"] });
    nav({ to: "/taleplerim" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Yeni İzin Talebi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İzin bilgilerinizi girin, gün sayısı otomatik hesaplanır.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talep Formu</CardTitle>
          <CardDescription>
            Hafta sonları ve resmi tatiller gün sayısına dahil edilmez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label>İzin Türü</Label>
              <Select
                value={izinTuru}
                onValueChange={(v) => setIzinTuru(v as LeaveTypeValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s">Başlangıç Tarihi</Label>
                <Input
                  id="s"
                  type="date"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e">Bitiş Tarihi</Label>
                <Input
                  id="e"
                  type="date"
                  required
                  value={end}
                  min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 text-sm">
                <p>
                  Toplam iş günü:{" "}
                  <span className="font-semibold">{totalDays} gün</span>
                </p>
                {start && end && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTR(start)} – {formatDateTR(end)}
                  </p>
                )}
                {izinTuru === "yillik" && profile && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Kalan yıllık izin: {fmtDays(remainingDays(profile))} gün
                    {willExceed && (
                      <span className="ml-1 font-medium text-destructive">
                        — bakiyeyi aşıyor!
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="a">Açıklama (opsiyonel)</Label>
              <Textarea
                id="a"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="İzin nedeni veya ek bilgi..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => nav({ to: "/panel" })}
              >
                İptal
              </Button>
              <Button type="submit" disabled={loading || willExceed || totalDays === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Talebi Gönder
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
