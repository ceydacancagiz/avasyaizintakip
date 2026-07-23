import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAllLeaves, useProfiles } from "@/hooks/useLeaves";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LEAVE_TYPE_LABEL, formatDateTR } from "@/lib/leave-utils";
import { toast } from "sonner";
import { Check, X, ShieldCheck } from "lucide-react";
import type { LeaveRequest } from "@/hooks/useLeaves";

export const Route = createFileRoute("/_authenticated/onay-paneli")({
  ssr: false,
  component: OnayPaneliPage,
});

function OnayPaneliPage() {
  const { isManager, user, loading } = useAuth();
  const nav = useNavigate();
  const { data: all = [] } = useAllLeaves();
  const { data: profiles = [] } = useProfiles();
  const qc = useQueryClient();

  const [rejectFor, setRejectFor] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isManager) nav({ to: "/panel", replace: true });
  }, [loading, isManager, nav]);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.ad_soyad));
    return m;
  }, [profiles]);

  const pending = all.filter((l) => l.durum === "beklemede");
  const approved = all.filter((l) => l.durum === "onaylandi");
  const rejected = all.filter((l) => l.durum === "reddedildi");

  const approve = async (l: LeaveRequest) => {
    setBusy(l.id);
    const { error } = await supabase
      .from("leave_requests")
      .update({ durum: "onaylandi", onaylayan_id: user?.id, red_nedeni: null })
      .eq("id", l.id);
    setBusy(null);
    if (error) return toast.error("Onaylanamadı", { description: error.message });
    toast.success("Talep onaylandı", {
      description: `${nameById.get(l.user_id)} · ${l.toplam_gun} gün`,
    });
    // Notify the requesting employee
    await supabase.from("notifications").insert({
      user_id: l.user_id,
      title: "İzin talebiniz onaylandı ✅",
      body: `${LEAVE_TYPE_LABEL[l.izin_turu]} · ${formatDateTR(l.baslangic_tarihi)} – ${formatDateTR(l.bitis_tarihi)} · ${l.toplam_gun} gün`,
      link: "/taleplerim",
    });
    qc.invalidateQueries({ queryKey: ["leaves"] });
    qc.invalidateQueries({ queryKey: ["profiles"] });
  };

  const reject = async () => {
    if (!rejectFor) return;
    if (!rejectReason.trim()) {
      toast.error("Red nedeni zorunludur");
      return;
    }
    setBusy(rejectFor.id);
    const { error } = await supabase
      .from("leave_requests")
      .update({
        durum: "reddedildi",
        red_nedeni: rejectReason.trim(),
        onaylayan_id: user?.id,
      })
      .eq("id", rejectFor.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Talep reddedildi");
    // Notify the requesting employee
    await supabase.from("notifications").insert({
      user_id: rejectFor.user_id,
      title: "İzin talebiniz reddedildi ❌",
      body: `${LEAVE_TYPE_LABEL[rejectFor.izin_turu]} · ${formatDateTR(rejectFor.baslangic_tarihi)} – ${formatDateTR(rejectFor.bitis_tarihi)} · Neden: ${rejectReason.trim()}`,
      link: "/taleplerim",
    });
    qc.invalidateQueries({ queryKey: ["leaves"] });
    setRejectFor(null);
    setRejectReason("");
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-red/10 text-brand-red">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Onay Yönetim Paneli
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Çalışan izin taleplerini inceleyin, onaylayın veya reddedin.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {pending.length} bekleyen talep
        </Badge>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Bekleyen ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Onaylanan ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Reddedilen ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen Talepler</CardTitle>
              <CardDescription>Sıraya göre eskilerden yenilere</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestTable
                items={pending}
                nameById={nameById}
                actions={(l) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectFor(l)}
                      disabled={busy === l.id}
                    >
                      <X className="mr-1 h-4 w-4" /> Reddet
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approve(l)}
                      disabled={busy === l.id}
                    >
                      <Check className="mr-1 h-4 w-4" /> Onayla
                    </Button>
                  </div>
                )}
                empty="Onay bekleyen talep yok. 🎉"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Onaylanmış Talepler</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTable items={approved} nameById={nameById} empty="Kayıt yok" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Reddedilmiş Talepler</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTable
                items={rejected}
                nameById={nameById}
                empty="Kayıt yok"
                showReason
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talebi Reddet</DialogTitle>
            <DialogDescription>
              {rejectFor && (
                <>
                  {nameById.get(rejectFor.user_id)} ·{" "}
                  {formatDateTR(rejectFor.baslangic_tarihi)} –{" "}
                  {formatDateTR(rejectFor.bitis_tarihi)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rr">Red Nedeni *</Label>
            <Textarea
              id="rr"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Talebin reddedilme nedenini açıklayın..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={reject}
              disabled={busy === rejectFor?.id}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestTable({
  items,
  nameById,
  actions,
  empty,
  showReason,
}: {
  items: LeaveRequest[];
  nameById: Map<string, string>;
  actions?: (l: LeaveRequest) => React.ReactNode;
  empty: string;
  showReason?: boolean;
}) {
  if (items.length === 0)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
    );
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Çalışan</TableHead>
            <TableHead>Tarih Aralığı</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-center">Gün</TableHead>
            <TableHead>{showReason ? "Red Nedeni" : "Açıklama"}</TableHead>
            {actions && <TableHead className="text-right">İşlem</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-medium">
                {nameById.get(l.user_id) ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDateTR(l.baslangic_tarihi)} – {formatDateTR(l.bitis_tarihi)}
              </TableCell>
              <TableCell className="text-sm">{LEAVE_TYPE_LABEL[l.izin_turu]}</TableCell>
              <TableCell className="text-center text-sm font-medium">
                {l.toplam_gun}
              </TableCell>
              <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                {showReason ? l.red_nedeni || "-" : l.aciklama || "-"}
              </TableCell>
              {actions && <TableCell>{actions(l)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
