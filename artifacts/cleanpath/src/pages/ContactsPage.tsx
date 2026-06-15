import { useState } from "react";
import { useAppStore, TrustedContact } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Plus, Trash2 } from "lucide-react";

const CRISIS_LINES = [
  { name: "Drogues Info Service", number: "0800231313", display: "0800 23 13 13", detail: "Appel anonyme et gratuit, 7j/7" },
  { name: "Alcool Info Service", number: "0980980930", display: "09 80 98 09 30", detail: "Appel non surtaxé" },
  { name: "Tabac Info Service", number: "3989", display: "39 89", detail: "Du lundi au samedi, 8h-20h" },
  { name: "SOS Amitié", number: "0972394050", display: "09 72 39 40 50", detail: "7j/7, 24h/24" },
  { name: "Urgences (SAMU / Pompiers)", number: "112", display: "112", detail: "En cas de danger immédiat" },
];

export default function ContactsPage() {
  const { contacts, setContacts } = useAppStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "" });

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    const contact: TrustedContact = { id: Date.now().toString(), ...form };
    setContacts([...contacts, contact]);
    setForm({ name: "", phone: "", relationship: "" });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-medium text-foreground">Contacts d'aide</h1>
          <p className="text-muted-foreground">Tu n'es pas seul(e).</p>
        </header>
        <Button size="icon" variant="outline" onClick={() => setOpen(true)} data-testid="button-add-contact">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Mes proches de confiance</h2>
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Aucun contact ajouté.</p>
              <p className="text-sm mt-1">Ajoute des personnes en qui tu as confiance.</p>
            </CardContent>
          </Card>
        ) : (
          contacts.map(contact => (
            <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={`tel:${contact.phone}`}>
                    <Button variant="secondary" size="icon" data-testid={`button-call-${contact.id}`}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(contact.id)}
                    data-testid={`button-delete-contact-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Lignes d'écoute professionnelles</h2>
        {CRISIS_LINES.map(line => (
          <Card key={line.name} className="bg-muted/30">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{line.name}</p>
                <p className="text-sm text-muted-foreground">{line.detail}</p>
              </div>
              <a href={`tel:${line.number}`} className="w-full sm:w-auto shrink-0">
                <Button className="w-full sm:w-auto gap-2" data-testid={`button-crisis-${line.number}`}>
                  <Phone className="h-4 w-4" />
                  {line.display}
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Cette application ne remplace pas un médecin, un psychologue ou un service d'urgence. En cas de danger immédiat, appelle le 112.
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un contact de confiance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Marie, Dr Dupont..." data-testid="input-contact-name" />
            </div>
            <div className="space-y-1">
              <Label>Téléphone</Label>
              <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="06 12 34 56 78" data-testid="input-contact-phone" />
            </div>
            <div className="space-y-1">
              <Label>Relation</Label>
              <Input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Ami(e), famille, thérapeute..." data-testid="input-contact-relationship" />
            </div>
            <Button className="w-full" onClick={handleSave} data-testid="button-save-contact">
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
