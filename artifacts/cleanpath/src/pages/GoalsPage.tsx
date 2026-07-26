import { useState } from "react";
import { useAppStore, Goal, type SubstanceTracking } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, Check, Plus } from "lucide-react";
import { getCurrentAbstinentStreak } from "@/lib/abstinence";

const PRESET_DAYS = [1, 3, 7, 14, 30, 60, 90];

const emptyTracking = (): Omit<SubstanceTracking, "id"> => ({
  name: "",
  category: "",
  objective: "abstinence",
  startDate: new Date().toISOString().slice(0, 10),
  unit: "",
  dailyLimit: "",
  weeklyLimit: "",
  usualFrequency: "",
  archivedAt: null,
});

export default function GoalsPage() {
  const { goals, setGoals, dayEntries, consumptions, substanceTrackings, setSubstanceTrackings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [customReward, setCustomReward] = useState("");
  const [trackingDraft, setTrackingDraft] = useState<Omit<SubstanceTracking, "id">>(() => emptyTracking());

  const currentStreak = getCurrentAbstinentStreak(dayEntries, consumptions);
  const activeTrackings = substanceTrackings.filter(tracking => !tracking.archivedAt);
  const archivedTrackings = substanceTrackings.filter(tracking => tracking.archivedAt);

  const getProgress = (days: number) => Math.min(100, Math.round((currentStreak / days) * 100));

  const checkAchievements = (updatedGoals: Goal[]) => {
    return updatedGoals.map(g => ({
      ...g,
      achievedDate: !g.achievedDate && currentStreak >= g.days ? new Date().toISOString() : g.achievedDate,
    }));
  };

  const addGoal = () => {
    const days = parseInt(customDays, 10);
    if (!days || days <= 0) return;
    const newGoal: Goal = { days, reward: customReward, achievedDate: currentStreak >= days ? new Date().toISOString() : null };
    setGoals(checkAchievements([...goals, newGoal]));
    setCustomDays("");
    setCustomReward("");
    setOpen(false);
  };

  const updateReward = (index: number, reward: string) => {
    const updated = goals.map((g, i) => i === index ? { ...g, reward } : g);
    setGoals(updated);
  };

  const addTracking = () => {
    if (!trackingDraft.name.trim()) return;
    setSubstanceTrackings([
      ...substanceTrackings,
      {
        id: Date.now().toString(),
        ...trackingDraft,
        name: trackingDraft.name.trim(),
        unit: trackingDraft.unit.trim() || "unité",
      },
    ]);
    setTrackingDraft(emptyTracking());
    setTrackingOpen(false);
  };

  const archiveTracking = (id: string) => {
    setSubstanceTrackings(substanceTrackings.map(tracking =>
      tracking.id === id ? { ...tracking, archivedAt: new Date().toISOString() } : tracking
    ));
  };

  const restoreTracking = (id: string) => {
    setSubstanceTrackings(substanceTrackings.map(tracking =>
      tracking.id === id ? { ...tracking, archivedAt: null } : tracking
    ));
  };

  const sortedGoals = [...goals].sort((a, b) => a.days - b.days);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-medium text-foreground">Objectifs</h1>
          <p className="text-muted-foreground">Chaque étape mérite d'être célébrée.</p>
        </header>
        <Button size="icon" variant="outline" onClick={() => setOpen(true)} data-testid="button-add-goal">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <p className="text-sm text-muted-foreground">Série actuelle</p>
        <p className="text-3xl font-light text-primary">{currentStreak} jour{currentStreak > 1 ? "s" : ""}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">Suivis par produit</h2>
            <p className="text-sm text-muted-foreground">Chaque suivi peut avoir son propre objectif.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTrackingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {activeTrackings.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              Aucun suivi séparé pour le moment. Tu peux suivre l'abstinence, une réduction ou une stabilisation pour plusieurs produits.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeTrackings.map(tracking => {
              const entries = consumptions.filter(entry =>
                entry.type === "consommation"
                && ((entry.substanceId && entry.substanceId === tracking.id) || (!entry.substanceId && entry.substance.toLowerCase() === tracking.name.toLowerCase()))
              );
              const totalQuantity = entries.reduce((sum, entry) => {
                const value = Number.parseFloat(String(entry.quantity).replace(",", "."));
                return Number.isFinite(value) ? sum + value : sum;
              }, 0);
              return (
                <Card key={tracking.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{tracking.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {objectiveLabel(tracking.objective)} · {tracking.category || "Catégorie non précisée"} · depuis le {format(new Date(`${tracking.startDate}T00:00:00`), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => archiveTracking(tracking.id)} aria-label={`Archiver ${tracking.name}`}>
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 text-sm">
                      <Info label="Événements" value={String(entries.length)} />
                      <Info label="Quantité totale" value={totalQuantity > 0 ? `${formatNumber(totalQuantity)} ${tracking.unit}` : "Non chiffrée"} />
                      <Info label="Plafond" value={tracking.dailyLimit ? `${tracking.dailyLimit} ${tracking.unit}/jour` : tracking.weeklyLimit ? `${tracking.weeklyLimit} ${tracking.unit}/semaine` : "Non défini"} />
                    </div>
                    {tracking.usualFrequency && <p className="text-xs text-muted-foreground">Fréquence habituelle : {tracking.usualFrequency}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {archivedTrackings.length > 0 && (
          <div className="rounded-md bg-muted/35 p-3 text-sm">
            <p className="font-medium">Suivis archivés</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {archivedTrackings.map(tracking => (
                <Button key={tracking.id} variant="outline" size="sm" onClick={() => restoreTracking(tracking.id)}>
                  Restaurer {tracking.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="space-y-4">
        {sortedGoals.map((goal, idx) => {
          const progress = getProgress(goal.days);
          const achieved = !!goal.achievedDate;
          return (
            <Card key={`${goal.days}-${idx}`} className={achieved ? "border-primary/30" : ""} data-testid={`card-goal-${goal.days}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {achieved ? (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted shrink-0" />
                      )}
                      <p className="font-medium">
                        {goal.days} {goal.days === 1 ? "jour" : "jours"}
                      </p>
                    </div>
                    {achieved && goal.achievedDate && (
                      <p className="text-xs text-primary mt-1 ml-8">
                        Atteint le {format(new Date(goal.achievedDate), "d MMMM yyyy", { locale: fr })}
                      </p>
                    )}
                  </div>
                  {achieved && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">Atteint !</span>
                  )}
                </div>

                {!achieved && (
                  <div className="ml-8 space-y-1">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{progress}% — encore {goal.days - currentStreak} jour{goal.days - currentStreak > 1 ? "s" : ""}</p>
                  </div>
                )}

                <div className="ml-8 space-y-1">
                  <Label className="text-xs text-muted-foreground">Récompense prévue</Label>
                  <Input
                    value={goal.reward}
                    onChange={e => updateReward(idx, e.target.value)}
                    placeholder="Quelle récompense tu t'accordes ?"
                    className="h-8 text-sm"
                    data-testid={`input-reward-${goal.days}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un objectif personnalisé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre de jours</Label>
              <Input
                type="number"
                min={1}
                value={customDays}
                onChange={e => setCustomDays(e.target.value)}
                placeholder="Ex : 45"
                data-testid="input-custom-days"
              />
            </div>
            <div className="space-y-1">
              <Label>Récompense</Label>
              <Input
                value={customReward}
                onChange={e => setCustomReward(e.target.value)}
                placeholder="Un voyage, un cadeau..."
                data-testid="input-custom-reward"
              />
            </div>
            <Button className="w-full" onClick={addGoal} data-testid="button-save-goal">
              Ajouter l'objectif
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un suivi par produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={trackingDraft.name} onChange={event => setTrackingDraft({ ...trackingDraft, name: event.target.value })} placeholder="Cigarettes, alcool, cannabis..." />
            </div>
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <Input value={trackingDraft.category} onChange={event => setTrackingDraft({ ...trackingDraft, category: event.target.value })} placeholder="Tabac, alcool, stimulant..." />
            </div>
            <div className="space-y-1">
              <Label>Objectif</Label>
              <Select value={trackingDraft.objective} onValueChange={value => setTrackingDraft({ ...trackingDraft, objective: value as SubstanceTracking["objective"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="abstinence">Abstinence</SelectItem>
                  <SelectItem value="reduction">Réduction progressive</SelectItem>
                  <SelectItem value="stabilisation">Stabilisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date de début</Label>
                <Input type="date" value={trackingDraft.startDate} onChange={event => setTrackingDraft({ ...trackingDraft, startDate: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Unité</Label>
                <Input value={trackingDraft.unit} onChange={event => setTrackingDraft({ ...trackingDraft, unit: event.target.value })} placeholder="cigarette, verre, g..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Plafond/jour</Label>
                <Input value={trackingDraft.dailyLimit} onChange={event => setTrackingDraft({ ...trackingDraft, dailyLimit: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Plafond/semaine</Label>
                <Input value={trackingDraft.weeklyLimit} onChange={event => setTrackingDraft({ ...trackingDraft, weeklyLimit: event.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Fréquence habituelle</Label>
              <Input value={trackingDraft.usualFrequency} onChange={event => setTrackingDraft({ ...trackingDraft, usualFrequency: event.target.value })} placeholder="Ex : surtout le soir, 5 jours/semaine..." />
            </div>
            <Button className="w-full" onClick={addTracking}>Enregistrer ce suivi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function objectiveLabel(objective: SubstanceTracking["objective"]) {
  if (objective === "abstinence") return "Abstinence";
  if (objective === "reduction") return "Réduction";
  return "Stabilisation";
}

function formatNumber(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(".", ",");
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
