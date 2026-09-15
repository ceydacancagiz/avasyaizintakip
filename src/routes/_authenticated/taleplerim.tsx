import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useMyLeaves } from "@/hooks/useLeaves";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAVE_TYPE_LABEL, STATUS_LABEL, formatDateTR } from "@/lib/leave-utils";
import { toast } from "sonner";
import { PlusCircle, Trash2, FileText, Printer } from "lucide-react";
import { useState } from "react";
import { LeaveFormPrint } from "@/components/LeaveFormPrint";
import type { LeaveRequest } from "@/hooks/useLeaves";

export const Route = createFileRoute("/_authenticated/taleplerim")({
  ssr: false,
  component: TaleplerimPage,
});

function TaleplerimPage() {
  const { user, profile } = useAuth();
  const { data: leaves = [], isLoading } = useMyLeaves(user?.id);
  const qc = useQueryClient();
  const [printLeave, setPrintLeave] = useState<LeaveRequest | null>(null);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("leave_requests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Talep silindi");
    qc.invalidateQueries({ queryKey: ["leaves"] });
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Taleplerim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tüm izin taleplerinizi ve durumlarını buradan takip edin.
          </p>
        </div>
        <Button asChild>
          <Link to="/yeni-talep">
            <PlusCircle className="mr-2 h-4 w-4" /> Yeni Talep
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geçmiş Taleplerim</CardTitle>
          <CardDescription>
            {leaves.length} kayıt · beklemedeki talepleri silebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Yükleniyor...
            </p>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                Henüz izin talebiniz yok.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/yeni-talep">İlk talebinizi oluşturun</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih Aralığı</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-center">Gün</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTR(l.baslangic_tarihi)} –{" "}
                        {formatDateTR(l.bitis_tarihi)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {LEAVE_TYPE_LABEL[l.izin_turu]}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {l.toplam_gun}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                        {l.aciklama || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={l.durum} reason={l.red_nedeni} />
                      </TableCell>
                      <TableCell className="text-right">
                        {l.durum === "onaylandi" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPrintLeave(l)}
                          >
                            <Printer className="mr-1 h-4 w-4" /> Yazdır
                          </Button>
                        )}
                        {l.durum === "beklemede" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancel(l.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({
  status,
  reason,
}: {
  status: "beklemede" | "onaylandi" | "reddedildi";
  reason: string | null;
}) {
  const cls =
    status === "onaylandi"
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      : status === "reddedildi"
        ? "bg-red-100 text-red-800 hover:bg-red-100"
        : "bg-amber-100 text-amber-800 hover:bg-amber-100";
  return (
    <div className="flex flex-col gap-1">
      <Badge className={cls} variant="secondary">
        {STATUS_LABEL[status]}
      </Badge>
      {status === "reddedildi" && reason && (
        <span className="text-[11px] text-muted-foreground">Neden: {reason}</span>
      )}
    </div>
  );
}
