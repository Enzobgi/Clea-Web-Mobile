import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { MainObjective, UserProfile } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const OBJECTIVES: Array<{ value: MainObjective; label: string }> = [
  { value: "ne_pas_commencer", label: "Ne pas commencer" },
  { value: "reduire", label: "Réduire" },
  { value: "arreter", label: "Arrêter" },
  { value: "eviter_rechute", label: "Éviter une rechute" },
  { value: "aider_proche", label: "Aider un proche" },
];

export function OnboardingFlow() {
  const { profile, setProfile } = useAppStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(profile);

  const finish = () => setProfile({
    ...draft,
    nickname: draft.nickname.trim() || "Toi",
    onboardingCompleted: true,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col justify-center p-5">
        <div className="mb-6">
          <p className="text-sm text-primary">Étape {step + 1} sur 4</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-5 p-5 sm:p-7">
            {step === 0 && (
              <>
                <header>
                  <h1 className="text-2xl font-medium">Bienvenue dans CleanPath</h1>
                  <p className="mt-1 text-muted-foreground">Quelques réponses facultatives nous aideront à adapter ton espace.</p>
                </header>
                <Field label="Prénom ou pseudonyme">
                  <Input value={draft.nickname} onChange={event => setDraft({ ...draft, nickname: event.target.value })} placeholder="Comment souhaites-tu être appelé ?" />
                </Field>
                <Field label="Tranche d'âge">
                  <Select value={draft.ageRange} onValueChange={ageRange => setDraft({ ...draft, ageRange })}>
                    <SelectTrigger><SelectValue placeholder="Facultatif" /></SelectTrigger>
                    <SelectContent>
                      {["Moins de 16 ans", "16-17 ans", "18-24 ans", "25-34 ans", "35 ans ou plus"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <header>
                  <h1 className="text-2xl font-medium">Quel est ton objectif principal ?</h1>
                  <p className="mt-1 text-muted-foreground">Tu pourras le modifier à tout moment.</p>
                </header>
                <div className="space-y-2">
                  {OBJECTIVES.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraft({ ...draft, objective: option.value })}
                      className={`flex min-h-12 w-full items-center justify-between rounded-md border p-3 text-left text-sm ${draft.objective === option.value ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      {option.label}
                      {draft.objective === option.value && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <header>
                  <h1 className="text-2xl font-medium">Ce que tu souhaites suivre</h1>
                  <p className="mt-1 text-muted-foreground">Ces informations restent privées dans ton espace.</p>
                </header>
                <Field label="Substance ou comportement">
                  <Input value={draft.substance} onChange={event => setDraft({ ...draft, substance: event.target.value })} placeholder="Alcool, cannabis, nicotine..." />
                </Field>
                <Field label="Fréquence approximative">
                  <Input value={draft.frequency} onChange={event => setDraft({ ...draft, frequency: event.target.value })} placeholder="Ex. quelques fois par semaine" />
                </Field>
                <Field label="Situations difficiles">
                  <Textarea
                    value={draft.difficultSituations.join(", ")}
                    onChange={event => setDraft({ ...draft, difficultSituations: event.target.value.split(",").map(value => value.trim()).filter(Boolean) })}
                    placeholder="Stress, soirées, solitude..."
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <header>
                  <h1 className="text-2xl font-medium">Ton premier repère</h1>
                  <p className="mt-1 text-muted-foreground">Choisis une petite direction, pas une promesse parfaite.</p>
                </header>
                <Field label="Objectif personnel">
                  <Textarea value={draft.personalGoal} onChange={event => setDraft({ ...draft, personalGoal: event.target.value })} placeholder="Ex. passer trois soirées sans consommer cette semaine" />
                </Field>
                <Field label="Date de départ">
                  <Input type="date" value={draft.startDate} onChange={event => setDraft({ ...draft, startDate: event.target.value })} />
                </Field>
                <Field label="Pays ou région">
                  <Input value={draft.region} onChange={event => setDraft({ ...draft, region: event.target.value })} />
                </Field>
                <div className="flex items-center justify-between gap-4 rounded-md bg-muted/40 p-3">
                  <div><Label>Notifications discrètes</Label><p className="text-xs text-muted-foreground">Aucune mention de consommation.</p></div>
                  <Switch checked={draft.notificationsEnabled} onCheckedChange={notificationsEnabled => setDraft({ ...draft, notificationsEnabled })} />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>}
              <Button className="ml-auto" onClick={() => step === 3 ? finish() : setStep(step + 1)}>
                {step === 3 ? "Commencer" : "Continuer"}
                {step < 3 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">CleanPath ne pose pas de diagnostic et ne remplace pas un professionnel de santé.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
