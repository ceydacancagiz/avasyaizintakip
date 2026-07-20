import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { LEAVE_TYPE_STYLE, type LeaveTypeValue } from "@/lib/leave-utils";

export type LeaveEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  resource: {
    izin_turu: LeaveTypeValue;
    user_id: string;
    ad_soyad: string;
  };
};

const locales = { tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  today: "Bugün",
  previous: "Geri",
  next: "İleri",
  month: "Ay",
  week: "Hafta",
  day: "Gün",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "İzin",
  noEventsInRange: "Bu aralıkta izin yok",
  showMore: (n: number) => `+${n} daha`,
};

export function LeaveCalendar({
  events,
  onSelectSlot,
  onSelectEvent,
  defaultView = "month",
  height = 640,
}: {
  events: LeaveEvent[];
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: LeaveEvent) => void;
  defaultView?: View;
  height?: number;
}) {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState<Date>(new Date());

  const eventPropGetter = useMemo(
    () => (event: LeaveEvent) => {
      const style = LEAVE_TYPE_STYLE[event.resource.izin_turu];
      return {
        style: {
          background: style.bg,
          color: style.fg,
          borderLeft: `3px solid ${style.fg}`,
        },
      };
    },
    [],
  );

  return (
    <div style={{ height }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="tr"
        messages={messages}
        views={["month", "week", "day"]}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        selectable
        onSelectSlot={(slot) =>
          onSelectSlot?.({ start: slot.start as Date, end: slot.end as Date })
        }
        onSelectEvent={(e) => onSelectEvent?.(e as LeaveEvent)}
        eventPropGetter={eventPropGetter}
        popup
        style={{ height: "100%" }}
      />
    </div>
  );
}
