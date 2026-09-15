import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, User as UserIcon, Mail, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profil")({
  ssr: false,
  component: ProfilPage,
});

function ProfilPage() {
  const { profile, isManager, refresh } = useAuth();
  const [adSoyad, setAdSoyad] = useState(profile?.ad_soyad ?? "");
  const [departman, setDepartman] = useState(profile?.departman ?? "");
  const [personelKodu, setPersonelKodu] = useState(profile?.personel_kodu ?? "");
  const [tcKimlik, setTcKimlik] = useState(profile?.tc_kimlik ?? "");
  const [iseGiris, setIseGiris] = useState(profile?.ise_giris_tarihi ?? "");
  const [gorev, setGorev] = useState(profile?.gorev ?? "");
  const [izinAdresi, setIzinAdresi] = useState(profile?.izin_adresi ?? "");
  const [izinTelefonu, setIzinTelefonu] = useState(profile?.izin_telefonu ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ad_soyad: adSoyad,
        departman,
        personel_kodu: personelKodu || null,
        tc_kimlik: tcKimlik || null,
        ise_giris_tarihi: iseGiris || null,
        gorev: gorev || null,
        izin_adresi: izinAdresi || null,
        izin_telefonu: izinTelefonu || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil güncellendi");
    await refresh();
  };

  if (!profile) return null;

  const used = profile.toplam_yillik_izin - profile.kalan_izin_gunu;
  const pct = Math.min(100, Math.round((used / profile.toplam_yillik_izin) * 100));

  const initials = profile.ad_soyad
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Profilim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kişisel bilgilerinizi ve izin bakiyenizi buradan görüntüleyin.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold">{profile.ad_soyad}</h2>
              <Badge variant={isManager ? "default" : "secondary"}>
                {isManager ? "Yönetici" : "Çalışan"}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </span>
              {profile.departman && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {profile.departman}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yıllık İzin Bakiyesi</CardTitle>
          <CardDescription>
            {used} gün kullanıldı · {profile.kalan_izin_gunu} gün kaldı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-3" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <BalanceStat label="Toplam" value={profile.toplam_yillik_izin} />
            <BalanceStat label="Kullanılan" value={used} accent="destructive" />
            <BalanceStat label="Kalan" value={profile.kalan_izin_gunu} accent="success" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bilgilerimi Güncelle</CardTitle>
          <CardDescription>
            Bu bilgiler izin formuna otomatik yazılır; bir kez doldurmanız yeterli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n">
                <UserIcon className="mr-1 inline h-3.5 w-3.5" /> Ad Soyad
              </Label>
              <Input
                id="n"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">
                <Building2 className="mr-1 inline h-3.5 w-3.5" /> Departman
              </Label>
              <Input
                id="d"
                value={departman}
                onChange={(e) => setDepartman(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pk">Personel Kodu</Label>
                <Input
                  id="pk"
                  value={personelKodu}
                  onChange={(e) => setPersonelKodu(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tc">SSK Sicil No - T.C. Kimlik</Label>
                <Input
                  id="tc"
                  value={tcKimlik}
                  onChange={(e) => setTcKimlik(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">İşe Giriş Tarihi</Label>
                <Input
                  id="ig"
                  type="date"
                  value={iseGiris}
                  onChange={(e) => setIseGiris(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gv">Görevi</Label>
                <Input
                  id="gv"
                  value={gorev}
                  onChange={(e) => setGorev(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ia">İzindeki Adresi</Label>
                <Input
                  id="ia"
                  value={izinAdresi}
                  onChange={(e) => setIzinAdresi(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it">İzindeki Telefonu</Label>
                <Input
                  id="it"
                  value={izinTelefonu}
                  onChange={(e) => setIzinTelefonu(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "destructive" | "success";
}) {
  const color =
    accent === "destructive"
      ? "text-destructive"
      : accent === "success"
        ? "text-emerald-600"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-3">
      <p className="text-2xl font-bold tracking-tight">
        <span className={color}>{value}</span>
      </p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
