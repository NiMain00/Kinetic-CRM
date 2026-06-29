import React, { useMemo, useState } from 'react';

interface CalendarEvent {
  date: string;
  title: string;
  type: 'deadline' | 'delivery' | 'milestone' | 'holiday';
  subtitle?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date, events: CalendarEvent[]) => void;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const TYPE_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  deadline: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', label: 'Deadline' },
  delivery: { dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Delivery' },
  milestone: { dot: 'bg-purple-500', bg: 'bg-purple-50 border-purple-200', label: 'Milestone' },
  holiday: { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Libur' },
};

export default function CalendarView({ events, onDateClick }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const key = ev.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [events]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(null);
  };

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return eventMap.get(key) || [];
  }, [selectedDate, currentYear, currentMonth, eventMap]);

  const handleDayClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventMap.get(key) || [];
    onDateClick?.(date, dayEvents);
  };

  const formatDateKey = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const formatDateReadable = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-8 bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Bulan sebelumnya"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <h3 className="font-display-title text-sm font-extrabold text-slate-800 min-w-[180px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Bulan berikutnya"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:brightness-110 transition-colors cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/30" />;
            }

            const key = formatDateKey(day);
            const dayEvents = eventMap.get(key) || [];
            const hasEvent = dayEvents.length > 0;

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                className={`min-h-[90px] p-2 border-b border-r border-border text-left transition-colors hover:bg-slate-50 cursor-pointer relative ${
                  selectedDate?.getDate() === day &&
                  selectedDate?.getMonth() === currentMonth &&
                  selectedDate?.getFullYear() === currentYear
                    ? 'bg-primary/5 ring-2 ring-inset ring-primary'
                    : ''
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    isToday(day)
                      ? 'bg-primary text-white'
                      : 'text-slate-700'
                  }`}
                >
                  {day}
                </span>
                {hasEvent && (
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded ${
                          TYPE_STYLES[ev.type]?.bg || 'bg-slate-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_STYLES[ev.type]?.dot || 'bg-slate-400'}`} />
                        <span className="text-[9px] truncate font-medium text-slate-700">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-slate-400 font-semibold px-1">
                        +{dayEvents.length - 3} lainnya
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar — Selected Date Events */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-border rounded-xl shadow-xs p-5">
          <h4 className="font-display-title text-xs font-extrabold text-slate-800 mb-1">
            {selectedDate ? formatDateReadable(selectedDate) : 'Pilih tanggal'}
          </h4>
          <p className="text-[10px] text-slate-400 mb-4">
            {selectedDate
              ? `${selectedEvents.length} kegiatan`
              : 'Klik tanggal pada kalender untuk melihat kegiatan.'}
          </p>

          {selectedDate && selectedEvents.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
              <p className="text-xs">Tidak ada kegiatan pada tanggal ini.</p>
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {selectedEvents.map((ev, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${TYPE_STYLES[ev.type]?.bg || 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${TYPE_STYLES[ev.type]?.dot || 'bg-slate-400'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {TYPE_STYLES[ev.type]?.label || ev.type}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">{ev.title}</p>
                {ev.subtitle && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{ev.subtitle}</p>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-border">
            <h5 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Legenda</h5>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_STYLES).map(([key, style]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-[10px] text-slate-500">{style.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
