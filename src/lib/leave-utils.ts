import { addDays, eachDayOfInterval, isWeekend, format } from "date-fns";

/** Tüm tipler (geçmiş kayıtlar için) */
export const ALL_LEAVE_TYPES = [
  { value: "yillik", label: "Yıllık İzin" },
  { value: "ucretsiz", label: "Ücretsiz İzin" },
  { value: "saglik", label: "Sağlık İzni" },
  { value: "dogum_mazeret", label: "Doğum / Mazeret İzni" },
  { value: "diger", label: "Diğer" },
] as const;

/** Yeni talepte seçilebilir tipler */
export const LEAVE_TYPES = ALL_LEAVE_TYPES.filter(
  (t) => t.value === "yillik" || t.value === "ucretsiz",
);

export type LeaveTypeValue = (typeof ALL_LEAVE_TYPES)[number]["value"];

export const LEAVE_TYPE_LABEL: Record<LeaveTypeValue, string> = Object.fromEntries(
  ALL_LEAVE_TYPES.map((t) => [t.value, t.label]),
) as Record<LeaveTypeValue, string>;

export const LEAVE_TYPE_STYLE: Record<
  LeaveTypeValue,
  { bg: string; fg: string; dot: string; label: string }
> = {
  yillik: {
    bg: "var(--leave-annual)",
    fg: "var(--leave-annual-foreground)",
    dot: "bg-[color:var(--leave-annual-foreground)]",
    label: "Yıllık İzin",
  },
  saglik: {
    bg: "var(--leave-sick)",
    fg: "var(--leave-sick-foreground)",
    dot: "bg-[color:var(--leave-sick-foreground)]",
    label: "Sağlık İzni",
  },
  ucretsiz: {
    bg: "var(--leave-unpaid)",
    fg: "var(--leave-unpaid-foreground)",
    dot: "bg-[color:var(--leave-unpaid-foreground)]",
    label: "Ücretsiz İzin",
  },
  dogum_mazeret: {
    bg: "var(--leave-parental)",
    fg: "var(--leave-parental-foreground)",
    dot: "bg-[color:var(--leave-parental-foreground)]",
    label: "Doğum / Mazeret",
  },
  diger: {
    bg: "var(--leave-other)",
    fg: "var(--leave-other-foreground)",
    dot: "bg-[color:var(--leave-other-foreground)]",
    label: "Diğer",
  },
};

export const STATUS_LABEL = {
  beklemede: "Onay Bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
} as const;

/** Hafta sonları ve resmi tatiller hariç iş günü sayısı */
export function calculateBusinessDays(
  start: Date,
  end: Date,
  holidays: string[] = [],
): number {
  if (end < start) return 0;
  const holidaySet = new Set(holidays);
  return eachDayOfInterval({ start, end }).filter(
    (d) => !isWeekend(d) && !holidaySet.has(format(d, "yyyy-MM-dd")),
  ).length;
}

export function formatDateTR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd.MM.yyyy");
}

export function daysBetween(start: Date, end: Date): Date[] {
  if (end < start) return [];
  return eachDayOfInterval({ start, end });
}

export { addDays };
