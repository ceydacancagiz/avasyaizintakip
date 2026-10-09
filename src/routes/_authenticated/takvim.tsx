import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LeaveCalendar, type LeaveEvent } from "@/components/LeaveCalendar";
import { useAllLeaves, useProfiles } from "@/hooks/useLeaves";
import { LEAVE_TYPE_LABEL, LEAVE_TYPES } from "@/lib/leave-utils";
import { addDays, endOfMonth, parseISO, startOfMonth } from "date-fns";

export const Route = createFileRoute("/_authenticated/takvim")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ortak Takvim | AVASYA TEKNOLOJİ" },
      { name: "description", content: "Şirket genelindeki izinlerin ortak takvimi." },
    ],
  }),
  component: TakvimPage,
});

const STATUS = [
  { value: "onaylandi", label: "Onaylandı", color: "#16a34a" },
  { value: "beklemede", label: "Beklemede", color: "#d97706" },
  { value: "reddedildi", label: "Reddedildi", color: "#dc2626" },
] as const;

function TakvimPage() {
  const { data: leaves = [] } = useAllLeaves();
  const { data: profiles = [] } = useProfiles();
  const [dept, setDept] = useState("");
  const [tur, setTur] = useState("");
  const [statuses, setStatuses] = useState<string[]>(["onaylandi", "beklemede"]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const departments = useMemo(
    () => Array.from(new Set(profiles.map((p) => p.departman).filter(Boolean))) as string[],
    [profiles],
  );

  const stats = useMemo(() => {
    const s = startOfMonth(new Date()), e = endOfMonth(new Date());
    const inMonth = leaves.filter(
      (l) => parseISO(l.baslangic_tarihi) <= e && parseISO(l.bitis_tarihi) >= s,
    );
    const ok = inMonth.filter((l) => l.durum === "onaylandi");
    return {
      total: profiles.length,
      yillik: ok.filter((l) => l.izin_turu === "yillik").length,
      ucretsiz: ok.filter((l) => l.izin_turu === "ucretsiz").length,
      pending: leaves.filter((l) => l.durum === "beklemede").length,
    };
  }, [leaves, profiles]);

  const events: LeaveEvent[] = useMemo(
    () =>
      leaves
        .filter((l) => statuses.includes(l.durum))
        .filter((l) => !tur || l.izin_turu === tur)
        .filter((l) => !dept || profileById.get(l.user_id)?.departman === dept)
        .map((l) => {
          const name = profileById.get(l.user_id)?.ad_soyad ?? "Çalışan";
          const suffix = l.durum === "beklemede" ? " (Beklemede)" : l.durum === "reddedildi" ? " (Reddedildi)" : "";
          return {
            id: l.id,
            title: `${name} — ${LEAVE_TYPE_LABEL[l.izin_turu]}${suffix}`,
            start: parseISO(l.baslangic_tarihi),
            end: addDays(parseISO(l.bitis_tarihi), 1),
            allDay: true as const,
            resource: { izin_turu: l.izin_turu, user_id: l.user_id, ad_soyad: name },
          };
        }),
    [leaves, statuses, tur, dept, profileById],
  );

  const toggle = (v: string) =>
    setStatuses((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const selectCls =
    "mt-1 w-full rounded-md border border-[#d1d5db] bg-white px-2 py-1.5 text-sm text-[#111827]";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ortak Takvim</h1>
        <p className="mt-1 text-sm text-muted-foreground">Şirket genelindeki izinler.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <LeaveCalendar events={events} height={760} />

        <aside className="space-y-4">
          <div className="rounded-xl bg-white p-4 text-[#111827]">
            <h3 className="mb-3 font-bold">Bu Ay</h3>
            {[
              ["Toplam Çalışan", stats.total],
              ["Yıllık İzin", stats.yillik],
              ["Ücretsiz İzin", stats.ucretsiz],
              ["Bekleyen Talep", stats.pending],
            ].map(([k, v]) => (
              <div key={k} className="mb-2">
                <div className="text-xs text-[#6b7280]">{k}</div>
                <div className="text-xl font-bold">{v}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-4 text-[#111827]">
            <h3 className="mb-3 font-bold">Filtrele</h3>
            <label className="text-xs text-[#6b7280]">Departman</label>
            <select className={selectCls} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">Tümü</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="mt-3 block text-xs text-[#6b7280]">İzin Türü</label>
            <select className={selectCls} value={tur} onChange={(e) => setTur(e.target.value)}>
              <option value="">Tümü</option>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div className="mt-3 text-xs text-[#6b7280]">Durum</div>
            {STATUS.map((s) => (
              <label key={s.value} className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={statuses.includes(s.value)}
                  onChange={() => toggle(s.value)}
                  style={{ accentColor: s.color }}
                  className="h-4 w-4"
                />
                {s.label}
              </label>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
