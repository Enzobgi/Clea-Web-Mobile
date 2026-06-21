import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  buildDateRange,
  getCurrentAbstinentStreak,
  getDayStatus,
  getMarkedDates,
  getStatusStreaks,
  getTotalAbstinentDays,
  upsertDayEntriesForDates,
} from "@/lib/abstinence";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function CalendarPage() {
  const { sessions, setSessions, dayEntries, setDayEntries, consumptions } = useAppStore();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const [rangeStart, setRangeStart] = useState(todayStr);
  const [rangeEnd, setRangeEnd] = useState(todayStr);
  const [feedback, setFeedback] = useState("");
  
  const currentSession = sessions.find(s => !s.endDate);
  const monthDays = eachDayOfInterval({ start: startOfMonth(visibleMonth), end: endOfMonth(visibleMonth) });
  const totalAbstinent = getTotalAbstinentDays(dayEntries, consumptions);
  const currentStreak = getCurrentAbstinentStreak(dayEntries, consumptions);
  const pendingRange = buildDateRange(rangeStart, rangeEnd, today);
  const statusStreaks = getStatusStreaks(dayEntries, consumptions);
  const recordedDays = getMarkedDates(dayEntries, consumptions)
    .map(date => ({ date, status: getDayStatus(date, dayEntries, consumptions) }))
    .filter(day => day.status === "abstinent" || day.status === "consommation")
    .sort((a, b) => b.date.localeCompare(a.date));
  const pendingRangeLabel = `${pendingRange.length} jour${pendingRange.length > 1 ? "s" : ""} ${pendingRange.length > 1 ? "seront ajoutés" : "sera ajouté"} au total.`;
  
  const handleReset = () => {
    if (currentSession) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSession.id ? { ...s, endDate: new Date().toISOString() } : s
      );
      setSessions([
        ...updatedSessions,
        {
          id: Date.now().toString(),
          startDate: new Date().toISOString(),
          endDate: null,
          note: ""
        }
      ]);
    }

    setDayEntries(upsertDayEntriesForDates(dayEntries, [todayStr], "consommation"));
  };

  const cycleStatus = (day: Date) => {
    if (day > today) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const statuses = ["abstinent", "consommation", "envie_forte", "non_renseigne"] as const;
    const current = getDayStatus(dateStr, dayEntries, consumptions);
    const idx = statuses.indexOf(current);
    const next = statuses[(idx + 1) % statuses.length];
    setDayEntries(upsertDayEntriesForDates(dayEntries, [dateStr], next));
    setFeedback("");
  };

  const markRangeAsAbstinent = () => {
    if (pendingRange.length === 0) {
      setFeedback("Choisis une période passée ou terminée aujourd'hui.");
      return;
    }

    setDayEntries(upsertDayEntriesForDates(dayEntries, pendingRange, "abstinent"));
    setFeedback(`${pendingRange.length} jour${pendingRange.length > 1 ? "s" : ""} ajouté${pendingRange.length > 1 ? "s" : ""} au calendrier.`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Calendrier d'abstinence</h1>
        <p className="text-muted-foreground">Suis ton parcours jour après jour.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total calendrier</p>
            <p className="text-3xl font-light text-primary">{totalAbstinent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Série actuelle</p>
            <p className="text-3xl font-light text-primary">{currentStreak}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base capitalize">
                {format(visibleMonth, "MMMM yyyy", { locale: fr })}
              </CardTitle>
              <CardDescription>Clique sur un jour pour changer son statut.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setVisibleMonth(subMonths(visibleMonth, 1))}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {["L", "M", "M", "J", "V", "S", "D"].map((dayName, index) => (
              <p key={`${dayName}-${index}`} className="text-xs text-muted-foreground font-medium py-1">
                {dayName}
              </p>
            ))}
            {Array.from({ length: (monthDays[0].getDay() + 6) % 7 }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {monthDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const status = getDayStatus(dateStr, dayEntries, consumptions);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={dateStr}
                  onClick={() => cycleStatus(day)}
                  disabled={day > today}
                  className={`w-full aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-transform hover:scale-105 active:scale-95 ${STATUS_COLORS[status]} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""} ${day > today ? "opacity-30 cursor-default" : "cursor-pointer"}`}
                  title={`${format(day, "d MMMM yyyy", { locale: fr })} - ${STATUS_LABELS[status]}`}
                  data-testid={`calendar-day-${dateStr}`}
                >
                  <span className={status === "non_renseigne" ? "text-muted-foreground" : "text-white text-opacity-90"}>
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[key as keyof typeof STATUS_COLORS]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encoder des jours passés</CardTitle>
          <CardDescription>Marque une période complète comme abstinente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="abstinence-start">Du</Label>
              <Input
                id="abstinence-start"
                type="date"
                max={todayStr}
                value={rangeStart}
                onChange={event => setRangeStart(event.target.value)}
                data-testid="input-abstinence-start"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abstinence-end">Au</Label>
              <Input
                id="abstinence-end"
                type="date"
                max={todayStr}
                value={rangeEnd}
                onChange={event => setRangeEnd(event.target.value)}
                data-testid="input-abstinence-end"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button onClick={markRangeAsAbstinent} className="sm:w-auto" data-testid="button-add-abstinence-range">
              Ajouter au calendrier
            </Button>
            <p className="text-sm text-muted-foreground">
              {feedback || pendingRangeLabel}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div>
          <h3 className="font-medium">Réinitialiser le compteur</h3>
          <p className="text-sm text-muted-foreground">Une rechute est un apprentissage, pas une fin.</p>
        </div>
        <Button variant="outline" onClick={handleReset}>Réinitialiser</Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Historique du calendrier</h3>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Séries de jours</CardTitle>
            <CardDescription>Les périodes consécutives sans consommation et avec consommation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusStreaks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune série enregistrée pour le moment.</p>
            ) : statusStreaks.map(streak => (
              <div key={`${streak.status}-${streak.startDate}`} className="flex items-center justify-between gap-3 rounded-md bg-muted/35 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${STATUS_COLORS[streak.status]}`} />
                  <div>
                    <p className="text-sm font-medium">
                      {streak.status === "abstinent" ? "Sans consommation" : "Avec consommation"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCalendarRange(streak.startDate, streak.endDate)}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${streak.status === "abstinent" ? "text-primary" : "text-destructive"}`}>
                  {streak.days} jour{streak.days > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jours enregistrés</CardTitle>
            <CardDescription>Le détail des jours avec et sans consommation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recordedDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun jour enregistré pour le moment.</p>
            ) : recordedDays.map(day => (
              <div key={day.date} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <span className="text-sm capitalize">
                  {format(new Date(`${day.date}T00:00:00`), "EEEE d MMMM yyyy", { locale: fr })}
                </span>
                <span className={`text-xs font-medium ${day.status === "abstinent" ? "text-primary" : "text-destructive"}`}>
                  {day.status === "abstinent" ? "Sans consommation" : "Consommation"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {sessions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Périodes suivies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    {format(new Date(session.startDate), "d MMMM yyyy", { locale: fr })} -
                    {session.endDate ? format(new Date(session.endDate), " d MMMM yyyy", { locale: fr }) : " Aujourd'hui"}
                  </p>
                  {!session.endDate && <span className="text-primary text-xs font-medium">En cours</span>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatCalendarRange(startDate: string, endDate: string) {
  const start = format(new Date(`${startDate}T00:00:00`), "d MMM", { locale: fr });
  const end = format(new Date(`${endDate}T00:00:00`), "d MMM yyyy", { locale: fr });
  return startDate === endDate ? end : `Du ${start} au ${end}`;
}
