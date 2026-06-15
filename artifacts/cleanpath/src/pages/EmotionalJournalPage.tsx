import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";

function ScoreSlider({ label, value, onChange, color = "primary" }: { label: string; value: number; onChange: (v: number) => void; color?: string }) {
  const labels = ["", "Très bas", "Bas", "Faible", "Médiocre", "Moyen", "Correct", "Bien", "Très bien", "Excellent", "Parfait"];
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm font-semibold text-primary">{value}/10 — {labels[value]}</span>
      </div>
      <Slider
        min={1} max={10} step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
        data-testid={`slider-${label}`}
      />
    </div>
  );
}

export default function EmotionalJournalPage() {
  const { emotions, setEmotions } = useAppStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntry = emotions.find(e => e.date === today);

  const [isFormOpen, setIsFormOpen] = useState(!todayEntry);
  const [form, setForm] = useState({
    mood: todayEntry?.mood ?? 5,
    anxiety: todayEntry?.anxiety ?? 5,
    sleepQuality: todayEntry?.sleepQuality ?? 5,
    energy: todayEntry?.energy ?? 5,
    gratitude: todayEntry?.gratitude ?? "",
    whatHelped: todayEntry?.whatHelped ?? "",
    whatWasDifficult: todayEntry?.whatWasDifficult ?? "",
    intentionForTomorrow: todayEntry?.intentionForTomorrow ?? "",
  });

  const handleSave = () => {
    const entry = {
      id: todayEntry?.id ?? Date.now().toString(),
      date: today,
      ...form,
    };
    if (todayEntry) {
      setEmotions(emotions.map(e => e.date === today ? entry : e));
    } else {
      setEmotions([entry, ...emotions]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Journal émotionnel</h1>
        <p className="text-muted-foreground">Comment te sens-tu aujourd'hui ?</p>
      </header>

      <Card className={todayEntry && !isFormOpen ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsFormOpen(v => !v)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {todayEntry ? "Entrée d'aujourd'hui" : "Remplir l'entrée du jour"}
            </CardTitle>
            {isFormOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
          {todayEntry && !isFormOpen && (
            <p className="text-sm text-muted-foreground mt-1">
              Humeur : {todayEntry.mood}/10 · Anxiété : {todayEntry.anxiety}/10 · Énergie : {todayEntry.energy}/10
            </p>
          )}
        </CardHeader>

        {isFormOpen && (
          <CardContent className="space-y-6">
            <ScoreSlider label="Humeur générale" value={form.mood} onChange={v => setForm(f => ({ ...f, mood: v }))} />
            <ScoreSlider label="Niveau d'anxiété" value={form.anxiety} onChange={v => setForm(f => ({ ...f, anxiety: v }))} />
            <ScoreSlider label="Qualité du sommeil" value={form.sleepQuality} onChange={v => setForm(f => ({ ...f, sleepQuality: v }))} />
            <ScoreSlider label="Niveau d'énergie" value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} />

            <div className="space-y-2">
              <Label>Gratitude du jour</Label>
              <Textarea
                placeholder="Je suis reconnaissant(e) pour..."
                value={form.gratitude}
                onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
                className="min-h-[80px]"
                data-testid="textarea-gratitude"
              />
            </div>
            <div className="space-y-2">
              <Label>Ce qui m'a aidé aujourd'hui</Label>
              <Textarea
                placeholder="Une personne, une activité, un moment..."
                value={form.whatHelped}
                onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
                className="min-h-[80px]"
                data-testid="textarea-helped"
              />
            </div>
            <div className="space-y-2">
              <Label>Ce qui a été difficile</Label>
              <Textarea
                placeholder="Sans jugement, juste observer..."
                value={form.whatWasDifficult}
                onChange={e => setForm(f => ({ ...f, whatWasDifficult: e.target.value }))}
                className="min-h-[80px]"
                data-testid="textarea-difficult"
              />
            </div>
            <div className="space-y-2">
              <Label>Mon intention pour demain</Label>
              <Textarea
                placeholder="Demain, je vais..."
                value={form.intentionForTomorrow}
                onChange={e => setForm(f => ({ ...f, intentionForTomorrow: e.target.value }))}
                className="min-h-[80px]"
                data-testid="textarea-intention"
              />
            </div>
            <Button className="w-full" onClick={handleSave} data-testid="button-save-emotion">
              Enregistrer
            </Button>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Historique</h2>
        {emotions.filter(e => e.date !== today).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune entrée passée pour le moment.</p>
        ) : (
          emotions
            .filter(e => e.date !== today)
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">{format(new Date(entry.date), "EEEE d MMMM", { locale: fr })}</p>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>Humeur {entry.mood}/10</span>
                      <span>Énergie {entry.energy}/10</span>
                    </div>
                  </div>
                  {entry.gratitude && (
                    <p className="text-sm text-muted-foreground italic">"{entry.gratitude}"</p>
                  )}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
