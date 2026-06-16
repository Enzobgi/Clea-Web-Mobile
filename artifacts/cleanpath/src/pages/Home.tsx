import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertCircle, TrendingUp, Euro } from "lucide-react";

const QUOTES = [
  "Chaque journée sans consommer est une preuve de ta force.",
  "Sois doux avec toi-même. La guérison prend le temps qu'elle prend.",
  "Tu n'as pas à tout comprendre aujourd'hui. Juste traverser ce moment.",
  "Une envie, comme une vague, monte et redescend. Tu n'as pas à la combattre — juste la laisser passer.",
  "Tu mérites ta propre bienveillance.",
  "Le chemin se construit en marchant. Un pas à la fois.",
  "Chaque heure sans consommer est une petite victoire.",
  "La rechute n'est pas une fin. C'est une information qui t'aide à mieux te connaître.",
];

const STATUS_COLORS: Record<string, string> = {
  abstinent: "bg-primary",
  consommation: "bg-destructive/60",
  envie_forte: "bg-amber-400",
  non_renseigne: "bg-muted",
};

const STATUS_LABELS: Record<string, string> = {
  abstinent: "Abstinent",
  consommation: "Consommation",
  envie_forte: "Envie surmontée",
  non_renseigne: "Non renseigné",
};

function MiniCalendar() {
  const { dayEntries, setDayEntries, consumptions } = useAppStore();
  const today = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const entry = dayEntries.find(e => e.date === dateStr);
    if (entry) return entry.status;
    const hasConsumption = consumptions.some(c => c.date === dateStr && c.type === "consommation");
    if (hasConsumption) return "consommation";
    const hasCraving = consumptions.some(c => c.date === dateStr && c.type === "envie_seulement");
    if (hasCraving) return "envie_forte";
    return "non_renseigne";
  };

  const cycleStatus = (day: Date) => {
    if (day > today) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const statuses = ["abstinent", "consommation", "envie_forte", "non_renseigne"] as const;
    const current = getDayStatus(day);
    const idx = statuses.indexOf(current as typeof statuses[number]);
    const next = statuses[(idx + 1) % statuses.length];
    const existing = dayEntries.find(e => e.date === dateStr);
    if (existing) {
      setDayEntries(dayEntries.map(e => e.date === dateStr ? { ...e, status: next } : e));
    } else {
      setDayEntries([...dayEntries, { date: dateStr, status: next }]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <p key={i} className="text-xs text-muted-foreground font-medium py-1">{d}</p>
        ))}
        {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const status = getDayStatus(day);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              onClick={() => cycleStatus(day)}
              className={`w-full aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-transform hover:scale-110 active:scale-95 ${STATUS_COLORS[status]} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""} ${day > today ? "opacity-30 cursor-default" : "cursor-pointer"}`}
              title={`${format(day, "d MMMM", { locale: fr })} — ${STATUS_LABELS[status]}`}
              disabled={day > today}
              data-testid={`day-${format(day, "yyyy-MM-dd")}`}
            >
              <span className={status === "non_renseigne" ? "text-muted-foreground" : "text-white text-opacity-90"}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[k]}`} />
            <span className="text-xs text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { dayEntries, consumptions, settings, emotions } = useAppStore();
  const { currentUser } = useUser();

  const getDayStatusGlobal = (dateStr: string) => {
    const entry = dayEntries.find(e => e.date === dateStr);
    if (entry) return entry.status;
    const hasConsumption = consumptions.some(c => c.date === dateStr && c.type === "consommation");
    if (hasConsumption) return "consommation";
    const hasCraving = consumptions.some(c => c.date === dateStr && c.type === "envie_seulement");
    if (hasCraving) return "envie_forte";
    return "non_renseigne";
  };

  const allMarkedDates = Array.from(new Set([
    ...dayEntries.map(e => e.date),
    ...consumptions.map(c => c.date),
  ]));
  const daysAbstinent = allMarkedDates.filter(d => getDayStatusGlobal(d) === "abstinent").length;
  const savings = daysAbstinent * settings.costPerDay;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = currentUser ?? "";
  const greetingWithName = firstName ? `${greeting}, ${firstName}.` : `${greeting}.`;
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  const recentMood = emotions.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.mood;

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-8">
      <header className="space-y-0.5 pt-2">
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
        <h1 className="text-3xl font-light text-foreground">{greetingWithName}</h1>
      </header>

      <Card className="bg-primary border-none">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">Jours d'abstinence au total</p>
          <p className="text-7xl font-extralight text-primary-foreground" data-testid="text-days-abstinent">{daysAbstinent}</p>
          <p className="text-sm text-primary-foreground/80 max-w-xs">
            {daysAbstinent === 0
              ? "Coche les jours sans consommation dans le calendrier."
              : daysAbstinent === 1
                ? "Un premier jour coché. Chaque journée compte."
                : `${daysAbstinent} jours cochés. Continue à ton rythme.`
            }
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {settings.costPerDay > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Économies estimées</p>
              </div>
              <p className="text-2xl font-semibold text-foreground" data-testid="text-savings">{savings} €</p>
            </CardContent>
          </Card>
        )}
        {recentMood && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Dernière humeur</p>
              </div>
              <p className="text-2xl font-semibold text-foreground">{recentMood}/10</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Link href="/urgence">
        <Button
          size="lg"
          className="w-full h-16 text-base rounded-2xl bg-destructive hover:bg-destructive/90 gap-3"
          data-testid="button-urgency"
        >
          <AlertCircle className="h-5 w-5" />
          J'ai une envie forte
        </Button>
      </Link>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Ce mois-ci</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniCalendar />
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-none">
        <CardContent className="p-5 text-center">
          <p className="text-muted-foreground italic leading-relaxed">"{quote}"</p>
        </CardContent>
      </Card>
    </div>
  );
}
