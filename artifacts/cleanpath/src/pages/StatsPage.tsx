import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const { sessions, consumptions, cravings, emotions } = useAppStore();

  const currentSession = sessions.find(s => !s.endDate);
  const currentStreak = currentSession
    ? differenceInDays(new Date(), new Date(currentSession.startDate))
    : 0;

  const bestStreak = sessions.reduce((best, s) => {
    const end = s.endDate ? new Date(s.endDate) : new Date();
    const days = differenceInDays(end, new Date(s.startDate));
    return Math.max(best, days);
  }, 0);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const monthConsumptions = consumptions.filter(c =>
    c.type === "consommation" &&
    new Date(c.date) >= monthStart && new Date(c.date) <= monthEnd
  ).length;

  const cravingsOvercome = cravings.filter(c => c.outcome === "tenu_bon").length +
    consumptions.filter(c => c.type === "envie_seulement").length;

  const totalAbstinent = sessions.reduce((total, s) => {
    const end = s.endDate ? new Date(s.endDate) : new Date();
    return total + differenceInDays(end, new Date(s.startDate));
  }, 0);

  const triggerCounts: Record<string, number> = {};
  consumptions.filter(c => c.trigger).forEach(c => {
    triggerCounts[c.trigger] = (triggerCounts[c.trigger] || 0) + 1;
  });
  const triggerData = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }));

  const emotionCounts: Record<string, number> = {};
  consumptions.filter(c => c.emotionBefore).forEach(c => {
    emotionCounts[c.emotionBefore] = (emotionCounts[c.emotionBefore] || 0) + 1;
  });
  const emotionData = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count }));

  const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const trendData = last30Days.map(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    const emotion = emotions.find(e => e.date === dateStr);
    const dayConsumptions = consumptions.filter(c => c.date === dateStr && c.type === "consommation").length;
    return {
      date: format(day, "d MMM", { locale: fr }),
      humeur: emotion?.mood ?? null,
      envies: dayConsumptions,
    };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Statistiques</h1>
        <p className="text-muted-foreground">Chaque chiffre est une preuve de ton engagement.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Série actuelle" value={`${currentStreak} j`} sub="Continue comme ça !" />
        <StatCard label="Meilleure série" value={`${bestStreak} j`} sub="Ton record" />
        <StatCard label="Jours abstinents au total" value={totalAbstinent} sub="Depuis le début" />
        <StatCard label="Envies surmontées" value={cravingsOvercome} sub="Tu as tenu bon" />
        <StatCard
          label="Consommations ce mois"
          value={monthConsumptions}
          sub={monthConsumptions === 0 ? "Mois parfait !" : "Chaque moment est une info"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Humeur des 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.some(d => d.humeur !== null) ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} className="text-muted-foreground" />
                <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="humeur" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls name="Humeur" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Commence à remplir ton journal émotionnel pour voir cette courbe.</p>
          )}
        </CardContent>
      </Card>

      {triggerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Déclencheurs les plus fréquents</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={triggerData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" name="Occurrences" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {emotionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Émotions associées aux envies</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" name="Occurrences" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-none">
        <CardContent className="p-5 text-center">
          <p className="text-muted-foreground italic text-sm">
            "Le progrès, ce n'est pas toujours une ligne droite. C'est avancer, même à petits pas."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
