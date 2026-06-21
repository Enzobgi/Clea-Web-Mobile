import { addDays, differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import type { ConsumptionEntry, DayEntry, DayStatus } from "@/store/useAppStore";

export const STATUS_COLORS: Record<DayStatus, string> = {
  abstinent: "bg-primary",
  consommation: "bg-destructive/60",
  envie_forte: "bg-amber-400",
  non_renseigne: "bg-muted",
};

export const STATUS_LABELS: Record<DayStatus, string> = {
  abstinent: "Abstinent",
  consommation: "Consommation",
  envie_forte: "Envie surmontée",
  non_renseigne: "Non renseigné",
};

export function getDayStatus(dateStr: string, dayEntries: DayEntry[], consumptions: ConsumptionEntry[]): DayStatus {
  const hasConsumption = consumptions.some(c => c.date === dateStr && c.type === "consommation");
  if (hasConsumption) return "consommation";
  const entry = dayEntries.find(e => e.date === dateStr);
  if (entry) return entry.status;
  const hasCraving = consumptions.some(c => c.date === dateStr && c.type === "envie_seulement");
  if (hasCraving) return "envie_forte";
  return "non_renseigne";
}

export function getMarkedDates(dayEntries: DayEntry[], consumptions: ConsumptionEntry[]) {
  return Array.from(new Set([
    ...dayEntries.map(e => e.date),
    ...consumptions.map(c => c.date),
  ])).sort();
}

export function getAbstinentDates(dayEntries: DayEntry[], consumptions: ConsumptionEntry[]) {
  return getMarkedDates(dayEntries, consumptions).filter(dateStr =>
    getDayStatus(dateStr, dayEntries, consumptions) === "abstinent"
  );
}

export function getTotalAbstinentDays(dayEntries: DayEntry[], consumptions: ConsumptionEntry[]) {
  return getAbstinentDates(dayEntries, consumptions).length;
}

export function getCurrentAbstinentStreak(
  dayEntries: DayEntry[],
  consumptions: ConsumptionEntry[],
  today = new Date(),
) {
  let streak = 0;
  let cursor = 0;
  const start = startOfDay(today);

  while (cursor < 3650) {
    const dateStr = format(subDays(start, cursor), "yyyy-MM-dd");
    if (getDayStatus(dateStr, dayEntries, consumptions) !== "abstinent") break;
    streak++;
    cursor++;
  }

  return streak;
}

export function getBestAbstinentStreak(dayEntries: DayEntry[], consumptions: ConsumptionEntry[]) {
  const abstinentDates = getAbstinentDates(dayEntries, consumptions);
  let best = 0;
  let current = 0;
  let previous: string | null = null;

  for (const dateStr of abstinentDates) {
    if (!previous || differenceInCalendarDays(parseDate(dateStr), parseDate(previous)) === 1) {
      current++;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    previous = dateStr;
  }

  return best;
}

export interface StatusStreak {
  status: "abstinent" | "consommation";
  startDate: string;
  endDate: string;
  days: number;
}

export function getStatusStreaks(dayEntries: DayEntry[], consumptions: ConsumptionEntry[]) {
  const dates = getMarkedDates(dayEntries, consumptions);
  const streaks: StatusStreak[] = [];
  let current: StatusStreak | null = null;

  for (const dateStr of dates) {
    const status = getDayStatus(dateStr, dayEntries, consumptions);
    if (status !== "abstinent" && status !== "consommation") {
      current = null;
      continue;
    }

    const followsCurrent = current
      && current.status === status
      && differenceInCalendarDays(parseDate(dateStr), parseDate(current.endDate)) === 1;

    if (followsCurrent && current) {
      current.endDate = dateStr;
      current.days++;
    } else {
      current = { status, startDate: dateStr, endDate: dateStr, days: 1 };
      streaks.push(current);
    }
  }

  return streaks.sort((a, b) => b.endDate.localeCompare(a.endDate));
}

export function buildDateRange(startDate: string, endDate: string, today = new Date()) {
  if (!startDate || !endDate) return [];

  const start = parseDate(startDate);
  const rawEnd = parseDate(endDate);
  const end = rawEnd < start ? start : rawEnd;
  const cappedEnd = end > startOfDay(today) ? startOfDay(today) : end;
  const days = differenceInCalendarDays(cappedEnd, start);

  if (days < 0) return [];

  return Array.from({ length: days + 1 }, (_, index) =>
    format(addDays(start, index), "yyyy-MM-dd")
  );
}

export function upsertDayEntriesForDates(
  dayEntries: DayEntry[],
  dates: string[],
  status: DayStatus,
) {
  const byDate = new Map(dayEntries.map(entry => [entry.date, entry]));
  dates.forEach(date => {
    byDate.set(date, { date, status });
  });
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function parseDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}
