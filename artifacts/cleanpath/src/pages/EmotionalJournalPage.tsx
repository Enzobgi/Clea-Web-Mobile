import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, Heart, Moon, Pencil, Sparkles, Sun } from "lucide-react";

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
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
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedEntry = emotions.find(e => e.date === selectedDate);
  const isPastDate = selectedDate < today;
  const showRetrospectiveTag = selectedEntry?.createdAt
    ? selectedEntry.createdAt > selectedEntry.date
    : !selectedEntry && isPastDate;

  const [isFormOpen, setIsFormOpen] = useState(!selectedEntry);
  const [form, setForm] = useState({
    mood: selectedEntry?.mood ?? 5,
    anxiety: selectedEntry?.anxiety ?? 5,
    sleepQuality: selectedEntry?.sleepQuality ?? 5,
    energy: selectedEntry?.energy ?? 5,
    gratitude: selectedEntry?.gratitude ?? "",
    whatHelped: selectedEntry?.whatHelped ?? "",
    whatWasDifficult: selectedEntry?.whatWasDifficult ?? "",
    intentionForTomorrow: selectedEntry?.intentionForTomorrow ?? "",
  });
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setSavedMessage("");
    setIsFormOpen(!selectedEntry);
    if (!selectedEntry) {
      setForm({
        mood: 5,
        anxiety: 5,
        sleepQuality: 5,
        energy: 5,
        gratitude: "",
        whatHelped: "",
        whatWasDifficult: "",
        intentionForTomorrow: "",
      });
      return;
    }
    setForm({
      mood: selectedEntry.mood,
      anxiety: selectedEntry.anxiety,
      sleepQuality: selectedEntry.sleepQuality,
      energy: selectedEntry.energy,
      gratitude: selectedEntry.gratitude,
      whatHelped: selectedEntry.whatHelped,
      whatWasDifficult: selectedEntry.whatWasDifficult,
      intentionForTomorrow: selectedEntry.intentionForTomorrow,
    });
  }, [selectedDate, selectedEntry]);

  const handleSave = () => {
    const entry = {
      id: selectedEntry?.id ?? Date.now().toString(),
      date: selectedDate,
      createdAt: selectedEntry?.createdAt ?? (selectedEntry ? undefined : today),
      ...form,
    };
    if (selectedEntry) {
      setEmotions(emotions.map(e => e.date === selectedDate ? entry : e));
    } else {
      setEmotions([entry, ...emotions]);
    }
    setIsFormOpen(false);
    setSavedMessage(
      !selectedEntry && isPastDate
        ? "Ton entrée a été enregistrée et marquée comme ajoutée après coup."
        : "Ton entrée a bien été enregistrée et synchronisée."
    );
  };

  const openEntryFromHistory = (date: string) => {
    setSelectedDate(date);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Journal émotionnel</h1>
        <p className="text-muted-foreground">Consulte, complète ou corrige une entrée à la date concernée.</p>
      </header>

      <Card className={selectedEntry && !isFormOpen ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsFormOpen(v => !v)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {selectedEntry ? "Entrée sélectionnée" : "Nouvelle entrée émotionnelle"}
              </CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {format(new Date(`${selectedDate}T00:00:00`), "EEEE d MMMM yyyy", { locale: fr })}
              </p>
            </div>
            {isFormOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
          {selectedEntry && !isFormOpen && (
            <p className="text-sm text-muted-foreground mt-1">
              Humeur : {selectedEntry.mood}/10 · Anxiété : {selectedEntry.anxiety}/10 · Énergie : {selectedEntry.energy}/10
            </p>
          )}
        </CardHeader>

        {isFormOpen && (
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Date concernée</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  data-testid="input-emotion-date"
                />
                {showRetrospectiveTag && (
                  <Badge variant="secondary" className="shrink-0">
                    Ajouté après coup
                  </Badge>
                )}
              </div>
            </div>
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
              {selectedEntry ? "Mettre à jour l'entrée" : "Enregistrer l'entrée"}
            </Button>
            {savedMessage && <p className="text-sm text-primary text-center">{savedMessage}</p>}
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium capitalize">{format(new Date(`${entry.date}T00:00:00`), "EEEE d MMMM", { locale: fr })}</p>
                        {entry.createdAt && entry.createdAt > entry.date && (
                          <Badge variant="secondary">Ajouté après coup</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                        <span>Humeur {entry.mood}/10</span>
                        <span>Énergie {entry.energy}/10</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                      onClick={() => openEntryFromHistory(entry.date)}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Humeur {entry.mood}/10</span>
                    <span className="flex items-center gap-1"><Moon className="h-3.5 w-3.5" /> Sommeil {entry.sleepQuality}/10</span>
                    <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> Énergie {entry.energy}/10</span>
                    <span>Anxiété {entry.anxiety}/10</span>
                  </div>
                  {entry.gratitude && <HistoryText icon={Sparkles} label="Gratitude" text={entry.gratitude} />}
                  {entry.whatHelped && <HistoryText label="Ce qui m'a aidé" text={entry.whatHelped} />}
                  {entry.whatWasDifficult && <HistoryText label="Ce qui a été difficile" text={entry.whatWasDifficult} />}
                  {entry.intentionForTomorrow && <HistoryText label="Intention pour demain" text={entry.intentionForTomorrow} />}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}

function HistoryText({ label, text, icon: Icon }: { label: string; text: string; icon?: typeof Sparkles }) {
  return (
    <div className="rounded-md bg-muted/40 p-3">
      <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </p>
      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
