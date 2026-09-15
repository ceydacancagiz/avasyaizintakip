import { addDays, format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { LeaveRequest, Profile } from "@/hooks/useLeaves";

function d(v: string | null | undefined) {
  if (!v) return "";
  try {
    return format(parseISO(v), "dd.MM.yyyy");
  } catch {
    return "";
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td className="w-[38%] border border-black px-2 py-[6px] text-[12px] font-semibold">
        {label}
      </td>
      <td className="border border-black px-2 py-[6px] text-[12px]">{value}</td>
    </tr>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span className="mr-1 inline-block h-[11px] w-[11px] border border-black text-center text-[9px] leading-[10px]">
      {checked ? "X" : ""}
    </span>
  );
}

export function LeaveFormPrint({
  open,
  onOpenChange,
  leave,
  profile,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leave: LeaveRequest | null;
  profile: Profile | null | undefined;
}) {
  if (!leave) return null;
  const donus = leave.bitis_tarihi
    ? format(addDays(parseISO(leave.bitis_tarihi), 1), "dd.MM.yyyy")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>İzin Kullanım Talep Formu</DialogTitle>
        </DialogHeader>

        <div id="izin-form-print" className="bg-white p-6 text-black">
          <div className="mb-3 flex items-center gap-3 border-b-2 border-black pb-3">
            <img src="/icon-512.png" alt="AVASYA TEKNOLOJİ" className="h-14 w-14" />
            <div>
              <p className="text-[13px] font-bold leading-tight">
                AVASYA TEKNOLOJİ SANAYİ VE DIŞ TİC. LTD. ŞTİ.
              </p>
              <p className="text-[11px]">İZİN KULLANIM TALEP FORMU</p>
            </div>
          </div>

          <p className="mb-2 text-right text-[12px]">
            Tarih: {d(leave.created_at?.slice(0, 10))}
          </p>

          <table className="w-full border-collapse border border-black">
            <tbody>
              <Row label="Personel Kodu" value={profile?.personel_kodu ?? ""} />
              <Row label="Adı ve Soyadı" value={profile?.ad_soyad ?? ""} />
              <Row label="SSK Sicil No - T.C. Kimlik" value={profile?.tc_kimlik ?? ""} />
              <Row label="İşe Giriş Tarihi" value={d(profile?.ise_giris_tarihi)} />
              <Row label="Görevi" value={profile?.gorev ?? ""} />
              <Row label="Departmanı" value={profile?.departman ?? ""} />
              <Row
                label="İzin Türü"
                value={
                  <span className="flex flex-wrap gap-4">
                    <span>
                      <Box checked={leave.izin_turu === "ucretsiz"} /> Ücretsiz İzin
                    </span>
                    <span>
                      <Box checked={false} /> Ücretli İzin
                    </span>
                    <span>
                      <Box checked={leave.izin_turu === "yillik"} /> Yıllık İzin
                    </span>
                  </span>
                }
              />
              <Row label="İzin Süresi (Gün)" value={leave.toplam_gun} />
              <Row label="İzin Başlangıç Tarihi" value={d(leave.baslangic_tarihi)} />
              <Row label="İzin Bitiş Tarihi" value={d(leave.bitis_tarihi)} />
              <Row label="Yol İzni (Gün)" value="" />
              <Row label="İşe Başlama Tarihi" value={donus} />
              <Row label="İzindeki Adresi" value={profile?.izin_adresi ?? ""} />
              <Row label="İzindeki Telefonu" value={profile?.izin_telefonu ?? ""} />
              <Row label="İZAHAT" value={leave.aciklama ?? ""} />
            </tbody>
          </table>

          <div className="mt-10 flex justify-between text-[12px]">
            <div className="w-[45%] border-t border-black pt-1 text-center">
              PERSONEL
              <br />
              Ad Soyad / İmza
              <br />
              <span className="font-semibold">{profile?.ad_soyad ?? ""}</span>
            </div>
            <div className="w-[45%] border-t border-black pt-1 text-center">
              YETKİLİ ONAY
              <br />
              Ad Soyad / İmza
              <br />
              <span className="font-semibold">Evrim Baykal</span>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Yazdır
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
