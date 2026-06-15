import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { settings, setSettings } = useAppStore();
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    document.title = settings.discreteMode ? "Journal" : "CleanPath";
  }, [settings.discreteMode]);

  const handleSavePin = () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError("Le code PIN doit être composé de 4 chiffres.");
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError("Les codes PIN ne correspondent pas.");
      return;
    }
    setSettings({ ...settings, pin: pinInput });
    setPinInput("");
    setPinConfirm("");
    setPinError("");
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 3000);
  };

  const handleRemovePin = () => {
    setSettings({ ...settings, pin: null });
    setPinInput("");
    setPinConfirm("");
    setPinSaved(false);
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    const keys = [
      "cleanpath_sessions", "cleanpath_dayEntries", "cleanpath_consumptions",
      "cleanpath_emotions", "cleanpath_cravings", "cleanpath_safetyPlan",
      "cleanpath_contacts", "cleanpath_goals", "cleanpath_settings"
    ];
    keys.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || "null"); } catch { data[k] = null; }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleanpath-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    const keys = [
      "cleanpath_sessions", "cleanpath_dayEntries", "cleanpath_consumptions",
      "cleanpath_emotions", "cleanpath_cravings", "cleanpath_safetyPlan",
      "cleanpath_contacts", "cleanpath_goals", "cleanpath_settings"
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Personnalise ton expérience.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confidentialité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mode discret</Label>
              <p className="text-sm text-muted-foreground">Change le titre de l'onglet en "Journal"</p>
            </div>
            <Switch
              checked={settings.discreteMode}
              onCheckedChange={c => setSettings({ ...settings, discreteMode: c })}
              data-testid="switch-discrete-mode"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="text-base">Code PIN</Label>
            {settings.pin ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Un code PIN est actif. L'application le demande à l'ouverture.</p>
                <Button variant="outline" size="sm" onClick={handleRemovePin} data-testid="button-remove-pin">
                  Supprimer le code PIN
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Nouveau PIN (4 chiffres)</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-32"
                    data-testid="input-pin"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Confirmer le PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••"
                    className="w-32"
                    data-testid="input-pin-confirm"
                  />
                </div>
                {pinError && <p className="text-sm text-destructive">{pinError}</p>}
                {pinSaved && <p className="text-sm text-primary">Code PIN enregistré avec succès.</p>}
                <Button size="sm" onClick={handleSavePin} data-testid="button-save-pin">
                  Enregistrer le PIN
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Économies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Coût moyen par jour (€)</Label>
            <Input
              type="number"
              min={0}
              value={settings.costPerDay}
              onChange={e => setSettings({ ...settings, costPerDay: Number(e.target.value) || 0 })}
              className="w-32"
              data-testid="input-cost-per-day"
            />
            <p className="text-xs text-muted-foreground">Utilisé pour estimer tes économies sur le tableau de bord.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleExport} data-testid="button-export-data">
            Exporter mes données (JSON)
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Partage ce fichier avec ton thérapeute ou addictologue si tu le souhaites.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" data-testid="button-reset-data">
                Effacer toutes mes données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer toutes les données ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement toutes tes entrées, ton journal, ton historique et tes paramètres. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Effacer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        CleanPath stocke toutes tes données localement sur ton appareil. Rien n'est transmis à un serveur.
      </p>
    </div>
  );
}
