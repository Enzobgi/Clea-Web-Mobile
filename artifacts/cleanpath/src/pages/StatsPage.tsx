import { useAppStore, type EmotionalEntry } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eachDayOfInterval, endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Activity, Brain, CalendarDays, Heart, Leaf, Moon, ShieldCheck, Snowflake, Sun, TrendingUp } from "lucide-react";
import {
  getBestAbstinentStreak,
  getCurrentAbstinentStreak,
  getDayStatus,
  getMarkedDates,
  getTotalAbstinentDays,
} from "@/lib/abstinence";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
};

function average(entries: EmotionalEntry[], field: keyof Pick<EmotionalEntry, "mood" | "anxiety" | "sleepQuality" | "energy">) {
  if (entries.length === 0) return null;
  return entries.reduce((sum, entry) => sum + entry[field], 0) / entries.length;
}

function formatScore(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1).replace(".", ",")} / 10`;
}

type SeasonId = "winter" | "spring" | "summer" | "autumn";

const SEASONS: Array<{ id: SeasonId; label: string }> = [
  { id: "winter", label: "Hiver" },
  { id: "spring", label: "Printemps" },
  { id: "summer", label: "Été" },
  { id: "autumn", label: "Automne" },
];

function getSeason(dateStr: string): SeasonId {
  const month = Number(dateStr.slice(5, 7));
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Heart;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-primary" />
        <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ScoreProgress({
  label,
  value,
  inverse = false,
}: {
  label: string;
  value: number | null;
  inverse?: boolean;
}) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value * 10));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatScore(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${inverse ? "bg-secondary" : "bg-primary"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { dayEntries, consumptions, cravings, emotions } = useAppStore();
  const now = new Date();
  const last30Start = subDays(now, 29);
  const previous30Start = subDays(now, 59);

  const currentStreak = getCurrentAbstinentStreak(dayEntries, consumptions);
  const bestStreak = getBestAbstinentStreak(dayEntries, consumptions);
  const totalAbstinent = getTotalAbstinentDays(dayEntries, consumptions);

  const markedDates = getMarkedDates(dayEntries, consumptions);
  const comparableDays = markedDates.filter(date => {
    const status = getDayStatus(date, dayEntries, consumptions);
    return status === "abstinent" || status === "consommation";
  });
  const abstinenceRate = comparableDays.length === 0
    ? null
    : Math.round((totalAbstinent / comparableDays.length) * 100);

  const consumptionEntries = consumptions.filter(entry => entry.type === "consommation");
  const cravingOnlyEntries = consumptions.filter(entry => entry.type === "envie_seulement");
  const overcomeCravings = cravings.filter(entry => entry.outcome === "tenu_bon").length + cravingOnlyEntries.length;
  const consumedCravings = cravings.filter(entry => entry.outcome === "consomme").length + consumptionEntries.length;
  const knownCravingOutcomes = overcomeCravings + consumedCravings;
  const cravingSuccessRate = knownCravingOutcomes === 0 ? null : Math.round((overcomeCravings / knownCravingOutcomes) * 100);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthConsumptions = consumptionEntries.filter(entry => {
    const date = new Date(`${entry.date}T00:00:00`);
    return date >= monthStart && date <= monthEnd;
  }).length;

  const recentEmotions = emotions.filter(entry => new Date(`${entry.date}T00:00:00`) >= last30Start);
  const previousEmotions = emotions.filter(entry => {
    const date = new Date(`${entry.date}T00:00:00`);
    return date >= previous30Start && date < last30Start;
  });

  const moodAverage = average(recentEmotions, "mood");
  const anxietyAverage = average(recentEmotions, "anxiety");
  const sleepAverage = average(recentEmotions, "sleepQuality");
  const energyAverage = average(recentEmotions, "energy");
  const previousMoodAverage = average(previousEmotions, "mood");
  const moodEvolution = moodAverage !== null && previousMoodAverage !== null && previousMoodAverage > 0
    ? Math.round(((moodAverage - previousMoodAverage) / previousMoodAverage) * 100)
    : null;

  const countBy = (field: "trigger" | "emotionBefore") => {
    const counts: Record<string, number> = {};
    consumptions.forEach(entry => {
      const value = entry[field]?.trim();
      if (value) counts[value] = (counts[value] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));
  };

  const triggerData = countBy("trigger");
  const emotionData = countBy("emotionBefore");
  const topTrigger = triggerData[0]?.name;
  const topEmotion = emotionData[0]?.name;

  const seasonalData = SEASONS.map(season => {
    const trackedDates = comparableDays.filter(date => getSeason(date) === season.id);
    const consumptionDates = trackedDates.filter(date =>
      getDayStatus(date, dayEntries, consumptions) === "consommation"
    );
    return {
      ...season,
      trackedDays: trackedDates.length,
      consumptionDays: consumptionDates.length,
      rate: trackedDates.length > 0
        ? Math.round((consumptionDates.length / trackedDates.length) * 100)
        : null,
    };
  });
  const seasonsWithEnoughData = seasonalData.filter(season => season.trackedDays >= 7 && season.rate !== null);
  const highestSeason = seasonsWithEnoughData.slice().sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];
  const lowestSeason = seasonsWithEnoughData.slice().sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0];
  const seasonalObservation = seasonsWithEnoughData.length < 2
    ? "Au moins sept jours renseignés dans deux saisons différentes sont nécessaires pour faire une comparaison utile."
    : highestSeason && lowestSeason && highestSeason.id !== lowestSeason.id
      ? `Dans tes données, la part de jours avec consommation est plus élevée en ${highestSeason.label.toLowerCase()} (${highestSeason.rate} %) qu'en ${lowestSeason.label.toLowerCase()} (${lowestSeason.rate} %). Cette observation est indicative et peut aussi dépendre des contextes renseignés.`
      : "Les données renseignées ne montrent pas encore de différence saisonnière nette.";

  const last30Days = eachDayOfInterval({ start: last30Start, end: now });
  const trendData = last30Days.map(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    const emotion = emotions.find(entry => entry.date === dateStr);
    return {
      date: format(day, "d MMM", { locale: fr }),
      humeur: emotion?.mood ?? null,
      sommeil: emotion?.sleepQuality ?? null,
      energie: emotion?.energy ?? null,
      anxiete: emotion?.anxiety ?? null,
    };
  });

  const hasEmotionalData = recentEmotions.length > 0;
  const summaryItems = [
    currentStreak > 0
      ? `La série actuelle est de ${currentStreak} jour${currentStreak > 1 ? "s" : ""} sans consommation.`
      : "Aucune série d'abstinence n'est active aujourd'hui.",
    topTrigger
      ? `Le déclencheur le plus souvent encodé est « ${topTrigger} ».`
      : "Pas encore assez de données pour identifier un déclencheur fréquent.",
    topEmotion
      ? `L'émotion la plus souvent associée aux envies est « ${topEmotion} ».`
      : "Pas encore assez de données pour identifier une émotion fréquente avant les envies.",
    moodEvolution === null
      ? "Deux périodes de 30 jours sont nécessaires pour calculer l'évolution de l'humeur."
      : `L'humeur moyenne a ${moodEvolution >= 0 ? "augmenté" : "diminué"} de ${Math.abs(moodEvolution)} % par rapport aux 30 jours précédents.`,
    seasonsWithEnoughData.length >= 2 && highestSeason
      ? `La saison actuellement la plus associée aux jours de consommation dans tes données est ${highestSeason.label.toLowerCase()}.`
      : "Davantage d'historique est nécessaire pour observer un éventuel effet saisonnier.",
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Statistiques détaillées</h1>
        <p className="text-muted-foreground">
          Une vue complète de ton parcours, utile pour toi et pour préparer un échange avec un professionnel.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Parcours d'abstinence</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard icon={TrendingUp} label="Série actuelle" value={`${currentStreak} j`} />
          <StatCard icon={ShieldCheck} label="Meilleure série" value={`${bestStreak} j`} />
          <StatCard icon={CalendarDays} label="Jours sans consommation" value={totalAbstinent} />
          <StatCard
            icon={Activity}
            label="Taux sans consommation"
            value={abstinenceRate === null ? "—" : `${abstinenceRate} %`}
            sub="Parmi les jours renseignés"
          />
          <StatCard icon={Brain} label="Consommations ce mois" value={monthConsumptions} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Bien-être sur 30 jours</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard icon={Heart} label="Humeur moyenne" value={formatScore(moodAverage)} />
          <StatCard icon={Moon} label="Sommeil moyen" value={formatScore(sleepAverage)} />
          <StatCard icon={Sun} label="Énergie moyenne" value={formatScore(energyAverage)} />
          <StatCard icon={Brain} label="Anxiété moyenne" value={formatScore(anxietyAverage)} />
          <StatCard
            icon={TrendingUp}
            label="Évolution de l'humeur"
            value={moodEvolution === null ? "—" : `${moodEvolution > 0 ? "+" : ""}${moodEvolution} %`}
            sub="Face aux 30 jours précédents"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Évolution quotidienne</CardTitle>
          </CardHeader>
          <CardContent>
            {hasEmotionalData ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 5, right: 8, left: -22, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={5} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="humeur" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} connectNulls name="Humeur" />
                  <Line type="monotone" dataKey="sommeil" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} connectNulls name="Sommeil" />
                  <Line type="monotone" dataKey="energie" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} connectNulls name="Énergie" />
                  <Line type="monotone" dataKey="anxiete" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} connectNulls name="Anxiété" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Remplis le journal émotionnel pour faire apparaître les tendances.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicateurs moyens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ScoreProgress label="Humeur" value={moodAverage} />
            <ScoreProgress label="Qualité du sommeil" value={sleepAverage} />
            <ScoreProgress label="Niveau d'énergie" value={energyAverage} />
            <ScoreProgress label="Niveau d'anxiété" value={anxietyAverage} inverse />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FrequencyChart
          title="Déclencheurs les plus fréquents"
          data={triggerData}
          emptyText="Encode les déclencheurs dans le journal de consommation pour voir cette analyse."
          color="hsl(var(--secondary))"
        />
        <FrequencyChart
          title="Émotions associées aux envies"
          data={emotionData}
          emptyText="Encode l'émotion ressentie avant une envie pour voir cette analyse."
          color="hsl(var(--accent))"
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Saisonnalité</h2>
          <p className="text-sm text-muted-foreground">
            Comparaison des jours avec consommation parmi les jours réellement renseignés pour chaque saison.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux de jours avec consommation par saison</CardTitle>
            </CardHeader>
            <CardContent>
              {seasonalData.some(season => season.rate !== null) ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, _name, item) => [
                        `${value ?? 0} % (${item.payload.consumptionDays}/${item.payload.trackedDays} jours)`,
                        "Jours avec consommation",
                      ]}
                    />
                    <Bar dataKey="rate" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-14 text-center text-sm text-muted-foreground">
                  Renseigne des jours dans le calendrier pour commencer l'analyse saisonnière.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lecture prudente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <SeasonStat icon={Snowflake} label="Hiver" data={seasonalData[0]} />
                <SeasonStat icon={Leaf} label="Printemps" data={seasonalData[1]} />
                <SeasonStat icon={Sun} label="Été" data={seasonalData[2]} />
                <SeasonStat icon={Leaf} label="Automne" data={seasonalData[3]} />
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-sm leading-relaxed">{seasonalObservation}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Les saisons suivent ici le calendrier de l'hémisphère nord. Cette comparaison ne constitue pas une conclusion médicale.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gestion des envies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-3xl font-semibold text-primary">
                {cravingSuccessRate === null ? "—" : `${cravingSuccessRate} %`}
              </p>
              <p className="text-sm text-muted-foreground">d'envies surmontées parmi les issues encodées</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-xl font-semibold text-primary">{overcomeCravings}</p>
                <p className="text-xs text-muted-foreground">Envies surmontées</p>
              </div>
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-xl font-semibold text-destructive">{consumedCravings}</p>
                <p className="text-xs text-muted-foreground">Issues avec consommation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résumé pour préparer un rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryItems.map(item => (
              <div key={item} className="flex gap-3 rounded-md bg-muted/35 p-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm leading-relaxed">{item}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Ce résumé décrit uniquement les données encodées. Il ne remplace pas l'avis d'un professionnel de santé.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SeasonStat({
  icon: Icon,
  label,
  data,
}: {
  icon: typeof Sun;
  label: string;
  data: { rate: number | null; trackedDays: number };
}) {
  return (
    <div className="rounded-md bg-muted/35 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-semibold">{data.rate === null ? "—" : `${data.rate} %`}</p>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{data.trackedDays} jour{data.trackedDays > 1 ? "s" : ""} renseigné{data.trackedDays > 1 ? "s" : ""}</p>
    </div>
  );
}

function FrequencyChart({
  title,
  data,
  emptyText,
  color,
}: {
  title: string;
  data: Array<{ name: string; count: number }>;
  emptyText: string;
  color: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={110}
                tickFormatter={value => value.length > 17 ? `${value.slice(0, 17)}…` : value}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={color} name="Occurrences" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
