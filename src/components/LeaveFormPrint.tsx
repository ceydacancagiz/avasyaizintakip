import { addDays, format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/avasya-logo.jpg";
import type { LeaveRequest, Profile } from "@/hooks/useLeaves";

function d(v: string | null | undefined) {
  if (!v) return "";
  try {
    return format(parseISO(v), "dd.MM.yyyy");
  } catch {
    return "";
  }
}

type FormState = {
  tarih: string;
  personel_kodu: string;
  ad_soyad: string;
  tc_kimlik: string;
  ise_giris_tarihi: string;
  gorev: string;
  departman: string;
  izin_turu: "ucretsiz" | "ucretli" | "yillik";
  izin_suresi: string;
  baslangic: string;
  bitis: string;
  yol_izni: string;
  ise_baslama: string;
  izin_adresi: string;
  izin_telefonu: string;
  izahat: string;
};

function buildState(leave: LeaveRequest, profile: Profile | null | undefined): FormState {
  return {
    tarih: d(leave.created_at?.slice(0, 10)),
    personel_kodu: profile?.personel_kodu ?? "",
    ad_soyad: profile?.ad_soyad ?? "",
    tc_kimlik: profile?.tc_kimlik ?? "",
    ise_giris_tarihi: d(profile?.ise_giris_tarihi),
    gorev: profile?.gorev ?? "",
    departman: profile?.departman ?? "",
    izin_turu: leave.izin_turu === "ucretsiz" ? "ucretsiz" : "yillik",
    izin_suresi: String(leave.toplam_gun ?? ""),
    baslangic: d(leave.baslangic_tarihi),
    bitis: d(leave.bitis_tarihi),
    yol_izni: "",
    ise_baslama: leave.bitis_tarihi
      ? format(addDays(parseISO(leave.bitis_tarihi), 1), "dd.MM.yyyy")
      : "",
    izin_adresi: profile?.izin_adresi ?? "",
    izin_telefonu: profile?.izin_telefonu ?? "",
    izahat:
      leave.aciklama ||
      (leave.izin_turu === "ucretsiz" ? "Ücretsiz İzin" : "Yıllık İzin"),
  };
}

/** Yazdırmada aynı görünmesi için kenarlıksız inline input */
function Cell({
  value,
  onChange,
  editable,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  className?: string;
}) {
  if (!editable)
    return <span className={`text-[11pt] ${className}`}>{value}</span>;
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent text-[11pt] outline-none focus:bg-amber-50 print:bg-transparent ${className}`}
    />
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className="mr-[6px] inline-grid h-[11px] w-[11px] place-items-center rounded-full border border-black align-middle">
      {on && <span className="block h-[5px] w-[5px] rounded-full bg-black" />}
    </span>
  );
}

export function LeaveFormPrint({
  open,
  onOpenChange,
  leave,
  profile,
  autoPrint = false,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leave: LeaveRequest | null;
  profile: Profile | null | undefined;
  autoPrint?: boolean;
}) {
  const { user, refresh } = useAuth();
  const [state, setState] = useState<FormState | null>(null);
  const [editable, setEditable] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && leave) setState(buildState(leave, profile));
  }, [open, leave, profile]);

  useEffect(() => {
    if (open && autoPrint) {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [open, autoPrint]);

  if (!leave || !state) return null;

  const set = (k: keyof FormState) => (v: string) =>
    setState((s) => (s ? { ...s, [k]: v } : s));

  const canSave = !!profile && user?.id === profile.id;

  const save = async () => {
    if (!canSave || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ad_soyad: state.ad_soyad,
        departman: state.departman || null,
        personel_kodu: state.personel_kodu || null,
        tc_kimlik: state.tc_kimlik || null,
        gorev: state.gorev || null,
        izin_adresi: state.izin_adresi || null,
        izin_telefonu: state.izin_telefonu || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Bilgileriniz kaydedildi, bir daha girmenize gerek yok.");
    await refresh();
  };

  const rows: Array<[string, React.ReactNode, string?]> = [
    ["Personel Kodu", <Cell key="1" value={state.personel_kodu} onChange={set("personel_kodu")} editable={editable} />],
    ["Adı ve Soyadı", <Cell key="2" value={state.ad_soyad} onChange={set("ad_soyad")} editable={editable} />],
    ["SSK Sicil No - T.C. Kimlik", <Cell key="3" value={state.tc_kimlik} onChange={set("tc_kimlik")} editable={editable} />],
    ["İşe Giriş Tarihi", <Cell key="4" value={state.ise_giris_tarihi} onChange={set("ise_giris_tarihi")} editable={editable} />],
    ["Görevi", <Cell key="5" value={state.gorev} onChange={set("gorev")} editable={editable} />],
    ["Departmanı", <Cell key="6" value={state.departman} onChange={set("departman")} editable={editable} />],
    [
      "İzin Türü",
      <div key="7" className="flex items-center justify-around text-[11pt]">
        {(
          [
            ["ucretsiz", "Ücretsiz İzin"],
            ["ucretli", "Ücretlii İzin"],
            ["yillik", "Yıllık İzin"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            disabled={!editable}
            onClick={() => set("izin_turu")(v)}
            className="flex items-center"
          >
            <Radio on={state.izin_turu === v} />
            {label}
          </button>
        ))}
      </div>,
    ],
    ["İzin Süresi (Gün)", <Cell key="8" value={state.izin_suresi} onChange={set("izin_suresi")} editable={editable} />],
    ["İzin Başlangıç Tarihi", <Cell key="9" value={state.baslangic} onChange={set("baslangic")} editable={editable} />],
    ["İzin Bitiş Tarihi", <Cell key="10" value={state.bitis} onChange={set("bitis")} editable={editable} />],
    ["Yol İzni (Gün)", <Cell key="11" value={state.yol_izni} onChange={set("yol_izni")} editable={editable} />],
    ["İşe Başlama Tarihi", <Cell key="12" value={state.ise_baslama} onChange={set("ise_baslama")} editable={editable} />],
    ["İzindeki Adresi", <Cell key="13" value={state.izin_adresi} onChange={set("izin_adresi")} editable={editable} />, "h-[46px]"],
    ["İzindeki Telefonu", <Cell key="14" value={state.izin_telefonu} onChange={set("izin_telefonu")} editable={editable} />],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle>İzin Kullanım Talep Formu</DialogTitle>
          <DialogDescription>
            Alanları düzenleyebilirsiniz. Kişisel bilgilerinizi bir kez kaydedin,
            sonraki formlarda otomatik gelsin.
          </DialogDescription>
        </DialogHeader>

        <div
          id="izin-form-print"
          className="mx-auto w-full max-w-[794px] bg-white px-10 py-8 font-sans text-black"
        >
          <div className="flex justify-end">
            <img src={logo} alt="AVASYA Teknoloji" className="h-[70px] w-auto" />
          </div>

          <p className="mt-6 text-[11pt]">AVASYA TEKNOLOJİ SANAYİ VE DIŞ TİC.LTD.ŞTİ</p>
          <p className="mt-4 text-center text-[12pt] font-semibold">
            İZİN KULLANIM TALEP FORMU
          </p>
          <p className="mt-1 text-right text-[11pt]">
            Tarih:{" "}
            <span className="inline-block w-[90px] text-left">
              <Cell value={state.tarih} onChange={set("tarih")} editable={editable} />
            </span>
          </p>

          <table className="mt-2 w-full table-fixed border-collapse">
            <tbody>
              {rows.map(([label, node, extra]) => (
                <tr key={label}>
                  <td
                    className={`w-[33%] border border-black px-3 py-[5px] text-[11pt] font-semibold align-middle ${extra ?? ""}`}
                  >
                    {label}
                  </td>
                  <td className="border border-black px-3 py-[5px] align-middle">
                    {node}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="h-[54px] border border-black px-3 py-[5px] text-[11pt] font-bold align-middle">
                  İZAHAT
                </td>
                <td className="border border-black px-3 py-[5px] align-middle">
                  <Cell value={state.izahat} onChange={set("izahat")} editable={editable} />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-16 flex justify-between text-center text-[11pt]">
            <div className="w-[45%]">
              <p className="font-bold">PERSONEL</p>
              <p>Ad Soyad/ İmza</p>
            </div>
            <div className="w-[45%]">
              <p className="font-bold">YETKİLİ ONAY</p>
              <p>Ad Soyad/ İmza</p>
              <p className="mt-2 text-[10pt]">Evrim Baykal</p>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button variant="ghost" onClick={() => setEditable((e) => !e)}>
            {editable ? "Düzenlemeyi kapat" : "Düzenle"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          {canSave && (
            <Button variant="secondary" onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Kaydet
            </Button>
          )}
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Yazdır
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
