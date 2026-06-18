import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";
import { useVault } from "@/store/VaultContext";
import { destroyVault } from "@/store/vault";
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
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const { settings, setSettings, prefix } = useAppStore();
  const { currentUser, user, logout } = useUser();
  const { vaultPresent, enableVault, disableVault, vaultData } = useVault();
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);

  useEffect(() => {
    document.title = settings.discreteMode ? "Journal" : "CleanPath";
  }, [settings.discreteMode]);

  const handleSavePin = async () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError("Le code PIN doit être composé de 4 chiffres.");
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError("Les codes PIN ne correspondent pas.");
      return;
    }
    setPinBusy(true);
    try {
      await enableVault(pinInput);
      setPinInput("");
      setPinConfirm("");
      setPinError("");
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 3000);
    } finally {
      setPinBusy(false);
    }
  };

  const handleRemovePin = () => {
    disableVault();
    setPinInput("");
    setPinConfirm("");
    setPinSaved(false);
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    const suffixes = ["_sessions", "_dayEntries", "_consumptions", "_emotions", "_cravings", "_safetyPlan", "_contacts", "_goals"];

    if (vaultPresent && vaultData) {
      suffixes.forEach(s => { data[`${prefix}${s}`] = vaultData[`${prefix}${s}`] ?? null; });
    } else {
      suffixes.forEach(s => {
        const key = `${prefix}${s}`;
        try { data[key] = JSON.parse(localStorage.getItem(key) || "null"); } catch { data[key] = null; }
      });
    }

    try {
      const raw = localStorage.getItem(`${prefix}_settings`);
      data[`${prefix}_settings`] = raw ? JSON.parse(raw) : null;
    } catch {
      data[`${prefix}_settings`] = null;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleanpath-${currentUser?.toLowerCase() ?? "export"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-medium text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Personnalise ton expérience.</p>
      </header>

      {/* Profil actif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mon profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-medium text-lg">
                {currentUser?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{currentUser}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => void logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>

      {/* Confidentialité */}
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
            {vaultPresent ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Un code PIN est actif. Les données du journal sont chiffrées sur cet appareil.</p>
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
                {pinSaved && <p className="text-sm text-primary">Code PIN enregistré. Données chiffrées avec succès.</p>}
                <Button size="sm" onClick={handleSavePin} disabled={pinBusy} data-testid="button-save-pin">
                  {pinBusy ? "Chiffrement…" : "Enregistrer le PIN"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Économies */}
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

      {/* Données */}
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

        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        CleanPath synchronise les données de ton compte avec le serveur sécurisé de l'application.
      </p>
    </div>
  );
}
