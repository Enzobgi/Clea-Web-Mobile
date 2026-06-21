import { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/store/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, LockKeyhole } from "lucide-react";

export function WelcomeScreen() {
  const { login, register } = useUser();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(displayName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de continuer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-7"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-md bg-primary/10">
            <LockKeyhole className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-light text-foreground">CleanPath</h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Retrouve ton espace personnel." : "Crée ton espace confidentiel."}
          </p>
        </div>

        <div className="grid grid-cols-2 border border-border rounded-md p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`h-9 text-sm font-medium rounded-sm transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`h-9 text-sm font-medium rounded-sm transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Inscription
          </button>
        </div>

        <div className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Prénom</Label>
              <Input
                id="account-name"
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                autoComplete="given-name"
                placeholder="Ton prénom"
                data-testid="input-register-name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="toi@exemple.com"
              data-testid="input-auth-email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-password">Mot de passe</Label>
            <Input
              id="account-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              onKeyDown={event => event.key === "Enter" && void submit()}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "register" ? "10 caractères minimum" : "Ton mot de passe"}
              data-testid="input-auth-password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full h-11"
            onClick={() => void submit()}
            disabled={busy || !email.trim() || password.length < (mode === "register" ? 10 : 1) || (mode === "register" && displayName.trim().length < 2)}
            data-testid="button-auth-submit"
          >
            {busy ? "Un instant..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <a
            href="/demo"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
            data-testid="link-demo"
          >
            <Eye className="h-4 w-4" />
            Consulter la démo
          </a>
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Tes données sont associées à ton compte et transmises via une connexion sécurisée.
        </p>
      </motion.div>
    </div>
  );
}
