import { addDays, format, startOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  CalendarDays,
  Check,
  Heart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const today = new Date();
const monthStart = startOfMonth(today);
const demoStatuses = Array.from({ length: 31 }, (_, index) => {
  const day = addDays(monthStart, index);
  if (day > today) return "future";
  if ([4, 12, 21].includes(index)) return "consumption";
  if ([8, 18, 26].includes(index)) return "craving";
  return "abstinent";
});

const emotions = [
  {
    date: subDays(today, 1),
    mood: 8,
    energy: 7,
    gratitude: "Le soutien de ma sœur et une longue promenade après le travail.",
    helped: "J'ai appelé quelqu'un avant que l'envie ne devienne trop forte.",
    difficult: "Une journée stressante et beaucoup de fatigue en fin d'après-midi.",
  },
  {
    date: subDays(today, 4),
    mood: 6,
    energy: 5,
    gratitude: "Un repas calme, préparé à la maison.",
    helped: "Respiration guidée pendant cinq minutes.",
    difficult: "J'ai croisé des amis avec qui j'avais l'habitude de consommer.",
  },
  {
    date: subDays(today, 8),
    mood: 7,
    energy: 8,
    gratitude: "Avoir retrouvé de l'énergie au réveil.",
    helped: "Sport léger et téléphone coupé pendant la soirée.",
    difficult: "Une envie soudaine en rentrant du travail.",
  },
];

const gratitudes = [
  "Je me suis réveillé avec l'esprit plus clair.",
  "J'ai osé demander de l'aide au lieu de rester seul.",
  "Une conversation simple m'a fait beaucoup de bien.",
  "J'ai tenu mon engagement malgré une journée compliquée.",
];

export default function DemoPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div>
            <p className="font-medium">CleanPath</p>
            <p className="text-xs text-muted-foreground">Mode démo en lecture seule</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 pb-16">
        <section className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Données fictives
            </span>
            <h1 className="text-3xl font-light text-foreground sm:text-4xl">Découvre un parcours déjà bien rempli</h1>
            <p className="text-muted-foreground">
              Cette démo présente les principales fonctionnalités sans permettre de modifier ou d'enregistrer des données.
            </p>
            <Button asChild>
              <a href="#statistiques">
                <BarChart2 className="mr-2 h-4 w-4" />
                Voir les statistiques
              </a>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={CalendarDays} label="Jours sans consommation" value="42" />
            <Metric icon={TrendingUp} label="Série actuelle" value="9 jours" />
            <Metric icon={Target} label="Meilleure série" value="18 jours" />
            <Metric icon={Sparkles} label="Envies surmontées" value="11" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Calendrier et historique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-7 gap-1.5">
                {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
                  <span key={`${label}-${index}`} className="py-1 text-center text-xs text-muted-foreground">{label}</span>
                ))}
                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => <span key={`gap-${index}`} />)}
                {demoStatuses.map((status, index) => (
                  <span
                    key={index}
                    className={`flex aspect-square items-center justify-center rounded-full text-xs font-medium ${
                      status === "abstinent" ? "bg-primary text-primary-foreground"
                        : status === "consumption" ? "bg-destructive/75 text-white"
                          : status === "craving" ? "bg-amber-400 text-amber-950"
                            : "bg-muted text-muted-foreground opacity-40"
                    }`}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Legend color="bg-primary" label="Sans consommation" />
                <Legend color="bg-destructive/75" label="Consommation" />
                <Legend color="bg-amber-400" label="Envie surmontée" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Séries récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DemoStreak label="Sans consommation" dates="Du 13 au 21 juin" days="9 jours" positive />
              <DemoStreak label="Avec consommation" dates="12 juin" days="1 jour" />
              <DemoStreak label="Sans consommation" dates="Du 5 au 11 juin" days="7 jours" positive />
              <DemoStreak label="Avec consommation" dates="4 juin" days="1 jour" />
              <DemoStreak label="Sans consommation" dates="Du 17 mai au 3 juin" days="18 jours" positive />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-medium">Journal émotionnel</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {emotions.map(entry => (
              <Card key={entry.date.toISOString()}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">{format(entry.date, "EEEE d MMMM", { locale: fr })}</p>
                    <span className="text-xs text-primary">Humeur {entry.mood}/10</span>
                  </div>
                  <DemoJournalText label="Gratitude" text={entry.gratitude} />
                  <DemoJournalText label="Ce qui m'a aidé" text={entry.helped} />
                  <DemoJournalText label="Ce qui a été difficile" text={entry.difficult} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Historique des gratitudes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gratitudes.map((text, index) => (
                <div key={text} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-muted-foreground">{format(subDays(today, index * 2), "d MMMM yyyy", { locale: fr })}</p>
                  <p className="mt-1 text-sm">{text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                Journal de consommation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DemoConsumption type="Victoire" date="18 juin à 17:40" title="Envie surmontée" detail="Stress au travail · intensité 7/10" />
              <DemoConsumption type="Consommation" date="12 juin à 22:10" title="Alcool, 2 verres" detail="Avec des amis · pression sociale" negative />
              <DemoConsumption type="Victoire" date="8 juin à 19:20" title="Envie surmontée" detail="Ennui · intensité 6/10" />
              <DemoConsumption type="Consommation" date="4 juin à 20:45" title="Alcool, 1 verre" detail="Fatigue · habitude" negative />
            </CardContent>
          </Card>
        </section>

        <section id="statistiques" className="scroll-mt-24 space-y-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Statistiques pour le suivi thérapeutique</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Une vue synthétique permet de préparer un rendez-vous et d'observer les liens entre humeur, déclencheurs, envies et consommations.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Heart} label="Humeur moyenne sur 30 jours" value="7,2 / 10" />
            <Metric icon={TrendingUp} label="Évolution de l'humeur" value="+18 %" />
            <Metric icon={ShieldCheck} label="Envies surmontées" value="73 %" />
            <Metric icon={CalendarDays} label="Jours sans consommation" value="84 %" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution sur les 30 derniers jours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid h-48 grid-cols-12 items-end gap-2 border-b border-l border-border px-3 pb-3">
                  {[42, 55, 48, 62, 58, 70, 64, 78, 72, 82, 76, 86].map((height, index) => (
                    <div key={`${height}-${index}`} className="flex h-full items-end">
                      <div
                        className="w-full rounded-sm bg-primary/75"
                        style={{ height: `${height}%` }}
                        title={`Semaine ${index + 1}: humeur ${Math.round(height / 10)}/10`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Il y a 30 jours</span>
                  <span>Humeur quotidienne</span>
                  <span>Aujourd'hui</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indicateurs clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress label="Humeur moyenne" value="7,2 / 10" percent={72} />
                <Progress label="Qualité du sommeil" value="6,8 / 10" percent={68} />
                <Progress label="Niveau d'énergie" value="7,5 / 10" percent={75} />
                <Progress label="Anxiété moyenne" value="4,1 / 10" percent={41} tone="secondary" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Déclencheurs fréquents</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <HorizontalStat label="Stress au travail" value={8} max={10} />
                <HorizontalStat label="Fatigue" value={6} max={10} />
                <HorizontalStat label="Pression sociale" value={4} max={10} />
                <HorizontalStat label="Ennui" value={3} max={10} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Émotions avant une envie</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <HorizontalStat label="Anxiété" value={7} max={10} />
                <HorizontalStat label="Fatigue" value={6} max={10} />
                <HorizontalStat label="Frustration" value={5} max={10} />
                <HorizontalStat label="Solitude" value={3} max={10} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Résumé à partager</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p><strong>Point positif:</strong> la série actuelle progresse depuis 9 jours.</p>
                <p><strong>Vigilance:</strong> les envies augmentent surtout après les journées de travail fatigantes.</p>
                <p><strong>Stratégie efficace:</strong> appeler un proche et changer de lieu aide le plus souvent.</p>
                <p><strong>À explorer:</strong> le lien entre sommeil inférieur à 6/10 et anxiété le lendemain.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> Objectifs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Goal label="1 jour" achieved />
              <Goal label="7 jours" achieved />
              <Goal label="14 jours" achieved />
              <Goal label="30 jours" detail="21 jours accomplis" />
              <Goal label="90 jours" detail="Prochaine grande étape" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Plan de sécurité</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DemoJournalText label="Mes raisons" text="Retrouver mon énergie, ma confiance et des relations plus sereines." />
              <DemoJournalText label="Mes stratégies" text="Sortir marcher, appeler ma sœur, respirer cinq minutes et changer de lieu." />
              <DemoJournalText label="Phrase utile" text="Cette envie va passer. Je peux attendre dix minutes." />
            </CardContent>
          </Card>
        </section>

        <section className="rounded-md border border-primary/25 bg-primary/5 p-6 text-center">
          <h2 className="text-xl font-medium">Prêt à commencer ton propre suivi ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Crée un compte pour enregistrer tes données de manière personnelle et les retrouver sur tes appareils.
          </p>
          <Button asChild className="mt-4">
            <a href="/">Retourner à l'inscription</a>
          </Button>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-primary" />
        <p className="mt-3 text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>;
}

function DemoStreak({ label, dates, days, positive = false }: { label: string; dates: string; days: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{dates}</p></div>
      <span className={`text-sm font-semibold ${positive ? "text-primary" : "text-destructive"}`}>{days}</span>
    </div>
  );
}

function DemoJournalText({ label, text }: { label: string; text: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-0.5 text-sm">{text}</p></div>;
}

function DemoConsumption({ type, date, title, detail, negative = false }: { type: string; date: string; title: string; detail: string; negative?: boolean }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium ${negative ? "text-destructive" : "text-primary"}`}>{type}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Progress({ label, value, percent, tone = "primary" }: { label: string; value: string; percent: number; tone?: "primary" | "secondary" }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
      <div className="h-2 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${tone === "primary" ? "bg-primary" : "bg-secondary"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function HorizontalStat({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} occurrences</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-secondary" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Goal({ label, detail, achieved = false }: { label: string; detail?: string; achieved?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${achieved ? "bg-primary text-primary-foreground" : "border border-border"}`}>
        {achieved && <Check className="h-3.5 w-3.5" />}
      </span>
      <div><p className="text-sm font-medium">{label}</p>{detail && <p className="text-xs text-muted-foreground">{detail}</p>}</div>
    </div>
  );
}
