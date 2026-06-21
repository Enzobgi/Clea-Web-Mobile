import { Link } from "wouter";
import { AlertCircle, Euro, TrendingUp } from "lucide-react";
import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  getCurrentAbstinentStreak,
  getDayStatus,
  getTotalAbstinentDays,
  upsertDayEntriesForDates,
} from "@/lib/abstinence";

const QUOTES = [
  "Chaque journée sans consommer est une preuve de ta force.",
  "Sois doux avec toi-même. La guérison prend le temps qu'elle prend.",
  "Tu n'as pas à tout comprendre aujourd'hui. Juste traverser ce moment.",
  "Une envie, comme une vague, monte et redescend.",
  "Tu mérites ta propre bienveillance.",
  "Le chemin se construit en marchant. Un pas à la fois.",
];

export default function Home() {
  const { dayEntries, setDayEntries, consumptions, settings, emotions, profile } = useAppStore();
  const { currentUser } = useUser();
  const today = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(today), end: endOfMonth(today) });
  const daysAbstinent = getTotalAbstinentDays(dayEntries, consumptions);
  const currentStreak = getCurrentAbstinentStreak(dayEntries, consumptions);
  const savings = daysAbstinent * settings.costPerDay;
  const recentMood = emotions.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.mood;
  const hour = today.getHours();
  const greeting = hour < 5 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const name = profile.nickname || currentUser || "";

  const cycleStatus = (day: Date) => {
    if (day > today) return;
    const date = format(day, "yyyy-MM-dd");
    const statuses = ["abstinent", "consommation", "envie_forte", "non_renseigne"] as const;
    const current = getDayStatus(date, dayEntries, consumptions);
    setDayEntries(upsertDayEntriesForDates(dayEntries, [date], statuses[(statuses.indexOf(current) + 1) % statuses.length]));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <header className="space-y-0.5 pt-2">
        <p className="text-sm capitalize text-muted-foreground">{format(today, "EEEE d MMMM", { locale: fr })}</p>
        <h1 className="text-3xl font-light">{greeting}{name ? `, ${name}.` : "."}</h1>
        {profile.personalGoal && <p className="text-sm text-muted-foreground">{profile.personalGoal}</p>}
      </header>

      <Card className="border-none bg-primary">
        <CardContent className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
          <p className="text-xs font-semibold uppercase text-primary-foreground/70">Jours d'abstinence au total</p>
          <p className="text-7xl font-extralight text-primary-foreground">{daysAbstinent}</p>
          <p className="max-w-xs text-sm text-primary-foreground/80">{daysAbstinent ? `${daysAbstinent} jours cochés. Continue à ton rythme.` : "Coche les jours sans consommation dans le calendrier."}</p>
          {currentStreak > 0 && <div className="mt-3 w-full border-t border-primary-foreground/20 pt-3"><p className="text-sm font-medium text-primary-foreground/90">Série en cours : <strong>{currentStreak} jour{currentStreak > 1 ? "s" : ""}</strong></p></div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {settings.costPerDay > 0 && <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2"><Euro className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Économies estimées</p></div><p className="text-2xl font-semibold">{savings} €</p></CardContent></Card>}
        {recentMood && <Card><CardContent className="p-4"><div className="mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Dernière humeur</p></div><p className="text-2xl font-semibold">{recentMood}/10</p></CardContent></Card>}
      </div>

      <Link href="/urgence"><Button size="lg" className="h-16 w-full gap-3 bg-destructive text-base hover:bg-destructive/90"><AlertCircle className="h-5 w-5" />J'ai une envie forte</Button></Link>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-muted-foreground">Ce mois-ci</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => <p key={`${label}-${index}`} className="py-1 text-xs font-medium text-muted-foreground">{label}</p>)}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, index) => <div key={index} />)}
            {days.map(day => {
              const date = format(day, "yyyy-MM-dd");
              const status = getDayStatus(date, dayEntries, consumptions);
              return <button key={date} onClick={() => cycleStatus(day)} disabled={day > today} className={`flex aspect-square w-full items-center justify-center rounded-full text-xs font-medium ${STATUS_COLORS[status]} ${isSameDay(day, today) ? "ring-2 ring-primary ring-offset-1" : ""} ${day > today ? "cursor-default opacity-30" : ""}`} title={STATUS_LABELS[status]}><span className={status === "non_renseigne" ? "text-muted-foreground" : "text-white"}>{format(day, "d")}</span></button>;
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-3">{Object.entries(STATUS_LABELS).map(([status, label]) => <div key={status} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`} /><span className="text-xs text-muted-foreground">{label}</span></div>)}</div>
        </CardContent>
      </Card>

      <Card className="border-none bg-muted/30"><CardContent className="p-5 text-center"><p className="italic text-muted-foreground">"{QUOTES[today.getDate() % QUOTES.length]}"</p></CardContent></Card>
    </div>
  );
}
