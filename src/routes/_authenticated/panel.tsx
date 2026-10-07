import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaveCalendar, type LeaveEvent } from "@/components/LeaveCalendar";
import { EmployeeFilter } from "@/components/EmployeeFilter";
import { useApprovedLeaves, useMyLeaves, usePendingLeaves, useProfiles } from "@/hooks/useLeaves";
import { useAuth } from "@/hooks/useAuth";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_LABEL,
  LEAVE_TYPE_STYLE,
  fmtDays,
  remainingDays,
  type LeaveTypeValue,
} from "@/lib/leave-utils";
import {
  CalendarDays,
  Users,
  CalendarCheck2,
  Clock,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/panel")({
  ssr: false,
  component: PanelPage,
});

function PanelPage() {
  const { profile, isManager } = useAuth();
  const { data: leaves = [] } = useApprovedLeaves();
  const { data: profiles = [] } = useProfiles();
  const [filterId, setFilterId] = useState<string | null>(null);

  const profileById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.ad_soyad));
    return m;
  }, [profiles]);

  const events: LeaveEvent[] = useMemo(() => {
    const source = filterId ? leaves.filter((l) => l.user_id === filterId) : leaves;
    return source.map((l) => {
      const name = profileById.get(l.user_id) ?? "Çalışan";
      const end = addDays(parseISO(l.bitis_tarihi), 1); // rbc end is exclusive
      return {
        id: l.id,
        title: `${name} — ${LEAVE_TYPE_LABEL[l.izin_turu]}`,
        start: parseISO(l.baslangic_tarihi),
        end,
        allDay: true as const,
        resource: {
          izin_turu: l.izin_turu,
          user_id: l.user_id,
          ad_soyad: name,
        },
      };
    });
  }, [leaves, filterId, profileById]);

  const today = new Date();
  const weekEnd = addDays(today, 7);

  const todayLeaves = leaves.filter((l) =>
    isWithinInterval(today, {
      start: parseISO(l.baslangic_tarihi),
      end: parseISO(l.bitis_tarihi),
    }),
  );

  const upcomingLeaves = leaves.filter((l) => {
    const s = parseISO(l.baslangic_tarihi);
    return s >= today && s <= weekEnd;
  });

  const { data: pendingAll = [] } = usePendingLeaves();
  const { data: myLeaves = [] } = useMyLeaves(profile?.id);
  const pendingMine = isManager
    ? pendingAll.length
    : myLeaves.filter((l) => l.durum === "beklemede").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Merhaba, {profile?.ad_soyad?.split(" ")[0] ?? "Çalışan"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Şirket ortak takvimini ve izin durumunuzu buradan takip edin.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/yeni-talep">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni İzin Talebi
          </Link>
        </Button>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays />}
          label="Kalan İzin Günüm"
          value={`${fmtDays(remainingDays(profile))} gün`}
          hint="Yıllık izin bakiyesi"
          hintClassName="font-semibold text-[color:var(--success)]"
        />

        <StatCard
          icon={<Users />}
          label="Bugün İzinli"
          value={String(todayLeaves.length)}
          hint={
            todayLeaves.length
              ? todayLeaves
                  .slice(0, 2)
                  .map((l) => profileById.get(l.user_id))
                  .join(", ") + (todayLeaves.length > 2 ? "..." : "")
              : "Kimse izinli değil"
          }
        />
        <StatCard
          icon={<CalendarCheck2 />}
          label="Önümüzdeki 7 Gün"
          value={String(upcomingLeaves.length)}
          hint="Planlanmış izin"
        />
        <StatCard
          icon={<Clock />}
          label={isManager ? "Onay Bekleyen" : "Aktif Talebim"}
          value={String(pendingMine)}
          hint={isManager ? "Yönetici panelinde" : "Beklemedeki talep sayınız"}
          action={
            isManager && (
              <Link
                to="/onay-paneli"
                className="text-xs font-medium text-brand-red hover:underline"
              >
                Panele git →
              </Link>
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Şirket Ortak Takvimi</CardTitle>
              <CardDescription>
                Onaylanmış tüm izinler burada görünür.
              </CardDescription>
            </div>
            <EmployeeFilter
              employees={profiles}
              value={filterId}
              onChange={setFilterId}
            />
          </CardHeader>
          <CardContent>
            <LeaveCalendar events={events} height={620} />
            <LegendRow />
          </CardContent>
        </Card>

        {/* Upcoming list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yaklaşan İzinler</CardTitle>
            <CardDescription>Önümüzdeki 7 gün</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingLeaves.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Önümüzdeki 7 gün için planlanmış izin yok.
              </p>
            )}
            {upcomingLeaves.slice(0, 8).map((l) => {
              const s = LEAVE_TYPE_STYLE[l.izin_turu as LeaveTypeValue];
              return (
                <div
                  key={l.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3"
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.fg }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {profileById.get(l.user_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(l.baslangic_tarihi), "dd MMM", { locale: tr })}
                      {" – "}
                      {format(parseISO(l.bitis_tarihi), "dd MMM", { locale: tr })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px]"
                    style={{ background: s.bg, color: s.fg }}
                  >
                    {LEAVE_TYPE_LABEL[l.izin_turu as LeaveTypeValue]}
                  </Badge>
                </div>
              );
            })}
            <Link
              to="/takvim"
              className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Tüm takvimi aç <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  hintClassName,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  hintClassName?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="relative z-0 border-2 border-foreground/90 shadow-sm transition-all duration-200 ease-out hover:z-10 hover:scale-[1.06] hover:shadow-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {action}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        {hint && (
          <p
            className={`mt-0.5 truncate text-xs text-muted-foreground ${hintClassName ?? ""}`}
          >
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LegendRow() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
      <span className="font-medium">Renk kodları:</span>
      {LEAVE_TYPES.map((t) => {
        const s = LEAVE_TYPE_STYLE[t.value as LeaveTypeValue];
        return (
          <span key={t.value} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.fg }}
            />
            {s.label}
          </span>
        );
      })}
    </div>
  );
}
