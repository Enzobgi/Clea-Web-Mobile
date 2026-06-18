import { useState } from "react";
import { useAppStore, Goal } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Plus } from "lucide-react";
import { getCurrentAbstinentStreak } from "@/lib/abstinence";

const PRESET_DAYS = [1, 3, 7, 14, 30, 60, 90];

export default function GoalsPage() {
  const { goals, setGoals, dayEntries, consumptions } = useAppStore();
  const [open, setOpen] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [customReward, setCustomReward] = useState("");

  const currentStreak = getCurrentAbstinentStreak(dayEntries, consumptions);

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
    </div>
  );
}
