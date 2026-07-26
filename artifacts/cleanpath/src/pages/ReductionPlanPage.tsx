import { Link } from "wouter";
import { Activity, ArrowRight, CalendarDays, Euro, Target, type LucideIcon } from "lucide-react";
import { useAppStore, type SubstanceTracking } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ReductionPlanPage() {
  const { substanceTrackings, setSubstanceTrackings, consumptions } = useAppStore();
  const reductionTrackings = substanceTrackings.filter(tracking => !tracking.archivedAt && tracking.objective === "reduction");

  const updateTracking = (id: string, patch: Partial<SubstanceTracking>) => {
    setSubstanceTrackings(substanceTrackings.map(tracking =>
      tracking.id === id ? { ...tracking, ...patch } : tracking
    ));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium">Plan de réduction</h1>
        <p className="text-muted-foreground">
          Ajuste une réduction progressive par produit, sans transformer un ajustement en échec.
        </p>
      </header>

      {reductionTrackings.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Aucun produit n'a encore un objectif de réduction. Ajoute ou modifie un suivi par produit dans Objectifs.
            </p>
            <Button asChild variant="outline">
              <Link href="/objectifs">
                Ouvrir les objectifs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {reductionTrackings.map(tracking => {
            const plan = tracking.reductionPlan ?? emptyPlan();
            const entries = consumptions.filter(entry =>
              entry.type === "consommation"
              && ((entry.substanceId && entry.substanceId === tracking.id)
                || (!entry.substanceId && entry.substance.toLowerCase() === tracking.name.toLowerCase()))
            );
            const last7Quantity = quantitySince(entries, daysAgo(6));
            const plannedToday = plannedAmountForToday(tracking);
            const weeklyTarget = plannedToday === null ? null : plannedToday * 7;
            const progress = weeklyTarget && weeklyTarget > 0
              ? Math.max(0, Math.min(100, Math.round((1 - last7Quantity / weeklyTarget) * 100)))
              : null;
            const savingsPerUnit = Number.parseFloat(plan.optionalSavingsPerUnit.replace(",", "."));
            const startWeekly = Number.parseFloat(plan.startAmount.replace(",", ".")) * 7;
            const estimatedSavings = Number.isFinite(savingsPerUnit) && Number.isFinite(startWeekly)
              ? Math.max(0, (startWeekly - last7Quantity) * savingsPerUnit)
              : null;

            return (
              <Card key={tracking.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{tracking.name}</CardTitle>
                  <CardDescription>
                    Unité : {tracking.unit || "unité"} · début le {formatDate(tracking.startDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Metric icon={Target} label="Plan aujourd'hui" value={plannedToday === null ? "À définir" : `${formatNumber(plannedToday)} ${tracking.unit}`} />
                    <Metric icon={CalendarDays} label="Cible semaine" value={weeklyTarget === null ? "À définir" : `${formatNumber(weeklyTarget)} ${tracking.unit}`} />
                    <Metric icon={Activity} label="Réel 7 jours" value={`${formatNumber(last7Quantity)} ${tracking.unit}`} />
                    <Metric icon={Euro} label="Économies" value={estimatedSavings === null ? "Facultatif" : `${formatNumber(estimatedSavings)} €`} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Progression réelle par rapport au plan hebdomadaire</span>
                      <span className="font-medium">{progress === null ? "À configurer" : `${progress} %`}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${progress ?? 0}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si le plan doit changer, ajuste-le ici. CleanPath l'enregistre comme une adaptation normale.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <PlanField label="Objectif de départ" value={plan.startAmount} unit={tracking.unit} onChange={startAmount => updateTracking(tracking.id, { reductionPlan: { ...plan, startAmount, adjustedAt: new Date().toISOString() } })} />
                    <PlanField label="Objectif final" value={plan.targetAmount} unit={tracking.unit} onChange={targetAmount => updateTracking(tracking.id, { reductionPlan: { ...plan, targetAmount, adjustedAt: new Date().toISOString() } })} />
                    <PlanField label="Étape hebdomadaire" value={plan.weeklyStep} unit={tracking.unit} onChange={weeklyStep => updateTracking(tracking.id, { reductionPlan: { ...plan, weeklyStep, adjustedAt: new Date().toISOString() } })} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Périodes plus difficiles</Label>
                      <Textarea
                        value={plan.difficultPeriods}
                        onChange={event => updateTracking(tracking.id, { reductionPlan: { ...plan, difficultPeriods: event.target.value, adjustedAt: new Date().toISOString() } })}
                        placeholder="Ex : soirées, hiver, après le travail..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Stratégies de remplacement</Label>
                      <Textarea
                        value={plan.replacementStrategies}
                        onChange={event => updateTracking(tracking.id, { reductionPlan: { ...plan, replacementStrategies: event.target.value, adjustedAt: new Date().toISOString() } })}
                        placeholder="Ex : boisson sans alcool, marcher, appeler quelqu'un..."
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Économie par unité (€)</Label>
                      <Input
                        value={plan.optionalSavingsPerUnit}
                        onChange={event => updateTracking(tracking.id, { reductionPlan: { ...plan, optionalSavingsPerUnit: event.target.value, adjustedAt: new Date().toISOString() } })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Note d'ajustement</Label>
                      <Input
                        value={plan.adjustmentNote ?? ""}
                        onChange={event => updateTracking(tracking.id, { reductionPlan: { ...plan, adjustmentNote: event.target.value, adjustedAt: new Date().toISOString() } })}
                        placeholder="Pourquoi j'ajuste le plan maintenant ?"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function emptyPlan(): NonNullable<SubstanceTracking["reductionPlan"]> {
  return {
    startAmount: "",
    targetAmount: "",
    weeklyStep: "",
    difficultPeriods: "",
    replacementStrategies: "",
    optionalSavingsPerUnit: "",
    adjustmentNote: "",
  };
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function quantitySince(entries: Array<{ date: string; quantity: string }>, startDate: string) {
  return entries
    .filter(entry => entry.date >= startDate)
    .reduce((sum, entry) => {
      const value = Number.parseFloat(String(entry.quantity).replace(",", "."));
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
}

function plannedAmountForToday(tracking: SubstanceTracking) {
  const plan = tracking.reductionPlan;
  if (!plan?.startAmount || !plan.targetAmount || !plan.weeklyStep) return null;
  const start = Number.parseFloat(plan.startAmount.replace(",", "."));
  const target = Number.parseFloat(plan.targetAmount.replace(",", "."));
  const weeklyStep = Number.parseFloat(plan.weeklyStep.replace(",", "."));
  if (![start, target, weeklyStep].every(Number.isFinite) || weeklyStep <= 0) return null;
  const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(`${tracking.startDate}T00:00:00`).getTime()) / 86_400_000));
  const elapsedWeeks = Math.floor(elapsedDays / 7);
  const direction = start >= target ? -1 : 1;
  const planned = start + direction * weeklyStep * elapsedWeeks;
  return direction < 0 ? Math.max(target, planned) : Math.min(target, planned);
}

function formatNumber(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(".", ",");
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-BE");
}

function PlanField({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={event => onChange(event.target.value)} />
        <span className="shrink-0 text-xs text-muted-foreground">{unit || "unité"}</span>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/35 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
