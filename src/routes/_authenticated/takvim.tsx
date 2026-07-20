import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveCalendar, type LeaveEvent } from "@/components/LeaveCalendar";
import { EmployeeFilter } from "@/components/EmployeeFilter";
import { useApprovedLeaves, useProfiles } from "@/hooks/useLeaves";
import { LEAVE_TYPE_LABEL } from "@/lib/leave-utils";
import { addDays, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/takvim")({
  ssr: false,
  component: TakvimPage,
});

function TakvimPage() {
  const { data: leaves = [] } = useApprovedLeaves();
  const { data: profiles = [] } = useProfiles();
  const [filterId, setFilterId] = useState<string | null>(null);

  const profileById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.ad_soyad));
    return m;
  }, [profiles]);

  const events: LeaveEvent[] = useMemo(() => {
    const src = filterId ? leaves.filter((l) => l.user_id === filterId) : leaves;
    return src.map((l) => ({
      id: l.id,
      title: `${profileById.get(l.user_id) ?? "Çalışan"} — ${LEAVE_TYPE_LABEL[l.izin_turu]}`,
      start: parseISO(l.baslangic_tarihi),
      end: addDays(parseISO(l.bitis_tarihi), 1),
      allDay: true as const,
      resource: {
        izin_turu: l.izin_turu,
        user_id: l.user_id,
        ad_soyad: profileById.get(l.user_id) ?? "",
      },
    }));
  }, [leaves, filterId, profileById]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ortak Takvim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Şirket genelindeki onaylanmış izinlerin tam ekran görünümü.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Takvim</CardTitle>
          <EmployeeFilter employees={profiles} value={filterId} onChange={setFilterId} />
        </CardHeader>
        <CardContent>
          <LeaveCalendar events={events} height={720} />
        </CardContent>
      </Card>
    </div>
  );
}
