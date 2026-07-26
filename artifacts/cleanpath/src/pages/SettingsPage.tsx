import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useUser } from "@/store/UserContext";
import { useVault } from "@/store/VaultContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  buildTherapeuticExportHtml,
  defaultTherapeuticSections,
  type ExportPeriodPreset,
  type TherapeuticExportSections,
} from "@/lib/therapeuticExport";
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
import { Database, LogOut, MonitorSmartphone } from "lucide-react";

interface AccountSession {
  id: string;
  userAgent: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export default function SettingsPage() {
  const store = useAppStore();
  const {
    settings,
    setSettings,
    prefix,
    chatMemory,
    setChatMemory,
    substanceTrackings,
    consumptions,
    setConsumptions,
    dayEntries,
    setDayEntries,
    emotions,
    setEmotions,
    safetyPlan,
    setGratitudes,
    setCravings,
    remoteSyncStatus,
    lastRemoteSyncAt,
  } = store;
  const { currentUser, user, logout } = useUser();
  const { vaultPresent, enableVault, disableVault, vaultData } = useVault();
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<ExportPeriodPreset>("30");
  const [customStart, setCustomStart] = useState(new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));
  const [exportSections, setExportSections] = useState<TherapeuticExportSections>(defaultTherapeuticSections);
  const [personalSummary, setPersonalSummary] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [sessionsMessage, setSessionsMessage] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  useEffect(() => {
    document.title = settings.discreteMode ? "Journal" : "CleanPath";
  }, [settings.discreteMode]);

  useEffect(() => {
    fetch("/api/auth/sessions", { credentials: "include" })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((body: { sessions?: AccountSession[] }) => setSessions(body.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

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
    const suffixes = ["_sessions", "_dayEntries", "_consumptions", "_substanceTrackings", "_plannedCheckIns", "_careAppointments", "_emotions", "_gratitudes", "_cravings", "_safetyPlan", "_contacts", "_goals", "_profile", "_weeklyGoals", "_programProgress", "_chatMemory"];

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

  const exportHtml = buildTherapeuticExportHtml({
    period: exportPeriod,
    customStart,
    customEnd,
    sections: exportSections,
    personalSummary,
    appointmentNotes,
    substances: substanceTrackings,
    consumptions,
    dayEntries,
    emotions,
    safetyPlan,
  });

  const openPdfWindow = () => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(exportHtml);
    win.document.close();
  };

  const logoutOtherDevices = async () => {
    setSessionsMessage("");
    const response = await fetch("/api/auth/logout-all", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      setSessionsMessage("Impossible de déconnecter les autres appareils pour le moment.");
      return;
    }
    setSessions(sessions.filter(session => session.current));
    setSessionsMessage("Les autres sessions ont été déconnectées.");
  };

  const deleteAccount = async () => {
    const response = await fetch("/api/auth/account", {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      window.location.href = "/";
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
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
          <CardTitle className="text-lg">Confidentialité et données</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-muted/35 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Database className="h-4 w-4 text-primary" />
              Données enregistrées
            </div>
            <p className="mt-2">
              Journaux, calendrier, suivis par produit, plan de protection, contacts de confiance, objectifs, préférences et mémoire du chat si elle est activée.
            </p>
            <p className="mt-2">
              État de synchronisation : <strong className="text-foreground">{syncLabel(remoteSyncStatus)}</strong>
              {lastRemoteSyncAt && ` · dernière réussite le ${new Date(lastRemoteSyncAt).toLocaleString("fr-BE")}`}.
            </p>
            {remoteSyncStatus === "offline" && (
              <p className="mt-2 text-primary">Les données restent disponibles sur cet appareil et seront renvoyées au retour de la connexion.</p>
            )}
            {remoteSyncStatus === "error" && (
              <p className="mt-2 text-destructive">La dernière sauvegarde serveur n'a pas abouti. La copie locale est conservée.</p>
            )}
          </div>

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

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="space-y-0.5">
              <Label>Mémoire du chat</Label>
              <p className="text-sm text-muted-foreground">Autorise uniquement les informations que tu choisis d'enregistrer.</p>
            </div>
            <Switch
              checked={settings.chatMemoryEnabled}
              onCheckedChange={chatMemoryEnabled => setSettings({ ...settings, chatMemoryEnabled })}
            />
          </div>
          {chatMemory.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setChatMemory([])}>
              Supprimer la mémoire du chat
            </Button>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="space-y-0.5">
              <Label>Statistiques dans le chat</Label>
              <p className="text-sm text-muted-foreground">
                Autorise Gemini à utiliser un résumé chiffré, sans envoyer tes notes, gratitudes ou entrées complètes.
              </p>
            </div>
            <Switch
              checked={settings.chatStatsEnabled}
              onCheckedChange={chatStatsEnabled => setSettings({ ...settings, chatStatsEnabled })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions et appareils</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session distante récupérée pour le moment.</p>
          ) : sessions.map(session => (
            <div key={session.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/35 p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MonitorSmartphone className="h-4 w-4 text-primary" />
                  {session.current ? "Session actuelle" : "Autre session"}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{session.userAgent || "Appareil non identifié"}</p>
                <p className="text-xs text-muted-foreground">
                  Dernière activité : {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString("fr-BE") : "non renseignée"}
                </p>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => void logoutOtherDevices()}>
            Déconnecter les autres appareils
          </Button>
          {sessionsMessage && <p className="text-sm text-primary">{sessionsMessage}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications discrètes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Désactiver toutes les notifications</Label>
              <p className="text-sm text-muted-foreground">Aucun rappel ne sera affiché par CleanPath.</p>
            </div>
            <Switch
              checked={settings.allNotificationsDisabled ?? false}
              onCheckedChange={allNotificationsDisabled => setSettings({ ...settings, allNotificationsDisabled })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fréquence</Label>
            <Select
              value={settings.notificationFrequency ?? "quotidienne"}
              onValueChange={notificationFrequency => setSettings({ ...settings, notificationFrequency: notificationFrequency as typeof settings.notificationFrequency })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quotidienne">Rappel quotidien de check-in</SelectItem>
                <SelectItem value="jours_difficiles">Seulement périodes difficiles</SelectItem>
                <SelectItem value="rendez_vous">Seulement rendez-vous</SelectItem>
                <SelectItem value="manuelle">Manuel uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rappel check-in</Label>
              <Input type="time" value={settings.checkInReminderTime ?? "19:00"} onChange={event => setSettings({ ...settings, checkInReminderTime: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Avant période difficile</Label>
              <Input type="time" value={settings.difficultPeriodReminderTime ?? "17:30"} onChange={event => setSettings({ ...settings, difficultPeriodReminderTime: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Début heures silencieuses</Label>
              <Input type="time" value={settings.quietHoursStart ?? "22:00"} onChange={event => setSettings({ ...settings, quietHoursStart: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Fin heures silencieuses</Label>
              <Input type="time" value={settings.quietHoursEnd ?? "08:00"} onChange={event => setSettings({ ...settings, quietHoursEnd: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Rendez-vous</Label>
              <Input
                type="number"
                min={0}
                max={14}
                value={settings.appointmentReminderDaysBefore ?? 1}
                onChange={event => setSettings({ ...settings, appointmentReminderDaysBefore: Number(event.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Texte discret</Label>
            <Input
              value={settings.discreetNotificationText ?? ""}
              onChange={event => setSettings({ ...settings, discreetNotificationText: event.target.value })}
              placeholder="CleanPath: un petit point prévu."
            />
            <p className="text-xs text-muted-foreground">Par défaut, aucune notification ne mentionne explicitement la consommation sur l'écran verrouillé.</p>
          </div>
          <Button variant="outline" onClick={() => void requestNotificationPermission()} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"}>
            {notificationPermission === "granted" ? "Notifications système autorisées" : notificationPermission === "unsupported" ? "Notifications non disponibles" : "Autoriser les notifications système"}
          </Button>
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
          <Button variant="outline" className="w-full" onClick={() => setPdfOpen(true)} data-testid="button-export-pdf">
            Préparer un export thérapeutique (PDF)
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Partage ce fichier avec ton thérapeute ou addictologue si tu le souhaites.
          </p>
          <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Effacer journaux émotionnels</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Effacer les journaux émotionnels ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action supprime les entrées émotionnelles et gratitudes synchronisées pour ce compte.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setEmotions([]); setGratitudes([]); }}>Effacer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">Effacer consommations</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Effacer le journal de consommation ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action supprime les consommations, envies et statuts calendrier liés. Les suivis par produit restent archivables séparément.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setConsumptions([]); setCravings([]); setDayEntries([]); }}>Effacer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Suppression définitive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Supprime le compte, les sessions et les données synchronisées associées. Cette action ne doit être utilisée que si tu es sûr(e).
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">Supprimer définitivement mon compte</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement le compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprime le compte et les données serveur associées. Elle ne contacte personne et ne peut pas être annulée depuis l'application.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => void deleteAccount()}>Supprimer le compte</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        CleanPath synchronise les données de ton compte avec le serveur sécurisé de l'application.
      </p>

      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export thérapeutique</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Période</Label>
                <Select value={exportPeriod} onValueChange={value => setExportPeriod(value as ExportPeriodPreset)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="custom">Dates personnalisées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportPeriod === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Début</Label>
                    <Input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fin</Label>
                    <Input type="date" value={customEnd} onChange={event => setCustomEnd(event.target.value)} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Rubriques incluses</Label>
                {Object.entries(sectionLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded-md bg-muted/35 p-2 text-sm">
                    <Checkbox
                      checked={exportSections[key as keyof TherapeuticExportSections]}
                      onCheckedChange={checked => setExportSections({
                        ...exportSections,
                        [key]: checked === true,
                      })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Résumé personnel</Label>
                <Textarea value={personalSummary} onChange={event => setPersonalSummary(event.target.value)} placeholder="Ce que je veux retenir ou expliquer..." />
              </div>
              <div className="space-y-1.5">
                <Label>Notes pour le rendez-vous</Label>
                <Textarea value={appointmentNotes} onChange={event => setAppointmentNotes(event.target.value)} placeholder="Questions, points à aborder..." />
              </div>
              <Button className="w-full" onClick={openPdfWindow}>Ouvrir l'aperçu imprimable</Button>
            </div>
            <div className="rounded-md border border-border bg-white">
              <iframe
                title="Aperçu de l'export thérapeutique"
                srcDoc={exportHtml}
                className="h-[640px] w-full rounded-md"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const sectionLabels: Record<keyof TherapeuticExportSections, string> = {
  consumptions: "Évolution des consommations par substance",
  abstinentDays: "Jours sans consommation",
  cravings: "Envies surmontées",
  wellbeing: "Humeur, stress, sommeil et énergie",
  triggers: "Déclencheurs fréquents",
  strategies: "Stratégies les plus utiles",
  goals: "Objectifs",
  personalSummary: "Résumé personnel",
  appointmentNotes: "Notes préparatoires",
};

function syncLabel(status: string) {
  switch (status) {
    case "loading":
      return "chargement";
    case "pending":
      return "sauvegarde en attente";
    case "offline":
      return "hors ligne";
    case "error":
      return "erreur de synchronisation";
    case "synced":
      return "à jour";
    default:
      return "local";
  }
}
