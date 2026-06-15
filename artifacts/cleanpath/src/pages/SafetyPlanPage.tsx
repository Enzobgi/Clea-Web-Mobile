import { useAppStore, SafetyPlan } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FIELDS: { key: keyof SafetyPlan; label: string; placeholder: string }[] = [
  { key: "reasons", label: "Pourquoi je veux arrêter ou réduire", placeholder: "Mes raisons profondes..." },
  { key: "risks", label: "Ce que je risque si je continue", placeholder: "Les conséquences que je veux éviter..." },
  { key: "gains", label: "Ce que je gagne en arrêtant", placeholder: "Ce qui m'attend de l'autre côté..." },
  { key: "triggers", label: "Mes déclencheurs principaux", placeholder: "Les situations, émotions ou personnes qui me donnent envie..." },
  { key: "strategies", label: "Mes stratégies quand j'ai envie", placeholder: "Ce que je peux faire à la place..." },
  { key: "contacts", label: "Les personnes que je peux contacter", placeholder: "Qui peut m'aider dans ces moments ?" },
  { key: "placesToAvoid", label: "Les endroits à éviter", placeholder: "Les lieux qui m'exposent à la tentation..." },
  { key: "helpfulPhrases", label: "Les phrases qui m'aident", placeholder: "Des mots qui me ramènent à moi-même..." },
  { key: "calmingActivities", label: "Les activités qui m'apaisent", placeholder: "Ce qui me fait du bien quand c'est difficile..." },
];

export default function SafetyPlanPage() {
  const { safetyPlan, setSafetyPlan } = useAppStore();

  const filled = FIELDS.filter(f => safetyPlan[f.key]?.trim()).length;
  const completion = Math.round((filled / FIELDS.length) * 100);

  const handleChange = (field: keyof SafetyPlan) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSafetyPlan({ ...safetyPlan, [field]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Plan de sécurité</h1>
        <p className="text-muted-foreground">Ton guide personnel pour les moments difficiles. Il t'appartient.</p>
      </header>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Complété à</span>
          <span className="font-medium text-foreground">{completion}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-700"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <Card className="bg-muted/30 border-none">
        <CardContent className="p-4 text-sm text-muted-foreground italic">
          Ce plan est un outil privé. Il n'y a pas de bonne ou de mauvaise réponse. Remplis-le à ton rythme.
        </CardContent>
      </Card>

      <div className="space-y-6">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label className="text-base font-medium">{label}</Label>
            <Textarea
              value={safetyPlan[key]}
              onChange={handleChange(key)}
              placeholder={placeholder}
              className="min-h-[100px] resize-none"
              data-testid={`textarea-safety-${key}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
