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
  onAddEvent?: (date: Date) => void;
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const TYPE_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  deadline: { dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', label: 'Deadline' },
  delivery: { dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', label: 'Delivery' },
  milestone: { dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', label: 'Milestone' },
  holiday: { dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', label: 'Libur' },
};

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export default function CalendarView({ events, onDateClick, onAddEvent }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set(['deadline', 'delivery', 'milestone', 'holiday']));
  const [searchQuery, setSearchQuery] = useState('');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (!filterTypes.has(ev.type)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return ev.title.toLowerCase().includes(q) || (ev.subtitle && ev.subtitle.toLowerCase().includes(q));
      }
      return true;
    });
  }, [events, filterTypes, searchQuery]);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const key = ev.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [filteredEvents]);

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

  const upcomingEvents = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

    const upcoming: { date: string; events: CalendarEvent[] }[] = [];
    const currentDate = new Date(today);

    while (currentDate <= endOfMonth) {
      const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayEvs = eventMap.get(key);
      if (dayEvs && dayEvs.length > 0) {
        upcoming.push({ date: key, events: dayEvs });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return upcoming.slice(0, 10);
  }, [eventMap, today, currentYear, currentMonth]);

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

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const toggleFilter = (type: string) => {
    const next = new Set(filterTypes);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type);
    } else {
      next.add(type);
    }
    setFilterTypes(next);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl shadow-xs overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-border">
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
                aria-label="Bulan sebelumnya"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <h3 className="font-display-title text-sm font-extrabold text-on-surface min-w-[160px] text-center">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
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

          {/* Filter Bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-wrap">
            <div className="flex items-center gap-1">
              {Object.entries(TYPE_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer ${
                    filterTypes.has(key)
                      ? 'bg-surface-container-high text-on-surface'
                      : 'bg-surface-container-high text-outline opacity-40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative">
              <span className="material-symbols-outlined text-[14px] text-outline absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Cari event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 pl-7 pr-2 py-1 text-[11px] rounded-md border border-border bg-surface-container-high text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-l border-border">
            {DAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-outline text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 border-l border-border">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[90px] bg-surface-container-low/30 border-b border-r border-border" />;
              }

              const key = formatDateKey(day);
              const dayEvents = eventMap.get(key) || [];
              const hasEvent = dayEvents.length > 0;
              const dayDate = new Date(currentYear, currentMonth, day);
              const isSelected = selectedDate && isSameDay(selectedDate, dayDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={key}
                  onClick={() => handleDayClick(day)}
                  className={`group min-h-[90px] p-2 border-b border-r border-border text-left transition-colors hover:bg-surface-container-low cursor-pointer relative ${
                    isSelected ? 'bg-primary/5 ring-2 ring-inset ring-primary' : ''
                  } ${isTodayDate ? 'bg-sky-50 dark:bg-sky-950/20' : ''}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      isTodayDate ? 'bg-primary text-white' : 'text-on-surface'
                    }`}
                  >
                    {day}
                  </span>
                  {hasEvent ? (
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 4).map((ev, idx) => (
                        <div
                          key={idx}
                          title={`${ev.title}${ev.subtitle ? `\n${ev.subtitle}` : ''}`}
                          className={`flex items-center gap-1 px-1 py-0.5 rounded ${
                            TYPE_STYLES[ev.type]?.bg || 'bg-surface-container'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_STYLES[ev.type]?.dot || 'bg-outline'}`} />
                          <span className="text-[9px] truncate font-medium text-on-surface">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="text-[8px] text-outline font-semibold px-1">
                          +{dayEvents.length - 4} lainnya
                        </span>
                      )}
                    </div>
                  ) : (
                    onAddEvent && (
                      <div
                        onClick={(e) => { e.stopPropagation(); onAddEvent(dayDate); }}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[14px] text-outline hover:text-primary cursor-pointer">add_circle</span>
                      </div>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl shadow-xs p-5">
            {selectedDate ? (
              <>
                <h4 className="font-display-title text-xs font-extrabold text-on-surface mb-1">
                  {formatDateReadable(selectedDate)}
                </h4>
                <p className="text-[10px] text-outline mb-4">
                  {selectedEvents.length > 0
                    ? `${selectedEvents.length} kegiatan`
                    : 'Tidak ada kegiatan pada tanggal ini.'}
                </p>

                {selectedEvents.length === 0 && (
                  <div className="text-center py-8 text-outline">
                    <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
                    <p className="text-xs">Tidak ada kegiatan pada tanggal ini.</p>
                  </div>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {selectedEvents.map((ev, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${TYPE_STYLES[ev.type]?.bg || 'bg-surface-container-low border-border'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${TYPE_STYLES[ev.type]?.dot || 'bg-outline'}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-secondary">
                          {TYPE_STYLES[ev.type]?.label || ev.type}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-on-surface">{ev.title}</p>
                      {ev.subtitle && (
                        <p className="text-[10px] text-secondary mt-0.5">{ev.subtitle}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h4 className="font-display-title text-xs font-extrabold text-on-surface mb-1">
                  Kegiatan Mendatang
                </h4>
                <p className="text-[10px] text-outline mb-4">
                  {upcomingEvents.length > 0
                    ? `${upcomingEvents.length} hari dengan kegiatan`
                    : 'Tidak ada kegiatan mendatang.'}
                </p>

                {upcomingEvents.length === 0 && (
                  <div className="text-center py-8 text-outline">
                    <span className="material-symbols-outlined text-3xl mb-2">celebration</span>
                    <p className="text-xs">Belum ada kegiatan mendatang.</p>
                  </div>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {upcomingEvents.map(({ date, events: dayEvs }) => (
                    <div key={date} className="p-3 rounded-xl border border-border bg-surface-container-low">
                      <p className="text-[10px] font-bold text-outline mb-2">{formatDateShort(date)}</p>
                      <div className="space-y-1.5">
                        {dayEvs.map((ev, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_STYLES[ev.type]?.dot || 'bg-outline'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-on-surface truncate">{ev.title}</p>
                              {ev.subtitle && (
                                <p className="text-[9px] text-outline truncate">{ev.subtitle}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-border">
              <h5 className="text-[9px] font-bold uppercase tracking-wider text-outline mb-2">Legenda</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(TYPE_STYLES).map(([key, style]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="text-[10px] text-secondary">{style.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add FAB */}
      {onAddEvent && (
        <button
          onClick={() => onAddEvent(selectedDate || new Date(currentYear, currentMonth, 1))}
          className="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:brightness-110 hover:scale-105 transition-all cursor-pointer flex items-center justify-center z-20"
          aria-label="Tambah event"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}
    </div>
  );
}
