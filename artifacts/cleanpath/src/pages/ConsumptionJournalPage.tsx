import { useState } from "react";
import { useAppStore, ConsumptionEntry } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Star, Trash2 } from "lucide-react";

const CONTEXTS = ["Seul(e)", "Avec des amis", "Stress", "Fête", "Ennui", "Conflit", "Fatigue", "Autre"];
const EMOTIONS = ["Anxieux/se", "Déprimé(e)", "En colère", "Frustré(e)", "Heureux/se", "Calme", "Excité(e)", "Fatigué(e)", "Seul(e)", "Nostalgique", "Autre"];
const TRIGGERS = ["Stress au travail", "Problème relationnel", "Ennui", "Pression sociale", "Douleur physique", "Mauvaises nouvelles", "Habitude", "Autre"];

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  time: new Date().toTimeString().slice(0, 5),
  substance: "",
  quantity: "",
  context: "",
  emotionBefore: "",
  emotionAfter: "",
  trigger: "",
  cravingLevel: 5,
  note: "",
  type: "consommation" as const,
};

export default function ConsumptionJournalPage() {
  const { consumptions, setConsumptions } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [relapseMessage, setRelapseMessage] = useState<string | null>(null);

  const openNew = (type: "consommation" | "envie_seulement") => {
    setForm({ ...emptyForm, type, date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5) });
    setOpen(true);
  };

  const handleSave = () => {
    const entry: ConsumptionEntry = {
      id: Date.now().toString(),
      ...form,
    };
    setConsumptions([entry, ...consumptions]);
    setOpen(false);
    if (form.type === "consommation") {
      setRelapseMessage("Une rechute ne détruit pas ton chemin. Elle donne une information. Que peux-tu apprendre de ce moment ?");
    }
  };

  const handleDelete = (id: string) => {
    setConsumptions(consumptions.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Journal de consommation</h1>
        <p className="text-muted-foreground">Comprendre tes habitudes sans jugement.</p>
      </header>

      {relapseMessage && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5 space-y-3">
            <p className="text-foreground italic">"{relapseMessage}"</p>
            <Button variant="outline" size="sm" onClick={() => setRelapseMessage(null)}>Fermer</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 text-sm border-destructive/30 text-destructive hover:bg-destructive/5"
          onClick={() => openNew("consommation")}
          data-testid="button-new-consumption"
        >
          <Plus className="h-4 w-4" />
          J'ai consommé
        </Button>
        <Button
          variant="outline"
          className="h-16 flex-col gap-1 text-sm border-primary/30 text-primary hover:bg-primary/5"
          onClick={() => openNew("envie_seulement")}
          data-testid="button-new-craving-only"
        >
          <Star className="h-4 w-4" />
          Envie seulement
        </Button>
      </div>

      <div className="space-y-4">
        {consumptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Aucune entrée pour le moment.</p>
              <p className="text-sm mt-2">Chaque entrée, qu'elle soit difficile ou victorieuse, est précieuse.</p>
            </CardContent>
          </Card>
        ) : (
          consumptions
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
            .map(entry => (
              <Card key={entry.id} className={entry.type === "envie_seulement" ? "border-primary/30 bg-primary/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {entry.type === "envie_seulement" && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Victoire</span>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), "d MMMM", { locale: fr })} à {entry.time}
                        </p>
                      </div>
                      {entry.type === "consommation" && (
                        <p className="font-medium">{entry.substance} {entry.quantity && `— ${entry.quantity}`}</p>
                      )}
                      {entry.type === "envie_seulement" && (
                        <p className="font-medium">J'ai eu envie mais je n'ai pas consommé</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {entry.context && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.context}</span>}
                        {entry.trigger && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.trigger}</span>}
                        {entry.cravingLevel && <span className="text-xs text-muted-foreground">Envie: {entry.cravingLevel}/10</span>}
                      </div>
                      {entry.note && <p className="text-sm text-muted-foreground italic mt-1">"{entry.note}"</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(entry.id)}
                      data-testid={`button-delete-entry-${entry.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.type === "consommation" ? "Nouvelle entrée de consommation" : "Victoire invisible"}
            </DialogTitle>
          </DialogHeader>

          {form.type === "consommation" && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground italic">
              Tu es ici pour apprendre, pas pour te juger. Cette entrée t'appartient.
            </div>
          )}
          {form.type === "envie_seulement" && (
            <div className="p-3 rounded-lg bg-primary/10 text-sm text-primary italic">
              Félicitations — résister à une envie est une vraie victoire, même si elle est invisible.
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Heure</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>

            {form.type === "consommation" && (
              <>
                <div className="space-y-1">
                  <Label>Substance</Label>
                  <Input placeholder="Alcool, cannabis, tabac..." value={form.substance} onChange={e => setForm(f => ({ ...f, substance: e.target.value }))} data-testid="input-substance" />
                </div>
                <div className="space-y-1">
                  <Label>Quantité approximative</Label>
                  <Input placeholder="2 verres, 1 joint..." value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Contexte</Label>
              <Select value={form.context} onValueChange={v => setForm(f => ({ ...f, context: v }))}>
                <SelectTrigger><SelectValue placeholder="Dans quelle situation ?" /></SelectTrigger>
                <SelectContent>
                  {CONTEXTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Émotion avant</Label>
                <Select value={form.emotionBefore} onValueChange={v => setForm(f => ({ ...f, emotionBefore: v }))}>
                  <SelectTrigger><SelectValue placeholder="Avant" /></SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Émotion après</Label>
                <Select value={form.emotionAfter} onValueChange={v => setForm(f => ({ ...f, emotionAfter: v }))}>
                  <SelectTrigger><SelectValue placeholder="Après" /></SelectTrigger>
                  <SelectContent>
                    {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Déclencheur principal</Label>
              <Select value={form.trigger} onValueChange={v => setForm(f => ({ ...f, trigger: v }))}>
                <SelectTrigger><SelectValue placeholder="Ce qui a déclenché..." /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Niveau d'envie</Label>
                <span className="text-sm font-semibold text-primary">{form.cravingLevel}/10</span>
              </div>
              <Slider min={1} max={10} step={1} value={[form.cravingLevel]} onValueChange={([v]) => setForm(f => ({ ...f, cravingLevel: v }))} />
            </div>

            <div className="space-y-1">
              <Label>Commentaire libre</Label>
              <Textarea placeholder="Ce que tu veux noter..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="min-h-[80px]" data-testid="textarea-consumption-note" />
            </div>

            <Button className="w-full" onClick={handleSave} data-testid="button-save-consumption">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
