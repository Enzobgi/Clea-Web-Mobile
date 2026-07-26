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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, HeartHandshake, Pencil, Phone, Plus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { upsertDayEntriesForDates } from "@/lib/abstinence";

const CONTEXTS = ["Seul(e)", "Avec des amis", "Stress", "Fête", "Ennui", "Conflit", "Fatigue", "Autre"];
const EMOTIONS = ["Anxieux/se", "Déprimé(e)", "En colère", "Frustré(e)", "Heureux/se", "Calme", "Excité(e)", "Fatigué(e)", "Seul(e)", "Nostalgique", "Autre"];
const TRIGGERS = ["Stress au travail", "Problème relationnel", "Ennui", "Pression sociale", "Douleur physique", "Mauvaises nouvelles", "Habitude", "Autre"];
const PEOPLE = ["Seul(e)", "Avec une personne de confiance", "Avec des amis", "Avec des collègues", "Avec des personnes qui consommaient", "Autre"];
const STRATEGIES = ["Aucune", "Respiration", "Changer de lieu", "Appeler quelqu'un", "Marcher", "Boire de l'eau", "Retarder de 10 minutes", "Autre"];

type ConsumptionForm = Omit<ConsumptionEntry, "id">;

const nowDate = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

const makeEmptyForm = (type: ConsumptionEntry["type"]): ConsumptionForm => ({
  date: nowDate(),
  time: nowTime(),
  createdAt: new Date().toISOString(),
  substance: "",
  substanceId: "",
  unit: "",
  quantity: "",
  context: "",
  emotionBefore: "",
  emotionAfter: "",
  trigger: "",
  cravingLevel: 5,
  cravingBefore: 5,
  cravingAfter: 5,
  peoplePresent: "",
  strategyTried: "",
  cost: "",
  note: "",
  type,
});

export default function ConsumptionJournalPage() {
  const {
    consumptions,
    setConsumptions,
    dayEntries,
    setDayEntries,
    substanceTrackings,
    safetyPlan,
    contacts,
    plannedCheckIns,
    setPlannedCheckIns,
  } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ConsumptionForm>(() => makeEmptyForm("consommation"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [supportEntry, setSupportEntry] = useState<ConsumptionEntry | null>(null);
  const [safeNow, setSafeNow] = useState<boolean | null>(null);
  const [worryingSymptoms, setWorryingSymptoms] = useState(false);
  const [checkInPlanned, setCheckInPlanned] = useState(false);
  const [substanceFilter, setSubstanceFilter] = useState("all");

  const openNew = (type: "consommation" | "envie_seulement") => {
    setEditingId(null);
    setForm(makeEmptyForm(type));
    setOpen(true);
  };

  const openEdit = (entry: ConsumptionEntry) => {
    setEditingId(entry.id);
    setForm({
      ...makeEmptyForm(entry.type),
      ...entry,
      substanceId: entry.substanceId ?? "",
      unit: entry.unit ?? "",
      cravingBefore: entry.cravingBefore ?? entry.cravingLevel ?? 5,
      cravingAfter: entry.cravingAfter ?? entry.cravingLevel ?? 5,
      peoplePresent: entry.peoplePresent ?? "",
      strategyTried: entry.strategyTried ?? "",
      cost: entry.cost ?? "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    const entry: ConsumptionEntry = {
      id: editingId ?? Date.now().toString(),
      ...form,
      createdAt: form.createdAt ?? new Date().toISOString(),
      substance: selectedSubstance?.name ?? form.substance,
      unit: selectedSubstance?.unit ?? form.unit,
      cravingLevel: form.cravingBefore ?? form.cravingLevel,
    };
    const nextConsumptions = editingId
      ? consumptions.map(item => item.id === editingId ? entry : item)
      : [entry, ...consumptions];
    setConsumptions(nextConsumptions);
    syncDayStatus(nextConsumptions, form.date);
    setOpen(false);
    setEditingId(null);
    if (form.type === "consommation" && !editingId) setSupportEntry(entry);
  };

  const handleDelete = (id: string) => {
    const deletedEntry = consumptions.find(c => c.id === id);
    const remainingConsumptions = consumptions.filter(c => c.id !== id);
    setConsumptions(remainingConsumptions);
    if (deletedEntry) syncDayStatus(remainingConsumptions, deletedEntry.date);
  };

  const selectedSubstance = substanceTrackings.find(substance => substance.id === form.substanceId);
  const activeSubstances = substanceTrackings.filter(substance => !substance.archivedAt);
  const filteredConsumptions = consumptions.filter(entry => {
    if (substanceFilter === "all") return true;
    if (substanceFilter === "manual") return !entry.substanceId;
    return entry.substanceId === substanceFilter
      || substanceTrackings.find(substance => substance.id === substanceFilter)?.name.toLowerCase() === entry.substance.toLowerCase();
  });
  const filteredConsumptionEvents = filteredConsumptions.filter(entry => entry.type === "consommation");
  const filteredCravings = filteredConsumptions.filter(entry => entry.type === "envie_seulement");
  const filteredQuantity = filteredConsumptionEvents.reduce((sum, entry) => {
    const value = Number.parseFloat(String(entry.quantity).replace(",", "."));
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  const syncDayStatus = (entries: ConsumptionEntry[], date: string) => {
    const sameDateHasConsumption = entries.some(entry => entry.date === date && entry.type === "consommation");
    const sameDateHasCraving = entries.some(entry => entry.date === date && entry.type === "envie_seulement");
    setDayEntries(upsertDayEntriesForDates(
      dayEntries,
      [date],
      sameDateHasConsumption ? "consommation" : sameDateHasCraving ? "envie_forte" : "non_renseigne",
    ));
  };

  const planTomorrowCheckIn = () => {
    if (!supportEntry || checkInPlanned) return;
    const date = new Date(`${supportEntry.date}T12:00:00`);
    date.setDate(date.getDate() + 1);
    setPlannedCheckIns([
      ...plannedCheckIns,
      {
        id: Date.now().toString(),
        date: date.toISOString().slice(0, 10),
        sourceConsumptionId: supportEntry.id,
        completedAt: null,
      },
    ]);
    setCheckInPlanned(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Journal de consommation</h1>
        <p className="text-muted-foreground">Comprendre tes habitudes sans jugement.</p>
      </header>

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

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Filtrer par produit</Label>
            <Select value={substanceFilter} onValueChange={setSubstanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les produits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                {activeSubstances.map(substance => (
                  <SelectItem key={substance.id} value={substance.id}>{substance.name}</SelectItem>
                ))}
                <SelectItem value="manual">Saisies libres non rattachées</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <FilterMetric label="Consommations" value={String(filteredConsumptionEvents.length)} />
            <FilterMetric label="Envies surmontées" value={String(filteredCravings.length)} />
            <FilterMetric label="Quantité" value={filteredQuantity > 0 ? formatQuantity(filteredQuantity) : "—"} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredConsumptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Aucune entrée pour ce filtre.</p>
              <p className="text-sm mt-2">Tu peux changer de produit ou ajouter une nouvelle entrée.</p>
            </CardContent>
          </Card>
        ) : (
          filteredConsumptions
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
                        {entry.createdAt && entry.createdAt.slice(0, 10) > entry.date && (
                          <Badge variant="secondary">Saisi après coup</Badge>
                        )}
                      </div>
                      {entry.type === "consommation" && (
                        <p className="font-medium">
                          {entry.substance || "Substance non précisée"} {entry.quantity && `— ${entry.quantity}${entry.unit ? ` ${entry.unit}` : ""}`}
                        </p>
                      )}
                      {entry.type === "envie_seulement" && (
                        <p className="font-medium">J'ai eu envie mais je n'ai pas consommé</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {entry.context && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.context}</span>}
                        {entry.trigger && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.trigger}</span>}
                        {entry.strategyTried && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.strategyTried}</span>}
                        {entry.peoplePresent && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{entry.peoplePresent}</span>}
                        {entry.cravingBefore && <span className="text-xs text-muted-foreground">Envie avant: {entry.cravingBefore}/10</span>}
                        {entry.cravingAfter && <span className="text-xs text-muted-foreground">après: {entry.cravingAfter}/10</span>}
                        {entry.cost && <span className="text-xs text-muted-foreground">Coût: {entry.cost} €</span>}
                      </div>
                      {entry.note && <p className="text-sm text-muted-foreground italic mt-1">"{entry.note}"</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => openEdit(entry)} data-testid={`button-edit-entry-${entry.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                        data-testid={`button-delete-entry-${entry.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
              {editingId ? "Modifier l'entrée" : form.type === "consommation" ? "Nouvelle entrée de consommation" : "Victoire invisible"}
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
                {activeSubstances.length > 0 && (
                  <div className="space-y-1">
                    <Label>Suivi concerné</Label>
                    <Select
                      value={form.substanceId || "manual"}
                      onValueChange={v => {
                        const substance = substanceTrackings.find(item => item.id === v);
                        setForm(f => ({
                          ...f,
                          substanceId: v === "manual" ? "" : v,
                          substance: substance?.name ?? f.substance,
                          unit: substance?.unit ?? f.unit,
                        }));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir un suivi" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Saisie libre</SelectItem>
                        {activeSubstances.map(substance => (
                          <SelectItem key={substance.id} value={substance.id}>{substance.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Substance</Label>
                  <Input placeholder="Alcool, cannabis, tabac..." value={form.substance} onChange={e => setForm(f => ({ ...f, substance: e.target.value }))} data-testid="input-substance" />
                </div>
                <div className="grid grid-cols-[1fr_0.8fr] gap-3">
                  <div className="space-y-1">
                    <Label>Quantité</Label>
                    <Input placeholder="2" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Unité</Label>
                    <Input placeholder="verre, g, session..." value={form.unit ?? ""} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                  </div>
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
                <Label>Envie avant</Label>
                <span className="text-sm font-semibold text-primary">{form.cravingBefore ?? form.cravingLevel}/10</span>
              </div>
              <Slider min={1} max={10} step={1} value={[form.cravingBefore ?? form.cravingLevel]} onValueChange={([v]) => setForm(f => ({ ...f, cravingBefore: v, cravingLevel: v }))} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Envie après</Label>
                <span className="text-sm font-semibold text-primary">{form.cravingAfter ?? form.cravingLevel}/10</span>
              </div>
              <Slider min={1} max={10} step={1} value={[form.cravingAfter ?? form.cravingLevel]} onValueChange={([v]) => setForm(f => ({ ...f, cravingAfter: v }))} />
            </div>

            <div className="space-y-1">
              <Label>Présence d'autres personnes</Label>
              <Select value={form.peoplePresent} onValueChange={v => setForm(f => ({ ...f, peoplePresent: v }))}>
                <SelectTrigger><SelectValue placeholder="Qui était présent ?" /></SelectTrigger>
                <SelectContent>
                  {PEOPLE.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Stratégie essayée</Label>
              <Select value={form.strategyTried} onValueChange={v => setForm(f => ({ ...f, strategyTried: v }))}>
                <SelectTrigger><SelectValue placeholder="Ce que tu as essayé" /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {form.type === "consommation" && (
              <div className="space-y-1">
                <Label>Coût facultatif</Label>
                <Input type="number" min={0} step="0.01" inputMode="decimal" placeholder="0" value={form.cost ?? ""} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
            )}

            <div className="flex items-start gap-3 rounded-md bg-muted/35 p-3">
              <Checkbox
                id="retrospective-entry"
                checked={(form.createdAt ?? "").slice(0, 10) > form.date}
                disabled
              />
              <div className="space-y-0.5">
                <Label htmlFor="retrospective-entry">Saisie rétroactive détectée</Label>
                <p className="text-xs text-muted-foreground">Si la date concernée est passée, l'entrée garde sa date réelle et sa date de création.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Commentaire libre</Label>
              <Textarea placeholder="Ce que tu veux noter..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="min-h-[80px]" data-testid="textarea-consumption-note" />
            </div>

            <Button className="w-full" onClick={handleSave} data-testid="button-save-consumption">
              {editingId ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!supportEntry} onOpenChange={openState => !openState && setSupportEntry(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Après une consommation</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-md bg-primary/5 p-3 text-sm text-muted-foreground">
              Un événement ponctuel ne signifie pas que tout le parcours est abandonné. Le calendrier l'indique clairement, et les compteurs restent explicables.
            </div>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium"><ShieldAlert className="h-4 w-4 text-destructive" /> Sécurité immédiate</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={safeNow === true ? "default" : "outline"} onClick={() => setSafeNow(true)}>Je suis en sécurité</Button>
                <Button variant={safeNow === false ? "destructive" : "outline"} onClick={() => setSafeNow(false)}>Je ne suis pas sûr(e)</Button>
              </div>
              <label className="flex items-start gap-3 rounded-md bg-muted/35 p-3 text-sm">
                <Checkbox checked={worryingSymptoms} onCheckedChange={checked => setWorryingSymptoms(checked === true)} />
                Symptômes inquiétants ou quantité possiblement dangereuse
              </label>
              {(safeNow === false || worryingSymptoms) && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  En cas de danger immédiat, de symptômes graves ou d'impossibilité de rester en sécurité, appelle le 112 et ne reste pas seul(e).
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium"><HeartHandshake className="h-4 w-4 text-primary" /> Tes repères</h3>
              <div className="grid gap-3 text-sm">
                <SupportBlock label="Raisons personnelles" text={safetyPlan.reasons || "À compléter dans le plan de protection."} />
                <SupportBlock label="Stratégies enregistrées" text={safetyPlan.strategies || "À compléter dans le plan de protection."} />
                <SupportBlock label="Phrase utile" text={safetyPlan.helpfulPhrases || "Cette envie va passer."} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4 text-primary" /> Cercle de confiance</h3>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ajoute un contact de confiance pour le retrouver ici. CleanPath n'envoie jamais de message automatiquement.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.slice(0, 3).map(contact => (
                    <div key={contact.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-muted-foreground">{contact.relationship} · {contact.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium"><CalendarCheck className="h-4 w-4 text-primary" /> Prochaine petite action</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {["Boire de l'eau", "Changer de lieu", "Respirer 2 minutes", "Prévenir quelqu'un"].map(action => (
                  <div key={action} className="rounded-md bg-muted/35 p-3 text-sm">{action}</div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={planTomorrowCheckIn} disabled={checkInPlanned}>
                {checkInPlanned ? "Check-in de demain planifié" : "Planifier un check-in demain"}
              </Button>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md bg-muted/35 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function FilterMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function formatQuantity(value: number) {
  return value.toFixed(value % 1 === 0 ? 0 : 1).replace(".", ",");
}
