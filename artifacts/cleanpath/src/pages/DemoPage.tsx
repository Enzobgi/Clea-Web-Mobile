import { addDays, format, startOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  BellOff,
  BarChart2,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CloudOff,
  Heart,
  HeartPulse,
  Leaf,
  LockKeyhole,
  MessageCircle,
  Route,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Target,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  Wind,
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

        <nav className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Navigation de la démo">
          <DemoNav href="#aujourdhui" icon={Heart} label="Aujourd'hui" />
          <DemoNav href="#journal" icon={BookOpen} label="Journal" />
          <DemoNav href="#sos" icon={HeartPulse} label="SOS" />
          <DemoNav href="#parcours" icon={Route} label="Parcours" />
          <DemoNav href="#chat" icon={MessageCircle} label="Chat" />
          <DemoNav href="#profil" icon={UserRound} label="Profil" />
        </nav>

        <section id="aujourdhui" className="scroll-mt-24 space-y-5">
          <div>
            <p className="text-sm capitalize text-muted-foreground">{format(today, "EEEE d MMMM", { locale: fr })}</p>
            <h2 className="text-2xl font-light">Bonjour, Camille.</h2>
            <p className="text-sm text-muted-foreground">Objectif: passer quatre soirées calmes cette semaine.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Check-in du jour</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Progress label="Humeur" value="8 / 10" percent={80} />
                <Progress label="Stress" value="4 / 10" percent={40} tone="secondary" />
                <Progress label="Énergie" value="7 / 10" percent={70} />
                <Progress label="Envie actuelle" value="3 / 10" percent={30} tone="secondary" />
                <Progress label="Qualité du sommeil" value="7 / 10" percent={70} />
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">Check-in enregistré aujourd'hui à 08:12.</div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="border-primary/25 bg-primary/5">
                <CardContent className="p-5">
                  <p className="text-xs font-medium uppercase text-primary">Petite action du jour</p>
                  <p className="mt-3 text-lg font-medium">Marcher cinq minutes après le travail</p>
                  <p className="mt-1 text-sm text-muted-foreground">Une petite action réaliste suffit.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Objectifs de la semaine</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Goal label="Deux soirées sans alcool" achieved />
                  <Goal label="Appeler ma sœur avant vendredi" achieved />
                  <Goal label="Faire trois check-ins" detail="2 sur 3 réalisés" />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /><h2 className="text-xl font-medium">Onboarding personnalisé</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile label="Pseudonyme" value="Camille" />
            <InfoTile label="Objectif principal" value="Réduire" />
            <InfoTile label="Suivi" value="Alcool" />
            <InfoTile label="Région" value="Belgique" />
          </div>
          <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <DemoJournalText label="Situations difficiles" text="Stress après le travail, soirées improvisées et fatigue." />
            <DemoJournalText label="Stratégies déjà utiles" text="Marcher, appeler ma sœur et préparer une boisson sans alcool." />
          </CardContent></Card>
        </section>

        <section id="journal" className="scroll-mt-24 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Saisonnalité des consommations</CardTitle></CardHeader>
              <CardContent>
                <div className="grid h-48 grid-cols-4 items-end gap-5 border-b border-l border-border px-5 pb-3">
                  {[
                    { label: "Hiver", value: 38, icon: Snowflake },
                    { label: "Printemps", value: 24, icon: Leaf },
                    { label: "Été", value: 14, icon: Sun },
                    { label: "Automne", value: 29, icon: Leaf },
                  ].map(season => (
                    <div key={season.label} className="flex h-full flex-col justify-end gap-2 text-center">
                      <div className="flex flex-1 items-end"><div className="w-full rounded-sm bg-secondary" style={{ height: `${season.value * 2}%` }} /></div>
                      <div className="flex items-center justify-center gap-1 text-xs"><season.icon className="h-3.5 w-3.5 text-primary" />{season.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Observation saisonnière</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">
                  Dans ces données fictives, la part de jours avec consommation est plus élevée en hiver (38 %) qu'en été (14 %).
                </p>
                <p className="text-sm text-muted-foreground">
                  La comparaison utilise uniquement les jours renseignés et reste indicative. Elle peut aider à anticiper une période plus difficile sans établir de conclusion médicale.
                </p>
                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">Données disponibles: 64 jours en hiver, 58 au printemps, 61 en été et 60 en automne.</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="sos" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-destructive" /><h2 className="text-xl font-medium">Mode SOS</h2></div>
          <Card className="border-destructive/25">
            <CardContent className="grid gap-5 p-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Intensité de l'envie</p>
                <p className="text-5xl font-light text-destructive">7/10</p>
                <p className="text-sm">« Je suis en sécurité, mais l'envie est forte. »</p>
                <div className="rounded-md bg-destructive/10 p-3 text-sm">En cas de danger immédiat ou de symptômes inquiétants, appelle le 112.</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ToolTile icon={Timer} title="Laisse passer la vague" text="Minuteur de 10 minutes" />
                <ToolTile icon={Wind} title="Respiration guidée" text="Expiration lente et régulière" />
                <ToolTile icon={Brain} title="Ancrage 5-4-3-2-1" text="Revenir aux sensations présentes" />
                <ToolTile icon={Users} title="Contacter un proche" text="Message prédéfini, jamais envoyé automatiquement" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="parcours" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" /><h2 className="text-xl font-medium">Parcours guidés</h2></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProgramCard title="Comprendre mes déclencheurs" progress={100} steps="3 étapes terminées" />
            <ProgramCard title="Traverser une envie" progress={67} steps="2 étapes sur 3" />
            <ProgramCard title="Réduire progressivement" progress={33} steps="1 étape sur 3" />
            <ProgramCard title="Prévenir une rechute" progress={0} steps="Prêt à commencer" />
            <ProgramCard title="Gérer la pression sociale" progress={100} steps="Parcours terminé" />
            <ProgramCard title="Demander de l'aide" progress={33} steps="1 étape sur 3" />
          </div>
          <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_1fr]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">2</span>
            <div><p className="font-medium">Nommer l'émotion</p><p className="mt-1 text-sm text-muted-foreground">Une émotion n'est pas une consigne. La nommer peut créer un peu d'espace avant d'agir.</p><p className="mt-3 rounded-md bg-primary/10 p-3 text-sm"><strong>Petite action:</strong> choisir l'émotion la plus présente.</p></div>
          </CardContent></Card>
        </section>

        <section id="chat" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="text-xl font-medium">Chat d'accompagnement</h2></div>
          <div className="flex flex-wrap gap-2">
            {["Écoute", "Plan d'action", "Comprendre", "Préparer une discussion", "Faire face à une envie"].map((mode, index) => <span key={mode} className={`rounded-md border px-3 py-2 text-sm ${index === 1 ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{mode}</span>)}
          </div>
          <Card><CardContent className="space-y-3 p-5">
            <p className="font-medium">Construisons une prochaine étape</p>
            {["Décrire le problème en une phrase.", "Choisir une action petite et réalisable.", "Décider quand et avec quel soutien la faire."].map((step, index) => <div key={step} className="flex gap-3 rounded-md bg-muted/40 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{index + 1}</span><p className="text-sm">{step}</p></div>)}
            <div className="flex flex-wrap gap-2 pt-2">{["Je veux parler", "J'ai une envie forte", "Je me sens anxieux", "Je veux demander de l'aide"].map(text => <span key={text} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary">{text}</span>)}</div>
          </CardContent></Card>
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

        <section id="profil" className="scroll-mt-24 space-y-4">
          <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /><h2 className="text-xl font-medium">Profil, confiance et confidentialité</h2></div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Cercle de confiance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Contact name="Sophie" relation="Sœur" availability="Disponible le soir" />
                <Contact name="Alex" relation="Ami proche" availability="SMS préféré" />
                <Contact name="Dr Martin" relation="Médecin" availability="Sur rendez-vous" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="h-4 w-4 text-primary" />Protection des données</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <PrivacyRow icon={ShieldCheck} text="Coffre local protégé par PIN" />
                <PrivacyRow icon={BellOff} text="Notifications discrètes" />
                <PrivacyRow icon={CloudOff} text="Outils essentiels hors connexion" />
                <PrivacyRow icon={MessageCircle} text="Mémoire du chat désactivée" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Mes données</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Export JSON disponible</p>
                <p>Données synchronisées par compte</p>
                <p>Suppression de la mémoire du chat</p>
                <p>Mode discret et verrouillage PIN</p>
                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">Aucune publicité ciblée, aucun tracker publicitaire et aucune revente de données.</div>
              </CardContent>
            </Card>
          </div>
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

function DemoNav({ href, icon: Icon, label }: { href: string; icon: typeof Heart; label: string }) {
  return (
    <a href={href} className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border border-border bg-card p-2 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5">
      <Icon className="h-5 w-5 text-primary" />
      {label}
    </a>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></CardContent></Card>;
}

function ToolTile({ icon: Icon, title, text }: { icon: typeof Timer; title: string; text: string }) {
  return <div className="rounded-md border border-border p-4"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>;
}

function ProgramCard({ title, progress, steps }: { title: string; progress: number; steps: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-medium">{title}</p>
        <div className="mt-4 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-xs text-muted-foreground">{steps} · {progress}%</p>
      </CardContent>
    </Card>
  );
}

function Contact({ name, relation, availability }: { name: string; relation: string; availability: string }) {
  return <div className="border-b border-border pb-3 last:border-0"><p className="text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">{relation} · {availability}</p></div>;
}

function PrivacyRow({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return <div className="flex items-center gap-3 rounded-md bg-muted/35 p-3"><Icon className="h-4 w-4 shrink-0 text-primary" /><p className="text-sm">{text}</p></div>;
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
